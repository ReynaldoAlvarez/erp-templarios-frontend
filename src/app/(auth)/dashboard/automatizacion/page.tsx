'use client';

import { useState, useCallback } from 'react';
import {
  Search,
  Settings2,
  FileCheck,
  Truck,
  BarChart3,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Zap,
  Loader2,
  ListChecks,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripsApi, documentAutomationApi } from '@/lib/api-client';
import { DocumentChecklist } from '@/components/sprint5/DocumentChecklist';
import type {
  Trip,
  DocumentAutomationStats,
  DocumentChecklistResponse,
  TripStatus,
} from '@/types/api';

// Helper to extract error message
function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'Error en la operación';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Error inesperado';
}

import axios from 'axios';

// Trip status configuration
const tripStatusConfig: Record<TripStatus, { label: string; color: string; bgColor: string }> = {
  SCHEDULED: { label: 'Programado', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  IN_TRANSIT: { label: 'En Tránsito', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  AT_BORDER: { label: 'En Frontera', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  DELIVERED: { label: 'Entregado', color: 'text-green-700', bgColor: 'bg-green-100' },
  CANCELLED: { label: 'Cancelado', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export default function AutomatizacionPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);
  const limit = 10;

  // Fetch automation stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['document-automation', 'stats'],
    queryFn: () => documentAutomationApi.getStats(),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch trips list
  const { data: tripsData, isLoading: tripsLoading } = useQuery({
    queryKey: ['trips', 'automation', { search: searchQuery, status: statusFilter, page, limit }],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, limit };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
      return tripsApi.getAll(params as Parameters<typeof tripsApi.getAll>[0]);
    },
  });

  // Fetch checklist for selected trip
  const { data: checklist, isLoading: checklistLoading, refetch: refetchChecklist } = useQuery({
    queryKey: ['document-automation', 'checklist', selectedTripId],
    queryFn: () => documentAutomationApi.getChecklist(selectedTripId!),
    enabled: !!selectedTripId,
  });

  // Create documents for trip mutation
  const createDocsMutation = useMutation({
    mutationFn: ({ tripId, documentTypeIds }: { tripId: string; documentTypeIds?: string[] }) =>
      documentAutomationApi.createDocumentsForTrip(tripId, documentTypeIds),
    onSuccess: () => {
      toast({ title: 'Documentos generados', description: 'Se crearon los documentos pendientes exitosamente.' });
      queryClient.invalidateQueries({ queryKey: ['document-automation'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      refetchChecklist();
    },
    onError: (error) => {
      toast({ title: 'Error', description: getErrorMessage(error), variant: 'destructive' });
    },
  });

  // Batch create documents mutation
  const batchCreateMutation = useMutation({
    mutationFn: (tripIds: string[]) =>
      documentAutomationApi.batchCreateDocuments({ tripIds }),
    onSuccess: (data) => {
      toast({
        title: 'Generación en lote completada',
        description: `Se procesaron ${data.processed} viajes y se crearon ${data.totalCreated} documentos.`,
      });
      queryClient.invalidateQueries({ queryKey: ['document-automation'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setBatchDialogOpen(false);
      setSelectedTripIds([]);
    },
    onError: (error) => {
      toast({ title: 'Error en lote', description: getErrorMessage(error), variant: 'destructive' });
    },
  });

  // Toggle trip selection for batch
  const toggleTripSelection = useCallback((tripId: string) => {
    setSelectedTripIds((prev) =>
      prev.includes(tripId) ? prev.filter((id) => id !== tripId) : [...prev, tripId]
    );
  }, []);

  // Handle filters reset
  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setPage(1);
  };

  const trips = tripsData?.data || [];
  const pagination = tripsData?.pagination;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Automatización de Documentos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona la generación automática de documentos por viaje
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedTripIds.length > 0 && (
            <Button
              onClick={() => setBatchDialogOpen(true)}
              className="bg-[#1B3F66] hover:bg-[#1B3F66]/90 text-white"
            >
              <Zap className="h-4 w-4 mr-2" />
              Generar en Lote ({selectedTripIds.length})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['document-automation'] });
              queryClient.invalidateQueries({ queryKey: ['trips'] });
            }}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : stats ? (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Truck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Viajes</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalTrips}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <FileCheck className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Docs Completos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.tripsWithCompleteDocs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Docs Incompletos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.tripsWithIncompleteDocs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pagos Bloqueados</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.tripsWithBlockedPayments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* Main Content: Trip List + Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trip List */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ListChecks className="h-5 w-5" />
                  Viajes
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Limpiar filtros
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por MIC/DTA..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los estados</SelectItem>
                    <SelectItem value="SCHEDULED">Programado</SelectItem>
                    <SelectItem value="IN_TRANSIT">En Tránsito</SelectItem>
                    <SelectItem value="AT_BORDER">En Frontera</SelectItem>
                    <SelectItem value="DELIVERED">Entregado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Trips Table */}
              {tripsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                  ))}
                </div>
              ) : trips.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm">No se encontraron viajes</p>
                  <p className="text-gray-400 text-xs mt-1">Intenta ajustar los filtros de búsqueda</p>
                </div>
              ) : (
                <>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="w-10">
                            <input
                              type="checkbox"
                              checked={selectedTripIds.length === trips.length && trips.length > 0}
                              onChange={(e) =>
                                setSelectedTripIds(e.target.checked ? trips.map((t) => t.id) : [])
                              }
                              className="rounded border-gray-300"
                            />
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-gray-600">MIC/DTA</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-600">Camión</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-600">Conductor</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-600">Fecha</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-600">Estado</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-600">Docs</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-600 w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trips.map((trip) => {
                          const statusConf = tripStatusConfig[trip.status];
                          const isSelected = selectedTripId === trip.id;
                          return (
                            <TableRow
                              key={trip.id}
                              className={`cursor-pointer transition-colors ${
                                isSelected ? 'bg-blue-50 border-l-4 border-l-[#1B3F66]' : 'hover:bg-gray-50'
                              }`}
                              onClick={() => setSelectedTripId(trip.id)}
                            >
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={selectedTripIds.includes(trip.id)}
                                  onChange={(e) => { e.stopPropagation(); toggleTripSelection(trip.id); }}
                                  className="rounded border-gray-300"
                                />
                              </TableCell>
                              <TableCell className="font-mono text-sm font-medium text-gray-900">
                                {trip.micDta}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {trip.truck?.plateNumber || '-'}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {trip.driver?.fullName || trip.driver?.employee?.firstName
                                  ? `${trip.driver.employee?.firstName || ''} ${trip.driver.employee?.lastName || ''}`.trim() || trip.driver?.fullName
                                  : '-'}
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {trip.departureDate ? new Date(trip.departureDate).toLocaleDateString('es-BO') : '-'}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`${statusConf.bgColor} ${statusConf.color} text-[10px] font-medium border-0 px-2 py-0.5`}
                                >
                                  {statusConf.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                {trip.documentsCount !== undefined ? (
                                  trip.documentsCount > 0 ? (
                                    <span className="flex items-center gap-1 text-green-600">
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      {trip.documentsCount}
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-yellow-600">
                                      <Clock className="h-3.5 w-3.5" />
                                      0
                                    </span>
                                  )
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-[#1B3F66] hover:text-[#1B3F66]/80 hover:bg-[#1B3F66]/5 p-1 h-7"
                                  onClick={(e) => { e.stopPropagation(); setSelectedTripId(trip.id); }}
                                >
                                  <Settings2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-sm text-gray-500">
                        Mostrando {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!pagination.hasPrev}
                          onClick={() => setPage((p) => p - 1)}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm px-2">{pagination.page} / {pagination.totalPages}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!pagination.hasNext}
                          onClick={() => setPage((p) => p + 1)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Checklist Panel */}
        <div className="space-y-4">
          {selectedTripId ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Checklist</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTripId(null)}
                  className="text-gray-500"
                >
                  Cerrar
                </Button>
              </div>
              <DocumentChecklist
                data={checklist}
                isLoading={checklistLoading}
                onCreateDocuments={() => {
                  if (selectedTripId) {
                    createDocsMutation.mutate({ tripId: selectedTripId });
                  }
                }}
                isCreating={createDocsMutation.isPending}
              />
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <ListChecks className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Selecciona un Viaje</h3>
                <p className="text-sm text-gray-500">
                  Haz clic en un viaje de la tabla para ver y gestionar su checklist de documentos
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick Info Card */}
          <Card className="bg-[#1B3F66] text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4" />
                <h4 className="text-sm font-semibold">Acerca de la Automatización</h4>
              </div>
              <p className="text-xs text-blue-100 leading-relaxed">
                La automatización genera documentos requeridos basándose en los Tipos de Documento configurados. 
                Los camiones de soporte incluyen adicionalmente el documento FACTURA.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Batch Create Confirmation Dialog */}
      <AlertDialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generar Documentos en Lote</AlertDialogTitle>
            <AlertDialogDescription>
              Se generarán los documentos pendientes para <strong>{selectedTripIds.length}</strong> viaje(s) seleccionado(s).
              Esta operación creará los documentos que falten según la configuración de Tipos de Documento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBatchDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => batchCreateMutation.mutate(selectedTripIds)}
              disabled={batchCreateMutation.isPending}
              className="bg-[#1B3F66] hover:bg-[#1B3F66]/90"
            >
              {batchCreateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                'Confirmar Generación'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
