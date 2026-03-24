import { Router } from 'express';
import ExpensesController from './expenses.controller';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { validateRequest } from '../../core/middleware/validation.middleware';
import { body, param } from 'express-validator';
import { ExpenseCategory } from '@prisma/client';

const router = Router();

// Validation schemas
const createExpenseSchema = [
  body('driverId').isUUID().withMessage('ID de conductor inválido'),
  body('tripId').optional().isUUID().withMessage('ID de viaje inválido'),
  body('category').isIn(Object.values(ExpenseCategory)).withMessage('Categoría inválida'),
  body('concept').notEmpty().withMessage('El concepto es requerido'),
  body('amount').isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0'),
  body('expenseDate').optional().isISO8601().withMessage('Fecha inválida'),
];

const updateExpenseSchema = [
  param('id').isUUID().withMessage('ID inválido'),
  body('category').optional().isIn(Object.values(ExpenseCategory)).withMessage('Categoría inválida'),
  body('concept').optional().notEmpty().withMessage('El concepto no puede estar vacío'),
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0'),
];

// All routes require authentication
router.use(authMiddleware);

// Routes
router.get(
  '/categories',
  ExpensesController.getCategories.bind(ExpensesController)
);

router.get(
  '/stats',
  ExpensesController.getStats.bind(ExpensesController)
);

router.get(
  '/',
  ExpensesController.getAll.bind(ExpensesController)
);

router.get(
  '/driver/:driverId',
  ExpensesController.getByDriver.bind(ExpensesController)
);

router.get(
  '/trip/:tripId',
  ExpensesController.getByTrip.bind(ExpensesController)
);

router.get(
  '/:id',
  ExpensesController.getById.bind(ExpensesController)
);

router.post(
  '/',
  ...createExpenseSchema,
  validateRequest,
  ExpensesController.create.bind(ExpensesController)
);

router.put(
  '/:id',
  ...updateExpenseSchema,
  validateRequest,
  ExpensesController.update.bind(ExpensesController)
);

router.delete(
  '/:id',
  ExpensesController.delete.bind(ExpensesController)
);

export default router;
