# Content pipeline runbook

How new monster content gets from Google Drive into the site.

```
Google Drive INBOX  ->  ingest into the site  ->  COMPLETE / DROPPED
```

The Drive side now uses the same folder shape in `INBOX`, `COMPLETE`, and
`DROPPED`. That keeps batches auditable: every file either stays pending in
`INBOX`, moves to the matching path under `COMPLETE`, or moves to the matching
path under `DROPPED`.

The site reads only `public/assets/content/manifest.json` and the assets beside
it. Images and audio are still decoupled pools per body part
(`top`/`middle`/`bottom`). The future gallery page should use the ingest log to
recover complete monster sets, then open the interactive cube with that
monster's images and audio loaded.

## Current Drive Source

The Drive source is supplied via the `DRIVE_ROOT` environment variable so no
folder ID is committed to the repo. Set it to your rclone remote plus the
project's root folder ID before running anything below:

```sh
export DRIVE_ROOT='gdrive,root_folder_id=<your-folder-id>:'
```

(The folder ID for this project is kept out of source control — get it from the
project owner / your rclone setup, not from this repo.)

The older shortcut path, `gdrive:SHARED/EXST_ PLAYABLE WEB`, exists in this
account but has been unreliable with the current Linux/rclone setup. Prefer the
folder-ID remote until the shortcut behavior is understood.

Current top-level folders:

- `INBOX/` - files waiting to be processed
- `COMPLETE/` - files successfully ingested
- `DROPPED/` - files intentionally skipped
- `_ARCHIVE/` - older project material

Current `INBOX` leaf folders:

| Drive folder | Site part | Current count | Current size |
| --- | --- | ---: | ---: |
| `INBOX/IMAGES_TOP/` | `images/top` | 55 | 41.746 MiB |
| `INBOX/IMAGES_MIDDLE/` | `images/middle` | 55 | 47.407 MiB |
| `INBOX/IMAGES_BOTTOM/` | `images/bottom` | 55 | 40.641 MiB |
| `INBOX/AUDIO_BEGINNING/` | `audio/top` | 47 | 17.296 MiB |
| `INBOX/AUDIO_MIDDLE/` | `audio/middle` | 47 | 21.862 MiB |
| `INBOX/AUDIO_END/` | `audio/bottom` | 47 | 22.476 MiB |

## Prerequisites

- `python3`
- `ffmpeg` for audio conversion
- ImageMagick (`magick` or `convert`) for image normalization
- `rclone` with a `gdrive` Google Drive remote

`tools/ingest.py` is the current importer. It scans the six `INBOX` leaf
folders, downloads the current batch, normalizes usable assets into
`public/assets/content/`, appends `public/assets/content/ingest-log.jsonl`,
regenerates `manifest.json`, then mirrors processed Drive files to `COMPLETE`
or `DROPPED`.

## rclone Setup

Create a remote named exactly `gdrive`:

```sh
rclone config
```

Use these choices:

- New remote name: `gdrive`
- Storage: Google Drive (`drive`)
- `client_id` / `client_secret`: blank unless using a project OAuth client
- Scope: full Drive access (`drive`) so the pipeline can move files
- Root folder and service account: blank
- Advanced config: no
- Auto config: yes, then authorize in the browser

Verify:

```sh
rclone listremotes
rclone lsf "$DRIVE_ROOT" --dirs-only
rclone lsf "$DRIVE_ROOT/INBOX" --dirs-only
```

Expected `INBOX` output:

```text
AUDIO_BEGINNING/
AUDIO_END/
AUDIO_MIDDLE/
IMAGES_BOTTOM/
IMAGES_MIDDLE/
IMAGES_TOP/
```

The credentials live in `~/.config/rclone/rclone.conf` by default. Check the
path with:

```sh
rclone config file
```

## Ingest Behavior

The importer:

1. Scan the six `INBOX` leaf folders instead of using hardcoded Drive file IDs.
2. Decide whether each input is `complete` or `dropped`.
3. Normalize complete images to site-ready PNG files under
   `public/assets/content/images/{top,middle,bottom}/`.
4. Normalize complete audio to mono MP3 files under
   `public/assets/content/audio/{top,middle,bottom}/`.
5. Regenerate `public/assets/content/manifest.json` with
   `tools/build_manifest.py`.
6. Write an ingest log before moving files in Drive.
7. Move every processed source file from `INBOX/...` to the matching
   `COMPLETE/...` or `DROPPED/...` path.

Source filenames must be shaped as `{group}_{slot}.{ext}`. Image slots are
`top`, `middle`, and `bottom`; audio slots are `beginning`, `middle`, and
`end`, which map to the site's `top`, `middle`, and `bottom` audio pools.
Outputs are deterministic by group key, for example `pair-001.png` or
`pair-001.mp3` in the relevant part folder.

Missing image/audio counterparts do not make a source invalid. Image-only and
audio-only groups are still normalized and marked `complete`; the log's
`pairingStatus` field records whether the group is `complete`, `partial`,
`image-only`, or `audio-only`.

`COMPLETE` and `DROPPED` should mirror `INBOX` exactly:

```text
COMPLETE/IMAGES_TOP/
COMPLETE/IMAGES_MIDDLE/
COMPLETE/IMAGES_BOTTOM/
COMPLETE/AUDIO_BEGINNING/
COMPLETE/AUDIO_MIDDLE/
COMPLETE/AUDIO_END/

DROPPED/IMAGES_TOP/
DROPPED/IMAGES_MIDDLE/
DROPPED/IMAGES_BOTTOM/
DROPPED/AUDIO_BEGINNING/
DROPPED/AUDIO_MIDDLE/
DROPPED/AUDIO_END/
```

## Ingest Log

Each run appends JSONL records to `public/assets/content/ingest-log.jsonl`.
The log is written before Drive files are moved, so a failed move still leaves
a recovery trail for what the run intended to do.

Fields per source file:

- `runId` - stable timestamp or UUID for this ingest run
- `processedAt` - UTC timestamp
- `sourcePath` - original Drive path under `INBOX`
- `destinationPath` - Drive path under `COMPLETE` or `DROPPED`
- `decision` - `complete` or `dropped`
- `reason` - short human-readable reason for drops or transforms
- `sitePart` - `top`, `middle`, or `bottom`
- `kind` - `image` or `audio`
- `sourceName` - original filename
- `outputPath` - local normalized asset path, if complete
- `group` - stable monster/group key when known
- `slot` - source slot from the filename
- `pairingStatus` - complete, partial, image-only, audio-only, or unknown
- `checksum` - source checksum if rclone exposes one cheaply

This log is the recovery point for reprocessing images, rebuilding associations,
and powering the later gallery of complete monsters.

## Run the Importer

Set `DRIVE_ROOT` first (see "Current Drive Source" above), then preview the
run:

```sh
python3 tools/ingest.py --dry-run
```

For a small real batch, limit how many files are processed from each leaf:

```sh
python3 tools/ingest.py --limit 3
```

Run the full ingest only after the dry-run plan looks right:

```sh
python3 tools/ingest.py
```

A full run moves processed Drive files out of `INBOX`, so treat it as the
committing step. Re-running after a drained `INBOX` is a no-op.

## Manual Inventory Commands

Use these when checking Drive state by hand:

rclone lsf "$DRIVE_ROOT/INBOX" --dirs-only

for d in IMAGES_TOP IMAGES_MIDDLE IMAGES_BOTTOM AUDIO_BEGINNING AUDIO_MIDDLE AUDIO_END; do
  echo "== $d =="
  rclone size "$DRIVE_ROOT/INBOX/$d"
done
```

For small samples, `rclone lsf "$DRIVE_ROOT/INBOX/$d" --files-only` is useful,
but full listings can be slow. Prefer bounded, per-folder queries while
debugging.

## Local Verification

After assets are normalized locally:

```sh
python3 tools/build_manifest.py
cd public
python3 -m http.server 8000
```

Open <http://localhost:8000>. Cubes should load from
`public/assets/content/manifest.json`.

## Loom Tracking

Pipeline rebuild work is tracked in loom:

```sh
.loom/loom.sh status
```

Relevant stitches:

- `content-ingestion-pipeline/rebuild-inbox-ingest` - completed importer
  rebuild around the current `INBOX` folder shape, logging, normalization, and
  mirrored Drive moves.
- `fix-bugs-and-usability/gallery-page-for-complete-monsters` - future gallery
  for browsing complete monsters and opening the interactive site with that
  monster loaded.
