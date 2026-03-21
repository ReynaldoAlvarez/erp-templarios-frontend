'use client';

import { useState } from 'react';
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
  AlertCircle,
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
} from '@/hooks/use-queries';
import { PaymentType, PaymentStatus, PaymentMethod, Payment } from '@/types/api';
import { useToast } from '@/hooks/use-toast';

const paymentSchema = z.object({
  type: z.enum(['ADVANCE', 'SETTLEMENT', 'INVOICE', 'EXPENSE_REIMBURSEMENT']),
  driverId: z.string().optional(),
  tripId: z.string().optional(),
  invoiceId: z.string().optional(),
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  description: z.string().min(1, 'La descripción es requerida'),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHECK', 'CARD', 'OTHER']),
  reference: z.string().optional(),
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

  const { data: paymentsData, isLoading } = usePayments({
    page,
    limit: 10,
    search,
    type: typeFilter,
    status: statusFilter,
  });

  const { data: stats } = usePaymentStats();

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
      amount: 0,
      description: '',
      paymentMethod: 'CASH',
      reference: '',
      notes: '',
    },
  });

  const selectedType = watch('type');
  const selectedPaymentMethod = watch('paymentMethod');

  const onSubmit = async (data: PaymentFormData) => {
    try {
      if (editingPayment) {
        await updateMutation.mutateAsync({ id: editingPayment.id, data });
        toast({ title: 'Pago actualizado', description: 'El pago se actualizó correctamente' });
      } else {
        await createMutation.mutateAsync(data);
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
    setValue('driverId', payment.driverId || '');
    setValue('tripId', payment.tripId || '');
    setValue('invoiceId', payment.invoiceId || '');
    setValue('amount', payment.amount);
    setValue('description', payment.description);
    setValue('paymentMethod', payment.paymentMethod);
    setValue('reference', payment.reference || '');
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
      await completeMutation.mutateAsync(id);
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
      amount: 0,
      description: '',
      paymentMethod: 'CASH',
      reference: '',
      notes: '',
    });
    setEditingPayment(null);
    setIsDialogOpen(true);
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(amount);
  
  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString('es-BO', { year: 'numeric', month: 'short', day: 'numeric' });

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
                <TableHead>Descripción</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Cargando...</TableCell></TableRow>
              ) : !paymentsData?.data.length ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">No hay pagos</TableCell></TableRow>
              ) : (
                paymentsData.data.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.createdAt)}</TableCell>
                    <TableCell>{TYPE_LABELS[payment.type]}</TableCell>
                    <TableCell>{payment.description}</TableCell>
                    <TableCell>{PAYMENT_METHOD_LABELS[payment.paymentMethod]}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[payment.status]}>{STATUS_LABELS[payment.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(payment.amount)}</TableCell>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPayment ? 'Editar Pago' : 'Nuevo Pago'}</DialogTitle>
            <DialogDescription>{editingPayment ? 'Modifique los datos del pago' : 'Ingrese los datos del nuevo pago'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Controller name="type" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>

            <div className="space-y-2">
              <Label>Monto (BOB)</Label>
              <Input type="number" step="0.01" {...register('amount', { valueAsNumber: true })} />
              {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input {...register('description')} />
              {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Método de Pago</Label>
              <Controller name="paymentMethod" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>

            <div className="space-y-2">
              <Label>Referencia (opcional)</Label>
              <Input {...register('reference')} />
            </div>

            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Input {...register('notes')} />
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
