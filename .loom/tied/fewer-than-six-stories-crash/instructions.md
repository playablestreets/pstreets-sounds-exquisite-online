# fewer-than-six-stories-crash

**bug** — app crashes if Prismic returns fewer than 6 stories.

`public/script.js:143-159` `createCubes()`:

```js
let tempStories = JSON.parse(JSON.stringify(stories));
shuffleArray(tempStories);
const faceStories = [];
for(let i = 0; i < 6; i++){
    faceStories.push(tempStories.pop());
}
```

If `stories.length < 6`, `tempStories.pop()` returns `undefined` for the remaining iterations. Then in `cube.js:24-27`, `faceStory[bodypart].imageLocation` throws `TypeError: Cannot read properties of undefined`.

Fix options:
- Show a friendly message ("need at least 6 stories to play") and bail.
- Cycle/repeat available stories to pad to 6.

Pick whichever matches the editorial intent — pad-and-repeat is probably friendlier for early-state Prismic content.
