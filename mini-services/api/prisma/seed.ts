import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/core/utils/password.util';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Create Company
  console.log('Creating company...');
  const company = await prisma.company.upsert({
    where: { nit: '1234567890' },
    update: {},
    create: {
      name: 'TEMPLARIOS S.R.L.',
      nit: '1234567890',
      address: 'Cochabamba, Bolivia',
      phone: '+591 4 1234567',
      email: 'info@templarios.com',
      isActive: true,
    },
  });
  console.log('✅ Company created:', company.name);

  // 2. Create Branch
  console.log('Creating headquarters branch...');
  const branch = await prisma.branch.upsert({
    where: { id: 'default-branch-id' },
    update: {},
    create: {
      id: 'default-branch-id',
      name: 'Sucursal Principal',
      address: 'Cochabamba, Bolivia',
      isHeadquarters: true,
      companyId: company.id,
    },
  });
  console.log('✅ Branch created:', branch.name);

  // 3. Create Permissions
  console.log('Creating permissions...');
  const permissions = [
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

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: {
        module_resource_action: {
          module: perm.module,
          resource: perm.resource,
          action: perm.action,
        },
      },
      update: { description: perm.description },
      create: perm,
    });
  }
  console.log(`✅ ${permissions.length} permissions created`);

  // 4. Create Roles
  console.log('Creating roles...');

  // Super Admin
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: {
      name: 'Super Admin',
      description: 'Administrador con acceso total al sistema',
      color: '#DC2626',
      isSystem: true,
    },
  });

  // Gerente General
  const gerenteRole = await prisma.role.upsert({
    where: { name: 'Gerente General' },
    update: {},
    create: {
      name: 'Gerente General',
      description: 'Gerente con acceso a todos los módulos y reportes',
      color: '#7C3AED',
      isSystem: true,
    },
  });

  // Administrador
  const adminRole = await prisma.role.upsert({
    where: { name: 'Administrador' },
    update: {},
    create: {
      name: 'Administrador',
      description: 'Administrador con acceso a BL, flota y facturación',
      color: '#2563EB',
      isSystem: true,
    },
  });

  // Operaciones
  const operacionesRole = await prisma.role.upsert({
    where: { name: 'Operaciones' },
    update: {},
    create: {
      name: 'Operaciones',
      description: 'Personal de operaciones - programación de viajes',
      color: '#0891B2',
      isSystem: true,
    },
  });

  // Finanzas
  const finanzasRole = await prisma.role.upsert({
    where: { name: 'Finanzas' },
    update: {},
    create: {
      name: 'Finanzas',
      description: 'Personal de finanzas - facturación y pagos',
      color: '#059669',
      isSystem: true,
    },
  });

  // Logistica
  const logisticaRole = await prisma.role.upsert({
    where: { name: 'Logística' },
    update: {},
    create: {
      name: 'Logística',
      description: 'Personal de logística - seguimiento y fronteras',
      color: '#D97706',
      isSystem: true,
    },
  });

  // Conductor
  const conductorRole = await prisma.role.upsert({
    where: { name: 'Conductor' },
    update: {},
    create: {
      name: 'Conductor',
      description: 'Conductores de la flota',
      color: '#6B7280',
      isSystem: true,
    },
  });

  console.log('✅ Roles created');

  // 5. Assign all permissions to Super Admin
  console.log('Assigning permissions to Super Admin...');
  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Assign specific permissions to other roles
  const gerentePerms = allPermissions.filter(p => 
    p.module === 'iam' || 
    p.module === 'operaciones' || 
    p.module === 'flota' || 
    p.module === 'finanzas' ||
    p.module === 'reportes' ||
    p.module === 'documentos'
  );
  for (const perm of gerentePerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: gerenteRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: gerenteRole.id, permissionId: perm.id },
    });
  }

  const adminPerms = allPermissions.filter(p =>
    p.module === 'operaciones' ||
    p.module === 'flota' ||
    p.module === 'documentos'
  );
  for (const perm of adminPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  const operacionesPerms = allPermissions.filter(p =>
    (p.module === 'operaciones' && ['viajes', 'bl'].includes(p.resource)) ||
    (p.module === 'documentos' && p.action !== 'eliminar')
  );
  for (const perm of operacionesPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: operacionesRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: operacionesRole.id, permissionId: perm.id },
    });
  }

  const finanzasPerms = allPermissions.filter(p =>
    p.module === 'finanzas' ||
    (p.module === 'reportes' && p.action === 'ver')
  );
  for (const perm of finanzasPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: finanzasRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: finanzasRole.id, permissionId: perm.id },
    });
  }

  console.log('✅ Permissions assigned to roles');

  // 6. Create Super Admin User
  console.log('Creating super admin user...');
  const hashedPassword = await hashPassword('Admin123!');
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@templarios.com' },
    update: {},
    create: {
      email: 'admin@templarios.com',
      passwordHash: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+591 70000000',
      companyId: company.id,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      status: 'ACTIVE',
    },
  });

  // Assign Super Admin role
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: superAdmin.id, roleId: superAdminRole.id } },
    update: {},
    create: { userId: superAdmin.id, roleId: superAdminRole.id },
  });

  console.log('✅ Super Admin created');
  console.log('');
  console.log('='.repeat(60));
  console.log('🌱 Seed completed successfully!');
  console.log('='.repeat(60));
  console.log('');
  console.log('📋 Login credentials:');
  console.log('   Email: admin@templarios.com');
  console.log('   Password: Admin123!');
  console.log('');
  console.log('⚠️  IMPORTANT: Change the password after first login!');
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
