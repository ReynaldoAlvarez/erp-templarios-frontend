'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import {
  Table2, Search, Filter, Download, RefreshCw, ChevronLeft, ChevronRight,
  Eye, Trash2, RotateCcw, FileCheck, Lock, CheckCircle2, Clock, DollarSign,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import {
  useTripReports, useTripReportsStats, useGenerateMissingTripReports,
  useRegenerateTripReport, useDeleteTripReport,
} from '@/hooks/use-queries';
import { tripReportsApi } from '@/lib/api-client';
import type { TripReportsSnapshot } from '@/types/api';

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message;
  }
  return error instanceof Error ? error.message : 'Error desconocido';
};

const formatUSD = (value: string | number | null | undefined): string => {
  if (!value) return '$0.00';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
};

export default function ReportesViajesPage() {
  const { toast } = useToast();

  // State
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [docsFilter, setDocsFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TripReportsSnapshot | null>(null);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    const timer = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Queries
  const queryParams = {
    page,
    limit: 15,
    search: debouncedSearch || undefined,
    paymentStatus: paymentFilter !== 'all' ? paymentFilter as 'pending' | 'partial' | 'paid' : undefined,
    documentsComplete: docsFilter === 'complete' ? true : docsFilter === 'incomplete' ? false : undefined,
  };

  const { data: reportsData, isLoading, refetch } = useTripReports(queryParams);
  const { data: stats, isLoading: statsLoading } = useTripReportsStats();
  const generateMissingMutation = useGenerateMissingTripReports();
  const regenerateMutation = useRegenerateTripReport();
  const deleteMutation = useDeleteTripReport();

  const reports = reportsData?.data || [];
  const pagination = reportsData?.pagination;

  // Handlers
  const handleGenerateMissing = () => {
    generateMissingMutation.mutate(undefined, {
      onSuccess: (result) => {
        toast({
          title: 'Reportes generados',
          description: `Se generaron ${result.generated} reportes faltantes exitosamente.`,
        });
        refetch();
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: getErrorMessage(error),
          variant: 'destructive',
        });
      },
    });
  };

  const handleRegenerate = (id: string) => {
    regenerateMutation.mutate(id, {
      onSuccess: () => {
        toast({ title: 'Regenerado', description: 'El reporte se ha regenerado desde el viaje.' });
      },
      onError: (error) => {
        toast({ title: 'Error', description: getErrorMessage(error), variant: 'destructive' });
      },
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast({ title: 'Eliminado', description: 'El reporte ha sido eliminado.' });
        setDeleteDialogOpen(false);
        setDeleteTarget(null);
      },
      onError: (error) => {
        toast({ title: 'Error', description: getErrorMessage(error), variant: 'destructive' });
      },
    });
  };

  const handleExportCSV = async () => {
    try {
      const allData: TripReportsSnapshot[] = [];
      let currentPage = 1;
      let totalPages = 1;
      while (currentPage <= totalPages) {
        const result = await tripReportsApi.getAll({
          page: currentPage,
          limit: 100,
          search: debouncedSearch || undefined,
          paymentStatus: paymentFilter !== 'all' ? paymentFilter as 'pending' | 'partial' | 'paid' : undefined,
          documentsComplete: docsFilter === 'complete' ? true : docsFilter === 'incomplete' ? false : undefined,
        });
        allData.push(...result.data);
        totalPages = result.pagination.totalPages;
        currentPage++;
      }

      const headers = [
        'Linea', 'MIC/DTA', 'BL', 'Cliente', 'NIT', 'Origen', 'Destino',
        'Conductor', 'CI', 'Camion', 'Remolque', 'Apoyo', 'Peso(Kg)', 'Unidades',
        'Flete(USD)', 'Retencion(%)', 'Retencion(USD)', 'Neto(USD)',
        'DocsCompletos', 'DocsPendientes', 'DocsFaltantes', 'PagoBloqueado', 'EstadoPago',
      ];
      const rows = allData.map(r => [
        r.lineNumber, r.micDta, r.blNumber, r.clientName, r.clientNit || '',
        r.origin, r.destination, r.driverName, r.driverCi, r.truckPlate,
        r.trailerPlate || '', r.isSupportTruck ? 'Si' : 'No',
        r.weightKg, r.unitCount, r.freightAmount, r.retentionPercent,
        r.retentionAmount, r.netAmount,
        r.documentsComplete ? 'Si' : 'No', r.documentsPending,
        r.missingDocuments || '', r.isPaymentBlocked ? 'Si' : 'No', r.paymentStatus,
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reportes-viajes-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Exportado', description: 'Archivo CSV descargado exitosamente.' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo exportar el archivo CSV.', variant: 'destructive' });
    }
  };

  const paymentStatusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    pending: { label: 'Pendiente', color: 'text-yellow-700', bgColor: 'bg-yellow-100 border-yellow-300' },
    partial: { label: 'Parcial', color: 'text-blue-700', bgColor: 'bg-blue-100 border-blue-300' },
    paid: { label: 'Pagado', color: 'text-green-700', bgColor: 'bg-green-100 border-green-300' },
  };

  // Stats cards
  const statsCards = [
    { title: 'Total Reportes', value: stats?.total ?? 0, icon: Table2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Docs Completos', value: stats?.complete ?? 0, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Docs Incompletos', value: stats?.incomplete ?? 0, icon: FileCheck, color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Pagos Bloqueados', value: stats?.blockedPayments ?? 0, icon: Lock, color: 'text-red-600', bg: 'bg-red-50' },
    { title: 'Pagos Pendientes', value: stats?.pendingPayments ?? 0, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { title: 'Pagos Parciales', value: stats?.partialPayments ?? 0, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Pagos Completados', value: stats?.paidPayments ?? 0, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Flete Total', value: formatUSD(stats?.totalFreight), icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <TooltipProvider>
      <div className="p-4 md:p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#1B3F66]">
              <Table2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reportes de Viajes</h1>
              <p className="text-sm text-gray-500">Snapshots de viajes con estado de documentos y pagos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
            <Button
              size="sm"
              onClick={handleGenerateMissing}
              disabled={generateMissingMutation.isPending}
              className="gap-2 bg-[#1B3F66] hover:bg-[#15305a]"
            >
              <RefreshCw className={`h-4 w-4 ${generateMissingMutation.isPending ? 'animate-spin' : ''}`} />
              Generar Faltantes
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {statsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-20 w-full rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statsCards.map((card) => (
              <Card key={card.title}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.title}</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">{card.value}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${card.bg}`}>
                      <card.icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por MIC/DTA, cliente, BL, destino..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Estado Pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los Pagos</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="partial">Parcial</SelectItem>
                    <SelectItem value="paid">Pagado</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={docsFilter} onValueChange={(v) => { setDocsFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Estado Docs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los Docs</SelectItem>
                    <SelectItem value="complete">Completos</SelectItem>
                    <SelectItem value="incomplete">Incompletos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="w-[50px] text-center text-xs font-semibold text-gray-600">Ln</TableHead>
                    <TableHead className="min-w-[130px] text-xs font-semibold text-gray-600">MIC/DTA</TableHead>
                    <TableHead className="min-w-[120px] text-xs font-semibold text-gray-600">BL</TableHead>
                    <TableHead className="min-w-[180px] text-xs font-semibold text-gray-600">Cliente</TableHead>
                    <TableHead className="min-w-[160px] text-xs font-semibold text-gray-600">Ruta</TableHead>
                    <TableHead className="min-w-[140px] text-xs font-semibold text-gray-600">Conductor</TableHead>
                    <TableHead className="min-w-[90px] text-xs font-semibold text-gray-600">Camion</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-gray-600">Peso(Kg)</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-gray-600">Flete(USD)</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-gray-600">Ret.(%)</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-gray-600">Ret.(USD)</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-gray-600">Neto(USD)</TableHead>
                    <TableHead className="text-center text-xs font-semibold text-gray-600">Docs</TableHead>
                    <TableHead className="text-center text-xs font-semibold text-gray-600">Pago</TableHead>
                    <TableHead className="text-center text-xs font-semibold text-gray-600 w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 15 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={15} className="text-center py-12 text-gray-500">
                        <Table2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-lg font-medium">No se encontraron reportes</p>
                        <p className="text-sm">Ajusta los filtros o genera reportes faltantes</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.map((report) => {
                      const payConf = paymentStatusConfig[report.paymentStatus] || paymentStatusConfig.pending;
                      return (
                        <TableRow key={report.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <TableCell className="text-center text-sm text-gray-600 font-mono">{report.lineNumber}</TableCell>
                          <TableCell>
                            <div className="text-sm font-medium text-gray-900">{report.micDta}</div>
                            {report.isSupportTruck && (
                              <Badge variant="outline" className="mt-0.5 text-[10px] border-purple-300 text-purple-700 bg-purple-50">
                                Apoyo
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 font-mono">{report.blNumber}</TableCell>
                          <TableCell className="text-sm text-gray-900 font-medium">{report.clientName}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            <span>{report.origin}</span>
                            <span className="mx-1 text-gray-400">&rarr;</span>
                            <span>{report.destination}</span>
                          </TableCell>
                          <TableCell className="text-sm text-gray-700">{report.driverName}</TableCell>
                          <TableCell className="text-sm text-gray-600 font-mono">{report.truckPlate}</TableCell>
                          <TableCell className="text-right text-sm text-gray-700 font-mono">{report.weightKg}</TableCell>
                          <TableCell className="text-right text-sm text-gray-900 font-mono">{formatUSD(report.freightAmount)}</TableCell>
                          <TableCell className="text-right text-sm text-gray-600 font-mono">{report.retentionPercent}%</TableCell>
                          <TableCell className="text-right text-sm text-gray-700 font-mono">{formatUSD(report.retentionAmount)}</TableCell>
                          <TableCell className="text-right text-sm text-gray-900 font-mono font-semibold">{formatUSD(report.netAmount)}</TableCell>
                          <TableCell className="text-center">
                            {report.documentsComplete ? (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-200 cursor-default">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    OK
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>Documentos completos</TooltipContent>
                              </Tooltip>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge className="bg-red-100 text-red-700 border-red-300 hover:bg-red-200 cursor-default">
                                    <FileCheck className="h-3 w-3 mr-1" />
                                    {report.documentsPending}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {report.missingDocuments
                                    ? `Faltantes: ${report.missingDocuments}`
                                    : `${report.documentsPending} pendiente(s)`}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <Badge className={`${payConf.bgColor} ${payConf.color} border hover:opacity-80 cursor-default`}>
                                {payConf.label}
                              </Badge>
                              {report.isPaymentBlocked && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Lock className="h-3 w-3 text-red-500 mt-0.5" />
                                  </TooltipTrigger>
                                  <TooltipContent>Pago bloqueado por documentos incompletos</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                    onClick={() => handleRegenerate(report.id)}
                                    disabled={regenerateMutation.isPending}
                                  >
                                    <RotateCcw className={`h-3.5 w-3.5 ${regenerateMutation.isPending && regenerateMutation.variables === report.id ? 'animate-spin' : ''}`} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Regenerar desde viaje</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                                    onClick={() => { setDeleteTarget(report); setDeleteDialogOpen(true); }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Eliminar reporte</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-gray-600">
                  Mostrando {(pagination.page - 1) * pagination.limit + 1} a{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                  {pagination.total} registros
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrev}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    Pagina {pagination.page} de {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={!pagination.hasNext}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar Reporte de Viaje</AlertDialogTitle>
              <AlertDialogDescription>
                Esta accion eliminara el reporte <strong>{deleteTarget?.micDta}</strong> del viaje con BL{' '}
                <strong>{deleteTarget?.blNumber}</strong>. Esta accion no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
