const fs = require('fs');
const cheerio = require('cheerio');
const assert = require('assert').strict;
const dateUtils = require('../utils/dateUtils');
const menuUtils = require('../utils/menuUtils');
const puppeteerUtils = require('../utils/puppeteerUtils');


const url = 'https://www.kvartersmenyn.se/rest_frame/15243/GJL424TZIHDR/1';
const RESTURANT_NAME = 'RestaurangZ';

const run = async () => {
  let settings = getSettings();

  try {
    let json = await parse();
    verifyJson(json);
    storeJsonInS3(json);
    printJson(json);
    saveJson(settings.localDirectory, RESTURANT_NAME + '.json', json);
  } catch (error) {
    console.log(' Error in RestaurangZParser', error);
    saveJson(settings.localDirectory, RESTURANT_NAME + '.json', menuUtils.createEmptyJson(RESTURANT_NAME));
  }
}

const parse = async () => {
  let browser;
  try {
    browser = await puppeteerUtils.launchBrowser();
    const page = await browser.newPage();
    await page.goto(url);

    let html = await page.content();
    let $ = cheerio.load(html, { decodeEntities: false });

    let result = { resturant: 'Restaurang Z', week: 0, days: [] };
    let weekday = '';
    let parseVeckans = false;
    let veckans = []
    let lunches = [];

    result.week = parseWeek($('.menu_date').text());

    let widget = $('.menu_text');
    let parts = widget.html()
      .split('<br>')
      .map(t => t.replace(/(<([^>]+)>)/ig, ''));

    for (let i = 0; i < parts.length; i++) {
      const text = parts[i];
      if (dateUtils.isValidDay(text)) {
        weekday = parseWeekday(text);
        lunches = [];
      } else if (weekday != '') {
        if (isValidLunch(text)) {
          lunches.push(text);
        } else if (text === '') {
          result.days.push({
            day: weekday,
            lunches: lunches
          });
          weekday = '';
        }
      }
    }

    result.days = result.days.map(day => {
      day.lunches.push(...veckans);
      return day;
    });

    return result;

  } catch (error) {
    console.log(' Error in TokaKokParser', error);
  } finally {
    await browser.close();
  }
}

const parseWeek = (text) => {
  return text.trim().split(' ')[1].replace('v', '');
}

const parseWeekday = (text) => {
  return text.split(' ')[0].trim();
}

const isValidLunch = (text) => {
  return text 
    && text.trim() != '' 
    && !text.includes('stående rättar')
    && !text.includes('lunchbuffé');
}

const verifyJson = (json) => {
  console.log(JSON.stringify(json, null, 2))
  assert(!isNaN(json.week), 'Week is not a number: ' + json.week);
  assert(Array.isArray(json.days), 'Days is not an array');
  assert(json.days.length === 5, 'Days does not have five entries: ' + json.days.length);

  json.days.forEach(day => {
    assert(dateUtils.isValidDay(day.day), 'Invalid day: ' + day.day);
    assert(Array.isArray(day.lunches), 'Lunches is not an array');
    // Ignore number of lunches
    // assert(day.lunches.length === 4, 'Lunches does not have four entries: ' + day.lunches.length);
  });
}

const getSettings = () => {
  return JSON.parse(fs.readFileSync(__dirname + '/../resources/settings.json'));
}

const storeJsonInS3 = (json) => {
  // TODO Implement
  return;
}

const printJson = (json) => {
  console.log(JSON.stringify(json, null, 2));
  return;
}

const saveJson = (directory, filename, json) => {
  return fs.writeFileSync(directory + filename, JSON.stringify(json, null, 2));
}

module.exports.run = run;