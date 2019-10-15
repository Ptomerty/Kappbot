# Kappbot

Bot that sends Twitch Emotes to Facebook chats

# How to setup
-----
Requires `facebook-chat-api`, `bluebird`, `node-fetch`, `forever` (-g option), `sharp`.

Replace `FB_EMAIL` and `FB_PASSWORD` in `saveapp.js`, then run it to produce your `appstate.json`. Run `setup.js` to update your Twitch/BTTV emotes, then run `Kappbot.js` from then on. Run `setup.js` if you ever need to update your emotes again.

### Custom emotes
-----
When the bot first starts, type `!modme` to make yourself the first mod. Note that anyone can type this, so be quick about it!

Type `!commands` or `!modcommands` to list possible commands, most work as expected.

Syntax for `!mod` is `!mod [first name] [last name]`, same with `!demod`.

Syntax for `!addemote` is `!addemote [emotename] [basesite] [restofURL]` to avoid FB errors. For example, `!addemote sampleemote i.imgur.com QFCBlMD.jpg` will work.

Syntax for `!echothread` is `!echothread [threadID] [message..]`. 

Custom emote list can be enumerated with `!customlist` in chat.

Huge thanks to zsoc, joepie91, charmander, and everyone else on #Node.js for helping me throughout the whole project!

### Changelog
-----
v2.0: Partial rewrite to use node-fetch, breaks backwards compatibility.

v1.1: Complete rewrite to work with promises.