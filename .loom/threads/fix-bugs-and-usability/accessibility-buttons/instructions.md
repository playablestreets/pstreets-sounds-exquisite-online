# accessibility-buttons

**ux / a11y** — interactive controls have no accessible names.

`public/index.html:24-32`: shuffle and reload buttons are `<div class="button">` with only Font Awesome `<i>` icons inside. Screen readers announce them as nothing (or "group"); they aren't keyboard-focusable; they don't take Enter/Space.

Fix:
- Use `<button type="button">` instead of `<div>`.
- Add `aria-label="Shuffle"` / `aria-label="Reload stories"`.
- Confirm Tab focus reaches them and Enter triggers the click handler (free with native `<button>`).
- The home and DIY links (`index.html:38-44`) have `alt=""` on `<a>` (alt isn't valid on `<a>`); the inner `<img>` does have alt — that part's fine — but check the link itself has discoverable text or `aria-label`.
