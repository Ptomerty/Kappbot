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
	return [readFile("/usr/share/dict/words", "utf8"), readFile("./wordlist", "utf8"), [a, b]];
}).then(([words, list, [a,b]]) => {
	return [words.toString().toLowerCase().split("\n"),
	list.toString().toLowerCase().split("\n"), [a,b]];
}).then(([words, list, [a,b]]) => {
	var dict = words;
	console.log(typeof dict)
	dict.forEach(function(element) {
		if (thing[1][0][element] != null) {
			console.log(element);
			console.log(thing[1][0][element])
			delete thing[1][0][element];
		}
		if (thing[1][1][element] != null) {
			console.log(element);
			console.log(thing[1][1][element])
			delete thing[1][1][element];
		}
	})
	return thing[1];
}).then((jsons) => {
	writeFile('./bttv.json', JSON.stringify(jsons[0]), 'utf8')
	writeFile('./twitch.json', JSON.stringify(jsons[1]), 'utf8')
	console.log(jsons[1]['soap']);
	console.log(jsons[1]['hero']);
})