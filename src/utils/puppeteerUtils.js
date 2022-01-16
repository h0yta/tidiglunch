const puppeteer = require('puppeteer');
const { platform } = require('process');

const launchBrowser = async () => {
  if (platform === 'darwin') {
    console.log('YO U runnin local');
    return await puppeteer.launch();
  } else if (platform === 'linux') {
    return await puppeteer.launch({
      headless: true,
      executablePath: '/usr/bin/chromium-browser',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  } else {
    console.log(`Platform ${platform} is not supported!`);
    throw `Platform ${platform} is not supported!`;
  }
}

exports.launchBrowser = launchBrowser;