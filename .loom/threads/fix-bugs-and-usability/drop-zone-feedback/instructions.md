# drop-zone-feedback

**ux** — no visual cue while dragging a cube tells the user where it will land.

`public/script.js:179-187` decides drop position purely by Y threshold (`< -0.5`, `> 0.5`, else body) at drag-end. During the drag, the other cubes do fade out (good) but nothing indicates *which* slot the cube being dragged will snap to if released right now.

Suggestions (pick one):
- Highlight the target slot's currently-occupying cube in a different colour while dragged-over.
- Show a faint "ghost" outline at -1, 0, 1 Y positions so the slot grid is visible.
- Snap the dragged cube's preview to the nearest slot continuously, so release just commits the visible state.

Especially valuable on touch where users have less precision than with a mouse.
