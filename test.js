const Promise = require('bluebird');
const login = Promise.promisify(require('facebook-chat-api'));
const fs = require('fs')

return login({
		appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8'))
	})
	.then((api) => {
		var names = ['100009955866704'];
		api.getUserInfo(names, (err, ret) => {
			if (err) return console.error(err);
			console.log(ret);
			for (var object in ret) {
				console.log(ret[object].name);
			}
		});
	});