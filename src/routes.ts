import { Application } from 'express';
import { healthRoutes } from '@gigs/routes/health';
import { verifyGatewayRequest } from '@vsatya-kirankumar/jobber-shared';

const GIG_BASE_PATH = '/api/v1/gig';

export const appRoutes = (app: Application) => {
  app.use('', healthRoutes());

  app.use(GIG_BASE_PATH, verifyGatewayRequest, () => console.log('Gig route'));
  app.use(GIG_BASE_PATH, verifyGatewayRequest, () => console.log('Search route'));
};
