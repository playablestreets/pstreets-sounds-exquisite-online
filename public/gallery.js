'use strict';
// gallery.js — browse every monster (complete + orphan) and open one in the cube.
//
// A tile is a stacked top/middle/bottom thumbnail that links to
// index.html?monster=<group>. Missing image parts fall back to a recolourable
// placeholder silhouette; missing audio is handled later by the cube (remix).

// Cache the placeholder SVG markup so we can inline it and let CSS `color`
// (currentColor) tint each one per tile.
const placeholderSvg = {};

function fetchPlaceholders() {
	return Promise.all(PARTS.map((part) =>
		fetch(PLACEHOLDER[part])
			.then((r) => (r.ok ? r.text() : ''))
			.then((svg) => { placeholderSvg[part] = svg; })
			.catch(() => { placeholderSvg[part] = ''; })
	));
}

function partSlot(part, file) {
	const slot = document.createElement('div');
	slot.className = 'slot slot-' + part;
	if (file) {
		const img = document.createElement('img');
		img.src = contentBase + file;
		img.alt = '';
		img.loading = 'lazy';
		slot.appendChild(img);
	} else {
		slot.classList.add('slot-placeholder');
		slot.innerHTML = placeholderSvg[part] || '';
	}
	return slot;
}

function tileFor(c, i) {
	const a = document.createElement('a');
	a.className = 'tile';
	a.href = 'index.html?monster=' + encodeURIComponent(c.group);
	a.style.setProperty('--i', i); // drives palette + wonk via CSS

	const stack = document.createElement('div');
	stack.className = 'stack';
	PARTS.forEach((p) => stack.appendChild(partSlot(p, c.image[p])));
	a.appendChild(stack);
	return a;
}

function render(manifest) {
	const { creations } = indexManifest(manifest);
	const grid = document.getElementById('gallery');
	const frag = document.createDocumentFragment();
	creations.forEach((c, i) => frag.appendChild(tileFor(c, i)));
	grid.innerHTML = '';
	grid.appendChild(frag);
}

fetchPlaceholders().then(() => loadManifest(render));
