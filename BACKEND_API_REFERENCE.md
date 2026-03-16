# ERP TEMPLARIOS - Backend API Reference

## Base URL
```
Development: http://localhost:3001/api/v1
Production: [CONFIGURE]
```

## Authentication
Todos los endpoints requieren Bearer token en el header:
```
Authorization: Bearer {accessToken}
```

---

## Estructura de Respuesta Estándar

### Respuesta Exitosa (Lista)
```json
{
  "success": true,
  "message": "Mensaje descriptivo",
  "data": {
    "clients": [...],  // o "bls", "trips", etc.
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  },
  "timestamp": "2026-03-16T17:37:53.502Z"
}
```

### Respuesta Exitosa (Item Individual)
```json
{
  "success": true,
  "message": "Mensaje descriptivo",
  "data": { ... },
  "timestamp": "2026-03-16T17:37:53.502Z"
}
```

### Respuesta de Error
```json
{
  "success": false,
  "message": "Descripción del error",
  "statusCode": 400,
  "errors": { ... }
}
```

---

## SPRINT 1: AUTH, USERS, ROLES, PERMISSIONS

### Authentication

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/login` | Iniciar sesión |
| POST | `/auth/logout` | Cerrar sesión |
| GET | `/auth/me` | Obtener usuario actual |
| POST | `/auth/refresh-token` | Refrescar token |
| POST | `/auth/change-password` | Cambiar contraseña |

### Users

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/users` | Listar usuarios (paginado) |
| GET | `/users/:id` | Obtener usuario por ID |
| POST | `/users` | Crear usuario |
| PUT | `/users/:id` | Actualizar usuario |
| DELETE | `/users/:id` | Eliminar usuario (soft delete) |
| POST | `/users/:id/roles` | Asignar roles |
| GET | `/users/:id/permissions` | Obtener permisos |
| POST | `/users/:id/unlock` | Desbloquear cuenta |

**Filtros disponibles:**
- `page`, `limit` - Paginación
- `search` - Búsqueda por nombre/email
- `status` - Filtrar por estado (ACTIVE, INACTIVE, LOCKED)

### Roles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/roles` | Listar roles |
| GET | `/roles/:id` | Obtener rol por ID |
| POST | `/roles` | Crear rol |
| PUT | `/roles/:id` | Actualizar rol |
| DELETE | `/roles/:id` | Eliminar rol |
| POST | `/roles/:id/permissions` | Asignar permisos |

### Permissions

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/permissions` | Listar permisos |
| GET | `/permissions?module=iam` | Filtrar por módulo |
| POST | `/permissions` | Crear permiso |

---

## SPRINT 2: CLIENTS & BILL OF LADING

### Clients

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/clients` | Listar clientes (paginado) |
| GET | `/clients/:id` | Obtener cliente por ID |
| GET | `/clients/:id/credit` | Estado de crédito |
| GET | `/clients/search?q=query` | Buscar clientes |
| POST | `/clients` | Crear cliente |
| PUT | `/clients/:id` | Actualizar cliente |
| DELETE | `/clients/:id` | Desactivar cliente |
| POST | `/clients/:id/restore` | Reactivar cliente |

**Estructura Client:**
```typescript
interface Client {
  id: string;
  businessName: string;      // Razón social
  nit: string;               // NIT
  contactName?: string;      // Nombre contacto
  phone?: string;            // Teléfono
  email?: string;            // Email
  address?: string;          // Dirección
  hasCredit: boolean;        // Tiene crédito
  creditLimit?: string;      // Límite de crédito (string del backend)
  isActive: boolean;         // Está activo
  billsOfLadingCount: number;
  invoicesCount: number;
  createdAt: string;
  updatedAt: string;
}
```

**Filtros disponibles:**
- `page`, `limit` - Paginación
- `search` - Búsqueda por razón social/NIT
- `hasCredit` - Filtrar por crédito (true/false)
- `isActive` - Filtrar por estado activo

**Crear Cliente:**
```json
{
  "businessName": "EMPRESA S.R.L.",
  "nit": "1023456789",
  "contactName": "Juan Pérez",
  "phone": "+591 70123456",
  "email": "contacto@empresa.com",
  "address": "Zona Industrial, Cochabamba",
  "hasCredit": true,
  "creditLimit": 100000
}
```

### Bills of Lading (BL)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/bl` | Listar BLs (paginado) |
| GET | `/bl/:id` | Obtener BL por ID |
| GET | `/bl/number/:blNumber` | Obtener BL por número |
| GET | `/bl/:id/progress` | Reporte de progreso |
| GET | `/bl/search?q=query` | Buscar BLs |
| GET | `/bl/import/template` | Plantilla de importación |
| POST | `/bl` | Crear BL |
| POST | `/bl/import/json` | Importar BLs desde JSON |
| PUT | `/bl/:id` | Actualizar BL |
| POST | `/bl/:id/approve` | Aprobar BL |
| POST | `/bl/:id/cancel` | Cancelar BL |
| DELETE | `/bl/:id` | Eliminar BL |

**Estructura BL:**
```typescript
interface BillOfLading {
  id: string;
  blNumber: string;          // Número de BL
  totalWeight: string;       // Peso total (string del backend)
  unitCount: number;         // Cantidad de unidades
  cargoType?: string;        // Tipo de carga
  originPort: string;        // Puerto de origen
  customsPoint: string;      // Punto aduanero
  finalDestination: string;  // Destino final
  vessel?: string;           // Nave
  consignee?: string;        // Consignatario
  deliveryType: 'DIRECT' | 'INDIRECT';
  clientId: string;
  client?: {
    id: string;
    businessName: string;
    nit: string;
  };
  status: 'SCHEDULED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  approvedById?: string;
  approvedAt?: string;
  tripsCount: number;
  progress: {
    totalWeight: number;
    transportedWeight: number;
    remainingWeight: number;
    progressPercent: number;
    deliveredTrips: number;
    totalTrips: number;
  };
  createdAt: string;
  updatedAt: string;
}
```

**Filtros disponibles:**
- `page`, `limit` - Paginación
- `search` - Búsqueda por número/naviera
- `status` - Filtrar por estado
- `clientId` - Filtrar por cliente
- `dateFrom`, `dateTo` - Filtrar por rango de fechas

**Crear BL:**
```json
{
  "blNumber": "BL-2024-001",
  "totalWeight": 45678.5,
  "unitCount": 12,
  "cargoType": "Bobinas de acero",
  "originPort": "Desaguadero",
  "customsPoint": "Desaguadero",
  "finalDestination": "Cochabamba",
  "vessel": "MSC Maria",
  "consignee": "CLIENTE S.R.L.",
  "deliveryType": "DIRECT",
  "clientId": "client-uuid"
}
```

---

## SPRINT 3: FLEET, DRIVERS & EXPENSES

### Trucks (Camiones)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/fleet/trucks` | Listar camiones |
| GET | `/fleet/trucks/available` | Camiones disponibles |
| GET | `/fleet/trucks/search?q=query` | Buscar camiones |
| GET | `/fleet/trucks/:id` | Obtener camión |
| POST | `/fleet/trucks` | Crear camión |
| PUT | `/fleet/trucks/:id` | Actualizar camión |
| PATCH | `/fleet/trucks/:id/mileage` | Actualizar kilometraje |
| DELETE | `/fleet/trucks/:id` | Desactivar camión |
| POST | `/fleet/trucks/:id/restore` | Reactivar camión |

**Estructura Truck:**
```typescript
interface Truck {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  axles?: number;
  capacityTons: number;
  operationPermit?: string;
  operationPermitExpiry?: string;
  mileage: number;
  status: 'AVAILABLE' | 'SCHEDULED' | 'IN_TRANSIT' | 'MAINTENANCE';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Trailers (Remolques)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/fleet/trailers` | Listar remolques |
| GET | `/fleet/trailers/available` | Remolques disponibles |
| GET | `/fleet/trailers/search?q=query` | Buscar remolques |
| GET | `/fleet/trailers/:id` | Obtener remolque |
| POST | `/fleet/trailers` | Crear remolque |
| PUT | `/fleet/trailers/:id` | Actualizar remolque |
| PATCH | `/fleet/trailers/:id/assign` | Asignar/desasignar camión |
| DELETE | `/fleet/trailers/:id` | Desactivar remolque |
| POST | `/fleet/trailers/:id/restore` | Reactivar remolque |

**Estructura Trailer:**
```typescript
interface Trailer {
  id: string;
  plateNumber: string;
  type: string;
  brand?: string;
  year?: number;
  capacityTons: number;
  operationPermit?: string;
  operationPermitExpiry?: string;
  truckId?: string;
  truck?: Truck;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Drivers (Conductores)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/drivers` | Listar conductores |
| GET | `/drivers/available` | Conductores disponibles |
| GET | `/drivers/search?q=query` | Buscar conductores |
| GET | `/drivers/:id` | Obtener conductor |
| GET | `/drivers/:id/stats` | Estadísticas del conductor |
| POST | `/drivers` | Crear conductor |
| PUT | `/drivers/:id` | Actualizar conductor |
| PATCH | `/drivers/:id/availability` | Cambiar disponibilidad |
| DELETE | `/drivers/:id` | Desactivar conductor |
| POST | `/drivers/:id/restore` | Reactivar conductor |

**Estructura Driver:**
```typescript
interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  identityCard: string;
  phone?: string;
  email?: string;
  address?: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  contractType: 'MONTHLY' | 'TRIP';
  isAvailable: boolean;
  isActive: boolean;
  branchId?: string;
  totalTrips?: number;
  totalWeightTransported?: number;
  avgDeliveryHours?: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}
```

### Expenses (Gastos)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/expenses` | Listar gastos |
| GET | `/expenses/categories` | Categorías de gastos |
| GET | `/expenses/stats` | Estadísticas de gastos |
| GET | `/expenses/driver/:driverId` | Gastos por conductor |
| GET | `/expenses/trip/:tripId` | Gastos por viaje |
| GET | `/expenses/:id` | Obtener gasto |
| POST | `/expenses` | Crear gasto |
| PUT | `/expenses/:id` | Actualizar gasto |
| DELETE | `/expenses/:id` | Eliminar gasto |

**Categorías de Gastos:**
- `FUEL` - Combustible
- `TOLL` - Peajes
- `FOOD` - Alimentación
- `MAINTENANCE` - Mantenimiento
- `OTHER` - Otros

---

## SPRINT 4: TRIPS, BORDER CROSSINGS, DOCUMENTS, SETTLEMENTS, INVOICES

### Trips (Viajes)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/trips` | Listar viajes |
| GET | `/trips/available` | Recursos disponibles |
| GET | `/trips/stats` | Estadísticas |
| GET | `/trips/search?q=query` | Buscar viajes |
| GET | `/trips/driver/:driverId` | Viajes por conductor |
| GET | `/trips/bl/:blId` | Viajes por BL |
| GET | `/trips/:id` | Obtener viaje |
| POST | `/trips` | Crear viaje |
| PUT | `/trips/:id` | Actualizar viaje |
| PATCH | `/trips/:id/status` | Cambiar estado |

**Estados de Viaje:**
- `SCHEDULED` - Programado
- `IN_TRANSIT` - En tránsito
- `AT_BORDER` - En frontera
- `DELIVERED` - Entregado
- `CANCELLED` - Cancelado

### Border Crossings (Crucés de Frontera)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/border-crossings/active` | Fronteras activas |
| GET | `/border-crossings/stats` | Estadísticas |
| GET | `/border-crossings/trip/:tripId` | Cruces por viaje |
| GET | `/border-crossings/:id` | Obtener cruce |
| GET | `/border-crossings/:id/history` | Historial de canales |
| POST | `/border-crossings` | Registrar llegada |
| POST | `/border-crossings/:id/exit` | Registrar salida |
| POST | `/border-crossings/:id/channel` | Cambiar canal |

**Canales:**
- `GREEN` - Verde (sin inspección)
- `YELLOW` - Amarillo (revisión documental)
- `RED` - Rojo (inspección física)

### Documents (Documentos)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/documents` | Listar documentos |
| GET | `/documents/pending` | Documentos pendientes |
| GET | `/documents/types` | Tipos de documento |
| GET | `/documents/stats` | Estadísticas |
| GET | `/documents/trip/:tripId` | Documentos por viaje |
| GET | `/documents/:id` | Obtener documento |
| POST | `/documents` | Crear documento |
| PUT | `/documents/:id` | Actualizar documento |
| PATCH | `/documents/:id/status` | Cambiar estado |
| POST | `/documents/:id/receive` | Recibir documento |
| POST | `/documents/:id/verify` | Verificar documento |

### Routes (Rutas)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/routes/common` | Rutas comunes |
| GET | `/routes/trip/:tripId` | Rutas por viaje |
| GET | `/routes/:id` | Obtener ruta |
| POST | `/routes` | Crear ruta |
| PUT | `/routes/:id` | Actualizar ruta |
| DELETE | `/routes/:id` | Eliminar ruta |

### Settlements (Liquidaciones)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/settlements` | Listar liquidaciones |
| GET | `/settlements/pending` | Liquidaciones pendientes |
| GET | `/settlements/stats` | Estadísticas |
| GET | `/settlements/trip/:tripId` | Liquidación por viaje |
| GET | `/settlements/:id` | Obtener liquidación |
| POST | `/settlements` | Crear liquidación |
| PUT | `/settlements/:id` | Actualizar liquidación |
| POST | `/settlements/:id/approve` | Aprobar liquidación |
| POST | `/settlements/:id/pay` | Marcar como pagada |

**Estados:**
- `PENDING` - Pendiente
- `APPROVED` - Aprobada
- `PAID` - Pagada
- `CANCELLED` - Cancelada

### Invoices (Facturas)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/invoices` | Listar facturas |
| GET | `/invoices/pending` | Facturas pendientes |
| GET | `/invoices/stats` | Estadísticas |
| GET | `/invoices/client/:clientId` | Facturas por cliente |
| GET | `/invoices/number/:invoiceNumber` | Por número |
| GET | `/invoices/:id` | Obtener factura |
| POST | `/invoices` | Crear factura |
| PUT | `/invoices/:id` | Actualizar factura |
| POST | `/invoices/:id/approve` | Emitir factura |
| POST | `/invoices/:id/pay` | Marcar como pagada |
| POST | `/invoices/:id/cancel` | Cancelar factura |
| POST | `/invoices/:invoiceId/trips` | Agregar viaje |
| DELETE | `/invoices/:invoiceId/trips/:tripId` | Remover viaje |

---

## SPRINT 5: ASSETS, LIABILITIES, MAINTENANCE, SANCTIONS, DRIVER HISTORY

### Assets (Activos)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/assets` | Listar activos |
| GET | `/assets/categories` | Categorías |
| GET | `/assets/stats` | Estadísticas |
| GET | `/assets/:id` | Obtener activo |
| POST | `/assets` | Crear activo |
| PUT | `/assets/:id` | Actualizar activo |
| PATCH | `/assets/:id/depreciation` | Actualizar depreciación |
| POST | `/assets/:id/deactivate` | Desactivar activo |
| POST | `/assets/:id/activate` | Activar activo |

**Categorías:**
- `VEHICLE` - Vehículos
- `EQUIPMENT` - Equipos
- `FURNITURE` - Mobiliario
- `REAL_ESTATE` - Inmuebles
- `OTHER` - Otros

### Liabilities (Pasivos)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/liabilities` | Listar pasivos |
| GET | `/liabilities/types` | Tipos de pasivo |
| GET | `/liabilities/stats` | Estadísticas |
| GET | `/liabilities/overdue` | Pasivos vencidos |
| GET | `/liabilities/:id` | Obtener pasivo |
| POST | `/liabilities` | Crear pasivo |
| PUT | `/liabilities/:id` | Actualizar pasivo |
| PATCH | `/liabilities/:id/status` | Cambiar estado |
| POST | `/liabilities/:id/payment` | Registrar pago |

**Tipos:**
- `LOAN` - Préstamo
- `MORTGAGE` - Hipoteca
- `CREDIT` - Crédito
- `OTHER` - Otros

### Maintenance (Mantenimientos)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/maintenance` | Listar mantenimientos |
| GET | `/maintenance/upcoming` | Mantenimientos próximos |
| GET | `/maintenance/types` | Tipos |
| GET | `/maintenance/stats` | Estadísticas |
| GET | `/maintenance/truck/:truckId` | Por camión |
| GET | `/maintenance/:id` | Obtener mantenimiento |
| POST | `/maintenance` | Crear mantenimiento |
| PUT | `/maintenance/:id` | Actualizar |
| POST | `/maintenance/:id/start` | Iniciar |
| POST | `/maintenance/:id/complete` | Completar |
| POST | `/maintenance/:id/cancel` | Cancelar |

**Tipos:**
- `PREVENTIVE` - Preventivo
- `CORRECTIVE` - Correctivo
- `EMERGENCY` - Emergencia

### Sanctions (Sanciones)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/sanctions` | Listar sanciones |
| GET | `/sanctions/active` | Sanciones activas |
| GET | `/sanctions/types` | Tipos |
| GET | `/sanctions/stats` | Estadísticas |
| GET | `/sanctions/driver/:driverId` | Por conductor |
| GET | `/sanctions/:id` | Obtener sanción |
| POST | `/sanctions` | Crear sanción |
| PUT | `/sanctions/:id` | Actualizar |
| POST | `/sanctions/:id/complete` | Completar |
| POST | `/sanctions/:id/cancel` | Cancelar |

**Tipos:**
- `WARNING` - Amonestación
- `FINE` - Multa
- `SUSPENSION` - Suspensión
- `DISMISSAL` - Despido

### Driver History (Historial de Conductores)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/driver-history` | Listar historial |
| GET | `/driver-history/event-types` | Tipos de evento |
| GET | `/driver-history/stats` | Estadísticas |
| GET | `/driver-history/driver/:driverId` | Por conductor |
| GET | `/driver-history/driver/:driverId/timeline` | Timeline |
| GET | `/driver-history/driver/:driverId/summary` | Resumen |
| GET | `/driver-history/:id` | Obtener registro |
| POST | `/driver-history` | Crear registro |
| DELETE | `/driver-history/:id` | Eliminar |

**Tipos de Evento:**
- `INCIDENT` - Incidente
- `ACCIDENT` - Accidente
- `AWARD` - Reconocimiento
- `STATUS_CHANGE` - Cambio de estado
- `TRAINING` - Capacitación

---

## SPRINT 6: DASHBOARD, REPORTS & NOTIFICATIONS

### Dashboard

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/dashboard/main` | Estadísticas principales |
| GET | `/dashboard/financial` | Dashboard financiero |
| GET | `/dashboard/operational` | Dashboard operativo |
| GET | `/dashboard/fleet` | Dashboard de flota |
| GET | `/dashboard/hr` | Dashboard de RRHH |
| GET | `/dashboard/summary` | Resumen completo |

### Reports

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/reports/types` | Tipos de reportes |
| GET | `/reports/trips` | Reporte de viajes |
| GET | `/reports/financial` | Reporte financiero |
| GET | `/reports/clients` | Reporte de clientes |
| GET | `/reports/drivers` | Reporte de conductores |
| GET | `/reports/fleet` | Reporte de flota |
| GET | `/reports/borders` | Reporte de fronteras |
| GET | `/reports/export/:type` | Exportar reporte |

### Notifications

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/notifications` | Listar notificaciones |
| GET | `/notifications/types` | Tipos |
| GET | `/notifications/priorities` | Prioridades |
| GET | `/notifications/counts` | Contadores |
| GET | `/notifications/unread` | No leídas |
| GET | `/notifications/:id` | Obtener notificación |
| POST | `/notifications` | Crear notificación |
| POST | `/notifications/bulk` | Crear en lote |
| POST | `/notifications/:id/read` | Marcar como leída |
| POST | `/notifications/read-all` | Marcar todas como leídas |
| DELETE | `/notifications/:id` | Eliminar |
| DELETE | `/notifications/read` | Eliminar leídas |

---

## SPRINT 7: FINANCE ENHANCEMENT

### Cash Flow

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/cash-flow` | Listar flujo de caja |
| GET | `/cash-flow/types` | Tipos |
| GET | `/cash-flow/categories` | Categorías |
| GET | `/cash-flow/payment-methods` | Métodos de pago |
| GET | `/cash-flow/summary` | Resumen |
| GET | `/cash-flow/daily?date=YYYY-MM-DD` | Flujo diario |
| GET | `/cash-flow/monthly?year=YYYY&month=M` | Flujo mensual |
| GET | `/cash-flow/:id` | Obtener registro |
| POST | `/cash-flow` | Crear registro |
| PUT | `/cash-flow/:id` | Actualizar |
| DELETE | `/cash-flow/:id` | Eliminar |

**Tipos:**
- `INCOME` - Ingreso
- `EXPENSE` - Egreso

**Categorías:**
- `FREIGHT` - Fletes
- `FUEL` - Combustible
- `MAINTENANCE` - Mantenimiento
- `SALARY` - Salarios
- `TOLL` - Peajes
- `OTHER` - Otros

### Payments

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/payments` | Listar pagos |
| GET | `/payments/types` | Tipos |
| GET | `/payments/methods` | Métodos |
| GET | `/payments/statuses` | Estados |
| GET | `/payments/pending` | Pendientes |
| GET | `/payments/stats` | Estadísticas |
| GET | `/payments/driver/:driverId` | Por conductor |
| GET | `/payments/:id` | Obtener pago |
| POST | `/payments` | Crear pago |
| PUT | `/payments/:id` | Actualizar |
| POST | `/payments/:id/approve` | Aprobar |
| POST | `/payments/:id/complete` | Completar |
| POST | `/payments/:id/cancel` | Cancelar |
| DELETE | `/payments/:id` | Eliminar |

**Tipos:**
- `ADVANCE` - Anticipo
- `SETTLEMENT` - Liquidación
- `INVOICE` - Factura
- `EXPENSE_REIMBURSEMENT` - Reembolso

### SIN Export (Facturación Bolivia)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/sin-export` | Listar exportaciones |
| GET | `/sin-export/statuses` | Estados |
| GET | `/sin-export/pending` | Pendientes |
| GET | `/sin-export/failed` | Fallidos |
| GET | `/sin-export/stats` | Estadísticas |
| GET | `/sin-export/invoice/:invoiceId` | Por factura |
| GET | `/sin-export/invoice/:invoiceId/json` | JSON para SIN |
| GET | `/sin-export/:id` | Obtener exportación |
| POST | `/sin-export` | Crear solicitud |
| POST | `/sin-export/:id/process` | Procesar |
| POST | `/sin-export/:id/retry` | Reintentar |

---

## Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - No autenticado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Conflicto (duplicado) |
| 429 | Too Many Requests - Rate limiting |
| 500 | Internal Server Error - Error del servidor |

---

## Notas Importantes

1. **Paginación**: Todos los endpoints de lista soportan `page` y `limit`
2. **Búsqueda**: Usar parámetro `search` o `q` según el endpoint
3. **Fechas**: Formato ISO 8601 (`YYYY-MM-DD` o `YYYY-MM-DDTHH:mm:ssZ`)
4. **Montos**: El backend devuelve algunos montos como `string` (decimales)
5. **Enums**: Usar valores en mayúsculas y en inglés (ej: `ACTIVE`, `SCHEDULED`)
