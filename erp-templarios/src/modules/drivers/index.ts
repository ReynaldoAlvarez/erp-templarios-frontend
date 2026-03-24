import { Router } from 'express';
import DriversController from './drivers.controller';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { validateRequest } from '../../core/middleware/validation.middleware';
import { body, param, query } from 'express-validator';

const router = Router();

// Validation schemas
const createDriverSchema = [
  body('firstName').notEmpty().withMessage('El nombre es requerido'),
  body('lastName').notEmpty().withMessage('El apellido es requerido'),
  body('identityCard').notEmpty().withMessage('La cédula de identidad es requerida'),
  body('licenseNumber').notEmpty().withMessage('El número de licencia es requerido'),
  body('phone').notEmpty().withMessage('El teléfono es requerido'),
  body('branchId').isUUID().withMessage('ID de sucursal inválido'),
];

const updateDriverSchema = [
  param('id').isUUID().withMessage('ID inválido'),
  body('firstName').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
  body('lastName').optional().notEmpty().withMessage('El apellido no puede estar vacío'),
  body('licenseNumber').optional().notEmpty().withMessage('El número de licencia no puede estar vacío'),
];

const setAvailabilitySchema = [
  param('id').isUUID().withMessage('ID inválido'),
  body('isAvailable').isBoolean().withMessage('isAvailable debe ser true o false'),
];

// All routes require authentication
router.use(authMiddleware);

// Routes
router.get(
  '/available',
  DriversController.getAvailable.bind(DriversController)
);

router.get(
  '/search',
  DriversController.search.bind(DriversController)
);

router.get(
  '/',
  DriversController.getAll.bind(DriversController)
);

router.get(
  '/:id',
  DriversController.getById.bind(DriversController)
);

router.get(
  '/:id/stats',
  DriversController.getStats.bind(DriversController)
);

router.post(
  '/',
  ...createDriverSchema,
  validateRequest,
  DriversController.create.bind(DriversController)
);

router.put(
  '/:id',
  ...updateDriverSchema,
  validateRequest,
  DriversController.update.bind(DriversController)
);

router.patch(
  '/:id/availability',
  ...setAvailabilitySchema,
  validateRequest,
  DriversController.setAvailability.bind(DriversController)
);

router.delete(
  '/:id',
  DriversController.delete.bind(DriversController)
);

router.post(
  '/:id/restore',
  DriversController.restore.bind(DriversController)
);

export default router;
