import { gigCreate } from '@gigs/controllers/create.controller';
import { gigDelete } from '@gigs/controllers/delete.controller';
import {
  gigById,
  gigsByCategory,
  gigsMoreLikeThis,
  sellerGigs,
  sellerInactiveGigs,
  topRatesGigsByCategory
} from '@gigs/controllers/get.controller';
import { gigs } from '@gigs/controllers/search.controller';
import { gig } from '@gigs/controllers/seed.controller';
import { gigUpdate, gigUpdateActive } from '@gigs/controllers/update.controller';
import express, { Router } from 'express';

const router: Router = express.Router();

const gigRoutes = (): Router => {
  router.get('/:gigId', gigById);
  router.get('/seller/:sellerId', sellerGigs);
  router.get('/seller/pause/:sellerId', sellerInactiveGigs);
  router.get('/search/:from/:size/:type/', gigs);
  router.get('/category/:username', gigsByCategory);
  router.get('/top/:username', topRatesGigsByCategory);
  router.get('/similar/:gigId', gigsMoreLikeThis);
  router.post('/create', gigCreate);
  router.put('/update', gigUpdate);
  router.put('/active/:gigId', gigUpdateActive);
  router.put('/seed/:count', gig);
  router.delete('/:gigId/:sellerId', gigDelete);

  return router;
};

export { gigRoutes };
