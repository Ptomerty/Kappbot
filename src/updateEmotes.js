'use strict';
const fs = require('fs');
const fetch = require('node-fetch');
const util = require('util');
// const axios = require('axios');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

// https://stackoverflow.com/questions/38750705

async function updateEmotes() {
	console.log("Beginning update...");
	
	console.log("Downloading emotes...");
	const urls = [
		'https://api.betterttv.net/emotes',
		'https://twitchemotes.com/api_cache/v3/images.json'
	]

	let promises = urls.map(async url => fetch(url));
	let results = await Promise.all(promises);
	promises = results.map(async data => data.json());
	results = await Promise.all(promises);
	console.log("Emotes downloaded!");

	
	console.log("Parsing into objects...");
	let bttvObj = await parseBTTVJSON(results[0]);
	let twitchObj = await parseTwitchJSON(results[1]);
	console.log("Emote objects created!");


	console.log("Removing unwanted words...");
	let words = await readFile("/usr/share/dict/words", "utf8");
	words += await readFile("./wordlist", "utf8");
	let unwantedWordsArr = words.split("\n");
	let bttvCleaned = await removeWords(bttvObj, unwantedWordsArr);
	let twitchCleaned = await removeWords(twitchObj, unwantedWordsArr);
	console.log("Testing if Zappa present: ")
	console.log(bttvObj["Zappa"])
	console.log(bttvCleaned["Zappa"])
	console.log("Unwanted words removed!");


	console.log("Writing to files...");
	const writeFilePromises = [
		writeFile('./bttvEmotes.json', JSON.stringify(bttvCleaned), 'utf8'),
		writeFile('./twitchEmotes.json', JSON.stringify(twitchCleaned), 'utf8')
	]
	await Promise.all(writeFilePromises);
	console.log("Files written!");

	console.log("Emotes successfully updated!");

}

async function parseBTTVJSON(data) {
	let bttvEmotes = data['emotes'];
	let refactoredEmotes = {};

	Object.entries(bttvEmotes).forEach(
    	([key, value]) => {
    		let newURL = "https:" + value.url.slice(0, -2) + "3x";
			refactoredEmotes[value.regex] = newURL;
	});

	return refactoredEmotes;
}

async function parseTwitchJSON(data) {
	let refactoredEmotes = {};

	Object.entries(data).forEach(
    	([key, value]) => {
    		let newURL = "https://static-cdn.jtvnw.net/emoticons/v1/" + value.id + "/3.0";
    		refactoredEmotes[value.code] = newURL
    });

	return refactoredEmotes;
}

async function removeWords(emoteObj, wordsArr) {
	let filtered = Object.entries(emoteObj)
		.filter((key, value) => !wordsArr.includes(key));
	return filtered;
}

module.exports = {
	updateEmotes
}

updateEmotes();