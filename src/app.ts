import { config } from '@gigs/config';
import { databaseConnection } from '@gigs/database';
import express, { Express } from 'express';
import { start } from '@gigs/server';
import { redisConnect } from '@gigs/redis/redis.connection';

const initialize = (): void => {
  config.cloudinaryConfig();
  const app: Express = express();
  databaseConnection();
  start(app);
  redisConnect();
};

initialize();
