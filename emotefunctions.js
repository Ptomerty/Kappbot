'use strict';
const Promise = require('bluebird');
const fs = require('fs');
const fetch = require('node-fetch');

const readFile = Promise.promisify(fs.readFile);
const writeFile = Promise.promisify(fs.writeFile);

const twitchEmotes = require('./twitch.json');
const bttvEmotes = require('./bttv.json');
const customEmotes = require('./custom.json');

//https://www.npmjs.com/package/promisepipe

var downloadImage = function(url, pathname) {
	return new Promise((resolve, reject) => {
		Promise.try(function(){
			return fetch(url)
		}).then((res) => {
			resolve(pipePromise(res.body, pathname));
		})
	})
}

var pipePromise = function(data, pathname) {
	return new Promise((resolve, reject) => {
		var dest = fs.createWriteStream(pathname);
		var pipe = data.pipe(dest);
		pipe.on('finish', () => {
			console.log('pipe done')
			resolve();
		}).on('error', () => {
			pipe.end();
			reject();
		})
	})
}

var generateURL = function(name) {
	var imageID;
	var url;

	if (bttvEmotes[name] != null) {
		imageID = bttvEmotes[name];
		url = 'https://cdn.betterttv.net/emote/' + imageID + '/2x';
	} else if (twitchEmotes[name] != null) {
		// console.log('emote is global')
		imageID = twitchEmotes[name];
		url = 'https://static-cdn.jtvnw.net/emoticons/v1/' + imageID + '/2.0';
	}
	return url;
}

var getEmoteImageStream = function(name) {
	const pathname = __dirname + '/emotes/' + name + '.png';
	return new Promise((resolve, reject) => {
		const stream = fs.createReadStream(pathname);
		//ENOENT thrown here!
		stream.on('error', function(error) {
				if (error.code == 'ENOENT') {
					const url = generateURL(name);
					Promise.try(function(){
						return downloadImage(url, pathname)
					}).then(() => {
						const stream = fs.createReadStream(pathname);
						console.log('readstream created!')
						resolve(stream);
					}).catch(err => {
						console.error('error during downloading!', err);
					});
				} else {
					reject(err);
				}
			})
			.on('readable', () => {
				// console.log('stream should be ready ' + pathname);
				resolve(stream);
			});
	});
}
exports.getEmoteImageStream = getEmoteImageStream;
exports.downloadImage = downloadImage;