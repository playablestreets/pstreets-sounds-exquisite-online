'use strict';
// utils.js


const apiEndPoint = 'https://playable-web.cdn.prismic.io/api/v2';



function getApi(ctx){
	
	let request = new XMLHttpRequest();
	
	request.open('GET', apiEndPoint, true);
	
	request.onload = function () {
		var data = JSON.parse(this.response);
		data.refs.forEach((ref) => {
			if(ref.isMasterRef){
				// console.log(ref.ref);
				// getKidstrumentsFromPrismic(ref.ref, ctx);
				getExStoriesFromPrismic(ref.ref, ctx);
			}
		});
	}

	// Send request
	request.send();
}


// argumment should be a return function?
function getExStoriesFromPrismic(masterRef, ctx){

	let predicates = '[[at(document.type, "sounds_exquisite")]]';
	
	let queryEndPoint = apiEndPoint + '/documents/search?ref=' + masterRef + '&q=' + predicates + '&pageSize=100'; 

	//todo iterate over pages

	let request = new XMLHttpRequest();
	
	request.open('GET', queryEndPoint, true);


	
	request.onload = function () {
		var data = JSON.parse(this.response);
		// console.log(data);
		//signal has loaded
		ctx.setData(data.results);
	}
	request.send();
}


function getKidstrumentsFromPrismic(masterRef, ctx){
	let predicates = '[[at(document.type,"kidstrument")]]';
	let queryEndPoint = apiEndPoint + '/documents/search?ref=' + masterRef + '&q=' + predicates + '&pageSize=100'; 

	//todo iterate over pages

	let request = new XMLHttpRequest();
	
	request.open('GET', queryEndPoint, true);


	
	request.onload = function () {
		var data = JSON.parse(this.response);
		// console.log(data);
		//signal has loaded
		ctx.setKidstruments(data.results);
	}
	request.send();
}

function luma(img) {
	let newImg = img.get();

	for (let y = 0; y < newImg.height; y++) {
		for (let x = 0; x < newImg.width; x++) {
			let index = (x + y * newImg.width) * 4;
			let r = newImg.pixels[index + 0];
			let g = newImg.pixels[index + 1];
			let b = newImg.pixels[index + 2];
			let a = newImg.pixels[index + 3];

			let luma = r * 0.299 + g * 0.587 + b * 0.0114;

			newImg.pixels[index + 0] = luma;
			newImg.pixels[index + 1] = luma;
			newImg.pixels[index + 2] = luma;
		}
	}
	newImg.updatePixels();

	return newImg;
}

function getColor() {
	//  aim:  to access pixels from mask image as effieciently as possible
	//				accounting for image scaling and transformation

	//do the opposite scaling to sampling coords
	//as is done to the image beingdrawn.
	let foundColor = color(
		...maskImage.get((mouseX - offset.x) / maskImageScale / drawScale, (mouseY - offset.y) / maskImageScale / drawScale)
	);

	//  this approach might be faster...
	//  let d = pixelDensity();
	//  let off = (y * maskImage.width + x) * d * 4;
	//  let components = [
	// 	maskImage.pixels[off],
	// 	maskImage.pixels[off + 1],
	// 	maskImage.pixels[off + 2],
	// 	maskImage.pixels[off + 3]
	//  ];
	//  print(components);
	//  let foundColor = color(...components);

	return foundColor;
}

function getNormMouse() {
	let normMouseX = mouseX / width;
	let normMouseY = mouseY / height;
	let obj = {
		x: normMouseX,
		y: normMouseY
	};
	return obj;
}

function getElapsed() {
	let endTime = new Date();
	return endTime - startTime; //in ms
}

// function getParameterByName(name, url) {
// 	if (!url) url = window.location.href;
// 	name = name.replace(/[\[\]]/g, '\\$&');
// 	var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
// 			results = regex.exec(url);
// 	if (!results) return null;
// 	if (!results[2]) return '';
// 	return decodeURIComponent(results[2].replace(/\+/g, ' '));
// }

function getQueryVariable(variable) {
	var query = window.location.search.substring(1);
	var vars = query.split('&');
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split('=');
		if (pair[0] == variable) {
			return pair[1];
		}
	}
	return false;
}

function getUrlName() {
	var query = window.location.search.substring(1).toLowerCase(); 
	return query;
}

/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
	var j, x, i;
	for (i = a.length - 1; i > 0; i--) {
			j = Math.floor(Math.random() * (i + 1));
			x = a[i];
			a[i] = a[j];
			a[j] = x;
	}
	return a;
}

//attempted saturation....
// function saturate(img) {

//   //TODO this function is broken
// 	let newImg = img.get();

// 	for (let y = 0; y < newImg.height; y++) {
// 		for (let x = 0; x < newImg.width; x++) {
// 			let index = (x + y * newImg.width) * 4;
// 			let r = newImg.pixels[index + 0];
// 			let g = newImg.pixels[index + 1];
// 			let b = newImg.pixels[index + 2];
// 			let a = newImg.pixels[index + 3];

//       let c = color(r,g,b);

//       colorMode(HSB);
//       c = color(c._getHue(),200,c._getBrightness());
//       colorMode(RGB);

// 			newImg.pixels[index + 0] = c._getRed();
// 			newImg.pixels[index + 1] = c._getGreen();
// 			newImg.pixels[index + 2] = c._getBlue();
// 			newImg.pixels[index + 3] = a;
// 		}
// 	}
// 	// newImg.updatePixels();

// 	return newImg;
// }

//RGB to HSV.....
//normalised RGB to HSV 360 100 100 1
// let cMax = max(r, g, b);
// let cMin = min(r, g, b);
// let d = cMax - cMin;

// let h = 0;
// let s = 0;
// let v = cMax;

// if (d == 0) {
// 	h = 0;
// }
// else if (cMax == r) {
// 	h = 60 * (((g - b) / d) % 6);
// }
// else if (cMax == g) {
// 	h = 60 * ((b - r) / d + 2);
// }
// else if (cMax == b) {
// 	h = 60 * ((r - g) / d + 4);
// }

// if(cMax != 0){
//   s = d/cMax;
// }
