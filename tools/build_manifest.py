#!/usr/bin/env python3
"""Generate public/assets/content/manifest.json by scanning the pool dirs.

The site loads this manifest. Images and audio are decoupled pools per body
part; this script simply reflects whatever files are present on disk, so
adding content is just: drop normalised files into the right pool dir and
re-run this. (tools/ingest.py calls this after fetching/converting.)

Each entry gets a `group` key (the filename stem) and a null `association`
field reserved for a future image<->audio linking pass. Coherent triples that
share a stem across parts (e.g. the timestamped cropper output) stay grouped.
"""
import json, datetime
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public" / "assets" / "content"
PARTS = ["top", "middle", "bottom"]
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
            "association": None,
        } for f in files]
    return pools


def main():
    manifest = {
        "generatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "note": "Decoupled image/audio pools per body part. `group` keys coherent "
                "triples (shared stem); `association` is reserved for a later "
                "image<->audio linking pass.",
        "images": scan("images", IMG_EXT),
        "audio": scan("audio", AUD_EXT),
        "associations": [],
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print("manifest.json written")
    for k in ("images", "audio"):
        for p in PARTS:
            print(f"  {k}/{p}: {len(manifest[k][p])}")


if __name__ == "__main__":
    main()
