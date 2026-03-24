import { Router } from 'express';
import TrucksController from './trucks.controller';
import { authMiddleware } from '../../../core/middleware/auth.middleware';
import { validateRequest } from '../../../core/middleware/validation.middleware';
import { body, param } from 'express-validator';

const router = Router();

// Validation schemas
const createTruckSchema = [
  body('plateNumber').notEmpty().withMessage('El número de placa es requerido'),
  body('brand').notEmpty().withMessage('La marca es requerida'),
  body('model').notEmpty().withMessage('El modelo es requerido'),
  body('year').isInt({ min: 1990, max: new Date().getFullYear() + 1 }).withMessage('Año inválido'),
  body('capacityTons').isFloat({ min: 0 }).withMessage('La capacidad debe ser un número positivo'),
  body('axles').optional().isInt({ min: 2, max: 10 }).withMessage('Número de ejes inválido'),
];

const updateTruckSchema = [
  param('id').isUUID().withMessage('ID inválido'),
  body('plateNumber').optional().notEmpty().withMessage('El número de placa no puede estar vacío'),
  body('year').optional().isInt({ min: 1990, max: new Date().getFullYear() + 1 }).withMessage('Año inválido'),
  body('capacityTons').optional().isFloat({ min: 0 }).withMessage('La capacidad debe ser un número positivo'),
];

const updateMileageSchema = [
  param('id').isUUID().withMessage('ID inválido'),
  body('mileage').isInt({ min: 0 }).withMessage('Kilometraje inválido'),
];

// All routes require authentication
router.use(authMiddleware);

// Routes
router.get(
  '/',
  TrucksController.getAll.bind(TrucksController)
);

router.get(
  '/available',
  TrucksController.getAvailable.bind(TrucksController)
);

router.get(
  '/search',
  TrucksController.search.bind(TrucksController)
);

router.get(
  '/:id',
  TrucksController.getById.bind(TrucksController)
);

router.post(
  '/',
  ...createTruckSchema,
  validateRequest,
  TrucksController.create.bind(TrucksController)
);

router.put(
  '/:id',
  ...updateTruckSchema,
  validateRequest,
  TrucksController.update.bind(TrucksController)
);

router.patch(
  '/:id/mileage',
  ...updateMileageSchema,
  validateRequest,
  TrucksController.updateMileage.bind(TrucksController)
);

router.delete(
  '/:id',
  TrucksController.delete.bind(TrucksController)
);

router.post(
  '/:id/restore',
  TrucksController.restore.bind(TrucksController)
);

export default router;
