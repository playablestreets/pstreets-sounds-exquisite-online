//SCENE
const scene = new THREE.Scene();

//CAMERA
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 3;

//dragable controls
let controls;
let isDragging = false;

//AUDIO
const listener = new THREE.AudioListener();
camera.add(listener);

//RENDERER
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0); // the default
document.body.appendChild(renderer.domElement);

function onWindowResize(event) {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

//------------------------------------------------------------------
//GEOMETRY
//asset type, asset index, audio listener
let cubeHead;
let cubeBody;
let cubeLegs;
let cubes = [];
let unselectedCubes = [];

//------------------------------------------------------------------
//LIGHTS
let ambientLight = new THREE.AmbientLight(0x111111);


let directionalLightRight = new THREE.PointLight(0x99bbbb, 1);
directionalLightRight.position.set(4, 3, 10);

directionalLightRight.castShadow = true;


let directionalLightLeft = new THREE.PointLight(0xbb99bb, 1);
directionalLightLeft.position.set(-4, -2, 10);
directionalLightLeft.castShadow = true;


//------------------------------------------------------------------
//GET CONTENT DATA
//
// Images and audio are decoupled pools per body part (top/middle/bottom).
// We load the manifest once, then compose fresh random image+sound pairings
// for the six cube faces on every (re)load — nothing ties a given image to a
// given sound, which is the intended behaviour for now.
const bodyParts = ['top', 'middle', 'bottom'];
let content = null; // { images: {top:[url],...}, audio: {top:[url],...} }

// When opened as index.html?monster=<group> from the gallery, this holds the
// chosen monster's per-part assets so face 0 of each cube shows it. The other
// five faces stay random remixes (so shuffling still remixes away from it).
let pinnedFace = null; // { top:{imageLocation,soundLocation}, middle:.., bottom:.. } | null

//LOAD LOCAL MANIFEST
loadManifest(onContentLoaded);

function onContentLoaded(manifest) {
	const toUrls = (arr) => (arr || []).map((a) => contentBase + a.file);
	content = { images: {}, audio: {} };
	bodyParts.forEach((p) => {
		content.images[p] = toUrls(manifest.images && manifest.images[p]);
		content.audio[p] = toUrls(manifest.audio && manifest.audio[p]);
	});

	pinnedFace = resolveMonster(manifest);

	loadNewScene();
}

// Resolve ?monster=<group> into a per-part face. Missing image parts fall back
// to the placeholder silhouette; missing audio parts return null so a random
// pool remix is used instead.
function resolveMonster(manifest) {
	const group = new URLSearchParams(window.location.search).get('monster');
	if (!group) return null;

	const { byGroup } = indexManifest(manifest);
	const c = byGroup[group];
	if (!c) {
		console.warn('resolveMonster: unknown monster group', group);
		return null;
	}

	const face = {};
	bodyParts.forEach((p) => {
		face[p] = {
			imageLocation: c.image[p] ? contentBase + c.image[p] : PLACEHOLDER[p],
			soundLocation: c.audio[p] ? contentBase + c.audio[p] : null,
		};
	});
	return face;
}

// Draw `n` items from a pool, shuffled, cycling through the pool if it holds
// fewer than `n` so every face still gets something.
function drawFromPool(pool, n) {
	const out = [];
	let bag = [];
	for (let i = 0; i < n; i++) {
		if (bag.length === 0) bag = shuffleArray([...pool]);
		out.push(bag.pop());
	}
	return out;
}

// Build six face "stories", each an independently sampled image + sound per part.
function buildFaceStories() {
	const imgs = {};
	const snds = {};
	bodyParts.forEach((p) => {
		imgs[p] = drawFromPool(content.images[p], 6);
		snds[p] = drawFromPool(content.audio[p], 6);
	});

	const faceStories = [];
	for (let i = 0; i < 6; i++) {
		const story = {};
		bodyParts.forEach((p) => {
			let imageLocation = imgs[p][i];
			let soundLocation = snds[p][i];
			// Face 0 shows the pinned monster (if any). Keep the random sound as
			// a remix when the monster has no audio for this part.
			if (i === 0 && pinnedFace) {
				imageLocation = pinnedFace[p].imageLocation;
				if (pinnedFace[p].soundLocation) soundLocation = pinnedFace[p].soundLocation;
			}
			story[p] = { imageLocation, soundLocation, text: '...' };
		});
		faceStories.push(story);
	}
	return faceStories;
}

function loadNewScene(){
	clearScene();
	createCubes();
	createScene();
	setupControls();
}

function createCubes(){
	const ready = content && bodyParts.every(
		(p) => content.images[p].length > 0 && content.audio[p].length > 0);
	if (!ready) {
		console.warn('createCubes: content pools incomplete, skipping cube creation');
		return;
	}

	const faceStories = buildFaceStories();

	cubeHead = new Cube(0, faceStories, listener);
	cubeHead.setTo('head');
	cubeBody = new Cube(1, faceStories, listener);
	cubeBody.setTo('body');
	cubeLegs = new Cube(2, faceStories, listener);
	cubeLegs.setTo('legs');
	cubes = [ cubeHead, cubeBody, cubeLegs ];

}

function setupControls(){
	controls = new THREE.DragControls([ ...cubes ], camera, renderer.domElement);

	controls.addEventListener('drag', function(event) {
		if (isDragging) {
			unselectedCubes.map((cube) => {
				cube.fadeOut();
			});

			isDragging = false;
		}

		let targetPos;

		if (event.object.position.y < -0.5) {
			targetPos = 'legs';
		}
		else if (event.object.position.y > 0.5) {
			targetPos = 'head';
		}
		else {
			targetPos = 'body';
		}

		unselectedCubes.map((cube) => {
			if (cube.role === targetPos) {
				cube.setTo(event.object.role);
				event.object.role = targetPos;
			}
		});
	});

	controls.addEventListener('dragstart', function(event) {
		isDragging = true;

		event.object.onDragStart();
		cubes.map((cube) => {
			cube.stopSound();
			if (event.object !== cube) {
				unselectedCubes.push(cube);
			}
		});
	});

	controls.addEventListener('dragend', function(event) {
		event.object.onDragStop();

		unselectedCubes.map((cube) => {
			cube.fadeIn();
		});

		unselectedCubes = [];
	});
}


function clearScene(){
	if(controls != null)
		controls.dispose();
	while( scene.children.length ){
		if(scene.children[0].children[0] instanceof Cube){
			scene.children[0].children[0].stopSound();
		}
		scene.remove( scene.children[0]);
	}
}

function createScene(){
	scene.add(ambientLight);
	scene.add(directionalLightRight);
	scene.add(directionalLightLeft);
	cubes.map((cube) => {
		scene.add(cube.parent);
	});
}





// stop all cube sounds whenever the user interacts with the page
function onMouseDown(event) {
	cubes.map((cube) => {
		cube.stopSound();
	});
}

function shuffle() {
	cubes.map((cube) => {
		cube.randomizeFace();
	});
}

//-----------------------------------------------
//MAIN RENDER
function render() {
	renderer.render(scene, camera);
	requestAnimationFrame(render);
	TWEEN.update();
}

document.getElementById('shufflebutton').onclick = shuffle;
document.getElementById('reloadbutton').onclick = loadNewScene;
window.addEventListener('mousedown', onMouseDown, false);
window.addEventListener('resize', onWindowResize, false);
window.requestAnimationFrame(render);
