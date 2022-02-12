const fs = require('fs');
const weekdays = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];

const notify = async (notifications) => {
  let settings = getSettings();
  let currentDay = getCurrentDay();
  let webString = notifications.filter(notification =>
    notification.email === settings.webpageEmail)
    .flatMap(notification => notification.notifications)
    .filter(notification => notification.day === currentDay)
    .flatMap(notification => notification.matches.map(match => match + ' (' + notification.resturant + ')'))
    .join('\n');
  saveFile(settings.localDirectory, settings.webpageFile, webString)
}

const getCurrentDay = () => {
  const day = new Date();
  return weekdays[day.getDay() - 1];
}

const getSettings = () => {
  return JSON.parse(fs.readFileSync(__dirname + '/../resources/settings.json'));
}

const saveFile = (directory, filename, text) => {
  return fs.writeFileSync(directory + filename, text);
}

exports.notify = notify;