const Promise = require('bluebird');
const fs = require('fs');
const login = Promise.promisify(require('facebook-chat-api'));
const wget = require('wget-improved');
const emotefxn = require('./emotefunctions.js');

const modcommands = ['!addemote', '!delemote', '!mod', '!demod', '!echo', '!echothread'];
const commands = ['!id', '!ping', '!customlist', '!threadID', '!modlist', '!modcommands'];
const modlist = []; //fill in with your own ID.

var readFile = Promise.promisify(fs.readFile);
var writeFile = Promise.promisify(fs.writeFile);
var unlink = Promise.promisify(fs.unlink);

let globalEmotes, subs, bttv, custom;

Promise.all([
	readFile('./global.json', 'utf8'), readFile('./subs.json', 'utf8'),
	readFile('./bttv.json', 'utf8'), readFile('./custom.json', 'utf8')
]).then(([file1, file2, file3, file4]) => {
	globalEmotes = JSON.parse(file1);
	subs = JSON.parse(file2);
	bttv = JSON.parse(file3);
	custom = JSON.parse(file4);
	return login({
		appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8'))
	})
}).then((api) => {
	api.setOptions({
		logLevel: "silent"
	}); //then-able here?

	api.listen((err, message) => { //also thenable?
		if (err) return console.warn(err);

		function checkForCommands(message) {

			function updateJSON(newstr) {
				return writeFile('custom.json', newstr)
					.then(() => {
						return readFile('custom.json', 'utf8')
					}).then((newdata) => {
						custom = JSON.parse(newdata);
					});
				//readfile here
			}
			var split = message.body.split(" ");
			if (message.body === '!id') {
				api.sendMessage("Your ID is " + message.senderID, message.threadID);
			} else if (message.body === '!commands') {
				var send = "Commands: ";
				for (i = 0; i < commands.length; i++) {
					send += commands[i] + ", ";
				}
				send = send.substring(0, send.length - 2);
				api.sendMessage(send, message.threadID);
			} else if (message.body === '!modcommands') {
				var send = "Mod Commands: ";
				for (i = 0; i < modcommands.length; i++) {
					send += modcommands[i] + ", ";
				}
				send = send.substring(0, send.length - 2);
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
					var customJSONstr = JSON.stringify(custom);

					return emotefxn.downloadImage(url, emotefilename)
						.then(() => {
							updateJSON(customJSONstr);
							api.sendMessage("Emote added!", message.threadID);
						}).catch(err => {
							console.error("error while adding emote!");
						});
				} else if (split[0] === '!delemote' && split.length === 2) {
					//custom.emotes.splice(custom.emotes.indexOf(custom.emotes[emotename]), 1);
					var emotename = split[1];
					delete custom.emotes[emotename];
					var customJSONstr = JSON.stringify(custom);
					var emotefilename = __dirname + '/emotes/' + emotename + '.png';

					return unlink(emotefilename)
						.then(() => {
							console.log('deletd')
							updateJSON(customJSONstr);
							api.sendMessage("Emote deleted!", message.threadID);
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
						}
						api.sendMessage("Delete successful!", message.threadID);
					});
				} else if (split[0] === '!echo' && split.length > 1) {
					var send = "";
					for (i = 1; i < split.length; i++) {
						send += split[i] + " ";
					}
					api.sendMessage(send.substring(0, send.length - 1), message.threadID);
				} else if (split[0] === '!echothread' && split.length > 2) {
					var send = "";
					for (i = 2; i < split.length; i++) {
						send += split[i] + " ";
					}
					api.sendMessage(send.substring(0, send.length - 1), split[1]);
				}
			} else {
				//eventually move to another function?
				var cleanedMsg = message.body.replace(/[^\w\s]|_/g, "")
					.replace(/\s+/g, " ").toLowerCase();
				const splitWords = cleanedMsg.split(" ");
				Promise.reduce(splitWords, (acc, word) => {
						if (acc.length > 5) return acc;
						if (globalEmotes.emotes[word] ||
							subs.emotes.find(obj => obj.code === word) !== undefined ||
							bttv.emotes.find(obj => obj.code === word) !== undefined ||
							custom.emotes[word]) {
							return acc.concat([emotefxn.getEmoteImageStream(word)])
						}
						return acc
							//[] below stores result in array?
					}, []).then((array) => {
						// console.log('exists and pathname is ' + pathname);
						let msg = {
							attachment: array
						}
						api.sendMessage(msg, message.threadID);
					})
					.catch(function(err) {
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