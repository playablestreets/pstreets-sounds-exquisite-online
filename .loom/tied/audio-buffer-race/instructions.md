# audio-buffer-race

**bug** — clicking a cube before its sound finishes loading throws.

`public/cube.js:226-228`:

```js
getCurrentDuration() {
    return this.sounds[this.activeFace].buffer.duration * 1000;
}
```

`sound.buffer` is `null` until the `audioLoader.load(...)` callback fires (`cube.js:38-43`). If a user clicks a cube before its audio asset has loaded, `play()` runs and `getCurrentDuration()` is called from `onClick` (`cube.js:132-140`) and throws `Cannot read properties of null (reading 'duration')`.

There's a `sound.hasLoaded = false` line on `cube.js:36` and a commented-out `sound.hasLoaded = true` in the load callback (line 41) suggesting this was already on someone's radar.

Fix:
- Uncomment / restore the `sound.hasLoaded = true` flag inside the load callback.
- In `play()` and `getCurrentDuration()`, bail early if `!sound.hasLoaded` (or `!sound.buffer`).
- Optionally: disable cube interaction or show a "loading audio" cue until all 18 sounds are loaded.
