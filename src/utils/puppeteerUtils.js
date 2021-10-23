const puppeteer = require('puppeteer');
const { platform } = require('process');

const connect = () => {
  console.log(`This platform is ${platform}`);
}

exports.connect = connect;

connect();