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
const faceStories = [];
let hasLoaded = false;

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
	

	data.forEach((item) => {
		// console.log("parsing...", item);
		let newStory = {...story};
		let newTop = {...part};
		let newMiddle = {...part};
		let newBottom = {...part};

		newStory.uid = item.uid;
		if(prismicArrayExists(item.data.title))
			newStory.title = 	item.data.title[0].text;
		if(prismicArrayExists(item.data.name))
			newStory.author = 	item.data.name[0].text;
		if(item.data.postcode != null)
			newStory.postcode  = 	item.data.postcode;
		if(item.data.age != null)
			newStory.age = item.data.age;
		
		newTop.imageLocation = item.data.top_image.url;
		newTop.soundLocation = item.data.top_sound.url;
		newTop.text = item.data.top_text[0] ? item.data.top_text[0].text : "...";
		
		newMiddle.imageLocation = item.data.middle_image.url;
		newMiddle.soundLocation = item.data.middle_sound.url;
		newMiddle.text = item.data.middle_text[0] ? item.data.middle_text[0].text : "...";
		
		newBottom.imageLocation = item.data.bottom_image.url;
		newBottom.soundLocation = item.data.bottom_sound.url;
		newBottom.text = item.data.bottom_text[0] ? item.data.bottom_text[0].text : "...";
		
		newStory.top = newTop;
		newStory.middle = newMiddle;
		newStory.bottom = newBottom;

		stories.push(newStory);
	});
	

	loadNewScene();


}

function loadNewScene(){
	hasLoaded = false;
	clearScene();
	//create cubes
	createCubes();
	
	createScene();
	//set loaded to true
	hasLoaded = true;
	setupControls();
}

function createCubes(){
	let tempStories = JSON.parse(JSON.stringify(stories));
	shuffleArray(tempStories);
	const faceStories = [];
	for(let i = 0; i < 6; i++){
		faceStories.push(tempStories.pop());
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
	controls.addEventListener('drag', render);
	
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
}


function clearScene(){
	if(controls != null)
		controls.dispose();
	while( scene.children.length ){
		if(scene.children[0].children[0] instanceof Cube){
			console.log('stopping!');
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





//------------------------------------------------------------------
//RAYCASTER AND PICKING
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
// mouse.x, (mouse.y = -2);




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
