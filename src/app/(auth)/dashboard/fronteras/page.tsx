'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import axios from 'axios';
import {
  Search, Plus, MoreHorizontal, Loader2, ChevronLeft, ChevronRight,
  MapPin, Clock, CheckCircle, AlertTriangle, Truck, ArrowRight,
  Flag, Timer, Activity, Calendar, User, Route,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { borderCrossingsApi, tripsApi } from '@/lib/api-client';
import { BorderCrossing, CreateBorderCrossingInput, BorderChannel } from '@/types/api';

// Form schema
const borderSchema = z.object({
  tripId: z.string().min(1, 'El viaje es requerido'),
  borderName: z.string().min(1, 'El nombre de la frontera es requerido'),
  arrivedAt: z.string().optional(),
});

type BorderFormData = z.infer<typeof borderSchema>;

// Channel config
const channelConfig: Record<BorderChannel, { label: string; className: string; icon: string }> = {
  GREEN: { label: 'Canal Verde', className: 'bg-green-50 text-green-700 border-green-300', icon: '🟢' },
  YELLOW: { label: 'Canal Amarillo', className: 'bg-yellow-50 text-yellow-700 border-yellow-300', icon: '🟡' },
  RED: { label: 'Canal Rojo', className: 'bg-red-50 text-red-700 border-red-300', icon: '🔴' },
};

// Common borders
const BORDER_NAMES = [
  'Desaguadero', 'Chilecito', 'El Tambo', 'Villazón', 'Yacuiba', 
  'Bermejo', 'Puerto Suárez', 'Corumba', 'Iñapari', 'Cobija'
];

// Helper
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (axios.isAxiosError(error)) return error.response?.data?.message || defaultMessage;
  return error instanceof Error ? error.message : defaultMessage;
};

// Format datetime
const formatDateTime = (date: string | undefined) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
};

// Calculate duration
const calculateDuration = (start: string | undefined, end: string | undefined): string => {
  if (!start) return '-';
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  const diffMs = endDate.getTime() - startDate.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

export default function FronterasPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<{ crossing: BorderCrossing; channel: BorderChannel } | null>(null);

  // Queries
  const { data: activeCrossings, isLoading } = useQuery({
    queryKey: ['borderCrossings', 'active'],
    queryFn: () => borderCrossingsApi.getActive(),
  });

  const { data: stats } = useQuery({
    queryKey: ['borderCrossings', 'stats'],
    queryFn: () => borderCrossingsApi.getStats(),
  });

  const { data: trips } = useQuery({
    queryKey: ['trips', { status: 'IN_TRANSIT', limit: 100 }],
    queryFn: () => tripsApi.getAll({ status: 'IN_TRANSIT', limit: 100 }),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateBorderCrossingInput) => borderCrossingsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borderCrossings'] });
      toast({ title: 'Llegada registrada', description: 'Se registró la llegada a frontera.' });
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: (error: unknown) => {
      toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error, 'No se pudo registrar.') });
    },
  });

  const exitMutation = useMutation({
    mutationFn: (id: string) => borderCrossingsApi.registerExit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borderCrossings'] });
      toast({ title: 'Salida registrada' });
    },
    onError: (error: unknown) => {
      toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error, 'No se pudo registrar la salida.') });
    },
  });

  const channelMutation = useMutation({
    mutationFn: ({ crossingId, channel, reason }: { crossingId: string; channel: BorderChannel; reason?: string }) =>
      borderCrossingsApi.addChannelHistory(crossingId, { channel, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borderCrossings'] });
      toast({ title: 'Canal actualizado' });
      setSelectedChannel(null);
    },
    onError: (error: unknown) => {
      toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error, 'No se pudo actualizar el canal.') });
    },
  });

  // Form
  const createForm = useForm<BorderFormData>({
    resolver: zodResolver(borderSchema),
    defaultValues: { tripId: '', borderName: '', arrivedAt: new Date().toISOString() },
  });

  const handleCreate = (data: BorderFormData) => {
    createMutation.mutate({
      tripId: data.tripId,
      borderName: data.borderName,
      arrivedAt: data.arrivedAt || new Date().toISOString(),
    });
  };

  // Data
  const tripsList = trips?.data || [];

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Cruces de Frontera</h1>
          <p className="text-gray-500 mt-1">Gestión de pasos fronterizos</p>
        </div>
        <Button className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" onClick={() => { createForm.reset(); setIsCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Registrar Llegada
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.active || activeCrossings?.length || 0}</div>
            <p className="text-xs text-muted-foreground">En frontera ahora</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cruces</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1B3F66]">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <Timer className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.avgDurationHours?.toFixed(1) || 0}h</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canal Verde</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.byChannel?.GREEN || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Crossings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Cruces Activos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-[#1B3F66]" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Viaje</TableHead>
                    <TableHead>Frontera</TableHead>
                    <TableHead>Llegada</TableHead>
                    <TableHead>Tiempo</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Conductor</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!activeCrossings || activeCrossings.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No hay cruces activos</TableCell></TableRow>
                  ) : (
                    activeCrossings.map((crossing) => {
                      const currentChannel = crossing.channelHistory?.[crossing.channelHistory.length - 1]?.channel || 'GREEN';
                      const channelConf = channelConfig[currentChannel];
                      return (
                        <TableRow key={crossing.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-[#1B3F66] flex items-center justify-center text-white">
                                <Route className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium">{crossing.trip?.micDta || '-'}</p>
                                <p className="text-xs text-gray-500">{crossing.trip?.billOfLading?.blNumber}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{crossing.borderName}</span>
                            </div>
                          </TableCell>
                          <TableCell>{formatDateTime(crossing.arrivedAt)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-orange-50 text-orange-700">
                              <Clock className="h-3 w-3 mr-1" />
                              {calculateDuration(crossing.arrivedAt, crossing.exitedAt)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={channelConf?.className}>
                              {channelConf?.icon} {channelConf?.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{crossing.trip?.driver?.firstName || ''} {crossing.trip?.driver?.lastName || ''}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => exitMutation.mutate(crossing.id)}>
                                  <ArrowRight className="h-4 w-4 mr-2" /> Registrar Salida
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSelectedChannel({ crossing, channel: 'GREEN' })}>
                                  <span className="mr-2">🟢</span> Canal Verde
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSelectedChannel({ crossing, channel: 'YELLOW' })}>
                                  <span className="mr-2">🟡</span> Canal Amarillo
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSelectedChannel({ crossing, channel: 'RED' })}>
                                  <span className="mr-2">🔴</span> Canal Rojo
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
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Registrar Llegada a Frontera</DialogTitle>
            <DialogDescription>Registra la llegada del viaje a la frontera</DialogDescription>
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
                      <SelectItem key={trip.id} value={trip.id}>{trip.micDta} - {trip.billOfLading?.blNumber}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
              </div>
            )} />
            <Controller name="borderName" control={createForm.control} render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label>Frontera *</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleccionar frontera" />
                  </SelectTrigger>
                  <SelectContent>
                    {BORDER_NAMES.map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
              </div>
            )} />
            <Controller name="arrivedAt" control={createForm.control} render={({ field }) => (
              <div className="space-y-2">
                <Label>Fecha/Hora de Llegada</Label>
                <Input {...field} type="datetime-local" value={field.value ? field.value.split('.')[0] : ''} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : '')} />
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

      {/* Channel Update Dialog */}
      <Dialog open={!!selectedChannel} onOpenChange={() => setSelectedChannel(null)}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>Cambiar Canal</DialogTitle>
            <DialogDescription>
              ¿Cambiar a {selectedChannel ? channelConfig[selectedChannel.channel]?.label : ''}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSelectedChannel(null)}>Cancelar</Button>
            <Button className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" disabled={channelMutation.isPending} onClick={() => {
              if (selectedChannel) channelMutation.mutate({ crossingId: selectedChannel.crossing.id, channel: selectedChannel.channel });
            }}>
              {channelMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
