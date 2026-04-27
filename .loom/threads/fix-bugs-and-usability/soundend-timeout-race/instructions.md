# soundend-timeout-race

**bug** — rapid repeat clicks on a cube can cut sound off early.

`public/cube.js:132-140` `onClick()`:

```js
onClick() {
    this.play();
    let duration = this.getCurrentDuration();
    let that = this;
    this.soundEndCallback = setTimeout(function() {
        that.stopSound();
    }, duration);
}
```

`play()` does NOT call `stopSound()` first — it just restarts the audio. So if the previous play was started by a non-`onClick` path (e.g. drag-end auto-play in `onDragStop`), the prior `setTimeout` is still live; when the user then clicks again, the new play starts but the *old* timeout fires partway through and cuts the new audio off early.

Fix: either call `stopSound()` (which clears any pending timeout via `clearTimeout(this.soundEndCallback)`) at the top of `onClick`/`play`, or — better — use the underlying `Audio.onended` event from Web Audio rather than a wall-clock `setTimeout`.
