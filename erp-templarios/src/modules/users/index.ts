import { Router } from 'express';
import { body, param } from 'express-validator';
import { validateRequest } from '../../core/middleware/validation.middleware';
import { authenticate, authorize } from '../../core/middleware/auth.middleware';
import UsersController from './users.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const createUserValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .trim()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('branchId')
    .optional()
    .isUUID()
    .withMessage('Please provide a valid branch ID'),
  body('roleIds')
    .isArray({ min: 1 })
    .withMessage('At least one role must be assigned'),
  body('roleIds.*')
    .isUUID()
    .withMessage('Each role ID must be a valid UUID'),
];

const updateUserValidation = [
  param('id').isUUID().withMessage('Invalid user ID'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .trim()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('roleIds')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one role must be assigned'),
  body('roleIds.*')
    .optional()
    .isUUID()
    .withMessage('Each role ID must be a valid UUID'),
];

const assignRolesValidation = [
  param('id').isUUID().withMessage('Invalid user ID'),
  body('roleIds')
    .isArray({ min: 1 })
    .withMessage('At least one role must be assigned'),
  body('roleIds.*')
    .isUUID()
    .withMessage('Each role ID must be a valid UUID'),
];

// Routes
router.get(
  '/',
  authorize('iam:usuarios:listar'),
  UsersController.getAll
);

router.get(
  '/:id',
  authorize('iam:usuarios:leer'),
  param('id').isUUID().withMessage('Invalid user ID'),
  validateRequest,
  UsersController.getById
);

router.post(
  '/',
  authorize('iam:usuarios:crear'),
  createUserValidation,
  validateRequest,
  UsersController.create
);

router.put(
  '/:id',
  authorize('iam:usuarios:actualizar'),
  updateUserValidation,
  validateRequest,
  UsersController.update
);

router.delete(
  '/:id',
  authorize('iam:usuarios:eliminar'),
  param('id').isUUID().withMessage('Invalid user ID'),
  validateRequest,
  UsersController.delete
);

router.post(
  '/:id/roles',
  authorize('iam:roles:asignar'),
  assignRolesValidation,
  validateRequest,
  UsersController.assignRoles
);

router.get(
  '/:id/permissions',
  authorize('iam:permisos:leer'),
  param('id').isUUID().withMessage('Invalid user ID'),
  validateRequest,
  UsersController.getUserPermissions
);

router.post(
  '/:id/resend-invitation',
  authorize('iam:usuarios:actualizar'),
  param('id').isUUID().withMessage('Invalid user ID'),
  validateRequest,
  UsersController.resendInvitation
);

router.post(
  '/:id/unlock',
  authorize('iam:usuarios:actualizar'),
  param('id').isUUID().withMessage('Invalid user ID'),
  validateRequest,
  UsersController.unlockAccount
);

export default router;
