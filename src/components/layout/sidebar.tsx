'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  Route,
  Truck,
  Package,
  UserCircle,
  ClipboardList,
  Receipt,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Shield,
  Building2,
  MapPin,
  Settings,
  ChevronDown,
  ChevronRight,
  Anchor,
  Calculator,
  Navigation,
  Flag,
  FileCheck,
  Building,
  CreditCard,
  Wrench,
  AlertTriangle,
  History,
  DollarSign,
  Bell,
  FileSpreadsheet,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useAuth } from '@/hooks/use-auth';

interface NavItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavItem[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  {
    title: 'Principal',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Operaciones',
    items: [
      {
        title: 'Viajes',
        href: '/dashboard/viajes',
        icon: Route,
      },
      {
        title: 'Fronteras',
        href: '/dashboard/fronteras',
        icon: Flag,
      },
      {
        title: 'Rutas',
        href: '/dashboard/rutas',
        icon: Navigation,
      },
      {
        title: 'Documentos',
        href: '/dashboard/documentos',
        icon: FileCheck,
      },
      {
        title: 'Tipos de Documento',
        href: '/dashboard/documentos-tipos',
        icon: FileText,
      },
      {
        title: 'Tramos',
        href: '/dashboard/tramos',
        icon: Route,
      },
      {
        title: 'Clientes',
        href: '/dashboard/clientes',
        icon: Users,
      },
      {
        title: 'Bill of Lading',
        href: '/dashboard/bls',
        icon: Anchor,
      },
    ],
  },
  {
    title: 'Flota',
    items: [
      {
        title: 'Camiones',
        href: '/dashboard/flota/camiones',
        icon: Truck,
      },
      {
        title: 'Remolques',
        href: '/dashboard/flota/remolques',
        icon: Truck,
      },
      {
        title: 'Conductores',
        href: '/dashboard/conductores',
        icon: UserCircle,
      },
      {
        title: 'Checklist',
        href: '/dashboard/checklist',
        icon: ClipboardList,
      },
      {
        title: 'Geolocalización',
        href: '/dashboard/geolocalizacion',
        icon: MapPin,
      },
    ],
  },
  {
    title: 'Finanzas',
    items: [
      {
        title: 'Gastos',
        href: '/dashboard/gastos',
        icon: TrendingDown,
      },
      {
        title: 'Liquidaciones',
        href: '/dashboard/liquidaciones',
        icon: Calculator,
      },
      {
        title: 'Facturación',
        href: '/dashboard/facturas',
        icon: Receipt,
      },
      {
        title: 'Flujo de Caja',
        href: '/dashboard/flujo-caja',
        icon: DollarSign,
      },
      {
        title: 'Pagos',
        href: '/dashboard/pagos',
        icon: CreditCard,
      },
      {
        title: 'SIN Export',
        href: '/dashboard/sin-export',
        icon: FileSpreadsheet,
      },
    ],
  },
  {
    title: 'Contabilidad',
    items: [
      {
        title: 'Activos',
        href: '/dashboard/activos',
        icon: Building,
      },
      {
        title: 'Pasivos',
        href: '/dashboard/pasivos',
        icon: CreditCard,
      },
    ],
  },
  {
    title: 'Mantenimiento',
    items: [
      {
        title: 'Mantenimientos',
        href: '/dashboard/mantenimientos',
        icon: Wrench,
      },
      {
        title: 'Sanciones',
        href: '/dashboard/sanciones',
        icon: AlertTriangle,
      },
      {
        title: 'Historial Conductores',
        href: '/dashboard/historial',
        icon: History,
      },
    ],
  },
  {
    title: 'Reportes',
    items: [
      {
        title: 'Reportes',
        href: '/dashboard/reportes',
        icon: BarChart3,
      },
    ],
  },
  {
    title: 'Administración',
    items: [
      {
        title: 'IAM',
        icon: Shield,
        children: [
          { title: 'Usuarios', href: '/dashboard/iam/usuarios' },
          { title: 'Roles', href: '/dashboard/iam/roles' },
          { title: 'Permisos', href: '/dashboard/iam/permisos' },
        ],
      },
      {
        title: 'Notificaciones',
        href: '/dashboard/notificaciones',
        icon: Bell,
      },
      {
        title: 'Empresa',
        href: '/dashboard/empresa',
        icon: Building2,
      },
      {
        title: 'Configuración',
        href: '/dashboard/configuracion',
        icon: Settings,
      },
    ],
  },
];

function NavItemWithChildren({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const { state } = useSidebar();
  // Check if current path matches this item or any of its children
  const isActive = item.href === pathname || 
    (item.children?.some(child => child.href === pathname));
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren && item.children) {
    return (
      <Collapsible defaultOpen={isActive} className="group/collapsible">
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={item.title}>
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
              <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.children.map((child) => (
                <SidebarMenuSubItem key={child.title}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={child.href === pathname}
                  >
                    <Link href={child.href || '#'}>
                      <span>{child.title}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.title}
        className={`${
          isActive
            ? 'bg-[#1B3F66] text-white hover:bg-[#1B3F66]/90 hover:text-white'
            : ''
        }`}
      >
        <Link href={item.href || '#'}>
          <item.icon className="h-4 w-4" />
          <span>{item.title}</span>
          {item.badge && (
            <span className="ml-auto bg-[#1B3F66]/10 text-[#1B3F66] text-xs font-medium px-2 py-0.5 rounded-full">
              {item.badge}
            </span>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const { user } = useAuth();

  return (
    <Sidebar className="border-r border-gray-200">
      {/* Header */}
      <SidebarHeader className="border-b border-gray-200 p-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="bg-[#1B3F66] p-2 rounded-xl">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-[#1B3F66]">TEMPLARIOS</span>
            <span className="text-xs text-gray-500">ERP S.R.L.</span>
          </div>
        </Link>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-2 py-4">
        {navigation.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-1">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <NavItemWithChildren key={item.title} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-[#1B3F66] flex items-center justify-center text-white text-sm font-medium">
              {user?.firstName?.[0] || 'U'}
              {user?.lastName?.[0] || ''}
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="text-xs text-gray-500 truncate">
              {user?.email}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
