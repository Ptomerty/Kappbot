'use strict';
const fs = require('fs');
const fetch = require('node-fetch');
const util = require('util');
const stream = require('stream');
const sharp = require('sharp');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const unlink = util.promisify(fs.unlink);
const pipeline = util.promisify(stream.pipeline);

const twitchEmotes = require('../emotes/twitch.json');
const bttvEmotes = require('../emotes/bttv.json');



async function sharpTransformToStream(data, pathname) {
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

async function getEmoteImageStream (name, url) {
	const pathname = `${__dirname}/emotes/img/${name}.png`;
	return new Promise((resolve, reject) => {
		const stream = fs.createReadStream(pathname);
		//ENOENT thrown here!
		stream.on('error', function(error) {
				if (error.code == 'ENOENT') {
					if (url == null) {
						if (name in bttvEmotes) {
							url = bttvEmotes[name];
						} else if (name in twitchEmotes) {
							url = twitchEmotes[name];
						}
					}
					try {
						async () => {
							let res = await fetch(url);
							await sharpTransformToStream(res.body, pathname);
							let stream = fs.createReadStream(pathname);
							resolve(stream);
						}
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

async function deleteEmoteFile(name) {
	const pathname = `${__dirname}/emotes/img/${name}.png`;
	await unlink(pathname);
}

module.exports = {
	getEmoteImageStream,
	sharpTransformToStream,
	deleteEmoteFile
}