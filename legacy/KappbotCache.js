const fs = require("fs");
const login = require("facebook-chat-api");
var global = require('./global.json');
var subs = require('./subs.json');
var wget = require('wget-improved');

login({
	appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8'))
}, (err, api) => {
	if (err) return console.error(err);

	api.setOptions({
		logLevel: "silent"
	});

	api.listen((err, message) => {

		function checkIfDownloaded(name) {

			function sendMsg() {
				// console.log('exists and pathname is ' + pathname);
				let msg = {
					attachment: fs.createReadStream(pathname)
				}
				api.sendMessage(msg, message.threadID);
			}

			function wgetErr(err) {
				//is err populated if referred to?
				throw err
			}

			function handleDownload(err) {
				if (err && err.code === 'ENOENT') {
					//file is missing, download
					if (global.emotes[name] !== undefined) {
						// console.log('emote is global')
						var URL = 'https:\/\/static-cdn.jtvnw.net\/emoticons\/v1\/' + global.emotes[name].image_id + '\/2.0';
					} else {
						// console.log('emote is subsonly')
						var URL = 'https:\/\/static-cdn.jtvnw.net\/emoticons\/v1\/' + subs.emotes.find(obj => obj.code === name).image_id + '\/2.0';
					}
					fs.open(pathname, "wx", function(err, fd) {
						fs.close(fd, function(err) {});
					});
					wget.download(URL, pathname)
						.on('error', wgetErr)
						.on('end', sendMsg)
				} else {
					//file already exists, err was not populated
					// console.log('already downloaded!');
					sendMsg(pathname)
				}
			}

			var pathname = __dirname + '/emotes/' + name + '.png';

			fs.access(pathname, (err) => {
				handleDownload(err);
			});
		}

		if (message.body !== null && typeof message.body === 'string') {

			var cleanedMsg = message.body.replace(/[^\w\s]|_/g, "")
				.replace(/\s+/g, " ");
			var splitWords = cleanedMsg.split(" ");
			var counter = 0;
			for (var i = 0; i < splitWords.length; i++) {
				var name = splitWords[i];
				if (global.emotes[name] !== undefined || subs.emotes.find(obj => obj.code === name) !== undefined) {
					// console.log('emote exists!')
					checkIfDownloaded(name);
					counter++;
					if (counter >= 1) {
						//async messes up order
						break;
					}
				}
			}
		}
	});
});