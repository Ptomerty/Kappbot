// 'use strict';
const Promise = require('bluebird');
const fs = require('fs');
const login = Promise.promisify(require('facebook-chat-api'));
const wget = require('wget-improved');
const emotefxn = require('./emotefunctions.js');
const cfc = require('./checkForCommands.js');

const globalEmotes = require('./global.json');
const subEmotes = require('./subs.json');
const bttvEmotes = require('./bttv.json');
const customEmotes = require('./custom.json');

const readFile = Promise.promisify(fs.readFile);
const writeFile = Promise.promisify(fs.writeFile);
const unlink = Promise.promisify(fs.unlink);

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
		logLevel: "silent"
	});

	api.listen((err, message) => {
		if (err) return console.warn(err);

		if (typeof message.body === 'string' && message.body !== undefined) {
			cfc.parse(api, message);
		}
	}); //api.listen

}).catch((err) => {
	console.error("Error during login/connection to API!", err);
}); //login