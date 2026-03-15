from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# Registrar fuentes
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')

# Crear documento
doc = SimpleDocTemplate(
    "/home/z/my-project/docs/DOCUMENTO_DISENO_FRONTEND_ERP_TEMPLARIOS.pdf",
    pagesize=A4,
    title="DOCUMENTO_DISENO_FRONTEND_ERP_TEMPLARIOS",
    author="Z.ai",
    creator="Z.ai",
    subject="Documento de Diseño Frontend para ERP TEMPLARIOS S.R.L."
)

# Estilos
styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    'TitleStyle',
    parent=styles['Title'],
    fontName='Times New Roman',
    fontSize=28,
    spaceAfter=30,
    alignment=TA_CENTER
)

h1_style = ParagraphStyle(
    'H1Style',
    parent=styles['Heading1'],
    fontName='Times New Roman',
    fontSize=18,
    spaceBefore=20,
    spaceAfter=12,
    textColor=colors.HexColor('#1B3F66')
)

h2_style = ParagraphStyle(
    'H2Style',
    parent=styles['Heading2'],
    fontName='Times New Roman',
    fontSize=14,
    spaceBefore=15,
    spaceAfter=8,
    textColor=colors.HexColor('#1B3F66')
)

body_style = ParagraphStyle(
    'BodyStyle',
    parent=styles['Normal'],
    fontName='Times New Roman',
    fontSize=11,
    leading=16,
    alignment=TA_JUSTIFY,
    spaceAfter=8
)

story = []

# Portada
story.append(Spacer(1, 3*cm))
story.append(Paragraph("DOCUMENTO DE DISEÑO FRONTEND", title_style))
story.append(Spacer(1, 0.5*cm))
story.append(Paragraph("ERP TEMPLARIOS S.R.L.", ParagraphStyle('SubTitle', parent=styles['Title'], fontName='Times New Roman', fontSize=20, textColor=colors.HexColor('#1B3F66'))))
story.append(Spacer(1, 1*cm))
story.append(Paragraph("Sistema de Gestión de Importaciones y Logística", body_style))
story.append(Paragraph("Frontend PWA con Next.js 16 + TypeScript + Tailwind CSS 4", body_style))
story.append(Spacer(1, 3*cm))
story.append(Paragraph("Versión 1.0 - Sprint 1", body_style))
story.append(Paragraph("Fecha: Marzo 2026", body_style))
story.append(PageBreak())

# 1. Introducción
story.append(Paragraph("1. INTRODUCCIÓN", h1_style))
story.append(Paragraph("""
Este documento describe la arquitectura, diseño y plan de implementación del frontend PWA para el sistema ERP de TEMPLARIOS S.R.L., 
una empresa boliviana dedicada al transporte de carga y gestión de importaciones. El frontend consumirá los ~285 endpoints 
disponibles en el backend API desarrollado previamente.
""", body_style))

story.append(Paragraph("1.1 Objetivos", h2_style))
story.append(Paragraph("""
- Desarrollar una interfaz de usuario moderna, responsive y profesional que refleje la identidad corporativa de TEMPLARIOS S.R.L.
- Implementar una Progressive Web App (PWA) con funcionalidad offline para uso en campo.
- Integrar completamente con el backend API existente en el repositorio erp-templarios.
- Seguir las mejores prácticas de desarrollo frontend con Next.js 16, TypeScript y Tailwind CSS 4.
- Garantizar accesibilidad, rendimiento y experiencia de usuario óptima.
""", body_style))

# 2. Stack Tecnológico
story.append(Paragraph("2. STACK TECNOLÓGICO", h1_style))

tech_data = [
    [Paragraph('<b>Tecnología</b>', body_style), Paragraph('<b>Versión</b>', body_style), Paragraph('<b>Propósito</b>', body_style)],
    ['Next.js', '16.x', 'Framework React con App Router'],
    ['React', '19.x', 'Librería de UI'],
    ['TypeScript', '5.x', 'Tipado estático'],
    ['Tailwind CSS', '4.x', 'Estilos utilitarios'],
    ['shadcn/ui', 'Latest', 'Componentes UI'],
    ['Zustand', '5.x', 'Estado global'],
    ['TanStack Query', '5.x', 'Estado servidor'],
    ['React Hook Form', '7.x', 'Manejo de formularios'],
    ['Zod', '4.x', 'Validación de esquemas'],
    ['Axios', '1.x', 'Cliente HTTP'],
    ['Recharts', '2.x', 'Gráficos'],
    ['next-pwa', 'Latest', 'PWA Support'],
]

tech_table = Table(tech_data, colWidths=[4*cm, 3*cm, 8*cm])
tech_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1B3F66')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('FONTNAME', (0, 0), (-1, -1), 'Times New Roman'),
    ('FONTSIZE', (0, 0), (-1, -1), 10),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')]),
]))
story.append(tech_table)
story.append(Spacer(1, 0.5*cm))

# 3. Sistema de Diseño
story.append(Paragraph("3. SISTEMA DE DISEÑO", h1_style))

story.append(Paragraph("3.1 Paleta de Colores", h2_style))
story.append(Paragraph("""
La paleta de colores se basa en el color corporativo de TEMPLARIOS S.R.L.: <b>#1B3F66</b> (Azul oscuro corporativo).
Este color primario se complementa con una escala de grises neutros y colores semánticos para estados y acciones.
""", body_style))

color_data = [
    [Paragraph('<b>Nombre</b>', body_style), Paragraph('<b>Valor</b>', body_style), Paragraph('<b>Uso</b>', body_style)],
    ['Primary', '#1B3F66', 'Botones principales, enlaces activos, headers'],
    ['Primary Light', '#2B5F8F', 'Hover states, elementos secundarios'],
    ['Primary Dark', '#0F2A47', 'Texto importante, bordes destacados'],
    ['Background', '#FFFFFF', 'Fondo principal'],
    ['Foreground', '#1A1A1A', 'Texto principal'],
    ['Muted', '#6B7280', 'Texto secundario, placeholders'],
    ['Success', '#10B981', 'Estados exitosos, confirmaciones'],
    ['Warning', '#F59E0B', 'Advertencias, pendientes'],
    ['Destructive', '#EF4444', 'Errores, eliminaciones'],
]

color_table = Table(color_data, colWidths=[4*cm, 3*cm, 8*cm])
color_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1B3F66')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('FONTNAME', (0, 0), (-1, -1), 'Times New Roman'),
    ('FONTSIZE', (0, 0), (-1, -1), 10),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')]),
]))
story.append(color_table)
story.append(Spacer(1, 0.5*cm))

story.append(Paragraph("3.2 Tipografía", h2_style))
story.append(Paragraph("""
Se utiliza la familia tipográfica <b>Inter</b> para todo el sistema, con las siguientes variantes:
- H1: 32px Bold - Títulos principales de página
- H2: 24px Bold - Títulos de sección
- H3: 18px Semibold - Subtítulos
- Body: 14px Regular - Texto general
- Small: 12px Regular - Texto auxiliar, labels
""", body_style))

# 4. Arquitectura de Pantallas
story.append(Paragraph("4. ARQUITECTURA DE PANTALLAS", h1_style))

story.append(Paragraph("4.1 Estructura de Rutas", h2_style))

routes_data = [
    [Paragraph('<b>Ruta</b>', body_style), Paragraph('<b>Pantalla</b>', body_style), Paragraph('<b>Módulo</b>', body_style)],
    ['/login', 'Login', 'Auth'],
    ['/dashboard', 'Dashboard Principal', 'Dashboard'],
    ['/usuarios', 'Gestión Usuarios', 'IAM'],
    ['/roles', 'Gestión Roles', 'IAM'],
    ['/clientes', 'Gestión Clientes', 'Operaciones'],
    ['/bls', 'Bill of Lading', 'Operaciones'],
    ['/viajes', 'Gestión Viajes', 'Operaciones'],
    ['/camiones', 'Gestión Camiones', 'Flota'],
    ['/remolques', 'Gestión Remolques', 'Flota'],
    ['/conductores', 'Gestión Conductores', 'Flota'],
    ['/liquidaciones', 'Liquidaciones', 'Finanzas'],
    ['/facturas', 'Facturas', 'Finanzas'],
    ['/pagos', 'Pagos y Anticipos', 'Finanzas'],
    ['/reportes', 'Reportes', 'Reportes'],
]

routes_table = Table(routes_data, colWidths=[3*cm, 5*cm, 4*cm])
routes_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1B3F66')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('FONTNAME', (0, 0), (-1, -1), 'Times New Roman'),
    ('FONTSIZE', (0, 0), (-1, -1), 10),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')]),
]))
story.append(routes_table)
story.append(PageBreak())

# 5. Plan de Sprints
story.append(Paragraph("5. PLAN DE SPRINTS FRONTEND", h1_style))

sprints_data = [
    [Paragraph('<b>Sprint</b>', body_style), Paragraph('<b>Módulos</b>', body_style), Paragraph('<b>Entregables</b>', body_style), Paragraph('<b>Semanas</b>', body_style)],
    ['1', 'Setup + Auth + Layout', 'Proyecto, Login, Sidebar, Header', '1'],
    ['2', 'Dashboard + IAM', 'Dashboard, Usuarios, Roles, Permisos', '1'],
    ['3', 'Clientes + BLs', 'CRUD Clientes, Bill of Lading', '1'],
    ['4', 'Viajes', 'Programación, Fronteras, Documentos', '1'],
    ['5', 'Flota', 'Camiones, Remolques, Conductores', '1'],
    ['6', 'Finanzas', 'Liquidaciones, Facturas, Pagos', '1'],
    ['7', 'Reportes', 'Gráficos, Exportación PDF/Excel', '1'],
    ['8', 'PWA + Offline', 'Service Workers, IndexedDB', '1'],
    ['9', 'Testing', 'Pruebas E2E, Optimización', '1'],
    ['10', 'Deploy', 'Producción, Documentación', '1'],
]

sprints_table = Table(sprints_data, colWidths=[2*cm, 4*cm, 6*cm, 2*cm])
sprints_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1B3F66')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('ALIGN', (2, 0), (2, -1), 'LEFT'),
    ('FONTNAME', (0, 0), (-1, -1), 'Times New Roman'),
    ('FONTSIZE', (0, 0), (-1, -1), 10),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')]),
]))
story.append(sprints_table)
story.append(Spacer(1, 0.5*cm))

# 6. Sprint 1 Detallado
story.append(Paragraph("6. SPRINT 1 - DETALLE DE IMPLEMENTACIÓN", h1_style))

story.append(Paragraph("6.1 Configuración del Proyecto", h2_style))
story.append(Paragraph("""
- Crear proyecto Next.js 16 con TypeScript
- Configurar Tailwind CSS 4 con tema personalizado
- Instalar y configurar shadcn/ui (estilo New York)
- Configurar ESLint y Prettier
- Crear estructura de carpetas profesional
""", body_style))

story.append(Paragraph("6.2 Autenticación", h2_style))
story.append(Paragraph("""
- Implementar página de Login con validación Zod
- Integrar con endpoint POST /api/v1/auth/login
- Manejo de JWT (Access Token 15min, Refresh Token 7 días)
- Almacenamiento de tokens en cookies para middleware
- Redirección automática según estado de autenticación
""", body_style))

story.append(Paragraph("6.3 Layout Base", h2_style))
story.append(Paragraph("""
- Sidebar colapsable con navegación por módulos
- Header con menú de usuario, notificaciones y estado de conexión
- Layout responsivo para móvil, tablet y desktop
- Indicador de estado online/offline
""", body_style))

# 7. Integración con Backend
story.append(Paragraph("7. INTEGRACIÓN CON BACKEND", h1_style))

story.append(Paragraph("7.1 Configuración del API Client", h2_style))
story.append(Paragraph("""
El frontend se conectará al backend API disponible en:
- <b>Desarrollo:</b> http://localhost:3001/api/v1
- <b>Producción:</b> https://api.templarios.com/api/v1

El cliente Axios incluirá interceptores para:
- Adjuntar automáticamente el Bearer token a cada request
- Manejar refresh automático de tokens expirados
- Redirigir al login en caso de error 401
""", body_style))

story.append(Paragraph("7.2 Endpoints Principales a Consumir", h2_style))

endpoints_data = [
    [Paragraph('<b>Módulo</b>', body_style), Paragraph('<b>Endpoints</b>', body_style), Paragraph('<b>Sprint</b>', body_style)],
    ['Auth', '5 endpoints (login, logout, refresh, me, change-password)', '1'],
    ['Users', '8 endpoints (CRUD, roles, permisos)', '2'],
    ['Clients', '7 endpoints (CRUD, crédito, búsqueda)', '3'],
    ['BLs', '9 endpoints (CRUD, progreso, importar)', '3'],
    ['Trips', '12 endpoints (CRUD, estados, estadísticas)', '4'],
    ['Fleet', '15 endpoints (camiones, remolques)', '5'],
    ['Drivers', '8 endpoints (CRUD, disponibilidad)', '5'],
    ['Finance', '30+ endpoints (liquidaciones, facturas, pagos)', '6'],
]

endpoints_table = Table(endpoints_data, colWidths=[3*cm, 10*cm, 2*cm])
endpoints_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1B3F66')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('FONTNAME', (0, 0), (-1, -1), 'Times New Roman'),
    ('FONTSIZE', (0, 0), (-1, -1), 10),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')]),
]))
story.append(endpoints_table)

# Build document
doc.build(story)
print("PDF generado exitosamente")
