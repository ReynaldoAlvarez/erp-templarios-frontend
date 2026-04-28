'use client';

import { useState, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import axios from 'axios';
import {
  Search, Plus, MoreHorizontal, Edit, Loader2, ChevronLeft, ChevronRight,
  DollarSign, FileText, Truck, User, Calendar, CheckCircle, Clock, Banknote,
  AlertTriangle, Calculator, TrendingUp, Receipt, Info,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  useSettlements, useSettlementStats, useTrips,
  useCreateSettlement, useUpdateSettlement, useApproveSettlement, useMarkSettlementPaid,
} from '@/hooks/use-queries';
import { settlementsApi } from '@/lib/api-client';
import { Settlement, SettlementStatus, SettlementCalculation } from '@/types/api';

// Form schema
const settlementSchema = z.object({
  tripId: z.string().min(1, 'El viaje es requerido'),
  freightUsd: z.number().min(0, 'El flete USD debe ser mayor o igual a 0'),
  freightBob: z.number().min(0, 'El flete BOB debe ser mayor o igual a 0'),
  exchangeRate: z.number().min(0, 'El tipo de cambio debe ser mayor a 0'),
  pricePerTon: z.number().min(0, 'El precio por tonelada es requerido'),
  taxIt3Percent: z.number().min(0, 'El IT 3% es requerido'),
  retention7Percent: z.number().min(0, 'La retención 7% es requerida'),
  externalCommission: z.number().optional(),
  advance: z.number().optional(),
  notes: z.string().optional(),
});

type SettlementFormData = z.infer<typeof settlementSchema>;

// Status config
const statusConfig: Record<SettlementStatus, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING: { label: 'Pendiente', className: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock },
  APPROVED: { label: 'Aprobada', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle },
  PAID: { label: 'Pagada', className: 'bg-green-50 text-green-700 border-green-200', icon: Banknote },
};

// Helper
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || defaultMessage;
  }
  return error instanceof Error ? error.message : defaultMessage;
};

// Format currency
const formatCurrency = (amount: number, currency: 'BOB' | 'USD' = 'BOB') => {
  return new Intl.NumberFormat('es-BO', { style: 'currency', currency }).format(amount);
};

export default function LiquidacionesPage() {
  const { toast } = useToast();

  // State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [calculationResult, setCalculationResult] = useState<SettlementCalculation | null>(null);

  // Queries
  const { data: settlementsData, isLoading } = useSettlements({
    page,
    limit,
    status: statusFilter !== 'all' ? statusFilter as SettlementStatus : undefined,
  });

  const { data: stats } = useSettlementStats();

  const { data: trips } = useTrips({ status: 'DELIVERED', limit: 100 });

  const [isCalculating, setIsCalculating] = useState(false);

  // Mutations
  const createSettlement = useCreateSettlement();
  const updateSettlement = useUpdateSettlement();
  const approveSettlement = useApproveSettlement();
  const markSettlementPaid = useMarkSettlementPaid();

  // Forms
  const createForm = useForm<SettlementFormData>({
    resolver: zodResolver(settlementSchema),
    defaultValues: {
      tripId: '', freightUsd: 0, freightBob: 0, exchangeRate: 6.96,
      pricePerTon: 0, taxIt3Percent: 0, retention7Percent: 0,
      externalCommission: 0, advance: 0, notes: '',
    },
  });

  const editForm = useForm<SettlementFormData>({
    resolver: zodResolver(settlementSchema),
    defaultValues: {
      tripId: '', freightUsd: 0, freightBob: 0, exchangeRate: 6.96,
      pricePerTon: 0, taxIt3Percent: 0, retention7Percent: 0,
      externalCommission: 0, advance: 0, notes: '',
    },
  });

  // Calculate settlement from trip (imperative to avoid setState-in-effect lint issue)
  const handleCalculate = useCallback(async (tripId: string) => {
    setIsCalculating(true);
    try {
      const result = await settlementsApi.calculateFromTrip(tripId);
      setCalculationResult(result as any);
      createForm.setValue('freightBob', (result as any).grossAmount);
      createForm.setValue('taxIt3Percent', (result as any).itAmount);
      createForm.setValue('retention7Percent', (result as any).retentionAmount);
      toast({ title: 'Cálculo completado', description: 'Los valores han sido auto-completados.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error al calcular', description: getErrorMessage(error, 'No se pudo calcular la liquidación.') });
    } finally {
      setIsCalculating(false);
    }
  }, [createForm, toast]);

  // Handlers
  const handleCreate = (data: SettlementFormData) => {
    createSettlement.mutate({
      ...data,
      externalCommission: data.externalCommission || 0,
      advance: data.advance || 0,
      notes: data.notes || undefined,
    }, {
      onSuccess: () => {
        toast({ title: 'Liquidación creada', description: 'La liquidación ha sido creada exitosamente.' });
        setIsCreateOpen(false);
        createForm.reset();
      },
      onError: (error: unknown) => {
        toast({ variant: 'destructive', title: 'Error al crear', description: getErrorMessage(error, 'No se pudo crear la liquidación.') });
      },
    });
  };

  const handleEdit = (data: SettlementFormData) => {
    if (!selectedSettlement) return;
    updateSettlement.mutate({
      id: selectedSettlement.id,
      data: {
        freightUsd: data.freightUsd,
        freightBob: data.freightBob,
        exchangeRate: data.exchangeRate,
        pricePerTon: data.pricePerTon,
        taxIt3Percent: data.taxIt3Percent,
        retention7Percent: data.retention7Percent,
        externalCommission: data.externalCommission,
        advance: data.advance,
        notes: data.notes,
      },
    }, {
      onSuccess: () => {
        toast({ title: 'Liquidación actualizada' });
        setIsEditOpen(false);
        setSelectedSettlement(null);
      },
      onError: (error: unknown) => {
        toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error, 'No se pudo actualizar.') });
      },
    });
  };

  const openEditDialog = (settlement: Settlement) => {
    setSelectedSettlement(settlement);
    editForm.reset({
      tripId: settlement.tripId,
      freightUsd: settlement.freightUsd,
      freightBob: settlement.freightBob,
      exchangeRate: settlement.exchangeRate,
      pricePerTon: settlement.pricePerTon,
      taxIt3Percent: settlement.taxIt3Percent,
      retention7Percent: settlement.retention7Percent,
      externalCommission: settlement.externalCommission || 0,
      advance: settlement.advance,
      notes: settlement.notes || '',
    });
    setIsEditOpen(true);
  };

  // Handle calculate from trip
  const handleCalculateFromTrip = () => {
    const tripId = createForm.getValues('tripId');
    if (!tripId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Seleccione un viaje primero.' });
      return;
    }
    handleCalculate(tripId);
  };

  // Pagination
  const totalPages = settlementsData?.pagination?.totalPages || 1;
  const totalItems = settlementsData?.pagination?.total || 0;
  const settlements = settlementsData?.data || [];
  const tripsList = trips?.data || [];

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Liquidaciones</h1>
          <p className="text-gray-500 mt-1">Gestión de liquidaciones de viajes</p>
        </div>
        <Button className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" onClick={() => { createForm.reset(); setIsCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nueva Liquidación
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Liquidaciones</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1B3F66]">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.byStatus?.PENDING?.count || 0}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(stats?.byStatus?.PENDING?.total || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.byStatus?.APPROVED?.count || 0}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(stats?.byStatus?.APPROVED?.total || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats?.totals?.netPayment || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Buscar por MIC/DTA..." className="pl-10" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(statusConfig).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-[#1B3F66]" /></div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Viaje (MIC/DTA)</TableHead>
                      <TableHead>Conductor</TableHead>
                      <TableHead>Flete BOB</TableHead>
                      <TableHead>Retención</TableHead>
                      <TableHead>Anticipo</TableHead>
                      <TableHead>Pago Neto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settlements.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">No se encontraron liquidaciones</TableCell></TableRow>
                    ) : (
                      settlements.map((settlement) => {
                        const stConfig = statusConfig[settlement.status];
                        const StatusIcon = stConfig?.icon || Receipt;
                        return (
                          <TableRow key={settlement.id} className="hover:bg-gray-50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{settlement.trip?.micDta || '-'}</span>
                              </div>
                            </TableCell>
                            <TableCell>{settlement.trip?.driver?.firstName || ''} {settlement.trip?.driver?.lastName || ''}</TableCell>
                            <TableCell className="font-semibold">{formatCurrency(settlement.freightBob)}</TableCell>
                            <TableCell>{formatCurrency(settlement.retention7Percent)}</TableCell>
                            <TableCell>{formatCurrency(settlement.advance)}</TableCell>
                            <TableCell className="font-bold text-[#1B3F66]">{formatCurrency(settlement.netPayment)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={stConfig?.className}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {stConfig?.label || settlement.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditDialog(settlement)}><Edit className="h-4 w-4 mr-2" /> Editar</DropdownMenuItem>
                                  {settlement.status === 'PENDING' && (
                                    <DropdownMenuItem onClick={() => approveSettlement.mutate(settlement.id, {
                                      onSuccess: () => toast({ title: 'Liquidación aprobada' }),
                                      onError: (error: unknown) => toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error, 'No se pudo aprobar.') }),
                                    })}>
                                      <CheckCircle className="h-4 w-4 mr-2" /> Aprobar
                                    </DropdownMenuItem>
                                  )}
                                  {settlement.status === 'APPROVED' && (
                                    <DropdownMenuItem onClick={() => markSettlementPaid.mutate(settlement.id, {
                                      onSuccess: () => toast({ title: 'Liquidación pagada' }),
                                      onError: (error: unknown) => toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error, 'No se pudo marcar como pagada.') }),
                                    })}>
                                      <Banknote className="h-4 w-4 mr-2" /> Marcar Pagada
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination */}
              {settlements.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-gray-500">Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, totalItems)} de {totalItems}</div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setPage(page - 1)} disabled={page <= 1}><ChevronLeft className="h-4 w-4" /></Button>
                    <div className="text-sm">Página {page} de {totalPages}</div>
                    <Button variant="outline" size="icon" onClick={() => setPage(page + 1)} disabled={page >= totalPages}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => { 
        setIsCreateOpen(open); 
        if (!open) {
          setCalculationResult(null);
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Liquidación</DialogTitle>
            <DialogDescription>Ingresa los datos de la liquidación</DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4 py-4">
            <Controller name="tripId" control={createForm.control} render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label>Viaje *</Label>
                <div className="flex gap-2">
                  <Select value={field.value} onValueChange={(value) => { field.onChange(value); setCalculationResult(null); }}>
                    <SelectTrigger className={`flex-1 ${fieldState.invalid ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Seleccionar viaje" />
                    </SelectTrigger>
                    <SelectContent>
                      {tripsList.map((trip) => (
                        <SelectItem key={trip.id} value={trip.id}>{trip.micDta} - {trip.billOfLading?.blNumber}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCalculateFromTrip}
                    disabled={isCalculating || !field.value}
                    className="shrink-0"
                  >
                    {isCalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
                    <span className="ml-2 hidden sm:inline">Calcular</span>
                  </Button>
                </div>
                {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
              </div>
            )} />
            
            {/* Calculation Preview */}
            {calculationResult && (
              <Alert className="bg-[#1B3F66]/5 border-[#1B3F66]/20">
                <Info className="h-4 w-4 text-[#1B3F66]" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium text-[#1B3F66]">Vista previa del cálculo:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-gray-600">Monto Bruto:</span>
                      <span className="font-medium">{formatCurrency(calculationResult.grossAmount)}</span>
                      <span className="text-gray-600">IT 3%:</span>
                      <span className="font-medium">{formatCurrency(calculationResult.itAmount)}</span>
                      <span className="text-gray-600">Retención 7%:</span>
                      <span className="font-medium">{formatCurrency(calculationResult.retentionAmount)}</span>
                      <span className="text-gray-600 font-semibold">Pago Neto:</span>
                      <span className="font-bold text-[#1B3F66]">{formatCurrency(calculationResult.netAmount)}</span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-3 gap-4">
              <Controller name="freightUsd" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Flete USD</Label>
                  <Input {...field} type="number" step="0.01" value={field.value || ''} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="freightBob" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Flete BOB</Label>
                  <Input {...field} type="number" step="0.01" value={field.value || ''} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                </div>
              )} />
              <Controller name="exchangeRate" control={createForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Tipo de Cambio</Label>
                  <Input {...field} type="number" step="0.01" value={field.value || ''} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                </div>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Controller name="pricePerTon" control={createForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Precio/Tonelada</Label>
                  <Input {...field} type="number" step="0.01" value={field.value || ''} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                </div>
              )} />
              <Controller name="taxIt3Percent" control={createForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>IT 3%</Label>
                  <Input {...field} type="number" step="0.01" value={field.value || ''} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                </div>
              )} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Controller name="retention7Percent" control={createForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Retención 7%</Label>
                  <Input {...field} type="number" step="0.01" value={field.value || ''} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                </div>
              )} />
              <Controller name="externalCommission" control={createForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Comisión Ext.</Label>
                  <Input {...field} type="number" step="0.01" value={field.value || ''} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                </div>
              )} />
              <Controller name="advance" control={createForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Anticipo</Label>
                  <Input {...field} type="number" step="0.01" value={field.value || ''} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                </div>
              )} />
            </div>
            <Controller name="notes" control={createForm.control} render={({ field }) => (
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea {...field} rows={2} />
              </div>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" disabled={createSettlement.isPending}>
                {createSettlement.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Crear
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Liquidación</DialogTitle>
            <DialogDescription>Modifica los datos de la liquidación</DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <Controller name="freightUsd" control={editForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Flete USD</Label>
                  <Input {...field} type="number" step="0.01" value={field.value || ''} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                </div>
              )} />
              <Controller name="freightBob" control={editForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Flete BOB</Label>
                  <Input {...field} type="number" step="0.01" value={field.value || ''} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                </div>
              )} />
              <Controller name="exchangeRate" control={editForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Tipo de Cambio</Label>
                  <Input {...field} type="number" step="0.01" value={field.value || ''} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                </div>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Controller name="pricePerTon" control={editForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Precio/Tonelada</Label>
                  <Input {...field} type="number" step="0.01" value={field.value || ''} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                </div>
              )} />
              <Controller name="taxIt3Percent" control={editForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>IT 3%</Label>
                  <Input {...field} type="number" step="0.01" value={field.value || ''} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                </div>
              )} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Controller name="retention7Percent" control={editForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Retención 7%</Label>
                  <Input {...field} type="number" step="0.01" value={field.value || ''} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                </div>
              )} />
              <Controller name="externalCommission" control={editForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Comisión Ext.</Label>
                  <Input {...field} type="number" step="0.01" value={field.value || ''} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                </div>
              )} />
              <Controller name="advance" control={editForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Anticipo</Label>
                  <Input {...field} type="number" step="0.01" value={field.value || ''} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                </div>
              )} />
            </div>
            <Controller name="notes" control={editForm.control} render={({ field }) => (
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea {...field} rows={2} />
              </div>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" disabled={updateSettlement.isPending}>
                {updateSettlement.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
