//CUBE DEFINITION
class Cube extends THREE.Mesh {
	constructor(bodyPart, index) {
		const geometry = new THREE.BoxGeometry();

		let texPath = '/assets/' + bodyPart + '/' + index + '/';
	
		const materials = [];

		for (let i = 0; i < 6; i++) {
			const texture = new THREE.TextureLoader().load(texPath + i + '.png');
			const material = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, map: texture });

			materials.push(material);
		}

		// const material = new THREE.MeshStandardMaterial({ color: 0xffffff, map: texture });

		super(geometry, materials);

		this.materials = materials;
		
		this._fsm(); //init statemachine
		// this.currentRotation = { x: 0, y: 0, z: 0 };
		this.rightRotation = { x: 0, y: 3, z: -1 / 32 };
		this.leftRotation = { x: 0, y: -3, z: 1 / 32 };

		let tween1 = new TWEEN.Tween(this.rotation)
			.to(this.leftRotation, 3000 + Math.random() * 4000)
			.easing(TWEEN.Easing.Quadratic.InOut)
			.start();

		let tween2 = new TWEEN.Tween(this.rotation)
			.to(this.rightRotation, 4000 + Math.random() * 4000)
			.easing(TWEEN.Easing.Quadratic.InOut);

		tween1.chain(tween2);
		tween2.chain(tween1);
	}

	setMatColor(color){
		// console.log(this.materials);
		this.materials.map( mat =>{
			mat.color.set(color);
		});
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
