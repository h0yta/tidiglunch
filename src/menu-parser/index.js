const vesterbrunnParser = require('./VesterbrunnParser');
const vyParser = require('./VYParser');

const runParsers = async () => {
  try {
    await vesterbrunnParser.run();
  } catch (error) {
    console.log(' Error in vesterbrunnParser', error);
  }

  try {
    await vyParser.run();
  } catch (error) {
    console.log(' Error in vyParser', error);
  }

  process.exit(0);
}

runParsers();