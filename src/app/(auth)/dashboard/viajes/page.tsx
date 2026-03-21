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
  Loader2,
  ChevronLeft,
  ChevronRight,
  Route,
  Truck,
  User,
  FileText,
  MapPin,
  Calendar,
  Weight,
  DollarSign,
  Eye,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
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
import { 
  tripsApi, 
  blsApi, 
  trucksApi, 
  driversApi, 
  trailersApi,
} from '@/lib/api-client';
import { 
  Trip, 
  CreateTripInput, 
  UpdateTripInput, 
  TripStatus,
} from '@/types/api';

// Form schema
const tripSchema = z.object({
  micDta: z.string().min(1, 'El MIC/DTA es requerido'),
  departureDate: z.string().min(1, 'La fecha de salida es requerida'),
  arrivalDate: z.string().optional().or(z.literal('')),
  billOfLadingId: z.string().min(1, 'El BL es requerido'),
  truckId: z.string().min(1, 'El camión es requerido'),
  driverId: z.string().min(1, 'El conductor es requerido'),
  trailerId: z.string().optional().or(z.literal('')),
  weight: z.number().min(0.01, 'El peso debe ser mayor a 0'),
  ratePerTon: z.number().optional(),
  notes: z.string().optional().or(z.literal('')),
});

type TripFormData = z.infer<typeof tripSchema>;

// Status config
const statusConfig: Record<TripStatus, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  SCHEDULED: { label: 'Programado', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
  IN_TRANSIT: { label: 'En Tránsito', className: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Play },
  AT_BORDER: { label: 'En Frontera', className: 'bg-orange-50 text-orange-700 border-orange-200', icon: AlertTriangle },
  DELIVERED: { label: 'Entregado', className: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
  CANCELLED: { label: 'Cancelado', className: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
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

export default function ViajesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [blFilter, setBlFilter] = useState<string>('');
  const [driverFilter, setDriverFilter] = useState<string>('');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  // Queries
  const { data: tripsData, isLoading } = useQuery({
    queryKey: ['trips', { page, limit, search, status: statusFilter, blId: blFilter, driverId: driverFilter, dateFrom: dateFromFilter, dateTo: dateToFilter }],
    queryFn: () => tripsApi.getAll({
      page,
      limit,
      search: search || undefined,
      status: statusFilter !== 'all' ? statusFilter as TripStatus : undefined,
      blId: blFilter || undefined,
      driverId: driverFilter || undefined,
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
    }),
  });

  const { data: stats } = useQuery({
    queryKey: ['trips', 'stats'],
    queryFn: () => tripsApi.getStats(),
  });

  const { data: bls } = useQuery({
    queryKey: ['bls', 'all'],
    queryFn: () => blsApi.getAll({ limit: 100 }),
  });

  const { data: trucks } = useQuery({
    queryKey: ['trucks', 'available'],
    queryFn: () => trucksApi.getAvailable(),
  });

  const { data: drivers } = useQuery({
    queryKey: ['drivers', 'available'],
    queryFn: () => driversApi.getAvailable(),
  });

  const { data: trailers } = useQuery({
    queryKey: ['trailers', 'available'],
    queryFn: () => trailersApi.getAvailable(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateTripInput) => tripsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast({ title: 'Viaje creado', description: 'El viaje ha sido creado exitosamente.' });
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Error al crear',
        description: getErrorMessage(error, 'No se pudo crear el viaje.'),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTripInput }) => tripsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast({ title: 'Viaje actualizado', description: 'El viaje ha sido actualizado.' });
      setIsEditOpen(false);
      setSelectedTrip(null);
      editForm.reset();
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Error al actualizar',
        description: getErrorMessage(error, 'No se pudo actualizar el viaje.'),
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TripStatus }) => tripsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trucks'] }); // Refresh truck status
      queryClient.invalidateQueries({ queryKey: ['drivers'] }); // Refresh driver availability
      toast({ title: 'Estado actualizado', description: 'El estado del viaje ha sido actualizado.' });
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getErrorMessage(error, 'No se pudo actualizar el estado.'),
      });
    },
  });

  // Forms
  const createForm = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      micDta: '',
      departureDate: new Date().toISOString().split('T')[0],
      arrivalDate: '',
      billOfLadingId: '',
      truckId: '',
      driverId: '',
      trailerId: '',
      weight: 0,
      ratePerTon: undefined,
      notes: '',
    },
  });

  const editForm = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      micDta: '',
      departureDate: '',
      arrivalDate: '',
      billOfLadingId: '',
      truckId: '',
      driverId: '',
      trailerId: '',
      weight: 0,
      ratePerTon: undefined,
      notes: '',
    },
  });

  // Handlers
  const handleCreate = (data: TripFormData) => {
    createMutation.mutate({
      micDta: data.micDta,
      departureDate: data.departureDate,
      arrivalDate: data.arrivalDate || undefined,
      billOfLadingId: data.billOfLadingId,
      truckId: data.truckId,
      driverId: data.driverId,
      trailerId: data.trailerId || undefined,
      weight: data.weight,
      ratePerTon: data.ratePerTon,
      notes: data.notes || undefined,
    });
  };

  const handleEdit = (data: TripFormData) => {
    if (!selectedTrip) return;
    updateMutation.mutate({
      id: selectedTrip.id,
      data: {
        micDta: data.micDta,
        departureDate: data.departureDate,
        arrivalDate: data.arrivalDate || undefined,
        truckId: data.truckId,
        driverId: data.driverId,
        trailerId: data.trailerId || undefined,
        weight: data.weight,
        ratePerTon: data.ratePerTon,
        notes: data.notes || undefined,
      },
    });
  };

  const openEditDialog = (trip: Trip) => {
    setSelectedTrip(trip);
    editForm.reset({
      micDta: trip.micDta,
      departureDate: trip.departureDate ? trip.departureDate.split('T')[0] : '',
      arrivalDate: trip.arrivalDate ? trip.arrivalDate.split('T')[0] : '',
      billOfLadingId: trip.billOfLadingId,
      truckId: trip.truckId,
      driverId: trip.driverId,
      trailerId: trip.trailerId || '',
      weight: trip.weight,
      ratePerTon: trip.ratePerTon,
      notes: trip.notes || '',
    });
    setIsEditOpen(true);
  };

  const openDetailDialog = (trip: Trip) => {
    setSelectedTrip(trip);
    setIsDetailOpen(true);
  };

  // Pagination
  const totalPages = tripsData?.pagination?.totalPages || 1;
  const totalTrips = tripsData?.pagination?.total || 0;
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const trips = tripsData?.data || [];
  const blsList = bls?.data || [];
  const trucksList = trucks || [];
  const driversList = drivers || [];
  const trailersList = trailers || [];

  // Format weight
  const formatWeight = (weight: number) => {
    return `${weight.toLocaleString()} tn`;
  };

  // Format date
  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-BO');
  };

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gestión de Viajes</h1>
          <p className="text-gray-500 mt-1">Administra los viajes y su estado</p>
        </div>
        <Button className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" onClick={() => { createForm.reset(); setIsCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo Viaje
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Viajes</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1B3F66]">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Programados</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.byStatus?.SCHEDULED || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Tránsito</CardTitle>
            <Play className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.byStatus?.IN_TRANSIT || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.byStatus?.DELIVERED || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peso Total</CardTitle>
            <Weight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1B3F66]">{formatWeight(stats?.totalWeight || 0)}</div>
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
                placeholder="Buscar por MIC/DTA..."
                className="pl-10"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
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
                      <TableHead>MIC/DTA</TableHead>
                      <TableHead>BL</TableHead>
                      <TableHead>Camión</TableHead>
                      <TableHead>Conductor</TableHead>
                      <TableHead>Fecha Salida</TableHead>
                      <TableHead>Peso</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trips.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No se encontraron viajes
                        </TableCell>
                      </TableRow>
                    ) : (
                      trips.map((trip) => {
                        const stConfig = statusConfig[trip.status];
                        const StatusIcon = stConfig?.icon || Route;
                        return (
                          <TableRow key={trip.id} className="hover:bg-gray-50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-[#1B3F66] flex items-center justify-center text-white">
                                  <Route className="h-4 w-4" />
                                </div>
                                <span className="font-medium">{trip.micDta}</span>
                              </div>
                            </TableCell>
                            <TableCell>{trip.billOfLading?.blNumber || '-'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Truck className="h-4 w-4 text-gray-400" />
                                {trip.truck?.plateNumber || '-'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                {trip.driver?.fullName || `${trip.driver?.firstName || ''} ${trip.driver?.lastName || ''}`.trim() || '-'}
                              </div>
                            </TableCell>
                            <TableCell>{formatDate(trip.departureDate)}</TableCell>
                            <TableCell className="font-semibold">{formatWeight(trip.weight)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={stConfig?.className}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {stConfig?.label || trip.status}
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
                                  <DropdownMenuItem onClick={() => openDetailDialog(trip)}>
                                    <Eye className="h-4 w-4 mr-2" /> Ver Detalle
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openEditDialog(trip)}>
                                    <Edit className="h-4 w-4 mr-2" /> Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {trip.status === 'SCHEDULED' && (
                                    <DropdownMenuItem onClick={() => statusMutation.mutate({ id: trip.id, status: 'IN_TRANSIT' })}>
                                      <Play className="h-4 w-4 mr-2" /> Iniciar Viaje
                                    </DropdownMenuItem>
                                  )}
                                  {trip.status === 'IN_TRANSIT' && (
                                    <>
                                      <DropdownMenuItem onClick={() => statusMutation.mutate({ id: trip.id, status: 'AT_BORDER' })}>
                                        <MapPin className="h-4 w-4 mr-2" /> En Frontera
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => statusMutation.mutate({ id: trip.id, status: 'DELIVERED' })}>
                                        <CheckCircle className="h-4 w-4 mr-2" /> Marcar Entregado
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {trip.status === 'AT_BORDER' && (
                                    <DropdownMenuItem onClick={() => statusMutation.mutate({ id: trip.id, status: 'DELIVERED' })}>
                                      <CheckCircle className="h-4 w-4 mr-2" /> Marcar Entregado
                                    </DropdownMenuItem>
                                  )}
                                  {trip.status !== 'CANCELLED' && trip.status !== 'DELIVERED' && (
                                    <DropdownMenuItem className="text-red-600" onClick={() => statusMutation.mutate({ id: trip.id, status: 'CANCELLED' })}>
                                      <XCircle className="h-4 w-4 mr-2" /> Cancelar
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
              {trips.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-gray-500">
                    Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, totalTrips)} de {totalTrips} viajes
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
            <DialogTitle>Crear Viaje</DialogTitle>
            <DialogDescription>Ingresa los datos del nuevo viaje</DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Controller name="micDta" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>MIC/DTA *</Label>
                  <Input {...field} placeholder="MIC-2024-001" className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="billOfLadingId" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Bill of Lading *</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Seleccionar BL" />
                    </SelectTrigger>
                    <SelectContent>
                      {blsList.map((bl) => (
                        <SelectItem key={bl.id} value={bl.id}>{bl.blNumber}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Controller name="departureDate" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Fecha de Salida *</Label>
                  <Input {...field} type="date" className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="arrivalDate" control={createForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Fecha de Llegada</Label>
                  <Input {...field} type="date" />
                </div>
              )} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Controller name="truckId" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Camión *</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {trucksList.map((truck) => (
                        <SelectItem key={truck.id} value={truck.id}>{truck.plateNumber}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="driverId" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Conductor *</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Seleccionar" />
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
              <Controller name="trailerId" control={createForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Remolque</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {trailersList.map((trailer) => (
                        <SelectItem key={trailer.id} value={trailer.id}>{trailer.plateNumber}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Controller name="weight" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Peso (tn) *</Label>
                  <Input {...field} type="number" step="0.01" placeholder="0.00" value={field.value || ''} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)} className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="ratePerTon" control={createForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Tarifa por Tonelada (Bs)</Label>
                  <Input {...field} type="number" step="0.01" placeholder="0.00" value={field.value || ''} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
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
            <DialogTitle>Editar Viaje</DialogTitle>
            <DialogDescription>Modifica los datos del viaje</DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Controller name="micDta" control={editForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>MIC/DTA *</Label>
                  <Input {...field} className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="billOfLadingId" control={editForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Bill of Lading</Label>
                  <Input value={selectedTrip?.billOfLading?.blNumber || '-'} disabled />
                </div>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Controller name="departureDate" control={editForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Fecha de Salida *</Label>
                  <Input {...field} type="date" className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="arrivalDate" control={editForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Fecha de Llegada</Label>
                  <Input {...field} type="date" />
                </div>
              )} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Controller name="truckId" control={editForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Camión *</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {trucksList.map((truck) => (
                        <SelectItem key={truck.id} value={truck.id}>{truck.plateNumber}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="driverId" control={editForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Conductor *</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Seleccionar" />
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
              <Controller name="trailerId" control={editForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Remolque</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {trailersList.map((trailer) => (
                        <SelectItem key={trailer.id} value={trailer.id}>{trailer.plateNumber}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Controller name="weight" control={editForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Peso (tn) *</Label>
                  <Input {...field} type="number" step="0.01" value={field.value || ''} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)} className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="ratePerTon" control={editForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Tarifa por Tonelada (Bs)</Label>
                  <Input {...field} type="number" step="0.01" value={field.value || ''} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
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

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalle del Viaje</DialogTitle>
            <DialogDescription>{selectedTrip?.micDta}</DialogDescription>
          </DialogHeader>
          {selectedTrip && (
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Bill of Lading</p>
                  <p className="font-medium">{selectedTrip.billOfLading?.blNumber || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Cliente</p>
                  <p className="font-medium">{selectedTrip.billOfLading?.client?.businessName || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Camión</p>
                  <p className="font-medium">{selectedTrip.truck?.plateNumber || '-'} ({selectedTrip.truck?.brand} {selectedTrip.truck?.model})</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Conductor</p>
                  <p className="font-medium">{selectedTrip.driver?.fullName || `${selectedTrip.driver?.firstName} ${selectedTrip.driver?.lastName}`}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Remolque</p>
                  <p className="font-medium">{selectedTrip.trailer?.plateNumber || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Peso</p>
                  <p className="font-medium">{formatWeight(selectedTrip.weight)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Fecha de Salida</p>
                  <p className="font-medium">{formatDate(selectedTrip.departureDate)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Fecha de Llegada</p>
                  <p className="font-medium">{formatDate(selectedTrip.arrivalDate)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Estado</p>
                  <Badge variant="outline" className={statusConfig[selectedTrip.status]?.className}>
                    {statusConfig[selectedTrip.status]?.label}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Tarifa/Ton</p>
                  <p className="font-medium">{selectedTrip.ratePerTon ? `Bs ${selectedTrip.ratePerTon.toLocaleString()}` : '-'}</p>
                </div>
              </div>
              {selectedTrip.notes && (
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Notas</p>
                  <p className="font-medium">{selectedTrip.notes}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <FileText className="h-5 w-5 mx-auto text-gray-400" />
                  <p className="text-sm text-gray-500 mt-1">Documentos</p>
                  <p className="font-bold text-[#1B3F66]">{selectedTrip.documentsCount || 0}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <MapPin className="h-5 w-5 mx-auto text-gray-400" />
                  <p className="text-sm text-gray-500 mt-1">Fronteras</p>
                  <p className="font-bold text-[#1B3F66]">{selectedTrip.borderCrossingsCount || 0}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Route className="h-5 w-5 mx-auto text-gray-400" />
                  <p className="text-sm text-gray-500 mt-1">Rutas</p>
                  <p className="font-bold text-[#1B3F66]">{selectedTrip.routesCount || 0}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
