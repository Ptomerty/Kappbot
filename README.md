# Kappbot
Bot that sends Twitch Emotes to Facebook chats

# How to use
-----
Requires facebook-chat-api, bluebird, wget-improved. (how to package.json?)

Run `saveapp.js`, replacing emails and passwords as needed. Then, run Kappbot.js.

### Custom emotes
-----
Type `!commands!` or `!modcommands` to list possible commands:

Note: Syntax for `!addemote` is `!addemote [emotename] [basesite] [restofURL]` to avoid FB errors. For example, `!addemote sampleemote i.imgur.com QFCBlMD.jpg` will work.

`!echothread` is used as `!echothread [threadID] [message..]`. 

Custom emote list can be enumerated with `!customlist` in chat.

done: Refactor code with promises. This can lead to reading in the JSON files -> logging in -> api.listen.

Convert Mod List to Names, also with promises (required? idk) 

change delete to splice.

add !threadID, mod!echo, mod!echothread

promisify addemote? fix first, the image sent afterwards messes up the transmission. WORKAROUND: splice http:// off, replace slash with space

TODO: add prompt for first mod (console) if modlist is empty.

convert modlist to file (not json, just newlines)




