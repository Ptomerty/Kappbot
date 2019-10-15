'use strict';
const fs = require('fs');
const fetch = require('node-fetch');
const util = require('util');

const emoteFileHandler = require('../util/emoteFileHandler.js');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const unlink = util.promisify(fs.unlink);

const twitchEmotes = require('../emotes/twitch.json');
const bttvEmotes = require('../emotes/bttv.json');
const customEmotes = require('../emotes/custom.json');

var commands = {
	"!id": id,
	"!help": listCommands,
	"!commands": listCommands,
	"!ping": ping,
	"!threadID": threadID,
	"!list": listCustomEmotes,
	"!echo": echo,
	"!addEmote": addEmote,
	"!delEmote": delEmote
	// TOOD: Implement sed-replace
}

async function parse(api, message) {
	let cmd = message.body.split(" ")[0];
	return commands[cmd](api, message);
}

async function id(api, message) {
	const getUserID = util.promisify(api.getUserID);
	let split = message.body.split(" ");
	if (split.length = 1) {
		return `Your ID is ${message.senderID}`;
	} else {
		let name = split.slice(1).join(' ');
		let user = await getUserID(name);
		return `${user.name}'s ID is ${user.userID}`;
	}
}

function listCommands(api, message) {
	return `Commands: ${Object.keys(commands).join(', ')}`;
}

function listCustomEmotes(api, message) {
	return `Custom emotes: ${Object.keys(customEmotes).join(', ')}`
}

function ping(api, message) {
	return `pong`;
}

function threadID(api, message) {
	return `Thread ID: ${message.threadID}`;
}

function table(api, message) {
	let split = message.body.split(" ");
	if (split.length > 1) {
		split = split.slice(1).join('').toUpperCase().split('');
		let firstLetter = split.shift();
		return `${firstLetter} ${split.join(' ')}\n${split.join('\n')}`;
	} else {
		return 'Incorrect number of parameters. Usage: !table <message>';
	}
}

function echo(api, message) {
	// TODO: echoThread
	return message.body.split(' ').slice(1).join(' ');
}

async function addEmote(api, message) {
	let split = message.body.split(" ");
	if (split.length < 2) {
		return 'Incorrect number of parameters. Usage: !addEmote <emoteName[, URL]>';
	} else {
		let name = split[2];
		customEmotes[name] = '';
		if (split[3] !== undefined) {
			let url = split[3];
			await emoteFileHandler.getEmoteImageStream(name, url);
		}
		await writeFile('./custom.json', JSON.stringify(customEmotes));
		return `Emote ${name} added!`;
	}
}

async function delEmote(api, message) {
	let split = message.body.split(" ");
	if (split.length < 2) {
		return 'Incorrect number of parameters. Usage: !delEmote <emoteName>';
	} else {
		let name = split[2];
		if (name in customEmotes) {
			delete customEmotes[name];
			await emoteFileHandler.deleteEmoteFile(name);
		} else {
			return `Emote ${name} not found!`;
		}
		await writeFile('./custom.json', JSON.stringify(customEmotes));
		return `Emote ${name} deleted!`;
	}
}

module.exports = {
	commands,
	parse
}