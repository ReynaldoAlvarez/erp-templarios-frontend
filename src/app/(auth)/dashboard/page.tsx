'use client';

import { useState, useMemo, useCallback } from 'react';
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
  Shield,
  ClipboardList,
  Wrench,
  Landmark,
  Building2,
  ArrowRight,
  BarChart3,
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
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/use-auth';
import {
  useMainDashboard,
  useFinancialDashboard,
  useOperationalDashboard,
  useDocumentTypeStats,
  useDocumentAutomationStats,
  useTramoStats,
  useTripReportsStats,
  usePaymentBlockStats,
  useSanctionStats,
  useSanctionAutomationStats,
  useMaintenanceStats,
  useAssetStats,
  useLiabilityStats,
  useDashboardConsolidatedStats,
  useDashboardConsolidatedTrends,
} from '@/hooks/use-queries';
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

function getDateRange(range: string, baseDate: Date): { startDate: string; endDate: string } {
  const now = baseDate;
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
  
  // Memoize base date to prevent recalculation on every render
  const baseDate = useMemo(() => new Date(), []);
  
  // Memoize params to prevent infinite loop - only recalculate when dateRange changes
  const params = useMemo(() => {
    return getDateRange(dateRange, baseDate);
  }, [dateRange, baseDate]);
  
  const { data: mainData, isLoading: isLoadingMain, refetch: refetchMain } = useMainDashboard(params);
  const { data: financialData, isLoading: isLoadingFinancial } = useFinancialDashboard(params);
  const { data: operationalData, isLoading: isLoadingOperational } = useOperationalDashboard(params);

  // Automation & operational data hooks
  const { data: docAutoStats } = useDocumentAutomationStats();
  const { data: payBlockStats } = usePaymentBlockStats();
  const { data: tripReportStats } = useTripReportsStats();
  const { data: sanctionAutoStats } = useSanctionAutomationStats();
  const { data: sanctionStats } = useSanctionStats();
  const { data: docTypeStats } = useDocumentTypeStats();
  const { data: tramoStats } = useTramoStats();
  const { data: assetStats } = useAssetStats();
  const { data: liabilityStats } = useLiabilityStats();
  const { data: maintenanceStats } = useMaintenanceStats();
  const { data: consolidatedStats } = useDashboardConsolidatedStats(params);
  const { data: consolidatedTrends } = useDashboardConsolidatedTrends(params);

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

      {/* Consolidado General */}
      {consolidatedStats && (
        <Card className="bg-gradient-to-r from-[#1B3F66] to-[#2a5a8a] text-white">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Consolidado General
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-sm opacity-80">Viajes Totales</div>
                <div className="text-2xl font-bold">{(consolidatedStats as any).totalTrips ?? 0}</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-sm opacity-80">Peso Total</div>
                <div className="text-2xl font-bold">{((consolidatedStats as any).totalWeight ?? 0).toLocaleString()} tn</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-sm opacity-80">Facturación Total</div>
                <div className="text-2xl font-bold">${((consolidatedStats as any).totalInvoiced ?? 0).toLocaleString()}</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-sm opacity-80">Gastos Totales</div>
                <div className="text-2xl font-bold">Bs {((consolidatedStats as any).totalExpenses ?? 0).toLocaleString()}</div>
              </div>
            </div>
            {consolidatedTrends && Array.isArray(consolidatedTrends) && consolidatedTrends.length > 0 && (
              <div className="mt-4">
                <div className="text-sm opacity-80 mb-2">Tendencia (últimos 7 períodos)</div>
                <div className="flex items-end gap-1 h-16">
                  {(consolidatedTrends as any[]).slice(-7).map((trend: any, idx: number) => {
                    const maxVal = Math.max(...(consolidatedTrends as any[]).slice(-7).map((t: any) => t.totalTrips || 0));
                    const h = maxVal > 0 ? Math.max(8, ((trend.totalTrips || 0) / maxVal) * 100) : 8;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs">{trend.totalTrips || 0}</span>
                        <div 
                          className="w-full bg-white/30 rounded-t-sm transition-all"
                          style={{ height: `${h}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

      {/* Section Header: Automation & Operational Control */}
      <div className="pt-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-lg bg-[#1B3F66]/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-[#1B3F66]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Automatización y Control</h2>
            <p className="text-gray-500 text-sm mt-0.5">
              Gestión automatizada de documentos, pagos, sanciones y reportes
            </p>
          </div>
        </div>
      </div>

      {/* Row 1: Automation KPI Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {/* Document Automation Rate */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Documentos Automatizados</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-[#1B3F66]/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-[#1B3F66]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {docAutoStats?.automationRate ?? 0}%
            </div>
            <Progress
              value={docAutoStats?.automationRate ?? 0}
              className="mt-2 h-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              {docAutoStats?.total ?? 0} total generados
            </p>
          </CardContent>
        </Card>

        {/* Blocked Payments */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pagos Bloqueados</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
              <Shield className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {payBlockStats?.blocked ?? 0}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
                {payBlockStats?.unblocked ?? 0} desbloqueados
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {payBlockStats?.total ?? 0} liquidaciones revisadas
            </p>
          </CardContent>
        </Card>

        {/* Trip Reports */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Reportes de Viajes</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-[#1B3F66]/10 flex items-center justify-center">
              <ClipboardList className="h-4 w-4 text-[#1B3F66]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {tripReportStats?.total ?? 0}
            </div>
            <Progress
              value={
                (tripReportStats?.total ?? 0) > 0
                  ? Math.round(((tripReportStats?.complete ?? 0) / (tripReportStats?.total ?? 1)) * 100)
                  : 0
              }
              className="mt-2 h-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              {(tripReportStats?.total ?? 0) > 0
                ? Math.round(((tripReportStats?.complete ?? 0) / (tripReportStats?.total ?? 1)) * 100)
                : 0
              }% completados
            </p>
          </CardContent>
        </Card>

        {/* Sanction Automation Rate */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tasa Auto. Sanciones</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {sanctionAutoStats?.automationRate ?? 0}%
            </div>
            <Progress
              value={sanctionAutoStats?.automationRate ?? 0}
              className="mt-2 h-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              {sanctionAutoStats?.automaticCount ?? 0} automaticas de{' '}
              {sanctionAutoStats?.totalCount ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Detailed Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Card A: Sanciones y Pagos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#1B3F66]" />
              Sanciones y Pagos
            </CardTitle>
            <CardDescription>
              Control de sanciones automaticas y pagos bloqueados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Sanctions Overview */}
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="font-medium text-sm">Total Sanciones</span>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800">
                    {sanctionStats?.total ?? 0}
                  </Badge>
                </div>
                <div className="flex gap-2 mt-2 text-xs text-gray-500">
                  <span>{sanctionStats?.active ?? 0} activas</span>
                  <span>·</span>
                  <span>{sanctionStats?.completed ?? 0} completadas</span>
                  <span>·</span>
                  <span>{sanctionStats?.cancelled ?? 0} canceladas</span>
                </div>
              </div>

              {/* Automation Ratio */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Automaticas vs Manuales</span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex-1">
                    <Progress
                      value={sanctionAutoStats?.automationRate ?? 0}
                      className="h-2"
                    />
                  </div>
                  <span className="text-sm font-semibold text-[#1B3F66]">
                    {sanctionAutoStats?.automationRate ?? 0}%
                  </span>
                </div>
                <div className="flex gap-4 mt-2 text-xs">
                  <span className="text-green-700">
                    {sanctionAutoStats?.automaticCount ?? 0} automaticas
                  </span>
                  <span className="text-gray-500">
                    {sanctionAutoStats?.manualCount ?? 0} manuales
                  </span>
                </div>
              </div>

              {/* Retention Amounts */}
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Retencion Total Bloqueada</span>
                  <span className="text-sm font-bold text-red-700">
                    USD {(payBlockStats?.totalRetention ?? 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Quick Links */}
              <div className="flex gap-2 pt-1">
                <Link href="/dashboard/sanciones">
                  <Button variant="outline" size="sm" className="text-xs text-[#1B3F66] border-[#1B3F66] hover:bg-[#1B3F66] hover:text-white">
                    <Shield className="h-3.5 w-3.5 mr-1.5" />
                    Sanciones
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
                <Link href="/dashboard/bloqueo-pagos">
                  <Button variant="outline" size="sm" className="text-xs text-[#1B3F66] border-[#1B3F66] hover:bg-[#1B3F66] hover:text-white">
                    <Landmark className="h-3.5 w-3.5 mr-1.5" />
                    Bloqueo Pagos
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card B: Documentos y Tramos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#1B3F66]" />
              Documentos y Tramos
            </CardTitle>
            <CardDescription>
              Tipos de documentos, automatizacion y segmentos de ruta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Document Type Counts */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Tipos de Documento</span>
                  <Badge className="bg-[#1B3F66] text-white">
                    {docTypeStats?.total ?? 0} tipos
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-gray-600">Activos: {docTypeStats?.active ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-red-400" />
                    <span className="text-gray-600">Inactivos: {docTypeStats?.inactive ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                    <span className="text-gray-600">Obligatorios: {docTypeStats?.required ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-gray-400" />
                    <span className="text-gray-600">Opcionales: {docTypeStats?.optional ?? 0}</span>
                  </div>
                </div>
              </div>

              {/* Document Automation */}
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Generacion de Documentos</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Progress
                      value={docAutoStats?.automationRate ?? 0}
                      className="h-2"
                    />
                  </div>
                  <span className="text-sm font-semibold text-green-700">
                    {docAutoStats?.automationRate ?? 0}%
                  </span>
                </div>
                <div className="flex gap-4 mt-2 text-xs">
                  <span className="text-green-700">
                    {docAutoStats?.automaticCount ?? 0} automaticos
                  </span>
                  <span className="text-gray-500">
                    {docAutoStats?.manualCount ?? 0} manuales
                  </span>
                </div>
              </div>

              {/* Tramo Stats */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Tramos (Segmentos de Ruta)</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                    {tramoStats?.total ?? 0} tramos
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                  <div>
                    <div className="font-semibold text-gray-800">{tramoStats?.totalOrigins ?? 0}</div>
                    <div>Origenes</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{tramoStats?.totalDestinations ?? 0}</div>
                    <div>Destinos</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{tramoStats?.avgDistance ?? 0} km</div>
                    <div>Dist. Prom.</div>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="flex gap-2 pt-1">
                <Link href="/dashboard/documentos-tipos">
                  <Button variant="outline" size="sm" className="text-xs text-[#1B3F66] border-[#1B3F66] hover:bg-[#1B3F66] hover:text-white">
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                    Tipos Doc.
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
                <Link href="/dashboard/tramos">
                  <Button variant="outline" size="sm" className="text-xs text-[#1B3F66] border-[#1B3F66] hover:bg-[#1B3F66] hover:text-white">
                    <Route className="h-3.5 w-3.5 mr-1.5" />
                    Tramos
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Financial Overview */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {/* Assets */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Activos</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-[#1B3F66]/10 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-[#1B3F66]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-500">Valor Total</div>
                <div className="text-lg font-bold text-gray-900">
                  USD {(assetStats?.totalValue ?? 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Depreciacion Acumulada</div>
                <div className="text-sm font-medium text-red-600">
                  USD {(assetStats?.totalDepreciation ?? 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="flex gap-2 text-xs">
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  {assetStats?.active ?? 0} activos
                </Badge>
                <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                  {assetStats?.total ?? 0} total
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liabilities */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pasivos</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
              <Landmark className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-500">Deuda Total</div>
                <div className="text-lg font-bold text-gray-900">
                  USD {(liabilityStats?.totalDebt ?? 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Monto Pendiente</div>
                <div className="text-sm font-medium text-orange-600">
                  USD {(liabilityStats?.pendingAmount ?? 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="flex gap-2 text-xs">
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                  {(liabilityStats?.overdue ?? 0)} vencidas
                </Badge>
                <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                  {liabilityStats?.total ?? 0} total
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Mantenimiento</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Wrench className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-500">Mantenimientos Pendientes</div>
                <div className="text-lg font-bold text-gray-900">
                  {maintenanceStats?.pending ?? 0}
                </div>
              </div>
              <div className="flex gap-2 text-xs">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {maintenanceStats?.inProgress ?? 0} en progreso
                </Badge>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  {maintenanceStats?.completed ?? 0} completados
                </Badge>
              </div>
              <div className="text-xs text-gray-500">
                Costo total: USD {(maintenanceStats?.totalCost ?? 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
