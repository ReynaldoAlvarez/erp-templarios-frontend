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
  Route,
  CheckCircle,
  MapPin,
  Clock,
  DollarSign,
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tramosApi } from '@/lib/api-client';
import { Tramo, CreateTramoInput, UpdateTramoInput, TramoListParams } from '@/types/api';

// Form schema
const tramoSchema = z.object({
  code: z.string().min(1, 'El código es requerido').max(20, 'Máximo 20 caracteres'),
  name: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  origin: z.string().min(1, 'El origen es requerido').max(50, 'Máximo 50 caracteres'),
  destination: z.string().min(1, 'El destino es requerido').max(50, 'Máximo 50 caracteres'),
  distanceKm: z.number().min(0, 'Debe ser mayor o igual a 0').optional(),
  estimatedHours: z.number().min(0, 'Debe ser mayor o igual a 0').optional(),
  baseRateUsd: z.number().min(0, 'Debe ser mayor o igual a 0').optional(),
  baseRateBob: z.number().min(0, 'Debe ser mayor o igual a 0').optional(),
  notes: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
});

type TramoFormData = z.infer<typeof tramoSchema>;

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

// Format currency
const formatCurrency = (amount: number | undefined, currency: string = 'USD') => {
  if (amount === undefined || amount === null) return '-';
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export default function TramosPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTramo, setSelectedTramo] = useState<Tramo | null>(null);

  // Queries
  const params: TramoListParams = {
    page,
    limit,
    search: search || undefined,
    isActive: isActiveFilter === 'all' ? undefined : isActiveFilter === 'true',
  };

  const { data: tramosData, isLoading } = useQuery({
    queryKey: ['tramos', params],
    queryFn: () => tramosApi.getAll(params),
  });

  const { data: stats } = useQuery({
    queryKey: ['tramos', 'stats'],
    queryFn: () => tramosApi.getStats(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateTramoInput) => tramosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tramos'] });
      toast({ title: 'Tramo creado', description: 'El tramo ha sido creado exitosamente.' });
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Error al crear',
        description: getErrorMessage(error, 'No se pudo crear el tramo.'),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTramoInput }) =>
      tramosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tramos'] });
      toast({ title: 'Tramo actualizado', description: 'El tramo ha sido actualizado.' });
      setIsEditOpen(false);
      setSelectedTramo(null);
      editForm.reset();
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Error al actualizar',
        description: getErrorMessage(error, 'No se pudo actualizar el tramo.'),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tramosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tramos'] });
      toast({ title: 'Tramo eliminado', description: 'El tramo ha sido eliminado.' });
      setIsDeleteOpen(false);
      setSelectedTramo(null);
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getErrorMessage(error, 'No se pudo eliminar el tramo.'),
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => tramosApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tramos'] });
      toast({ title: 'Tramo restaurado', description: 'El tramo ha sido restaurado.' });
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getErrorMessage(error, 'No se pudo restaurar el tramo.'),
      });
    },
  });

  // Forms
  const createForm = useForm<TramoFormData>({
    resolver: zodResolver(tramoSchema),
    defaultValues: {
      code: '',
      name: '',
      origin: '',
      destination: '',
      distanceKm: 0,
      estimatedHours: 0,
      baseRateUsd: 0,
      baseRateBob: 0,
      notes: '',
    },
  });

  const editForm = useForm<TramoFormData>({
    resolver: zodResolver(tramoSchema),
    defaultValues: {
      code: '',
      name: '',
      origin: '',
      destination: '',
      distanceKm: 0,
      estimatedHours: 0,
      baseRateUsd: 0,
      baseRateBob: 0,
      notes: '',
    },
  });

  // Handlers
  const handleCreate = (data: TramoFormData) => {
    createMutation.mutate({
      code: data.code,
      name: data.name,
      origin: data.origin,
      destination: data.destination,
      distanceKm: data.distanceKm || undefined,
      estimatedHours: data.estimatedHours || undefined,
      baseRateUsd: data.baseRateUsd || undefined,
      baseRateBob: data.baseRateBob || undefined,
      notes: data.notes || undefined,
    });
  };

  const handleEdit = (data: TramoFormData) => {
    if (!selectedTramo) return;
    updateMutation.mutate({
      id: selectedTramo.id,
      data: {
        code: data.code,
        name: data.name,
        origin: data.origin,
        destination: data.destination,
        distanceKm: data.distanceKm || undefined,
        estimatedHours: data.estimatedHours || undefined,
        baseRateUsd: data.baseRateUsd || undefined,
        baseRateBob: data.baseRateBob || undefined,
        notes: data.notes || undefined,
      },
    });
  };

  const handleDelete = () => {
    if (!selectedTramo) return;
    deleteMutation.mutate(selectedTramo.id);
  };

  const handleRestore = (id: string) => {
    restoreMutation.mutate(id);
  };

  const openEditDialog = (tramo: Tramo) => {
    setSelectedTramo(tramo);
    editForm.reset({
      code: tramo.code,
      name: tramo.name,
      origin: tramo.origin,
      destination: tramo.destination,
      distanceKm: tramo.distanceKm || 0,
      estimatedHours: tramo.estimatedHours || 0,
      baseRateUsd: tramo.baseRateUsd || 0,
      baseRateBob: tramo.baseRateBob || 0,
      notes: tramo.notes || '',
    });
    setIsEditOpen(true);
  };

  // Pagination
  const totalPages = tramosData?.pagination?.totalPages || 1;
  const totalItems = tramosData?.pagination?.total || 0;
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const tramos = tramosData?.data || [];

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gestión de Tramos</h1>
          <p className="text-gray-500 mt-1">Administra las rutas predefinidas del sistema</p>
        </div>
        <Button className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" onClick={() => { createForm.reset(); setIsCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo Tramo
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1B3F66]">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.active || 0} activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dist. Promedio</CardTitle>
            <MapPin className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.avgDistance ? `${Math.round(stats.avgDistance)} km` : '-'}
            </div>
            <p className="text-xs text-muted-foreground">Kilómetros</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">T. Promedio</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.avgEstimatedHours ? `${Math.round(stats.avgEstimatedHours)} h` : '-'}
            </div>
            <p className="text-xs text-muted-foreground">Horas estimadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarifa Prom.</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(stats?.avgBaseRateUsd)}
            </div>
            <p className="text-xs text-muted-foreground">USD</p>
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
                placeholder="Buscar por código, nombre, origen o destino..."
                className="pl-10"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={isActiveFilter} onValueChange={(v) => { setIsActiveFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Activos</SelectItem>
                <SelectItem value="false">Inactivos</SelectItem>
              </SelectContent>
            </Select>
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
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Dist. (km)</TableHead>
                      <TableHead>T. Est. (h)</TableHead>
                      <TableHead>Tarifa USD</TableHead>
                      <TableHead>Tarifa BOB</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tramos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                          No se encontraron tramos
                        </TableCell>
                      </TableRow>
                    ) : (
                      tramos.map((tramo) => (
                        <TableRow key={tramo.id} className="hover:bg-gray-50">
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {tramo.code}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{tramo.name}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              {tramo.origin}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              {tramo.destination}
                            </div>
                          </TableCell>
                          <TableCell>
                            {tramo.distanceKm ? `${tramo.distanceKm} km` : '-'}
                          </TableCell>
                          <TableCell>
                            {tramo.estimatedHours ? `${tramo.estimatedHours} h` : '-'}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(tramo.baseRateUsd)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(tramo.baseRateBob, 'BOB')}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                tramo.isActive
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }
                            >
                              {tramo.isActive ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(tramo)}>
                                  <Edit className="h-4 w-4 mr-2" /> Editar
                                </DropdownMenuItem>
                                {!tramo.isActive && (
                                  <DropdownMenuItem onClick={() => handleRestore(tramo.id)}>
                                    <CheckCircle className="h-4 w-4 mr-2" /> Restaurar
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => { setSelectedTramo(tramo); setIsDeleteOpen(true); }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {tramos.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-gray-500">
                    Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, totalItems)} de {totalItems} tramos
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
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Tramo</DialogTitle>
            <DialogDescription>Ingresa los datos del nuevo tramo</DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Controller name="code" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input {...field} placeholder="MAT-CBA" maxLength={20} className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="name" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input {...field} placeholder="Matarani - Cochabamba" className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Controller name="origin" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Origen *</Label>
                  <Input {...field} placeholder="Matarani" className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="destination" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Destino *</Label>
                  <Input {...field} placeholder="Cochabamba" className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Controller name="distanceKm" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Distancia (km)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    className={fieldState.invalid ? 'border-red-500' : ''}
                  />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="estimatedHours" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Tiempo Estimado (horas)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    className={fieldState.invalid ? 'border-red-500' : ''}
                  />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Controller name="baseRateUsd" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Tarifa Base (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    className={fieldState.invalid ? 'border-red-500' : ''}
                  />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="baseRateBob" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Tarifa Base (BOB)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    className={fieldState.invalid ? 'border-red-500' : ''}
                  />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
            </div>
            <Controller name="notes" control={createForm.control} render={({ field }) => (
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea {...field} placeholder="Notas adicionales..." rows={2} />
              </div>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Crear
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Tramo</DialogTitle>
            <DialogDescription>Modifica los datos del tramo</DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Controller name="code" control={editForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input {...field} maxLength={20} className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="name" control={editForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input {...field} className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Controller name="origin" control={editForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Origen *</Label>
                  <Input {...field} className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="destination" control={editForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Destino *</Label>
                  <Input {...field} className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Controller name="distanceKm" control={editForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Distancia (km)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    className={fieldState.invalid ? 'border-red-500' : ''}
                  />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="estimatedHours" control={editForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Tiempo Estimado (horas)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    className={fieldState.invalid ? 'border-red-500' : ''}
                  />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Controller name="baseRateUsd" control={editForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Tarifa Base (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    className={fieldState.invalid ? 'border-red-500' : ''}
                  />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="baseRateBob" control={editForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Tarifa Base (BOB)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    className={fieldState.invalid ? 'border-red-500' : ''}
                  />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
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
              <Button type="submit" className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tramo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el tramo &quot;{selectedTramo?.name}&quot;.
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
