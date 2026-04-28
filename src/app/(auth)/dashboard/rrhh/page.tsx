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
  useDriversList,
  useAvailableDrivers,
  useExpenseStats,
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

  // Fetch data from individual working endpoints
  const { data: driversData, isLoading: isLoadingDrivers } = useDriversList({ page: 1, limit: 1000 });
  const { data: availableDriversData, isLoading: isLoadingAvailable } = useAvailableDrivers();
  const { data: expenseStats } = useExpenseStats();

  const drivers = (driversData as any)?.drivers || [];
  const availableDrivers = availableDriversData || [];

  const isLoading = isLoadingDrivers || isLoadingAvailable;

  // Computed summary from real data
  const summary = useMemo(() => {
    const activeDrivers = drivers.filter((d: any) => d.isActive);
    const available = drivers.filter((d: any) => d.isAvailable && d.isActive);
    const monthly = drivers.filter((d: any) => d.contractType === 'MONTHLY' && d.isActive);
    const tripContract = drivers.filter((d: any) => d.contractType === 'TRIP' && d.isActive);
    const avgRating = activeDrivers.length > 0
      ? (activeDrivers.reduce((sum: number, d: any) => sum + (d.rating || 0), 0) / activeDrivers.length).toFixed(1)
      : '0.0';
    const totalTrips = activeDrivers.reduce((sum: number, d: any) => sum + (d.tripsCount || d.totalTrips || 0), 0);
    const avgDeliveryHours = activeDrivers.length > 0 ? 48 : 0; // placeholder since we don't have individual delivery times in list

    return {
      totalDrivers: drivers.length,
      activeDrivers: activeDrivers.length,
      availableDrivers: available.length,
      onTripDrivers: activeDrivers.length - available.length,
      monthlyDrivers: monthly.length,
      tripDrivers: tripContract.length,
      avgRating: Number(avgRating),
      totalTrips,
      avgDeliveryHours,
      byContract: [
        { type: 'Mensual', count: monthly.length, percent: activeDrivers.length > 0 ? Math.round((monthly.length / activeDrivers.length) * 100) : 0 },
        { type: 'Por Viaje', count: tripContract.length, percent: activeDrivers.length > 0 ? Math.round((tripContract.length / activeDrivers.length) * 100) : 0 },
      ],
    };
  }, [drivers]);

  // License alerts computed from driver data
  const licenseAlerts = useMemo(() => {
    return drivers
      .filter((d: any) => d.isActive && d.licenseExpiryDate)
      .map((d: any) => {
        const days = Math.ceil((new Date(d.licenseExpiryDate).getTime() - Date.now()) / 86400000);
        let severity: string;
        if (days <= 0) severity = 'expired';
        else if (days <= 30) severity = 'expiring_soon';
        else if (days <= 90) severity = 'warning';
        else return null;
        return {
          driverId: d.id,
          driverName: d.fullName,
          licenseNumber: d.licenseNumber,
          expiryDate: d.licenseExpiryDate,
          daysRemaining: days,
          severity,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.daysRemaining - b.daysRemaining);
  }, [drivers]);

  // Top drivers by trip count
  const topDrivers = useMemo(() => {
    return [...drivers]
      .filter((d: any) => d.isActive)
      .sort((a: any, b: any) => (b.tripsCount || b.totalTrips || 0) - (a.tripsCount || a.totalTrips || 0))
      .slice(0, 5);
  }, [drivers]);

  // Driver performance from all active drivers
  const driverPerformance = useMemo(() => {
    return drivers
      .filter((d: any) => d.isActive)
      .sort((a: any, b: any) => (b.tripsCount || b.totalTrips || 0) - (a.tripsCount || a.totalTrips || 0));
  }, [drivers]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['drivers'] });
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
  };

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
          value={summary.totalDrivers}
          subtitle="registrados en el sistema"
          icon={Users}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          isLoading={isLoading}
        />
        <HRKPICard
          title="Conductores Activos"
          value={summary.activeDrivers}
          subtitle="con estado activo"
          icon={UserCheck}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          isLoading={isLoading}
        />
        <HRKPICard
          title="Conductores Disponibles"
          value={summary.availableDrivers}
          subtitle="sin viaje asignado"
          icon={UserPlus}
          iconBg="bg-teal-100"
          iconColor="text-teal-600"
          isLoading={isLoading}
        />
        <HRKPICard
          title="En Viaje"
          value={summary.onTripDrivers}
          subtitle="actualmente en ruta"
          icon={Route}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          isLoading={isLoading}
        />
      </div>

      {/* Secondary KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <HRKPICard
          title="Conductores Mensuales"
          value={summary.monthlyDrivers}
          subtitle="contrato mensual"
          icon={Calendar}
          iconBg="bg-gray-100"
          iconColor="text-gray-600"
          isLoading={isLoading}
        />
        <HRKPICard
          title="Conductores por Viaje"
          value={summary.tripDrivers}
          subtitle="contrato por viaje"
          icon={ClipboardList}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-500"
          isLoading={isLoading}
        />
        <HRKPICard
          title="Rating Promedio"
          value={`${summary.avgRating.toFixed(1)}`}
          subtitle="evaluación general"
          icon={Star}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-500"
          isLoading={isLoading}
        />
        <HRKPICard
          title="Viajes del Mes"
          value={summary.totalTrips}
          subtitle={`${summary.avgDeliveryHours} hrs prom. entrega`}
          icon={TrendingUp}
          iconBg="bg-green-50"
          iconColor="text-green-500"
          isLoading={isLoading}
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
            {isLoading ? (
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
                      const severity = licenseSeverityConfig[(alert as any).severity] || licenseSeverityConfig.warning;
                      return (
                        <TableRow key={index} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{(alert as any).driverName}</TableCell>
                          <TableCell className="text-sm text-gray-500">{(alert as any).licenseNumber}</TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {(alert as any).expiryDate
                              ? format(new Date((alert as any).expiryDate), 'dd/MM/yyyy', { locale: es })
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={severity.className}>
                              {(alert as any).daysRemaining <= 0
                                ? `Vencida (${(alert as any).daysRemaining})`
                                : `${(alert as any).daysRemaining} días`}
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
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : topDrivers && topDrivers.length > 0 ? (
              <div className="space-y-3">
                {topDrivers.slice(0, 5).map((driver: any, index: number) => (
                  <div key={(driver as any).id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#1B3F66] flex items-center justify-center text-white text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{(driver as any).fullName}</div>
                        <div className="text-xs text-gray-500">{(driver as any).tripsCount || (driver as any).totalTrips || 0} viajes completados</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StarRating rating={(driver as any).rating || 0} />
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {(driver as any).sanctionsCount || 0} sanc.
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {(driver as any).licenseCategory || '-'}
                        </span>
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
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : summary.byContract && summary.byContract.length > 0 ? (
              <div className="space-y-4">
                {summary.byContract.map((item: any, index: number) => {
                  const totalFromContract = summary.activeDrivers;
                  const label = (item as any).type;
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">{(item as any).percent}%</span>
                          <Badge className="bg-[#1B3F66] text-white">
                            {(item as any).count}
                          </Badge>
                        </div>
                      </div>
                      <Progress value={(item as any).percent} className="h-3" />
                    </div>
                  );
                })}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Total</span>
                    <span className="text-sm font-bold text-gray-900">{summary.activeDrivers} conductores</span>
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
            {isLoading ? (
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
                      <TableHead className="text-center">Sanciones</TableHead>
                      <TableHead className="text-center">Gastos</TableHead>
                      <TableHead className="text-center">Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {driverPerformance.map((driver: any) => (
                      <TableRow key={(driver as any).id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{(driver as any).fullName}</TableCell>
                        <TableCell className="text-center">{(driver as any).tripsCount || (driver as any).totalTrips || 0}</TableCell>
                        <TableCell className="text-center">
                          {(driver as any).sanctionsCount > 0 ? (
                            <Badge variant="secondary" className="bg-red-100 text-red-800">
                              {(driver as any).sanctionsCount}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {(driver as any).expensesCount || 0}
                        </TableCell>
                        <TableCell className="text-center">
                          <StarRating rating={(driver as any).rating || 0} />
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
