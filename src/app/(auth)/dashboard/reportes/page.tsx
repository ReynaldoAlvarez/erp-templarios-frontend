'use client';

import { useState, useMemo } from 'react';
import {
  BarChart3,
  FileText,
  Truck,
  Users,
  MapPin,
  CalendarDays,
  Download,
  Loader2,
  AlertTriangle,
  TrendingUp,
  Package,
  Clock,
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useReportTypes,
  useTripsReport,
  useFinancialReport,
  useClientsReport,
  useDriversReport,
  useFleetReport,
  useBordersReport,
} from '@/hooks/use-queries';

// Report Type Icons
const reportTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  trips: Route,
  financial: TrendingUp,
  clients: Users,
  drivers: Users,
  fleet: Truck,
  borders: MapPin,
};

// Date Range Options
const dateRangeOptions = [
  { value: 'week', label: 'Última Semana' },
  { value: 'month', label: 'Último Mes' },
  { value: 'quarter', label: 'Último Trimestre' },
  { value: 'year', label: 'Último Año' },
  { value: 'custom', label: 'Personalizado' },
];

function getDateRange(range: string): { startDate: string; endDate: string } {
  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  
  switch (range) {
    case 'week': {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);
      return {
        startDate: weekStart.toISOString(),
        endDate: endOfDay.toISOString(),
      };
    }
    case 'month': {
      const monthStart = new Date(now);
      monthStart.setMonth(monthStart.getMonth() - 1);
      monthStart.setHours(0, 0, 0, 0);
      return {
        startDate: monthStart.toISOString(),
        endDate: endOfDay.toISOString(),
      };
    }
    case 'quarter': {
      const quarterStart = new Date(now);
      quarterStart.setMonth(quarterStart.getMonth() - 3);
      quarterStart.setHours(0, 0, 0, 0);
      return {
        startDate: quarterStart.toISOString(),
        endDate: endOfDay.toISOString(),
      };
    }
    case 'year': {
      const yearStart = new Date(now);
      yearStart.setFullYear(yearStart.getFullYear() - 1);
      yearStart.setHours(0, 0, 0, 0);
      return {
        startDate: yearStart.toISOString(),
        endDate: endOfDay.toISOString(),
      };
    }
    default:
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        endDate: endOfDay.toISOString(),
      };
  }
}

// Status Badge Component
const statusConfig: Record<string, { label: string; className: string }> = {
  SCHEDULED: { label: 'Programado', className: 'bg-yellow-100 text-yellow-800' },
  IN_TRANSIT: { label: 'En Tránsito', className: 'bg-blue-100 text-blue-800' },
  AT_BORDER: { label: 'En Frontera', className: 'bg-orange-100 text-orange-800' },
  DELIVERED: { label: 'Entregado', className: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
  PENDING: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { label: 'Aprobado', className: 'bg-blue-100 text-blue-800' },
  PAID: { label: 'Pagado', className: 'bg-green-100 text-green-800' },
  ISSUED: { label: 'Emitido', className: 'bg-blue-100 text-blue-800' },
};

export default function ReportesPage() {
  const [selectedReportType, setSelectedReportType] = useState<string>('trips');
  const [dateRange, setDateRange] = useState<string>('month');
  
  const params = useMemo(() => getDateRange(dateRange), [dateRange]);

  // Fetch report types
  const { data: reportTypes, isLoading: isLoadingTypes } = useReportTypes();

  // Fetch selected report data
  const { data: tripsReport, isLoading: isLoadingTrips } = useTripsReport(
    selectedReportType === 'trips' ? params : undefined
  );
  const { data: financialReport, isLoading: isLoadingFinancial } = useFinancialReport(
    selectedReportType === 'financial' ? params : undefined
  );
  const { data: clientsReport, isLoading: isLoadingClients } = useClientsReport(
    selectedReportType === 'clients' ? params : undefined
  );
  const { data: driversReport, isLoading: isLoadingDrivers } = useDriversReport(
    selectedReportType === 'drivers' ? params : undefined
  );
  const { data: fleetReport, isLoading: isLoadingFleet } = useFleetReport(
    selectedReportType === 'fleet' ? params : undefined
  );
  const { data: bordersReport, isLoading: isLoadingBorders } = useBordersReport(
    selectedReportType === 'borders' ? params : undefined
  );

  const isLoading = 
    isLoadingTypes ||
    (selectedReportType === 'trips' && isLoadingTrips) ||
    (selectedReportType === 'financial' && isLoadingFinancial) ||
    (selectedReportType === 'clients' && isLoadingClients) ||
    (selectedReportType === 'drivers' && isLoadingDrivers) ||
    (selectedReportType === 'fleet' && isLoadingFleet) ||
    (selectedReportType === 'borders' && isLoadingBorders);

  // Get selected report type info
  const selectedReport = reportTypes?.find(r => r.type === selectedReportType);
  const SelectedIcon = selectedReportType ? reportTypeIcons[selectedReportType] || FileText : FileText;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-500 mt-1">
            Genera y visualiza reportes detallados del sistema
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <CalendarDays className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="bg-[#1B3F66] hover:bg-[#1B3F66]/90">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Report Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Reporte</CardTitle>
          <CardDescription>Selecciona el tipo de reporte que deseas generar</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTypes ? (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              {reportTypes?.map((type) => {
                const Icon = reportTypeIcons[type.type] || FileText;
                const isSelected = selectedReportType === type.type;
                return (
                  <button
                    key={type.type}
                    onClick={() => setSelectedReportType(type.type)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-[#1B3F66] bg-[#1B3F66]/5'
                        : 'border-gray-200 hover:border-[#1B3F66]/50 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-3 ${
                      isSelected ? 'bg-[#1B3F66] text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="font-medium text-sm">{type.label}</div>
                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">{type.description}</div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Content */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#1B3F66]" />
              <span className="ml-3 text-gray-600">Cargando reporte...</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Trips Report */}
          {selectedReportType === 'trips' && tripsReport && (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Route className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{tripsReport.summary.totalTrips}</div>
                        <div className="text-xs text-gray-500">Total Viajes</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <Package className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{tripsReport.summary.totalWeight.toFixed(1)} tn</div>
                        <div className="text-xs text-gray-500">Peso Total</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{(tripsReport.summary.averageTripDuration / 60).toFixed(1)}h</div>
                        <div className="text-xs text-gray-500">Duración Promedio</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{tripsReport.summary.totalBorderCrossings}</div>
                        <div className="text-xs text-gray-500">Cruces de Frontera</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Trips Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Detalle de Viajes</CardTitle>
                  <CardDescription>
                    Período: {format(new Date(tripsReport.dateRange.startDate), 'dd/MM/yyyy', { locale: es })} - {format(new Date(tripsReport.dateRange.endDate), 'dd/MM/yyyy', { locale: es })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>MIC/DTA</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Conductor</TableHead>
                          <TableHead>Camión</TableHead>
                          <TableHead>Peso</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tripsReport.trips.slice(0, 10).map((trip) => (
                          <TableRow key={trip.id}>
                            <TableCell className="font-medium">{trip.micDta}</TableCell>
                            <TableCell>{trip.client}</TableCell>
                            <TableCell>{trip.driver}</TableCell>
                            <TableCell>{trip.truck}</TableCell>
                            <TableCell>{trip.weight} tn</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={statusConfig[trip.status]?.className}>
                                {statusConfig[trip.status]?.label || trip.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(trip.departureDate), 'dd/MM/yyyy', { locale: es })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Financial Report */}
          {selectedReportType === 'financial' && financialReport && (
            <>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                {/* Settlements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Liquidaciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total:</span>
                        <span className="font-medium">{financialReport.settlements.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Flete USD:</span>
                        <span className="font-medium">${financialReport.settlements.totalFreightUsd.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Flete BOB:</span>
                        <span className="font-medium">Bs {financialReport.settlements.totalFreightBob.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Pago Neto:</span>
                        <span className="font-bold text-green-600">Bs {financialReport.settlements.totalNetPayment.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Invoices */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Facturas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total:</span>
                        <span className="font-medium">{financialReport.invoices.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Monto Total:</span>
                        <span className="font-medium">
  ${financialReport?.invoices?.averageInvoice
    ? financialReport.invoices.averageInvoice.toLocaleString()
    : "0"}
</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Promedio:</span>
                        <span className="font-medium">
  ${financialReport?.invoices?.averageInvoice
    ? financialReport.invoices.averageInvoice.toLocaleString()
    : "0"}
</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Expenses */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Gastos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total:</span>
                        <span className="font-medium">{financialReport.expenses.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Monto Total:</span>
                        <span className="font-bold text-red-600">Bs {financialReport.expenses.total.toLocaleString() ?? "0"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Promedio:</span>
                        <span className="font-medium">Bs {financialReport.expenses.averageExpense?.toLocaleString() ?? "0"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Expenses by Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Gastos por Categoría</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(financialReport.expenses.byCategory).map(([category, data]) => (
                      <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{category}</Badge>
                          <span className="text-sm text-gray-500">{data.count} registros</span>
                        </div>
                        <span className="font-medium">Bs {data.total?.toLocaleString?.() ?? "0"}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Clients Report */}
          {selectedReportType === 'clients' && clientsReport && (
            <>
              <div className="grid gap-4 grid-cols-2">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{clientsReport.totalClients}</div>
                    <div className="text-sm text-gray-500">Total Clientes</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">{clientsReport.activeClients}</div>
                    <div className="text-sm text-gray-500">Clientes Activos</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Detalle por Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Razón Social</TableHead>
                          <TableHead>NIT</TableHead>
                          <TableHead>Viajes</TableHead>
                          <TableHead>Peso Total</TableHead>
                          <TableHead>Facturado</TableHead>
                          <TableHead>Pendiente</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientsReport.clients.slice(0, 10).map((client) => (
                          <TableRow key={client.id}>
                            <TableCell className="font-medium">{client.businessName}</TableCell>
                            <TableCell>{client.nit}</TableCell>
                            <TableCell>{client.totalTrips}</TableCell>
                            <TableCell>{client.totalWeight} tn</TableCell>
                            <TableCell>${client.totalInvoiced?.toLocaleString?.() ?? "0"}</TableCell>
                            <TableCell>
                              {client.pendingInvoices > 0 && (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                  {client.pendingInvoices} pendientes
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Drivers Report */}
          {selectedReportType === 'drivers' && driversReport && (
            <>
              <div className="grid gap-4 grid-cols-2">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{driversReport.totalDrivers}</div>
                    <div className="text-sm text-gray-500">Total Conductores</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">{driversReport.activeDrivers}</div>
                    <div className="text-sm text-gray-500">Conductores Activos</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Rendimiento de Conductores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Licencia</TableHead>
                          <TableHead>Viajes</TableHead>
                          <TableHead>Peso Total</TableHead>
                          <TableHead>Tiempo Prom.</TableHead>
                          <TableHead>Calificación</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {driversReport.drivers.slice(0, 10).map((driver) => (
                          <TableRow key={driver.id}>
                            <TableCell className="font-medium">{driver.name}</TableCell>
                            <TableCell>{driver.licenseNumber}</TableCell>
                            <TableCell>{driver.totalTrips}</TableCell>
                            <TableCell>{driver.totalWeight} tn</TableCell>
                            <TableCell>{(driver.avgDeliveryHours / 60).toFixed(1)}h</TableCell>
                            <TableCell>
                              <span className="text-yellow-500">★</span>
                              <span className="ml-1">{driver.rating}</span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Fleet Report */}
          {selectedReportType === 'fleet' && fleetReport && (
            <>
              <div className="grid gap-4 grid-cols-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{fleetReport.totalTrucks}</div>
                    <div className="text-sm text-gray-500">Total Camiones</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">{fleetReport.activeTrucks}</div>
                    <div className="text-sm text-gray-500">Camiones Activos</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">
  {fleetReport?.averageUtilization != null
    ? fleetReport.averageUtilization.toFixed(1)
    : "0.0"}%
</div>
                    <div className="text-sm text-gray-500">Utilización Promedio</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Rendimiento de Flota</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Placa</TableHead>
                          <TableHead>Marca/Modelo</TableHead>
                          <TableHead>Capacidad</TableHead>
                          <TableHead>Viajes</TableHead>
                          <TableHead>Peso Total</TableHead>
                          <TableHead>Utilización</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
  {(Array.isArray(fleetReport?.trucks) ? fleetReport.trucks : [])
    .slice(0, 10)
    .map((truck) => (
      <TableRow key={truck.id}>
        <TableCell className="font-medium">{truck.plateNumber}</TableCell>
        <TableCell>{truck.brand} {truck.model}</TableCell>
        <TableCell>{truck.capacityTons ?? 0} tn</TableCell>
        <TableCell>{truck.totalTrips ?? 0}</TableCell>
        <TableCell>{truck.totalWeight ?? 0} tn</TableCell>
        <TableCell>
          {(truck.utilizationPercent ?? 0).toFixed(1)}%
        </TableCell>
        <TableCell>
          <Badge
            variant="secondary"
            className={statusConfig[truck.status]?.className}
          >
            {statusConfig[truck.status]?.label || truck.status}
          </Badge>
        </TableCell>
      </TableRow>
    ))}
</TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Borders Report */}
          {selectedReportType === 'borders' && bordersReport && (
            <>
              <div className="grid gap-4 grid-cols-2">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{bordersReport.totalCrossings}</div>
                    <div className="text-sm text-gray-500">Total Cruces</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{bordersReport?.avgDurationOverall?.toFixed(1) ?? "0.0"}h</div>
                    <div className="text-sm text-gray-500">Tiempo Promedio</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas por Frontera</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(bordersReport?.borders ?? []).map((border) => (
                      <div key={border.borderName} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium">{border.borderName}</h3>
                          <Badge>{border.totalCrossings} cruces</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500">Tiempo Prom.</div>
                            <div className="font-medium">{border.avgDurationHours.toFixed(1)}h</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Canal Verde</div>
                            <div className="font-medium text-green-600">{border.channelDistribution.GREEN || 0}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Canal Rojo</div>
                            <div className="font-medium text-red-600">{border.channelDistribution.RED || 0}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
