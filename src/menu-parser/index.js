const vesterbrunnParser = require('./VesterbrunnParser');
const vyParser = require('./VYParser');

const runParsers = async () => {
  try {
    await vesterbrunnParser.run();
    await vyParser.run();
  } catch (error) {
    console.log(' Error in menu-parser', error);
  }
  process.exit(0);
}

runParsers();