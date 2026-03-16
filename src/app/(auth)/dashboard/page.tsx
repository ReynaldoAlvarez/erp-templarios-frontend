'use client';

import {
  Truck,
  Users,
  TrendingUp,
  Route,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/use-auth';

// KPI Card Component
interface KPICardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function KPICard({ title, value, description, icon: Icon, trend }: KPICardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className="h-8 w-8 rounded-lg bg-[#1B3F66]/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-[#1B3F66]" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <span
              className={`text-xs font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          )}
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Mock data for recent trips
const recentTrips = [
  {
    id: 'TRK-001',
    origin: 'La Paz',
    destination: 'Santa Cruz',
    driver: 'Juan Pérez',
    vehicle: 'ABC-123',
    status: 'in_progress',
    date: '2024-01-15',
  },
  {
    id: 'TRK-002',
    origin: 'Cochabamba',
    destination: 'La Paz',
    driver: 'María García',
    vehicle: 'XYZ-789',
    status: 'completed',
    date: '2024-01-14',
  },
  {
    id: 'TRK-003',
    origin: 'Santa Cruz',
    destination: 'Cochabamba',
    driver: 'Carlos López',
    vehicle: 'DEF-456',
    status: 'pending',
    date: '2024-01-16',
  },
  {
    id: 'TRK-004',
    origin: 'La Paz',
    destination: 'Oruro',
    driver: 'Ana Martínez',
    vehicle: 'GHI-321',
    status: 'in_progress',
    date: '2024-01-15',
  },
  {
    id: 'TRK-005',
    origin: 'Potosí',
    destination: 'La Paz',
    driver: 'Roberto Sánchez',
    vehicle: 'JKL-654',
    status: 'completed',
    date: '2024-01-13',
  },
];

const statusConfig = {
  pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
  in_progress: { label: 'En Curso', className: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Completado', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
};

export default function DashboardPage() {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {getGreeting()}, {user?.firstName || 'Usuario'}
          </h1>
          <p className="text-gray-500 mt-1">
            Bienvenido al panel de control de ERP TEMPLARIOS
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-[#1B3F66] border-[#1B3F66]">
            Exportar
          </Button>
          <Button className="bg-[#1B3F66] hover:bg-[#1B3F66]/90">
            Nuevo Viaje
          </Button>
        </div>
      </div>

      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-[#1B3F66] to-[#2a5a8f] text-white">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Resumen Operativo</h2>
              <p className="text-white/80 mt-1">
                Tienes 12 viajes activos y 3 pendientes de asignación
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" size="sm">
                Ver Detalles
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Viajes Activos"
          value="12"
          description="vs. mes anterior"
          icon={Route}
          trend={{ value: 8, isPositive: true }}
        />
        <KPICard
          title="Flota Disponible"
          value="8 / 15"
          description="vehículos activos"
          icon={Truck}
          trend={{ value: 5, isPositive: true }}
        />
        <KPICard
          title="Clientes Activos"
          value="24"
          description="este mes"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <KPICard
          title="Ingresos Mensuales"
          value="Bs. 125,400"
          description="vs. mes anterior"
          icon={TrendingUp}
          trend={{ value: 15, isPositive: true }}
        />
      </div>

      {/* Recent Trips Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Últimos Viajes</CardTitle>
              <CardDescription>
                Lista de los viajes más recientes en el sistema
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="text-[#1B3F66]">
              Ver Todos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID Viaje</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Conductor</TableHead>
                  <TableHead>Vehículo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTrips.map((trip) => (
                  <TableRow key={trip.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-[#1B3F66]">
                      {trip.id}
                    </TableCell>
                    <TableCell>{trip.origin}</TableCell>
                    <TableCell>{trip.destination}</TableCell>
                    <TableCell>{trip.driver}</TableCell>
                    <TableCell>{trip.vehicle}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          statusConfig[trip.status as keyof typeof statusConfig]
                            ?.className
                        }
                      >
                        {
                          statusConfig[trip.status as keyof typeof statusConfig]
                            ?.label
                        }
                      </Badge>
                    </TableCell>
                    <TableCell>{trip.date}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
