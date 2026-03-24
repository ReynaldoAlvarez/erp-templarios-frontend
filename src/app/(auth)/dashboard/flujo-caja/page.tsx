'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
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
  useCashFlow,
  useCashFlowSummary,
  useCreateCashFlow,
  useUpdateCashFlow,
  useDeleteCashFlow,
} from '@/hooks/use-queries';
import { CashFlowType, CashFlowCategory, PaymentMethod, CashFlow, CreateCashFlowInput, UpdateCashFlowInput } from '@/types/api';
import { useToast } from '@/hooks/use-toast';

// Schema con los nombres de campo que espera el backend
const cashFlowSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.enum(['FREIGHT', 'FUEL', 'MAINTENANCE', 'SALARY', 'TOLL', 'OTHER']),
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  concept: z.string().min(1, 'El concepto es requerido'),
  paymentDate: z.string().min(1, 'La fecha es requerida'),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHECK', 'CARD', 'OTHER']),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type CashFlowFormData = z.infer<typeof cashFlowSchema>;

const CATEGORY_LABELS: Record<CashFlowCategory, string> = {
  FREIGHT: 'Fletes',
  FUEL: 'Combustible',
  MAINTENANCE: 'Mantenimiento',
  SALARY: 'Salarios',
  TOLL: 'Peajes',
  OTHER: 'Otros',
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  BANK_TRANSFER: 'Transferencia',
  CHECK: 'Cheque',
  CARD: 'Tarjeta',
  OTHER: 'Otro',
};

export default function FlujoCajaPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<CashFlowType | undefined>();
  const [categoryFilter, setCategoryFilter] = useState<CashFlowCategory | undefined>();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CashFlow | null>(null);

  const { data: cashFlowData, isLoading } = useCashFlow({
    page,
    limit: 10,
    search,
    type: typeFilter,
    category: categoryFilter,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const { data: summary } = useCashFlowSummary({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const createMutation = useCreateCashFlow();
  const updateMutation = useUpdateCashFlow();
  const deleteMutation = useDeleteCashFlow();

  const { control, register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CashFlowFormData>({
    resolver: zodResolver(cashFlowSchema),
    defaultValues: {
      type: 'INCOME',
      category: 'FREIGHT',
      amount: 0,
      concept: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'CASH',
      reference: '',
      notes: '',
    },
  });

  const onSubmit = async (data: CashFlowFormData) => {
    try {
      if (editingRecord) {
        await updateMutation.mutateAsync({ id: editingRecord.id, data: data as UpdateCashFlowInput });
        toast({ title: 'Registro actualizado', description: 'El registro se actualizó correctamente' });
      } else {
        await createMutation.mutateAsync(data as CreateCashFlowInput);
        toast({ title: 'Registro creado', description: 'El registro se creó correctamente' });
      }
      setIsDialogOpen(false);
      reset();
      setEditingRecord(null);
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar el registro', variant: 'destructive' });
    }
  };

  const handleEdit = (record: CashFlow) => {
    setEditingRecord(record);
    setValue('type', record.type);
    setValue('category', record.category);
    setValue('amount', record.amount);
    setValue('concept', record.concept);
    setValue('paymentDate', record.paymentDate.split('T')[0]);
    setValue('paymentMethod', record.paymentMethod);
    setValue('reference', record.reference || '');
    setValue('notes', record.notes || '');
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar este registro?')) {
      try {
        await deleteMutation.mutateAsync(id);
        toast({ title: 'Registro eliminado', description: 'El registro se eliminó correctamente' });
      } catch {
        toast({ title: 'Error', description: 'No se pudo eliminar el registro', variant: 'destructive' });
      }
    }
  };

  const handleOpenDialog = () => {
    reset({
      type: 'INCOME',
      category: 'FREIGHT',
      amount: 0,
      concept: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'CASH',
      reference: '',
      notes: '',
    });
    setEditingRecord(null);
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
          <h1 className="text-2xl font-bold text-gray-900">Flujo de Caja</h1>
          <p className="text-gray-500">Gestión de ingresos y egresos</p>
        </div>
        <Button onClick={handleOpenDialog} className="bg-[#1B3F66] hover:bg-[#1B3F66]/90">
          <Plus className="mr-2 h-4 w-4" /> Nuevo Registro
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary?.totalIncome || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Egresos</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(summary?.totalExpense || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <Wallet className="h-4 w-4 text-[#1B3F66]" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(summary?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary?.balance || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-6">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input placeholder="Buscar..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={typeFilter || 'ALL'} onValueChange={(v) => setTypeFilter(v === 'ALL' ? undefined : v as CashFlowType)}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="INCOME">Ingresos</SelectItem>
                <SelectItem value="EXPENSE">Egresos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter || 'ALL'} onValueChange={(v) => setCategoryFilter(v === 'ALL' ? undefined : v as CashFlowCategory)}>
              <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            <Button variant="outline" onClick={() => { setSearch(''); setTypeFilter(undefined); setCategoryFilter(undefined); setDateFrom(''); setDateTo(''); }}>
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
                <TableHead>Categoría</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Cargando...</TableCell></TableRow>
              ) : !cashFlowData?.data?.length ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">No hay registros</TableCell></TableRow>
              ) : (
                cashFlowData.data.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{formatDate(record.paymentDate)}</TableCell>
                    <TableCell>
                      <Badge variant={record.type === 'INCOME' ? 'default' : 'destructive'} 
                        className={record.type === 'INCOME' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {record.type === 'INCOME' ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
                        {record.type === 'INCOME' ? 'Ingreso' : 'Egreso'}
                      </Badge>
                    </TableCell>
                    <TableCell>{CATEGORY_LABELS[record.category]}</TableCell>
                    <TableCell>{record.concept}</TableCell>
                    <TableCell>{PAYMENT_METHOD_LABELS[record.paymentMethod]}</TableCell>
                    <TableCell className={`text-right font-medium ${record.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                      {record.type === 'INCOME' ? '+' : '-'}{formatCurrency(record.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(record)}>Editar</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(record.id)}>Eliminar</Button>
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
      {cashFlowData && cashFlowData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando {((page - 1) * 10) + 1} - {Math.min(page * 10, cashFlowData.pagination.total)} de {cashFlowData.pagination.total} registros
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>Anterior</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === cashFlowData.pagination.totalPages}>Siguiente</Button>
          </div>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRecord ? 'Editar Registro' : 'Nuevo Registro'}</DialogTitle>
            <DialogDescription>{editingRecord ? 'Modifique los datos del registro' : 'Ingrese los datos del nuevo registro'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Controller name="type" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOME">Ingreso</SelectItem>
                    <SelectItem value="EXPENSE">Egreso</SelectItem>
                  </SelectContent>
                </Select>
              )} />
              {errors.type && <p className="text-sm text-red-500">{errors.type.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Categoría</Label>
              <Controller name="category" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
              {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Monto (BOB)</Label>
              <Input type="number" step="0.01" {...register('amount', { valueAsNumber: true })} />
              {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Concepto</Label>
              <Input {...register('concept')} />
              {errors.concept && <p className="text-sm text-red-500">{errors.concept.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Fecha de Pago</Label>
              <Input type="date" {...register('paymentDate')} />
              {errors.paymentDate && <p className="text-sm text-red-500">{errors.paymentDate.message}</p>}
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
              <Button type="submit" className="bg-[#1B3F66] hover:bg-[#1B3F66]/90">{editingRecord ? 'Actualizar' : 'Crear'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
