# Exquisite Stories

A Three.js exquisite-corpse cube app. Three stacked cubes — head, body, legs —
each show six story faces sourced from local content. Drag cubes to
swap their roles, tap to play the story-fragment audio for the visible face,
or shuffle to spin all three cubes to a new random face.

Live: <http://playableweb.com>

## Run locally

It's all static. From the repo root:

```sh
cd public
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Content

Content is **cooked into the site source** under `public/assets/content/` and
described by `manifest.json`; the page loads it on startup (no external CMS).

Images and audio are **decoupled pools** per body part (top/middle/bottom).
On every load the app samples each pool independently to dress the six cube
faces, so a given image is not tied to a given sound. Each manifest entry
carries a `group` key (image timestamp / audio recording id) and a reserved
`association` field, leaving room to re-link images and audio in a later pass.

Assets are normalised on ingest to **256×256 PNG** images and **mono ~80 kbps
MP3** audio. New content flows through a Google Drive pipeline — see
[docs/content-pipeline.md](docs/content-pipeline.md) for the current runbook.
The old `tools/ingest.py` script is stale and is tracked for rebuild in loom.

> Note: this app previously pulled from the Prismic repo `playable-web`
> (`sounds_exquisite` type). That dependency has been removed.

## Layout

- `public/index.html` — entry point, loads Three.js and the app scripts
- `public/script.js` — scene, camera, drag controls, content loading + face composition
- `public/cube.js` — `Cube` class (faces, audio, animations)
- `public/utils.js` — manifest loader + helpers
- `public/style.css` — page chrome (canvas + the two corner buttons)
- `public/assets/content/` — ingested images/audio pools + `manifest.json`
- `public/assets/` — background SVG, icons, etc.
- `public/Tween.js`, `public/three.js`, `public/DragControls.js` — vendored libs
- `tools/ingest.py` — content ingest (Drive → normalised local assets + manifest)
- `docs/content-pipeline.md` — content pipeline runbook

## Issue tracking

Active issues and feature requests live in `.loom/` — see
<https://github.com/zealtv/loom>. `.loom/loom.sh status` for the tree.
