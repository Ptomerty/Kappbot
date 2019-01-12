'use strict';
const fs = require('fs');
const fetch = require('node-fetch');
const util = require('util');
const axios = require('axios');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

// https://stackoverflow.com/questions/38750705

async function updateEmotes() {
	console.log("Beginning update...");
	
	console.log("Downloading emotes...");
	const urls = [
		'https://api.betterttv.net/emotes',
		// 'https://twitchemotes.com/api_cache/v3/images.json'
	]

	const promises = urls.map(async url => axios(url).data)

	let results = await Promise.all(promises)
	console.log("Emotes downloaded!");
	// results = results.map(r => r.data)

	console.log("Parsing into objects...");
	let bttv = await parseBTTVJSON(results[0]);
	let twitch = await parseTwitchJSON(results[1]);
	console.log("Emote objects created!");


	results = results.map(r => r.data['emotes'])[0]
	console.log(results)
	// for (var obj in results)
	// 	console.log(obj)
	// var o = results[0][0];
	// var {
	// 	url: newURL,
	// 	...newo
	// } = o;

	// console.log(o)
	
	// var json = {
	// 	"emotes": []
	// };
	// json['emotes'].push(results[0]);
	// json['emotes'].push(results[0]);
	// console.log(json);
	// return results;

	// // -----------------------



	console.log("Removing unwanted words...");

	const dict = await readFile("/usr/share/dict/words", "utf8");
	const customDict = await readFile("./wordlist", "utf8");

	// readfilestream?

	console.log("Unwanted words removed!");

	console.log("Writing to files...");
	const writeFilePromises = [
		writeFile('./bttv.json', JSON.stringify(bttv), 'utf8'),
		writeFile('./twitch.json', JSON.stringify(twitch), 'utf8')
	]

	await Promise.all(writeFilePromises);
	console.log("Files written!");

	console.log("Emotes successfully updated!");
}

async function parseBTTVJSON(data) {

}

async function parseTwitchJSON(data) {

}

async function removeWords(emoteObj, pathName) {

}

updateEmotes();
