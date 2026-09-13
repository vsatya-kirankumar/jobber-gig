import express, { Router } from 'express';
import { health } from '@gigs/controllers/health';

const router = express.Router();

export function healthRoutes(): Router {
  router.get('/gig-health', health);

  return router;
}
