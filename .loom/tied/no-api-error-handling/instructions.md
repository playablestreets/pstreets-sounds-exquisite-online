# no-api-error-handling

**bug / ux** — Prismic / network failures are silent.

`public/utils.js:8-30` `getFromApi()` and `requestData()` only set `request.onload`. There's no `onerror`, no non-2xx check, no JSON.parse try/catch. If Prismic is down or the response is malformed:
- `JSON.parse(this.response)` throws and is swallowed.
- `loadNewScene()` is never called.
- The user sees the background image and… nothing else, forever.

Fix:
- Add `request.onerror` and check `request.status` in `onload`.
- Wrap `JSON.parse` in try/catch.
- Surface a visible error in the DOM (e.g. "Couldn't load stories — try refreshing").

Bonus: switch the two XHRs to `fetch()` while you're in there — much shorter.
