const vesterbrunnParser = require('./VesterbrunnParser');

const runParsers = async () => {
  try {
    await vesterbrunnParser.run();
  } catch (error) {
    console.log(' Error in menu-parser', error);
  }
  process.exit(0);
}

runParsers();