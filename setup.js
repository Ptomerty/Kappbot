'use strict';
const Promise = require('bluebird');
const fs = require('fs');
const fetch = require('node-fetch');

const readFile = Promise.promisify(fs.readFile);
const writeFile = Promise.promisify(fs.writeFile);

//DRY!

Promise.try(function() {
	console.log("Beginning emote list update...")
	return ['https://api.betterttv.net/emotes','https://twitchemotes.com/api_cache/v3/images.json']
}).map((url) => {
	return fetch(url)
}).map((urldata) => {
	return urldata.json();
}).then((jsons) => {
	console.log("JSONS fetched!")
	var bttvjson = {}
	for (const key of Object.keys(jsons[0].emotes)) {
    	bttvjson[jsons[0].emotes[key].regex.toLowerCase()] = jsons[0].emotes[key].url.toLowerCase().slice(-27, -3);
	}
	var twitchjson = {}
	for (const key of Object.keys(jsons[1])) {
    	twitchjson[jsons[1][key].code.toLowerCase()] = key.toLowerCase();
	}
	return [bttvjson, twitchjson];
}).then(([a, b]) => {
	return Promise.all([readFile("/usr/share/dict/words", "utf8"), readFile("./wordlist", "utf8"), [a, b]]); //return promise with jsons packaged
}).then(([words, list, [a,b]]) => {
	console.log("Dictionary and wordlist fetched!")
	var dict = words.toString().toLowerCase().split("\n");
	var wordlist = list.toString().toLowerCase().split("\n");

	function checkForWords(element) {
		if (element != "constructor" && element != "kappa") {
			if (a[element] != null) {
				console.log("deleting " + element + " at " + a[element] + " in bttv");
				delete a[element];
			}
			if (b[element] != null) {
				console.log("deleting " + element + " at " + b[element] + " in twitch");
				delete b[element];
			}
		}
	}

	dict.forEach(checkForWords)
	wordlist.forEach(checkForWords)

	return [a,b];
}).then((jsons) => {
	console.log("Words deleted!")
	return Promise.all([writeFile('./bttv.json', JSON.stringify(jsons[0]), 'utf8'),	writeFile('./twitch.json', JSON.stringify(jsons[1]), 'utf8')]);
}).then(() => {
	return console.log("Emotes succesfully updated!")
})