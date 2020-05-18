'use strict';
const fs = require('fs');
const fsp = fs.promises;
const fetch = require('node-fetch');

const updater = require('./updater.js');

let ffzEmotes, bttvEmotes, twitchEmotes, customEmotes;

const funcMap = new Map([
	['!id', id],
	['!threadid', threadID],
	['!ping', ping],
	['!echo', echo],
	['!commands', commands],
	['!table', table],
	['!addemote', addEmote],
	['!delemote', delEmote],
	['!updateemotes', updateEmotes]
]);

async function init() {
  // load emote objects
  try {
	  ffzEmotes = JSON.parse(await fsp.readFile('./emotes/ffz.json', 'utf8'));
  } catch (e) {
	  ffzEmotes = {};
	  await fsp.writeFile('./emotes/ffz.json', JSON.stringify(ffzEmotes));
  }

  try {
	  bttvEmotes = JSON.parse(await fsp.readFile('./emotes/bttv.json', 'utf8'));
  } catch (e) {
	  bttvEmotes = {};
	  await fsp.writeFile('./emotes/bttv.json', JSON.stringify(ffzEmotes));
  }

  try {
	  twitchEmotes = JSON.parse(await fsp.readFile('./emotes/twitch.json', 'utf8'));
  } catch (e) {
	  twitchEmotes = {};
	  await fsp.writeFile('./emotes/twitch.json', JSON.stringify(ffzEmotes));
  }

  try {
	  customEmotes = JSON.parse(await fsp.readFile('./emotes/custom.json', 'utf8'));
  } catch (e) {
	  customEmotes = {};
	  await fsp.writeFile('./emotes/custom.json', JSON.stringify(ffzEmotes));
  }
}

async function updateEmotes(api, message) {
  await updater.updateEmotes();
  return 'Emotes updated!';
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
  return (ffzEmotes[name] !== undefined)
		|| (customEmotes[name] !== undefined)
		|| (bttvEmotes[name] !== undefined)
		|| (twitchEmotes[name] !== undefined);
}
module.exports = {
  funcMap,
  ffzEmotes,
  bttvEmotes,
  twitchEmotes,
  customEmotes,
  emoteExists,
  generateEmoteStream,
  updateEmotes,
  init,
};