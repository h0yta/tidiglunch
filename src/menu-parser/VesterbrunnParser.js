const fs = require('fs');
const cheerio = require('cheerio');
const assert = require('assert').strict;
const dateUtils = require('../utils/dateUtils');
const menuUtils = require('../utils/menuUtils');
const puppeteerUtils = require('../utils/puppeteerUtils');


const url = 'http://vesterbrunn.se/lunch';
const RESTURANT_NAME = 'Vesterbrunn';

const run = async () => {
  let settings = getSettings();

  try {
    let json = await parse();
    verifyJson(json);
    storeJsonInS3(json);
    printJson(json);
    saveJson(settings.localDirectory, RESTURANT_NAME + '.json', json);
  } catch (error) {
    console.log(' Error in VesterbrunnParser', error);
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
    let $ = cheerio.load(html);

    let result = { resturant: 'Vesterbrunn', week: 0, days: [] };
    let weekday = '';
    let widget = $('div[data-element_type="widget"]');
    widget.children().each((i, elem) => {
      let text = $(elem).text().trim().replace(/–/g, '\n').replace(/-/g, '\n');

      if (dateUtils.isValidDay(text)) {
        weekday = parseWeekday(text);
        if (weekday === 'Måndag') {
          result.week = parseWeek(text);
        }
      } else if (weekday != '') {
        let lunches = [];
        $(elem).find('p').each((i, pElem) => {
          let lunch = $(pElem).text().replace(/[^a-zA-Z\d\s:\u00C0-\u00FF]/g, '').trim();
          if (lunch !== '') {
            lunches.push(lunch);
          }
        });
        result.days.push({
          day: weekday,
          lunches: lunches
        });
        weekday = '';
      }
    });

    return result;

  } catch (error) {
    console.log(' Error in VesterbrunnParser', error);
  } finally {
    await browser.close();
  }
}

const parseWeekday = (text) => {
  return text.split(' ')[0].trim();
}

const parseWeek = (text) => {
  if (text.includes('Vecka')) {
    return text.split('Vecka')[1].trim();
  } else {
    return dateUtils.currentWeekNumber(new Date());
  }
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