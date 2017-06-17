const Promise = require('bluebird');
const fs = require('fs');
const login = Promise.promisify(require('facebook-chat-api'));
const wget = require('wget-improved');
const emotefxn = require('./emotefunctions.js');

const globalEmotes = require('./global.json');
const subEmotes = require('./subs.json');
const bttvEmotes = require('./bttv.json');
const customEmotes = require('./custom.json');

const readFile = Promise.promisify(fs.readFile);
const writeFile = Promise.promisify(fs.writeFile);
const unlink = Promise.promisify(fs.unlink);

const modcommands = ['!addemote', '!delemote', '!mod', '!demod', '!echothread'];
const commands = ['!id', '!ping', '!customlist', '!threadID', '!modlist', '!modcommands', '!modme', '!echo'];
var modlist = []; //mod IDs go here.

exports.parse = parse;
exports.setModlist = setModlist;

function setModlist(list) {
	modlist = list;
}

function cleanMessage(msg) {
	return msg
		.replace(/[^\w\s]|_/g, "")
		.replace(/\s+/g, " ")
		.toLowerCase();
}

function isGlobalEmote(word) {
	return (globalEmotes.emotes[word] != null);
}

function isSubEmote(word) {
	return (subEmotes.emotes.find(obj => obj.code === word) != null);
}

function isBTTVEmote(word) {
	return (bttvEmotes.emotes.find(obj => obj.code === word) != null);
}

function isCustomEmote(word) {
	return (customEmotes.emotes[word] != null);
}

function parse(api, message) {

	Promise.try(function() {
		const split = message.body.split(" ");

		if (message.body === '!id') {
			api.sendMessage("Your ID is " + message.senderID, message.threadID);
		} else if (message.body === '!modme' && modlist.length <= 1) {
			Promise.try(function() {
				if (modlist.length == 1) {
					if (modlist[0] == '') {
						modlist[0] = message.senderID;
					}
					//else there's already a mod
				} else { //modlist has length 0
					modlist.push(message.senderID);
				}
				api.sendMessage("You have been made the first mod!", message.threadID);
				return writeFile('./modlist', modlist.join('\n'));
			});
		} else if (message.body === '!commands') {
			const response = "Commands: " + commands.join(', ');
			api.sendMessage(response, message.threadID);
		} else if (message.body === '!modcommands') {
			const response = "Mod Commands: " + modcommands.join(', ');
			api.sendMessage(response, message.threadID);
		} else if (message.body === '!customlist') {
			const response = "Custom emote list: " + Object.keys(customEmotes.emotes).join(', ');
			api.sendMessage(response, message.threadID);
		} else if (message.body === '!ping') {
			api.sendMessage("pong", message.threadID);
		} else if (message.body === '!threadID') {
			api.sendMessage(message.threadID + "", message.threadID);
		} else if (split[0] === '!echo' && split.length > 1) {
			const response = split.slice(1).join(" ");
			api.sendMessage(response, message.threadID);
		} else if (message.body === '!modlist' && split.length === 1) {
			Promise.try(function() {
				if (modlist[0] == '' || modlist.length === 0) {
					return "None yet.";
					api.sendMessage(response, message.threadID);
				} else {
					return api.getUserInfoAsync(modlist)
						.then((userarray) => Object.values(userarray).map(user => user.name).join(', ')); //return array of names
				}
			}).then((listofnames) => {
				let response = "Mods: " + listofnames;
				api.sendMessage(response, message.threadID);
			})
		} else if (modlist.includes(message.senderID) && modcommands.includes(split[0])) {
			//note that addemote and delemote are broken until readfile support
			if (split[0] === '!addemote' && split.length === 4) {
				Promise.try(function() {
					const emotename = split[1].toLowerCase();
					const url = "http://" + split[2] + "/" + split[3];
					customEmotes.emotes[emotename] = '';
					const emotefilename = __dirname + '/emotes/' + emotename + '.png';
					return emotefxn.downloadImage(url, emotefilename)
				}).then(() => {
					api.sendMessage("Emote added!", message.threadID);
					return writeFile('./custom.json', JSON.stringify(customEmotes))
				});
			} else if (split[0] === '!delemote' && split.length === 2) {
				Promise.try(function() {
					const emotename = split[1];
					delete customEmotes.emotes[emotename];
					const emotefilename = __dirname + '/emotes/' + emotename + '.png';
					return unlink(emotefilename)
				}).then(() => {
					api.sendMessage("Emote deleted!", message.threadID);
					return writeFile('./custom.json', JSON.stringify(customEmotes))
				}).catch(err => {
					console.error("Error occurred while trying to remove file", err);
				});

			} else if (split[0] === '!mod') {
				Promise.try(function() {
					if (split.length === 2) {
						return split[1];
					} else {
						const name = split[1] + " " + split[2];
						return api.getUserIDAsync(name)
							.then((data) => data[0].userID); //return userid
					}
				}).then((id) => {
					modlist.push(id);
					api.sendMessage("Mod successful!", message.threadID);
					return writeFile('./modlist', modlist.join('\n'));
				}).catch(err => {
					api.sendMessage("Adding ID failed, exiting.", message.threadID);
					console.error(err);
				});
			} else if (split[0] === '!demod') {
				Promise.try(function() {
					if (split.length === 2) {
						return split[1];
					} else {
						const name = split[1] + " " + split[2];
						return api.getUserIDAsync(name)
							.then((data) => data[0].userID); //return userid
					}
				}).then((id) => {
					if (modlist.includes(id)) {
						modlist.splice(modlist.indexOf(id), 1);
						api.sendMessage("Demod successful!", message.threadID);
						return writeFile('./modlist', modlist.join('\n'));
					} else {
						api.sendMessage("Mod not found.", message.threadID);
					}
				}).catch(err => {
					api.sendMessage("Adding ID failed, exiting.", message.threadID);
					console.error(err);
				});

			} else if (split[0] === '!echothread' && split.length > 2) {
				const response = split.slice(2).join(" ");
				api.sendMessage(response, split[1]);
			}
		} else {
			//eventually move to another function?
			let cleanedMsg = cleanMessage(message.body);
			let splitWords = cleanedMsg.split(" ");

			return Promise.filter(splitWords, (word) => {
				return (isGlobalEmote(word) || isSubEmote(word) || isBTTVEmote(word) || isCustomEmote(word));
			}).then((emoteWords) => {
				return emoteWords.slice(0, 5); //only return 5 in order
			}).map((emoteWord) => {
				return emotefxn.getEmoteImageStream(emoteWord);
			}).then((imageStreams) => {
				api.sendMessage({
					attachment: imageStreams
				}, message.threadID);
			}).catch(function(err) {
				console.error('Emote parsing threw an error!', err);
			});
		}
	}).catch(err => {
		api.sendMessage("Misc error during parsing, check console.", message.threadID);
		console.error("Error during parsing!", err)
	})

}