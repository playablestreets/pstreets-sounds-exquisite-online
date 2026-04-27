# background-cube-pool

**feature** — *(from colleague request)* "Add boxes in the background that can be dragged into the middle to replace one of the 3 in the stack."

Today there are exactly 3 cubes (head, body, legs) on screen, each showing 6 random faces from the story pool. The shuffle button only spins the active faces; the reload button picks 6 fresh stories.

Proposal: keep a "bench" of N additional cubes off to the side (or behind, smaller / faded), each loaded with a different story face. The user can drag a bench cube into the head/body/legs slot to swap it in; the displaced cube goes back to the bench.

Design questions to settle before building:
- How many bench cubes? 3? 6? More?
- Where do they sit visually? Left/right of the stack? Behind on the Z-axis? A row along the bottom?
- Which body part does each bench cube represent — fixed (3 head bench, 3 body bench, 3 legs bench) or any-cube can-go-any-slot?
- Are bench cubes interactive (tap to play their sound) or purely drag sources?
- Should reload refill the bench too, or only the active stack?

Code touchpoints:
- `script.js:143-159` `createCubes()` — currently hardcodes 3 cubes from 6 stories. Refactor to create N cubes from the available story pool.
- `script.js:161-223` `setupControls` — drag logic uses Y position to assign role; with bench cubes the swap rule needs to look at proximity to the stack region instead.
- `cube.js:111-123` `setTo` / `moveTo` — needs new bench position(s).

Worth scoping out a quick paper sketch with the colleague before coding — visual layout will drive the data model.
