import { PrismaService } from '../../core/database/prisma.service';
import { RedisService } from '../../core/database/redis.service';
import { hashPassword, comparePassword, generateRandomPassword } from '../../core/utils/password.util';
import { generateTokenPair, verifyAccessToken, verifyRefreshToken } from '../../core/utils/token.util';
import { config } from '../../core/config';
import { UnauthorizedError, ValidationError, NotFoundError } from '../../core/middleware/error.middleware';
import { UserStatus } from '@prisma/client';

const prisma = PrismaService.getInstance();
const redis = RedisService.getInstance();

class AuthService {
  async login(email: string, password: string) {
    // Find user with roles
    const user = await prisma.user.findUnique({
      where: { email },
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
        company: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if user is locked
    if (user.status === UserStatus.LOCKED && user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedError(`Account is locked. Try again in ${remainingMinutes} minutes`);
    }

    // Check if user is active
    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedError('Account is inactive. Please contact administrator');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      // Increment failed attempts
      const failedAttempts = user.failedLoginAttempts + 1;
      
      if (failedAttempts >= config.security.maxLoginAttempts) {
        // Lock the account
        await prisma.user.update({
          where: { id: user.id },
          data: {
            status: UserStatus.LOCKED,
            failedLoginAttempts: failedAttempts,
            lockedUntil: new Date(Date.now() + config.security.lockTimeMinutes * 60000),
          },
        });
        throw new UnauthorizedError(`Account locked due to too many failed attempts. Try again in ${config.security.lockTimeMinutes} minutes`);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: failedAttempts },
      });

      throw new UnauthorizedError(`Invalid credentials. ${config.security.maxLoginAttempts - failedAttempts} attempts remaining`);
    }

    // Reset failed attempts and update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
        status: UserStatus.ACTIVE,
        lockedUntil: null,
      },
    });

    // Get roles and permissions
    const roles = user.userRoles.map(ur => ur.role.name);
    const permissions = user.userRoles.flatMap(ur =>
      ur.role.rolePermissions.map(rp => `${rp.permission.module}:${rp.permission.resource}:${rp.permission.action}`)
    );

    // Generate tokens
    const tokenPair = generateTokenPair({
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      roles,
    });

    // Save refresh token in database
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokenPair.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Cache user permissions in Redis
    await redis.set(`user:${user.id}:permissions`, permissions, 3600);

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatar: user.avatar,
        company: user.company,
        roles,
        permissions: [...new Set(permissions)],
      },
    };
  }

  async logout(userId: string) {
    // Revoke all refresh tokens for the user
    await prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    // Clear cached permissions
    await redis.del(`user:${userId}:permissions`);
  }

  async refreshToken(refreshToken: string) {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Check if token exists and is not revoked
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId: payload.userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Get user with roles
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

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError('User not found or inactive');
    }

    // Revoke old refresh token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    // Generate new tokens
    const roles = user.userRoles.map(ur => ur.role.name);
    const tokenPair = generateTokenPair({
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      roles,
    });

    // Save new refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokenPair.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
    };
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Don't reveal if user exists or not
      return;
    }

    // Generate reset token (in production, send via email)
    const resetToken = generateRandomPassword(32);
    
    // Store reset token in Redis with 1 hour expiration
    await redis.set(`password-reset:${resetToken}`, user.id, 3600);

    // TODO: Send email with reset link
    // For now, return the token for testing
    console.log(`Password reset token for ${email}: ${resetToken}`);
  }

  async resetPassword(token: string, newPassword: string) {
    // Get user ID from Redis
    const userId = await redis.get<string>(`password-reset:${token}`);

    if (!userId) {
      throw new ValidationError('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        failedLoginAttempts: 0,
        status: UserStatus.ACTIVE,
        lockedUntil: null,
      },
    });

    // Delete reset token
    await redis.del(`password-reset:${token}`);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new ValidationError('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
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
      throw new NotFoundError('User not found');
    }

    const roles = user.userRoles.map(ur => ur.role.name);
    const permissions = user.userRoles.flatMap(ur =>
      ur.role.rolePermissions.map(rp => `${rp.permission.module}:${rp.permission.resource}:${rp.permission.action}`)
    );

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      company: user.company,
      roles,
      permissions: [...new Set(permissions)],
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
    };
  }

  async verifyEmail(token: string) {
    // Get user ID from Redis
    const userId = await redis.get<string>(`email-verify:${token}`);

    if (!userId) {
      throw new ValidationError('Invalid or expired verification token');
    }

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    // Delete verification token
    await redis.del(`email-verify:${token}`);
  }
}

export default new AuthService();
