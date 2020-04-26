//CUBE DEFINITION
class Cube  extends THREE.Mesh{
  constructor() {
   
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial({ color: 0xaaaaff });
    
    super(geometry, material);

    this._fsm(); //init statemachine
  }

  announce() {
    console.log(
      "pos is " + this.position + ", and state is  " + this.state
    );
  }

}

// Cube.prototype = {
//   announce: function () {
//     console.log("pos is " + this.box.position + ", state is  " + this.state);
//   },
// };

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
