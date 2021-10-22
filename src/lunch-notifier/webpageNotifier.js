const fs = require('fs');

const notify = async (notifications) => {
  let settings = getSettings();

  let webString = notifications.filter(notification =>
    notification.email === settings.webpageEmail)
    .flatMap(notification => notification.notifications)
    .flatMap(notification => notification.matches)
    .reduce((a, b) => a + b + '\n ', '')
    .trim();
  saveFile(settings.localDirectory, settings.webpageFile, webString)
}

const getSettings = () => {
  return JSON.parse(fs.readFileSync(__dirname + '/settings.json'));
}

const saveFile = (directory, filename, text) => {
  return fs.writeFileSync(directory + filename, text);
}

exports.notify = notify;