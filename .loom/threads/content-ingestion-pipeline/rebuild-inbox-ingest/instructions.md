# rebuild-inbox-ingest

**pipeline** — replace the stale hardcoded Drive-file ingest with an importer
that scans the current `INBOX` folder shape.

Current state:
- `docs/content-pipeline.md` documents the new target behavior.
- `tools/ingest.py` is stale: it hardcodes old Drive IDs and uses macOS `sips`.
- The new Drive shape is:
  - `INBOX/IMAGES_TOP`
  - `INBOX/IMAGES_MIDDLE`
  - `INBOX/IMAGES_BOTTOM`
  - `INBOX/AUDIO_BEGINNING`
  - `INBOX/AUDIO_MIDDLE`
  - `INBOX/AUDIO_END`

Implementation requirements:
- Scan Drive folders via rclone instead of manually entering file IDs.
- Normalize images to site-ready PNG assets.
- Normalize audio to mono MP3 assets.
- Allow orphaned assets. Images without matching audio, and audio without
  matching images, can still be valid `COMPLETE` assets and must not be dropped
  solely because their counterpart is missing.
- Record pairing/orphan status in the ingest log so later passes can distinguish
  complete monster sets, image-only assets, and audio-only assets.
- Write an append-only ingest log before moving Drive files.
- Move every processed source to the mirrored path under `COMPLETE` or
  `DROPPED`.
- Regenerate `public/assets/content/manifest.json`.
- Be rerunnable without duplicating already-ingested outputs.

Open design points:
- Exact filename/group convention from the new preprocessing pipeline.
- Where the ingest log should live if the future gallery needs it at runtime.
- Exact schema for representing `pairingStatus`: complete set, partial set,
  image-only, audio-only, or unknown.
- Whether orphaned assets should appear in the current random cube pools
  immediately, or only after gallery/association logic can present them clearly.
