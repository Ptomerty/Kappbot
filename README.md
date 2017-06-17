# Kappbot
Bot that sends Twitch Emotes to Facebook chats

# How to use
-----
Requires facebook-chat-api, bluebird, wget-improved. (how to package.json?)

Run `saveapp.js`, replacing emails and passwords as needed. Then, run Kappbot.js.

### Custom emotes
-----
When the bot first starts, type `!modme` to make yourself the first mod. Note that anyone can type this, so be quick!

Type `!commands` or `!modcommands` to list possible commands.

Note that Facebook's userID API is currently down, so modding/demodding must be done with the person's ID. Simply navigate to their profile and look at their URL, or ask them to type `!id`.

Syntax for `!addemote` is `!addemote [emotename] [basesite] [restofURL]` to avoid FB errors. For example, `!addemote sampleemote i.imgur.com QFCBlMD.jpg` will work.

Syntax for `!echothread` is `!echothread [threadID] [message..]`. 

Custom emote list can be enumerated with `!customlist` in chat.

Huge thanks to zsoc, joepie91, charmander, and everyone else on #Node.js for helping me throughout the whole project!



