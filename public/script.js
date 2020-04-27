//SCENE
var scene = new THREE.Scene();
const clock = new THREE.Clock();
clock.autoStart = true;

//CAMERA
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 3;

//RENDERER
var renderer = new THREE.WebGLRenderer({ alpha: true });
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
let cubetop = new Cube();
cubetop.position.y = 1.1;

let cubemiddle = new Cube();
cubemiddle.position.y = 0;

let cubebottom = new Cube();
cubebottom.position.y = -1.1;

let cubes = [ cubetop, cubemiddle, cubebottom ];

cubes.map((cube) => {
	scene.add(cube);
});

//------------------------------------------------------------------
//LIGHTS
let ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

let directionalLightRight = new THREE.DirectionalLight(0xffcccc, 1);
directionalLightRight.position.set(200, 350, 250);
// directionalLightRight.castShadow = true;
scene.add(directionalLightRight);

let directionalLightLeft = new THREE.DirectionalLight(0xccccff, 1);
directionalLightLeft.position.set(-200, 350, 250);
// directionalLightLeft.castShadow = true;
scene.add(directionalLightLeft);

//------------------------------------------------------------------
//RAYCASTER AND PICKING
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
mouse.x, (mouse.y = -2);

function onMouseMove(event) {
	// calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components
	mouse.x = event.clientX / window.innerWidth * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function checkForHover() {
	// update the picking ray with the camera and mouse position
	raycaster.setFromCamera(mouse, camera);

	// calculate objects intersecting the picking ray
	let intersects = raycaster.intersectObjects(scene.children);

	//reset all colours
	cubes.map((cube) => {
		cube.material.color.set(0xaaaaaa);
		cube.update(clock);
	});

	//set picked cubes to pink
	for (let i = 0; i < intersects.length; i++) {
		intersects[i].object.material.color.set(0xff00ff);
	}
}

//-----------------------------------------------
//test vars
let testCube = new Cube();
// testCube.announce();
testCube.makeHead();
// testCube.announce();

//-----------------------------------------------
//MAIN RENDER
function render() {
	checkForHover();
	renderer.render(scene, camera);
	requestAnimationFrame(render);

	TWEEN.update();
}

window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('resize', onWindowResize, false);
window.requestAnimationFrame(render);
