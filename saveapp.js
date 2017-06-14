const fs = require("fs");
const login = require("facebook-chat-api");

login({email: "FB_EMAIL", password: "FB_PW"}, (err, api) => {
    if(err) return console.error(err);

    fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState()));
});