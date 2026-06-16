'use strict';
// utils.js — local content loader + helpers
//
// Content now lives in the site source under assets/content/ (see
// tools/ingest.py). Images and audio are decoupled pools per body part;
// the manifest describes them. Prismic is no longer used.

const contentBase = 'assets/content/';

// Fetch the content manifest and hand it to the callback.
function loadManifest(setDataCallback) {
	let request = new XMLHttpRequest();
	request.open('GET', contentBase + 'manifest.json', true);
	request.onload = function () {
		if (this.status < 200 || this.status >= 300) {
			console.error('loadManifest: failed to load manifest.json, status', this.status);
			return;
		}
		try {
			setDataCallback(JSON.parse(this.response));
		} catch (e) {
			console.error('loadManifest: could not parse manifest.json', e);
		}
	};
	request.onerror = function () {
		console.error('loadManifest: network error loading manifest.json');
	};
	request.send();
}

// Body parts, in head→legs order. Shared by the cube and the gallery.
const PARTS = ['top', 'middle', 'bottom'];

// Per-part placeholder silhouettes (game-icons.net, CC BY 3.0). Used wherever a
// monster is missing an image for a part.
const PLACEHOLDER = {
	top: 'assets/placeholder/top.svg',
	middle: 'assets/placeholder/middle.svg',
	bottom: 'assets/placeholder/bottom.svg',
};

// Group every manifest entry into "creations" (monsters) keyed by `group`.
//
// A creation is one shared stem across parts/kinds. For each part it records the
// asset's relative `file` (e.g. "images/top/pair-001.png") or null when absent.
// Complete monsters have all six slots; orphans have gaps the gallery/cube fill
// with placeholders (image) or remixes (audio).
//
// Returns { byGroup, creations } where creations is sorted complete-first.
function indexManifest(manifest) {
	const byGroup = {};
	const get = (group) => (byGroup[group] || (byGroup[group] = {
		group,
		image: { top: null, middle: null, bottom: null },
		audio: { top: null, middle: null, bottom: null },
	}));

	[['image', manifest.images], ['audio', manifest.audio]].forEach(([kind, pools]) => {
		PARTS.forEach((part) => {
			(pools && pools[part] || []).forEach((e) => {
				get(e.group)[kind][part] = e.file;
			});
		});
	});

	const has = (slots) => PARTS.filter((p) => slots[p]).length;
	const statusOf = (c) => {
		const i = has(c.image), a = has(c.audio);
		if (i === 3 && a === 3) return 'complete';
		if (i && a) return 'partial';
		if (i) return 'image-only';
		return 'audio-only';
	};

	const order = { complete: 0, partial: 1, 'image-only': 2, 'audio-only': 3 };
	const creations = Object.values(byGroup);
	creations.forEach((c) => { c.status = statusOf(c); });
	creations.sort((a, b) =>
		(order[a.status] - order[b.status]) || a.group.localeCompare(b.group));

	return { byGroup, creations };
}

/**
 * Shuffles array in place. ES6 version
 * @param {Array} a items An array containing the items.
 */
function shuffleArray(a) {
	for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}
