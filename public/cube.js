//CUBE DEFINITION
class Cube extends THREE.Mesh {

	constructor(bodyPart, index, listener) {

		const geometry = new THREE.BoxGeometry();
		let assetPath = '/assets/' + bodyPart + '/' + index + '/';	
		const materials = [];
		const sounds = [];
		const audioLoader = new THREE.AudioLoader();
	


		for (let i = 0; i < 6; i++) {

			const texture = new THREE.TextureLoader().load(assetPath + i + '.png');
			const material = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, map: texture });
			materials.push(material);

			const sound = new THREE.Audio(listener);
			audioLoader.load(assetPath + i + '.mp3', function( buffer ) {
				sound.setBuffer( buffer );
				sound.setVolume(0.9);
			});

			sounds.push(sound);
		}

		//call super constructor
		super(geometry, materials);

		//init statemachine
		this._fsm(); 

		//set class variables
		this.materials = materials;
		this.activeFace = 0;
		this.sounds = sounds;
		
		//set up tweening
		// this.rightRotation = { x: 0, y: 3, z: -1 / 32 };
		// this.leftRotation = { x: 0, y: -3, z: 1 / 32 };

		// let tween1 = new TWEEN.Tween(this.rotation)
		// 	.to(this.leftRotation, 3000 + Math.random() * 4000)
		// 	.easing(TWEEN.Easing.Quadratic.InOut)
		// 	.start();

		// let tween2 = new TWEEN.Tween(this.rotation)
		// 	.to(this.rightRotation, 4000 + Math.random() * 4000)
		// 	.easing(TWEEN.Easing.Quadratic.InOut);

		// tween1.chain(tween2);
		// tween2.chain(tween1);
	}

	setMatColor(color) {

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
		if(!this.sounds[this.activeFace].isPlaying){
			this.setMatColor(0xaaaaaa);
		}

	}

	onClick() {
		console.log( 'yo from da ' + this.state + ' ' + this.activeFace );
		this.sounds[this.activeFace].play();
		this.setMatColor(0xdd99dd);
		// this.sounds[this.activeFace].onEnded(() => {
		// 	console.log('doneso');			
		// });
	}

}
//--- end class ---


StateMachine.factory(Cube, {
	init: 'unselected',
	transitions: [
		{ name: 'makeHead', from: [ 'unselected', 'body', 'legs' ], to: 'head' },
		{ name: 'makeBody', from: [ 'unselected', 'head', 'legs' ], to: 'body' },
		{ name: 'makeLegs', from: [ 'unselected', 'head', 'body' ], to: 'legs' },
		{ name: 'makeUnselected', from: [ 'head', 'body', 'legs' ], to: 'unselected'}
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
