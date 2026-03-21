import { PrismaService } from '../../core/database/prisma.service';

const prisma = PrismaService.getInstance();

class PermissionsService {
  async getAll(module?: string) {
    const where: any = {};
    if (module) {
      where.module = module;
    }

    const permissions = await prisma.permission.findMany({
      where,
      orderBy: [
        { module: 'asc' },
        { resource: 'asc' },
        { action: 'asc' },
      ],
    });

    return permissions.map(p => ({
      id: p.id,
      module: p.module,
      resource: p.resource,
      action: p.action,
      code: `${p.module}:${p.resource}:${p.action}`,
      description: p.description,
    }));
  }

  async getByModule() {
    const permissions = await this.getAll();

    const grouped = permissions.reduce((acc, permission) => {
      const module = permission.module;
      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push(permission);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(grouped).map(([module, perms]) => ({
      module,
      permissions: perms,
    }));
  }

  async seedDefaultPermissions() {
    const defaultPermissions = [
      // IAM Module
      { module: 'iam', resource: 'usuarios', action: 'crear', description: 'Crear nuevos usuarios' },
      { module: 'iam', resource: 'usuarios', action: 'leer', description: 'Ver detalles de usuarios' },
      { module: 'iam', resource: 'usuarios', action: 'actualizar', description: 'Actualizar usuarios' },
      { module: 'iam', resource: 'usuarios', action: 'eliminar', description: 'Desactivar usuarios' },
      { module: 'iam', resource: 'usuarios', action: 'listar', description: 'Ver lista de usuarios' },
      { module: 'iam', resource: 'roles', action: 'crear', description: 'Crear nuevos roles' },
      { module: 'iam', resource: 'roles', action: 'leer', description: 'Ver detalles de roles' },
      { module: 'iam', resource: 'roles', action: 'actualizar', description: 'Actualizar roles' },
      { module: 'iam', resource: 'roles', action: 'eliminar', description: 'Eliminar roles' },
      { module: 'iam', resource: 'roles', action: 'listar', description: 'Ver lista de roles' },
      { module: 'iam', resource: 'roles', action: 'asignar', description: 'Asignar roles a usuarios' },
      { module: 'iam', resource: 'permisos', action: 'leer', description: 'Ver permisos' },
      { module: 'iam', resource: 'permisos', action: 'listar', description: 'Ver lista de permisos' },

      // Operations Module
      { module: 'operaciones', resource: 'clientes', action: 'crear', description: 'Crear clientes' },
      { module: 'operaciones', resource: 'clientes', action: 'leer', description: 'Ver clientes' },
      { module: 'operaciones', resource: 'clientes', action: 'actualizar', description: 'Actualizar clientes' },
      { module: 'operaciones', resource: 'clientes', action: 'eliminar', description: 'Eliminar clientes' },
      { module: 'operaciones', resource: 'clientes', action: 'listar', description: 'Ver lista de clientes' },
      { module: 'operaciones', resource: 'bl', action: 'crear', description: 'Crear Bill of Lading' },
      { module: 'operaciones', resource: 'bl', action: 'leer', description: 'Ver Bill of Lading' },
      { module: 'operaciones', resource: 'bl', action: 'actualizar', description: 'Actualizar Bill of Lading' },
      { module: 'operaciones', resource: 'bl', action: 'eliminar', description: 'Eliminar Bill of Lading' },
      { module: 'operaciones', resource: 'bl', action: 'listar', description: 'Ver lista de BLs' },
      { module: 'operaciones', resource: 'bl', action: 'calcular', description: 'Calcular flota necesaria' },
      { module: 'operaciones', resource: 'bl', action: 'exportar', description: 'Exportar BLs' },
      { module: 'operaciones', resource: 'viajes', action: 'crear', description: 'Crear viajes' },
      { module: 'operaciones', resource: 'viajes', action: 'leer', description: 'Ver viajes' },
      { module: 'operaciones', resource: 'viajes', action: 'actualizar', description: 'Actualizar viajes' },
      { module: 'operaciones', resource: 'viajes', action: 'eliminar', description: 'Eliminar viajes' },
      { module: 'operaciones', resource: 'viajes', action: 'listar', description: 'Ver lista de viajes' },
      { module: 'operaciones', resource: 'viajes', action: 'programar', description: 'Programar viajes' },
      { module: 'operaciones', resource: 'viajes', action: 'despachar', description: 'Despachar viajes' },
      { module: 'operaciones', resource: 'viajes', action: 'exportar', description: 'Exportar viajes' },

      // Fleet Module
      { module: 'flota', resource: 'camiones', action: 'crear', description: 'Registrar camiones' },
      { module: 'flota', resource: 'camiones', action: 'leer', description: 'Ver camiones' },
      { module: 'flota', resource: 'camiones', action: 'actualizar', description: 'Actualizar camiones' },
      { module: 'flota', resource: 'camiones', action: 'eliminar', description: 'Eliminar camiones' },
      { module: 'flota', resource: 'camiones', action: 'listar', description: 'Ver lista de camiones' },
      { module: 'flota', resource: 'camiones', action: 'mantenimiento', description: 'Gestionar mantenimientos' },
      { module: 'flota', resource: 'conductores', action: 'crear', description: 'Registrar conductores' },
      { module: 'flota', resource: 'conductores', action: 'leer', description: 'Ver conductores' },
      { module: 'flota', resource: 'conductores', action: 'actualizar', description: 'Actualizar conductores' },
      { module: 'flota', resource: 'conductores', action: 'eliminar', description: 'Eliminar conductores' },
      { module: 'flota', resource: 'conductores', action: 'listar', description: 'Ver lista de conductores' },
      { module: 'flota', resource: 'conductores', action: 'asignar', description: 'Asignar viajes a conductores' },

      // Finance Module
      { module: 'finanzas', resource: 'facturacion', action: 'crear', description: 'Crear facturas' },
      { module: 'finanzas', resource: 'facturacion', action: 'leer', description: 'Ver facturas' },
      { module: 'finanzas', resource: 'facturacion', action: 'actualizar', description: 'Actualizar facturas' },
      { module: 'finanzas', resource: 'facturacion', action: 'anular', description: 'Anular facturas' },
      { module: 'finanzas', resource: 'facturacion', action: 'listar', description: 'Ver lista de facturas' },
      { module: 'finanzas', resource: 'facturacion', action: 'exportar', description: 'Exportar facturas' },
      { module: 'finanzas', resource: 'pagos', action: 'crear', description: 'Crear pagos' },
      { module: 'finanzas', resource: 'pagos', action: 'leer', description: 'Ver pagos' },
      { module: 'finanzas', resource: 'pagos', action: 'actualizar', description: 'Actualizar pagos' },
      { module: 'finanzas', resource: 'pagos', action: 'aprobar', description: 'Aprobar pagos' },
      { module: 'finanzas', resource: 'pagos', action: 'listar', description: 'Ver lista de pagos' },

      // Reports Module
      { module: 'reportes', resource: 'dashboard', action: 'ver', description: 'Ver dashboard' },
      { module: 'reportes', resource: 'dashboard', action: 'exportar', description: 'Exportar reportes' },

      // Documents Module
      { module: 'documentos', resource: 'archivos', action: 'subir', description: 'Subir documentos' },
      { module: 'documentos', resource: 'archivos', action: 'leer', description: 'Ver documentos' },
      { module: 'documentos', resource: 'archivos', action: 'eliminar', description: 'Eliminar documentos' },
      { module: 'documentos', resource: 'archivos', action: 'listar', description: 'Ver lista de documentos' },
      { module: 'documentos', resource: 'archivos', action: 'descargar', description: 'Descargar documentos' },
    ];

    for (const perm of defaultPermissions) {
      await prisma.permission.upsert({
        where: {
          module_resource_action: {
            module: perm.module,
            resource: perm.resource,
            action: perm.action,
          },
        },
        create: perm,
        update: { description: perm.description },
      });
    }

    console.log('✅ Default permissions seeded');
  }
}

export default new PermissionsService();
