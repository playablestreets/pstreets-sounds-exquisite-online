# ui-translucent-band

**ux** — faint magenta band sits at the bottom of the screen.

`public/style.css:158`:

```css
.ui {
    ...
    background-color: rgba(139, 0, 139, 0.118);
}
```

`.ui` is positioned bottom: 0, full width, with a translucent purple background. It's currently just an empty container (the `.ui-top` block has its own children); the bottom `.ui` wraps no visible content but still paints a horizontal magenta strip across the bottom of the page over the background art.

Fix: either remove the background-color (most likely the intent — it was probably a debug aid) or remove the empty `.ui` instance entirely if no content is going there.
