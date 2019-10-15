# Kappbot

Twitch Emotes over Facebook Messenger.

## Setup

Simply `npm install` inside of the directory to install all dependencies. Set environment variables `FB_EMAIL` and `FB_PASSWORD`, then run `login.js`. From there, launch `Kappbot.js` and you're all set!

## Commands

#### `!id <name=null>`
If `name` is populated, returns user ID of said user. Otherwise, returns user ID of sender.

#### `!help` `!commands`
Lists all commands.

#### `!ping`
Pong.

#### `!threadID`
Returns ID of current message thread.

#### `!list`
Lists all custom emotes.

#### `!echo <message>`
Returns provided message.

#### `!addEmote <emoteName[, URL]>`
Adds `emoteName` into the list of custom emotes. If `URL` is populated, fetch image from the provided link and download it first.

#### `!delEmote <emoteName>`
Deletes custom emote and file from server.