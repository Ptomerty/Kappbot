'use strict'
const fsp = require('fs').promises;
const fetch = require('node-fetch');

const credentials = require('./credentials.json');

async function getNewBTTVEmotes() {
	const url = 'https://api.betterttv.net/3/cached/emotes/global';
	let res = await fetch(url);
	res = await res.json();

	let refactoredEmotes = {};
	let unwantedWords = await getDict();
	Object.entries(res).forEach(([key, value]) => {
		if (!(unwantedWords.includes(value.regex))) {
			refactoredEmotes[value.code] = `https://cdn.betterttv.net/emote/${value.id}/3x`;
		}		
	});

	return refactoredEmotes;
}

async function getNewTwitchEmotes() {
    const url = 'https://api.twitch.tv/kraken/chat/emoticons';
    let res = await fetch(url, { headers: {
    	'Accept': 'application/vnd.twitchtv.v5+json',
    	'Client-ID': credentials.client_id    	
    }});
    res = await res.json();
    const { emoticons } = res;

    let refactoredEmotes = {};
	let unwantedWords = await getDict();
	Object.entries(emoticons).forEach(([key, value]) => {
		if (!(unwantedWords.includes(value.regex))) {
			refactoredEmotes[value.regex] = `${value.images.url.slice(0, -4)}/4.0`;
		}
	});

	return refactoredEmotes;
}

async function getDict() {
	let words = await fsp.readFile(`${__dirname}/removed_words.txt`, "utf8");
	// words += await fsp.readFile("/usr/share/dict/words", "utf8");
	words = words.split("\n");
	return words.map(x => x.trim());
}

module.exports = { getNewBTTVEmotes, getNewTwitchEmotes };