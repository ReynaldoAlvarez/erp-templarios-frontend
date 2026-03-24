import { PrismaService } from '../../core/database/prisma.service';
import { hashPassword, generateRandomPassword } from '../../core/utils/password.util';
import { NotFoundError, ValidationError, ConflictError } from '../../core/middleware/error.middleware';
import { UserStatus } from '@prisma/client';

const prisma = PrismaService.getInstance();

interface GetAllParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  roleId?: string;
}

class UsersService {
  async getAll(params: GetAllParams) {
    const { page, limit, search, status, roleId } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by status
    if (status && Object.values(UserStatus).includes(status as UserStatus)) {
      where.status = status;
    }

    // Filter by role
    if (roleId) {
      where.userRoles = {
        some: { roleId },
      };
    }

    // Search filter
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          company: {
            select: { id: true, name: true, nit: true },
          },
          userRoles: {
            include: {
              role: {
                select: { id: true, name: true, color: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        phone: user.phone,
        avatar: user.avatar,
        status: user.status,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt,
        company: user.company,
        roles: user.userRoles.map(ur => ur.role),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      total,
      page,
      limit,
    };
  }

  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
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

    const roles = user.userRoles.map(ur => ({
      id: ur.role.id,
      name: ur.role.name,
      color: ur.role.color,
      assignedAt: ur.assignedAt,
    }));

    const permissions = user.userRoles.flatMap(ur =>
      ur.role.rolePermissions.map(rp => ({
        module: rp.permission.module,
        resource: rp.permission.resource,
        action: rp.permission.action,
        code: `${rp.permission.module}:${rp.permission.resource}:${rp.permission.action}`,
      }))
    );

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      phone: user.phone,
      avatar: user.avatar,
      status: user.status,
      emailVerified: user.emailVerified,
      emailVerifiedAt: user.emailVerifiedAt,
      lastLoginAt: user.lastLoginAt,
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil,
      company: user.company,
      roles,
      permissions: [...new Map(permissions.map(p => [p.code, p])).values()],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async create(data: any, createdById: string) {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('A user with this email already exists');
    }

    // Generate random password
    const password = generateRandomPassword(12);
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        companyId: data.companyId,
        createdById,
        userRoles: {
          create: data.roleIds.map((roleId: string) => ({
            roleId,
            assignedById: createdById,
          })),
        },
      },
      include: {
        company: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    // TODO: Send email with credentials
    console.log(`New user created: ${data.email}`);
    console.log(`Temporary password: ${password}`);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      company: user.company,
      roles: user.userRoles.map(ur => ur.role),
      status: user.status,
      createdAt: user.createdAt,
      // Include password for testing (remove in production)
      _tempPassword: password,
    };
  }

  async update(id: string, data: any, updatedById: string) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    // Update user
    const updateData: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      updatedAt: new Date(),
    };

    // Update roles if provided
    if (data.roleIds && data.roleIds.length > 0) {
      await prisma.$transaction([
        // Delete existing roles
        prisma.userRole.deleteMany({
          where: { userId: id },
        }),
        // Create new roles
        prisma.userRole.createMany({
          data: data.roleIds.map((roleId: string) => ({
            userId: id,
            roleId,
            assignedById: updatedById,
          })),
        }),
      ]);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        company: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      company: user.company,
      roles: user.userRoles.map(ur => ur.role),
      status: user.status,
      updatedAt: user.updatedAt,
    };
  }

  async delete(id: string, deletedById: string) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    // Prevent self-deletion
    if (id === deletedById) {
      throw new ValidationError('Cannot deactivate your own account');
    }

    // Soft delete
    await prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.INACTIVE,
        updatedAt: new Date(),
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: deletedById,
        action: 'DELETE',
        entity: 'User',
        entityId: id,
        oldData: { status: existingUser.status },
        newData: { status: UserStatus.INACTIVE },
      },
    });
  }

  async assignRoles(id: string, roleIds: string[], assignedById: string) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    // Verify all roles exist
    const roles = await prisma.role.findMany({
      where: { id: { in: roleIds } },
    });

    if (roles.length !== roleIds.length) {
      throw new ValidationError('One or more roles do not exist');
    }

    // Assign roles
    await prisma.$transaction([
      // Delete existing roles
      prisma.userRole.deleteMany({
        where: { userId: id },
      }),
      // Create new roles
      prisma.userRole.createMany({
        data: roleIds.map(roleId => ({
          userId: id,
          roleId,
          assignedById,
        })),
      }),
    ]);

    return this.getById(id);
  }

  async getUserPermissions(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
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
      throw new NotFoundError('User not found');
    }

    const permissions = user.userRoles.flatMap(ur =>
      ur.role.rolePermissions.map(rp => ({
        id: rp.permission.id,
        module: rp.permission.module,
        resource: rp.permission.resource,
        action: rp.permission.action,
        description: rp.permission.description,
        code: `${rp.permission.module}:${rp.permission.resource}:${rp.permission.action}`,
        roleName: ur.role.name,
      }))
    );

    // Remove duplicates
    const uniquePermissions = [...new Map(permissions.map(p => [p.code, p])).values()];

    return {
      userId: id,
      permissions: uniquePermissions,
      roles: user.userRoles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
      })),
    };
  }

  async resendInvitation(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.emailVerified) {
      throw new ValidationError('User has already verified their email');
    }

    // Generate new password
    const password = generateRandomPassword(12);
    const passwordHash = await hashPassword(password);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    // TODO: Send email with new credentials
    console.log(`Resending invitation to: ${user.email}`);
    console.log(`New temporary password: ${password}`);
  }

  async unlockAccount(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.status !== UserStatus.LOCKED) {
      throw new ValidationError('Account is not locked');
    }

    await prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.ACTIVE,
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date(),
      },
    });
  }
}

export default new UsersService();
