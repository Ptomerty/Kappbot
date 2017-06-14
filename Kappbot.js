const Promise = require('bluebird');
const fs = require('fs');
const login = Promise.promisify(require('facebook-chat-api'));
const wget = require('wget-improved');
const emotefxn = require('./emotefunctions.js');

const modcommands = ['!addemote', '!delemote', '!mod', '!demod', '!echo'];
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
}).then(() => {
	return login({
		appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8'))
	})
}).then((api) => {
	api.setOptions({
		logLevel: "silent"
	}); //then-able here?

	api.listen((err, message) => { //also thenable?
		if (err) return console.warn(err);
		console.log("in api!")

		function sendMsg(array) {
			// console.log('exists and pathname is ' + pathname);
			let msg = {
				attachment: array
			}
			api.sendMessage(msg, message.threadID);
		}

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
				console.log("mod command!");
				//note that addemote and delemote are broken until readfile support
				if (split[0] === '!addemote' && split.length === 3) {
					console.log("addemote");
					var emotename = split[1];
					var url = split[2];
					custom.emotes[emotename] = '';
					console.log(emotename + " " + url);
					console.log(custom.emotes);
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
					custom.emotes.splice(custom.emotes.indexOf(custom.emotes[emotename]), 1);
					var customJSONstr = JSON.stringify(custom);
					return unlink(__dirname + '/emotes/' + emotename + '.png')
						.then(() => {
							updateJSON(customJSONstr);
							api.sendMessage("Emote deleted!", message.threadID);
						}).catch(err => {
							console.error("Error occurred while trying to remove file");
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
					for (i = 1; i < split.length(); i++) {
						send += split[i] + " ";
					}
					api.sendMessage(send.substring(0, send.length - 1), message.threadID);
				}
			}
		}
		console.log(message.body);
		console.log(message.attachments);
		if (typeof message.body === 'string' && message.body !== undefined) {
			checkForCommands(message);
			var cleanedMsg = message.body.replace(/[^\w\s]|_/g, "")
				.replace(/\s+/g, " ").toLowerCase();
			var splitWords = cleanedMsg.split(" ");
			let counter = 0;
			var sendArray = [];
			for (var i = 0; i < splitWords.length; i++) {
				var name = splitWords[i];
				// console.log('emote exists!')
				if (globalEmotes.emotes[name] !== undefined ||
					subs.emotes.find(obj => obj.code === name) !== undefined ||
					bttv.emotes.find(obj => obj.code === name) !== undefined ||
					custom.emotes[name] !== undefined) {
					sendArray.push(emotefxn.getEmoteImageStream(name));
					counter++;
					if (counter >= 5) {
						//prevent spam
						break;
					}
				}
			}
			Promise.all(sendArray)
				.then(sendMsg)
				.catch(function(err) {
					console.error('Promise.all() threw an error!', err);
				});
		}
	}); //api.listen

}).catch((err) => {
	console.error("Error during login/connection to API!", err);
}); //login