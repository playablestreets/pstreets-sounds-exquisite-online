# dead-code-cleanup

**cleanup** — several variables and functions are dead or confusing. No user impact, but they make the code harder to read.

In `public/script.js`:
- `faceStories` declared at module scope (line 62) is unused — `createCubes` declares its own local `faceStories` (line 146) which is also written to but never read; the actual data flows through `tempStories`.
- `hasLoaded` set in `loadNewScene` but never read.
- `draggedFrom` declared (line 14), never assigned.
- Large blocks of commented-out code throughout (`onMouseDown` raycasting, `checkForHover`, the home link in the body, etc.). Either revive or delete.

In `public/utils.js`:
- `luma()` relies on a p5 API that isn't loaded — dead. (See also `luma-blue-coefficient`.)
- `getNormMouse()`, `getElapsed()`, `getParameterByName()`, `getQueryVariable()`, `getUrlName()` — check usage; appear to be dead.
- `totalSize` (line 32) — declared, never used.
- Old commented-out `shuffle` function (lines 143-161) — `shuffleArray` is the live one.

Pass through, delete what's truly unused, leave a one-line comment if anything is "kept for X reason".
