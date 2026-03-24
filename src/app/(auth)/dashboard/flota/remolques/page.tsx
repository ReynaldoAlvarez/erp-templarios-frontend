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
  Link2,
  Unlink,
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
import { trailersApi, trucksApi } from '@/lib/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trailer, CreateTrailerInput, UpdateTrailerInput, Truck } from '@/types/api';

// Form schema
const trailerSchema = z.object({
  plateNumber: z.string().min(1, 'La placa es requerida'),
  type: z.string().min(1, 'El tipo es requerido'),
  brand: z.string().optional().or(z.literal('')),
  year: z.number().min(1990, 'Año inválido').max(new Date().getFullYear() + 1, 'Año inválido').optional(),
  capacityTons: z.number().min(1, 'La capacidad debe ser mayor a 0'),
  operationPermit: z.string().optional().or(z.literal('')),
  operationPermitExpiry: z.string().optional().or(z.literal('')),
});

type TrailerFormData = z.infer<typeof trailerSchema>;

// Trailer types options
const trailerTypes = [
  { value: 'Plataforma', label: 'Plataforma' },
  { value: 'Furgón', label: 'Furgón' },
  { value: 'Furgón Refrigerado', label: 'Furgón Refrigerado' },
  { value: 'Tanque', label: 'Tanque' },
  { value: 'Cisterna', label: 'Cisterna' },
  { value: 'Contenedor', label: 'Contenedor' },
  { value: 'Góndola', label: 'Góndola' },
  { value: 'Lowboy', label: 'Lowboy' },
];

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

export default function RemolquesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [activoFilter, setActivoFilter] = useState<string>('all');
  const [truckIdFilter, setTruckIdFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedTrailer, setSelectedTrailer] = useState<Trailer | null>(null);

  // Queries
  const { data: trailersData, isLoading } = useQuery({
    queryKey: ['trailers', { page, limit, search, isActive: activoFilter, truckId: truckIdFilter }],
    queryFn: () => trailersApi.getAll({
      page,
      limit,
      search: search || undefined,
      isActive: activoFilter !== 'all' ? activoFilter === 'true' : undefined,
      truckId: truckIdFilter !== 'all' ? truckIdFilter : undefined,
    }),
  });

  const { data: availableTrucks } = useQuery({
    queryKey: ['trucks', 'available'],
    queryFn: () => trucksApi.getAvailable(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateTrailerInput) => trailersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trailers'] });
      toast({ title: 'Remolque creado', description: 'El remolque ha sido creado exitosamente.' });
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Error al crear',
        description: getErrorMessage(error, 'No se pudo crear el remolque.'),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTrailerInput }) => trailersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trailers'] });
      toast({ title: 'Remolque actualizado', description: 'El remolque ha sido actualizado.' });
      setIsEditOpen(false);
      setSelectedTrailer(null);
      editForm.reset();
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Error al actualizar',
        description: getErrorMessage(error, 'No se pudo actualizar el remolque.'),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => trailersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trailers'] });
      toast({ title: 'Remolque desactivado', description: 'El remolque ha sido desactivado.' });
      setIsDeleteOpen(false);
      setSelectedTrailer(null);
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getErrorMessage(error, 'No se pudo desactivar el remolque.'),
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => trailersApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trailers'] });
      toast({ title: 'Remolque reactivado', description: 'El remolque ha sido reactivado.' });
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getErrorMessage(error, 'No se pudo reactivar el remolque.'),
      });
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, truckId }: { id: string; truckId: string | null }) => trailersApi.assign(id, truckId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trailers'] });
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      toast({ title: 'Asignación actualizada', description: 'La asignación del remolque ha sido actualizada.' });
      setIsAssignOpen(false);
      setSelectedTrailer(null);
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getErrorMessage(error, 'No se pudo actualizar la asignación.'),
      });
    },
  });

  // Forms
  const createForm = useForm<TrailerFormData>({
    resolver: zodResolver(trailerSchema),
    defaultValues: {
      plateNumber: '', type: '', brand: '', year: new Date().getFullYear(),
      capacityTons: 40, operationPermit: '', operationPermitExpiry: '',
    },
  });

  const editForm = useForm<TrailerFormData>({
    resolver: zodResolver(trailerSchema),
    defaultValues: {
      plateNumber: '', type: '', brand: '', year: new Date().getFullYear(),
      capacityTons: 40, operationPermit: '', operationPermitExpiry: '',
    },
  });

  // Handlers
  const handleCreate = (data: TrailerFormData) => {
    createMutation.mutate({
      plateNumber: data.plateNumber,
      type: data.type,
      brand: data.brand || undefined,
      year: data.year,
      capacityTons: data.capacityTons,
      operationPermit: data.operationPermit || undefined,
      operationPermitExpiry: data.operationPermitExpiry || undefined,
    });
  };

  const handleEdit = (data: TrailerFormData) => {
    if (!selectedTrailer) return;
    updateMutation.mutate({
      id: selectedTrailer.id,
      data: {
        plateNumber: data.plateNumber,
        type: data.type,
        brand: data.brand || undefined,
        year: data.year,
        capacityTons: data.capacityTons,
        operationPermit: data.operationPermit || undefined,
        operationPermitExpiry: data.operationPermitExpiry || undefined,
      },
    });
  };

  const handleDelete = () => {
    if (!selectedTrailer) return;
    deleteMutation.mutate(selectedTrailer.id);
  };

  const handleRestore = (trailer: Trailer) => {
    restoreMutation.mutate(trailer.id);
  };

  const handleAssign = (truckId: string | null) => {
    if (!selectedTrailer) return;
    assignMutation.mutate({ id: selectedTrailer.id, truckId });
  };

  const openEditDialog = (trailer: Trailer) => {
    setSelectedTrailer(trailer);
    editForm.reset({
      plateNumber: trailer.plateNumber,
      type: trailer.type,
      brand: trailer.brand || '',
      year: trailer.year || new Date().getFullYear(),
      capacityTons: trailer.capacityTons,
      operationPermit: trailer.operationPermit || '',
      operationPermitExpiry: trailer.operationPermitExpiry ? trailer.operationPermitExpiry.split('T')[0] : '',
    });
    setIsEditOpen(true);
  };

  const openAssignDialog = (trailer: Trailer) => {
    setSelectedTrailer(trailer);
    setIsAssignOpen(true);
  };

  // Pagination
  const totalPages = trailersData?.pagination?.totalPages || 1;
  const totalTrailers = trailersData?.pagination?.total || 0;
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const trailers = trailersData?.data || [];

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gestión de Remolques</h1>
          <p className="text-gray-500 mt-1">Administra los remolques de la flota</p>
        </div>
        <Button className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" onClick={() => { createForm.reset(); setIsCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo Remolque
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por placa, tipo, marca..."
                className="pl-10"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={truckIdFilter} onValueChange={(v) => { setTruckIdFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Camión asignado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="unassigned">Sin asignar</SelectItem>
                {availableTrucks?.map((truck) => (
                  <SelectItem key={truck.id} value={truck.id}>{truck.plateNumber}</SelectItem>
                ))}
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
                      <TableHead>Tipo</TableHead>
                      <TableHead>Marca/Año</TableHead>
                      <TableHead>Capacidad</TableHead>
                      <TableHead>Camión Asignado</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trailers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No se encontraron remolques
                        </TableCell>
                      </TableRow>
                    ) : (
                      trailers.map((trailer) => (
                        <TableRow key={trailer.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-[#1B3F66] flex items-center justify-center text-white">
                                <TruckIcon className="h-4 w-4" />
                              </div>
                              <div className="font-medium">{trailer.plateNumber}</div>
                            </div>
                          </TableCell>
                          <TableCell>{trailer.type}</TableCell>
                          <TableCell>
                            <div>{trailer.brand || '-'}</div>
                            <div className="text-sm text-gray-500">{trailer.year || '-'}</div>
                          </TableCell>
                          <TableCell>{trailer.capacityTons} Tn</TableCell>
                          <TableCell>
                            {trailer.truck ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {trailer.truck.plateNumber}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                                Sin asignar
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={trailer.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {trailer.isActive ? 'Activo' : 'Inactivo'}
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
                                <DropdownMenuItem onClick={() => openAssignDialog(trailer)}>
                                  {trailer.truckId ? (
                                    <><Unlink className="h-4 w-4 mr-2" /> Cambiar/Quitar Asignación</>
                                  ) : (
                                    <><Link2 className="h-4 w-4 mr-2" /> Asignar a Camión</>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditDialog(trailer)}>
                                  <Edit className="h-4 w-4 mr-2" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {trailer.isActive ? (
                                  <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedTrailer(trailer); setIsDeleteOpen(true); }}>
                                    <Trash2 className="h-4 w-4 mr-2" /> Desactivar
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem className="text-green-600" onClick={() => handleRestore(trailer)}>
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
              {trailers.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-gray-500">
                    Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, totalTrailers)} de {totalTrailers} remolques
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
            <DialogTitle>Crear Remolque</DialogTitle>
            <DialogDescription>Ingresa los datos del nuevo remolque</DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Controller name="plateNumber" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Placa *</Label>
                  <Input {...field} placeholder="REM-1234" className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="capacityTons" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Capacidad (Tn) *</Label>
                  <Input {...field} type="number" placeholder="40" value={field.value || ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)} className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Controller name="type" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {trailerTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="brand" control={createForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Marca</Label>
                  <Input {...field} placeholder="Rey" />
                </div>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Controller name="year" control={createForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Año</Label>
                  <Input {...field} type="number" placeholder="2024" value={field.value || ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                </div>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Controller name="operationPermit" control={createForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Tarjeta de Operación</Label>
                  <Input {...field} placeholder="PERM-REM-001" />
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
            <DialogTitle>Editar Remolque</DialogTitle>
            <DialogDescription>Modifica los datos del remolque</DialogDescription>
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
              <Controller name="type" control={editForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {trailerTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="brand" control={editForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Marca</Label>
                  <Input {...field} />
                </div>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Controller name="year" control={editForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Año</Label>
                  <Input {...field} type="number" value={field.value || ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
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

      {/* Assign Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Asignar Remolque a Camión</DialogTitle>
            <DialogDescription>
              Remolque: {selectedTrailer?.plateNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Label>Seleccionar Camión</Label>
            <Select onValueChange={(v) => handleAssign(v === 'none' ? null : v)}>
              <SelectTrigger>
                <SelectValue placeholder={selectedTrailer?.truck ? 'Cambiar o quitar asignación' : 'Seleccionar camión'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin asignar</SelectItem>
                {availableTrucks?.map((truck) => (
                  <SelectItem key={truck.id} value={truck.id}>{truck.plateNumber} - {truck.brand} {truck.model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTrailer?.truck && (
              <p className="text-sm text-gray-500">
                Actualmente asignado a: <strong>{selectedTrailer.truck.plateNumber}</strong>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar remolque?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará el remolque {selectedTrailer?.plateNumber}.
              El remolque no estará disponible para nuevos viajes.
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
