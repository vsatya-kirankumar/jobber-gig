import { Application } from 'express';
import { healthRoutes } from '@gigs/routes/health.routes';
import { verifyGatewayRequest } from '@vsatya-kirankumar/jobber-shared';
import { gigRoutes } from '@gigs/routes/gig.routes';

const GIG_BASE_PATH = '/api/v1/gig';

export const appRoutes = (app: Application) => {
  app.use('', healthRoutes());

  app.use(GIG_BASE_PATH, verifyGatewayRequest, gigRoutes());
};
