'use strict';
const Promise = require('bluebird');
const fs = require('fs');
const wget = require('wget-improved')

var readFile = Promise.promisify(fs.readFile);
var writeFile = Promise.promisify(fs.writeFile);
var open = Promise.promisify(fs.open);
var close = Promise.promisify(fs.close);

const globalEmotes = require('./global.json');
const subEmotes = require('./subs.json');
const bttvEmotes = require('./bttv.json');
const customEmotes = require('./custom.json');

var downloadImage = function(url, pathname) {
	return new Promise(function(resolve, reject) {
		return open(pathname, "wx")
			.then((fd) => {
				return close(fd);
			}).then(() => {
				wget.download(url, pathname)
					.on('error', function(err) {
						if (err.code === 'EEXIST') {
							resolve //file exists and has been downloaded
						} else {
							reject
						}
					})
					.on('end', resolve);
			}).catch(err => {
				reject(err);
			});
	});
}

var generateURL = function(name) {
	var imageID;
	var url;
	if (globalEmotes.emotes[name]) {
		// console.log('emote is global')
		imageID = globalEmotes.emotes[name].image_id;
		url = 'https://static-cdn.jtvnw.net/emoticons/v1/' + imageID + '/2.0';
	} else if (subEmotes.emotes.find(obj => obj.code === name)) {
		// console.log('emote is subsonly')
		imageID = subEmotes.emotes.find(obj => obj.code === name).image_id;
		url = 'https://static-cdn.jtvnw.net/emoticons/v1/' + imageID + '/2.0';
	} else if (bttvEmotes.emotes.find(obj => obj.code === name)) {
		imageID = bttvEmotes.emotes.find(obj => obj.code === name).id
		url = 'https://cdn.betterttv.net/emote/' + imageID + '/2x';
	} else {
		url = 'a'; //makes wget error out
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
					return downloadImage(url, pathname)
						.then(() => {
							const stream = fs.createReadStream(pathname);
							resolve(stream);
						})
						.catch(err => {
							console.error('error during downloading!', err);
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

exports.downloadImage = downloadImage;
exports.generateURL = generateURL;
exports.getEmoteImageStream = getEmoteImageStream;