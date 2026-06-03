# results-global-leak

**bug** — `results` accumulates across calls if the API is queried more than once.

`public/utils.js:32-33`:

```js
let totalSize;
let results = [];
```

`results` is module-scoped and never reset. Today `getFromApi` is only called once at startup, so this is latent — but if anyone ever wires up a "refresh stories" button or polling, results from each call will pile up and every story will appear N times.

Fix: reset `results = []` at the top of `getFromApi`, or scope `results` inside it and pass through `requestData` as an accumulator. Same for `totalSize` (which appears unused — probably just delete it).
