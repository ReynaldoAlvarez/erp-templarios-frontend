import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
  code?: string;
}

export class HttpError extends Error implements AppError {
  statusCode: number;
  status: string;
  isOperational: boolean;
  code: string;

  constructor(statusCode: number, message: string, code: string = 'UNKNOWN_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends HttpError {
  constructor(message: string) {
    super(400, message, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string = 'Unauthorized access') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string = 'Resource not found') {
    super(404, message, 'NOT_FOUND');
  }
}

export class ConflictError extends HttpError {
  constructor(message: string) {
    super(409, message, 'CONFLICT');
  }
}

export class InternalServerError extends HttpError {
  constructor(message: string = 'Internal server error') {
    super(500, message, 'INTERNAL_ERROR');
  }
}

export const errorHandler = (
  error: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = error.statusCode || 500;
  const status = error.status || 'error';
  const message = error.message || 'Something went wrong';
  const code = error.code || 'UNKNOWN_ERROR';

  // Log error for debugging
  if (statusCode >= 500) {
    console.error('🔴 Error:', {
      message: error.message,
      stack: error.stack,
      statusCode,
    });
  }

  // Prisma error handling
  if (error.constructor.name.includes('Prisma')) {
    res.status(400).json({
      success: false,
      message: 'Database operation failed',
      code: 'DATABASE_ERROR',
    });
    return;
  }

  res.status(statusCode).json({
    success: false,
    status,
    message,
    code,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

export default errorHandler;
