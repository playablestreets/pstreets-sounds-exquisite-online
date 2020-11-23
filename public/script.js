//SCENE
const scene = new THREE.Scene();
const clock = new THREE.Clock();
clock.autoStart = true;

//CAMERA
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 3;
// camera.position.y = -0.25;

//dragable controls
let controls;
let isDragging = false;
let draggedFrom = null;
//audio / drag toggle

//AUDIO
// create an AudioListener and add it to the camera
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



let bodyparts;
//------------------------------------------------------------------
//CALL PRISMIC API
getFromApi("sounds_exquisite", dataCallback); //returns to setKidstruments()

//SET DYNAMIC DATA FROM PRISMIC
function dataCallback(data) {
	// console.log(data);
	
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
	
	const stories = [];

	data.forEach((item) => {
		// console.log(item);
		let newStory = {...story};
		
		
		newStory.uid = item.uid;
		newStory.title = 	item.data.title[0].text;
		newStory.author = 	item.data.name[0].text;
		newStory.postcode  = 	item.data.postcode;
		newStory.age = item.data.age;
		
		newStory.top.imageLocation = item.data.top_image.url;
		newStory.top.soundLocation = item.data.top_sound.url;
		newStory.top.text = item.data.top_text[0] ? item.data.top_text[0].text : "...";
		
		newStory.middle.imageLocation = item.data.middle_image.url;
		newStory.middle.soundLocation = item.data.middle_sound.url;
		newStory.middle.text = item.data.middle_text[0] ? item.data.middle_text[0].text : "...";
		
		newStory.bottom.imageLocation = item.data.bottom_image.url;
		newStory.bottom.soundLocation = item.data.bottom_sound.url;
		newStory.bottom.text = item.data.bottom_text[0] ? item.data.bottom_text[0].text : "...";
		
		// console.log(newStory);
		stories.push(newStory);
	});
	
	console.log(stories);
	

	{
		
		// let i = 1;
		// instruments.forEach((inst) => {
		// 	inst.index = i++;
		// } );
		
		// currentInstrument = int(random() * instruments.length);
		// console.log(instruments);
		// instruments = shuffle(instruments);
		// instrumentsFound = true;
		
		//TODO reimplement URL finding
		// let urlName = getUrlName();
		// if (urlName != '') {
		// 	for (let index = 0; index < instruments.length; index++) {
		// 		if (instruments[index].uid.toLowerCase() == urlName) {
		// 			currentInstrument = index;
		// 			console.log('loading ' + instruments[currentInstrument].uid);
		// 			break;
		// 		}
		// 	}
		// }
		
		// loadInstrument();
		
		//resize window to init
		// windowResized();
	}
}





//------------------------------------------------------------------
//GEOMETRY
//asset type, asset index, audio listener
let cubeHead = new Cube(0, bodyparts, listener);
// cubeHead.position.y = 1.0;

let cubeBody = new Cube(1, bodyparts, listener);
// cubeBody.position.y = 0;

let cubeLegs = new Cube(2, bodyparts, listener);
// cubeLegs.position.y = -1.0;

let cubes = [ cubeHead, cubeBody, cubeLegs ];

let unselectedCubes = [];

cubes.map((cube) => {
	scene.add(cube.parent);
});

//------------------------------------------------------------------
//LIGHTS
let ambientLight = new THREE.AmbientLight(0x111111);
scene.add(ambientLight);

let directionalLightRight = new THREE.PointLight(0x99bbbb, 1);
directionalLightRight.position.set(4, 3, 10);

directionalLightRight.castShadow = true;
scene.add(directionalLightRight);

let directionalLightLeft = new THREE.PointLight(0xbb99bb, 1);
directionalLightLeft.position.set(-4, -2, 10);
directionalLightLeft.castShadow = true;
scene.add(directionalLightLeft);

//------------------------------------------------------------------
//RAYCASTER AND PICKING
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
mouse.x, (mouse.y = -2);
controls = new THREE.DragControls([ ...cubes ], camera, renderer.domElement);
controls.addEventListener('drag', render);

function onMouseMove(event) {
	// calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components
	// mouse.x = event.clientX / window.innerWidth * 2 - 1;
	// mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
	// if (isDragging) {
	// 	unselectedCubes.map((cube) => {
	// 		cube.fadeOut();
	// 	});
	// 	isDragging = false;
	// }
}

controls.addEventListener('drag', function(event) {
	mouse.x = event.clientX / window.innerWidth * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
	
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
		// cube.fadeIn();
		// console.log(cube.role);
		if (cube.role === targetPos) {
			cube.setTo(event.object.role);
			event.object.role = targetPos;
			// console.log(cube.role);
		}
	});
});

controls.addEventListener('dragstart', function(event) {
	isDragging = true;
	
	event.object.onDragStart();
	// draggedFrom = event.object.position.y;
	// event.object.setMatColor( 0xaaaaaa );
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

function onMouseDown(event) {
	// // update the picking ray with the camera and mouse position
	// raycaster.setFromCamera(mouse, camera);
	
	// // calculate objects intersecting the picking ray
	// let intersects = raycaster.intersectObjects(scene.children);
	
	cubes.map((cube) => {
		cube.stopSound();
	});
	
	// for (let i = 0; i < intersects.length; i++) {
	// 	intersects[i].object.onClick();
	// }
}

function checkForHover() {
	// update the picking ray with the camera and mouse position
	raycaster.setFromCamera(mouse, camera);
	
	// calculate objects intersecting the picking ray
	let intersects = raycaster.intersectObjects(scene.children);
	
	//reset all colours
	cubes.map((cube) => {
		cube.setMatColor(0xaaaaaa);
		// cube.update(clock);
	});
	
	//set picked cubes to pink
	for (let i = 0; i < intersects.length; i++) {
		intersects[i].object.setMatColor(0xdd99dd);
	}
}

function shuffle() {
	cubes.map((cube) => {
		cube.randomizeFace();
	});
}

//-----------------------------------------------
//MAIN RENDER
function render() {
	// checkForHover();
	
	renderer.render(scene, camera);
	requestAnimationFrame(render);
	
	TWEEN.update();
}

document.getElementById('shufflebutton').onclick = shuffle;
// document.addEventListener('click', onClick, false);
window.addEventListener('mousedown', onMouseDown, false);
// window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('resize', onWindowResize, false);
window.requestAnimationFrame(render);
