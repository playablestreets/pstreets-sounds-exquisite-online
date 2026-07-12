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

Performance: Drive round trips dominate, so the run does ONE batched
``rclone copy`` to pull every source locally, normalises with no further
network calls, then issues ONE batched ``rclone move`` per (leaf, destination)
to mirror the sources -- a handful of rclone invocations instead of two per
file.

Re-running is safe: outputs are deterministic by group key (so identical inputs
overwrite to the same bytes), and processed sources leave INBOX, so a second run
over a drained INBOX is a no-op.

Recovery: every log line is keyed by ``runId`` with the ``COMPLETE``/``DROPPED``
``destinationPath``, so the files a given run ingested can always be recovered
from the log even though the originals (full-resolution) now live under
``COMPLETE``. To reprocess after a format change, re-upload the originals to
``INBOX`` (or move them back from ``COMPLETE``) and re-run.

Usage:
  python3 tools/ingest.py --dry-run        # scan + print plan, no downloads/moves
  python3 tools/ingest.py --check          # verify tools + Drive folder shape
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
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "assets" / "content"
LOG_PATH = OUT / "ingest-log.jsonl"

# Drive remote, supplied via the environment so no folder ID is committed.
# Set it to your rclone remote + root folder, e.g.
#   export DRIVE_ROOT='gdrive,root_folder_id=<your-folder-id>:'
# The named shortcut path is unreliable on Linux, so the folder-ID form is
# preferred. Required at run time (see check in main()).
DRIVE_ROOT = os.environ.get("DRIVE_ROOT")

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
# Parallelism for the batched rclone copy/move calls.
RCLONE_PARALLEL = ["--transfers", "16", "--checkers", "16"]

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


def lsf(path, *args):
    """Return rclone lsf output lines for a path."""
    out = rclone("lsf", path, *args).stdout
    return [line.strip() for line in out.splitlines() if line.strip()]


def parse_name(name, kind):
    """``pair-001_top.png`` -> (group, slot). Returns (None, None) if invalid."""
    stem = Path(name).stem
    if "_" not in stem:
        return None, None
    group, slot = stem.rsplit("_", 1)
    if not group or slot not in VALID_SLOTS[kind]:
        return None, None
    return group, slot


def scan(limit=0, full_pairing=False):
    """Return the source records across all six INBOX folders.

    ``limit`` caps how many files are taken from each leaf after each Drive leaf
    listing is returned (0 = all). By default, pairing is computed from the same
    records that will be processed. Use ``full_pairing`` with limited dry-runs
    when you need batch-wide pairing status.
    """
    records = []
    counts = defaultdict(int)
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
    if limit:
        kept = []
        for r in records:
            if counts[r["leaf"]] < limit:
                kept.append(r)
                counts[r["leaf"]] += 1
        if not full_pairing:
            records = kept
            return records, pairing_index(records)
        index = pairing_index(records)
        return kept, index
    index = pairing_index(records)
    return records, index


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


def batch_download(records, tmp):
    """One rclone copy that pulls exactly the records' sources into ``tmp``."""
    listfile = tmp / "_download.lst"
    listfile.write_text("\n".join(f"{r['leaf']}/{r['name']}" for r in records) + "\n")
    rclone("copy", f"{DRIVE_ROOT}/INBOX", str(tmp),
           "--files-from", str(listfile), *RCLONE_PARALLEL)
    listfile.unlink()


def batch_move(plan, tmp):
    """Mirror sources to COMPLETE/DROPPED with one rclone move per (leaf, dest)."""
    groups = defaultdict(list)
    for r, _decision, dest_root in plan:
        groups[(r["leaf"], dest_root)].append(r["name"])
    for (leaf, dest_root), names in sorted(groups.items()):
        listfile = tmp / f"_move_{dest_root}_{leaf}.lst"
        listfile.write_text("\n".join(names) + "\n")
        rclone("move", f"{DRIVE_ROOT}/INBOX/{leaf}",
               f"{DRIVE_ROOT}/{dest_root}/{leaf}",
               "--files-from", str(listfile), *RCLONE_PARALLEL)
        listfile.unlink()
        print(f"  moved {len(names):3} -> {dest_root}/{leaf}")


def normalize_record(record, tmp, index, run_id):
    """Normalise one already-downloaded source and append its log line.

    Returns (decision, dest_root). The log is written here -- BEFORE any Drive
    move -- with the deterministic destinationPath, so intent is durable even if
    a later move fails.
    """
    status = pairing_status(record["group"], index)
    decision, reason, out_rel = "complete", "", None
    local = tmp / record["leaf"] / record["name"]

    if record["group"] is None:
        decision, reason = "dropped", "unparseable filename (no group/slot)"
    elif not record["size"]:
        decision, reason = "dropped", "empty source file"
    elif not local.exists():
        decision, reason = "dropped", "source did not download"
    else:
        dst = output_path(record)
        try:
            if record["kind"] == "image":
                normalize_image(local, dst)
            else:
                normalize_audio(local, dst)
            out_rel = str(dst.relative_to(ROOT))
            reason = f"normalized {record['kind']} ({status})"
        except subprocess.CalledProcessError as exc:
            decision = "dropped"
            err = (exc.stderr or "").strip().splitlines()
            reason = f"normalize failed: {err[-1] if err else exc}"

    dest_root = "COMPLETE" if decision == "complete" else "DROPPED"
    append_log({
        "runId": run_id,
        "processedAt": utcnow(),
        "sourcePath": record["sourcePath"],
        "destinationPath": f"{dest_root}/{record['leaf']}/{record['name']}",
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
    })
    return decision, dest_root


def build_manifest():
    subprocess.run(
        [sys.executable, str(Path(__file__).with_name("build_manifest.py"))],
        check=True,
    )


def check_drive_shape():
    """Verify the expected Drive folders without enumerating source files."""
    expected_roots = {"INBOX/", "COMPLETE/", "DROPPED/"}
    expected_inbox = {f"{leaf}/" for leaf, _kind, _part in INBOX_FOLDERS}

    roots = set(lsf(DRIVE_ROOT, "--dirs-only"))
    inbox = set(lsf(f"{DRIVE_ROOT}/INBOX", "--dirs-only"))

    missing_roots = sorted(expected_roots - roots)
    missing_inbox = sorted(expected_inbox - inbox)
    if missing_roots or missing_inbox:
        if missing_roots:
            print("missing Drive root folders:")
            for item in missing_roots:
                print(f"  {item}")
        if missing_inbox:
            print("missing INBOX leaf folders:")
            for item in missing_inbox:
                print(f"  {item}")
        return False

    print("Drive folder shape OK")
    print("  roots: " + ", ".join(sorted(expected_roots)))
    print("  INBOX leaves: " + ", ".join(sorted(expected_inbox)))
    return True


def main():
    ap = argparse.ArgumentParser(description="Ingest the Drive INBOX batch.")
    ap.add_argument("--check", action="store_true",
                    help="verify local tools and Drive folder shape; no file scan")
    ap.add_argument("--dry-run", action="store_true",
                    help="scan and print the plan; no downloads, moves or log writes")
    ap.add_argument("--limit", type=int, default=0,
                    help="process at most N sources per INBOX folder (0 = all)")
    ap.add_argument("--full-pairing", action="store_true",
                    help="with --limit, compute pairing status from the full batch")
    args = ap.parse_args()

    if MAGICK is None:
        sys.exit("error: ImageMagick not found (need `magick` or `convert` on PATH)")
    if shutil.which("ffmpeg") is None:
        sys.exit("error: ffmpeg not found on PATH")
    if shutil.which("rclone") is None:
        sys.exit("error: rclone not found on PATH")
    if not DRIVE_ROOT:
        sys.exit(
            "error: DRIVE_ROOT is not set. Export your rclone remote + root "
            "folder first, e.g.\n"
            "  export DRIVE_ROOT='gdrive,root_folder_id=<your-folder-id>:'"
        )

    if args.check:
        ok = check_drive_shape()
        sys.exit(0 if ok else 1)

    print(f"scanning {DRIVE_ROOT}/INBOX ...")
    records, index = scan(limit=args.limit, full_pairing=args.full_pairing)

    suffix = ""
    if args.limit and not args.full_pairing:
        suffix = " (pairing from limited selection)"
    elif args.limit and args.full_pairing:
        suffix = " (pairing from full batch)"
    print(f"found {len(records)} source files; {len(index)} distinct groups{suffix}")
    status_tally = defaultdict(int)
    for g in index:
        status_tally[pairing_status(g, index)] += 1
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

    if not records:
        print("INBOX is empty; nothing to ingest.")
        return

    run_id = datetime.datetime.now(datetime.timezone.utc).strftime(
        "%Y%m%dT%H%M%SZ"
    ) + "-" + uuid.uuid4().hex[:8]
    print(f"\nrunId {run_id}")

    tmp = OUT / "_tmp"
    if tmp.exists():
        shutil.rmtree(tmp, ignore_errors=True)
    tmp.mkdir(parents=True, exist_ok=True)
    completed = dropped = 0
    try:
        print(f"downloading {len(records)} sources ...")
        batch_download(records, tmp)

        print("normalizing + logging ...")
        plan = []
        for r in records:
            decision, dest_root = normalize_record(r, tmp, index, run_id)
            plan.append((r, decision, dest_root))
            if decision == "complete":
                completed += 1
            else:
                dropped += 1

        print(f"completed {completed}, dropped {dropped}; mirroring Drive moves ...")
        batch_move(plan, tmp)
    finally:
        if tmp.exists():
            shutil.rmtree(tmp, ignore_errors=True)

    print("regenerating manifest ...")
    build_manifest()
    print(f"ingest log: {LOG_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
