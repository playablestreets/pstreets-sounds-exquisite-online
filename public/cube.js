//CUBE DEFINITION
class Cube extends THREE.Mesh {
	constructor(index, storiesIn, listener) {
		const bodyPartNames = ['top', 'middle', 'bottom'];
		let bodypart = bodyPartNames[index];

		const stories = storiesIn;
		// let index = index;
		
		//this is stories 0 to 5
		let storyOffset = 0;

		// const container = new Object3D();
		const geometry = new THREE.BoxGeometry();

		// let assetPath = '/assets/' + bodypart + '/0/';
		const materials = [];
		const sounds = [];
		const audioLoader = new THREE.AudioLoader();


		for (let i = 0; i < 6; i++) {
			

			// let textureAssetPath = stories[i]
			// let audioAssetPath = stories[i]
			// const texture = new THREE.TextureLoader().load(assetPath + i + '.png');
			let faceStory = stories[i + storyOffset];
			// console.log('face story: ', faceStory);


			const texture = new THREE.TextureLoader().load(faceStory[bodypart].imageLocation);

			// let texture;
			// const material = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, map: texture });
			const material = new THREE.MeshLambertMaterial({ color: 0xaaaaaa, map: texture });
			material.transparent = true;
			materials.push(material);

			const sound = new THREE.Audio(listener);
			sound.hasLoaded = false;

			audioLoader.load(faceStory[bodypart].soundLocation, function(buffer) {
				sound.setBuffer(buffer);
				sound.setVolume(0.9);
				// sound.hasLoaded = true;
				// console.log('loaded!');
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

		this.parent = new THREE.Object3D();
		this.parent.add(this);

		this.animateToFace(0);

		this.dragStartPos = null;
		this.role = null;
		this.setTo(bodypart);
		this.soundEndCallback = null;
		this.shakeTween = null;
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
		let moveTween = new TWEEN.Tween(this.position)
			.to(new THREE.Vector3(0, yPos, 0), 600)
			.easing(TWEEN.Easing.Elastic.Out)
			.start();
	}

	setTo(bodypart) {
		this.role = bodypart;

		if (bodypart === 'head') {
			this.moveTo(1);
		}
		else if (bodypart == 'body') {
			this.moveTo(0);
		}
		else if (bodypart == 'legs') {
			this.moveTo(-1);
		}
	}


	announce() {
		console.log('pos is ' + this.position + ', and state is  ' + this.state);
	}



	onClick() {
		this.play();
		let duration = this.getCurrentDuration();
		let that = this;

		this.soundEndCallback = setTimeout(function() {
			that.stopSound();
		}, duration);
	}

	stopSound() {
		this.shakeStop();

		clearTimeout(this.soundEndCallback);
		this.sounds.map((sound) => {
			if (sound.isPlaying) sound.stop();
		});
	}

	play() {
		this.shake();
	
		// console.log('playing ' + this.state);
		this.sounds[this.activeFace].currentTime = 0;
		this.sounds[this.activeFace].play();
		
	}





	shake() {
		this.shakeTween = new TWEEN.Tween(this.parent.rotation)
			.to(new THREE.Vector3(0, 0, -0.1), 200)
			.easing(TWEEN.Easing.Back.Out)
			.repeat(Infinity)
			.yoyo(true);

		let thatShakeTween = this.shakeTween;

		let startShakeTween = new TWEEN.Tween(this.parent.rotation)
			.to(new THREE.Vector3(0, 0, 0.1), 200)
			.easing(TWEEN.Easing.Back.Out)
			.onComplete(function() {
				thatShakeTween.start();
			})
			.start();
	}

	shakeStop() {
		if (this.shakeTween !== null) this.shakeTween.stop();
		this.shakeTween = new TWEEN.Tween(this.parent.rotation)
			.to(new THREE.Vector3(0, 0, 0), 200)
			.easing(TWEEN.Easing.Back.Out)
			.start();
	}





	loadFace() {
		//TODO load random rear face
		let oppositeFaces = [ 1, 0, 3, 2, 5, 4 ];
		let oppositeFace = oppositeFaces[this.activeFace];

		//check if backpage is currently loading
		
	}

	animateToFace(face) {
		this.activeFace = face;
		
		let that = this;
		let loadBackFace = function() {
			that.loadFace();
		};

		let anitween = new TWEEN.Tween(this.rotation)
			.to(this.faceOrientations[this.activeFace], 1200)
			.easing(TWEEN.Easing.Back.Out)
			.onComplete(loadBackFace)
			.start();
	}

	randomizeFace() {
		const face = Math.floor(Math.random() * 6);
		this.animateToFace(face);
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

		this.setTo(this.role);
	}
}
//--- end class ---
