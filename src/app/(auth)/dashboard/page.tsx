'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Truck,
  Users,
  TrendingUp,
  Route,
  MoreHorizontal,
  Eye,
  Package,
  Clock,
  AlertTriangle,
  CalendarDays,
  FileText,
  Calculator,
  Receipt,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useMainDashboard, useFinancialDashboard, useOperationalDashboard } from '@/hooks/use-queries';
import { useQueryClient } from '@tanstack/react-query';
import { TripStatus } from '@/types/api';

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
  isLoading?: boolean;
}

function KPICard({ title, value, description, icon: Icon, trend, isLoading }: KPICardProps) {
  if (isLoading) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
          <div className="h-8 w-8 rounded-lg bg-[#1B3F66]/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-[#1B3F66]" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

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

// Status Badge Configuration
const statusConfig: Record<string, { label: string; className: string }> = {
  SCHEDULED: { label: 'Programado', className: 'bg-yellow-100 text-yellow-800' },
  IN_TRANSIT: { label: 'En Tránsito', className: 'bg-blue-100 text-blue-800' },
  AT_BORDER: { label: 'En Frontera', className: 'bg-orange-100 text-orange-800' },
  DELIVERED: { label: 'Entregado', className: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
};

// Date Range Options
const dateRangeOptions = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Esta Semana' },
  { value: 'month', label: 'Este Mes' },
  { value: 'quarter', label: 'Este Trimestre' },
  { value: 'year', label: 'Este Año' },
];

function getDateRange(range: string): { startDate: string; endDate: string } {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (range) {
    case 'today':
      return {
        startDate: startOfDay.toISOString(),
        endDate: now.toISOString(),
      };
    case 'week': {
      const weekStart = new Date(startOfDay);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return {
        startDate: weekStart.toISOString(),
        endDate: now.toISOString(),
      };
    }
    case 'month': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        startDate: monthStart.toISOString(),
        endDate: now.toISOString(),
      };
    }
    case 'quarter': {
      const quarter = Math.floor(now.getMonth() / 3);
      const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
      return {
        startDate: quarterStart.toISOString(),
        endDate: now.toISOString(),
      };
    }
    case 'year': {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      return {
        startDate: yearStart.toISOString(),
        endDate: now.toISOString(),
      };
    }
    default:
      return {
        startDate: startOfDay.toISOString(),
        endDate: now.toISOString(),
      };
  }
}

export default function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState('month');
  
  const params = getDateRange(dateRange);
  
  const { data: mainData, isLoading: isLoadingMain, refetch: refetchMain } = useMainDashboard(params);
  const { data: financialData, isLoading: isLoadingFinancial } = useFinancialDashboard(params);
  const { data: operationalData, isLoading: isLoadingOperational } = useOperationalDashboard(params);

  const isLoading = isLoadingMain || isLoadingFinancial || isLoadingOperational;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  // Calculate status counts for display
  const tripsByStatus = mainData?.tripsByStatus || {
    scheduled: 0,
    inTransit: 0,
    atBorder: 0,
    delivered: 0,
    cancelled: 0,
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
        <div className="flex gap-2 items-center">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <CalendarDays className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Seleccionar rango" />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            className="text-[#1B3F66] border-[#1B3F66]"
          >
            <RefreshCw className="h-4 w-4" />
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
                {isLoading ? (
                  <span>Cargando estadísticas...</span>
                ) : (
                  <>
                    Tienes {mainData?.overview?.totalTrips || 0} viajes totales y{' '}
                    {(mainData?.pending?.documents || 0) + (mainData?.pending?.settlements || 0) + (mainData?.pending?.invoices || 0)} elementos pendientes
                  </>
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard/viajes">
                <Button variant="secondary" size="sm">
                  Ver Viajes
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Viajes"
          value={mainData?.overview?.totalTrips || 0}
          description="en el período"
          icon={Route}
          isLoading={isLoadingMain}
        />
        <KPICard
          title="Peso Transportado"
          value={`${(mainData?.overview?.totalWeight || 0).toLocaleString('es-BO', { maximumFractionDigits: 1 })} tn`}
          description="toneladas"
          icon={Package}
          isLoading={isLoadingMain}
        />
        <KPICard
          title="Conductores Activos"
          value={mainData?.overview?.activeDrivers || 0}
          description="en operaciones"
          icon={Users}
          isLoading={isLoadingMain}
        />
        <KPICard
          title="Camiones Activos"
          value={mainData?.overview?.activeTrucks || 0}
          description="en servicio"
          icon={Truck}
          isLoading={isLoadingMain}
        />
      </div>

      {/* Status Cards Row */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{tripsByStatus.scheduled}</div>
            <div className="text-xs text-gray-500">Programados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{tripsByStatus.inTransit}</div>
            <div className="text-xs text-gray-500">En Tránsito</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{tripsByStatus.atBorder}</div>
            <div className="text-xs text-gray-500">En Frontera</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{tripsByStatus.delivered}</div>
            <div className="text-xs text-gray-500">Entregados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{tripsByStatus.cancelled}</div>
            <div className="text-xs text-gray-500">Cancelados</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Items & Financial Summary */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Pending Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Elementos Pendientes
            </CardTitle>
            <CardDescription>
              Elementos que requieren atención
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Link href="/dashboard/documentos?status=PENDING" className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium">Documentos Pendientes</span>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">
                  {mainData?.pending?.documents || 0}
                </Badge>
              </Link>
              <Link href="/dashboard/liquidaciones?status=PENDING" className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Liquidaciones Pendientes</span>
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  {mainData?.pending?.settlements || 0}
                </Badge>
              </Link>
              <Link href="/dashboard/facturas?status=PENDING" className="flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Receipt className="h-5 w-5 text-purple-600" />
                  <span className="font-medium">Facturas Pendientes</span>
                </div>
                <Badge className="bg-purple-100 text-purple-800">
                  {mainData?.pending?.invoices || 0}
                </Badge>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Resumen Financiero
            </CardTitle>
            <CardDescription>
              Resumen del período seleccionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingFinancial ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Receipt className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium">Facturación Total</div>
                      <div className="text-xs text-gray-500">{financialData?.invoices?.count || 0} facturas</div>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-green-700">
                    USD {(financialData?.invoices?.totalAmount || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calculator className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium">Pago Neto Conductores</div>
                      <div className="text-xs text-gray-500">{financialData?.settlements?.count || 0} liquidaciones</div>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-blue-700">
                    Bs {(financialData?.settlements?.totalNetPayment || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-red-600 rotate-180" />
                    <div>
                      <div className="font-medium">Gastos Totales</div>
                      <div className="text-xs text-gray-500">{financialData?.expenses?.count || 0} registros</div>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-red-700">
                    Bs {(financialData?.expenses?.total || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Border Crossings */}
      {operationalData?.borders?.activeCrossings && operationalData.borders.activeCrossings.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Fronteras Activas</CardTitle>
                <CardDescription>
                  Viajes actualmente esperando en frontera
                </CardDescription>
              </div>
              <Link href="/dashboard/fronteras">
                <Button variant="outline" size="sm" className="text-[#1B3F66]">
                  Ver Todas
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {operationalData.borders.activeCrossings.slice(0, 5).map((crossing) => (
                <div key={crossing.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-medium">{crossing.borderName}</div>
                      <div className="text-sm text-gray-500">
                        {crossing.trip.micDta} - {crossing.trip.client}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{crossing.trip.driver}</div>
                    <div className="text-xs text-gray-500">{crossing.trip.truck}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
            <Link href="/dashboard/viajes">
              <Button variant="outline" size="sm" className="text-[#1B3F66]">
                Ver Todos
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingMain ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">MIC/DTA</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Conductor</TableHead>
                    <TableHead>Vehículo</TableHead>
                    <TableHead>Peso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mainData?.recentTrips && mainData.recentTrips.length > 0 ? (
                    mainData.recentTrips.map((trip) => (
                      <TableRow key={trip.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-[#1B3F66]">
                          {trip.micDta}
                        </TableCell>
                        <TableCell>{trip.client}</TableCell>
                        <TableCell>{trip.driver}</TableCell>
                        <TableCell>{trip.truck}</TableCell>
                        <TableCell>{trip.weight} tn</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              statusConfig[trip.status as keyof typeof statusConfig]?.className ||
                              'bg-gray-100 text-gray-800'
                            }
                          >
                            {statusConfig[trip.status as keyof typeof statusConfig]?.label || trip.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {trip.departureDate
                            ? format(new Date(trip.departureDate), 'dd/MM/yyyy', { locale: es })
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/viajes?id=${trip.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Detalles
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        No hay viajes recientes
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Drivers & Trucks */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Top Drivers */}
        <Card>
          <CardHeader>
            <CardTitle>Mejores Conductores</CardTitle>
            <CardDescription>Conductores con más viajes completados</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingOperational ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : operationalData?.topDrivers && operationalData.topDrivers.length > 0 ? (
              <div className="space-y-3">
                {operationalData.topDrivers.slice(0, 5).map((driver, index) => (
                  <div key={driver.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#1B3F66] flex items-center justify-center text-white text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{driver.name}</div>
                        <div className="text-xs text-gray-500">{driver.totalTrips} viajes</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-yellow-600">{driver.rating}</span>
                      <span className="text-yellow-500">★</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay datos de conductores
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Trucks */}
        <Card>
          <CardHeader>
            <CardTitle>Camiones Más Utilizados</CardTitle>
            <CardDescription>Flota con mayor actividad</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingOperational ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : operationalData?.topTrucks && operationalData.topTrucks.length > 0 ? (
              <div className="space-y-3">
                {operationalData.topTrucks.slice(0, 5).map((truck, index) => (
                  <div key={truck.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#1B3F66] flex items-center justify-center text-white text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{truck.plateNumber}</div>
                        <div className="text-xs text-gray-500">
                          {truck.brand} {truck.model}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-600">
                      {truck.totalTrips} viajes
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay datos de camiones
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
