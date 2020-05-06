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

		this.faceOrientations = 
		[
			{ x: 0, y: Math.PI*3/2, z: 0 },
			{ x: 0, y: Math.PI/2, z: 0 },
			{ x: Math.PI/2, y: 0, z: 0 },
			{ x: Math.PI*3/2, y: 0, z: 0 },
			{ x: 0, y: 0, z: 0 },
			{ x: 0, y: Math.PI, z: 0 }
		];

		this.tween = new TWEEN.Tween();
		this.animateToFace();
		// this.rotation.set(this.faceOrientations[this.activeFace]);
		
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
		// if(!this.sounds[this.activeFace].isPlaying){
			// this.setMatColor(0xaaaaaa);
		// }

	}

	onClick() {
		this.activeFace++;
		this.activeFace %= 6;
		this.animateToFace();
		// console.log( 'yo from da ' + this.state + ' ' + this.activeFace );
		

	}


	// soundEnded() {
		// this.setMatColor(0xaaaaaa);
		// this.animateSpin();
		// this.setMatColor(0xdd99dd);		
		// console.log('doneso');
	// }

	play(){
		console.log('playing ' + this.state);
		this.sounds[this.activeFace].play();
		this.setMatColor(0xdd99dd);
		this.animateSpin( this.sounds[this.activeFace].buffer.duration * 1000 );
		// setTimeout( playNext, this.sounds[this.activeFace].buffer.duration * 1000 );
	}

	animateToFace(next){
		this.tween = new TWEEN.Tween(this.rotation)
			.to( this.faceOrientations[this.activeFace], 1500 )
			.easing(TWEEN.Easing.Quadratic.InOut)
			.start();
		// this.rotation.set(this.faceOrientations[this.activeFace]);
	}

	animateSpin(duration = 1000) {
		// this.rightRotation = { x: 0, y: 0, z: 0 };
		this.leftRotation = { x: this.faceOrientations[this.activeFace].x + Math.PI * 2, y: this.faceOrientations[this.activeFace].y + Math.PI * 2, z: 0 };

			this.tween = new TWEEN.Tween(this.rotation)
			.to(this.leftRotation, duration)
			.easing(TWEEN.Easing.Quadratic.InOut)
			.start();

		// let tween2 = new TWEEN.Tween(this.rotation)
		// 	.to(this.rightRotation, 1000)
		// 	.easing(TWEEN.Easing.Quadratic.InOut);

		// tween1.chain(tween2);
		// tween2.chain(tween1);
	}

  getCurrentDuration(){
		return this.sounds[this.activeFace].buffer.duration * 1000;
	}


}
//--- end class ---


// Cube.prototype.soundEndsIn = function(duration, callback) {
// 		setTimeout(  );

// 	this.setMatColor(0xaaaaaa);
// 	// this.animateSpin();
// 	// this.setMatColor(0xdd99dd);		
// 	console.log('doneso');
// };

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
