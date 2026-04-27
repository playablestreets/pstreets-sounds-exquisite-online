# tween-case-mismatch

**bug** — breaks deployment on case-sensitive filesystems (Linux/most prod hosts).

`public/index.html:12` loads `tween.js` (lowercase) but the file on disk is `Tween.js` (capital T). macOS HFS+/APFS is case-insensitive so it works locally, but on a case-sensitive host the script 404s and `TWEEN.update()` / all tween calls in `script.js` and `cube.js` will throw `ReferenceError`.

Fix: change the script tag to `Tween.js` (or rename the file to `tween.js` and keep all references lowercase — pick one and be consistent).

Worth grepping for any other case mismatches at the same time.
