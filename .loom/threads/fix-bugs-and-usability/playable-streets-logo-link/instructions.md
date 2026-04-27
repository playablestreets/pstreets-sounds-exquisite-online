# playable-streets-logo-link

**feature** — *(from colleague request)* "Add a Playable Streets logo that links to www.playablestreets.com."

Today the top-left link in `public/index.html:38-40` points to `playableweb.com` using `assets/home01.svg`. The colleague wants a Playable Streets logo specifically, linking to playablestreets.com.

Decisions to make:
- Replace the existing playableweb home icon, or add a separate one alongside it?
- Where does the logo sit? Same top-left bar, or a new corner?
- Does the colleague have a logo asset, or do we need one made? (Check `public/assets/` — likely not present.)
- Should the link open in a new tab (`target="_blank" rel="noopener"`) — for an outbound site link, yes.

Implementation:
- Drop the SVG / PNG into `public/assets/`.
- Add an `<a href="https://www.playablestreets.com" target="_blank" rel="noopener" aria-label="Playable Streets">` with an `<img>` inside, in the `.ui-top` container.
- Make sure the new icon respects the existing `.icon` sizing (`style.css:182-189`) or add a variant class.

Confirm with the colleague: do they want this *in addition to* the existing playableweb link, or *replacing* it?
