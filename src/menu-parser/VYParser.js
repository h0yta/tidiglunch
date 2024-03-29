const fs = require('fs');
const cheerio = require('cheerio');
const assert = require('assert').strict;
const dateUtils = require('../utils/dateUtils');
const menuUtils = require('../utils/menuUtils');
const puppeteerUtils = require('../utils/puppeteerUtils');

const url = 'https://fcgruppen.se/restauranger/vy-restaurang-skybar';
const RESTURANT_NAME = 'VY';

const run = async () => {
  let settings = getSettings();

  try {
    let json = await parse();
    verifyJson(json, settings);
    storeJsonInS3(json, settings);
    printJson(json, settings);
    saveJson(RESTURANT_NAME + '.json', json, settings);
  } catch (error) {
    console.log(' Error in VYParser', error);
    saveJson(RESTURANT_NAME + '.json', menuUtils.createEmptyJson(RESTURANT_NAME), settings);
  }
}

const parse = async () => {
  let browser;
  try {
    browser = await puppeteerUtils.launchBrowser();
    const page = await browser.newPage();
    await page.goto(url);

    let html = await page.content();
    let $ = cheerio.load(html);

    let result = { resturant: RESTURANT_NAME, week: 0, days: [] };
    let widget = $('.category-lunch_vy');
    let lunchArray = new Array();
    widget.children().first().children().each((i, elem) => {
      let html = $(elem).html()
        .split(/(Måndag|Tisdag|Onsdag|Torsdag|Fredag)/g)
        .map(text => text
          .replace(/\<br\>/g, '#')
          .replace('*', '#')
          .replace(/:/g, ''))
        .join('#');
      let lunchText = cheerio.load(html)
        .text()
        .split('#');

      lunchArray = lunchArray.concat(lunchText);
    });

    let weekday = '';
    let lunches = [];
    for (let i = 0; i < lunchArray.length; i++) {
      if (lunchArray[i].includes('Vecka')) {
        result.week = parseWeek(lunchArray[i]);
      } else if (dateUtils.isValidDay(lunchArray[i])) {
        if (weekday !== '' && lunches.length > 0) {
          result.days.push({
            day: weekday,
            lunches
          });
        }

        weekday = lunchArray[i];
        lunches = [];
      } else if (isValidLunch(lunchArray[i])) {
        lunches.push(lunchArray[i].replace(/\(.*\)/, '').trim());
      }
    }

    result.days.push({
      day: weekday,
      lunches
    });

    return result;
  } catch (error) {
    console.log(' Error in VYParser', error);
  } finally {
    await browser.close();
  }
}

const parseWeek = (text) => {
  return text.trim().split(' ')[1];
}

const isValidLunch = (text) => {
  return text.trim() !== ''
    && !text.trim().startsWith('*')
    && !text.trim().startsWith('=')
    && !text.trim().startsWith('(')
    && !text.trim().startsWith(')');
}

const verifyJson = (json, settings) => {
  if (settings.skipVerify) {
    console.log('Skipping VERIFY');
    return
  };

  assert(!isNaN(json.week), 'Week is not a number: ' + json.week);
  assert(Array.isArray(json.days), 'Days is not an array');
  assert(json.days.length === 5, 'Days does not have five entries: ' + json.days.length);

  json.days.forEach(day => {
    assert(dateUtils.isValidDay(day.day), 'Invalid day: ' + day.day);
    assert(Array.isArray(day.lunches), 'Lunches is not an array');
    assert(day.lunches.length === 3, 'Lunches does not have three entries: ' + day.lunches.length);
  });
}

const storeJsonInS3 = (json) => {
  // TODO Implement
  return;
}

const printJson = (json, settings) => {
  if (settings.skipPrint) {
    console.log('Skipping PRINT');
    return;
  }

  console.log(JSON.stringify(json, null, 2));
  return;
}

const saveJson = (filename, json, settings) => {
  if (settings.skipSave) {
    console.log('Skipping SAVE');
    return;
  }

  return fs.writeFileSync(settings.localDirectory + filename, JSON.stringify(json, null, 2));
}

const getSettings = () => {
  return JSON.parse(fs.readFileSync(__dirname + '/../resources/settings.json'));
}

module.exports.run = run;