# cursor-sticking-on-drag

**bug** — *(from colleague request)* "Stop the cursor from sticking when you click a box to move it."

Reported behaviour: when the user clicks a cube to drag, the cursor or the cube appears to "stick" — likely the cube remains attached to the pointer after release, or the pointer keeps the grab/grabbing cursor after dragend.

Where to look:
- `public/script.js:200-222` `dragstart` / `dragend` handlers — confirm `dragend` always fires (e.g. if pointer leaves the canvas mid-drag, three.js DragControls in older versions can fail to release).
- `public/cube.js:230-242` `onDragStart` / `onDragStop` — `onDragStop` calls `onClick()` if `position.equals(dragStartPos)`, which then plays sound. If a tiny micro-drag happens, this may surprise the user.
- CSS cursor: no `cursor: grab/grabbing` rules currently — but the body / canvas may inherit the wrong cursor while a tween is mid-flight.

Repro steps to capture:
- Click and immediately release on a cube — does the cube briefly "stick" to the pointer?
- Click, drag off the canvas, release outside — does the cube release? Does the cursor reset?
- Try at high vs low frame rates (the `double-render-loop` issue may make this worse).

Possible fixes:
- Add a `pointercancel` / `mouseleave` handler on the canvas that calls the same path as `dragend`.
- Reset `isDragging` and clear `unselectedCubes` defensively at the start of every `dragstart`.
- Set explicit `cursor: grab` on the canvas and `cursor: grabbing` while `isDragging`.

Related: `double-render-loop` (perf can make sticking feel worse), `no-touch-event-support` (sticking on touch is a separate code path).
