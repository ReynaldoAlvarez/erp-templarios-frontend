import { Router } from 'express';
import BLController from './bl.controller';
import BLImportController from './import/bl-import.controller';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { validateRequest } from '../../core/middleware/validation.middleware';
import { body, param } from 'express-validator';

const router = Router();

// Validation schemas
const createBLSchema = [
  body('blNumber').notEmpty().withMessage('El número de BL es requerido'),
  body('totalWeight').isFloat({ min: 0 }).withMessage('El peso total debe ser un número positivo'),
  body('unitCount').isInt({ min: 1 }).withMessage('La cantidad de unidades debe ser al menos 1'),
  body('originPort').notEmpty().withMessage('El puerto de origen es requerido'),
  body('customsPoint').notEmpty().withMessage('El punto aduanero es requerido'),
  body('finalDestination').notEmpty().withMessage('El destino final es requerido'),
  body('clientId').isUUID().withMessage('ID de cliente inválido'),
  body('deliveryType').optional().isIn(['DIRECT', 'INDIRECT']).withMessage('Tipo de entrega inválido'),
];

const updateBLSchema = [
  param('id').isUUID().withMessage('ID inválido'),
  body('blNumber').optional().notEmpty().withMessage('El número de BL no puede estar vacío'),
  body('totalWeight').optional().isFloat({ min: 0 }).withMessage('El peso total debe ser un número positivo'),
  body('unitCount').optional().isInt({ min: 1 }).withMessage('La cantidad de unidades debe ser al menos 1'),
];

const cancelBLSchema = [
  param('id').isUUID().withMessage('ID inválido'),
  body('reason').notEmpty().withMessage('La razón de cancelación es requerida'),
];

// All routes require authentication
router.use(authMiddleware);

// Routes
router.get(
  '/',
  BLController.getAll.bind(BLController)
);

router.get(
  '/search',
  BLController.search.bind(BLController)
);

router.get(
  '/import/template',
  BLImportController.getTemplate.bind(BLImportController)
);

router.post(
  '/import/json',
  BLImportController.importFromJSON.bind(BLImportController)
);

router.get(
  '/number/:blNumber',
  BLController.getByNumber.bind(BLController)
);

router.get(
  '/:id',
  BLController.getById.bind(BLController)
);

router.get(
  '/:id/progress',
  BLController.getProgressReport.bind(BLController)
);

router.post(
  '/',
  ...createBLSchema,
  validateRequest,
  BLController.create.bind(BLController)
);

router.put(
  '/:id',
  ...updateBLSchema,
  validateRequest,
  BLController.update.bind(BLController)
);

router.post(
  '/:id/approve',
  BLController.approve.bind(BLController)
);

router.post(
  '/:id/cancel',
  ...cancelBLSchema,
  validateRequest,
  BLController.cancel.bind(BLController)
);

export default router;
