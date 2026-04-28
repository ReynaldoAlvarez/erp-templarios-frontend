'use client';

import { useMemo, useState } from 'react';
import {
  Truck,
  Wrench,
  Route,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle,
  Link2,
  Gauge,
  Calendar,
  ClipboardList,
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
  useMaintenanceStats,
  useTrucksList,
  useAvailableTrucks,
  useTrailers,
  useAvailableTrailers,
  useUpcomingMaintenance,
} from '@/hooks/use-queries';

// KPI Card with colored icon background
interface FleetKPICardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  isLoading?: boolean;
}

function FleetKPICard({ title, value, subtitle, icon: Icon, iconBg, iconColor, isLoading }: FleetKPICardProps) {
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

// Status badge config for trucks
const truckStatusConfig: Record<string, { label: string; className: string }> = {
  AVAILABLE: { label: 'Disponible', className: 'bg-green-100 text-green-800' },
  SCHEDULED: { label: 'Programado', className: 'bg-yellow-100 text-yellow-800' },
  IN_TRANSIT: { label: 'En Tránsito', className: 'bg-blue-100 text-blue-800' },
  MAINTENANCE: { label: 'Mantenimiento', className: 'bg-orange-100 text-orange-800' },
};

// Maintenance status config
const maintenanceStatusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
  IN_PROGRESS: { label: 'En Progreso', className: 'bg-blue-100 text-blue-800' },
  COMPLETED: { label: 'Completado', className: 'bg-green-100 text-green-800' },
};

// Alert severity config
const alertSeverityConfig: Record<string, { className: string; label: string }> = {
  high: { className: 'bg-red-100 text-red-800 border-red-200', label: 'Alta' },
  medium: { className: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Media' },
  low: { className: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Baja' },
};

// Alert type config
const alertTypeConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  maintenance_due: { label: 'Mantenimiento Vencido', icon: Wrench },
  permit_expiry: { label: 'Permiso por Vencer', icon: Clock },
  mileage_alert: { label: 'Alerta de Kilometraje', icon: Route },
};

// Date Range Options
const dateRangeOptions = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Esta Semana' },
  { value: 'month', label: 'Este Mes' },
  { value: 'quarter', label: 'Este Trimestre' },
  { value: 'year', label: 'Este Año' },
];

export default function FleetDashboardPage() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState('month');

  // Fetch data from individual working endpoints
  const { data: trucksData, isLoading: isLoadingTrucks } = useTrucksList({ page: 1, limit: 1000 });
  const { data: availableTrucksData, isLoading: isLoadingAvailable } = useAvailableTrucks();
  const { data: trailersData, isLoading: isLoadingTrailers } = useTrailers({ page: 1, limit: 1000 });
  const { data: availableTrailersData } = useAvailableTrailers();
  const { data: maintenanceStats } = useMaintenanceStats();
  const { data: upcomingMaintenance } = useUpcomingMaintenance();

  const trucks = (trucksData as any)?.trucks || [];
  const trailers = (trailersData as any)?.trailers || [];
  const availableTrucks = availableTrucksData || [];
  const availableTrailersList = availableTrailersData || [];

  const isLoading = isLoadingTrucks || isLoadingAvailable || isLoadingTrailers;

  // Computed summary from real data
  const summary = useMemo(() => {
    const activeTrucks = trucks.filter((t: any) => t.isActive);
    const byStatus: Record<string, number> = {};
    trucks.forEach((t: any) => { byStatus[t.status] = (byStatus[t.status] || 0) + 1; });
    const byBrand: Record<string, number> = {};
    trucks.forEach((t: any) => { if (t.brand) byBrand[t.brand] = (byBrand[t.brand] || 0) + 1; });
    const assignedTrailers = trailers.filter((t: any) => t.truckId && t.isActive).length;
    const totalCapacity = trucks.reduce((sum: number, t: any) => sum + (t.capacityTons || 0), 0);
    const avgMileage = activeTrucks.length > 0
      ? Math.round(trucks.reduce((sum: number, t: any) => sum + (t.mileage || 0), 0) / activeTrucks.length)
      : 0;
    const avgUtilization = activeTrucks.length > 0
      ? Math.round((availableTrucks.length / activeTrucks.length) * 100)
      : 0;

    return {
      totalTrucks: trucks.length,
      activeTrucks: activeTrucks.length,
      trucksInMaintenance: byStatus['MAINTENANCE'] || 0,
      trucksInTransit: byStatus['IN_TRANSIT'] || 0,
      trucksScheduled: byStatus['SCHEDULED'] || 0,
      trucksByStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
      trucksByBrand: Object.entries(byBrand)
        .map(([brand, count]) => ({ brand, count }))
        .sort((a: any, b: any) => b.count - a.count),
      totalTrailers: trailers.length,
      assignedTrailers,
      availableTrailers: availableTrailersList.length,
      totalCapacity,
      avgMileage,
      avgUtilization,
    };
  }, [trucks, trailers, availableTrucks, availableTrailersList]);

  // Alerts computed from truck data
  const alerts = useMemo(() => {
    const result: any[] = [];
    trucks.forEach((t: any) => {
      if (t.isActive && t.operationPermitExpiry) {
        const days = Math.ceil((new Date(t.operationPermitExpiry).getTime() - Date.now()) / 86400000);
        if (days <= 0) result.push({ type: 'permit_expiry', message: `Permiso vencido: ${t.plateNumber}`, severity: 'high', id: t.id });
        else if (days <= 30) result.push({ type: 'permit_expiry', message: `Permiso vence en ${days} días: ${t.plateNumber}`, severity: 'medium', id: t.id });
        else if (days <= 90) result.push({ type: 'permit_expiry', message: `Permiso por vencer (${days}d): ${t.plateNumber}`, severity: 'low', id: t.id });
      }
      if (t.isActive && t.mileage > 500000) {
        result.push({ type: 'mileage_alert', message: `Kilometraje alto: ${t.plateNumber} (${(t.mileage / 1000).toFixed(0)}k km)`, severity: 'medium', id: t.id });
      }
    });
    return result.sort((a, b) => a.severity === 'high' ? -1 : 1);
  }, [trucks]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['trucks'] });
    queryClient.invalidateQueries({ queryKey: ['trailers'] });
    queryClient.invalidateQueries({ queryKey: ['maintenance'] });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#1B3F66]/10 flex items-center justify-center">
            <Truck className="h-5 w-5 text-[#1B3F66]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard de Flota</h1>
            <p className="text-gray-500 mt-0.5">Vista general del estado de la flota de vehículos</p>
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
        <FleetKPICard
          title="Total Camiones"
          value={summary.totalTrucks}
          subtitle={`${summary.totalCapacity} tn capacidad total`}
          icon={Truck}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          isLoading={isLoading}
        />
        <FleetKPICard
          title="Camiones Activos"
          value={summary.activeTrucks}
          subtitle="en operación"
          icon={CheckCircle}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          isLoading={isLoading}
        />
        <FleetKPICard
          title="En Mantenimiento"
          value={summary.trucksInMaintenance}
          subtitle={maintenanceStats ? `${(maintenanceStats as any).upcomingCount || 0} próximos` : 'pendientes'}
          icon={Wrench}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
          isLoading={isLoading}
        />
        <FleetKPICard
          title="En Tránsito"
          value={summary.trucksInTransit}
          subtitle={`${summary.trucksScheduled} programados`}
          icon={Route}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          isLoading={isLoading}
        />
      </div>

      {/* Secondary KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <FleetKPICard
          title="Total Remolques"
          value={summary.totalTrailers}
          subtitle="remolques registrados"
          icon={Truck}
          iconBg="bg-gray-100"
          iconColor="text-gray-600"
          isLoading={isLoading}
        />
        <FleetKPICard
          title="Remolques Asignados"
          value={summary.assignedTrailers}
          subtitle="a camiones activos"
          icon={Link2}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          isLoading={isLoading}
        />
        <FleetKPICard
          title="Disponibles"
          value={summary.availableTrailers}
          subtitle="sin asignar"
          icon={CheckCircle}
          iconBg="bg-green-50"
          iconColor="text-green-500"
          isLoading={isLoading}
        />
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Utilización Promedio</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-[#1B3F66]/10 flex items-center justify-center">
              <Gauge className="h-4 w-4 text-[#1B3F66]" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-2 w-full" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900">{summary.avgUtilization}%</div>
                <Progress value={summary.avgUtilization} className="mt-2 h-2" />
                <p className="text-xs text-gray-500 mt-1">de la capacidad total</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Truck Status */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Fleet Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Alertas de Flota
            </CardTitle>
            <CardDescription>
              Notificaciones importantes sobre vehículos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : alerts && alerts.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {alerts.map((alert: any, index: number) => {
                  const severity = alertSeverityConfig[alert.severity] || alertSeverityConfig.low;
                  const typeConfig = alertTypeConfig[alert.type] || alertTypeConfig.maintenance_due;
                  const TypeIcon = typeConfig.icon;
                  return (
                    <div
                      key={index}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${severity.className}`}
                    >
                      <TypeIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{typeConfig.label}</span>
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            {severity.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No hay alertas activas</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Truck Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[#1B3F66]" />
              Estado de Camiones
            </CardTitle>
            <CardDescription>
              Distribución de camiones por estado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : summary.trucksByStatus && summary.trucksByStatus.length > 0 ? (
              <div className="space-y-3">
                {summary.trucksByStatus.map((item: any, index: number) => {
                  const config = truckStatusConfig[item.status] || { label: item.status, className: 'bg-gray-100 text-gray-800' };
                  const percent = summary.totalTrucks > 0 ? Math.round((item.count / summary.totalTrucks) * 100) : 0;
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className={config.className}>
                          {config.label}
                        </Badge>
                        <span className="text-sm text-gray-500">{percent}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24">
                          <Progress value={percent} className="h-2" />
                        </div>
                        <span className="text-lg font-bold text-gray-900">{item.count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay datos disponibles
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Truck Brands & Recent Maintenance */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Truck Brands */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-[#1B3F66]" />
              Marcas de Camiones
            </CardTitle>
            <CardDescription>
              Distribución por marca
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : summary.trucksByBrand && summary.trucksByBrand.length > 0 ? (
              <div className="space-y-3">
                {summary.trucksByBrand.map((item: any, index: number) => {
                  const percent = summary.totalTrucks > 0 ? Math.round((item.count / summary.totalTrucks) * 100) : 0;
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Truck className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{item.brand}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-20">
                          <Progress value={percent} className="h-2" />
                        </div>
                        <span className="text-sm font-semibold text-gray-600">{item.count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay datos disponibles
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-500" />
              Mantenimiento Reciente
            </CardTitle>
            <CardDescription>
              Últimos mantenimientos programados y realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : upcomingMaintenance && (upcomingMaintenance as any[])?.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Placa</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Costo Est.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(upcomingMaintenance as any[]).slice(0, 5).map((item: any) => {
                      const statusCfg = maintenanceStatusConfig[item.status] || { label: item.status, className: 'bg-gray-100 text-gray-800' };
                      return (
                        <TableRow key={item.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{(item as any).truckPlate || (item as any).truck?.plateNumber || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {item.type === 'PREVENTIVE' ? 'Preventivo' : 'Correctivo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={statusCfg.className}>
                              {statusCfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {item.scheduledDate
                              ? format(new Date(item.scheduledDate), 'dd/MM/yyyy', { locale: es })
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {item.estimatedCost
                              ? `Bs ${Number(item.estimatedCost).toLocaleString('es-BO', { minimumFractionDigits: 2 })}`
                              : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
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

      {/* Average Mileage Card */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Kilometraje Promedio</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-teal-100 flex items-center justify-center">
              <Gauge className="h-4 w-4 text-teal-600" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-24 mb-1" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900">{summary.avgMileage.toLocaleString('es-BO')} km</div>
                <p className="text-xs text-gray-500 mt-1">promedio de la flota activa</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
