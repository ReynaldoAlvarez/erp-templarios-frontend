# 🚀 PLAN DE DESARROLLO FRONTEND - SPRINT 5
## ERP TEMPLARIOS S.R.L. - Sistema de Transporte de Carga

---

## 📋 INFORMACIÓN GENERAL

| Aspecto | Detalle |
|---------|---------|
| **Repositorio Frontend** | https://github.com/ReynaldoAlvarez/erp-templarios-frontend.git |
| **Repositorio Backend** | https://github.com/ReynaldoAlvarez/erp-api-templarios.git |
| **Rama de Trabajo** | `feature/sprint-5-frontend-enhancement` (crear desde master) |
| **Base URL API** | http://localhost:3001/api/v1 |
| **Fecha de Plan** | 2026-04-05 |

---

## 🎯 OBJETIVOS DEL SPRINT 5

### Objetivo Principal
Implementar mejoras operativas automatizadas que optimicen el flujo de trabajo de la empresa de transporte, incluyendo:

1. **Catálogos Maestros** - Estandarización de tipos de documento y rutas (tramos)
2. **Automatización de Documentos** - Generación automática al crear viajes
3. **Bloqueo de Pagos** - Control automático basado en documentación
4. **Sanciones Automáticas** - Penalizaciones por retrasos
5. **Reportes Tipo Excel** - Tabla intermedia TripReports para transición
6. **Dashboard Sprint 5** - Visualización consolidada

---

## 📊 ANÁLISIS DE BRECHAS (GAP ANALYSIS)

### ✅ Ya Existe en Frontend

| Módulo | Estado | Archivos Relacionados |
|--------|--------|----------------------|
| Sanctions (Básico) | ✅ Existe | `types/api.ts`, `api-client.ts`, `use-queries.ts`, `sanciones/page.tsx` |
| Documents (Básico) | ✅ Existe | `TripDocument`, `documentsApi`, `documentos/page.tsx` |
| Settlements | ✅ Existe | Con automatización Sprint 4 |
| Invoices | ✅ Existe | Con automatización Sprint 4 |
| Dashboard Principal | ✅ Existe | Sprint 6 implementado |
| Reportes | ✅ Existe | Módulo completo |

### 🆕 Debe Crearse desde Cero

| Módulo | Prioridad | Complejidad | Dependencias |
|--------|-----------|-------------|--------------|
| **DocumentTypes** | 🔴 Alta | Baja | Ninguna |
| **Tramos** | 🔴 Alta | Baja | Ninguna |
| **DocumentAutomation** | 🟡 Media | Alta | DocumentTypes |
| **PaymentBlock** | 🟡 Media | Media | Documents, Settlements |
| **TripReports** | 🟢 Baja | Media | Tramos, Documents |
| **Dashboard Sprint5** | 🟢 Baja | Media | Todos los anteriores |

### ⚠️ Debe Modificarse

| Módulo | Cambios Necesarios |
|--------|-------------------|
| **Sanctions** | Agregar campos nuevos: `sanctionReason`, `tripId`, `daysDelayed`, `automatic` |
| **Settlement** | Agregar campos: `retentionPercent` variable, `documentsComplete`, `isPaymentBlocked` |
| **Truck** | Agregar campo: `isSupportTruck` |
| **Trip** | Agregar campos: `unitCount`, `lineNumber` |
| **Documents** | Integrar con DocumentTypes, mejorar checklist |
| **Sidebar** | Agregar nuevos enlaces de navegación |

---

## 📁 ESTRUCTURA DE ARCHIVOS A CREAR/MODIFICAR

### Nuevos Archivos

```
src/
├── app/(auth)/dashboard/
│   ├── documentos-tipos/
│   │   └── page.tsx                    # CRUD DocumentTypes
│   ├── tramos/
│   │   └── page.tsx                    # CRUD Tramos
│   ├── reportes-viajes/
│   │   └── page.tsx                    # TripReports
│   ├── automatizacion/
│   │   └── page.tsx                    # DocumentAutomation
│   └── bloqueo-pagos/
│       └── page.tsx                    # PaymentBlock
│
└── components/
    └── sprint5/
        ├── DocumentTypeForm.tsx        # Formulario DocumentTypes
        ├── TramoForm.tsx               # Formulario Tramos
        ├── DocumentChecklist.tsx       # Lista de verificación
        ├── BlockedPaymentCard.tsx      # Card de pago bloqueado
        ├── SanctionGenerationModal.tsx # Modal generación automática
        └── Sprint5DashboardWidget.tsx  # Widget para dashboard
```

### Archivos a Modificar

```
src/
├── types/api.ts                        # +300 líneas (nuevos tipos)
├── lib/api-client.ts                   # +400 líneas (nuevas APIs)
├── hooks/use-queries.ts                # +200 líneas (nuevos hooks)
├── components/layout/sidebar.tsx       # +30 líneas (nuevos enlaces)
│
├── app/(auth)/dashboard/
│   ├── sanciones/page.tsx              # Mejoras para automatización
│   ├── documentos/page.tsx             # Integración DocumentTypes
│   └── page.tsx                        # Dashboard Sprint 5 widget
```

---

## 🗓️ PLAN DE IMPLEMENTACIÓN POR FASES

### FASE 1: CATÁLOGOS MAESTROS (3-4 días)
**Prioridad: 🔴 Alta | Dependencias: Ninguna**

#### 1.1 DocumentTypes (Tipos de Documento)
| Tarea | Tiempo Estimado | Archivo |
|-------|-----------------|---------|
| Crear tipos TypeScript | 30 min | `types/api.ts` |
| Crear API client | 45 min | `api-client.ts` |
| Crear hooks React Query | 30 min | `use-queries.ts` |
| Crear página CRUD completa | 3 horas | `documentos-tipos/page.tsx` |
| Agregar al sidebar | 15 min | `sidebar.tsx` |

**Tipos a Crear:**
```typescript
// DocumentType
interface DocumentType {
  id: string;
  code: string;              // "MIC", "CRT", "ASPB", "NOTA_TARJA", "BALANZA", "FACTURA"
  name: string;
  description?: string;
  isRequired: boolean;
  isForSupportOnly: boolean;  // true = solo para camiones de apoyo
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateDocumentTypeInput {
  code: string;
  name: string;
  description?: string;
  isRequired?: boolean;
  isForSupportOnly?: boolean;
  order?: number;
}

interface DocumentTypeStats {
  total: number;
  active: number;
  inactive: number;
  required: number;
  optional: number;
  forSupportOnly: number;
}
```

**Endpoints a Implementar:**
- `GET /document-types` - Listar (paginado)
- `GET /document-types/active` - Activos (dropdown)
- `GET /document-types/required` - Requeridos
- `GET /document-types/stats` - Estadísticas
- `GET /document-types/:id` - Por ID
- `POST /document-types` - Crear
- `PUT /document-types/:id` - Actualizar
- `DELETE /document-types/:id` - Eliminar (soft)
- `POST /document-types/:id/restore` - Restaurar
- `POST /document-types/reorder` - Reordenar

---

#### 1.2 Tramos (Segmentos de Ruta)
| Tarea | Tiempo Estimado | Archivo |
|-------|-----------------|---------|
| Crear tipos TypeScript | 30 min | `types/api.ts` |
| Crear API client | 45 min | `api-client.ts` |
| Crear hooks React Query | 30 min | `use-queries.ts` |
| Crear página CRUD completa | 3 horas | `tramos/page.tsx` |
| Agregar al sidebar | 15 min | `sidebar.tsx` |

**Tipos a Crear:**
```typescript
interface Tramo {
  id: string;
  code: string;            // "MAT-CBA", "ARI-LPZ"
  name: string;            // "Matarani - Cochabamba"
  origin: string;
  destination: string;
  distanceKm?: number;
  estimatedHours?: number;
  baseRateUsd?: number;
  baseRateBob?: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface TramoStats {
  total: number;
  active: number;
  inactive: number;
  avgDistance: number;
  avgRateUsd: number;
  totalOrigins: number;
  totalDestinations: number;
}
```

**Endpoints a Implementar:**
- `GET /tramos` - Listar (paginado)
- `GET /tramos/active` - Activos
- `GET /tramos/origins` - Orígenes disponibles
- `GET /tramos/destinations` - Destinos disponibles
- `GET /tramos/stats` - Estadísticas
- `GET /tramos/by-origin/:origin` - Por origen
- `GET /tramos/by-destination/:destination` - Por destino
- `GET /tramos/:id` - Por ID
- `POST /tramos` - Crear
- `PUT /tramos/:id` - Actualizar
- `DELETE /tramos/:id` - Eliminar

---

### FASE 2: AUTOMATIZACIÓN DE DOCUMENTOS (2-3 días)
**Prioridad: 🟡 Media | Dependencias: DocumentTypes**

#### 2.1 Document Automation
| Tarea | Tiempo Estimado | Archivo |
|-------|-----------------|---------|
| Crear tipos TypeScript | 45 min | `types/api.ts` |
| Crear API client | 1 hora | `api-client.ts` |
| Crear hooks | 45 min | `use-queries.ts` |
| Crear componente Checklist | 2 horas | `DocumentChecklist.tsx` |
| Crear página de automatización | 3 horas | `automatizacion/page.tsx` |
| Integrar con página de viajes | 1 hora | `viajes/page.tsx` |

**Tipos a Crear:**
```typescript
interface DocumentChecklistResponse {
  tripId: string;
  truckId: string;
  isSupportTruck: boolean;
  checklist: DocumentChecklistItem[];
  summary: {
    total: number;
    verified: number;
    pending: number;
    missing: number;
    documentsComplete: boolean;
  };
}

interface DocumentChecklistItem {
  id: string;
  code: string;
  name: string;
  isRequired: boolean;
  isForSupportOnly: boolean;
  order: number;
  documentId?: string;
  status: 'PENDING' | 'RECEIVED' | 'VERIFIED';
  fileUrl?: string;
  verifiedAt?: string;
  verifiedByName?: string;
}

interface DocumentAutomationStats {
  totalTrips: number;
  tripsWithDocuments: number;
  documentsAutoGenerated: number;
  documentsManuallyCreated: number;
  automationRate: number;
}
```

**Endpoints a Implementar:**
- `GET /document-automation/stats` - Estadísticas
- `GET /document-automation/trips/:tripId/checklist` - Checklist
- `GET /document-automation/trips/:tripId/verify` - Verificar estado
- `POST /document-automation/trips/:tripId/create-documents` - Crear docs
- `POST /document-automation/batch-create` - Crear en lote

**Funcionalidades UI:**
1. **Checklist de Documentos** - Mostrar lista de documentos requeridos
2. **Indicadores de Estado** - PENDING (amarillo), RECEIVED (azul), VERIFIED (verde)
3. **Generación Automática** - Botón para generar documentos faltantes
4. **Badge de Camión de Apoyo** - Mostrar si requiere FACTURA adicional
5. **Progress Bar** - Progreso de documentos completados

---

### FASE 3: BLOQUEO DE PAGOS (2-3 días)
**Prioridad: 🟡 Media | Dependencias: Documents, Settlements**

#### 3.1 Payment Block
| Tarea | Tiempo Estimado | Archivo |
|-------|-----------------|---------|
| Crear tipos TypeScript | 45 min | `types/api.ts` |
| Crear API client | 1 hora | `api-client.ts` |
| Crear hooks | 45 min | `use-queries.ts` |
| Crear componente BlockedPaymentCard | 2 horas | `BlockedPaymentCard.tsx` |
| Crear página de bloqueos | 3 horas | `bloqueo-pagos/page.tsx` |
| Integrar con liquidaciones | 1 hora | `liquidaciones/page.tsx` |

**Tipos a Crear:**
```typescript
interface BlockedPayment {
  settlementId: string;
  tripId: string;
  micDta: string;
  driverName: string;
  driverId: string;
  truckPlate: string;
  freightAmount: number;
  retentionAmount: number;
  retentionPercent: number;
  netPayment: number;
  missingDocuments: MissingDocument[];
  blockedDays: number;
  blockedAt: string;
}

interface MissingDocument {
  code: string;
  name: string;
  status: 'PENDING' | 'RECEIVED';
}

interface PaymentBlockStats {
  blocked: number;
  unblocked: number;
  totalRetentionAmount: number;
}

interface PaymentBlockChecklist {
  settlementId: string;
  tripId: string;
  isBlocked: boolean;
  documentsComplete: boolean;
  missingDocuments: MissingDocument[];
  canProcessPayment: boolean;
}
```

**Endpoints a Implementar:**
- `GET /payment-block/blocked` - Lista bloqueados
- `GET /payment-block/stats` - Estadísticas
- `GET /payment-block/checklist/:tripId` - Checklist
- `POST /payment-block/check/:tripId` - Verificar y actualizar
- `POST /payment-block/unblock/:settlementId` - Desbloquear manual
- `GET /payment-block/can-process/:settlementId` - Verificar si procesable
- `POST /payment-block/process-all` - Procesar todos
- `GET /payment-block/history/:settlementId` - Historial

**Funcionalidades UI:**
1. **Lista de Pagos Bloqueados** - Tabla con filtros
2. **Card de Bloqueo** - Mostrar documentos faltantes y días bloqueado
3. **Modal de Desbloqueo Manual** - Requiere justificación (auditoría)
4. **Indicador en Liquidaciones** - Badge de bloqueo
5. **Acciones Rápidas** - Ver documentos, desbloquear, procesar

---

### FASE 4: SANCIONES AUTOMÁTICAS (2 días)
**Prioridad: 🟡 Media | Dependencias: PaymentBlock**

#### 4.1 Mejoras a Módulo de Sanciones
| Tarea | Tiempo Estimado | Archivo |
|-------|-----------------|---------|
| Actualizar tipos TypeScript | 30 min | `types/api.ts` |
| Actualizar API client | 45 min | `api-client.ts` |
| Actualizar hooks | 30 min | `use-queries.ts` |
| Mejorar página existente | 3 horas | `sanciones/page.tsx` |
| Crear modal generación automática | 2 horas | `SanctionGenerationModal.tsx` |

**Nuevos Campos en Sanction:**
```typescript
interface Sanction {
  // ... campos existentes
  sanctionReason: 'DOCUMENT_DELAY' | 'REPEATED_OFFENSE' | 'SAFETY_VIOLATION' | 'OTHER';
  tripId?: string;
  daysDelayed?: number;
  automatic: boolean;
}

interface SanctionConfig {
  GRACE_PERIOD_DAYS: number;      // 3 días
  FINE_PER_DAY_USD: number;       // $10 USD
  MAX_FINE_DAYS: number;          // 30 días
  MAX_FINE_AMOUNT: number;        // $300 USD
  SUSPENSION_THRESHOLDS: {
    FIRST: number;
    SECOND: number;
    THIRD: number;                // 7 días
    FOURTH: number;               // 15 días
    FIFTH_PLUS: number;           // 30 días
  };
}

interface DelayedTrip {
  tripId: string;
  micDta: string;
  driverId: string;
  driverName: string;
  daysDelayed: number;
  suggestedFine: number;
  suggestedAction: 'FINE' | 'SUSPENSION' | 'WARNING';
}
```

**Nuevos Endpoints:**
- `GET /sanctions/config` - Configuración
- `GET /sanctions/reasons` - Razones de sanción
- `GET /sanctions/delayed-trips` - Viajes con retraso
- `POST /sanctions/generate-automatic` - Generar automáticas
- `GET /sanctions/check-recurring/:driverId` - Verificar reincidencia
- `POST /sanctions/process-driver/:driverId` - Procesar conductor
- `GET /sanctions/automation-stats` - Stats automatización

**Funcionalidades UI:**
1. **Lista de Viajes con Retraso** - Identificar candidatos a sanción
2. **Generación Automática** - Botón para generar sanciones pendientes
3. **Modal de Confirmación** - Previsualizar sanciones a generar
4. **Badge Automático/Manual** - Diferenciar origen
5. **Dashboard de Sanciones** - Estadísticas por tipo y razón

---

### FASE 5: TRIP REPORTS (2 días)
**Prioridad: 🟢 Baja | Dependencias: Tramos, Documents**

#### 5.1 Trip Reports (Tabla Intermedia)
| Tarea | Tiempo Estimado | Archivo |
|-------|-----------------|---------|
| Crear tipos TypeScript | 45 min | `types/api.ts` |
| Crear API client | 1 hora | `api-client.ts` |
| Crear hooks | 45 min | `use-queries.ts` |
| Crear página con tabla tipo Excel | 4 horas | `reportes-viajes/page.tsx` |

**Tipos a Crear:**
```typescript
interface TripReport {
  id: string;
  tripId: string;
  
  // Identificadores
  micDta: string;
  blNumber: string;
  lineNumber: number;
  
  // Cliente (snapshot)
  clientId: string;
  clientName: string;
  clientNit?: string;
  
  // Ruta (snapshot)
  origin: string;
  destination: string;
  tramoCode?: string;
  
  // Vehículo y chofer (snapshot)
  truckPlate: string;
  trailerPlate?: string;
  driverName: string;
  driverCi: string;
  isSupportTruck: boolean;
  
  // Carga
  weightKg: number;
  unitCount: number;
  
  // Finanzas
  freightAmount: number;
  retentionPercent: number;
  retentionAmount: number;
  netAmount: number;
  
  // Estado documentos
  documentsComplete: boolean;
  documentsPending: number;
  missingDocuments?: string;
  
  // Estado pago
  isPaymentBlocked: boolean;
  paymentStatus: 'pending' | 'partial' | 'paid';
  
  // Fechas
  departureDate?: string;
  arrivalDate?: string;
  documentDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface TripReportStats {
  total: number;
  withCompleteDocs: number;
  withBlockedPayments: number;
  docsCompletionRate: number;
  paymentBlockRate: number;
  byPaymentStatus: { pending: number; partial: number; paid: number };
}
```

**Endpoints a Implementar:**
- `GET /trip-reports` - Listar (paginado con filtros)
- `GET /trip-reports/stats` - Estadísticas
- `GET /trip-reports/blocked-payments` - Pagos bloqueados
- `GET /trip-reports/incomplete-documents` - Docs incompletos
- `GET /trip-reports/bl/:blNumber` - Por BL
- `GET /trip-reports/bl/:blNumber/summary` - Resumen por BL
- `GET /trip-reports/client/:clientId` - Por cliente
- `GET /trip-reports/:id` - Por ID
- `POST /trip-reports/generate/:tripId` - Generar desde viaje
- `POST /trip-reports/generate-missing` - Generar faltantes
- `PUT /trip-reports/:id` - Actualizar
- `POST /trip-reports/:id/regenerate` - Regenerar

**Funcionalidades UI:**
1. **Tabla Tipo Excel** - Vista de planilla con columnas editables
2. **Filtros Avanzados** - Por estado de docs, pago, cliente, BL
3. **Resumen por BL** - Agrupar viajes por BL
4. **Exportar** - CSV/Excel de la tabla
5. **Indicadores Visuales** - Colores por estado de docs/pago

---

### FASE 6: DASHBOARD SPRINT 5 (1-2 días)
**Prioridad: 🟢 Baja | Dependencias: Todos los anteriores**

#### 6.1 Dashboard Consolidado
| Tarea | Tiempo Estimado | Archivo |
|-------|-----------------|---------|
| Crear tipos TypeScript | 30 min | `types/api.ts` |
| Crear API client | 15 min | `api-client.ts` |
| Crear hook | 15 min | `use-queries.ts` |
| Crear widgets | 3 horas | `components/sprint5/` |
| Integrar en dashboard principal | 2 horas | `page.tsx` |

**Tipos a Crear:**
```typescript
interface Sprint5Dashboard {
  documentTypes: {
    total: number;
    active: number;
    inactive: number;
  };
  documents: {
    byStatus: { PENDING: number; VERIFIED: number; REJECTED: number };
    byType: Array<{ type: string; name: string; count: number }>;
    verified: number;
    pending: number;
    completionRate: number;
  };
  tramos: {
    total: number;
    active: number;
    topOrigins: Array<{ origin: string; count: number }>;
    topDestinations: Array<{ destination: string; count: number }>;
  };
  tripReports: {
    total: number;
    withCompleteDocs: number;
    withBlockedPayments: number;
    docsCompletionRate: number;
    paymentBlockRate: number;
    byPaymentStatus: { pending: number; partial: number; paid: number };
  };
  paymentBlocks: {
    blocked: number;
    unblocked: number;
    totalRetentionAmount: number;
  };
  sanctions: {
    total: number;
    active: number;
    byType: { FINE: number; SUSPENSION: number; WARNING: number };
    byReason: { DOCUMENT_DELAY: number; REPEATED_OFFENSE: number; OTHER: number };
    automatic: number;
    manual: number;
    automaticRate: number;
  };
  automation: {
    documentsAutoGenerated: number;
    documentsManuallyCreated: number;
    automationRate: number;
  };
}
```

**Widget Components:**
1. **DocumentTypesStatsCard** - Total, activos, inactivos
2. **DocumentsCompletionCard** - Tasa de completado, gráfico de estados
3. **TramosStatsCard** - Top orígenes/destinos
4. **TripReportsSummaryCard** - Docs completos, pagos bloqueados
5. **PaymentBlocksCard** - Monto retenido, bloqueados activos
6. **SanctionsSummaryCard** - Por tipo, automáticas vs manuales
7. **AutomationRateCard** - Tasa de automatización general

---

## 🔄 ACTUALIZACIONES A ENTIDADES EXISTENTES

### Settlement (Liquidaciones)
```typescript
// Agregar a interface Settlement:
retentionPercent: number;    // Variable (7%, 8%, etc.)
documentsComplete: boolean;  // Indica si docs completos
isPaymentBlocked: boolean;   // Pago bloqueado por docs faltantes
```

### Truck (Camiones)
```typescript
// Agregar a interface Truck:
isSupportTruck: boolean;     // true = camión de apoyo/transportista externo
```

### Trip (Viajes)
```typescript
// Agregar a interface Trip:
unitCount: number;           // Cantidad de unidades/camiones
lineNumber: number;          // Número de línea dentro del BL
```

### Route (Rutas)
```typescript
// Agregar a interface Route:
tramoId?: string;            // Referencia al tramo predefinido
```

---

## 📐 COMPONENTES UI SUGERIDOS

### Componentes Reutilizables

| Componente | Descripción | Ubicación |
|------------|-------------|-----------|
| `StatusBadge` | Badge con colores según estado | `components/ui/status-badge.tsx` |
| `FilterPanel` | Panel de filtros reutilizable | `components/ui/filter-panel.tsx` |
| `DataTable` | Tabla con paginación y ordenamiento | `components/ui/data-table.tsx` |
| `StatsCard` | Card de estadísticas con icono | `components/ui/stats-card.tsx` |
| `ProgressBar` | Barra de progreso con porcentaje | `components/ui/progress-bar.tsx` |

### Componentes Específicos Sprint 5

| Componente | Descripción | Ubicación |
|------------|-------------|-----------|
| `DocumentChecklist` | Lista de verificación de documentos | `components/sprint5/` |
| `DocumentStatusBadge` | Badge PENDING/RECEIVED/VERIFIED | `components/sprint5/` |
| `BlockedPaymentCard` | Card con info de pago bloqueado | `components/sprint5/` |
| `TramoSelector` | Selector origen/destino con tramos | `components/sprint5/` |
| `SanctionGenerationModal` | Modal generar sanciones automáticas | `components/sprint5/` |
| `TripReportsTable` | Tabla tipo Excel para reportes | `components/sprint5/` |

---

## 🎨 DISEÑO UI/UX

### Colores por Estado

| Estado | Color | Uso |
|--------|-------|-----|
| PENDING | Amarillo (#FCD34D) | Documentos pendientes |
| RECEIVED | Azul (#60A5FA) | Documentos recibidos |
| VERIFIED | Verde (#34D399) | Documentos verificados |
| BLOCKED | Rojo (#F87171) | Pagos bloqueados |
| COMPLETE | Verde (#10B981) | Proceso completado |

### Iconos Sugeridos

| Módulo | Icono (Lucide) |
|--------|----------------|
| DocumentTypes | `FileText` |
| Tramos | `Route` |
| DocumentAutomation | `Settings2` |
| PaymentBlock | `Lock` |
| TripReports | `Table2` |
| Sanctions | `AlertTriangle` |

---

## ✅ CRITERIOS DE ACEPTACIÓN

| ID | Criterio | Verificación |
|----|----------|--------------|
| CA-001 | CRUD completo de DocumentTypes | Crear, editar, eliminar, reordenar |
| CA-002 | CRUD completo de Tramos | Crear, editar, eliminar con distancias |
| CA-003 | Checklist de documentos por viaje | Mostrar documentos requeridos según tipo camión |
| CA-004 | Indicador de camión de apoyo | Badge visible si `isSupportTruck=true` |
| CA-005 | Lista de pagos bloqueados | Ver documentos faltantes y días bloqueado |
| CA-006 | Desbloqueo manual con auditoría | Registrar usuario, fecha y motivo |
| CA-007 | Viajes con retraso identificados | Lista con días de retraso y sugerencia |
| CA-008 | Sanciones automáticas generables | Botón genera sanciones pendientes |
| CA-009 | Badge automático/manual en sanciones | Diferenciar origen de sanción |
| CA-010 | Tabla TripReports funcional | Filtros, exportación, regeneración |
| CA-011 | Dashboard Sprint5 completo | Todos los widgets con datos reales |
| CA-012 | Sidebar actualizado | Nuevos enlaces visibles y funcionales |

---

## 📅 CRONOGRAMA ESTIMADO

| Semana | Fase | Módulos | Días |
|--------|------|---------|------|
| 1 | Fase 1 | DocumentTypes + Tramos | 3-4 días |
| 2 | Fase 2 | Document Automation | 2-3 días |
| 2-3 | Fase 3 | Payment Block | 2-3 días |
| 3 | Fase 4 | Sanctions Automation | 2 días |
| 4 | Fase 5 | Trip Reports | 2 días |
| 4 | Fase 6 | Dashboard Sprint5 | 1-2 días |
| **Total** | | | **12-16 días** |

---

## 🚀 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

```
1. DocumentTypes (CRUD básico, sin dependencias)
   ↓
2. Tramos (CRUD básico, sin dependencias)
   ↓
3. DocumentAutomation (Depende de DocumentTypes)
   ↓
4. PaymentBlock (Depende de Documents)
   ↓
5. Sanctions Automation (Depende de PaymentBlock)
   ↓
6. TripReports (Puede implementarse en paralelo desde Fase 3)
   ↓
7. Dashboard Sprint5 (Integra todo)
```

---

## 🔒 PERMISOS NECESARIOS

| Módulo | Permiso | Descripción |
|--------|---------|-------------|
| DocumentTypes | `documentos:tipos:*` | CRUD completo |
| Tramos | `rutas:tramos:*` | CRUD completo |
| DocumentAutomation | `documentos:automatizacion:*` | Ver, ejecutar |
| PaymentBlock | `pagos:bloqueo:*` | Ver, bloquear, desbloquear |
| TripReports | `reportes:viajes:*` | Ver, generar, exportar |
| Sanctions | `sanciones:automatizacion:*` | Ver, generar |

---

## 📝 NOTAS FINALES

### Consideraciones Técnicas
1. **Paginación**: Todos los endpoints usan paginación estándar
2. **Soft Delete**: Las eliminaciones son lógicas (isActive = false)
3. **Auditoría**: Registrar usuario y fecha en operaciones críticas
4. **Cache**: Usar React Query con staleTime apropiado
5. **Errores**: Manejar errores 400, 401, 403, 404, 409 apropiadamente

### Consideraciones UX
1. **Feedback Visual**: Siempre mostrar estado de operaciones
2. **Confirmaciones**: Acciones destructivas requieren confirmación
3. **Tooltips**: Explicar campos complejos
4. **Loading States**: Indicadores de carga en operaciones asíncronas
5. **Responsive**: Diseño adaptable a móvil y desktop

---

**Documento preparado para:** Equipo de Desarrollo Frontend
**Versión:** 1.0
**Última actualización:** 2026-04-05
