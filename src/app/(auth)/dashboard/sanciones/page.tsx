'use client';

import { useState, useMemo } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import {
  useSanctions,
  useSanctionTypes,
  useSanctionStats,
  useActiveSanctions,
  useCreateSanction,
  useUpdateSanction,
  useCompleteSanction,
  useCancelSanction,
  useDriversList,
  useDelayedTrips,
  useGenerateAutomaticSanctions,
  useSanctionAutomationStats,
  useSanctionConfig,
  useSanctionReasons,
} from '@/hooks/use-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import SanctionGenerationModal from '@/components/sprint5/SanctionGenerationModal';
import {
  Plus,
  Search,
  AlertTriangle,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  Edit,
  Loader2,
  AlertOctagon,
  Zap,
  Clock,
  Shield,
  Bot,
  UserCheck,
  TrendingUp,
  Timer,
  BarChart3,
} from 'lucide-react';
import type {
  Sanction,
  SanctionType,
  SanctionStatus,
  SanctionReason,
  CreateSanctionInput,
  UpdateSanctionInput,
} from '@/types/api';

// Config de estados
const statusConfig: Record<SanctionStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
  COMPLETED: { label: 'Completada', className: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelada', className: 'bg-gray-100 text-gray-800' },
};

// Config de tipos
const typeConfig: Record<SanctionType, { label: string; className: string }> = {
  WARNING: { label: 'Amonestacion', className: 'bg-yellow-100 text-yellow-800' },
  FINE: { label: 'Multa', className: 'bg-orange-100 text-orange-800' },
  SUSPENSION: { label: 'Suspension', className: 'bg-red-100 text-red-800' },
};

// Config de razones de sancion
const sanctionReasonConfig: Record<SanctionReason, { label: string; className: string }> = {
  DOCUMENT_DELAY: { label: 'Retraso Documentario', className: 'bg-orange-100 text-orange-800' },
  REPEATED_OFFENSE: { label: 'Reincidencia', className: 'bg-red-100 text-red-800' },
  SAFETY_VIOLATION: { label: 'Violacion de Seguridad', className: 'bg-purple-100 text-purple-800' },
  OTHER: { label: 'Otro', className: 'bg-gray-100 text-gray-800' },
};

// Helper functions
const getStatusValue = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null && 'count' in value) {
    return (value as { count: number }).count;
  }
  return 0;
};

const getStatusAmount = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null && 'amount' in value) {
    return (value as { amount: number }).amount;
  }
  return 0;
};

const getDriverName = (driver: {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  employee?: { firstName?: string; lastName?: string };
} | null | undefined): string => {
  if (!driver) return '-';
  if (driver.fullName) return driver.fullName;
  if (driver.employee?.firstName && driver.employee?.lastName) {
    return `${driver.employee.firstName} ${driver.employee.lastName}`;
  }
  if (driver.employee?.firstName) return driver.employee.firstName;
  if (driver.employee?.lastName) return driver.employee.lastName;
  if (driver.firstName && driver.lastName) {
    return `${driver.firstName} ${driver.lastName}`;
  }
  return driver.firstName || driver.lastName || '-';
};

export default function SancionesPage() {
  const [activeTab, setActiveTab] = useState('sanciones');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [originFilter, setOriginFilter] = useState<string>('all');
  const [driverFilter, setDriverFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerationModalOpen, setIsGenerationModalOpen] = useState(false);
  const [editingSanction, setEditingSanction] = useState<Sanction | null>(null);
  const [previewResult, setPreviewResult] = useState<
    import('@/types/api').GenerateAutomaticSanctionsResult | null
  >(null);

  const debouncedSearch = useDebounce(search, 300);

  // Hooks - Sanciones
  const params = useMemo(
    () => ({
      page,
      limit: 10,
      search: debouncedSearch || undefined,
      type: typeFilter !== 'all' ? (typeFilter as SanctionType) : undefined,
      status: statusFilter !== 'all' ? (statusFilter as SanctionStatus) : undefined,
      sanctionReason: reasonFilter !== 'all' ? (reasonFilter as SanctionReason) : undefined,
      driverId: driverFilter !== 'all' ? driverFilter : undefined,
    }),
    [page, debouncedSearch, typeFilter, statusFilter, reasonFilter, driverFilter],
  );

  const { data: sanctionsData, isLoading } = useSanctions(params);
  const { data: types } = useSanctionTypes();
  const { data: stats } = useSanctionStats();
  const { data: active } = useActiveSanctions();
  const { data: driversData } = useDriversList({ limit: 100 });

  // Hooks - Automatizacion
  const { data: delayedTrips = [] } = useDelayedTrips();
  const { data: automationStats } = useSanctionAutomationStats();
  const { data: sanctionConfig } = useSanctionConfig();
  const { data: sanctionReasons } = useSanctionReasons();
  const generateMutation = useGenerateAutomaticSanctions();

  // Mutations
  const createMutation = useCreateSanction();
  const updateMutation = useUpdateSanction();
  const completeMutation = useCompleteSanction();
  const cancelMutation = useCancelSanction();

  const handleOpenDialog = (sanction?: Sanction) => {
    setEditingSanction(sanction || null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSanction(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data: CreateSanctionInput | UpdateSanctionInput = {
      driverId: formData.get('driverId') as string,
      type: formData.get('type') as SanctionType,
      reason: formData.get('reason') as string,
      sanctionReason: formData.get('sanctionReason') as SanctionReason | null || undefined,
      tripId: (formData.get('tripId') as string) || undefined,
      daysDelayed: parseInt(formData.get('daysDelayed') as string) || undefined,
      automatic: formData.get('automatic') === 'on',
      amount: parseFloat(formData.get('amount') as string) || undefined,
      startDate: formData.get('startDate') as string || undefined,
      endDate: formData.get('endDate') as string || undefined,
      notes: formData.get('notes') as string || undefined,
    };

    if (editingSanction) {
      updateMutation.mutate({ id: editingSanction.id, data }, { onSuccess: handleCloseDialog });
    } else {
      createMutation.mutate(data as CreateSanctionInput, { onSuccess: handleCloseDialog });
    }
  };

  const handleGenerateSanctions = (tripIds: string[]) => {
    if (previewResult) {
      // Confirm generation (not dry run)
      generateMutation.mutate(
        { tripIds, dryRun: false },
        {
          onSuccess: () => {
            setPreviewResult(null);
            // The modal will show success state
          },
        },
      );
    } else {
      // First step: preview (dry run)
      generateMutation.mutate(
        { tripIds, dryRun: true },
        {
          onSuccess: (result) => {
            setPreviewResult(result);
          },
        },
      );
    }
  };

  const handleCloseGenerationModal = (open: boolean) => {
    if (!open) {
      setPreviewResult(null);
      // Refetch data after closing
    }
    setIsGenerationModalOpen(open);
  };

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '-';
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(num);
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-BO');
  };

  // Datos seguros
  const sanctionList = sanctionsData?.data || [];
  const pagination = sanctionsData?.pagination;

  // Filtered list for origin (auto/manual)
  const filteredByOrigin = useMemo(() => {
    if (originFilter === 'all') return sanctionList;
    if (originFilter === 'auto') return sanctionList.filter((s) => s.automatic === true);
    if (originFilter === 'manual') return sanctionList.filter((s) => !s.automatic);
    return sanctionList;
  }, [sanctionList, originFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3F66]">Sanciones</h1>
          <p className="text-gray-600">
            Control y automatizacion de sanciones a conductores
          </p>
        </div>
        <div className="flex items-center gap-2">
          {delayedTrips.length > 0 && (
            <Button
              onClick={() => setIsGenerationModalOpen(true)}
              variant="outline"
              className="border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              <Zap className="mr-2 h-4 w-4" />
              Generar Automaticas ({delayedTrips.length})
            </Button>
          )}
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-[#1B3F66] hover:bg-[#0F2A47]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Sancion
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="sanciones">Sanciones</TabsTrigger>
          <TabsTrigger value="retrasos">
            Retrasos
            {delayedTrips.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                {delayedTrips.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="automatizacion">Automatizacion</TabsTrigger>
        </TabsList>

        {/* TAB 1: Sanciones (CRUD) */}
        <TabsContent value="sanciones" className="space-y-4">
          {/* Stats Cards */}
          {stats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Sanciones
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-[#1B3F66]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getStatusValue(stats.total)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Pendientes</CardTitle>
                  <AlertOctagon className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {getStatusValue(stats.byStatus?.PENDING)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Multas Totales</CardTitle>
                  <DollarSign className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(
                      getStatusAmount(stats.totalFines) || getStatusAmount(stats.byType?.FINE),
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Automaticas</CardTitle>
                  <Bot className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {getStatusValue(stats.automaticCount) || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Manuales</CardTitle>
                  <UserCheck className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {getStatusValue(stats.manualCount) || 0}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Active Sanctions Alert */}
          {active && active.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-800">
                  Sanciones Activas ({active.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {active.slice(0, 5).map((s) => (
                    <Badge key={s.id} variant="outline" className="bg-white">
                      {getDriverName(s.driver)} - {typeConfig[s.type]?.label || s.type}
                    </Badge>
                  ))}
                  {active.length > 5 && (
                    <Badge variant="outline" className="bg-white text-gray-500">
                      +{active.length - 5} mas...
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por conductor o motivo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={driverFilter} onValueChange={setDriverFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Conductor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los conductores</SelectItem>
                {(driversData?.data || []).map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {getDriverName(driver)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full lg:w-44">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {Object.entries(typeConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Razon" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las razones</SelectItem>
                {Object.entries(sanctionReasonConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={originFilter} onValueChange={setOriginFilter}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Origen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="auto">Automaticas</SelectItem>
                <SelectItem value="manual">Manuales</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-44">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(statusConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-lg border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conductor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Razon</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#1B3F66]" />
                    </TableCell>
                  </TableRow>
                ) : filteredByOrigin.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No se encontraron sanciones
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredByOrigin.map((sanction) => (
                    <TableRow key={sanction.id}>
                      <TableCell className="font-medium">
                        {getDriverName(sanction.driver)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={typeConfig[sanction.type]?.className || 'bg-gray-100 text-gray-800'}
                        >
                          {typeConfig[sanction.type]?.label || sanction.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sanction.sanctionReason ? (
                          <Badge
                            className={
                              sanctionReasonConfig[sanction.sanctionReason]?.className ||
                              'bg-gray-100 text-gray-800'
                            }
                          >
                            {sanctionReasonConfig[sanction.sanctionReason]?.label ||
                              sanction.sanctionReason}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={sanction.reason}>
                        {sanction.reason}
                      </TableCell>
                      <TableCell>
                        {sanction.automatic ? (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Bot className="mr-1 h-3 w-3" />
                            Auto
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50">
                            <UserCheck className="mr-1 h-3 w-3" />
                            Manual
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(sanction.startDate)}</TableCell>
                      <TableCell>
                        {sanction.amount ? formatCurrency(sanction.amount) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            statusConfig[sanction.status]?.className || 'bg-gray-100 text-gray-800'
                          }
                        >
                          {statusConfig[sanction.status]?.label || sanction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(sanction)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {sanction.status === 'PENDING' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => completeMutation.mutate(sanction.id)}
                                title="Completar"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => cancelMutation.mutate({ id: sanction.id })}
                                title="Cancelar"
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Mostrando {(page - 1) * 10 + 1} - {Math.min(page * 10, pagination.total)} de{' '}
                {pagination.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={!pagination.hasPrev}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={!pagination.hasNext}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* TAB 2: Viajes con Retraso */}
        <TabsContent value="retrasos" className="space-y-4">
          {/* Delayed Trips Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Viajes con Retraso
                </CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{delayedTrips.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Promedio Dias Retraso
                </CardTitle>
                <Timer className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {delayedTrips.length > 0
                    ? (
                        delayedTrips.reduce((sum, t) => sum + t.daysDelayed, 0) / delayedTrips.length
                      ).toFixed(1)
                    : '0'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Monto Total Sugerido
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'USD' }).format(
                    delayedTrips.reduce((sum, t) => sum + t.suggestedFine, 0),
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Delayed Trips Table */}
          <div className="rounded-lg border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>MIC/DTA</TableHead>
                  <TableHead>Conductor</TableHead>
                  <TableHead className="text-center">Dias Retraso</TableHead>
                  <TableHead>Multa Sugerida</TableHead>
                  <TableHead>Accion Sugerida</TableHead>
                  <TableHead>Ofensas Previas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {delayedTrips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                      <p className="text-gray-500">No hay viajes con retraso pendientes</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  delayedTrips.map((trip) => (
                    <TableRow key={trip.tripId}>
                      <TableCell className="font-mono font-medium">{trip.micDta}</TableCell>
                      <TableCell className="font-medium">{trip.driverName}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={
                            trip.daysDelayed <= 5
                              ? 'bg-yellow-100 text-yellow-800'
                              : trip.daysDelayed <= 10
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-red-100 text-red-800'
                          }
                        >
                          {trip.daysDelayed} dias
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'USD' }).format(
                          trip.suggestedFine,
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            trip.suggestedAction === 'SUSPENSION'
                              ? 'bg-red-100 text-red-800'
                              : trip.suggestedAction === 'FINE'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {trip.suggestedAction === 'SUSPENSION'
                            ? 'Suspension'
                            : trip.suggestedAction === 'FINE'
                              ? 'Multa'
                              : 'Amonestacion'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {trip.existingOffenses > 0 ? (
                          <Badge variant="destructive" className="text-xs">
                            {trip.existingOffenses}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Generate Button */}
          {delayedTrips.length > 0 && (
            <div className="flex justify-end">
              <Button
                onClick={() => setIsGenerationModalOpen(true)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Zap className="mr-2 h-4 w-4" />
                Generar Sanciones Automaticas
              </Button>
            </div>
          )}
        </TabsContent>

        {/* TAB 3: Automatizacion */}
        <TabsContent value="automatizacion" className="space-y-4">
          {/* Config Card */}
          {sanctionConfig && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-5 w-5 text-[#1B3F66]" />
                  Configuracion de Automatizacion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Periodo de Gracia</p>
                    <p className="font-bold text-lg">{sanctionConfig.gracePeriodDays} dias</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Multa por Dia</p>
                    <p className="font-bold text-lg">
                      ${sanctionConfig.finePerDayUsd} USD
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Maximo Dias Multa</p>
                    <p className="font-bold text-lg">{sanctionConfig.maxFineDays} dias</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Monto Maximo Multa</p>
                    <p className="font-bold text-lg">
                      ${sanctionConfig.maxFineAmount} USD
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Suspension Maxima</p>
                    <p className="font-bold text-lg">
                      {sanctionConfig.suspensionThresholds.fifthPlus} dias
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500 mb-2">Umbrales de Suspension por Reincidencia</p>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="outline">1ra: {sanctionConfig.suspensionThresholds.first} dias</Badge>
                    <Badge variant="outline">2da: {sanctionConfig.suspensionThresholds.second} dias</Badge>
                    <Badge variant="outline">3ra: {sanctionConfig.suspensionThresholds.third} dias</Badge>
                    <Badge variant="outline">4ta: {sanctionConfig.suspensionThresholds.fourth} dias</Badge>
                    <Badge variant="outline">5ta+: {sanctionConfig.suspensionThresholds.fifthPlus} dias</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Automation Stats */}
          {automationStats && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Tasa de Automatizacion
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-[#1B3F66]" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {((automationStats.automationRate || 0) * 100).toFixed(0)}%
                    </div>
                    <Progress
                      value={(automationStats.automationRate || 0) * 100}
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {automationStats.totalAutomatic || 0} automaticas /{' '}
                      {automationStats.totalManual || 0} manuales
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Total Generado
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {new Intl.NumberFormat('es-BO', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(automationStats.totalAmountGenerated || 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Viajes Retrasados Pendientes
                    </CardTitle>
                    <Clock className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {automationStats.pendingDelayedTrips || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Promedio Dias Retraso
                    </CardTitle>
                    <Timer className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(automationStats.averageDaysDelayed || 0).toFixed(1)} dias
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* By Reason */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Sanciones por Razon
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(sanctionReasonConfig).map(([key, config]) => {
                        const count =
                          (automationStats.byReason as Record<string, number>)?.[key] || 0;
                        const total =
                          Object.values(
                            automationStats.byReason as Record<string, number>,
                          ).reduce((sum, v) => sum + v, 0) || 1;
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className={config.className}>{config.label}</Badge>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-24">
                                <Progress value={(count / total) * 100} className="h-2" />
                              </div>
                              <span className="text-sm font-medium w-8 text-right">{count}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Sanctioned Drivers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Conductores Mas Sancionados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {automationStats.topSanctionedDrivers &&
                    automationStats.topSanctionedDrivers.length > 0 ? (
                      <div className="space-y-3">
                        {automationStats.topSanctionedDrivers.slice(0, 5).map((driver, index) => (
                          <div
                            key={driver.driverId}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  index === 0
                                    ? 'bg-red-100 text-red-800'
                                    : index === 1
                                      ? 'bg-orange-100 text-orange-800'
                                      : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {index + 1}
                              </span>
                              <span className="text-sm font-medium">{driver.driverName}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">{driver.sanctionCount} sanciones</Badge>
                              <span className="text-sm text-gray-500">
                                ${driver.totalAmount.toFixed(0)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">Sin datos disponibles</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSanction ? 'Editar Sancion' : 'Nueva Sancion'}
            </DialogTitle>
            <DialogDescription>
              {editingSanction
                ? 'Modifica los datos de la sancion'
                : 'Registra una nueva sancion'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="driverId">Conductor *</Label>
              <Select name="driverId" defaultValue={editingSanction?.driverId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar conductor" />
                </SelectTrigger>
                <SelectContent>
                  {(driversData?.data || []).map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {getDriverName(driver)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select name="type" defaultValue={editingSanction?.type || 'WARNING'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeConfig).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sanctionReason">Razon de Sancion</Label>
                <Select
                  name="sanctionReason"
                  defaultValue={editingSanction?.sanctionReason || ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar razon" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(sanctionReasonConfig).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo *</Label>
              <Input
                id="reason"
                name="reason"
                defaultValue={editingSanction?.reason}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha de Inicio</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  defaultValue={editingSanction?.startDate?.split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Fecha de Fin</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  defaultValue={editingSanction?.endDate?.split('T')[0]}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Monto (BOB)</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  defaultValue={editingSanction?.amount || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="daysDelayed">Dias de Retraso</Label>
                <Input
                  id="daysDelayed"
                  name="daysDelayed"
                  type="number"
                  min="0"
                  defaultValue={editingSanction?.daysDelayed || ''}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="automatic"
                name="automatic"
                defaultChecked={editingSanction?.automatic || false}
                className="rounded border-gray-300"
              />
              <Label htmlFor="automatic" className="text-sm font-normal">
                Sancion automatica
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Input id="notes" name="notes" defaultValue={editingSanction?.notes || ''} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#1B3F66] hover:bg-[#0F2A47]"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingSanction ? 'Guardar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sanction Generation Modal */}
      <SanctionGenerationModal
        open={isGenerationModalOpen}
        onOpenChange={handleCloseGenerationModal}
        delayedTrips={delayedTrips}
        isGenerating={generateMutation.isPending && !previewResult}
        onGenerate={handleGenerateSanctions}
        preview={previewResult}
        isPreviewing={generateMutation.isPending && !previewResult}
      />
    </div>
  );
}
