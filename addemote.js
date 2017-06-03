const wget = require('wget-improved');
const custom = require('./custom.json');
const fs = require('fs');

const emotename = process.argv[2].toLowerCase();
const url = process.argv[3];

function updateJSON() {
	fs.writeFile('custom.json', customJSONstr, (err) => {
		if (err) throw err;
		console.log('written!');
	});
}

custom.emotes[emotename] = '';
var customJSONstr = JSON.stringify(custom);

if (url !== undefined) {
	wget.download(url, __dirname + '/emotes/' + emotename + '.png');
}

updateJSON();