import { Router } from 'express';
import ClientsController from './clients.controller';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { validateRequest } from '../../core/middleware/validation.middleware';
import { body, param } from 'express-validator';

const router = Router();

// Validation schemas
const createClientSchema = [
  body('businessName').notEmpty().withMessage('La razón social es requerida'),
  body('nit').notEmpty().withMessage('El NIT es requerido'),
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('hasCredit').optional().isBoolean(),
  body('creditLimit').optional().isDecimal().withMessage('El límite de crédito debe ser un número'),
];

const updateClientSchema = [
  param('id').isUUID().withMessage('ID inválido'),
  body('businessName').optional().notEmpty().withMessage('La razón social no puede estar vacía'),
  body('nit').optional().notEmpty().withMessage('El NIT no puede estar vacío'),
  body('email').optional().isEmail().withMessage('Email inválido'),
];

// All routes require authentication
router.use(authMiddleware);

// Routes
router.get(
  '/',
  ClientsController.getAll.bind(ClientsController)
);

router.get(
  '/search',
  ClientsController.search.bind(ClientsController)
);

router.get(
  '/:id',
  ClientsController.getById.bind(ClientsController)
);

router.get(
  '/:id/credit',
  ClientsController.getCreditStatus.bind(ClientsController)
);

router.post(
  '/',
  ...createClientSchema,
  validateRequest,
  ClientsController.create.bind(ClientsController)
);

router.put(
  '/:id',
  ...updateClientSchema,
  validateRequest,
  ClientsController.update.bind(ClientsController)
);

router.delete(
  '/:id',
  ClientsController.delete.bind(ClientsController)
);

router.post(
  '/:id/restore',
  ClientsController.restore.bind(ClientsController)
);

export default router;
