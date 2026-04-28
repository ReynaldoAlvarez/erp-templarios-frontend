'use client';

import { useMemo, useState } from 'react';
import {
  Users,
  UserCheck,
  UserPlus,
  Star,
  AlertTriangle,
  Clock,
  Calendar,
  Award,
  TrendingUp,
  Shield,
  FileWarning,
  ClipboardList,
  Route,
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
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw, CalendarDays } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useHRDashboard,
  useDriversList,
} from '@/hooks/use-queries';

// KPI Card with colored icon background
interface HRKPICardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  isLoading?: boolean;
}

function HRKPICard({ title, value, subtitle, icon: Icon, iconBg, iconColor, isLoading }: HRKPICardProps) {
  if (isLoading) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
          <div className={`h-8 w-8 rounded-lg ${iconBg} flex items-center justify-center`}>
            <Skeleton className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-1" />
          <Skeleton className="h-4 w-28" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className={`h-8 w-8 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

// License severity config
const licenseSeverityConfig: Record<string, { className: string; label: string }> = {
  expired: { className: 'bg-red-100 text-red-800', label: 'Vencida' },
  expiring_soon: { className: 'bg-orange-100 text-orange-800', label: 'Por Vencer' },
  warning: { className: 'bg-yellow-100 text-yellow-800', label: 'Advertencia' },
};

// Contract type labels
const contractTypeLabels: Record<string, string> = {
  MONTHLY: 'Mensual',
  TRIP: 'Por Viaje',
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
      return { startDate: startOfDay.toISOString(), endDate: now.toISOString() };
    case 'week': {
      const weekStart = new Date(startOfDay);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return { startDate: weekStart.toISOString(), endDate: now.toISOString() };
    }
    case 'month': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: monthStart.toISOString(), endDate: now.toISOString() };
    }
    case 'quarter': {
      const quarter = Math.floor(now.getMonth() / 3);
      const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
      return { startDate: quarterStart.toISOString(), endDate: now.toISOString() };
    }
    case 'year': {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      return { startDate: yearStart.toISOString(), endDate: now.toISOString() };
    }
    default:
      return { startDate: startOfDay.toISOString(), endDate: now.toISOString() };
  }
}

// Star rating component
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= Math.round(rating)
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-300'
          }`}
        />
      ))}
      <span className="text-sm font-medium text-gray-700 ml-1">{Number(rating).toFixed(1)}</span>
    </div>
  );
}

export default function HRDashboardPage() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState('month');

  const params = useMemo(() => getDateRange(dateRange), [dateRange]);

  const { data: hrData, isLoading: isLoadingHR } = useHRDashboard(params);
  const { data: driversData } = useDriversList();

  const summary = (hrData as any)?.summary || {};
  const licenseAlerts = (hrData as any)?.licenseAlerts || [];
  const topDrivers = (hrData as any)?.topDrivers || [];
  const driversByContract = (hrData as any)?.driversByContract || [];
  const driverPerformance = (hrData as any)?.driverPerformance || [];

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'hr'] });
  };

  // Fallback: calculate totals from driversData if API returns empty
  const fallbackTotal = driversData?.data?.length || 0;
  const displayTotalDrivers = summary.totalDrivers || fallbackTotal;
  const totalFromContract = driversByContract.reduce((sum: number, item: any) => sum + (item.count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#1B3F66]/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-[#1B3F66]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard RRHH</h1>
            <p className="text-gray-500 mt-0.5">Gestión y rendimiento del personal de conductores</p>
          </div>
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

      {/* Primary KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <HRKPICard
          title="Total Conductores"
          value={displayTotalDrivers}
          subtitle="registrados en el sistema"
          icon={Users}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          isLoading={isLoadingHR}
        />
        <HRKPICard
          title="Conductores Activos"
          value={summary.activeDrivers || 0}
          subtitle="con estado activo"
          icon={UserCheck}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          isLoading={isLoadingHR}
        />
        <HRKPICard
          title="Conductores Disponibles"
          value={summary.availableDrivers || 0}
          subtitle="sin viaje asignado"
          icon={UserPlus}
          iconBg="bg-teal-100"
          iconColor="text-teal-600"
          isLoading={isLoadingHR}
        />
        <HRKPICard
          title="En Viaje"
          value={summary.onTripDrivers || 0}
          subtitle="actualmente en ruta"
          icon={Route}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          isLoading={isLoadingHR}
        />
      </div>

      {/* Secondary KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <HRKPICard
          title="Conductores Mensuales"
          value={summary.monthlyDrivers || 0}
          subtitle="contrato mensual"
          icon={Calendar}
          iconBg="bg-gray-100"
          iconColor="text-gray-600"
          isLoading={isLoadingHR}
        />
        <HRKPICard
          title="Conductores por Viaje"
          value={summary.tripDrivers || 0}
          subtitle="contrato por viaje"
          icon={ClipboardList}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-500"
          isLoading={isLoadingHR}
        />
        <HRKPICard
          title="Rating Promedio"
          value={`${Number(summary.avgRating || 0).toFixed(1)}`}
          subtitle="evaluación general"
          icon={Star}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-500"
          isLoading={isLoadingHR}
        />
        <HRKPICard
          title="Viajes del Mes"
          value={summary.totalTripsThisMonth || 0}
          subtitle={`${Number(summary.avgDeliveryHours || 0).toFixed(1)} hrs prom. entrega`}
          icon={TrendingUp}
          iconBg="bg-green-50"
          iconColor="text-green-500"
          isLoading={isLoadingHR}
        />
      </div>

      {/* License Alerts & Top Drivers */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* License Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileWarning className="h-5 w-5 text-orange-500" />
              Alertas de Licencias
            </CardTitle>
            <CardDescription>
              Conductores con licencias próximas a vencer o vencidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHR ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : licenseAlerts && licenseAlerts.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Conductor</TableHead>
                      <TableHead>Licencia</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead>Días</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {licenseAlerts.map((alert: any, index: number) => {
                      const severity = licenseSeverityConfig[alert.severity] || licenseSeverityConfig.warning;
                      return (
                        <TableRow key={index} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{alert.driverName}</TableCell>
                          <TableCell className="text-sm text-gray-500">{alert.licenseNumber}</TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {alert.expiryDate
                              ? format(new Date(alert.expiryDate), 'dd/MM/yyyy', { locale: es })
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={severity.className}>
                              {alert.daysRemaining <= 0
                                ? `Vencida (${alert.daysRemaining})`
                                : `${alert.daysRemaining} días`}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileWarning className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No hay alertas de licencias</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Drivers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Top Conductores
            </CardTitle>
            <CardDescription>
              Mejores conductores por rendimiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHR ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : topDrivers && topDrivers.length > 0 ? (
              <div className="space-y-3">
                {topDrivers.slice(0, 5).map((driver: any, index: number) => (
                  <div key={driver.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#1B3F66] flex items-center justify-center text-white text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{driver.name}</div>
                        <div className="text-xs text-gray-500">{driver.totalTrips} viajes completados</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StarRating rating={driver.rating || 0} />
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {Number(driver.avgDeliveryHours || 0).toFixed(1)}h
                        </span>
                        <span>{Number(driver.totalWeight || 0).toLocaleString('es-BO')} tn</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay datos disponibles
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contract Distribution & Driver Performance */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Contract Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[#1B3F66]" />
              Distribución por Contrato
            </CardTitle>
            <CardDescription>
              Conductores por tipo de contrato
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHR ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : driversByContract && driversByContract.length > 0 ? (
              <div className="space-y-4">
                {driversByContract.map((item: any, index: number) => {
                  const percent = totalFromContract > 0 ? Math.round((item.count / totalFromContract) * 100) : 0;
                  const label = contractTypeLabels[item.type] || item.type;
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">{percent}%</span>
                          <Badge className="bg-[#1B3F66] text-white">
                            {item.count}
                          </Badge>
                        </div>
                      </div>
                      <Progress value={percent} className="h-3" />
                    </div>
                  );
                })}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Total</span>
                    <span className="text-sm font-bold text-gray-900">{totalFromContract} conductores</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay datos disponibles
              </div>
            )}
          </CardContent>
        </Card>

        {/* Driver Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Rendimiento de Conductores
            </CardTitle>
            <CardDescription>
              Métricas de rendimiento por conductor
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHR ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : driverPerformance && driverPerformance.length > 0 ? (
              <div className="rounded-md border max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Conductor</TableHead>
                      <TableHead className="text-center">Viajes</TableHead>
                      <TableHead className="text-center">Puntualidad</TableHead>
                      <TableHead className="text-right">Peso</TableHead>
                      <TableHead className="text-right">Gastos</TableHead>
                      <TableHead className="text-center">Sanc.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {driverPerformance.map((driver: any) => (
                      <TableRow key={driver.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{driver.name}</TableCell>
                        <TableCell className="text-center">{driver.trips}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="secondary"
                            className={
                              (driver.onTimeDelivery || 0) >= 90
                                ? 'bg-green-100 text-green-800'
                                : (driver.onTimeDelivery || 0) >= 70
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }
                          >
                            {driver.onTimeDelivery || 0}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {Number(driver.totalWeight || 0).toLocaleString('es-BO')} tn
                        </TableCell>
                        <TableCell className="text-right">
                          Bs {Number(driver.expenses || 0).toLocaleString('es-BO', { minimumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell className="text-center">
                          {driver.sanctions > 0 ? (
                            <Badge variant="secondary" className="bg-red-100 text-red-800">
                              {driver.sanctions}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay datos disponibles
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
