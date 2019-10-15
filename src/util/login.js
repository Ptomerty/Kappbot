const fs = require("fs");
const login = require("facebook-chat-api");

const credentials = {
    email: process.env.FB_EMAIL,
    password: process.env.FB_PASSWORD
}

login({email: credentials.email, password: credentials.password}, (err, api) => {
    if (err) return console.error(err);

    fs.writeFileSync('../appstate.json', JSON.stringify(api.getAppState()));
    console.log('Appstate written to file!');
});