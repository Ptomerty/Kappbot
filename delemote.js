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

fs.unlink(__dirname + '/emotes/' + emotename + '.png', function(err) {
    if(err && err.code == 'ENOENT') {
        // file doens't exist
        console.info("File doesn't exist, won't remove it.");
    } else if (err) {
        // maybe we don't have enough permission
        console.error("Error occurred while trying to remove file");
    } else {
        console.info(`removed`);
    }
});

delete custom.emotes[emotename];
var customJSONstr = JSON.stringify(custom);


updateJSON();