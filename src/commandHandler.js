'use strict';
const fs = require('fs');
const fetch = require('node-fetch');
const util = require('util');
const stream = require('stream');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const writeFile = util.promisify(fs.unlink);
const pipeline = util.promisify(stream.pipeline);

const twitchEmotes = require('./twitch.json');
const bttvEmotes = require('./bttv.json');

var commands = {
	"!id": id,
	"!help": commands,
	"!commands": commands,
	"!ping": ping,
	"!threadID": threadID
}

function id(message) {
	return `Your ID is ${message.senderID}`;
}

function commands(message) {
	return `Commands: ${Object.keys(commands)}`;
}

function ping(message) {
	return `pong`;
}

function threadID(message) {
	return `Thread ID: ${message.threadID}`;
}

function table(message) {
	let split = message.split(" ")
	if (split.length > 1) {
		split.shift();
		split = split.join('').toUpperCase().split('');
		let firstLetter = split.shift();
		return `${firstLetter} ${split.join(' ')}\n${split.join('\n')}`
	}
}