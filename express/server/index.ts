import './common/env';
// import { createConnection } from 'typeorm';

const config = {
  channelAccessToken: process.env.LINE_CH_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CH_SECRET,
};

const port = parseInt(process.env.PORT);

/* createConnection().then(*/ (async (): Promise<void> => {
  const server = require('./common/server').expressServer;

  await server.setBodyParserOrLineSignatureParser(config);
  // await server.handleLineEv('/webhook/line/', config);
  await server.setNotFoundPage();
  await server.listen(port);
})();
