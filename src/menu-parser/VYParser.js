const fs = require('fs');
const cheerio = require('cheerio');
const assert = require('assert').strict;
const puppeteerUtils = require('../utils/puppeteerUtils');


const url = 'https://fcgruppen.se/restauranger/vy-restaurang-skybar';
const weekdays = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag'];

const run = async () => {
  let settings = getSettings();

  try {
    let json = await parse();
    verifyJson(json);
    storeJsonInS3(json);
    printJson(json);
    saveJson(settings.localDirectory, 'vy.json', json);
  } catch (error) {
    console.log(' Error in VYParser', error);
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

    let result = { resturant: 'VY', week: 0, days: [] };
    let widget = $('.category-lunch_vy');
    widget.children().first().children().each((i, elem) => {
      let html = $(elem).html()
        .replace(/\<br\>/g, '#')
        .replace(':', '');
      let lunchText = cheerio.load(html)
        .text()
        .split('#');

      if (lunchText[0].includes('Vecka')) {
        result.week = parseWeek(lunchText[0]);
      } else if (weekdays.indexOf(lunchText[0]) >= 0) {
        let weekday = weekdays.indexOf(lunchText[0]);

        let lunches = [];
        for (let i = 1; i < lunchText.length; i++) {
          lunches.push(lunchText[i].replace(/\(.*\)/, '').trim())
        }

        result.days.push({
          day: weekdays[weekday],
          lunches
        });
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
  return text.trim().split(' ')[1];
}

const verifyJson = (json) => {
  assert(!isNaN(json.week), 'Week is not a number: ' + json.week);
  assert(Array.isArray(json.days), 'Days is not an array');
  assert(json.days.length === 5, 'Days does not have five entries: ' + json.days.length);

  json.days.forEach(day => {
    assert(weekdays.includes(day.day), 'Invalid day: ' + day.day);
    assert(Array.isArray(day.lunches), 'Lunches is not an array');
    assert(day.lunches.length === 3, 'Lunches does not have three entries: ' + day.lunches.length);
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