import { Router } from 'express';
import { body, param } from 'express-validator';
import { validateRequest } from '../../core/middleware/validation.middleware';
import { authenticate, authorize } from '../../core/middleware/auth.middleware';
import AuthController from './auth.controller';

const router = Router();

// Validation rules
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Token is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters and contain uppercase, lowercase, and number'),
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must be at least 8 characters and contain uppercase, lowercase, and number'),
];

const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
];

// Routes
router.post('/login', loginValidation, validateRequest, AuthController.login);
router.post('/logout', authenticate, AuthController.logout);
router.post('/refresh-token', refreshTokenValidation, validateRequest, AuthController.refreshToken);
router.post('/forgot-password', forgotPasswordValidation, validateRequest, AuthController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, validateRequest, AuthController.resetPassword);
router.post('/change-password', authenticate, changePasswordValidation, validateRequest, AuthController.changePassword);
router.get('/me', authenticate, AuthController.getCurrentUser);
router.get('/verify-email/:token', AuthController.verifyEmail);

export default router;
