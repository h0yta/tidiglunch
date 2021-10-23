const fs = require('fs');
const cheerio = require('cheerio');
const assert = require('assert').strict;
const puppeteerUtils = require('../utils/puppeteerUtils');


const url = 'http://vesterbrunn.se/lunch';
const weekdays = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag'];

const run = async () => {
  let settings = getSettings();

  try {
    let json = await parse();
    verifyJson(json);
    storeJsonInS3(json);
    printJson(json);
    saveJson(settings.localDirectory, 'vesterbrunn.json', json);
  } catch (error) {
    console.log(' Error in VesterbrunnParser', error);
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
    let weekday = -1;
    let widget = $('div[data-element_type="widget"]');
    widget.children().each((i, elem) => {
      let text = $(elem).text().trim().replace(/–/g, '\n').replace(/-/g, '\n');
      if (text.includes('Lunch V.')) {
        result.week = parseWeek(text);
      }

      if (weekdays.indexOf(text) >= 0) {
        weekday = weekdays.indexOf(text);
      } else if (weekday > -1) {
        let lunches = [];
        $(elem).find('p').each((i, pElem) => {
          lunches.push($(pElem).text().replace(/[^a-zA-Z\d\s:\u00C0-\u00FF]/g, '').trim())
        })
        result.days.push({
          day: weekdays[weekday],
          lunches: lunches
        })
        weekday = -1;
      }
    });

    return result;

  } catch (error) {
    console.log(' Error in VesterbrunnParser', error);
  } finally {
    await browser.close();
  }
}

const parseWeek = (text) => {
  return text.split('.')[1];
}

const verifyJson = (json) => {
  assert(!isNaN(json.week), 'Week is not a number: ' + json.week);
  assert(Array.isArray(json.days), 'Days is not an array');
  assert(json.days.length === 5, 'Days does not have five entries: ' + json.days.length);

  json.days.forEach(day => {
    assert(weekdays.includes(day.day), 'Invalid day: ' + day.day);
    assert(Array.isArray(day.lunches), 'Lunches is not an array');
    assert(day.lunches.length === 4, 'Lunches does not have four entries: ' + day.lunches.length);
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