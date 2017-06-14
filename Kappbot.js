// 'use strict';
const Promise = require('bluebird');
const fs = require('fs');
const login = Promise.promisify(require('facebook-chat-api'));
const wget = require('wget-improved');
const emotefxn = require('./emotefunctions.js');

const globalEmotes = require('./global.json');
const subs = require('./subs.json');
const bttv = require('./bttv.json');
const custom = require('./custom.json');

const modcommands = ['!addemote', '!delemote', '!mod', '!demod', '!echo', '!echothread'];
const commands = ['!id', '!ping', '!customlist', '!threadID', '!modlist', '!modcommands'];
const modlist = []; //fill in with your own ID.

var readFile = Promise.promisify(fs.readFile);
var writeFile = Promise.promisify(fs.writeFile);
var unlink = Promise.promisify(fs.unlink);



return readFile('./appstate.json', 'utf8')
	.then(JSON.parse)
	.then((data) =>
		login({
			appState: data
		}))
	.then((api) => {
		api.setOptions({
			logLevel: "silent"
		});

		api.listen((err, message) => {
			if (err) return console.warn(err);
			
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
				return (subs.emotes.find(obj => obj.code === word) != null);
			}
			
			function isBTTVEmote(word) {
				return (bttv.emotes.find(obj => obj.code === word) != null);
			}
			
			function isCustomEmote(word) {
				return (globalEmotes.emotes[word] != null);
			}

			function checkForCommands(message) {
				var split = message.body.split(" ");

				if (message.body === '!id') {
					api.sendMessage("Your ID is " + message.senderID, message.threadID);
				} else if (message.body === '!commands') {
					var send = "Commands: " + commands.join(', ');
					api.sendMessage(send, message.threadID);
				} else if (message.body === '!modcommands') {
					var send = "Mod Commands: " + modcommands.join(', ');
					api.sendMessage(send, message.threadID);
				} else if (message.body === '!customlist') {
					var send = "Custom emote list: ";
					Object.keys(custom.emotes).forEach(function(key) {
						send += key + ', ';
					});
					send = send.substring(0, send.length - 2);
					api.sendMessage(send, message.threadID);
				} else if (message.body === '!ping') {
					api.sendMessage("pong", message.threadID);
				} else if (message.body === '!threadID') {
					api.sendMessage(message.threadID + "", message.threadID);
				} else if (split[0] === '!echo' && split.length > 1) {
					var send = split.slice(1).join(" ");
					api.sendMessage(send, message.threadID);
				} else if (message.body === '!modlist' && split.length === 1) {
					var send = "Mods: ";
					api.getUserInfo(modlist, (err, ret) => {
						if (err) return console.error(err);
						for (var prop in ret) {
							send += ret[prop].name + ", ";
						}
						send = send.substring(0, send.length - 2);
						api.sendMessage(send, message.threadID);
					});
				} else if (modlist.includes(message.senderID)) {
					//note that addemote and delemote are broken until readfile support
					if (split[0] === '!addemote' && split.length === 4) {
						var emotename = split[1].toLowerCase();
						var url = "http://" + split[2] + "/" + split[3];
						custom.emotes[emotename] = '';
						var emotefilename = __dirname + '/emotes/' + emotename + '.png';
						return emotefxn.downloadImage(url, emotefilename)
							.then(() => {
								api.sendMessage("Emote added!", message.threadID);
								writeFile('./custom.json', JSON.stringify(custom))
							}).catch(err => {
								console.error("error while adding emote!");
							});
					} else if (split[0] === '!delemote' && split.length === 2) {
						//custom.emotes.splice(custom.emotes.indexOf(custom.emotes[emotename]), 1);
						var emotename = split[1];
						delete custom.emotes[emotename];
						var emotefilename = __dirname + '/emotes/' + emotename + '.png';

						return unlink(emotefilename)
							.then(() => {
								api.sendMessage("Emote deleted!", message.threadID);
								writeFile('./custom.json', JSON.stringify(custom))
							}).catch(err => {
								console.error("Error occurred while trying to remove file", err);
							});

					} else if (split[0] === '!mod' && split.length === 3) {
						var name = split[1] + " " + split[2];
						api.getUserID(name, (err, data) => {
							if (err) {
								api.sendMessage("Lookup failed, exiting.", message.threadID);
								console.error(err);
							}
							modlist.push(data[0].userID);
							api.sendMessage("Mod successful!", message.threadID);
						});
					} else if (split[0] === '!demod' && split.length === 3) {
						var name = split[1] + " " + split[2];
						api.getUserID(name, (err, data) => {
							if (err) {
								api.sendMessage("Lookup failed, exiting.", message.threadID);
								console.error(err);
							}
							if (modlist.includes(data[0].userID)) {
								modlist.splice(modlist.indexOf(data[0].userID), 1);
								api.sendMessage("Demod successful!", message.threadID);
							}
						});
					} else if (split[0] === '!echothread' && split.length > 2) {
						var send = split.slice(2).join(" ");
						api.sendMessage(send.substring(0, send.length - 1), split[1]);
					}
				} else {
					//eventually move to another function?
					let cleanedMsg = cleanMessage(message.body);
					let splitWords = cleanedMsg.split(" ");
					
					return Promise.filter(splitWords, (word) => {
						return (isGlobalEmote(word) || isSubEmote(word) || isBTTVEmote(word) || isCustomEmote(word));
					}).then((emoteWords) => {
						return emoteWords.slice(0,5); //only return 5 in order
					}).map((emoteWord) => {
						return emotefxn.getEmoteImageStream(emoteWord);
					}).then((imageStreams) => {
						return api.sendMessage({
							attachment: imageStreams
						}, message.threadID);
					}).catch(function(err) {
							console.error('Promise.all() threw an error!', err);
					});
				}
			}
			if (typeof message.body === 'string' && message.body !== undefined) {
				checkForCommands(message);
			}
		}); //api.listen

	}).catch((err) => {
		console.error("Error during login/connection to API!", err);
	}); //login
