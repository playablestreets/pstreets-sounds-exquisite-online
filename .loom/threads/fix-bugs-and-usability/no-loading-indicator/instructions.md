# no-loading-indicator

**ux** — between page load and the first cube appearing, the user sees only the background.

The Prismic fetch + texture/audio loads can take several seconds on a slow connection. There's no spinner, no "loading…" text, no skeleton. New users may think the page is broken.

Options:
- Simple CSS spinner / "Loading stories…" text in the center of the screen, hidden once `loadNewScene()` finishes (just before `hasLoaded = true`).
- Use the `hasLoaded` flag (currently set but never read — see `dead-code-cleanup`) to drive the indicator.
- Disable the shuffle/reload buttons until loaded so they can't be pressed mid-load.
