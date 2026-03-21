import { Router } from 'express';
import TrailersController from './trailers.controller';
import { authMiddleware } from '../../../core/middleware/auth.middleware';
import { validateRequest } from '../../../core/middleware/validation.middleware';
import { body, param } from 'express-validator';

const router = Router();

// Validation schemas
const createTrailerSchema = [
  body('plateNumber').notEmpty().withMessage('El número de placa es requerido'),
  body('type').notEmpty().withMessage('El tipo es requerido'),
  body('capacityTons').isFloat({ min: 0 }).withMessage('La capacidad debe ser un número positivo'),
];

const updateTrailerSchema = [
  param('id').isUUID().withMessage('ID inválido'),
  body('plateNumber').optional().notEmpty().withMessage('El número de placa no puede estar vacío'),
  body('capacityTons').optional().isFloat({ min: 0 }).withMessage('La capacidad debe ser un número positivo'),
];

const assignToTruckSchema = [
  param('id').isUUID().withMessage('ID de remolque inválido'),
  body('truckId').optional().isUUID().withMessage('ID de camión inválido'),
];

// All routes require authentication
router.use(authMiddleware);

// Routes
router.get(
  '/available',
  TrailersController.getAvailable.bind(TrailersController)
);

router.get(
  '/search',
  TrailersController.search.bind(TrailersController)
);

router.get(
  '/',
  TrailersController.getAll.bind(TrailersController)
);

router.get(
  '/:id',
  TrailersController.getById.bind(TrailersController)
);

router.post(
  '/',
  ...createTrailerSchema,
  validateRequest,
  TrailersController.create.bind(TrailersController)
);

router.put(
  '/:id',
  ...updateTrailerSchema,
  validateRequest,
  TrailersController.update.bind(TrailersController)
);

router.patch(
  '/:id/assign',
  ...assignToTruckSchema,
  validateRequest,
  TrailersController.assignToTruck.bind(TrailersController)
);

router.delete(
  '/:id',
  TrailersController.delete.bind(TrailersController)
);

router.post(
  '/:id/restore',
  TrailersController.restore.bind(TrailersController)
);

export default router;
