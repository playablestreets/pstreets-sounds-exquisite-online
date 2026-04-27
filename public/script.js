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
//GET STORIES DATA
const stories = [];

//CALL PRISMIC API
getFromApi("sounds_exquisite", dataCallback);

//SET DYNAMIC DATA FROM PRISMIC
function dataCallback(data) {
	const part = {
		imageLocation: null,
		soundLocation: null,
		text: null
	};
	
	const story = {
		uid: null,
		title: null,
		author: null,
		age: null,
		top: {...part},
		middle: {...part},
		bottom: {...part},
	}
	

	data.forEach((item) => {
		if (item == null || item.data == null) return;

		let newStory = {...story};
		let newTop = {...part};
		let newMiddle = {...part};
		let newBottom = {...part};

		newStory.uid = item.uid;
		if(prismicArrayExists(item.data.title))
			newStory.title = item.data.title[0].text;
		if(prismicArrayExists(item.data.name))
			newStory.author = item.data.name[0].text;
		if(item.data.postcode != null)
			newStory.postcode = item.data.postcode;
		if(item.data.age != null)
			newStory.age = item.data.age;

		newTop.imageLocation = prismicUrl(item.data.top_image);
		newTop.soundLocation = prismicUrl(item.data.top_sound);
		newTop.text = prismicText(item.data.top_text);

		newMiddle.imageLocation = prismicUrl(item.data.middle_image);
		newMiddle.soundLocation = prismicUrl(item.data.middle_sound);
		newMiddle.text = prismicText(item.data.middle_text);

		newBottom.imageLocation = prismicUrl(item.data.bottom_image);
		newBottom.soundLocation = prismicUrl(item.data.bottom_sound);
		newBottom.text = prismicText(item.data.bottom_text);

		// require all three parts to have an image and a sound; skip half-finished stories
		if (newTop.imageLocation == null || newTop.soundLocation == null ||
			newMiddle.imageLocation == null || newMiddle.soundLocation == null ||
			newBottom.imageLocation == null || newBottom.soundLocation == null) {
			return;
		}

		newStory.top = newTop;
		newStory.middle = newMiddle;
		newStory.bottom = newBottom;

		stories.push(newStory);
	});
	

	loadNewScene();


}

function loadNewScene(){
	clearScene();
	createCubes();
	createScene();
	setupControls();
}

function createCubes(){
	if (stories.length === 0) {
		console.warn('createCubes: no stories available, skipping cube creation');
		return;
	}

	let shuffled = JSON.parse(JSON.stringify(stories));
	shuffleArray(shuffled);

	// pad by cycling through what we have if fewer than 6 stories exist
	const faceStories = [];
	for (let i = 0; i < 6; i++) {
		faceStories.push(shuffled[i % shuffled.length]);
	}

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
