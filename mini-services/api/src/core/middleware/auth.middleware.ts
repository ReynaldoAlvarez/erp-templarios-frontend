import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/token.util';
import { PrismaService } from '../database/prisma.service';
import { UnauthorizedError, ForbiddenError } from './error.middleware';

const prisma = PrismaService.getInstance();

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      permissions?: string[];
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided. Please log in.');
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    let payload: JwtPayload;
    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token. Please log in again.');
    }

    // Get user permissions from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found.');
    }

    // Extract permissions
    const permissions = user.userRoles.flatMap(ur =>
      ur.role.rolePermissions.map(rp => 
        `${rp.permission.module}:${rp.permission.resource}:${rp.permission.action}`
      )
    );

    // Attach user and permissions to request
    req.user = payload;
    req.permissions = [...new Set(permissions)];

    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...requiredPermissions: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('User not authenticated'));
      return;
    }

    if (!req.permissions) {
      next(new ForbiddenError('No permissions found'));
      return;
    }

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every(perm => 
      req.permissions!.includes(perm)
    );

    if (!hasAllPermissions) {
      next(new ForbiddenError('You do not have permission to perform this action'));
      return;
    }

    next();
  };
};

export const authorizeAny = (...requiredPermissions: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('User not authenticated'));
      return;
    }

    if (!req.permissions) {
      next(new ForbiddenError('No permissions found'));
      return;
    }

    // Check if user has any of the required permissions
    const hasAnyPermission = requiredPermissions.some(perm => 
      req.permissions!.includes(perm)
    );

    if (!hasAnyPermission) {
      next(new ForbiddenError('You do not have permission to perform this action'));
      return;
    }

    next();
  };
};

export const hasRole = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('User not authenticated'));
      return;
    }

    const hasRequiredRole = req.user.roles.some(role => roles.includes(role));

    if (!hasRequiredRole) {
      next(new ForbiddenError('You do not have the required role'));
      return;
    }

    next();
  };
};

export default { authenticate, authorize, authorizeAny, hasRole };
