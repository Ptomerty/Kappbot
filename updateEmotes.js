'use strict';
const fs = require('fs');
const fetch = require('node-fetch');
const util = require('util');
const axios = require('axios');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

async function updateEmotes() {
	console.log("Beginning update...");
	
	const urls = [
		'https://api.betterttv.net/emotes',
		// 'https://twitchemotes.com/api_cache/v3/images.json'
	]

	const promises = urls.map(async url => axios(url))

	let  results = await Promise.all(promises)
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
	// const dict = await readFile("/usr/share/dict/words", "utf8");
	// const customDict = await readFile("./wordlist", "utf8");


}

updateEmotes();
