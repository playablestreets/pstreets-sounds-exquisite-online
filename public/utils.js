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
