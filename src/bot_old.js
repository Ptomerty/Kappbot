'use strict';
const fs = require('fs');
const util = require('util');

const readFile = util.promisify(fs.readFile);

// const commandHandler = require('./commands/commandHandler.js');
const updateHandler = require('./util/updateHandler.js');
// const emoteFileHandler = require('./util/emoteFileHandler.js');

// const twitchEmotes = require('./emotes/twitch.json');
// const bttvEmotes = require('./emotes/bttv.json');
// const customEmotes = require('./emotes/custom.json');

const login = util.promisify(require('facebook-chat-api'));
const MAX_NUMBER_OF_EMOTES = 7;


(async() => {
	console.log('Updating emotes...');
	await updateHandler.updateEmotes();

	let appState = await readFile('./appstate.json');
	let api = await login({
		appState: JSON.parse(appState)
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
					let dict = updateHandler.getDictionary();
					split.filter(word => {
						checkIfEmote(word, dict);					
					});
					split = split.slice(0, MAX_NUMBER_OF_EMOTES);
					let promises = split.map(emoteFileHandler.getEmoteImageStream);
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
})();



function cleanMessage(input) {
	return input
		// remove non-alphanumeric characters
		.replace(/[^\w\s]|_/g, "") 
		// replace multiple spaces with one
		.replace(/\s+/g, " ");
}

function checkIfEmote(word, dict) {
	// check if in dictionary first to short circuit
	return (!(word in dict) && 
			 (word in twitchEmotes ||
				word in bttvEmotes ||
				word in customEmotes));
}