'use strict';
const fs = require('fs');
const fetch = require('node-fetch');
const util = require('util');
const stream = require('stream');

const login = util.promisify(require('facebook-chat-api'));

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const twitchEmotes = require('./twitch.json');
const bttvEmotes = require('./bttv.json');

const MAX_NUMBER_OF_EMOTES = 7;

let appState = await readFile('./appstate.json');
let api = await login({
	appState: appState
});
api.setOptions({
		logLevel: "silent",
		listenEvents:true
	});
const listen = util.promisify(api.listen);
while (true) {
	let message = await api.listen();
	switch (message.type) {
		case "message":
		case "message_reply":
			let split = message.body.split(' ');
			if (split[0] in commands) {
				commandHandler.parse(api, message);
			} else {
				split.map(cleanMessage);
				let dict = getDictionary();
				split.filter(word => {
					checkIfEmote(word, dict);					
				});
				split = split.slice(0, MAX_NUMBER_OF_EMOTES);
				let promises = split.map(getEmoteImageStream);
				let results = await Promises.all(promises);
				api.sendMessage({
					attachment: results
				}, message.threadID);
			}
			break;
		case "event":
			if (message.logMessageData['addedParticipants'][0]['userFbId'] === api.getCurrentUserID()) {
				api.sendMessage("Hello! Type !help to view available commands.", message.threadID);
			}
			break;
	}
}

function cleanMessage(input) {
	return input
		.replace(/[^\w\s]|_/g, "")
		.replace(/\s+/g, " ");
}

function checkIfEmote(word, dict) {
	// check if in dictionary first to short circuit
	return (!(word in dict) && 
			 (word in twitchEmotes ||
				word in bttvEmotes ||
				word in customEmotes));
}