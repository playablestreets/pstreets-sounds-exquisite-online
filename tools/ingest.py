#!/usr/bin/env python3
"""Content-pipeline ingest for Exquisite Stories.

Scans the six Google Drive ``INBOX`` leaf folders, normalises each asset to the
site's formats (256x256 PNG images, mono MP3 audio) under
``public/assets/content/``, records an append-only ingest log, and then mirrors
every processed source from ``INBOX`` to the matching path under ``COMPLETE``
(or ``DROPPED`` when an asset can't be used).

The new preprocessing pipeline names files ``{group}_{slot}.{ext}`` where:

  - ``group`` is a stable monster/group key:
      ``pair-NNN``         -- has an image triple AND an audio triple
      ``nopair-image-NNN`` -- image triple only (orphaned image)
      ``nopair-audio-NNN`` -- audio triple only (orphaned audio)
  - ``slot`` is the source slot:
      images: ``top`` / ``middle`` / ``bottom``
      audio:  ``beginning`` / ``middle`` / ``end``  (-> site top/middle/bottom)

Orphaned assets are still valid COMPLETE content: an image without matching
audio (or vice-versa) is normalised and kept, never dropped just because its
counterpart is missing. The per-file ``pairingStatus`` recorded in the ingest
log lets later passes tell complete monster sets from image-only / audio-only
assets.

Images and audio stay as DECOUPLED pools per body part. The output filename is
the group key (``pair-001.png`` / ``pair-001.mp3``), so a coherent set shares a
stem across parts and across kinds -- which is what build_manifest.py and the
future gallery use to re-link them without re-ingesting.

Re-running is safe: outputs are deterministic by group key (so identical inputs
overwrite to the same bytes), and processed sources leave INBOX, so a second run
over a drained INBOX is a no-op.

Usage:
  python3 tools/ingest.py --dry-run        # scan + print plan, no downloads/moves
  python3 tools/ingest.py --limit 3        # process at most 3 sources per folder
  python3 tools/ingest.py                  # full ingest (moves Drive files!)

Prerequisites: python3, ffmpeg, ImageMagick (`magick` or `convert`), and an
rclone remote that resolves $DRIVE_ROOT.
"""
import argparse
import datetime
import json
import os
import shutil
import subprocess
import sys
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "assets" / "content"
LOG_PATH = OUT / "ingest-log.jsonl"

# Drive remote; the docs pin the folder-ID remote because the named shortcut is
# unreliable on Linux. Override with $DRIVE_ROOT for a different batch.
DRIVE_ROOT = os.environ.get(
    "DRIVE_ROOT", "gdrive,root_folder_id=<redacted-folder-id>:"
)

# (drive leaf folder, kind, site part). Audio beginning->top, middle->middle,
# end->bottom. COMPLETE and DROPPED mirror these same leaf names.
INBOX_FOLDERS = [
    ("IMAGES_TOP", "image", "top"),
    ("IMAGES_MIDDLE", "image", "middle"),
    ("IMAGES_BOTTOM", "image", "bottom"),
    ("AUDIO_BEGINNING", "audio", "top"),
    ("AUDIO_MIDDLE", "audio", "middle"),
    ("AUDIO_END", "audio", "bottom"),
]

# Valid source slot tokens per kind (the part after the final underscore).
VALID_SLOTS = {
    "image": {"top", "middle", "bottom"},
    "audio": {"beginning", "middle", "end"},
}
ALL_PARTS = {"top", "middle", "bottom"}

IMG_SIZE = 256
FFMPEG_AUDIO_ARGS = ["-ac", "1", "-ar", "44100", "-b:a", "80k", "-map_metadata", "-1"]

MAGICK = shutil.which("magick") or shutil.which("convert")


def utcnow():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def rclone(*args):
    return subprocess.run(
        ["rclone", *args], check=True, capture_output=True, text=True
    )


def lsjson(leaf):
    """List one INBOX leaf folder with sizes and md5 checksums."""
    out = rclone(
        "lsjson", f"{DRIVE_ROOT}/INBOX/{leaf}", "--hash", "--files-only"
    ).stdout
    return json.loads(out or "[]")


def parse_name(name, kind):
    """``pair-001_top.png`` -> (group, slot). Returns (None, None) if invalid."""
    stem = Path(name).stem
    if "_" not in stem:
        return None, None
    group, slot = stem.rsplit("_", 1)
    if not group or slot not in VALID_SLOTS[kind]:
        return None, None
    return group, slot


def scan():
    """Return the list of source records across all six INBOX folders."""
    records = []
    for leaf, kind, site_part in INBOX_FOLDERS:
        for entry in lsjson(leaf):
            name = entry["Name"]
            group, slot = parse_name(name, kind)
            records.append(
                {
                    "leaf": leaf,
                    "kind": kind,
                    "sitePart": site_part,
                    "name": name,
                    "group": group,
                    "slot": slot,
                    "size": entry.get("Size", 0),
                    "checksum": (entry.get("Hashes") or {}).get("md5"),
                    "sourcePath": f"INBOX/{leaf}/{name}",
                }
            )
    return records


def pairing_index(records):
    """Map each group key -> which site parts are present per kind."""
    index = {}
    for r in records:
        if not r["group"]:
            continue
        slots = index.setdefault(r["group"], {"image": set(), "audio": set()})
        slots[r["kind"]].add(r["sitePart"])
    return index


def pairing_status(group, index):
    """complete | partial | image-only | audio-only | unknown."""
    if not group or group not in index:
        return "unknown"
    imgs, auds = index[group]["image"], index[group]["audio"]
    if imgs and auds:
        return "complete" if imgs == ALL_PARTS and auds == ALL_PARTS else "partial"
    if imgs:
        return "image-only"
    if auds:
        return "audio-only"
    return "unknown"


def output_path(record):
    sub = "images" if record["kind"] == "image" else "audio"
    ext = "png" if record["kind"] == "image" else "mp3"
    return OUT / sub / record["sitePart"] / f"{record['group']}.{ext}"


def normalize_image(src, dst):
    dst.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            MAGICK, str(src),
            "-resize", f"{IMG_SIZE}x{IMG_SIZE}",
            "-background", "none", "-gravity", "center",
            "-extent", f"{IMG_SIZE}x{IMG_SIZE}",
            "-strip", str(dst),
        ],
        check=True, capture_output=True, text=True,
    )


def normalize_audio(src, dst):
    dst.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(src), *FFMPEG_AUDIO_ARGS, str(dst)],
        check=True, capture_output=True, text=True,
    )


def append_log(entry):
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a") as fh:
        fh.write(json.dumps(entry) + "\n")


def drive_move(record, decision):
    dest_root = "COMPLETE" if decision == "complete" else "DROPPED"
    src = f"{DRIVE_ROOT}/{record['sourcePath']}"
    dst = f"{DRIVE_ROOT}/{dest_root}/{record['leaf']}/{record['name']}"
    rclone("moveto", src, dst)
    return f"{dest_root}/{record['leaf']}/{record['name']}"


def process(record, run_id, tmp, index):
    """Normalise one source, log it, then mirror-move it in Drive."""
    status = pairing_status(record["group"], index)
    decision, reason, out_rel = "complete", "", None

    if record["group"] is None:
        decision, reason = "dropped", "unparseable filename (no group/slot)"
    elif not record["size"]:
        decision, reason = "dropped", "empty source file"
    else:
        raw = tmp / record["name"]
        try:
            rclone("copyto", f"{DRIVE_ROOT}/{record['sourcePath']}", str(raw))
            dst = output_path(record)
            if record["kind"] == "image":
                normalize_image(raw, dst)
            else:
                normalize_audio(raw, dst)
            out_rel = str(dst.relative_to(ROOT))
            reason = f"normalized {record['kind']} ({status})"
        except subprocess.CalledProcessError as exc:
            decision = "dropped"
            err = (exc.stderr or "").strip().splitlines()
            reason = f"normalize failed: {err[-1] if err else exc}"
        finally:
            if raw.exists():
                raw.unlink()

    # Log BEFORE moving the Drive file, so intent is recorded even if the move
    # fails partway. destinationPath is filled once the move succeeds.
    entry = {
        "runId": run_id,
        "processedAt": utcnow(),
        "sourcePath": record["sourcePath"],
        "destinationPath": None,
        "decision": decision,
        "reason": reason,
        "sitePart": record["sitePart"],
        "kind": record["kind"],
        "slot": record["slot"],
        "sourceName": record["name"],
        "outputPath": out_rel,
        "group": record["group"],
        "pairingStatus": status,
        "checksum": record["checksum"],
    }
    entry["destinationPath"] = drive_move(record, decision)
    append_log(entry)
    return decision, status, reason


def build_manifest():
    subprocess.run(
        [sys.executable, str(Path(__file__).with_name("build_manifest.py"))],
        check=True,
    )


def main():
    ap = argparse.ArgumentParser(description="Ingest the Drive INBOX batch.")
    ap.add_argument("--dry-run", action="store_true",
                    help="scan and print the plan; no downloads, moves or log writes")
    ap.add_argument("--limit", type=int, default=0,
                    help="process at most N sources per INBOX folder (0 = all)")
    args = ap.parse_args()

    if MAGICK is None:
        sys.exit("error: ImageMagick not found (need `magick` or `convert` on PATH)")
    if shutil.which("ffmpeg") is None:
        sys.exit("error: ffmpeg not found on PATH")
    if shutil.which("rclone") is None:
        sys.exit("error: rclone not found on PATH")

    print(f"scanning {DRIVE_ROOT}/INBOX ...")
    records = scan()
    index = pairing_index(records)

    if args.limit:
        kept, seen = [], {}
        for r in records:
            n = seen.get(r["leaf"], 0)
            if n < args.limit:
                kept.append(r)
                seen[r["leaf"]] = n + 1
        records = kept

    print(f"found {len(records)} source files; "
          f"{len(index)} distinct groups")
    status_tally = {}
    for g in index:
        s = pairing_status(g, index)
        status_tally[s] = status_tally.get(s, 0) + 1
    for s in sorted(status_tally):
        print(f"  groups {s}: {status_tally[s]}")

    if args.dry_run:
        print("\n-- dry run: planned actions --")
        for r in records:
            status = pairing_status(r["group"], index)
            if r["group"] is None:
                plan = "DROPPED (unparseable)"
            elif not r["size"]:
                plan = "DROPPED (empty)"
            else:
                plan = f"COMPLETE -> {output_path(r).relative_to(ROOT)}"
            print(f"  {r['sourcePath']:48} [{status:11}] {plan}")
        print("\n(dry run: nothing downloaded, moved, or logged)")
        return

    run_id = datetime.datetime.now(datetime.timezone.utc).strftime(
        "%Y%m%dT%H%M%SZ"
    ) + "-" + uuid.uuid4().hex[:8]
    print(f"\nrunId {run_id}")

    tmp = OUT / "_tmp"
    tmp.mkdir(parents=True, exist_ok=True)
    completed = dropped = 0
    try:
        for r in records:
            decision, status, reason = process(r, run_id, tmp, index)
            if decision == "complete":
                completed += 1
            else:
                dropped += 1
            print(f"  {decision:8} {r['sourcePath']:48} [{status}] {reason}")
    finally:
        if tmp.exists():
            shutil.rmtree(tmp, ignore_errors=True)

    print(f"\ncompleted {completed}, dropped {dropped}")
    print("regenerating manifest ...")
    build_manifest()
    print(f"ingest log: {LOG_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
