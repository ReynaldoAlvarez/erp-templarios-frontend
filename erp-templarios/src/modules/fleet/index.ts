import { Router } from 'express';
import trucksRoutes from './trucks';
import trailersRoutes from './trailers';

const router = Router();

// Sub-routes
router.use('/trucks', trucksRoutes);
router.use('/trailers', trailersRoutes);

export default router;
