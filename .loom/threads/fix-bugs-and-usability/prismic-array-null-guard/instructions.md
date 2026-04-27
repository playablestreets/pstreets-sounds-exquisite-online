# prismic-array-null-guard

**bug** — `prismicArrayExists` and the data parser assume Prismic fields exist.

`public/utils.js:59`:

```js
function prismicArrayExists(a){
    return( a.length > 0 && a[0].text != null );
}
```

If `a` is `null` or `undefined` (a missing Prismic field), `a.length` throws `TypeError: Cannot read properties of null`.

In `public/script.js:97-116`:
- `item.data.title`, `item.data.name`, `item.data.top_text`, `item.data.middle_text`, `item.data.bottom_text` are passed to `prismicArrayExists` or accessed with `[0]` directly.
- `item.data.top_image.url`, `item.data.top_sound.url` (and middle/bottom equivalents) are dereferenced without null checks. If a content editor leaves any of these blank in Prismic, the whole story load crashes.

Fix:
- `prismicArrayExists` should `return Array.isArray(a) && a.length > 0 && a[0].text != null;`.
- Guard each `*_image` / `*_sound` access (`item.data.top_image?.url ?? null`) and skip stories that are missing required assets, or substitute placeholders.
