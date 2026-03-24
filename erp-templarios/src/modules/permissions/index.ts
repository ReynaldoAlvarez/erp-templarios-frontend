import { Router } from 'express';
import { authenticate, authorize } from '../../core/middleware/auth.middleware';
import PermissionsController from './permissions.controller';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize('iam:permisos:listar'),
  PermissionsController.getAll
);

router.get(
  '/by-module',
  authorize('iam:permisos:listar'),
  PermissionsController.getByModule
);

export default router;
