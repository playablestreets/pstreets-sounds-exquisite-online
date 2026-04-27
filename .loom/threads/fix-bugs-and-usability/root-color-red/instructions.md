# root-color-red

**cleanup** — `:root { color: red; }` is suspicious.

`public/style.css:61-65`:

```css
:root{
  color: red;
  font-family: Arial, Helvetica, sans-serif;
}
```

Setting the inherited text color to red at `:root` looks like leftover debugging. The page has almost no visible text content right now so it's not noticeable, but any text that *is* added (loading message, error states, future captions) would inherit bright red until explicitly overridden.

Either remove the `color: red;` line, or set it to something deliberate (`color: #fff` or whatever fits the design).
