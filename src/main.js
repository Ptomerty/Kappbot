'use strict';

const util = require('util');
const login = util.promisify(require('facebook-chat-api'));
const mkdirp = require('mkdirp');
const fsp = require('fs').promises;
const readline = require('readline');

const handler = require('./handler.js');
const credentials = require('./credentials.json');

const MAX_NUMBER_OF_EMOTES = 7;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

(async () => {
    await mkdirp(`${__dirname}/emotes/img`); // just in case

    let appstate;
    let api;
    // super ugly but we don't know if facebook locks us out
    try {
        appstate = await fsp.readFile(`${__dirname}/appstate.json`, 'utf8');
        try {
            api = await login({ appState: JSON.parse(appstate) });
        } catch (e) {
            switch (e.error) {
                case 'login-approval':
                    console.log('Enter code > ');
                    rl.on('line', (line) => {
                        e.continue(line);
                        rl.close();
                    });
                    break;
                default:
                    console.error(e);
            }
        }
        console.log('Logged in with existing appstate.');
    } catch (e) {
        try {
            api = await login({ email: credentials.email, password: credentials.password });
        } catch (e2) {
            switch (e2.error) {
                case 'login-approval':
                    console.log('Enter code > ');
                    rl.on('line', (line) => {
                        e2.continue(line);
                        rl.close();
                    });
                    break;
                default:
                    console.error(e2);
            }
        }
        await fsp.writeFile(`${__dirname}/appstate.json`, JSON.stringify(api.getAppState()));
        console.log('Created new appstate!');
    }

    await handler.init();

    // let api = await login({email: credentials.email, password: credentials.password});
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