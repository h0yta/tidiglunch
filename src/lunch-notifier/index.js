const fs = require('fs');
const request = require('request');
const webpageNotifier = require('./webpageNotifier');

const run = async () => {
  let subscriptions = getSubscriptions();
  let settings = getSettings();

  let menus = await getMenus(settings);
  let notifications = getNotifications(subscriptions, menus, settings);

  webpageNotifier.notify(notifications);

}

const getNotifications = (subscriptions, menus, settings) => {
  return subscriptions.subscribers.flatMap(sub => {
    let subNotifications = menus.flatMap(menu => {
      return menu.days.map(day => {
        let matchingLunches = day.lunches.filter(lunch => anyMatch(lunch, sub.filters, settings.defaultFilters));

        if (matchingLunches.length === 0) {
          return null;
        }

        return {
          resturant: menu.resturant,
          day: day.day,
          matches: matchingLunches
        }
      }).filter(dayNotification => dayNotification !== null);
    });

    if (subNotifications.length === 0) {
      return null;
    }

    return {
      email: sub.email,
      notifications: subNotifications
    }
  }).filter(notification => notification !== null);
}

const anyMatch = (string, filters, defaultFilters) => {
  let personalMatch = false;
  if (filters !== undefined && filters !== null) {
    personalMatch = filters
      .filter(filter => string.toLowerCase().includes(filter.toLowerCase()))
      .length > 0;
  }

  let defaultMatch = defaultFilters
    .filter(filter => string.toLowerCase().includes(filter.toLowerCase()))
    .length > 0;


  return personalMatch || defaultMatch;
}

const getSettings = () => {
  return JSON.parse(fs.readFileSync(__dirname + '/settings.json'));
}

const getSubscriptions = () => {
  return JSON.parse(fs.readFileSync(__dirname + '/subscriptions.json'));
}

const getMenus = async (settings) => {
  if (settings.localDirectory !== '') {
    return await getLocalMenus(settings.localDirectory, settings.menuFiles);
  } else {
    return await getMenusFromS3(settings.s3Bucket, settings.menuFiles);
  }
}

const getLocalMenus = async (directory, filenames) => {
  return filenames.map(filename => JSON.parse(fs.readFileSync(directory + filename)));
}

const getMenusFromS3 = async (baseUrl, filenames) => {
  return await Promise.all(filenames.map(filename => getMenu(baseUrl, filename)));
}

const getMenu = async (baseUrl, filename) => {
  let url = baseUrl + filename;
  let options = { json: true };

  return new Promise((resolve, reject) => {
    request(url, options, (error, res, body) => {
      if (error) {
        reject(error);
      };

      if (!error && res.statusCode == 200) {
        resolve(body);
      };
    })
  });
}

run();