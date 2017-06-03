const fs = require("fs");
const login = require("facebook-chat-api");
var global = require('./global.json');

login({appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8'))}, (err, api) => {
    if(err) return console.error(err);

    api.setOptions({
    	logLevel: "silent"
	});

    api.listen((err, message) => {
    	if (message.body != null && typeof message.body === 'string') {
    		var cleanedMsg = message.body.replace(/[^\w\s]|_/g, "")
         			.replace(/\s+/g, " ");
     		var splitWords = cleanedMsg.split(" ");

			var hrstart = process.hrtime();

         	for (var i = 0; i < splitWords.length; i++) {
         		var name = splitWords[i];
         		if (global.emotes[name] != null) {
         			var imageID = global.emotes[name].image_id;
         			var msg = { url: 'https:\/\/static-cdn.jtvnw.net\/emoticons\/v1\/' + imageID + '/2.0' }
         		}
         	}
         	if (msg != null) {
        		api.sendMessage(msg, message.threadID);
        	}
        	var hrend = process.hrtime(hrstart);
        	console.info("Execution time (hr): %ds %dms", hrend[0], hrend[1]/1000000);
        }
    });
});