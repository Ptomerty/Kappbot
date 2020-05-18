'use strict'
const fsp = require('fs').promises
const fetch = require('node-fetch')

async function getNewBTTVEmotes() {
	const url = 'https://api.betterttv.net/3/cached/emotes/global';
	url = await fetch(url);
	let res = await url.json();
	console.log(res);
}

async function updateEmotes () {
  const urls = [
    'https://api.betterttv.net/3/cached/emotes/global'
    // 'https://twitchemotes.com/api_cache/v3/images.json'
  ]
  let promises = urls.map(url => fetch(url))
  let results = await Promise.all(promises)
  promises = results.map(data => data.json())
  results = await Promise.all(promises)
  console.log('Emotes downloaded!')

  console.log('Parsing into objects...')
  const bttvObj = await parseBTTVJSON(results[0])
  const twitchObj = await parseTwitchJSON(results[1])
  console.log('Emote objects created!')

  console.log('Removing unwanted words...')
  const unwantedWordsArr = await getDictionary()
  const bttvCleaned = await removeWords(bttvObj, unwantedWordsArr)
  const twitchCleaned = await removeWords(twitchObj, unwantedWordsArr)
  console.log('Testing if Zappa present: ')
  console.log(bttvObj.Zappa)
  console.log(bttvCleaned.Zappa)
  console.log('Unwanted words removed!')

  console.log('Writing to files...')
  const writeFilePromises = [
    writeFile('../emotes/bttvEmotes.json', JSON.stringify(bttvCleaned), 'utf8'),
    writeFile('../emotes/twitchEmotes.json', JSON.stringify(twitchCleaned), 'utf8')
  ]
  await Promise.all(writeFilePromises)
  console.log('Files written!')

  console.log('Emotes successfully updated!')
}

module.exports = { getNewBTTVEmotes };