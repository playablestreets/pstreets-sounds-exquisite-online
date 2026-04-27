'use strict';
// utils.js


const apiEndPoint = 'https://playable-web.cdn.prismic.io/api/v2';


function getFromApi(typeQuery, setDataCallback){
	results = [];

	let request = new XMLHttpRequest();
	request.open('GET', apiEndPoint, true);
	request.send();

	request.onload = function () {
		var data = JSON.parse(this.response);
		data.refs.forEach((ref) => {
			if(ref.isMasterRef){

				const masterRef = ref.ref;
				// console.log('Master Reference is ' + masterRef);

				let predicates = '[[at(document.type,"' + typeQuery + '")]]';
				let queryEndPoint = apiEndPoint + '/documents/search?ref=' + masterRef + '&q=' + predicates + '&pageSize=100';

				//request data for first page
				requestData(queryEndPoint, setDataCallback);
			}
		});
	}
}

let results = [];

function requestData(queryEndPoint, setDataCallback){	
	let request = new XMLHttpRequest();
	
	//start request
	request.open('GET', queryEndPoint, true);
	request.send();

	request.onload = function(){
		var data = JSON.parse(this.response);
		results = results.concat(data.results);

		if(data.next_page != null){
			//recursively call request data for each page
			requestData(data.next_page, setDataCallback);
		}else{
			console.log('received ', results.length, ' results' );
			// console.log(results);
			setDataCallback(results);
		}
	}

}


function prismicArrayExists(a){
	return( Array.isArray(a) && a.length > 0 && a[0] != null && a[0].text != null );
}

function prismicText(a, fallback){
	return prismicArrayExists(a) ? a[0].text : (fallback != null ? fallback : "...");
}

function prismicUrl(field){
	return (field != null && field.url != null) ? field.url : null;
}

/**
 * Shuffles array in place. ES6 version
 * @param {Array} a items An array containing the items.
 */
function shuffleArray(a) {
	for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}