'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  usePayments,
  usePaymentStats,
  useCreatePayment,
  useUpdatePayment,
  useApprovePayment,
  useCompletePayment,
  useCancelPayment,
  useDeletePayment,
  useDriversList,
  useTrips,
} from '@/hooks/use-queries';
import { PaymentType, PaymentStatus, PaymentMethod, Payment, CreatePaymentInput, UpdatePaymentInput } from '@/types/api';
import { useToast } from '@/hooks/use-toast';

// Schema con los nombres de campo que espera el backend
const paymentSchema = z.object({
  type: z.enum(['ADVANCE', 'SETTLEMENT', 'INVOICE', 'EXPENSE_REIMBURSEMENT']),
  concept: z.string().min(1, 'El concepto es requerido'),
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  currency: z.enum(['BOB', 'USD']).optional(),
  exchangeRate: z.number().optional(),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHECK', 'CARD', 'OTHER']),
  reference: z.string().optional(),
  driverId: z.string().optional(),
  tripId: z.string().optional(),
  settlementId: z.string().optional(),
  invoiceId: z.string().optional(),
  expenseId: z.string().optional(),
  scheduledDate: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

const TYPE_LABELS: Record<PaymentType, string> = {
  ADVANCE: 'Anticipo',
  SETTLEMENT: 'Liquidación',
  INVOICE: 'Factura',
  EXPENSE_REIMBURSEMENT: 'Reembolso',
};

const STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

const STATUS_COLORS: Record<PaymentStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  BANK_TRANSFER: 'Transferencia',
  CHECK: 'Cheque',
  CARD: 'Tarjeta',
  OTHER: 'Otro',
};

export default function PagosPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<PaymentType | undefined>();
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [driverSearch, setDriverSearch] = useState('');
  const [tripSearch, setTripSearch] = useState('');

  const { data: paymentsData, isLoading } = usePayments({
    page,
    limit: 10,
    search,
    type: typeFilter,
    status: statusFilter,
  });

  const { data: stats } = usePaymentStats();

  // Obtener lista de conductores activos
  const { data: driversData } = useDriversList({
    isActive: true,
    limit: 100,
    search: driverSearch,
  });

  // Obtener lista de viajes según el tipo de pago
  const { data: tripsData } = useTrips({
    limit: 100,
    search: tripSearch,
    // Para anticipos y liquidaciones, mostrar viajes en tránsito o programados
    status: undefined,
  });

  const createMutation = useCreatePayment();
  const updateMutation = useUpdatePayment();
  const approveMutation = useApprovePayment();
  const completeMutation = useCompletePayment();
  const cancelMutation = useCancelPayment();
  const deleteMutation = useDeletePayment();

  const { control, register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      type: 'ADVANCE',
      concept: '',
      amount: 0,
      currency: 'BOB',
      paymentMethod: 'CASH',
      reference: '',
      driverId: '',
      tripId: '',
      notes: '',
    },
  });

  const selectedType = watch('type');
  const selectedPaymentMethod = watch('paymentMethod');
  const selectedCurrency = watch('currency');
  const selectedDriverId = watch('driverId');
  const selectedTripId = watch('tripId');

  // Cuando se selecciona un viaje, auto-seleccionar el conductor si el viaje tiene uno asignado
  useEffect(() => {
    if (selectedTripId && tripsData?.data) {
      const selectedTrip = tripsData.data.find(t => t.id === selectedTripId);
      if (selectedTrip?.driverId && !selectedDriverId) {
        setValue('driverId', selectedTrip.driverId);
      }
    }
  }, [selectedTripId, tripsData, selectedDriverId, setValue]);

  const onSubmit = async (data: PaymentFormData) => {
    try {
      // Limpiar campos vacíos
      const cleanData = {
        ...data,
        driverId: data.driverId || undefined,
        tripId: data.tripId || undefined,
        settlementId: data.settlementId || undefined,
        invoiceId: data.invoiceId || undefined,
        expenseId: data.expenseId || undefined,
        reference: data.reference || undefined,
        scheduledDate: data.scheduledDate || undefined,
        notes: data.notes || undefined,
        exchangeRate: data.currency === 'USD' ? data.exchangeRate : undefined,
      };

      if (editingPayment) {
        const updateData: UpdatePaymentInput = {
          concept: cleanData.concept,
          amount: cleanData.amount,
          paymentMethod: cleanData.paymentMethod,
          reference: cleanData.reference,
          scheduledDate: cleanData.scheduledDate,
          notes: cleanData.notes,
        };
        await updateMutation.mutateAsync({ id: editingPayment.id, data: updateData });
        toast({ title: 'Pago actualizado', description: 'El pago se actualizó correctamente' });
      } else {
        await createMutation.mutateAsync(cleanData as CreatePaymentInput);
        toast({ title: 'Pago creado', description: 'El pago se creó correctamente' });
      }
      setIsDialogOpen(false);
      reset();
      setEditingPayment(null);
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar el pago', variant: 'destructive' });
    }
  };

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setValue('type', payment.type);
    setValue('concept', payment.concept);
    setValue('amount', typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount);
    setValue('currency', payment.currency || 'BOB');
    setValue('exchangeRate', payment.exchangeRate || undefined);
    setValue('paymentMethod', payment.paymentMethod);
    setValue('reference', payment.reference || '');
    setValue('driverId', payment.driverId || '');
    setValue('tripId', payment.tripId || '');
    setValue('notes', payment.notes || '');
    setIsDialogOpen(true);
  };

  const handleApprove = async (id: string) => {
    try {
      await approveMutation.mutateAsync(id);
      toast({ title: 'Pago aprobado', description: 'El pago fue aprobado' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo aprobar el pago', variant: 'destructive' });
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await completeMutation.mutateAsync({ id });
      toast({ title: 'Pago completado', description: 'El pago fue marcado como completado' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo completar el pago', variant: 'destructive' });
    }
  };

  const handleCancel = async (id: string) => {
    if (confirm('¿Está seguro de cancelar este pago?')) {
      try {
        await cancelMutation.mutateAsync({ id });
        toast({ title: 'Pago cancelado', description: 'El pago fue cancelado' });
      } catch {
        toast({ title: 'Error', description: 'No se pudo cancelar el pago', variant: 'destructive' });
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar este pago?')) {
      try {
        await deleteMutation.mutateAsync(id);
        toast({ title: 'Pago eliminado', description: 'El pago fue eliminado' });
      } catch {
        toast({ title: 'Error', description: 'No se pudo eliminar el pago', variant: 'destructive' });
      }
    }
  };

  const handleOpenDialog = () => {
    reset({
      type: 'ADVANCE',
      concept: '',
      amount: 0,
      currency: 'BOB',
      paymentMethod: 'CASH',
      reference: '',
      driverId: '',
      tripId: '',
      notes: '',
    });
    setEditingPayment(null);
    setIsDialogOpen(true);
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(num);
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('es-BO', { year: 'numeric', month: 'short', day: 'numeric' });

  const getDriverName = (payment: Payment) => {
    if (payment.driver?.employee) {
      return `${payment.driver.employee.firstName} ${payment.driver.employee.lastName}`;
    }
    return '-';
  };

  const getTripLabel = (trip: typeof tripsData?.data[0]) => {
    const clientName = trip?.billOfLading?.client?.businessName || 'Sin cliente';
    return `${trip.micDta} - ${clientName}`;
  };

  // Filtrar conductores según el tipo de pago
  const getFilteredDrivers = () => {
    if (!driversData?.data) return [];
    return driversData.data;
  };

  // Filtrar viajes según el tipo de pago
  const getFilteredTrips = () => {
    if (!tripsData?.data) return [];
    
    // Para anticipos, mostrar viajes programados o en tránsito
    // Para liquidaciones, mostrar viajes entregados
    if (selectedType === 'ADVANCE') {
      return tripsData.data.filter(t => t.status === 'SCHEDULED' || t.status === 'IN_TRANSIT');
    }
    if (selectedType === 'SETTLEMENT') {
      return tripsData.data.filter(t => t.status === 'DELIVERED');
    }
    return tripsData.data;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pagos y Anticipos</h1>
          <p className="text-gray-500">Gestión de pagos a conductores y terceros</p>
        </div>
        <Button onClick={handleOpenDialog} className="bg-[#1B3F66] hover:bg-[#1B3F66]/90">
          <Plus className="mr-2 h-4 w-4" /> Nuevo Pago
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pagos</CardTitle>
            <CreditCard className="h-4 w-4 text-[#1B3F66]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats?.totalAmount || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(stats?.pendingAmount || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats?.completedAmount || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input placeholder="Buscar..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={typeFilter || 'ALL'} onValueChange={(v) => setTypeFilter(v === 'ALL' ? undefined : v as PaymentType)}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter || 'ALL'} onValueChange={(v) => setStatusFilter(v === 'ALL' ? undefined : v as PaymentStatus)}>
              <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setSearch(''); setTypeFilter(undefined); setStatusFilter(undefined); }}>
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Conductor</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">Cargando...</TableCell></TableRow>
              ) : !paymentsData?.data.length ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">No hay pagos</TableCell></TableRow>
              ) : (
                paymentsData.data.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.createdAt)}</TableCell>
                    <TableCell>{TYPE_LABELS[payment.type]}</TableCell>
                    <TableCell>{payment.concept}</TableCell>
                    <TableCell>{getDriverName(payment)}</TableCell>
                    <TableCell>{PAYMENT_METHOD_LABELS[payment.paymentMethod]}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[payment.status]}>{STATUS_LABELS[payment.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(payment.amountBob || payment.amount)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {payment.status === 'PENDING' && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleApprove(payment.id)}>
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleCancel(payment.id)}>
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {payment.status === 'APPROVED' && (
                          <Button variant="outline" size="sm" onClick={() => handleComplete(payment.id)}>
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => handleEdit(payment)}>Editar</Button>
                        {payment.status === 'PENDING' && (
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(payment.id)}>Eliminar</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {paymentsData && paymentsData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando {((page - 1) * 10) + 1} - {Math.min(page * 10, paymentsData.pagination.total)} de {paymentsData.pagination.total} registros
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>Anterior</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === paymentsData.pagination.totalPages}>Siguiente</Button>
          </div>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPayment ? 'Editar Pago' : 'Nuevo Pago'}</DialogTitle>
            <DialogDescription>{editingPayment ? 'Modifique los datos del pago' : 'Ingrese los datos del nuevo pago'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Pago</Label>
              <Controller name="type" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => { field.onChange(v); setValue('tripId', ''); }} disabled={!!editingPayment}>
                  <SelectTrigger><SelectValue placeholder="Seleccione tipo" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
              <p className="text-xs text-gray-500">
                {selectedType === 'ADVANCE' && 'Anticipo: Pago adelantado antes de completar el viaje'}
                {selectedType === 'SETTLEMENT' && 'Liquidación: Pago final al concluir el viaje'}
                {selectedType === 'INVOICE' && 'Factura: Pago recibido de cliente'}
                {selectedType === 'EXPENSE_REIMBURSEMENT' && 'Reembolso: Devolución de gastos al conductor'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Concepto *</Label>
              <Input {...register('concept')} placeholder="Descripción del pago" />
              {errors.concept && <p className="text-sm text-red-500">{errors.concept.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monto *</Label>
                <Input type="number" step="0.01" {...register('amount', { valueAsNumber: true })} />
                {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Moneda</Label>
                <Controller name="currency" control={control} render={({ field }) => (
                  <Select value={field.value || 'BOB'} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BOB">BOB - Bolivianos</SelectItem>
                      <SelectItem value="USD">USD - Dólares</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
            </div>

            {selectedCurrency === 'USD' && (
              <div className="space-y-2">
                <Label>Tipo de Cambio</Label>
                <Input type="number" step="0.01" {...register('exchangeRate', { valueAsNumber: true })} placeholder="Ej: 6.96" />
              </div>
            )}

            <div className="space-y-2">
              <Label>Método de Pago *</Label>
              <Controller name="paymentMethod" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Seleccione método" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>

            <div className="space-y-2">
              <Label>Referencia</Label>
              <Input {...register('reference')} placeholder="Nro. de transferencia, cheque, etc." />
            </div>

            {/* Select de Viaje - Solo para ADVANCE y SETTLEMENT */}
            {(selectedType === 'ADVANCE' || selectedType === 'SETTLEMENT') && (
              <div className="space-y-2">
                <Label>Viaje {selectedType === 'ADVANCE' ? '(opcional)' : '*'}</Label>
                <Controller name="tripId" control={control} render={({ field }) => (
                  <Select value={field.value || 'NONE'} onValueChange={(v) => field.onChange(v === 'NONE' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un viaje" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Sin viaje asignado</SelectItem>
                      {getFilteredTrips().map((trip) => (
                        <SelectItem key={trip.id} value={trip.id}>
                          {getTripLabel(trip)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
                <p className="text-xs text-gray-500">
                  {selectedType === 'ADVANCE' && 'Viajes disponibles: Programados y en tránsito'}
                  {selectedType === 'SETTLEMENT' && 'Viajes disponibles: Entregados'}
                </p>
              </div>
            )}

            {/* Select de Conductor - Solo para ADVANCE, SETTLEMENT y EXPENSE_REIMBURSEMENT */}
            {(selectedType === 'ADVANCE' || selectedType === 'SETTLEMENT' || selectedType === 'EXPENSE_REIMBURSEMENT') && (
              <div className="space-y-2">
                <Label>Conductor *</Label>
                <Controller name="driverId" control={control} render={({ field }) => (
                  <Select value={field.value || 'NONE'} onValueChange={(v) => field.onChange(v === 'NONE' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un conductor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Sin conductor asignado</SelectItem>
                      {getFilteredDrivers().map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.fullName} - {driver.licenseNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>
            )}

            <div className="space-y-2">
              <Label>Fecha Programada</Label>
              <Input type="date" {...register('scheduledDate')} />
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Input {...register('notes')} placeholder="Notas adicionales" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-[#1B3F66] hover:bg-[#1B3F66]/90">{editingPayment ? 'Actualizar' : 'Crear'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
