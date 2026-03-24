import { Router } from 'express';
import { body, param } from 'express-validator';
import { validateRequest } from '../../core/middleware/validation.middleware';
import { authenticate, authorize } from '../../core/middleware/auth.middleware';
import RolesController from './roles.controller';

const router = Router();

router.use(authenticate);

const createRoleValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Role name must be between 2 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color (e.g., #3B82F6)'),
];

const updateRoleValidation = [
  param('id').isUUID().withMessage('Invalid role ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Role name must be between 2 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color'),
];

const assignPermissionsValidation = [
  param('id').isUUID().withMessage('Invalid role ID'),
  body('permissionIds')
    .isArray()
    .withMessage('Permission IDs must be an array'),
  body('permissionIds.*')
    .isUUID()
    .withMessage('Each permission ID must be a valid UUID'),
];

router.get('/', authorize('iam:roles:listar'), RolesController.getAll);
router.get('/:id', authorize('iam:roles:listar'), param('id').isUUID(), validateRequest, RolesController.getById);
router.post('/', authorize('iam:roles:crear'), createRoleValidation, validateRequest, RolesController.create);
router.put('/:id', authorize('iam:roles:actualizar'), updateRoleValidation, validateRequest, RolesController.update);
router.delete('/:id', authorize('iam:roles:eliminar'), param('id').isUUID(), validateRequest, RolesController.delete);
router.post('/:id/permissions', authorize('iam:roles:asignar'), assignPermissionsValidation, validateRequest, RolesController.assignPermissions);

export default router;
