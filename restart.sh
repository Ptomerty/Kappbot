#!/bin/sh

forever stopall
node setup.js
forever start Kappbot.js