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

Convert Mod List to Names, also with promises (required? idk) 

add prompt for first mod (console) if modlist is empty.

convert modlist to file (not json, just newlines)

promisify addemote?

more todo: change delete to splice.

add !threadID, mod!echo

return new Promise(function(resolve, reject) {
        open(pathname, "wx")
            .then(close)
            .then(() => {
                    wget.download(url, pathname)
                        .on('error', reject)
                        .on('end', resolve);
                }

            })
    .catch(e => {
            throw e;
    });
}
