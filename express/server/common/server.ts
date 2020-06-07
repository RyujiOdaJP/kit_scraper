import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import http from 'http';
import os from 'os';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import L from './logger';
import { RegisterRoutes } from '../routes';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json';
// import * as line from '@line/bot-sdk';

const app = express();

const bodyParserMiddleware = bodyParser.json({
  limit: process.env.REQUEST_LIMIT || '100kb',
});
const bodyParserUrlEncoded = bodyParser.urlencoded({
  extended: true,
  limit: process.env.REQUEST_LIMIT || '100kb',
});
const bodyParserText = bodyParser.text({
  limit: process.env.REQUEST_LIMIT || '100kb',
});

class ExpressServer {
  constructor() {
    const root = path.normalize(__dirname + '/../..');
    app.set('appPath', `${root}client`);
    app.use(helmet());
    app.use(cookieParser(process.env.SESSION_SECRET));
    app.use(express.static(`${root}/../vue/dist`));

    // Define app's routing
    RegisterRoutes(app);

    // Set Swagger UI
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  }

  public async setBodyParserOrLineSignatureParser(): /* config?: line.MiddlewareConfig */
  Promise<void> {
    app.use(this.bodyParserOrLineSignatureParser(/* config */));
  }

  private bodyParserOrLineSignatureParser(): /* config?: line.MiddlewareConfig */
  (req, res, next) => void {
    // const lineSignatureMiddleware = line.middleware(config);

    return (req, res, next): void => {
      if (req.headers['x-line-signature']) {
        // lineSignatureMiddleware(req, res, next);
        return;
      }
      bodyParserMiddleware(req, res, next);
      bodyParserUrlEncoded(req, res, next);
      bodyParserText(req, res, next);
    };
  }

  public async handleLineEv(
    webHookPath: string
    /* config: line.ClientConfig */
  ): Promise<void> {
    app.post(webHookPath, (req, res) => {
      Promise.all(req.body.events.map(/* new LineEvRouter(config).hears*/))
        .then((result) => res.json(result))
        .catch((err) => {
          L.error(err);
          res.status(500).end();
        });
    });
  }

  public async setNotFoundPage(): Promise<void> {
    // 404
    app.use((req, res) => {
      res.redirect(301, '/');
    });
  }

  public async listen(port: number): Promise<void> {
    const welcome = (p: number) => (): void =>
      L.info(
        `up and running in ${
          process.env.NODE_ENV || 'development'
        } @: ${os.hostname()} on port: ${p}}`
      );

    http.createServer(app).listen(port || 3000, welcome(port || 3000));
  }
}

export const expressServer = new ExpressServer();
