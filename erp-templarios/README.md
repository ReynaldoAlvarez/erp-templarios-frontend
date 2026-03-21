# ERP TEMPLARIOS S.R.L.

Sistema de gestión empresarial para transporte de carga pesada - Importación/Exportación Bolivia.

## 🚛 Descripción

ERP completo para la gestión de operaciones de transporte de carga, diseñado específicamente para TEMPLARIOS S.R.L., empresa boliviana dedicada al transporte de mercancías en la ruta Desaguadero → Cochabamba.

## 📋 Módulos

| Sprint | Módulo | Estado |
|--------|--------|--------|
| 1 | IAM (Auth, Usuarios, Roles, Permisos) | ✅ Completado |
| 2 | BL + Clientes | ✅ Completado |
| 3 | Flota (Camiones, Remolques) + Conductores + Gastos | ✅ Completado |
| 4 | Viajes + Fronteras + Documentos | 📅 Pendiente |
| 5 | Finanzas + Reportes básicos | 📅 Pendiente |
| 6 | PWA + Offline + Notificaciones | 📅 Pendiente |
| 7 | Reportes avanzados + Aprobaciones | 📅 Pendiente |
| 8 | Testing + Migración + Capacitación | 📅 Pendiente |

## 🛠️ Tecnologías

- **Backend**: Node.js + Express + TypeScript
- **Base de datos**: PostgreSQL 16 + Prisma 6 ORM
- **Cache**: Redis 7
- **Autenticación**: JWT (Access Token 15min + Refresh Token 7 días)
- **Contenedores**: Docker + Docker Compose

## 📁 Estructura del Proyecto

```
erp-templarios/
├── src/
│   ├── modules/
│   │   ├── auth/              # Autenticación JWT
│   │   ├── users/             # Gestión de usuarios
│   │   ├── roles/             # Gestión de roles
│   │   ├── permissions/       # Gestión de permisos
│   │   ├── clients/           # Clientes
│   │   ├── bl/                # Bill of Lading
│   │   │   └── import/        # Importación desde Excel/JSON
│   │   ├── fleet/             # Flota
│   │   │   ├── trucks/        # Camiones
│   │   │   ├── trailers/      # Remolques
│   │   │   └── maintenance/   # Mantenimientos
│   │   ├── drivers/           # Conductores
│   │   ├── expenses/          # Gastos
│   │   ├── company/           # Empresa y sucursales
│   │   ├── trips/             # Viajes
│   │   ├── finance/           # Finanzas
│   │   └── reports/           # Reportes
│   ├── core/
│   │   ├── config/            # Configuración
│   │   ├── database/          # Prisma + Redis
│   │   ├── middleware/        # Middlewares
│   │   └── utils/             # Utilidades
│   ├── app.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma          # Esquema de BD (25 modelos)
│   └── seed.ts                # Datos iniciales
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── tests/                     # Pruebas REST Client
│   ├── sprint-1-auth-users-roles.http
│   ├── sprint-2-clients-bl.http
│   └── sprint-3-fleet-drivers-expenses.http
└── package.json
```

## 🚀 Inicio Rápido

### Con Docker (Recomendado)

```bash
# Clonar repositorio
git clone https://github.com/ReynaldoAlvarez/erp-templarios.git
cd erp-templarios

# Configurar variables de entorno
cp .env.example .env

# Levantar servicios
cd docker
docker-compose up -d

# La API estará disponible en http://localhost:3001
```

### Sin Docker

```bash
# Instalar dependencias
npm install

# Configurar PostgreSQL y Redis
# Crear base de datos: templarios_erp

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# Ejecutar seeds (datos iniciales)
npx prisma db seed

# Iniciar servidor
npm run dev
```

## 🧪 Pruebas con REST Client

Los archivos de prueba están ubicados en la carpeta `tests/` y pueden ejecutarse con la extensión **REST Client** de VS Code.

### Archivos de Prueba

| Archivo | Contenido |
|---------|-----------|
| `sprint-1-auth-users-roles.http` | Autenticación, Usuarios, Roles, Permisos |
| `sprint-2-clients-bl.http` | Clientes, Bill of Lading |
| `sprint-3-fleet-drivers-expenses.http` | Flota, Conductores, Gastos |

### Cómo usar las pruebas

1. Instalar extensión **REST Client** en VS Code
2. Abrir archivo `.http` deseado
3. Ejecutar login primero para obtener token
4. El token se guarda automáticamente para las siguientes peticiones

### Casos de Prueba Incluidos

Cada archivo incluye:
- ✅ Casos exitosos (CRUD completo)
- ❌ Casos fallidos (validaciones, duplicados, no encontrados)
- 🔍 Búsquedas y filtros
- 📊 Estadísticas y reportes
- 🔄 Operaciones especiales (aprobar, cancelar, asignar)

## 📡 API Endpoints

### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Iniciar sesión |
| POST | `/api/v1/auth/logout` | Cerrar sesión |
| POST | `/api/v1/auth/refresh-token` | Renovar token |
| POST | `/api/v1/auth/forgot-password` | Olvidé contraseña |
| POST | `/api/v1/auth/change-password` | Cambiar contraseña |
| GET | `/api/v1/auth/me` | Usuario actual |

### Usuarios
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/users` | Listar usuarios |
| GET | `/api/v1/users/:id` | Obtener usuario |
| POST | `/api/v1/users` | Crear usuario |
| PUT | `/api/v1/users/:id` | Actualizar usuario |
| DELETE | `/api/v1/users/:id` | Desactivar usuario |
| POST | `/api/v1/users/:id/roles` | Asignar roles |

### Roles
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/roles` | Listar roles |
| GET | `/api/v1/roles/:id` | Obtener rol |
| POST | `/api/v1/roles` | Crear rol |
| PUT | `/api/v1/roles/:id` | Actualizar rol |
| DELETE | `/api/v1/roles/:id` | Eliminar rol |

### Permisos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/permissions` | Listar permisos |
| POST | `/api/v1/permissions` | Crear permiso |

### Clientes (Sprint 2)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/clients` | Listar clientes (paginado) |
| GET | `/api/v1/clients/search?q=` | Buscar clientes |
| GET | `/api/v1/clients/:id` | Obtener cliente con estadísticas |
| GET | `/api/v1/clients/:id/credit` | Estado de crédito del cliente |
| POST | `/api/v1/clients` | Crear cliente |
| PUT | `/api/v1/clients/:id` | Actualizar cliente |
| DELETE | `/api/v1/clients/:id` | Desactivar cliente |
| POST | `/api/v1/clients/:id/restore` | Reactivar cliente |

### Bill of Lading (Sprint 2)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/bl` | Listar BLs (paginado, filtros) |
| GET | `/api/v1/bl/search?q=` | Buscar BLs |
| GET | `/api/v1/bl/number/:blNumber` | Obtener BL por número |
| GET | `/api/v1/bl/:id` | Obtener BL con viajes |
| GET | `/api/v1/bl/:id/progress` | Reporte de progreso del BL |
| GET | `/api/v1/bl/import/template` | Plantilla de importación |
| POST | `/api/v1/bl` | Crear BL |
| POST | `/api/v1/bl/import/json` | Importar BLs desde JSON |
| PUT | `/api/v1/bl/:id` | Actualizar BL |
| POST | `/api/v1/bl/:id/approve` | Aprobar BL |
| POST | `/api/v1/bl/:id/cancel` | Cancelar BL |

### Camiones (Sprint 3)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/fleet/trucks` | Listar camiones (paginado) |
| GET | `/api/v1/fleet/trucks/available` | Camiones disponibles |
| GET | `/api/v1/fleet/trucks/search?q=` | Buscar camiones |
| GET | `/api/v1/fleet/trucks/:id` | Obtener camión con estadísticas |
| POST | `/api/v1/fleet/trucks` | Crear camión |
| PUT | `/api/v1/fleet/trucks/:id` | Actualizar camión |
| PATCH | `/api/v1/fleet/trucks/:id/mileage` | Actualizar kilometraje |
| DELETE | `/api/v1/fleet/trucks/:id` | Desactivar camión |
| POST | `/api/v1/fleet/trucks/:id/restore` | Reactivar camión |

### Remolques (Sprint 3)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/fleet/trailers` | Listar remolques (paginado) |
| GET | `/api/v1/fleet/trailers/available` | Remolques disponibles |
| GET | `/api/v1/fleet/trailers/:id` | Obtener remolque |
| POST | `/api/v1/fleet/trailers` | Crear remolque |
| PUT | `/api/v1/fleet/trailers/:id` | Actualizar remolque |
| PATCH | `/api/v1/fleet/trailers/:id/assign` | Asignar a camión |
| DELETE | `/api/v1/fleet/trailers/:id` | Desactivar remolque |
| POST | `/api/v1/fleet/trailers/:id/restore` | Reactivar remolque |

### Conductores (Sprint 3)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/drivers` | Listar conductores (paginado) |
| GET | `/api/v1/drivers/available` | Conductores disponibles |
| GET | `/api/v1/drivers/search?q=` | Buscar conductores |
| GET | `/api/v1/drivers/:id` | Obtener conductor con estadísticas |
| GET | `/api/v1/drivers/:id/stats` | Estadísticas del conductor |
| POST | `/api/v1/drivers` | Crear conductor |
| PUT | `/api/v1/drivers/:id` | Actualizar conductor |
| PATCH | `/api/v1/drivers/:id/availability` | Cambiar disponibilidad |
| DELETE | `/api/v1/drivers/:id` | Desactivar conductor |
| POST | `/api/v1/drivers/:id/restore` | Reactivar conductor |

### Gastos (Sprint 3)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/expenses` | Listar gastos (paginado, filtros) |
| GET | `/api/v1/expenses/categories` | Categorías de gastos |
| GET | `/api/v1/expenses/stats` | Estadísticas de gastos |
| GET | `/api/v1/expenses/driver/:driverId` | Gastos por conductor |
| GET | `/api/v1/expenses/trip/:tripId` | Gastos por viaje |
| GET | `/api/v1/expenses/:id` | Obtener gasto |
| POST | `/api/v1/expenses` | Registrar gasto |
| PUT | `/api/v1/expenses/:id` | Actualizar gasto |
| DELETE | `/api/v1/expenses/:id` | Eliminar gasto |

## 🔐 Variables de Entorno

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/templarios_erp
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

## 📊 Modelo de Datos

- **25 modelos** Prisma
- **17 enums** para estados y tipos
- Relaciones properly configuradas
- Soft delete implementado
- Audit log automático

### Modelos principales
- Company, Branch
- User, Role, Permission, Session, RefreshToken, AuditLog
- Employee, Driver, DriverHistory, Sanction, Expense
- Truck, Trailer, Maintenance
- Client, BillOfLading, Trip, Route, BorderCrossing
- Settlement, Invoice, Asset, Liability

## 👥 Usuarios Iniciales (Seed)

| Email | Rol | Password |
|-------|-----|----------|
| admin@templarios.com | Super Admin | Admin123! |

### Clientes de Ejemplo (Seed)

| Empresa | NIT | Crédito |
|---------|-----|---------|
| SIDERURGICA BOLIVIA S.R.L. | 1023456789 | Bs 500,000 |
| IMPORTADORA ANDINA S.A. | 2034567890 | Bs 300,000 |
| METALFORJA INDUSTRIAL | 3045678901 | Sin crédito |
| CONSTRUCTORA SUR | 4056789012 | Bs 200,000 |
| ACEROS DEL ORIENTE | 5067890123 | Bs 400,000 |

## 📝 Funcionalidades por Sprint

### Sprint 1: IAM
- ✅ Autenticación JWT con refresh tokens
- ✅ CRUD de usuarios con generación automática de contraseñas
- ✅ Sistema de roles y permisos dinámicos
- ✅ Middleware de autorización
- ✅ Auditoría automática

### Sprint 2: Clientes y BL
- ✅ CRUD completo con paginación
- ✅ Búsqueda por nombre, NIT, número
- ✅ Gestión de crédito y límites
- ✅ Reporte de progreso de BL
- ✅ Sistema de aprobación y cancelación
- ✅ Importación desde JSON
- ✅ Soft delete con restauración

### Sprint 3: Flota y Conductores
- ✅ Gestión de camiones con estadísticas
- ✅ Gestión de remolques con asignación a camiones
- ✅ Control de kilometraje
- ✅ Disponibilidad de vehículos
- ✅ Registro de conductores con licencias
- ✅ Historial y sanciones de conductores
- ✅ Registro de gastos por conductor/viaje
- ✅ Categorización de gastos
- ✅ Estadísticas de gastos

## 📄 Licencia

Propiedad de TEMPLARIOS S.R.L. - Todos los derechos reservados.

---

Desarrollado con ❤️ para TEMPLARIOS S.R.L.
