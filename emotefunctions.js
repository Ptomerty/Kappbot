'use strict';
const Promise = require('bluebird');
const fs = require('fs');
const fetch = require('node-fetch');
const sharp = require('sharp');

const readFile = Promise.promisify(fs.readFile);
const writeFile = Promise.promisify(fs.writeFile);

const twitchEmotes = require('./twitch.json');
const bttvEmotes = require('./bttv.json');
const customEmotes = require('./custom.json');

const transformer = sharp()
  .resize(200, 200)
  .on('error', function(err) {
    console.log(err);
  });

//https://www.npmjs.com/package/promisepipe

var pipePromise = function(data, pathname) {
	return new Promise((resolve, reject) => {
		console.log("entered sharp!");
		//var dest = fs.createWriteStream(pathname);
		sharp(data)
			.resize(200,200)
			.toFile(pathname)
		.then(() => {
			console.log("sharp completed)")
			resolve();
		})
		.catch((err) => {
			console.error(err);
			reject(err);
		})
		// var pipe = data.pipe(transformer).pipe(dest);
		// pipe.on('close', () => {
		// 	resolve();
		// }).on('error', () => {
		// 	pipe.end();
		// 	reject();
		// })
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

var getEmoteImageStream = function(name, url) {
	const pathname = __dirname + '/emotes/' + name + '.png';
	return new Promise((resolve, reject) => {
		const stream = fs.createReadStream(pathname);
		//ENOENT thrown here!
		stream.on('error', function(error) {
				if (error.code == 'ENOENT') {
					if (url == null) {
						url = generateURL(name);
					}
					Promise.try(function(){
						return fetch(url)
					}).then((res) => {
						return pipePromise(res.body, pathname);
					}).then(() => {
						const stream = fs.createReadStream(pathname);
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
exports.pipePromise = pipePromise;