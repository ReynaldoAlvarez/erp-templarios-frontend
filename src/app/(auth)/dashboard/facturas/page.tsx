'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import axios from 'axios';
import {
  Search, Plus, MoreHorizontal, Edit, Loader2, ChevronLeft, ChevronRight,
  Receipt, CheckCircle, Clock, XCircle, Send, DollarSign, Building, FileText,
  TrendingUp, CreditCard, AlertTriangle, Calculator, Info, Truck,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  useInvoices, useInvoiceStats, useClientes, useTrips,
  useCreateInvoice, useUpdateInvoice, useApproveInvoice, useMarkInvoicePaid, useCancelInvoice,
  useCalculateInvoiceFromTrips,
} from '@/hooks/use-queries';
import { Invoice, InvoiceStatus, InvoiceCalculation } from '@/types/api';

// Form schema
const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'El número de factura es requerido'),
  clientId: z.string().min(1, 'El cliente es requerido'),
  invoiceDate: z.string().optional(),
  totalAmount: z.number().min(0, 'El monto total es requerido'),
  amountUsd: z.number().optional(),
  exchangeRate: z.number().optional(),
  notes: z.string().optional(),
  tripIds: z.array(z.string()).optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

// Status config
const statusConfig: Record<InvoiceStatus, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING: { label: 'Pendiente', className: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock },
  ISSUED: { label: 'Emitida', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: Send },
  PAID: { label: 'Pagada', className: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
  CANCELLED: { label: 'Cancelada', className: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
};

// Helper
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (axios.isAxiosError(error)) return error.response?.data?.message || defaultMessage;
  return error instanceof Error ? error.message : defaultMessage;
};

// Format currency
const formatCurrency = (amount: number, currency: 'BOB' | 'USD' = 'BOB') => {
  return new Intl.NumberFormat('es-BO', { style: 'currency', currency }).format(amount);
};

// Format date
const formatDate = (date: string | undefined) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('es-BO');
};

export default function FacturasPage() {
  const { toast } = useToast();

  // State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);
  const [calculationResult, setCalculationResult] = useState<InvoiceCalculation | null>(null);
  const calculateInvoiceFromTrips = useCalculateInvoiceFromTrips();
  const isCalculating = calculateInvoiceFromTrips.isPending;
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Queries
  const { data: invoicesData, isLoading } = useInvoices({
    page,
    limit,
    status: statusFilter !== 'all' ? statusFilter as InvoiceStatus : undefined,
    clientId: clientFilter || undefined,
  });

  const { data: stats } = useInvoiceStats();

  const { data: clientes } = useClientes({ limit: 100 });

  const { data: trips } = useTrips({ status: 'DELIVERED', limit: 100 });

  // Mutations
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const approveInvoice = useApproveInvoice();
  const markInvoicePaid = useMarkInvoicePaid();
  const cancelInvoice = useCancelInvoice();

  // Forms
  const createForm = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: '', clientId: '', invoiceDate: new Date().toISOString().split('T')[0],
      totalAmount: 0, amountUsd: undefined, exchangeRate: 6.96, notes: '', tripIds: [],
    },
  });

  const editForm = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: '', clientId: '', invoiceDate: '',
      totalAmount: 0, amountUsd: undefined, exchangeRate: 6.96, notes: '', tripIds: [],
    },
  });

  // Handlers
  const handleCreate = (data: InvoiceFormData) => {
    createInvoice.mutate({
      invoiceNumber: data.invoiceNumber,
      clientId: data.clientId,
      invoiceDate: data.invoiceDate || new Date().toISOString(),
      totalAmount: data.totalAmount,
      amountUsd: data.amountUsd,
      exchangeRate: data.exchangeRate,
      notes: data.notes || undefined,
      tripIds: selectedTripIds,
    }, {
      onSuccess: () => {
        toast({ title: 'Factura creada', description: 'La factura ha sido creada exitosamente.' });
        setIsCreateOpen(false);
        createForm.reset();
      },
      onError: (error: unknown) => {
        toast({ variant: 'destructive', title: 'Error al crear', description: getErrorMessage(error, 'No se pudo crear la factura.') });
      },
    });
  };

  const handleEdit = (data: InvoiceFormData) => {
    if (!selectedInvoice) return;
    updateInvoice.mutate({
      id: selectedInvoice.id,
      data: {
        invoiceNumber: data.invoiceNumber,
        clientId: data.clientId,
        invoiceDate: data.invoiceDate,
        totalAmount: data.totalAmount,
        amountUsd: data.amountUsd,
        exchangeRate: data.exchangeRate,
        notes: data.notes,
      },
    }, {
      onSuccess: () => {
        toast({ title: 'Factura actualizada' });
        setIsEditOpen(false);
        setSelectedInvoice(null);
      },
      onError: (error: unknown) => {
        toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error, 'No se pudo actualizar.') });
      },
    });
  };

  const openEditDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    editForm.reset({
      invoiceNumber: invoice.invoiceNumber,
      clientId: invoice.clientId,
      invoiceDate: invoice.invoiceDate ? invoice.invoiceDate.split('T')[0] : '',
      totalAmount: invoice.totalAmount,
      amountUsd: invoice.amountUsd || undefined,
      exchangeRate: invoice.exchangeRate || 6.96,
      notes: invoice.notes || '',
      tripIds: invoice.invoiceTrips?.map(it => it.trip.id) || [],
    });
    setIsEditOpen(true);
  };

  // Toggle trip selection
  const toggleTripSelection = (tripId: string) => {
    setSelectedTripIds(prev => {
      if (prev.includes(tripId)) {
        return prev.filter(id => id !== tripId);
      }
      return [...prev, tripId];
    });
    setCalculationResult(null);
    setCalculationError(null);
  };

  // Helper handlers for inline mutations
  const handleApproveInvoice = (id: string) => {
    approveInvoice.mutate(id, {
      onSuccess: () => toast({ title: 'Factura emitida' }),
      onError: (error: unknown) => toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error, 'No se pudo emitir.') }),
    });
  };

  const handleMarkInvoicePaid = (id: string) => {
    markInvoicePaid.mutate(id, {
      onSuccess: () => toast({ title: 'Factura marcada como pagada' }),
      onError: (error: unknown) => toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error, 'No se pudo marcar como pagada.') }),
    });
  };

  const handleCancelInvoice = (id: string, reason: string) => {
    cancelInvoice.mutate({ id, reason }, {
      onSuccess: () => {
        toast({ title: 'Factura cancelada' });
        setIsCancelOpen(false);
        setSelectedInvoice(null);
        setCancelReason('');
      },
      onError: (error: unknown) => toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error, 'No se pudo cancelar.') }),
    });
  };

  // Handle calculate from trips
  const handleCalculateFromTrips = () => {
    if (selectedTripIds.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Seleccione al menos un viaje.' });
      return;
    }

    setCalculationError(null);
    calculateInvoiceFromTrips.mutate(selectedTripIds, {
      onSuccess: (result) => {
        setCalculationResult(result);

        // Check for validation issues
        if (!result.calculations.sameClient) {
          setCalculationError('Los viajes seleccionados pertenecen a diferentes clientes.');
        } else if (!result.calculations.allDelivered) {
          setCalculationError('No todos los viajes seleccionados están entregados (DELIVERED).');
        } else {
          // Auto-fill client and total amount
          createForm.setValue('clientId', result.clientId);
          createForm.setValue('totalAmount', result.subtotal);
          toast({ title: 'Cálculo completado', description: `Cliente: ${result.clientName}, Total: ${formatCurrency(result.subtotal)}` });
        }
      },
      onError: (error: unknown) => {
        const errorMsg = getErrorMessage(error, 'No se pudo calcular la factura.');
        setCalculationError(errorMsg);
        toast({ variant: 'destructive', title: 'Error al calcular', description: errorMsg });
      },
    });
  };

  // Pagination
  const totalPages = invoicesData?.pagination?.totalPages || 1;
  const totalItems = invoicesData?.pagination?.total || 0;
  const invoices = invoicesData?.data || [];
  const clientesList = clientes?.data || [];
  const tripsList = trips?.data || [];

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Facturas</h1>
          <p className="text-gray-500 mt-1">Gestión de facturación</p>
        </div>
        <Button className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" onClick={() => { createForm.reset(); setIsCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nueva Factura
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facturas</CardTitle>
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
            <CardTitle className="text-sm font-medium">Emitidas</CardTitle>
            <Send className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.byStatus?.ISSUED?.count || 0}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(stats?.byStatus?.ISSUED?.total || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cobrado</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats?.byStatus?.PAID?.total || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Buscar por número..." className="pl-10" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
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
            <Select value={clientFilter || 'all'} onValueChange={(v) => { setClientFilter(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder="Cliente" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {clientesList.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>{cliente.businessName}</SelectItem>
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
                      <TableHead>Número</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Viajes</TableHead>
                      <TableHead>Monto BOB</TableHead>
                      <TableHead>Monto USD</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">No se encontraron facturas</TableCell></TableRow>
                    ) : (
                      invoices.map((invoice) => {
                        const stConfig = statusConfig[invoice.status];
                        const StatusIcon = stConfig?.icon || Receipt;
                        return (
                          <TableRow key={invoice.id} className="hover:bg-gray-50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-[#1B3F66] flex items-center justify-center text-white">
                                  <Receipt className="h-4 w-4" />
                                </div>
                                <span className="font-medium">{invoice.invoiceNumber}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-gray-400" />
                                {invoice.client?.businessName || '-'}
                              </div>
                            </TableCell>
                            <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{invoice.tripsCount || invoice.invoiceTrips?.length || 0} viajes</Badge>
                            </TableCell>
                            <TableCell className="font-semibold">{formatCurrency(invoice.totalAmount)}</TableCell>
                            <TableCell>{invoice.amountUsd ? formatCurrency(invoice.amountUsd, 'USD') : '-'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={stConfig?.className}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {stConfig?.label || invoice.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditDialog(invoice)}><Edit className="h-4 w-4 mr-2" /> Editar</DropdownMenuItem>
                                  {invoice.status === 'PENDING' && (
                                    <DropdownMenuItem onClick={() => handleApproveInvoice(invoice.id)}>
                                      <Send className="h-4 w-4 mr-2" /> Emitir
                                    </DropdownMenuItem>
                                  )}
                                  {invoice.status === 'ISSUED' && (
                                    <DropdownMenuItem onClick={() => handleMarkInvoicePaid(invoice.id)}>
                                      <CheckCircle className="h-4 w-4 mr-2" /> Marcar Pagada
                                    </DropdownMenuItem>
                                  )}
                                  {invoice.status !== 'CANCELLED' && invoice.status !== 'PAID' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedInvoice(invoice); setIsCancelOpen(true); }}>
                                        <XCircle className="h-4 w-4 mr-2" /> Cancelar
                                      </DropdownMenuItem>
                                    </>
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
              {invoices.length > 0 && (
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
          setSelectedTripIds([]);
          setCalculationResult(null);
          setCalculationError(null);
        }
      }}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Factura</DialogTitle>
            <DialogDescription>Ingresa los datos de la factura</DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4 py-4">
            {/* Trip Selection Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Seleccionar Viajes</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleCalculateFromTrips}
                  disabled={isCalculating || selectedTripIds.length === 0}
                  className="bg-[#1B3F66]/10 hover:bg-[#1B3F66]/20 text-[#1B3F66] border-[#1B3F66]/30"
                >
                  {isCalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
                  <span className="ml-2">Calcular desde Viajes</span>
                </Button>
              </div>
              
              {selectedTripIds.length > 0 && (
                <p className="text-sm text-gray-500">{selectedTripIds.length} viaje(s) seleccionado(s)</p>
              )}
              
              <ScrollArea className="h-48 w-full rounded-md border">
                <div className="p-2 space-y-1">
                  {tripsList.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No hay viajes entregados disponibles</p>
                  ) : (
                    tripsList.map((trip) => (
                      <label 
                        key={trip.id} 
                        className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <Checkbox 
                          checked={selectedTripIds.includes(trip.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTripIds(prev => [...prev, trip.id]);
                            } else {
                              setSelectedTripIds(prev => prev.filter(id => id !== trip.id));
                            }
                            setCalculationResult(null);
                            setCalculationError(null);
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-sm truncate">{trip.micDta}</span>
                            {trip.billOfLading?.blNumber && (
                              <Badge variant="secondary" className="text-xs">{trip.billOfLading.blNumber}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{trip.driver?.fullName || `${trip.driver?.firstName || ''} ${trip.driver?.lastName || ''}`}</span>
                            <span>•</span>
                            <span>{trip.billOfLading?.client?.businessName || '-'}</span>
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Calculation Error */}
            {calculationError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{calculationError}</AlertDescription>
              </Alert>
            )}

            {/* Calculation Result */}
            {calculationResult && !calculationError && (
              <Alert className="bg-[#1B3F66]/5 border-[#1B3F66]/20">
                <Info className="h-4 w-4 text-[#1B3F66]" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium text-[#1B3F66]">Resumen del cálculo:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-gray-600">Cliente:</span>
                      <span className="font-medium">{calculationResult.clientName}</span>
                      <span className="text-gray-600">Viajes:</span>
                      <span className="font-medium">{calculationResult.calculations.tripCount}</span>
                      <span className="text-gray-600">Peso Total:</span>
                      <span className="font-medium">{calculationResult.totalWeight.toLocaleString('es-BO')} kg</span>
                      <span className="text-gray-600 font-semibold">Monto Total:</span>
                      <span className="font-bold text-[#1B3F66]">{formatCurrency(calculationResult.subtotal)}</span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Controller name="invoiceNumber" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Número de Factura *</Label>
                  <Input {...field} placeholder="FACT-001" className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="clientId" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Cliente *</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientesList.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>{cliente.businessName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
            </div>
            <Controller name="invoiceDate" control={createForm.control} render={({ field }) => (
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input {...field} type="date" />
              </div>
            )} />
            <div className="grid grid-cols-3 gap-4">
              <Controller name="totalAmount" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Monto BOB *</Label>
                  <Input {...field} type="number" step="0.01" value={field.value || ''} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="amountUsd" control={createForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Monto USD</Label>
                  <Input {...field} type="number" step="0.01" value={field.value || ''} onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)} />
                </div>
              )} />
              <Controller name="exchangeRate" control={createForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Tipo de Cambio</Label>
                  <Input {...field} type="number" step="0.01" value={field.value || ''} onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)} />
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
              <Button type="submit" className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" disabled={createInvoice.isPending}>
                {createInvoice.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Crear
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Factura</DialogTitle>
            <DialogDescription>Modifica los datos de la factura</DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Controller name="invoiceNumber" control={editForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Número de Factura</Label>
                  <Input {...field} />
                </div>
              )} />
              <Controller name="clientId" control={editForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {clientesList.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>{cliente.businessName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Controller name="totalAmount" control={editForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Monto BOB</Label>
                  <Input {...field} type="number" step="0.01" value={field.value || ''} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                </div>
              )} />
              <Controller name="amountUsd" control={editForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Monto USD</Label>
                  <Input {...field} type="number" step="0.01" value={field.value || ''} onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)} />
                </div>
              )} />
              <Controller name="exchangeRate" control={editForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Tipo de Cambio</Label>
                  <Input {...field} type="number" step="0.01" value={field.value || ''} onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)} />
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
              <Button type="submit" className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" disabled={updateInvoice.isPending}>
                {updateInvoice.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Cancelar Factura</DialogTitle>
            <DialogDescription>¿Está seguro de cancelar la factura {selectedInvoice?.invoiceNumber}?</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Motivo de cancelación *</Label>
              <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} placeholder="Ingrese el motivo..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCancelOpen(false); setCancelReason(''); }}>Cerrar</Button>
            <Button variant="destructive" onClick={() => { if (selectedInvoice && cancelReason) handleCancelInvoice(selectedInvoice.id, cancelReason); }} disabled={!cancelReason || cancelInvoice.isPending}>
              {cancelInvoice.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Cancelar Factura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
