#!/bin/sh

forever stopall
git update-index --assume-unchanged modlist
git update-index --assume-unchanged custom.json
git pull
node setup.js
forever start Kappbot.js