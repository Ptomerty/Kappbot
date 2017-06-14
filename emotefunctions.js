const Promise = require('bluebird');
const fs = require('fs');
const wget = require('wget-improved')

var readFile = Promise.promisify(fs.readFile);
var writeFile = Promise.promisify(fs.writeFile);
var open = Promise.promisify(fs.open);
var close = Promise.promisify(fs.close);

Promise.all([
	readFile('./global.json', 'utf8'), readFile('./subs.json', 'utf8'),
	readFile('./bttv.json', 'utf8'), readFile('./custom.json', 'utf8')
]).then(([file1, file2, file3, file4]) => {
	globalEmotes = JSON.parse(file1);
	subs = JSON.parse(file2);
	bttv = JSON.parse(file3);
	custom = JSON.parse(file4);
})

exports.downloadImage = function(url, pathname) {
	return new Promise(function(resolve, reject) {
		return open(pathname, "wx")
			.then((fd) => {
				return close(fd);
			}).then(() => {
				wget.download(url, pathname)
					.on('error', reject)
					.on('end', resolve);
			}).catch(err => {
				reject(err);
			});
	});
}

exports.generateURL = function(name) {
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

exports.getEmoteImageStream = function(name) {
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