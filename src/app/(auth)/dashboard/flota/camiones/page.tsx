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
  Truck as TruckIcon,
  RotateCcw,
  Gauge,
} from 'lucide-react';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { useToast } from '@/hooks/use-toast';
import { trucksApi } from '@/lib/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck, CreateTruckInput, UpdateTruckInput, TruckStatus } from '@/types/api';

// Form schema
const truckSchema = z.object({
  plateNumber: z.string().min(1, 'La placa es requerida'),
  brand: z.string().min(1, 'La marca es requerida'),
  model: z.string().min(1, 'El modelo es requerido'),
  year: z.number().min(1990, 'Año inválido').max(new Date().getFullYear() + 1, 'Año inválido'),
  color: z.string().optional().or(z.literal('')),
  axles: z.number().min(2, 'Mínimo 2 ejes').max(6, 'Máximo 6 ejes').optional(),
  capacityTons: z.number().min(1, 'La capacidad debe ser mayor a 0'),
  operationPermit: z.string().optional().or(z.literal('')),
  operationPermitExpiry: z.string().optional().or(z.literal('')),
  mileage: z.number().min(0, 'Kilometraje inválido').optional(),
});

type TruckFormData = z.infer<typeof truckSchema>;

// Status config
const statusConfig: Record<TruckStatus, { label: string; className: string }> = {
  AVAILABLE: { label: 'Disponible', className: 'bg-green-100 text-green-800 border-green-200' },
  SCHEDULED: { label: 'Programado', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  IN_TRANSIT: { label: 'En Tránsito', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  MAINTENANCE: { label: 'Mantenimiento', className: 'bg-orange-100 text-orange-800 border-orange-200' },
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

export default function CamionesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activoFilter, setActivoFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isMileageOpen, setIsMileageOpen] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [newMileage, setNewMileage] = useState<string>('');

  // Queries
  const { data: trucksData, isLoading } = useQuery({
    queryKey: ['trucks', { page, limit, search, status: statusFilter, isActive: activoFilter }],
    queryFn: () => trucksApi.getAll({
      page,
      limit,
      search: search || undefined,
      status: statusFilter !== 'all' ? statusFilter as TruckStatus : undefined,
      isActive: activoFilter !== 'all' ? activoFilter === 'true' : undefined,
    }),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateTruckInput) => trucksApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      toast({ title: 'Camión creado', description: 'El camión ha sido creado exitosamente.' });
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Error al crear',
        description: getErrorMessage(error, 'No se pudo crear el camión.'),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTruckInput }) => trucksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      toast({ title: 'Camión actualizado', description: 'El camión ha sido actualizado.' });
      setIsEditOpen(false);
      setSelectedTruck(null);
      editForm.reset();
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Error al actualizar',
        description: getErrorMessage(error, 'No se pudo actualizar el camión.'),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => trucksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      toast({ title: 'Camión desactivado', description: 'El camión ha sido desactivado.' });
      setIsDeleteOpen(false);
      setSelectedTruck(null);
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getErrorMessage(error, 'No se pudo desactivar el camión.'),
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => trucksApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      toast({ title: 'Camión reactivado', description: 'El camión ha sido reactivado.' });
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getErrorMessage(error, 'No se pudo reactivar el camión.'),
      });
    },
  });

  const mileageMutation = useMutation({
    mutationFn: ({ id, mileage }: { id: string; mileage: number }) => trucksApi.updateMileage(id, mileage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      toast({ title: 'Kilometraje actualizado', description: 'El kilometraje ha sido actualizado.' });
      setIsMileageOpen(false);
      setSelectedTruck(null);
      setNewMileage('');
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getErrorMessage(error, 'No se pudo actualizar el kilometraje.'),
      });
    },
  });

  // Forms
  const createForm = useForm<TruckFormData>({
    resolver: zodResolver(truckSchema),
    defaultValues: {
      plateNumber: '', brand: '', model: '', year: new Date().getFullYear(),
      color: '', axles: 2, capacityTons: 30, operationPermit: '', operationPermitExpiry: '', mileage: 0,
    },
  });

  const editForm = useForm<TruckFormData>({
    resolver: zodResolver(truckSchema),
    defaultValues: {
      plateNumber: '', brand: '', model: '', year: new Date().getFullYear(),
      color: '', axles: 2, capacityTons: 30, operationPermit: '', operationPermitExpiry: '', mileage: 0,
    },
  });

  // Handlers
  const handleCreate = (data: TruckFormData) => {
    createMutation.mutate({
      plateNumber: data.plateNumber,
      brand: data.brand,
      model: data.model,
      year: data.year,
      color: data.color || undefined,
      axles: data.axles,
      capacityTons: data.capacityTons,
      operationPermit: data.operationPermit || undefined,
      operationPermitExpiry: data.operationPermitExpiry || undefined,
      mileage: data.mileage,
    });
  };

  const handleEdit = (data: TruckFormData) => {
    if (!selectedTruck) return;
    updateMutation.mutate({
      id: selectedTruck.id,
      data: {
        plateNumber: data.plateNumber,
        brand: data.brand,
        model: data.model,
        year: data.year,
        color: data.color || undefined,
        axles: data.axles,
        capacityTons: data.capacityTons,
        operationPermit: data.operationPermit || undefined,
        operationPermitExpiry: data.operationPermitExpiry || undefined,
      },
    });
  };

  const handleDelete = () => {
    if (!selectedTruck) return;
    deleteMutation.mutate(selectedTruck.id);
  };

  const handleRestore = (truck: Truck) => {
    restoreMutation.mutate(truck.id);
  };

  const handleMileage = () => {
    if (!selectedTruck || !newMileage) return;
    mileageMutation.mutate({ id: selectedTruck.id, mileage: parseInt(newMileage) });
  };

  const openEditDialog = (truck: Truck) => {
    setSelectedTruck(truck);
    editForm.reset({
      plateNumber: truck.plateNumber,
      brand: truck.brand,
      model: truck.model,
      year: truck.year,
      color: truck.color || '',
      axles: truck.axles || 2,
      capacityTons: truck.capacityTons,
      operationPermit: truck.operationPermit || '',
      operationPermitExpiry: truck.operationPermitExpiry ? truck.operationPermitExpiry.split('T')[0] : '',
      mileage: truck.mileage,
    });
    setIsEditOpen(true);
  };

  const openMileageDialog = (truck: Truck) => {
    setSelectedTruck(truck);
    setNewMileage(String(truck.mileage));
    setIsMileageOpen(true);
  };

  // Pagination
  const totalPages = trucksData?.pagination?.totalPages || 1;
  const totalTrucks = trucksData?.pagination?.total || 0;
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const trucks = trucksData?.data || [];

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gestión de Camiones</h1>
          <p className="text-gray-500 mt-1">Administra la flota de camiones</p>
        </div>
        <Button className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" onClick={() => { createForm.reset(); setIsCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo Camión
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por placa, marca, modelo..."
                className="pl-10"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="AVAILABLE">Disponible</SelectItem>
                <SelectItem value="SCHEDULED">Programado</SelectItem>
                <SelectItem value="IN_TRANSIT">En Tránsito</SelectItem>
                <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
              </SelectContent>
            </Select>
            <Select value={activoFilter} onValueChange={(v) => { setActivoFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="Activos" /></SelectTrigger>
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
                      <TableHead>Placa</TableHead>
                      <TableHead>Marca/Modelo</TableHead>
                      <TableHead>Año</TableHead>
                      <TableHead>Capacidad</TableHead>
                      <TableHead>Kilometraje</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Activo</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trucks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No se encontraron camiones
                        </TableCell>
                      </TableRow>
                    ) : (
                      trucks.map((truck) => (
                        <TableRow key={truck.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-[#1B3F66] flex items-center justify-center text-white">
                                <TruckIcon className="h-4 w-4" />
                              </div>
                              <div className="font-medium">{truck.plateNumber}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>{truck.brand}</div>
                            <div className="text-sm text-gray-500">{truck.model}</div>
                          </TableCell>
                          <TableCell>{truck.year}</TableCell>
                          <TableCell>{truck.capacityTons} Tn</TableCell>
                          <TableCell>{truck.mileage?.toLocaleString()} km</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusConfig[truck.status]?.className}>
                              {statusConfig[truck.status]?.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={truck.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {truck.isActive ? 'Activo' : 'Inactivo'}
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
                                <DropdownMenuItem onClick={() => openMileageDialog(truck)}>
                                  <Gauge className="h-4 w-4 mr-2" /> Actualizar KM
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditDialog(truck)}>
                                  <Edit className="h-4 w-4 mr-2" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {truck.isActive ? (
                                  <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedTruck(truck); setIsDeleteOpen(true); }}>
                                    <Trash2 className="h-4 w-4 mr-2" /> Desactivar
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem className="text-green-600" onClick={() => handleRestore(truck)}>
                                    <RotateCcw className="h-4 w-4 mr-2" /> Reactivar
                                  </DropdownMenuItem>
                                )}
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
              {trucks.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-gray-500">
                    Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, totalTrucks)} de {totalTrucks} camiones
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
            <DialogTitle>Crear Camión</DialogTitle>
            <DialogDescription>Ingresa los datos del nuevo camión</DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Controller name="plateNumber" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Placa *</Label>
                  <Input {...field} placeholder="ABC-1234" className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="capacityTons" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Capacidad (Tn) *</Label>
                  <Input {...field} type="number" placeholder="30" value={field.value || ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)} className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Controller name="brand" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Marca *</Label>
                  <Input {...field} placeholder="Volvo" className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="model" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Modelo *</Label>
                  <Input {...field} placeholder="FH 540" className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Controller name="year" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Año *</Label>
                  <Input {...field} type="number" placeholder="2024" value={field.value || ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : new Date().getFullYear())} className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="axles" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Ejes</Label>
                  <Input {...field} type="number" placeholder="3" value={field.value || ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} className={fieldState.invalid ? 'border-red-500' : ''} />
                </div>
              )} />
              <Controller name="mileage" control={createForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Kilometraje</Label>
                  <Input {...field} type="number" placeholder="0" value={field.value || ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)} />
                </div>
              )} />
            </div>
            <Controller name="color" control={createForm.control} render={({ field }) => (
              <div className="space-y-2">
                <Label>Color</Label>
                <Input {...field} placeholder="Blanco" />
              </div>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <Controller name="operationPermit" control={createForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Tarjeta de Operación</Label>
                  <Input {...field} placeholder="PERM-2024-001" />
                </div>
              )} />
              <Controller name="operationPermitExpiry" control={createForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Vencimiento T.O.</Label>
                  <Input {...field} type="date" value={field.value || ''} />
                </div>
              )} />
            </div>
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
            <DialogTitle>Editar Camión</DialogTitle>
            <DialogDescription>Modifica los datos del camión</DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Controller name="plateNumber" control={editForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Placa *</Label>
                  <Input {...field} className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="capacityTons" control={editForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Capacidad (Tn) *</Label>
                  <Input {...field} type="number" value={field.value || ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)} className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Controller name="brand" control={editForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Marca *</Label>
                  <Input {...field} className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="model" control={editForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Modelo *</Label>
                  <Input {...field} className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Controller name="year" control={editForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Año *</Label>
                  <Input {...field} type="number" value={field.value || ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : new Date().getFullYear())} className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="axles" control={editForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Ejes</Label>
                  <Input {...field} type="number" value={field.value || ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                </div>
              )} />
              <Controller name="color" control={editForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input {...field} />
                </div>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Controller name="operationPermit" control={editForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Tarjeta de Operación</Label>
                  <Input {...field} />
                </div>
              )} />
              <Controller name="operationPermitExpiry" control={editForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Vencimiento T.O.</Label>
                  <Input {...field} type="date" value={field.value || ''} />
                </div>
              )} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Mileage Dialog */}
      <Dialog open={isMileageOpen} onOpenChange={setIsMileageOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Actualizar Kilometraje</DialogTitle>
            <DialogDescription>
              Camión: {selectedTruck?.plateNumber} - KM actual: {selectedTruck?.mileage?.toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Nuevo Kilometraje</Label>
            <Input
              type="number"
              value={newMileage}
              onChange={(e) => setNewMileage(e.target.value)}
              placeholder="Ingrese el nuevo kilometraje"
              min={selectedTruck?.mileage || 0}
            />
            <p className="text-sm text-gray-500 mt-2">
              El nuevo kilometraje debe ser mayor al actual
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMileageOpen(false)}>Cancelar</Button>
            <Button className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" onClick={handleMileage} disabled={mileageMutation.isPending}>
              {mileageMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Actualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar camión?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará el camión {selectedTruck?.plateNumber}.
              El camión no estará disponible para nuevos viajes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
