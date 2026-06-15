#!/usr/bin/env python3
"""Generate public/assets/content/manifest.json by scanning the pool dirs.

The site loads this manifest. Images and audio are decoupled pools per body
part; this script simply reflects whatever files are present on disk, so
adding content is just: drop normalised files into the right pool dir and
re-run this. (tools/ingest.py calls this after fetching/converting.)

Each entry gets a `group` key (the filename stem). The new ingest names a
coherent set with a shared stem across parts and across kinds (e.g.
`pair-001.png` in every image part and `pair-001.mp3` in every audio part), so
this script can recover pairing from the stem alone:

  - `pairingStatus` per entry: complete | partial | image-only | audio-only
  - `associations`: one record per group that has both image and audio,
    listing its image and audio entry ids. This is what the future gallery uses
    to open the interactive cube with a specific monster's assets loaded.

The site only reads `images[part]`/`audio[part]` `.file` URLs, so the extra
fields are inert for the live cube and purely for the gallery/recovery path.
"""
import json, datetime
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public" / "assets" / "content"
PARTS = ["top", "middle", "bottom"]
ALL_PARTS = set(PARTS)
IMG_EXT = {".png"}
AUD_EXT = {".mp3"}


def scan(kind, exts):
    pools = {}
    for part in PARTS:
        d = OUT / kind / part
        files = sorted(f for f in d.glob("*") if f.suffix.lower() in exts) if d.is_dir() else []
        pools[part] = [{
            "id": f"{part}/{f.stem}",
            "file": f"{kind}/{part}/{f.name}",
            "group": f.stem,
        } for f in files]
    return pools


def presence(images, audio):
    """group stem -> {'image': {parts}, 'audio': {parts}}"""
    index = {}
    for kind, pools in (("image", images), ("audio", audio)):
        for part, entries in pools.items():
            for e in entries:
                index.setdefault(e["group"], {"image": set(), "audio": set()})[kind].add(part)
    return index


def status_for(group, index):
    imgs, auds = index[group]["image"], index[group]["audio"]
    if imgs and auds:
        return "complete" if imgs == ALL_PARTS and auds == ALL_PARTS else "partial"
    if imgs:
        return "image-only"
    return "audio-only"


def main():
    images = scan("images", IMG_EXT)
    audio = scan("audio", AUD_EXT)
    index = presence(images, audio)

    # Stamp every entry with its group's pairing status.
    for pools in (images, audio):
        for entries in pools.values():
            for e in entries:
                e["pairingStatus"] = status_for(e["group"], index)
                e["association"] = e["group"] if index[e["group"]]["image"] and \
                    index[e["group"]]["audio"] else None

    # An association = a group that has both image and audio content on disk.
    associations = []
    for group in sorted(index):
        slots = index[group]
        if not (slots["image"] and slots["audio"]):
            continue
        associations.append({
            "group": group,
            "pairingStatus": status_for(group, index),
            "images": [f"{p}/{group}" for p in PARTS if p in slots["image"]],
            "audio": [f"{p}/{group}" for p in PARTS if p in slots["audio"]],
        })

    manifest = {
        "generatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "note": "Decoupled image/audio pools per body part. `group` is the shared "
                "stem of a coherent set; `pairingStatus` and `associations` recover "
                "complete monster sets from shared stems for the gallery.",
        "images": images,
        "audio": audio,
        "associations": associations,
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print("manifest.json written")
    for k, pools in (("images", images), ("audio", audio)):
        for p in PARTS:
            print(f"  {k}/{p}: {len(pools[p])}")
    print(f"  associations: {len(associations)}")


if __name__ == "__main__":
    main()
