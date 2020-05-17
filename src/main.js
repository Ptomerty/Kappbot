'use strict';

const util = require('util');
const login = util.promisify(require('facebook-chat-api'));
const handler = require('./handler.js');
const mkdirp = require('mkdirp');

const MAX_NUMBER_OF_EMOTES = 7;
const credentials = {
    email: process.env.FB_EMAIL,
    password: process.env.FB_PASSWORD
};

(async () => {
    await mkdirp(`${__dirname}/emotes/img`);
    let api = await login({email: credentials.email, password: credentials.password});
    api.setOptions({
            // logLevel: "silent",
            listenEvents: true
        });
    
    api.listenMqtt(async (err, message) => {
        if (message.type === 'message' || message.type === 'message_reply') {
            message.body = message.body.replace(/\s+/g, " ");
            let split = message.body.split(" ");
            let command = split[0];

            if (handler.funcMap.has(command)) {
                // console.log("found command!")
                let response = await handler.funcMap.get(command)(api, message);
                // console.log("response: " + response);
                api.sendMessage(response, message.threadID);
            } else {
                // remove non-alphanumeric characters
                split = split.map(x => x.replace(/[^\w\s]|_/g, ""));
                split = split.filter(handler.emoteExists);
                split = split.slice(0, MAX_NUMBER_OF_EMOTES);

                let promises = split.map(handler.generateEmoteStream);
                let result = await Promise.all(promises);
                api.sendMessage({attachment: result}, message.threadID);
            }
        } else if (message.type === 'event') {
            if (message.logMessageData['addedParticipants'][0]['userFbId'] === api.getCurrentUserID()) {
                api.sendMessage("Hello! Type !help to view available commands.", message.threadID);
            }
        }
    });
})();