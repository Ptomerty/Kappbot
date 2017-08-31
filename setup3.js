'use strict';
const Promise = require('bluebird');
const fs = require('fs');
const fetch = require('node-fetch');

const readFile = Promise.promisify(fs.readFile);
const writeFile = Promise.promisify(fs.writeFile);

//DRY!

function getA() {
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
	})
}

function getB() {
	Promise.try(function() {
		return ["/usr/share/dict/words", "./wordlist"];
	}).map((location) => {
		return readFile(location, 'utf8')
	}).map((data) => {
		return data.toString().toLowerCase().split("\n")
	}).then((array) => {
		return console.log(array);
	})
}


Promise.all(getA(), getB()).then(([arrayA, arrayB]) => {
	console.log("theoretically done");
	console.log(arrayA);
})