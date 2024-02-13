const program = require('commander');

const vesterbrunnParser = require('./VesterbrunnParser');
const vyParser = require('./VYParser');
const tokakokParser = require('./TokaKok');

const init = async () => {
  program
    .version('0.0.3')
    .option('-p --parser <parser>', 'Parser: Vesterbrunn, VY')
    .parse(process.argv);

  if (!process.argv.slice(2).length) {
    program.outputHelp();
    return;
  }

  await runParser(program.parser);

  process.exit(0);
}

const runParser = async (parser) => {
  switch (parser.toUpperCase()) {
    case 'VESTERBRUNN':
      await runVesterbrunn();
      break;
    case 'VY':
      await runVY();
      break;
    case 'TOKAKOK':
      await runTokaKok();
      break;
    default:
      await runVesterbrunn();
      await runVY();
      break;
  }
}

const runVesterbrunn = async () => {
  try {
    await vesterbrunnParser.run();
  } catch (error) {
    console.log(' Error in vesterbrunnParser', error);
  }
}

const runVY = async () => {
  try {
    await vyParser.run();
  } catch (error) {
    console.log(' Error in vyParser', error);
  }
}

const runTokaKok = async () => {
  try {
    await tokakokParser.run();
  } catch (error) {
    console.log(' Error in tokakokParser', error);
  }
}

init();