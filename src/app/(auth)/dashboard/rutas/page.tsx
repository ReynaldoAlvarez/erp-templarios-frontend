'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import axios from 'axios';
import {
  Search, Plus, MoreHorizontal, Edit, Loader2, ChevronLeft, ChevronRight,
  Route, MapPin, Clock, DollarSign, Trash2, ArrowRight, Navigation,
  TrendingUp, BarChart3, FileText,
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { routesApi, tripsApi } from '@/lib/api-client';
import { Route as RouteType, CreateRouteInput, UpdateRouteInput } from '@/types/api';

// Form schema
const routeSchema = z.object({
  tripId: z.string().min(1, 'El viaje es requerido'),
  origin: z.string().min(1, 'El origen es requerido'),
  destination: z.string().min(1, 'El destino es requerido'),
  distanceKm: z.number().optional(),
  rate: z.number().optional(),
  durationHours: z.number().optional(),
});

type RouteFormData = z.infer<typeof routeSchema>;

// Helper
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (axios.isAxiosError(error)) {
    const backendMessage = error.response?.data?.message;
    if (backendMessage) return backendMessage;
    const errors = error.response?.data?.errors;
    if (errors && Array.isArray(errors)) {
      return errors.map((e: { message?: string; msg?: string }) => e.message || e.msg).join(', ');
    }
  }
  return error instanceof Error ? error.message : defaultMessage;
};

// Format number
const formatNumber = (num: number | undefined, suffix: string = '') => {
  if (num === undefined || num === null) return '-';
  return `${num.toLocaleString('es-BO')}${suffix}`;
};

// Common cities
const COMMON_CITIES = [
  'La Paz', 'Santa Cruz', 'Cochabamba', 'Oruro', 'Potosí', 'Sucre', 'Tarija', 'Beni', 'Pando',
  'Desaguadero', 'Villazón', 'Yacuiba', 'Bermejo', 'Puerto Suárez', 'Cobija',
  'Arica', 'Iquique', 'Antofagasta', 'Ilo', 'Matarani', 'Callao', 'Lima',
];

export default function RutasPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteType | null>(null);
  const [tripFilter, setTripFilter] = useState<string>('');

  // Queries
  const { data: commonRoutes, isLoading } = useQuery({
    queryKey: ['routes', 'common'],
    queryFn: () => routesApi.getCommon(),
  });

  const { data: trips } = useQuery({
    queryKey: ['trips', { limit: 100 }],
    queryFn: () => tripsApi.getAll({ limit: 100 }),
  });

  // Filtered routes by trip
  const { data: tripRoutes } = useQuery({
    queryKey: ['routes', 'trip', tripFilter],
    queryFn: () => tripFilter ? routesApi.getByTrip(tripFilter) : Promise.resolve([]),
    enabled: !!tripFilter,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateRouteInput) => routesApi.create(data),
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      queryClient.invalidateQueries({ queryKey: ['routes', 'trip', tripId] });
      toast({ title: 'Ruta creada', description: 'La ruta ha sido creada exitosamente.' });
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: (error: unknown) => {
      toast({ variant: 'destructive', title: 'Error al crear', description: getErrorMessage(error, 'No se pudo crear la ruta.') });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRouteInput }) => routesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      toast({ title: 'Ruta actualizada' });
      setIsEditOpen(false);
      setSelectedRoute(null);
    },
    onError: (error: unknown) => {
      toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error, 'No se pudo actualizar.') });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => routesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      toast({ title: 'Ruta eliminada' });
      setIsDeleteOpen(false);
      setSelectedRoute(null);
    },
    onError: (error: unknown) => {
      toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error, 'No se pudo eliminar.') });
    },
  });

  // Forms
  const createForm = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      tripId: '', origin: '', destination: '', distanceKm: undefined, rate: undefined, durationHours: undefined,
    },
  });

  const editForm = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      tripId: '', origin: '', destination: '', distanceKm: undefined, rate: undefined, durationHours: undefined,
    },
  });

  // Handlers
  const handleCreate = (data: RouteFormData) => {
    createMutation.mutate({
      tripId: data.tripId,
      origin: data.origin,
      destination: data.destination,
      distanceKm: data.distanceKm,
      rate: data.rate,
      durationHours: data.durationHours,
    });
  };

  const handleEdit = (data: RouteFormData) => {
    if (!selectedRoute) return;
    updateMutation.mutate({
      id: selectedRoute.id,
      data: {
        origin: data.origin,
        destination: data.destination,
        distanceKm: data.distanceKm,
        rate: data.rate,
        durationHours: data.durationHours,
      },
    });
  };

  const openEditDialog = (route: RouteType) => {
    setSelectedRoute(route);
    editForm.reset({
      tripId: route.tripId,
      origin: route.origin,
      destination: route.destination,
      distanceKm: route.distanceKm,
      rate: route.rate,
      durationHours: route.durationHours,
    });
    setIsEditOpen(true);
  };

  // Data
  const routes = tripFilter ? (tripRoutes || []) : (commonRoutes || []);
  const tripsList = trips?.data || [];

  // Stats
  const totalDistance = routes.reduce((sum, r) => sum + (r.distanceKm || 0), 0);
  const avgDistance = routes.length > 0 ? totalDistance / routes.filter(r => r.distanceKm).length : 0;
  const totalRate = routes.reduce((sum, r) => sum + (r.rate || 0), 0);

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gestión de Rutas</h1>
          <p className="text-gray-500 mt-1">Administra las rutas de los viajes</p>
        </div>
        <Button className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" onClick={() => { createForm.reset(); setIsCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nueva Ruta
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rutas</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1B3F66]">{routes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distancia Total</CardTitle>
            <Navigation className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatNumber(totalDistance, ' km')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio/Ruta</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatNumber(avgDistance, ' km')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tarifas</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatNumber(totalRate, ' Bs')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Buscar por origen o destino..." className="pl-10" disabled />
            </div>
            <Select value={tripFilter} onValueChange={setTripFilter}>
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Filtrar por viaje" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las rutas</SelectItem>
                {tripsList.map((trip) => (
                  <SelectItem key={trip.id} value={trip.id}>
                    {trip.micDta} - {trip.billOfLading?.blNumber}
                  </SelectItem>
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
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-[#1B3F66]" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Origen</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Distancia</TableHead>
                    <TableHead>Tarifa</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Viaje</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No se encontraron rutas
                      </TableCell>
                    </TableRow>
                  ) : (
                    routes.map((route) => (
                      <TableRow key={route.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                              <MapPin className="h-4 w-4 text-green-600" />
                            </div>
                            <span className="font-medium">{route.origin}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{route.destination}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {formatNumber(route.distanceKm, ' km')}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {route.rate ? `${route.rate.toLocaleString('es-BO')} Bs` : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-gray-400" />
                            {route.durationHours ? `${route.durationHours}h` : '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            <FileText className="h-3 w-3 mr-1" />
                            Viaje
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
                              <DropdownMenuItem onClick={() => openEditDialog(route)}>
                                <Edit className="h-4 w-4 mr-2" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => { setSelectedRoute(route); setIsDeleteOpen(true); }}
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
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crear Ruta</DialogTitle>
            <DialogDescription>Ingresa los datos de la nueva ruta</DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4 py-4">
            <Controller name="tripId" control={createForm.control} render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label>Viaje *</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleccionar viaje" />
                  </SelectTrigger>
                  <SelectContent>
                    {tripsList.map((trip) => (
                      <SelectItem key={trip.id} value={trip.id}>
                        {trip.micDta} - {trip.billOfLading?.blNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
              </div>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <Controller name="origin" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Origen *</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Ciudad origen" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_CITIES.map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="destination" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Destino *</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Ciudad destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_CITIES.map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Controller name="distanceKm" control={createForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Distancia (km)</Label>
                  <Input
                    {...field}
                    type="number"
                    placeholder="0"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
              )} />
              <Controller name="rate" control={createForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Tarifa (Bs)</Label>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
              )} />
              <Controller name="durationHours" control={createForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Duración (h)</Label>
                  <Input
                    {...field}
                    type="number"
                    step="0.5"
                    placeholder="0"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Ruta</DialogTitle>
            <DialogDescription>Modifica los datos de la ruta</DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Controller name="origin" control={editForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Origen *</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Ciudad origen" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_CITIES.map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="destination" control={editForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Destino *</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Ciudad destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_CITIES.map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Controller name="distanceKm" control={editForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Distancia (km)</Label>
                  <Input
                    {...field}
                    type="number"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
              )} />
              <Controller name="rate" control={editForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Tarifa (Bs)</Label>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
              )} />
              <Controller name="durationHours" control={editForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Duración (h)</Label>
                  <Input
                    {...field}
                    type="number"
                    step="0.5"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
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

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar ruta?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar la ruta de {selectedRoute?.origin} a {selectedRoute?.destination}? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => selectedRoute && deleteMutation.mutate(selectedRoute.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
