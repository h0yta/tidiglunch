const vesterbrunnParser = require('./VesterbrunnParser');

const runParsers = async () => {

  await vesterbrunnParser.run();

  process.exit(0);
}

runParsers();