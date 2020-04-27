//CUBE DEFINITION
class Cube extends THREE.Mesh {
	constructor() {
		const geometry = new THREE.BoxGeometry();
		const material = new THREE.MeshStandardMaterial({ color: 0xaaaaff });

		super(geometry, material);

		this._fsm(); //init statemachine
		// this.currentRotation = { x: 0, y: 0, z: 0 };
		this.rightRotation = { x: 0, y: -1 / 3, z: -1/16 };
		this.leftRotation = { x: 0, y: 1 / 3, z: 1/16 };

		let tween1 = new TWEEN.Tween(this.rotation)
			.to(this.leftRotation, 1500)
			.easing(TWEEN.Easing.Quadratic.InOut)
			.start();

		let tween2 = new TWEEN.Tween(this.rotation)
			.to(this.rightRotation, 1500)
			.easing(TWEEN.Easing.Quadratic.InOut);

		tween1.chain(tween2);
		tween2.chain(tween1);
	}

	announce() {
		console.log('pos is ' + this.position + ', and state is  ' + this.state);
	}

	update(clock) {
		// this.rotation.y = Math.sin(clock.getElapsedTime() * 1.5 + this.position.y) * 1 / 12;
		// console.log(clock.getElapsedTime());
	}
}

StateMachine.factory(Cube, {
	init: 'unselected',
	transitions: [
		{ name: 'makeHead', from: [ 'unselected', 'body', 'legs' ], to: 'head' },
		{ name: 'makeBody', from: [ 'unselected', 'head', 'legs' ], to: 'body' },
		{ name: 'makeLegs', from: [ 'unselected', 'head', 'body' ], to: 'legs' },
		{
			name: 'makeUnselected',
			from: [ 'head', 'body', 'legs' ],
			to: 'unselected'
		}
	],
	methods: {
		onMakeHead: function() {
			this.announce();
			console.log('made into head');
		},
		onMakeBody: function() {
			console.log('made into body');
		},
		onMakeLegs: function() {
			console.log('made into legs');
		},
		onMakeUnselected: function() {
			console.log('made into unselected');
		}
	}
});
