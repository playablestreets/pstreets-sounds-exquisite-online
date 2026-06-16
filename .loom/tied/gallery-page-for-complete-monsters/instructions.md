# gallery-page-for-complete-monsters

**feature** — create a gallery page for browsing completed monsters.

This is stitch-ready but needs fleshing out before implementation.

Intent:
- Let kids browse completed monsters in a gallery format.
- Each gallery item represents one complete creation, not a random pool sample.
- Clicking a gallery item opens the interactive cube website with that monster's
  images and audio preloaded.
- Use the ingest log / association data as the source of truth for reconstructing
  complete monster sets.
- Account for orphaned assets. Some images will not have matching audio, and
  some audio will not have matching images. The gallery should make an explicit
  product decision for these rather than assuming every asset belongs to a full
  image/audio set.

Questions to settle before building:
- What URL shape should open a specific monster? Example: `/?monster=<id>` or
  `/gallery/<id>`.
- Does the current cube app need a deterministic loading mode alongside random
  sampling?
- Should the gallery be static from `manifest.json`, generated at build time
  from ingest logs, or loaded from a separate gallery manifest?
- What should count as a "complete" monster if image and audio counts differ?
- Should orphaned images/audio be browsable in the gallery, hidden until paired,
  shown in a separate "needs audio"/"needs image" state, or used as fallback
  random-pool content only?
