# Content pipeline runbook

How new story content gets from contributors into the site. The flow is:

```
Google Drive PENDING  →  vet & ingest into the site  →  COMPLETE (keepers) / DROPPED (rejects)
```

The site reads only `public/assets/content/manifest.json` and the assets
beside it. Images and audio are kept as **decoupled pools** per body part
(top/middle/bottom) — nothing ties a given image to a given sound yet, but
every entry carries a `group` key and a reserved `association` field so they
can be linked later without re-ingesting.

## Where things live

**Google Drive** — shared folder `EXST_ PLAYABLE WEB` (reachable as
`gdrive:SHARED/EXST_ PLAYABLE WEB` via the rclone shortcut):

- `PENDING/PENDING_IMAGES/{TOP,MIDDLE,BOTTOM}` — submitted images
- `PENDING/PENDING_AUDIO/{BEGINNING,MIDDLE,END}` — submitted audio
  (beginning→top, middle→middle, end→bottom)
- `COMPLETE/` — assets that shipped (archived after ingest)
- `DROPPED/` — assets we chose not to use

**Repo:**

- `tools/ingest.py` — downloads vetted Drive assets, normalises them, writes the manifest
- `public/assets/content/{images,audio}/{top,middle,bottom}/` — ingested pools
- `public/assets/content/manifest.json` — what the site loads

## Image tiers (what to keep)

PENDING image folders mix three kinds of file:

| Tier | Pattern | Keep? |
|------|---------|-------|
| A — cropper output | `*_2026*.png` (e.g. `top_20260531-143625.png`) | **Yes** — these are the display-ready assets |
| B — legacy jotform crops | `<uuid>_faceN.jpeg` | No → DROPPED |
| C — raw scans | `Doxie NNNN.jpg` | No → DROPPED |

All **audio** in PENDING is kept.

## Prerequisites

- `python3`
- `ffmpeg` — audio conversion (`brew install ffmpeg`)
- `sips` — image conversion (ships with macOS). On Linux, swap the `sips`
  calls in `tools/ingest.py` for ImageMagick, e.g.
  `magick in.png -resize 256x256! out.png`.
- `rclone` — Google Drive access for the PENDING → COMPLETE/DROPPED moves
  (the Drive UI works too, but rclone is what these scripts use). See setup
  below.

## rclone setup (portable — do this once per machine)

The pipeline talks to Drive through an rclone remote named **`gdrive`**. Setting
it up on a new machine:

1. **Install rclone**
   ```sh
   brew install rclone            # macOS
   # or: curl https://rclone.org/install.sh | sudo bash   # Linux
   ```

2. **Create the remote** (interactive; opens a browser to authorize):
   ```sh
   rclone config
   ```
   - `n` → new remote, name it exactly **`gdrive`**
   - storage: **`drive`** (Google Drive)
   - `client_id` / `client_secret`: leave blank (or supply your own Google OAuth
     client to avoid shared-quota rate limits — recommended for big batches)
   - scope: **`1`** (full `drive` access — needed for move/delete)
   - skip `root_folder_id` / `service_account_file`; decline advanced config
   - auto-config `y` → authorize in the browser → confirm → `q` to quit

   Use the **same Google account** that the `EXST_ PLAYABLE WEB` folder is
   shared with (currently a dedicated project account).

   *Headless / remote machine?* Choose `n` at the auto-config step and run
   `rclone authorize "drive"` on a machine with a browser, then paste the token
   back.

3. **Make the shared folder reachable.** `EXST_ PLAYABLE WEB` is shared *to* the
   account (not owned by it). The scripts expect it at
   `gdrive:SHARED/EXST_ PLAYABLE WEB`, which assumes a **shortcut to it placed in
   a `SHARED/` folder** in that account's My Drive (do this once in the Drive
   web UI: right-click the shared folder → *Organise → Add shortcut* → into
   `SHARED/`). Alternatively, reference it directly without a shortcut using
   `--drive-shared-with-me` and the bare folder name.

4. **Verify**
   ```sh
   rclone listremotes                              # should list: gdrive:
   rclone lsd "gdrive:SHARED/EXST_ PLAYABLE WEB"   # should list COMPLETE/ DROPPED/ PENDING/ ...
   ```

The credentials live in one file — `rclone config file` prints its path
(typically `~/.config/rclone/rclone.conf`). To clone the setup to another
machine you can either re-run the steps above or copy that file across.

> Note: the bundled "claude.ai Google Drive" connector is **read/copy/create
> only** (no move or delete), which is why moves go through rclone.

## Step 1 — Inventory & decide keepers

List the PENDING leaf folders and confirm counts. Tier-A keepers are exactly
the `*_2026*.png` files:

```sh
B="gdrive:SHARED/EXST_ PLAYABLE WEB"
for p in TOP MIDDLE BOTTOM; do
  echo -n "$p keepers: "; rclone lsf "$B/PENDING/PENDING_IMAGES/$p" --include "*_2026*.png" --files-only | wc -l
done
```

## Step 2 — Ingest into the site

`tools/ingest.py` holds a spec mapping Drive file IDs → body part for the
assets to bring in. Update those tables with the new file IDs (get them from
`rclone lsf --format ip` or the Drive UI), then run:

```sh
python3 tools/ingest.py
```

It downloads each file (via the public `uc?export=download` link — no API
write scope needed), converts images to 256×256 PNG and audio to mono ~80 kbps
MP3 (WAV→MP3 via ffmpeg; existing MP3s copied), and writes them under
`public/assets/content/`. Re-running is idempotent.

`manifest.json` is generated by **`tools/build_manifest.py`**, which `ingest.py`
calls at the end. It works by **scanning the pool dirs**, so the manifest always
reflects whatever files are present — to add assets by any other means (e.g.
normalised files copied in by hand), just drop them into the right
`public/assets/content/{images,audio}/{top,middle,bottom}/` dir and run:

```sh
python3 tools/build_manifest.py
```

## Step 3 — Verify locally

```sh
cd public && python3 -m http.server 8000
# open http://localhost:8000 — cubes should show the new art; shuffle/reload re-samples the pools
```

Optional headless smoke test (note the WebGL flag — without it Chrome blocks
software rendering and the cubes won't appear):

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --no-sandbox --enable-unsafe-swiftshader \
  --window-size=900,900 --virtual-time-budget=12000 \
  --screenshot=/tmp/exq.png "http://localhost:8000/"
```

## Step 4 — Move Drive assets to COMPLETE / DROPPED

These are true server-side moves (originals are removed, no duplicates). Run
keepers first, then sweep the remainder.

```sh
B="gdrive:SHARED/EXST_ PLAYABLE WEB"

# keepers -> COMPLETE
for p in TOP MIDDLE BOTTOM; do
  rclone move "$B/PENDING/PENDING_IMAGES/$p" "$B/COMPLETE/IMAGES_$p" --include "*_2026*.png"
done
rclone move "$B/PENDING/PENDING_AUDIO/BEGINNING" "$B/COMPLETE/AUDIO_BEGINNING"
rclone move "$B/PENDING/PENDING_AUDIO/MIDDLE"    "$B/COMPLETE/AUDIO_MIDDLE"
rclone move "$B/PENDING/PENDING_AUDIO/END"       "$B/COMPLETE/AUDIO_END"

# everything still in PENDING_IMAGES is a reject -> DROPPED
for p in TOP MIDDLE BOTTOM; do
  rclone move "$B/PENDING/PENDING_IMAGES/$p" "$B/DROPPED/IMAGES_$p"
done
```

Reconcile: `COMPLETE + DROPPED` file count should equal the original PENDING
total. Empty PENDING folder shells are fine to leave for the next batch.

## Notes & gotchas

- **Filename collisions:** image keepers share timestamp names across parts
  (e.g. `20260531-143625.png` exists for top/middle/bottom), so they must stay
  in per-part subfolders both in the repo and in COMPLETE.
- **Prismic:** the old Prismic `sounds_exquisite` content was found to be a
  subset of PENDING (its audio = the legacy Faith/Zander MP3s, its images =
  Tier B crops), so it is not ingested separately.
- **Associating images with audio later:** the manifest's `group` keys already
  identify coherent triples (image timestamp; audio recording id). A future
  pass can populate the `association` field and have the site pair them.
