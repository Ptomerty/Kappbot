'use strict';
const Promise = require('bluebird');
const fs = require('fs');
const fetch = require('node-fetch');

const readFile = Promise.promisify(fs.readFile);
const writeFile = Promise.promisify(fs.writeFile);

//DRY!

Promise.try(function() {
	return ['https://api.betterttv.net/emotes','https://twitchemotes.com/api_cache/v3/images.json']
}).map((url) => {
	return fetch(url)
}).map((urldata) => {
	return urldata.json();
}).then((jsons) => {
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
	return [readFile("/usr/share/dict/words", "utf8"), [a, b]];
}).then((thing) => {
	var dict = thing[0].toString().toLowerCase().split("\n")
	var words = [];
	dict.forEach(function(element) {
		if (thing[1][0][element] != null) {
			delete thing[1][0][element];
		}
		if (thing[1][1][element] != null) {
			delete thing[1][1][element];
		}
	})
	return thing[1];
}).then((jsons) => {
	writeFile('./bttv.json', JSON.stringify(jsons[0]), 'utf8')
	writeFile('./twitch.json', JSON.stringify(jsons[1]), 'utf8')
})