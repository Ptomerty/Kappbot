#!/bin/sh

forever stopall
git pull
node setup.js
forever start Kappbot.js