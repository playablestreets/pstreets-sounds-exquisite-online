//CUBE DEFINITION
function Cube() {
  this.x = -2;
  this.y = -2;
  this.z = 0;
  this._fsm(); //init statemachine
}

Cube.prototype = {
  announce: function () {
    console.log(
      "pos is " +
        this.x +
        " " +
        this.y +
        " " +
        this.z +
        ", state is  " +
        this.state
    );
  },
};

StateMachine.factory(Cube, {
  init: "unselected",
  transitions: [
    { name: "makeHead", from: ["unselected", "body", "legs"], to: "head" },
    { name: "makeBody", from: ["unselected", "head", "legs"], to: "body" },
    { name: "makeLegs", from: ["unselected", "head", "body"], to: "legs" },
    {
      name: "makeUnselected",
      from: ["head", "body", "legs"],
      to: "unselected",
    },
  ],
  methods: {
    onMakeHead: function () {
      console.log("made into head");
    },
    onMakeBody: function () {
      console.log("made into body");
    },
    onMakeLegs: function () {
      console.log("made into legs");
    },
    onMakeUnselected: function () {
      console.log("made into unselected");
    },
  },
});

//SCENE
var scene = new THREE.Scene();

//CAMERA
var camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 3;

//RENDERER
var renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0); // the default
document.body.appendChild(renderer.domElement);

//GEOMETRY
//boxes
var cubetop = new THREE.Mesh(
  new THREE.BoxGeometry(),
  new THREE.MeshStandardMaterial({ color: 0xaaaaaa })
);
// cubetop.castShadow = true;
cubetop.position.y = 1.1;
scene.add(cubetop);

var cubemiddle = new THREE.Mesh(
  new THREE.BoxGeometry(),
  new THREE.MeshStandardMaterial({ color: 0xaaaaaa })
);

cubemiddle.position.y = 0;
scene.add(cubemiddle);

var cubebottom = new THREE.Mesh(
  new THREE.BoxGeometry(),
  new THREE.MeshStandardMaterial({ color: 0xaaaaaa })
);

cubebottom.position.y = -1.1;
scene.add(cubebottom);

var cubes = [cubetop, cubemiddle, cubebottom];

//LIGHTS
var ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

var directionalLightRight = new THREE.DirectionalLight(0xffcccc, 1);
directionalLightRight.position.set(200, 350, 250);
// directionalLightRight.castShadow = true;
scene.add(directionalLightRight);

var directionalLightLeft = new THREE.DirectionalLight(0xccccff, 1);
directionalLightLeft.position.set(-200, 350, 250);
// directionalLightLeft.castShadow = true;
scene.add(directionalLightLeft);

//RAYCASTER
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
mouse.x, (mouse.y = -2);

function onMouseMove(event) {
  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onWindowResize(event) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function checkForHover() {
  // update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);

  // calculate objects intersecting the picking ray
  var intersects = raycaster.intersectObjects(scene.children);

  //reset all colours
  cubes.map((cube) => {
    cube.material.color.set(0xaaaaaa);
  });

  //set picked cubes to pink
  for (var i = 0; i < intersects.length; i++) {
    intersects[i].object.material.color.set(0xff00ff);
  }
}


//-----------------------------------------------
//test vars
var testCube = new Cube();
testCube.announce();
testCube.makeHead();
testCube.announce();


//-----------------------------------------------
//MAIN RENDER
function render() {
  checkForHover();
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

window.addEventListener("mousemove", onMouseMove, false);
window.addEventListener("resize", onWindowResize, false);
window.requestAnimationFrame(render);
