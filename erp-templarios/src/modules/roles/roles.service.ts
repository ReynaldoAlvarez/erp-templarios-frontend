import { PrismaService } from '../../core/database/prisma.service';
import { NotFoundError, ConflictError, ValidationError } from '../../core/middleware/error.middleware';

const prisma = PrismaService.getInstance();

class RolesService {
  async getAll() {
    const roles = await prisma.role.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { userRoles: true },
        },
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      color: role.color,
      isSystem: role.isSystem,
      userCount: role._count.userRoles,
      permissions: role.rolePermissions.map(rp => ({
        id: rp.permission.id,
        module: rp.permission.module,
        resource: rp.permission.resource,
        action: rp.permission.action,
        code: `${rp.permission.module}:${rp.permission.resource}:${rp.permission.action}`,
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }));
  }

  async getById(id: string) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      color: role.color,
      isSystem: role.isSystem,
      isActive: role.isActive,
      permissions: role.rolePermissions.map(rp => ({
        id: rp.permission.id,
        module: rp.permission.module,
        resource: rp.permission.resource,
        action: rp.permission.action,
        code: `${rp.permission.module}:${rp.permission.resource}:${rp.permission.action}`,
        description: rp.permission.description,
      })),
      users: role.userRoles.map(ur => ({
        id: ur.user.id,
        email: ur.user.email,
        name: `${ur.user.firstName} ${ur.user.lastName}`,
        assignedAt: ur.assignedAt,
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  async create(data: any) {
    // Check if role name exists
    const existingRole = await prisma.role.findUnique({
      where: { name: data.name },
    });

    if (existingRole) {
      throw new ConflictError('A role with this name already exists');
    }

    const role = await prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color || '#3B82F6',
        isSystem: false,
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      color: role.color,
      isSystem: role.isSystem,
      permissions: [],
      createdAt: role.createdAt,
    };
  }

  async update(id: string, data: any) {
    const existingRole = await prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      throw new NotFoundError('Role not found');
    }

    if (existingRole.isSystem) {
      throw new ValidationError('System roles cannot be modified');
    }

    // Check if new name conflicts with another role
    if (data.name && data.name !== existingRole.name) {
      const nameConflict = await prisma.role.findUnique({
        where: { name: data.name },
      });
      if (nameConflict) {
        throw new ConflictError('A role with this name already exists');
      }
    }

    const role = await prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        color: data.color,
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      color: role.color,
      isSystem: role.isSystem,
      permissions: role.rolePermissions.map(rp => ({
        id: rp.permission.id,
        code: `${rp.permission.module}:${rp.permission.resource}:${rp.permission.action}`,
      })),
      updatedAt: role.updatedAt,
    };
  }

  async delete(id: string) {
    const existingRole = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { userRoles: true },
        },
      },
    });

    if (!existingRole) {
      throw new NotFoundError('Role not found');
    }

    if (existingRole.isSystem) {
      throw new ValidationError('System roles cannot be deleted');
    }

    if (existingRole._count.userRoles > 0) {
      throw new ValidationError('Cannot delete a role that is assigned to users');
    }

    await prisma.role.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async assignPermissions(id: string, permissionIds: string[]) {
    const existingRole = await prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      throw new NotFoundError('Role not found');
    }

    // Verify all permissions exist
    const permissions = await prisma.permission.findMany({
      where: { id: { in: permissionIds } },
    });

    if (permissions.length !== permissionIds.length) {
      throw new ValidationError('One or more permissions do not exist');
    }

    // Update permissions
    await prisma.$transaction([
      // Delete existing permissions
      prisma.rolePermission.deleteMany({
        where: { roleId: id },
      }),
      // Create new permissions
      prisma.rolePermission.createMany({
        data: permissionIds.map(permissionId => ({
          roleId: id,
          permissionId,
        })),
      }),
    ]);

    return this.getById(id);
  }
}

export default new RolesService();
