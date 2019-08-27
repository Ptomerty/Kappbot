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

async function sharpTransformToFile(data, pathname) {
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
	if (bttvEmotes[name] != null) {
		return `https://cdn.betterttv.net/emote/${bttvEmotes[name]}/3x`;
	} else if (twitchEmotes[name] != null) {
		return  `https://static-cdn.jtvnw.net/emoticons/v1/${twitchEmotes[name]}/3.0`;
	}
}

async function getEmoteImageStream (name, url) {
	const pathname = `../emotes/img/${name}.png`;
	return new Promise((resolve, reject) => {
		const stream = fs.createReadStream(pathname);
		//ENOENT thrown here!
		stream.on('error', function(error) {
				if (error.code == 'ENOENT') {
					if (url == null) {
						url = generateURL(name);
					}
					try {
						let res = await fetch(url);
						await sharpTransformToFile(res.body, pathname);
						let stream = fs.createReadStream(pathname);
						resolve(stream);
					} catch (err) {
						console.error('Error when getting emote stream!', err);
					}
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

module.exports = {
	getEmoteImageStream,
	sharpTransformToFile
}