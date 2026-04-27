# double-render-loop

**bug** — `render()` schedules itself recursively, and is *also* called on every drag event.

`public/script.js:303-310`:

```js
function render() {
    renderer.render(scene, camera);
    requestAnimationFrame(render);
    TWEEN.update();
}
```

Then `script.js:163` adds `controls.addEventListener('drag', render);` — every drag event kicks off another `requestAnimationFrame(render)` loop in addition to the one already running. Each drag session can multiply the number of concurrent rAF loops, leading to duplicate renders per frame and progressively worse perf the more you interact.

Fix: the drag listener should not call `render` itself — the existing rAF loop already redraws every frame. Either remove that listener entirely, or split into a separate `renderOnce()` (no rAF) if you ever want to render outside the loop.
