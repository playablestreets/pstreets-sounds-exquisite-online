//CUBE DEFINITION
class Cube extends THREE.Mesh {
	constructor(bodyPart, index, listener) {
		// const container = new Object3D();
		const geometry = new THREE.BoxGeometry();
		let assetPath = '/assets/' + bodyPart + '/' + index + '/';
		const materials = [];
		const sounds = [];
		const audioLoader = new THREE.AudioLoader();

		for (let i = 0; i < 6; i++) {
			const texture = new THREE.TextureLoader().load(assetPath + i + '.png');
			// const material = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, map: texture });
			const material = new THREE.MeshLambertMaterial({ color: 0xaaaaaa, map: texture });
			material.transparent = true;
			materials.push(material);

			const sound = new THREE.Audio(listener);
			audioLoader.load(assetPath + i + '.mp3', function(buffer) {
				sound.setBuffer(buffer);
				sound.setVolume(0.9);
			});

			sounds.push(sound);
		}

		//call super constructor
		super(geometry, materials);

		//set class variables
		this.materials = materials;
		this.activeFace = 0;
		this.sounds = sounds;

		this.faceOrientations = [
			{ x: 0, y: Math.PI * 3 / 2, z: 0 },
			{ x: 0, y: Math.PI / 2, z: 0 },
			{ x: Math.PI / 2, y: 0, z: 0 },
			{ x: Math.PI * 3 / 2, y: 0, z: 0 },
			{ x: 0, y: 0, z: 0 },
			{ x: 0, y: Math.PI, z: 0 }
		];

		// this.fadeTween = new TWEEN.Tween();

		this.tween = new TWEEN.Tween();
		this.animateToFace();
		// this.rotation.set(this.faceOrientations[this.activeFace]);

		this.dragStartPos == null;
	}

	setMatColor(color) {
		this.materials.map((mat) => {
			mat.color.set(color);
		});
	}

	fadeOut() {
		this.materials.map((mat) => {
			mat.opacity = 0.7;
		});
	}

	fadeIn() {
		this.materials.map((mat) => {
			mat.opacity = 1.0;
		});
	}

	setFade(opacity) {
		this.materials.map((mat) => {
			mat.opacity = opacity;
		});
	}

	moveTo(yPos) {
		this.position.y = yPos;
		this.position.x = 0;
		this.position.z = 0;
	}

	announce() {
		console.log('pos is ' + this.position + ', and state is  ' + this.state);
	}

	onClick() {
		this.sounds[this.activeFace].currentTime = 0;
		// this.sounds[this.activeFace].onEnded( () => {
		// 	// console.log('doneso');
		// } );
		this.sounds[this.activeFace].play();
	}

	stopSound() {
		this.sounds.map((sound) => {
			// console.log('stopping sound');
			// sound.currentTime = 0;
			sound.pause();
			sound._pausedAt = 0;
			sound.isPlaying = false;
			// sound.stop();
		});
	}

	play() {
		console.log('playing ' + this.state);
		this.sounds[this.activeFace].play();
	}

	animateToFace() {
		this.tween = new TWEEN.Tween(this.rotation)
			.to(this.faceOrientations[this.activeFace], 1500)
			.easing(TWEEN.Easing.Quadratic.InOut)
			.start();
	}

	randomizeFace() {
		this.activeFace = Math.floor(Math.random() * 6);
		console.log('randomizing ' + this.state + ' to ' + this.activeFace);
		this.animateToFace();
	}

	animateSpin(duration = 1000) {
		// this.rightRotation = { x: 0, y: 0, z: 0 };
		this.leftRotation = {
			x: this.faceOrientations[this.activeFace].x + Math.PI * 2,
			y: this.faceOrientations[this.activeFace].y + Math.PI * 2,
			z: 0
		};

		this.tween = new TWEEN.Tween(this.rotation)
			.to(this.leftRotation, duration)
			.easing(TWEEN.Easing.Quadratic.InOut)
			.start();
	}

	getCurrentDuration() {
		return this.sounds[this.activeFace].buffer.duration * 1000;
	}

	onDragStart() {
		this.dragStartPos = this.position.clone();
	}

	onDragStop() {
		if (this.position.equals(this.dragStartPos)) {
			this.onClick();
		}

		this.dragStartPos = null;
	}
}
//--- end class ---
