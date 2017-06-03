# Kappbot
Bot that sends Twitch Emotes to Facebook chats

# How to use
-----
Requires facebook-chat-api, bluebird, wget-improved. (how to package.json?)

Run `saveapp.js`, replacing emails and passwords as needed. Then, run Kappbot.js. (preferably with forever)

### Custom emotes
-----
Make sure it's already downloaded as "emotename.png", ALL LOWERCASE!

Edit custom.json to include it, in the form (,) {"code":"emotename"}

*EXPERIMENTAL*: Run `node addemote.js EMOTE_NAME (EMOTE_URL)`. Should add the emote to custom.json automatically, and download it if needed.
