const fs = require("fs");
const login = require("facebook-chat-api");

login({
	appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8'))
}, (err, api) => {
	if (err) return console.error(err);
	api.listen((err, message) => {
		api.getUserID(message.sender, (err, data) => {
			if (err) return console.error(err);
			var msg = "Hello, " + message.sender + " ID: " + data[0].userID;
			api.sendMessage(msg, message.threadID);
		});
	});
});