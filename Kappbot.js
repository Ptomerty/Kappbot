const fs = require("fs");
const login = require("facebook-chat-api");
const wget = require('wget-improved');
const Promise = require('bluebird');

const globalEmotes = require('./global.json');
const subs = require('./subs.json');
const bttv = require('./bttv.json');
const custom = require('./custom.json');

login({
	appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8'))
}, (err, api) => {
	if (err) return console.error(err);

	api.setOptions({
		logLevel: "silent"
	});

	api.listen((err, message) => {

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
			var URL;
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


		if (message.body !== null && typeof message.body === 'string') {
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
					if (counter >= 3) {
						//async messes up order
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