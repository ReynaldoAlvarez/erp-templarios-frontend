# ERP TEMPLARIOS - Frontend PWA

Sistema de Gestión ERP para **TEMPLARIOS S.R.L.** - Empresa boliviana de transporte de carga y gestión de importaciones.

## 📋 Descripción

Frontend PWA desarrollado con Next.js 16, TypeScript, Tailwind CSS 4 y shadcn/ui. Este proyecto consume los ~285 endpoints del backend API disponible en el repositorio [erp-templarios](https://github.com/ReynaldoAlvarez/erp-templarios).

## 🚀 Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Next.js | 16.x | Framework React con App Router |
| React | 19.x | Librería de UI |
| TypeScript | 5.x | Tipado estático |
| Tailwind CSS | 4.x | Estilos utilitarios |
| shadcn/ui | Latest | Componentes UI |
| Zustand | 5.x | Estado global |
| TanStack Query | 5.x | Estado servidor |
| React Hook Form | 7.x | Manejo de formularios |
| Zod | 4.x | Validación de esquemas |
| Axios | 1.x | Cliente HTTP |
| Recharts | 2.x | Gráficos |

## 🎨 Sistema de Diseño

### Color Corporativo
- **Primary**: `#1B3F66` (Azul oscuro corporativo)
- **Primary Light**: `#2B5F8F`
- **Primary Dark**: `#0F2A47`

### Tipografía
- Fuente principal: Inter
- Body: 14px Regular
- H1: 32px Bold
- H2: 24px Bold
- H3: 18px Semibold

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── (auth)/              # Rutas protegidas
│   │   ├── dashboard/       # Dashboard principal
│   │   └── layout.tsx       # Layout con sidebar
│   ├── (public)/            # Rutas públicas
│   │   ├── login/           # Página de login
│   │   └── layout.tsx       # Layout público
│   ├── api/
│   │   └── v1/[...path]/    # Proxy al backend
│   ├── globals.css          # Estilos globales
│   ├── layout.tsx           # Layout raíz
│   └── page.tsx             # Página inicial
├── components/
│   ├── layout/              # Sidebar, Header
│   ├── modules/             # Componentes por módulo
│   └── ui/                  # shadcn/ui components
├── hooks/
│   ├── use-auth.ts          # Hook de autenticación
│   └── use-toast.ts         # Hook de notificaciones
├── lib/
│   ├── api-client.ts        # Cliente Axios
│   ├── cookies.ts           # Manejo de cookies
│   └── utils.ts             # Utilidades
├── store/
│   └── auth-store.ts        # Estado de autenticación
└── types/
    └── api.ts               # Tipos TypeScript
```

## 🗓️ Plan de Sprints

| Sprint | Módulo | Estado |
|--------|--------|--------|
| 1 | Setup + Login + Layout | ✅ Completado |
| 2 | Dashboard + IAM UI | 📅 Pendiente |
| 3 | Clientes + BLs | 📅 Pendiente |
| 4 | Viajes | 📅 Pendiente |
| 5 | Flota | 📅 Pendiente |
| 6 | Finanzas | 📅 Pendiente |
| 7 | Reportes | 📅 Pendiente |
| 8 | PWA + Offline | 📅 Pendiente |
| 9 | Testing + Optimización | 📅 Pendiente |
| 10 | Deploy + Documentación | 📅 Pendiente |

## 🔗 Backend API

El backend está disponible en:
- **Repositorio**: https://github.com/ReynaldoAlvarez/erp-templarios
- **Desarrollo**: http://localhost:3001/api/v1
- **Endpoints**: ~285 endpoints disponibles

### Credenciales de Prueba
```
Email: admin@templarios.com
Password: Admin123!
```

## 📦 Módulos del Sistema

### IAM (Identity and Access Management)
- Usuarios
- Roles
- Permisos

### Operaciones
- Clientes
- Bill of Lading (BLs)
- Viajes
- Cruces de Frontera
- Documentos

### Flota
- Camiones
- Remolques
- Conductores
- Gastos

### Finanzas
- Liquidaciones
- Facturas
- Pagos y Anticipos
- Flujo de Caja
- Activos
- Pasivos

### Reportes
- Dashboard
- Reportes operativos
- Notificaciones

## 🛠️ Instalación

```bash
# Clonar repositorio
git clone https://github.com/ReynaldoAlvarez/erp-templarios-frontend.git
cd erp-templarios-frontend

# Instalar dependencias
bun install

# Configurar variables de entorno
cp .env.example .env.local

# Iniciar desarrollo
bun run dev
```

## 📄 Variables de Entorno

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# App Configuration
NEXT_PUBLIC_APP_NAME=ERP TEMPLARIOS S.R.L.
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 👨‍💻 Desarrollo

```bash
# Iniciar servidor de desarrollo
bun run dev

# Verificar linting
bun run lint

# Construir para producción
bun run build
```

## 📚 Documentación

- [Documento de Diseño Detallado](docs/DOCUMENTO_DISENO_DETALLADO_ERP_TEMPLARIOS.pdf)
- [Documento de Diseño Frontend](docs/DOCUMENTO_DISENO_FRONTEND_ERP_TEMPLARIOS.pdf)

## 📝 Licencia

Propiedad de TEMPLARIOS S.R.L. - Todos los derechos reservados.

---

Desarrollado con ❤️ para TEMPLARIOS S.R.L.
