//CUBE DEFINITION
class Cube  extends THREE.Mesh{
  constructor() {
   
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial({ color: 0xaaaaff });
    
    super(geometry, material);

    this._fsm(); //init statemachine
    // this.currentRotation = { x: 0, y: 0, z: 0 };
    // this.targetRotation = { x: 0, y: 360, z: 0 };

    // let tween = new TWEEN.Tween(this.currentRotation).to(this.targetRotation, 2000);

    // tween.onUpdate(function(){
    //   // this.rotation._x = this.currentRotation.x;
    //   // this.rotation._y = this.currentRotation.y;
    //   // this.rotation._z = this.currentRotation.z;
    // });

    // tween.easing(TWEEN.Easing.Elastic.InOut);

    // tween.start();
    // tween.chain(tween);
  }

  announce() {
    console.log(
      "pos is " + this.position + ", and state is  " + this.state
    );
  }
  
  update(clock){
    this.rotation.y = Math.sin(clock.getElapsedTime() * 1.7 + (this.position.y) ) *  1/4;
    // console.log(clock.getElapsedTime());
  }

}


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
      this.announce();
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
