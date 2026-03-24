import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError as ExpressValidationError } from 'express-validator';

export interface ValidationErrorItem {
  field: string;
  message: string;
}

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error: ExpressValidationError) => {
      const err = error as { path?: string; msg: string };
      return {
        field: err.path || 'unknown',
        message: err.msg,
      };
    });

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages,
      code: 'VALIDATION_ERROR',
    });
    return;
  }

  next();
};

export default validateRequest;
