# no-touch-event-support

**bug / ux** — mobile users probably can't drag cubes.

`public/index.html:4` declares `<meta name="viewport" content="width=device-width">` so the page is intended for mobile, but `script.js:315` only listens for `mousedown`. `THREE.DragControls` in older three.js builds is mouse-only — touch dragging needs either a newer DragControls or explicit `touchstart`/`touchmove`/`touchend` handlers wired to the same logic.

Verify on an actual phone:
- Can you drag the head/body/legs cubes to swap them?
- Does tap-to-play sound trigger?
- Do the shuffle / reload buttons respond?

If broken, options are: upgrade DragControls.js, or add a touch shim that maps touch events to synthetic mouse events on the canvas.
