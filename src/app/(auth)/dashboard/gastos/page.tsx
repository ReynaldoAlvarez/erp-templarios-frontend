'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import axios from 'axios';
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Receipt,
  DollarSign,
  BarChart3,
  TrendingDown,
  Fuel,
  UtensilsCrossed,
  Wrench,
  CreditCard,
  HelpCircle,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { expensesApi, driversApi } from '@/lib/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Expense, CreateExpenseInput, UpdateExpenseInput, ExpenseCategory, Driver, ExpenseStats } from '@/types/api';

// Form schema
const expenseSchema = z.object({
  driverId: z.string().min(1, 'El conductor es requerido'),
  category: z.enum(['FUEL', 'TOLL', 'FOOD', 'MAINTENANCE', 'OTHER']),
  concept: z.string().min(1, 'El concepto es requerido'),
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  expenseDate: z.string().min(1, 'La fecha es requerida'),
  notes: z.string().optional().or(z.literal('')),
  receiptUrl: z.string().url('URL inválida').optional().or(z.literal('')),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

// Category config
const categoryConfig: Record<ExpenseCategory, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  FUEL: { label: 'Combustible', icon: Fuel, color: 'bg-red-50 text-red-700 border-red-200' },
  TOLL: { label: 'Peaje', icon: CreditCard, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  FOOD: { label: 'Alimentación', icon: UtensilsCrossed, color: 'bg-green-50 text-green-700 border-green-200' },
  MAINTENANCE: { label: 'Mantenimiento', icon: Wrench, color: 'bg-orange-50 text-orange-700 border-orange-200' },
  OTHER: { label: 'Otros', icon: HelpCircle, color: 'bg-gray-50 text-gray-700 border-gray-200' },
};

// Helper para extraer mensaje de error del backend
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (axios.isAxiosError(error)) {
    const backendMessage = error.response?.data?.message;
    if (backendMessage) return backendMessage;
    const errors = error.response?.data?.errors;
    if (errors && Array.isArray(errors)) {
      return errors.map((e: { message?: string; msg?: string }) => e.message || e.msg).join(', ');
    }
  }
  if (error instanceof Error) return error.message;
  return defaultMessage;
};

export default function GastosPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [driverFilter, setDriverFilter] = useState<string>('all');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Queries
  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['expenses', { page, limit, search, category: categoryFilter, driverId: driverFilter, dateFrom: dateFromFilter, dateTo: dateToFilter }],
    queryFn: () => expensesApi.getAll({
      page,
      limit,
      search: search || undefined,
      category: categoryFilter !== 'all' ? categoryFilter as ExpenseCategory : undefined,
      driverId: driverFilter !== 'all' ? driverFilter : undefined,
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
    }),
  });

  const { data: drivers } = useQuery({
    queryKey: ['drivers', 'all'],
    queryFn: () => driversApi.getAll({ limit: 100 }),
  });

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['expenses', 'stats', { driverId: driverFilter, dateFrom: dateFromFilter, dateTo: dateToFilter }],
    queryFn: () => expensesApi.getStats({
      driverId: driverFilter !== 'all' ? driverFilter : undefined,
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
    }),
  });

  const { data: categories } = useQuery({
    queryKey: ['expenses', 'categories'],
    queryFn: () => expensesApi.getCategories(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateExpenseInput) => expensesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Gasto registrado', description: 'El gasto ha sido registrado exitosamente.' });
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Error al registrar',
        description: getErrorMessage(error, 'No se pudo registrar el gasto.'),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseInput }) => expensesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Gasto actualizado', description: 'El gasto ha sido actualizado.' });
      setIsEditOpen(false);
      setSelectedExpense(null);
      editForm.reset();
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Error al actualizar',
        description: getErrorMessage(error, 'No se pudo actualizar el gasto.'),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Gasto eliminado', description: 'El gasto ha sido eliminado.' });
      setIsDeleteOpen(false);
      setSelectedExpense(null);
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getErrorMessage(error, 'No se pudo eliminar el gasto.'),
      });
    },
  });

  // Forms
  const createForm = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      driverId: '', category: 'FUEL', concept: '', amount: 0,
      expenseDate: new Date().toISOString().split('T')[0], notes: '', receiptUrl: '',
    },
  });

  const editForm = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      driverId: '', category: 'FUEL', concept: '', amount: 0,
      expenseDate: '', notes: '', receiptUrl: '',
    },
  });

  // Handlers
  const handleCreate = (data: ExpenseFormData) => {
    createMutation.mutate({
      driverId: data.driverId,
      category: data.category,
      concept: data.concept,
      amount: data.amount,
      expenseDate: data.expenseDate,
      notes: data.notes || undefined,
      receiptUrl: data.receiptUrl || undefined,
    });
  };

  const handleEdit = (data: ExpenseFormData) => {
    if (!selectedExpense) return;
    updateMutation.mutate({
      id: selectedExpense.id,
      data: {
        driverId: data.driverId,
        category: data.category,
        concept: data.concept,
        amount: data.amount,
        expenseDate: data.expenseDate,
        notes: data.notes || undefined,
        receiptUrl: data.receiptUrl || undefined,
      },
    });
  };

  const handleDelete = () => {
    if (!selectedExpense) return;
    deleteMutation.mutate(selectedExpense.id);
  };

  const openEditDialog = (expense: Expense) => {
    setSelectedExpense(expense);
    editForm.reset({
      driverId: expense.driverId,
      category: expense.category,
      concept: expense.concept,
      amount: expense.amount,
      expenseDate: expense.expenseDate ? expense.expenseDate.split('T')[0] : '',
      notes: expense.notes || '',
      receiptUrl: expense.receiptUrl || '',
    });
    setIsEditOpen(true);
  };

  // Pagination
  const totalPages = expensesData?.pagination?.totalPages || 1;
  const totalExpenses = expensesData?.pagination?.total || 0;
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const expenses = expensesData?.data || [];
  const driversList = drivers?.data || [];

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(amount);
  };

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gestión de Gastos</h1>
          <p className="text-gray-500 mt-1">Administra los gastos de los conductores</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { refetchStats(); setIsStatsOpen(true); }}>
            <BarChart3 className="h-4 w-4 mr-2" /> Estadísticas
          </Button>
          <Button className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" onClick={() => { createForm.reset(); setIsCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Nuevo Gasto
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1B3F66]">{formatCurrency(stats?.totalExpenses || 0)}</div>
            <p className="text-xs text-muted-foreground">{stats?.count || 0} registros</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Combustible</CardTitle>
            <Fuel className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.byCategory?.FUEL || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peajes</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.byCategory?.TOLL || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alimentación</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.byCategory?.FOOD || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por concepto..."
                className="pl-10"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="Categoría" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(categoryConfig).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={driverFilter} onValueChange={(v) => { setDriverFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder="Conductor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {driversList.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>{driver.fullName || `${driver.firstName} ${driver.lastName}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              className="w-full md:w-[150px]"
              value={dateFromFilter}
              onChange={(e) => { setDateFromFilter(e.target.value); setPage(1); }}
              placeholder="Desde"
            />
            <Input
              type="date"
              className="w-full md:w-[150px]"
              value={dateToFilter}
              onChange={(e) => { setDateToFilter(e.target.value); setPage(1); }}
              placeholder="Hasta"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-[#1B3F66]" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Conductor</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Notas</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No se encontraron gastos
                        </TableCell>
                      </TableRow>
                    ) : (
                      expenses.map((expense) => {
                        const catConfig = categoryConfig[expense.category];
                        const CatIcon = catConfig?.icon || Receipt;
                        return (
                          <TableRow key={expense.id} className="hover:bg-gray-50">
                            <TableCell>
                              {expense.expenseDate ? new Date(expense.expenseDate).toLocaleDateString() : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-[#1B3F66] flex items-center justify-center text-white">
                                  <TrendingDown className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="font-medium">{expense.driver?.fullName || `${expense.driver?.firstName} ${expense.driver?.lastName}` || '-'}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={catConfig?.color}>
                                <CatIcon className="h-3 w-3 mr-1" />
                                {catConfig?.label || expense.category}
                              </Badge>
                            </TableCell>
                            <TableCell>{expense.concept}</TableCell>
                            <TableCell className="font-semibold">{formatCurrency(expense.amount)}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{expense.notes || '-'}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditDialog(expense)}>
                                    <Edit className="h-4 w-4 mr-2" /> Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedExpense(expense); setIsDeleteOpen(true); }}>
                                    <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                                  </DropdownMenuItem>
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
              {expenses.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-gray-500">
                    Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, totalExpenses)} de {totalExpenses} gastos
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                      <SelectTrigger className="w-[70px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={() => setPage(page - 1)} disabled={!canPrev}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm">Página {page} de {totalPages}</div>
                    <Button variant="outline" size="icon" onClick={() => setPage(page + 1)} disabled={!canNext}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Gasto</DialogTitle>
            <DialogDescription>Ingresa los datos del nuevo gasto</DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4 py-4">
            <Controller name="driverId" control={createForm.control} render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label>Conductor *</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleccionar conductor" />
                  </SelectTrigger>
                  <SelectContent>
                    {driversList.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>{driver.fullName || `${driver.firstName} ${driver.lastName}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
              </div>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <Controller name="category" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Categoría *</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryConfig).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="amount" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Monto (Bs) *</Label>
                  <Input {...field} type="number" step="0.01" placeholder="0.00" value={field.value || ''} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)} className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
            </div>
            <Controller name="concept" control={createForm.control} render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label>Concepto *</Label>
                <Input {...field} placeholder="Descripción del gasto" className={fieldState.invalid ? 'border-red-500' : ''} />
                {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
              </div>
            )} />
            <Controller name="expenseDate" control={createForm.control} render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label>Fecha *</Label>
                <Input {...field} type="date" className={fieldState.invalid ? 'border-red-500' : ''} />
                {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
              </div>
            )} />
            <Controller name="notes" control={createForm.control} render={({ field }) => (
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea {...field} placeholder="Notas adicionales..." rows={2} />
              </div>
            )} />
            <Controller name="receiptUrl" control={createForm.control} render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label>URL del Recibo</Label>
                <Input {...field} type="url" placeholder="https://..." className={fieldState.invalid ? 'border-red-500' : ''} />
                {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
              </div>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Registrar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Gasto</DialogTitle>
            <DialogDescription>Modifica los datos del gasto</DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4 py-4">
            <Controller name="driverId" control={editForm.control} render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label>Conductor *</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleccionar conductor" />
                  </SelectTrigger>
                  <SelectContent>
                    {driversList.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>{driver.fullName || `${driver.firstName} ${driver.lastName}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
              </div>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <Controller name="category" control={editForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Categoría *</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryConfig).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="amount" control={editForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Monto (Bs) *</Label>
                  <Input {...field} type="number" step="0.01" value={field.value || ''} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)} className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
            </div>
            <Controller name="concept" control={editForm.control} render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label>Concepto *</Label>
                <Input {...field} className={fieldState.invalid ? 'border-red-500' : ''} />
                {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
              </div>
            )} />
            <Controller name="expenseDate" control={editForm.control} render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label>Fecha *</Label>
                <Input {...field} type="date" className={fieldState.invalid ? 'border-red-500' : ''} />
                {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
              </div>
            )} />
            <Controller name="notes" control={editForm.control} render={({ field }) => (
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea {...field} rows={2} />
              </div>
            )} />
            <Controller name="receiptUrl" control={editForm.control} render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label>URL del Recibo</Label>
                <Input {...field} type="url" className={fieldState.invalid ? 'border-red-500' : ''} />
                {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
              </div>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={isStatsOpen} onOpenChange={setIsStatsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Estadísticas de Gastos</DialogTitle>
            <DialogDescription>
              Resumen de gastos por categoría
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Total Gastos</div>
              <div className="text-3xl font-bold text-[#1B3F66]">{formatCurrency(stats?.totalExpenses || 0)}</div>
              <div className="text-sm text-gray-500 mt-1">{stats?.count || 0} registros</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Por Categoría</div>
              {Object.entries(categoryConfig).map(([key, config]) => {
                const amount = stats?.byCategory?.[key as ExpenseCategory] || 0;
                const Icon = config.icon;
                return (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span>{config.label}</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(amount)}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatsOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar gasto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el gasto &quot;{selectedExpense?.concept}&quot;.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
