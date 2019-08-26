'use strict';
const fs = require('fs');
const fetch = require('node-fetch');
const util = require('util');
const stream = require('stream');
const sharp = require('sharp');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const pipeline = util.promisify(stream.pipeline);

const twitchEmotes = require('./twitch.json');
const bttvEmotes = require('./bttv.json');
const customEmotes = require('./custom.json');

//https://www.npmjs.com/package/promisepipe

async function writeToFile(data, pathname) {
	const transformer = sharp()
		.resize(112, 112)
		.withoutEnlargement()
		.on('error', (err) => console.log);
	try {
		pipeline(
			data,
			transformer,
			fs.createWriteStream(pathname)
			);
	} catch (err) {
		throw new Error("Error during writing of sharp-transformed data to file!");
	}
}

function generateURL(name) {
	
}

var generateURL = function(name) {
	var imageID;
	var url;

	if (bttvEmotes[name] != null) {
		imageID = bttvEmotes[name];
		url = 'https://cdn.betterttv.net/emote/' + imageID + '/3x';
	} else if (twitchEmotes[name] != null) {
		// console.log('emote is global')
		imageID = twitchEmotes[name];
		url = 'https://static-cdn.jtvnw.net/emoticons/v1/' + imageID + '/3.0';
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