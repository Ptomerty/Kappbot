'use strict';

const util = require('util');
const login = util.promisify(require('facebook-chat-api'));
const fsp = require('fs').promises;
const readline = require('readline');

const handler = require('./handler.js');
const credentials = require('./credentials.json');

const MAX_NUMBER_OF_EMOTES = 7;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

async function getAPI() {
    let appstate;
    let api;
    try {
        appstate = await fsp.readFile(`${__dirname}/appstate.json`, 'utf8');
        console.log("Found existing appstate...")
    } catch (e) {
        console.log("Existing appstate not found.")
    }
    try {
        if (appstate === undefined) {
            api = await login({ email: credentials.email, password: credentials.password });
            await fsp.writeFile(`${__dirname}/appstate.json`, JSON.stringify(api.getAppState()));
            console.log('Created new appstate!');
        } else {
            api = await login({ appState: JSON.parse(appstate) });
            console.log('Logged in with existing appstate.');
        }
    } catch (e) {
        if (e.error == 'login-approval') {
            console.log('Enter code > ');
            rl.on('line', (line) => {
                e.continue(line);
                rl.close();
            });
        } else {
            console.error(e);
        }
    }
    return api;
}
(async () => {
    await fsp.mkdir(`${__dirname}/emotes/img`, { recursive: true });
    
    let api = await getAPI();
    await handler.init();

    api.setOptions({
        // logLevel: "silent",
        forceLogin: true,
        listenEvents: true,
    });

    api.listenMqtt(async (err, message) => {
        if (message.type === 'message' || message.type === 'message_reply') {
            message.body = message.body.replace(/\s+/g, ' ');
            let split = message.body.split(' ');
            const command = split[0];

            if (handler.funcMap.has(command)) {
                // console.log("found command!")
                const response = await handler.funcMap.get(command)(api, message);
                // console.log("response: " + response);
                api.sendMessage(response, message.threadID);
                api.markAsRead(message.threadID);
            } else {
                // remove non-alphanumeric characters
                split = split.map((x) => x.replace(/[^\w\s]|_/g, ''));
                split = split.filter(handler.emoteExists);
                if (split.length > 0) {
                    split = split.slice(0, MAX_NUMBER_OF_EMOTES);
                    const promises = split.map(handler.generateEmoteStream);
                    const result = await Promise.all(promises);
                    api.sendMessage({ attachment: result }, message.threadID);
                    api.markAsRead(message.threadID);
                }
            }
        } else if (message.type === 'event') {
            if (message.logMessageData.addedParticipants[0].userFbId === api.getCurrentUserID()) {
                api.sendMessage('Hello! Type !help to view available commands.', message.threadID);
                api.markAsRead(message.threadID);
            }
        }
    });
})();