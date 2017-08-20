'use strict';
const Promise = require('bluebird');
const fs = require('fs');
const fetch = require('node-fetch');

const readFile = Promise.promisify(fs.readFile);
const writeFile = Promise.promisify(fs.writeFile);

//DRY!

Promise.try(function() {
	return fetch('https://twitchemotes.com/api_cache/v3/images.json')
}).then((res) => {
	return res.json();
}).then((json) => {
	var newjson = {}
	for (const key of Object.keys(json)) {
    	newjson[json[key].code.toLowerCase()] = key.toLowerCase();
	}
	return writeFile('./twitch.json', JSON.stringify(newjson), 'utf8')
}).then(() => {
	return fetch('https://api.betterttv.net/emotes')
}).then((res) => {
	return res.json();
}).then((json) => {
	var newjson = {}
	for (const key of Object.keys(json.emotes)) {
    	newjson[json.emotes[key].regex.toLowerCase()] = json.emotes[key].url.toLowerCase().slice(-27, -3);
	}
	return writeFile('./bttv.json', JSON.stringify(newjson), 'utf8')
}).then(() => {
	var newjson = {}
	newjson['sampleemote'] = "";
	return writeFile('./custom.json', JSON.stringify(newjson), 'utf8')
})