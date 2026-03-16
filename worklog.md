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
