'use strict';
const fs = require('fs');
const fsp = fs.promises;
const fetch = require('node-fetch');

const crypto = require("crypto");

let ffzEmotes, bttvEmotes, twitchEmotes, customEmotes;

// load emote objects
try {
	ffzEmotes = require('./emotes/ffz.json');
} catch (e) {
	ffzEmotes = {};
	fs.writeFileSync("./emotes/ffz.json", JSON.stringify(ffzEmotes));
}

try {
	bttvEmotes = require('./emotes/bttv.json');
} catch (e) {
	bttvEmotes = {};
	fs.writeFileSync("./emotes/bttv.json", JSON.stringify(bttvEmotes));
}

try {
	twitchEmotes = require('./emotes/twitch.json');
} catch (e) {
	twitchEmotes = {};
	fs.writeFileSync("./emotes/twitch.json", JSON.stringify(twitchEmotes));
}

try {
	customEmotes = require('./emotes/custom.json');
} catch (e) {
	customEmotes = {};
	fs.writeFileSync("./emotes/custom.json", JSON.stringify(customEmotes));
}


const funcMap = new Map([
	['!id', id],
	['!threadid', threadID],
	['!ping', ping],
	['!echo', echo],
	['!commands', commands],
	['!table', table],
	['!addemote', addEmote],
	['!delemote', delEmote],
	['test', internalTest]
]);

async function internalTest(arg) {

}

async function id(api, message) {
	return `Your ID is: ${message.senderID}`;
}

async function threadID(api, message) {
	return `The thread's ID is: ${message.threadID}`;
}

async function ping(api, message) {
	return `pong`;
}

async function echo(api, message) {
	return message.body.slice(6);
}

async function commands(api, message) {
	return `Commands: ${[...funcMap.keys()].join(", ")}`;
}

async function table(api, message) {
	let split = message.body.split(" ").slice(1);
	if (split.length < 1) {
		return 'Incorrect number of parameters. Usage: !table <message>';
	}
	split = split.join('').toUpperCase().split('');
	let firstLetter = split.shift();
	return `${firstLetter} ${split.join(' ')}\n${split.join('\n')}`;

}

async function addEmote(api, message) {
	let split = message.body.split(" ").slice(1);
	if (split.length < 2) {
		return 'Incorrect number of parameters. Usage: !addemote [ffz|link|local] <query> [...url]';
	} 
	let source = split[0];
	let query = split[1];

	if (customEmotes[query] !== undefined) {
		return `Custom emote already exists!`;
	}
	if (ffzEmotes[query] !== undefined) {
		return `FFZ emote already exists!`;
	}

	if (source === 'ffz') {
		const url = `https://api.frankerfacez.com/v1/emoticons?sort=count-desc&per_page=1&q=${query}`;
		let res = await fetch(url);
		res = await res.json();
		res = res['emoticons'][0];

		let name = res['name'];

		// required to check again since capitalization may be different
		if (customEmotes[name] !== undefined) {
			return `Custom emote already exists!`;
		}
		if (ffzEmotes[name] !== undefined) {
			return `FFZ emote already exists!`;
		}

		const emoteUrl = `https:${res['urls']['4']}`;
		const pathname = `${__dirname}/emotes/img/${name}.png`;
		let res2 = await fetch(emoteUrl);
		res2 = await res2.buffer();
		await fsp.writeFile(pathname, res2);

		ffzEmotes[name] = null;
		await fsp.writeFile('./emotes/ffz.json', JSON.stringify(ffzEmotes));
		return `FFZ emote ${name} added!`;
	} else if (source === 'link') {
		let url = split[2];
		let res = await fetch(url);
		res = await res.buffer();
		const pathname = `${__dirname}/emotes/img/${query}.png`
		await fsp.writeFile(pathname, res);

		customEmotes[query] = null;
		await fsp.writeFile('./emotes/custom.json', JSON.stringify(customEmotes));
		return `Custom emote ${query} added!`;
	} else if (source === 'local') {
		try {
			const pathname = `${__dirname}/emotes/img/${query}.png`
			await fsp.stat(pathname);
		} catch (e) {
			if (e.code === 'ENOENT') {
				return `No local file with that name found!`;
			} else {
				return `Something else went wrong! Line: fsp.stat(pathname)`;
			}
		}

		customEmotes[query] = null;
		await fsp.writeFile('./emotes/custom.json', JSON.stringify(customEmotes));
		return `Custom emote ${query} added!`;
	} else {
		return 'Invalid source specified. Usage: !addemote [ffz|link|local] <query> [...url]';
	}
}

async function delEmote(api, message) {
	// note, does not unlink file!
	let split = message.body.split(" ").slice(1);
	if (split.length !== 1) {
		return 'Incorrect number of parameters. Usage: !delEmote <query>';
	} 
	let query = split[0];
	if (ffzEmotes[query] !== undefined) {
		const {[query]: val, ...newffz} = ffzEmotes;
		ffzEmotes = newffz;
		await fsp.writeFile('./emotes/ffz.json', JSON.stringify(ffzEmotes));
		return `FFZ emote ${query} removed!`;
	} else if (customEmotes[query] !== undefined) {
		const {[query]: val, ...newcustom} = customEmotes;
		customEmotes = newcustom;
		await fsp.writeFile('./emotes/custom.json', JSON.stringify(customEmotes));
		return `Custom emote ${query} removed!`;
	} else {
		return `Emote does not exist as FFZ or custom emote.`;
	}
}

async function generateEmoteStream(name) {
	const pathname = `${__dirname}/emotes/img/${name}.png`;
	console.log("pathname called: " + pathname);
	return new Promise((resolve, reject) => {
		const stream = fs.createReadStream(pathname);
		stream.on('error', async err => {
			console.log("local emote not found!");
			if (err.code !== 'ENOENT') {
				reject(err); // something broke
			}
			let url = bttvEmotes[name] || twitchEmotes[name];
			let res = await fetch(url);
			res = await res.buffer();
			await fsp.writeFile(pathname, res);
			resolve(fs.createReadStream(pathname));
		});
		resolve(stream);
	});
}

function emoteExists(name) {
	return (ffzEmotes[name] !== undefined) ||
		(customEmotes[name] !== undefined) ||
		(bttvEmotes[name] !== undefined) ||
		(twitchEmotes[name] !== undefined)
}
module.exports = { funcMap, ffzEmotes, bttvEmotes, twitchEmotes, customEmotes, emoteExists, generateEmoteStream };