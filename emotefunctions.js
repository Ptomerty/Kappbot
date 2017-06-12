const Promise = require('bluebird');
const fs = require('fs');
const wget = require('wget-improved')

var readFile = Promise.promisify(fs.readFile);
var writeFile = Promise.promisify(fs.writeFile);

Promise.all([
	readFile('./global.json', 'utf8'), readFile('./subs.json', 'utf8'),
	readFile('./bttv.json', 'utf8'), readFile('./custom.json', 'utf8')
]).then(([file1, file2, file3, file4]) => {
	globalEmotes = file1;
	subs = file2;
	bttv = file3;
	custom = file4;
})

var downloadImage = function(url, pathname) {
	return new Promise(function(resolve, reject) {
		//PROMISIFY ALL OF THESE UGH
		//open.then(close).then(wget)?
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

var generateURL = function(name) {
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

exports.downloadImage = downloadImage;
exports.generateURL = generateURL;
exports.getEmoteImageStream = getEmoteImageStream;