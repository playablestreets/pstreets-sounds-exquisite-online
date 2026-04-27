# animated-background-characters

**feature** — *(from colleague request)* "Animate the background with characters that are created by the three box combinations — one character running across the landscape, in and out of leaves etc."

Idea: as the user assembles a head/body/legs combination from the cubes, that exact 3-part character "comes to life" in the background scene — running across the SVG landscape, ducking behind foliage, etc.

Open questions:
- Single character at a time, or multiple characters from past combinations layered in?
- 2D sprite (composite the three face textures into a vertical strip and translate across screen) or 3D (a second smaller cube-stack puppet that walks)?
- Trigger: continuous (always one running) or on-event (start when user changes a face / presses shuffle)?
- Path: simple left-to-right loop, or a winding path through the SVG background's foliage layers?
- How do the "leaves etc." parallax / occlude — does the background SVG need to be split into front/back layers to allow the character to pass behind elements?

Likely architecture:
- Use the same face textures already loaded on the cubes — composite into a sprite plane (`THREE.PlaneGeometry` + `MeshBasicMaterial`) sized for a small character.
- Animate position via TWEEN (already in the project) along a path; tween scale slightly for a bob.
- For occlusion, the background `.bg` div would need to become a layered scene — either:
  - Split background.svg into back / mid / front layers, render character between them as DOM/CSS, OR
  - Move the background into the three.js scene as textured planes at different Z depths and let the character plane sit between them.

Big feature — worth decomposing into child stitches once the design is locked. Suggested children: pick 2D-vs-3D approach, layer the background, build the character composite, build the path/animation, hook up trigger.
