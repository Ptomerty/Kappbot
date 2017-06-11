const fs = require("fs");
const login = require("facebook-chat-api");
const wget = require('wget-improved');
const Promise = require('bluebird');

const globalEmotes = require('./global.json');
const subs = require('./subs.json');
const bttv = require('./bttv.json');
const custom = require('./custom.json');

const modcommands = ['!addemote', '!delemote', '!mod', '!demod'];
const commands = ['!id', '!ping', '!customlist', '!commands'];
const modlist = []; //fill in with your own ID.

login({
	appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8'))
}, (err, api) => {
	if (err) return console.error(err);

	api.setOptions({
		logLevel: "silent"
	});

	api.listen((err, message) => {
		if (err) return console.warn(err);

		function downloadImage(url, pathname) {
			return new Promise(function(resolve, reject) {
				fs.open(pathname, "wx", function(err, fd) {
					if (err) {
						reject(err);
					}
					fs.close(fd, function(err) {
						if (err) {
							reject(err);
						}
						wget.download(url, pathname)
							.on('error', reject)
							.on('end', resolve);
					});
				});
			});
		}

		function generateURL(name) {
			var imageID;
			var url;
			if (globalEmotes.emotes[name] !== undefined) {
				// console.log('emote is global')
				imageID = globalEmotes.emotes[name].image_id;
				url = 'https://static-cdn.jtvnw.net/emoticons/v1/' + imageID + '/2.0';
			} else if (subs.emotes.find(obj => obj.code === name) !== undefined) {
				// console.log('emote is subsonly')
				imageID = subs.emotes.find(obj => obj.code === name).image_id;
				url = 'https://static-cdn.jtvnw.net/emoticons/v1/' + imageID + '/2.0';
			} else if (bttv.emotes.find(obj => obj.code === name) !== undefined) {
				imageID = bttv.emotes.find(obj => obj.code === name).id
				url = 'https://cdn.betterttv.net/emote/' + imageID + '/2x';
			} else {
				url = 'a'; //makes wget error out
			}
			return url;
		}

		function getEmoteImageStream(name) {
			const pathname = __dirname + '/emotes/' + name + '.png';

			return new Promise((resolve, reject) => {
				const stream = fs.createReadStream(pathname);
				//ENOENT thrown here!
				stream.on('error', function(error) {
						if (error.code == 'ENOENT') {
							const url = generateURL(name);
							return downloadImage(url, pathname)
								.then(() => {
									const stream = fs.createReadStream(pathname);
									resolve(stream);
								})
								.catch(err => {
									console.error('error in downloading!', err);
								});
						} else {
							reject(err);
						}
					})
					.on('readable', () => {
						// console.log('stream should be ready ' + pathname);
						const stream = fs.createReadStream(pathname);
						resolve(stream);
					});
			});
		}

		function sendMsg(array) {
			// console.log('exists and pathname is ' + pathname);
			let msg = {
				attachment: array
			}
			api.sendMessage(msg, message.threadID);
		}

		function checkForCommands(message) {

			function updateJSON() {
				fs.writeFile('custom.json', customJSONstr, (err) => {
					if (err) throw err;
					console.log('written!');
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
				api.sendMessage("Hello!", message.threadID);
			} else if (modlist.includes(message.senderID) && modcommands.includes(split[0])) {
				//note that addemote and delemote are broken until readfile support
				if (split[0] === '!addemote' && split.length === 3) {
					var emotename = split[1];
					var url = split[2];
					custom.emotes[emotename] = '';
					var customJSONstr = JSON.stringify(custom);
					wget.download(url, __dirname + '/emotes/' + emotename + '.png');
					updateJSON();
					api.sendMessage("Emote added!", message.threadID);
				} else if (split[0] === '!delemote' && split.length === 2) {
					fs.unlink(__dirname + '/emotes/' + emotename + '.png', function(err) {
						if (err && err.code == 'ENOENT') {
							// file doens't exist
							console.info("File doesn't exist, won't remove it.");
						} else if (err) {
							// maybe we don't have enough permission
							console.error("Error occurred while trying to remove file");
						} else {
							console.info(`removed`);
						}
					});
					delete custom.emotes[emotename];
					var customJSONstr = JSON.stringify(custom);
					updateJSON();
					api.sendMessage("Emote deleted!", message.threadID);
				} else if (split[0] === '!mod' && split.length === 3) {
					var name = split[1] + " " + split[2];
					api.getUserID(name, (err, data) => {
						if (err) {
							api.sendMessage("Lookup failed, exiting.", message.threadID);
							console.error(err);
						}
						modlist.push(data);
						api.sendMessage("Mod successful!", message.threadID);
					});
				} else if (split[0] === '!demod' && split.length === 3) {
					var name = split[1] + " " + split[2];
					api.getUserID(name, (err, data) => {
						if (err) {
							api.sendMessage("Lookup failed, exiting.", message.threadID);
							console.error(err);
						}
						if (modlist.includes(data)) {
							delete modlist[modlist.indexOf(data)];
						}
						api.sendMessage("Delete successful!", message.threadID);
					});
				}
			}
		}


		if (message.body !== undefined && typeof message.body === 'string') {
			checkForCommands(message);
			var cleanedMsg = message.body.replace(/[^\w\s]|_/g, "")
				.replace(/\s+/g, " ").toLowerCase();
			var splitWords = cleanedMsg.split(" ");
			var counter = 0;
			var sendArray = [];
			for (var i = 0; i < splitWords.length; i++) {
				var name = splitWords[i];
				// console.log('emote exists!')
				if (globalEmotes.emotes[name] !== undefined ||
					subs.emotes.find(obj => obj.code === name) !== undefined ||
					bttv.emotes.find(obj => obj.code === name) !== undefined ||
					custom.emotes[name] !== undefined) {
					sendArray.push(getEmoteImageStream(name));
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
	});
});