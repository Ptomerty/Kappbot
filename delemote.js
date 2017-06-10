const wget = require('wget-improved');
const custom = require('./custom.json');
const fs = require('fs');

const emotename = process.argv[2].toLowerCase();

function updateJSON() {
	fs.writeFile('custom.json', customJSONstr, (err) => {
		if (err) throw err;
		console.log('written!');
	});
}

delete custom.emotes[emotename];
var customJSONstr = JSON.stringify(custom);


updateJSON();