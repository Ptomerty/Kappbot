#!/bin/sh

forever stopall
git update-index --assume-unchanged modlist
git update-index --assume-unchanged custom.json
git reset checkForCommands.js
git reset Kappbot.js
git checkout checkForCommands.js
git checkout Kappbot.js
git pull
node setup.js
forever start Kappbot.js