import { config } from '@gigs/config';
import { checkElasticSearchConnection, createIndex } from '@gigs/elasticsearch';
import { createRabbitMQConnection } from '@gigs/queues/connection';
import { consumeGigDirectMessage, consumeSeedDirectMessages } from '@gigs/queues/gig.consumer';
import { appRoutes } from '@gigs/routes';
import { CustomError, IAuthPayload, IErrorResponse, winstonLogger } from '@vsatya-kirankumar/jobber-shared';
import { Channel } from 'amqplib';
import compression from 'compression';
import cors from 'cors';
import { Application, NextFunction, Request, Response, json, urlencoded } from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import http from 'http';
import JWT from 'jsonwebtoken';
import { Logger } from 'winston';

const SERVER_PORT = config.SERVER_PORT;
const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'userServer', 'debug');
let gigChannel: Channel;

const start = (app: Application): void => {
  securityMiddleware(app);
  standardMiddleware(app);
  routesMiddleware(app);
  startQueues();
  startElasticSearch();
  userErrorHandler(app);
  startServer(app);
};

const securityMiddleware = (app: Application): void => {
  app.set('trust-proxy', 1);

  app.use(
    cors({
      origin: `${config.API_GATEWAY_URL}`,
      methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
      credentials: true
    })
  );

  app.use(hpp());
  app.use(helmet());

  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      const payload: IAuthPayload = JWT.verify(token, config.JWT_TOKEN!) as IAuthPayload;
      req.currentUser = payload;
    }
    next();
  });
};

const standardMiddleware = (app: Application): void => {
  app.use(compression());
  app.use(json({ limit: '200mb' }));
  app.use(urlencoded({ extended: true, limit: '200mb' }));
};

const routesMiddleware = (app: Application) => {
  appRoutes(app);
};

const startQueues = async (): Promise<void> => {
  gigChannel = (await createRabbitMQConnection()) as Channel;
  await consumeGigDirectMessage(gigChannel);
  await consumeSeedDirectMessages(gigChannel);
};

const startElasticSearch = (): void => {
  checkElasticSearchConnection();
  createIndex('gigs');
};

const userErrorHandler = (app: Application): void => {
  app.use((error: IErrorResponse, _req: Request, res: Response, _next: NextFunction) => {
    log.log('error', `Gig Service Error: ${error.comingFrom}: `, error);
    if (error instanceof CustomError) {
      return res.status(error.statusCode).json(error.serializeErrors());
    }
    return res.status(500).json({
      message: 'Internal Server Error'
    });
  });
};

const startServer = async (app: Application): Promise<void> => {
  try {
    const httpServer = new http.Server(app);
    log.info(`Gig Service has started with process id ${process.pid}...`);
    httpServer.listen(SERVER_PORT, () => {
      log.info(`Gig Service is running on port ${SERVER_PORT}`);
    });
  } catch (error) {
    log.log('error', 'Gig Service startServer() Error: ', error);
  }
};

export { gigChannel, start };
