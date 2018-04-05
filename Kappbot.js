// 'use strict';
const Promise = require('bluebird');
const fs = require('fs');
const login = Promise.promisify(require('facebook-chat-api'));
const emotefxn = require('./emotefunctions.js');
const cfc = require('./checkForCommands.js');

const twitchEmotes = require('./twitch.json');
const bttvEmotes = require('./bttv.json');
const customEmotes = require('./custom.json');

const readFile = Promise.promisify(fs.readFile);

const appstatejson = require('./appstate.json')

Promise.try(function() {
	return readFile('./modlist', 'utf8')
}).then((moddata) => {
	let modlist = moddata.toString().split("\n")
	cfc.setModlist(modlist); //doesn't matter, it's sync
	return login({
		appState: appstatejson
	})
}).then((api) => {
	Promise.promisifyAll(api);

	api.setOptions({
		logLevel: "silent",
		listenEvents:true
	});

	api.listen((err, message) => {
		if (err) return console.warn(err);
		switch (message.type) {
			case "message":
				cfc.parse(api, message);
				break;
			case "event":
				if (message.logMessageType === 'log:subscribe' && (message.logMessageData['addedParticipants'][0]['userFbId'] === api.getCurrentUserID())) {
					api.sendMessage("Hello! Type !help to view available commands.", message.threadID);
				}
				break;
		}
	});
}).catch((err) => {
	console.error("Error during login/connection to API!", err);
}); //login