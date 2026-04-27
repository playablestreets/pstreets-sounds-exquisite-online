# Exquisite Stories

A Three.js exquisite-corpse cube app. Three stacked cubes — head, body, legs —
each show six story faces sourced from a Prismic content repo. Drag cubes to
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

Stories are pulled from the Prismic repo `playable-web` (`sounds_exquisite`
document type). Each story has a top, middle, and bottom part with an image,
a sound, and some text. The page calls Prismic on load and never caches; new
content published to Prismic appears on next refresh.

Contributors can submit a story via the DIY form linked from the top-right
corner of the page (currently <https://form.jotform.com/202537580463052>).

## Layout

- `public/index.html` — entry point, loads Three.js and the app scripts
- `public/script.js` — scene, camera, drag controls, top-level wiring
- `public/cube.js` — `Cube` class (faces, audio, animations)
- `public/utils.js` — Prismic API client + helpers
- `public/style.css` — page chrome (canvas + the two corner buttons)
- `public/assets/` — background SVG, icons, etc.
- `public/Tween.js`, `public/three.js`, `public/DragControls.js` — vendored libs

## Issue tracking

Active issues and feature requests live in `.loom/` — see
<https://github.com/zealtv/loom>. `.loom/loom.sh status` for the tree.
