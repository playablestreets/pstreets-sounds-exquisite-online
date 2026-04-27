# luma-blue-coefficient

**bug** — wrong constant in luma calculation.

`public/utils.js:76`:

```js
let luma = r * 0.299 + g * 0.587 + b * 0.0114;
```

The blue coefficient should be `0.114`, not `0.0114`. Standard Rec. 601 luma weights are 0.299 + 0.587 + 0.114 = 1.0. As written, blue contributes ~10× too little and the output is dimmer than intended.

Note: this function appears to be unused right now (relies on a p5-style `img.get()`/`pixels` API that isn't in this project), so the bug is latent. Either fix the constant or delete the function — see `dead-code-cleanup`.
