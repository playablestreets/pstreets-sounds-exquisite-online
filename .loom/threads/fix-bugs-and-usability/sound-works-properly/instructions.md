# sound-works-properly

**bug** — *(from colleague request)* "Make sure the sound works properly."

Umbrella ask. The known sound-related issues already filed as siblings:
- `audio-buffer-race` — clicking before audio loads throws.
- `soundend-timeout-race` — wall-clock timeout cuts new playback short after rapid clicks or drag-then-click.

Other things to check / verify before tying this off:
- Browser autoplay policy: the Web Audio context may need to be resumed on the first user gesture. Verify `listener.context.state` after page load on Chrome and Safari — if "suspended", call `listener.context.resume()` inside the first click handler.
- iOS Safari is especially strict — confirm sound actually plays on iPhone.
- `cube.js:155` calls `this.sounds[this.activeFace].currentTime = 0;` but `THREE.Audio` doesn't really expose `currentTime` like an HTMLAudioElement — this assignment is silently ignored. To restart from the beginning, call `.stop()` then `.play()` (the existing `stopSound()` already calls stop).
- Volume is hardcoded to 0.9 (`cube.js:40`) — confirm there's no clipping when multiple cubes overlap.
- `mousedown` anywhere on the page calls `stopSound()` on every cube (`script.js:260-274`) — this means clicking the shuffle/reload buttons also kills audio, which may or may not be desired.

Suggest treating this as a parent stitch and decomposing further once the autoplay-policy and currentTime issues are confirmed by testing in real browsers.
