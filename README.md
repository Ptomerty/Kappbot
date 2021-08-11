# [Kappbot](https://github.com/Ptomerty/Kappbot)

A chat bot that sends emoticons over Facebook Messenger. If you're viewing this in a browser, welcome! Click the above link to view the entire repository.

## Installation

Install this as you would any other NPM package.

```bash
$ git clone https://github.com/Ptomerty/Kappbot.git
$ cd Kappbot/
$ npm install

$ # make sure to modify credentials.json with your facebook email, password, and twitch client_id
$ cp credentials_sample.json credentials.json

$ # update removed_words.txt if needed
$ # nano removed_words.txt

$ npm start
```

## Commands

#### `!id`
Returns current user's ID.

#### `!commands`
Lists all commands.

#### `!ping`
Pong.

#### `!threadID`
Returns ID of current message thread.

#### `!list`
Lists all custom emotes.

#### `!echo <message>`
Returns provided message.

#### `!table <message>`
Creates a table from the provided message.

#### `!addemote [ffz|link|local] <query> [...url]`
Queries FrankerFaceZ's API or the provided link if applicable, then fetches the image and adds it to the list of custom emotes.

#### `!delEmote <emoteName>`
Deletes custom emote from server. Note: does not delete file.

#### `!bttv`
Updates BetterTTV emotes to the latest version.

#### `!twitch`
Updates Twitch emotes to the latest version. **Note: this command takes a while!**
