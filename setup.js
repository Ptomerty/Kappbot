'use strict';
const Promise = require('bluebird');
const fs = require('fs');
const fetch = require('node-fetch');

const readFile = Promise.promisify(fs.readFile);
const writeFile = Promise.promisify(fs.writeFile);

//DRY!

Promise.try(function(){
	return fetch('https://twitchemotes.com/api_cache/v3/images.json')
}).then((res) => {
	return res.json();
}).then((json) => {
	console.log("Fetched Twitch JSON!")
	var newjson = {}
	for (const key of Object.keys(json)) {
	    	newjson[json[key].code.toLowerCase()] = key.toLowerCase();
	}
	return writeFile('./twitch.json', JSON.stringify(newjson), 'utf8')
}).then(() => {
	console.log("Wrote Twitch JSON!")
	return fetch('https://api.betterttv.net/emotes')
}).then((res) => {
	return res.json();
}).then((json) => {
	console.log("Fetched BTTV JSON!")
	var newjson = {}
	for (const key of Object.keys(json.emotes)) {
    	newjson[json.emotes[key].regex.toLowerCase()] = json.emotes[key].url.toLowerCase().slice(-27, -3);
	}
	return writeFile('./bttv.json', JSON.stringify(newjson), 'utf8')
}).then(() => {
	let locations = ["/usr/share/dict/words", "./wordlist"];
	readFile("/usr/share/dict/words", "utf8");
}).then((data) => {
	listOfCommonWords = data.toString().split("\n")
	return console.log("Wrote BTTV JSON!") // error handling requires return all the way through
})
