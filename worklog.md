# TEMPLARIOS S.R.L. - ERP Development Worklog

---
## Task ID: Sprint 3 - Clientes y BLs - Main Agent
### Work Task
Implementación del Sprint 3: Módulo de Clientes y Bill of Lading (BLs)

### Work Summary
Se implementó exitosamente el Sprint 3 con los siguientes cambios:

#### 1. Tipos actualizados en `src/types/api.ts`
- `Cliente` interface con campos: id, razonSocial, nit, contacto, telefono, email, direccion, credito, limiteCredito, activo, createdAt, updatedAt
- `CreateClienteInput` y `UpdateClienteInput` para operaciones CRUD
- `ClienteListParams` para filtros de paginación
- `BL` interface con campos: id, numero, pesoTotal, unidades, tipoCarga, puertoOrigen, aduana, destinoFinal, nave, consignatario, tipoEntrega, clienteId, cliente, estado
- `CreateBLInput` y `UpdateBLInput` para operaciones CRUD
- `BLListParams` para filtros de paginación
- `CalcularFlotaResult` para el cálculo de flota

#### 2. API Client actualizado en `src/lib/api-client.ts`
- `clientesApi`: getAll, getById, create, update, delete
- `blsApi`: getAll, getById, create, update, delete, calcularFlota
- Manejo correcto de respuestas del backend con estructura `{ success, data, meta }`

#### 3. Hooks actualizados en `src/hooks/use-queries.ts`
- `useClientes`, `useCliente` para queries
- `useCreateCliente`, `useUpdateCliente`, `useDeleteCliente` para mutaciones
- `useBLs`, `useBL` para queries
- `useCreateBL`, `useUpdateBL`, `useDeleteBL`, `useCalcularFlota` para mutaciones

#### 4. Página de Clientes (`src/app/(auth)/dashboard/clientes/page.tsx`)
- Tabla con columnas: Razón Social, NIT, Contacto, Teléfono, Email, Crédito, Estado
- Filtros por búsqueda y estado (activo/inactivo)
- Paginación completa
- Dialog para crear clientes con validación Zod
- Dialog para editar clientes
- Dialog de confirmación para eliminar
- Campo condicional de límite de crédito cuando tiene crédito
- Estilo corporativo #1B3F66

#### 5. Página de BLs (`src/app/(auth)/dashboard/bls/page.tsx`)
- Tabla con columnas: Número BL, Cliente, Peso, Unidades, Origen, Destino, Estado
- Filtros por búsqueda, cliente y estado (PENDIENTE, EN_PROCESO, COMPLETADO)
- Paginación completa
- Dialog para crear BLs con validación Zod
- Selector de cliente (dropdown)
- Dialog para editar BLs
- Función de cálculo de flota con dialog de resultado
- Dialog de confirmación para eliminar
- Estados en mayúsculas siguiendo el patrón del backend
- Estilo corporativo #1B3F66

#### 6. Sidebar actualizado (`src/components/layout/sidebar.tsx`)
- Menú "Operaciones" actualizado con:
  - Clientes → /dashboard/clientes
  - Bill of Lading → /dashboard/bls
- Icono Ship agregado para BLs

### Notas Técnicas
- Se usó Controller de react-hook-form para todos los campos
- Se usó Label de @/components/ui/label en lugar de Field components
- suppressHydrationWarning agregado donde fue necesario
- Estados en mayúsculas: 'PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'ACTIVO', 'INACTIVO'
- Validaciones null en campos opcionales
- Patrones seguidos de las páginas de IAM existentes

---
## Task ID: Sprint 4 Enhancement - Backend Automation
### Agent: Super Z (Main)
### Task: Completar Sprint 4 con automatización completa del flujo de trabajo

### FASE 1: BACKEND COMPLETADO ✅

#### 1. TripService - Automatización de Estados de Recursos
- **SCHEDULED → IN_TRANSIT**: 
  - Actualiza truck.status = IN_TRANSIT
  - Actualiza driver.isAvailable = false
  - Vincula trailer al truck si existe
  
- **IN_TRANSIT → AT_BORDER**: 
  - Actualiza truck.status = AT_BORDER
  - **AUTO-CREA** BorderCrossing si no existe
  
- **AT_BORDER → IN_TRANSIT**: 
  - Actualiza truck.status = IN_TRANSIT (saliendo de frontera)
  
- **Cualquier estado → DELIVERED**: 
  - truck.status = SCHEDULED (disponible)
  - driver.isAvailable = true
  - Desvincula trailer del truck
  
- **Cualquier estado → CANCELLED**: 
  - Libera todos los recursos (truck, driver, trailer)

#### 2. BorderCrossingService - Gestión Mejorada
- Nuevo método `getAll()` con paginación y filtros
- Nuevo método `getBorderNames()` para lista de fronteras
- `registerExit()` actualiza automáticamente:
  - trip.status = IN_TRANSIT
  - truck.status = IN_TRANSIT
- Transacciones Prisma para consistencia de datos
- Estadísticas con `byBorder` para análisis

#### 3. SettlementService - Cálculos Automáticos
- Nuevo endpoint `GET /settlements/calculate/:tripId`
- Calcula automáticamente:
  - freightBob = freightUsd × exchangeRate
  - taxIt3Percent = freightBob × 3%
  - retention7Percent = freightBob × 7%
  - netPayment = freightBob - taxIt3 - retention - commission - advance
- Retorna fórmulas usadas para transparencia
- Valida que viaje esté DELIVERED antes de liquidar

#### 4. InvoiceService - Cálculo desde Múltiples Viajes
- Nuevo endpoint `POST /invoices/calculate`
- Valida que todos los viajes sean del mismo cliente
- Valida que todos los viajes estén DELIVERED
- Detecta viajes ya facturados
- Suma automáticamente montos de liquidaciones existentes

#### 5. Validaciones de Disponibilidad
- Al crear viaje: valida truck no esté IN_TRANSIT o AT_BORDER
- Al crear viaje: valida driver.isAvailable = true
- Al crear viaje: valida trailer no esté asignado a truck en uso

### FASE 2: FRONTEND - EN PROGRESO 🚧

#### Completado:
- ✅ Crear branch `sprint-4-frontend-automation`
- ✅ Actualizar BACKEND_API_REFERENCE.md con nuevos endpoints
- ✅ Actualizar types/api.ts con nuevos tipos (BorderCrossing, SettlementCalculation, etc.)
- ✅ Actualizar api-client.ts con nuevos módulos API (tripsApi, borderCrossingsApi, settlementsApi, invoicesApi)

#### Pendiente:
- ⏳ Revisar y corregir página Fronteras (Border Crossings)
- ⏳ Revisar y corregir página Liquidaciones con cálculos automáticos
- ⏳ Revisar y corregir página Facturas con cálculos automáticos

### Archivos Modificados (Backend)
- `/src/modules/trips/trips.service.ts` - Automatización de estados
- `/src/modules/border-crossings/border-crossings.service.ts` - Nuevos métodos
- `/src/modules/border-crossings/border-crossings.controller.ts` - Nuevos endpoints
- `/src/modules/border-crossings/index.ts` - Nuevas rutas
- `/src/modules/settlements/settlements.service.ts` - Cálculos automáticos
- `/src/modules/settlements/settlements.controller.ts` - Endpoint calculate
- `/src/modules/settlements/index.ts` - Nueva ruta
- `/src/modules/invoices/invoices.service.ts` - Cálculo desde viajes
- `/src/modules/invoices/invoices.controller.ts` - Endpoint calculate
- `/src/modules/invoices/index.ts` - Nueva ruta

### Archivos Modificados (Frontend)
- `BACKEND_API_REFERENCE.md` - Documentación de nuevos endpoints
- `src/types/api.ts` - Tipos BorderCrossing, SettlementCalculation, InvoiceCalculation
- `src/lib/api-client.ts` - Nuevos módulos API

### Archivos de Prueba Creados
- `/tests/sprint-4-automation.http` - Pruebas completas de automatización

### Commits Realizados (Backend)
1. `5b9ad71` - feat: Complete Sprint 4 backend automation
2. `0695fa3` - docs: Update worklog with Sprint 4 enhancement details
3. `ac22894` - test: Add comprehensive automation tests for Sprint 4

### Commits Realizados (Frontend)
1. `e103244` - docs: Update BACKEND_API_REFERENCE.md and types/api.ts
2. `3114ee8` - feat: Add Sprint 4 API modules to frontend

### Branch Creado (Frontend)
- `sprint-4-frontend-automation` en erp-templarios-frontend

### Endpoints Nuevos
```
GET  /border-crossings                   - Lista paginada con filtros
GET  /border-crossings/names             - Nombres de fronteras
GET  /settlements/calculate/:tripId      - Cálculo automático
GET  /settlements/pending                - Liquidaciones pendientes
POST /invoices/calculate                 - Cálculo desde viajes
```
