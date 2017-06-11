# Kappbot
Bot that sends Twitch Emotes to Facebook chats

# How to use
-----
Requires facebook-chat-api, bluebird, wget-improved. (how to package.json?)

Run `saveapp.js`, replacing emails and passwords as needed. Then, run Kappbot.js. (preferably with forever)

### Custom emotes
-----
Run `node addemote.js <emotename> <emoteurl>` to add a new emote. To delete, use `node delemote <emotename>`.

Custom emote list can be enumerated with `!customlist` in chat.

TODO: Refactor code with promises. This can lead to reading in the JSON files -> logging in -> api.listen.
