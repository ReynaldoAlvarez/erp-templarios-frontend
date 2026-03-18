'use client';

import { useState, useMemo } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import {
  useDriverHistory,
  useDriverEventTypes,
  useDriverHistoryStats,
  useCreateDriverHistory,
  useDeleteDriverHistory,
  useDriversList,
} from '@/hooks/use-queries';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plus,
  Search,
  FileText,
  AlertCircle,
  Award,
  GraduationCap,
  Trash2,
  Loader2,
  User,
  Calendar,
} from 'lucide-react';
import type { DriverHistory, DriverEventType, CreateDriverHistoryInput } from '@/types/api';

const eventTypeConfig: Record<DriverEventType, { label: string; className: string; icon: typeof FileText }> = {
  INCIDENT: { label: 'Incidente', className: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  ACCIDENT: { label: 'Accidente', className: 'bg-red-100 text-red-800', icon: AlertCircle },
  AWARD: { label: 'Reconocimiento', className: 'bg-green-100 text-green-800', icon: Award },
  STATUS_CHANGE: { label: 'Cambio de Estado', className: 'bg-blue-100 text-blue-800', icon: User },
  TRAINING: { label: 'Capacitación', className: 'bg-purple-100 text-purple-800', icon: GraduationCap },
};

export default function HistorialPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [driverFilter, setDriverFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const params = useMemo(() => ({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    eventType: typeFilter !== 'all' ? typeFilter as DriverEventType : undefined,
    driverId: driverFilter !== 'all' ? driverFilter : undefined,
  }), [page, debouncedSearch, typeFilter, driverFilter]);

  const { data: historyData, isLoading } = useDriverHistory(params);
  const { data: eventTypes } = useDriverEventTypes();
  const { data: stats } = useDriverHistoryStats();
  const { data: driversData } = useDriversList({ limit: 100 });

  const createMutation = useCreateDriverHistory();
  const deleteMutation = useDeleteDriverHistory();

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: CreateDriverHistoryInput = {
      driverId: formData.get('driverId') as string,
      eventType: formData.get('eventType') as DriverEventType,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      eventDate: formData.get('eventDate') as string,
      severity: formData.get('severity') as string || undefined,
      location: formData.get('location') as string || undefined,
      involvedParties: formData.get('involvedParties') as string || undefined,
      outcome: formData.get('outcome') as string || undefined,
      points: parseInt(formData.get('points') as string) || undefined,
      notes: formData.get('notes') as string || undefined,
    };

    createMutation.mutate(data, { onSuccess: handleCloseDialog });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-BO');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3F66]">Historial de Conductores</h1>
          <p className="text-gray-600">Registro de eventos, incidentes y reconocimientos</p>
        </div>
        <Button onClick={handleOpenDialog} className="bg-[#1B3F66] hover:bg-[#0F2A47]">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Registro
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Eventos</CardTitle>
              <FileText className="h-4 w-4 text-[#1B3F66]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Incidentes</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalIncidents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Accidentes</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAccidents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Reconocimientos</CardTitle>
              <Award className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAwards}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Capacitaciones</CardTitle>
              <GraduationCap className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTraining}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por título, descripción o conductor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={driverFilter} onValueChange={setDriverFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Conductor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los conductores</SelectItem>
            {driversData?.data.map((driver) => (
              <SelectItem key={driver.id} value={driver.id}>
                {driver.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Tipo de Evento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {eventTypes?.map((type) => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Conductor</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Puntos</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#1B3F66]" />
                </TableCell>
              </TableRow>
            ) : historyData?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No se encontraron registros
                </TableCell>
              </TableRow>
            ) : (
              historyData?.data.map((record) => {
                const EventTypeIcon = eventTypeConfig[record.eventType].icon;
                return (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.driver?.fullName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <EventTypeIcon className="h-4 w-4" />
                        <Badge className={eventTypeConfig[record.eventType].className}>
                          {eventTypeConfig[record.eventType].label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{record.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{record.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(record.eventDate)}</TableCell>
                    <TableCell>{record.location || '-'}</TableCell>
                    <TableCell>{record.points ?? '-'}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(record.id)}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {historyData && historyData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando {((page - 1) * 10) + 1} - {Math.min(page * 10, historyData.pagination.total)} de {historyData.pagination.total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={!historyData.pagination.hasPrev}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={!historyData.pagination.hasNext}>
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Registro de Historial</DialogTitle>
            <DialogDescription>
              Registra un nuevo evento en el historial del conductor
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="driverId">Conductor *</Label>
              <Select name="driverId" required>
                <SelectTrigger><SelectValue placeholder="Seleccionar conductor" /></SelectTrigger>
                <SelectContent>
                  {driversData?.data.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>{driver.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventType">Tipo de Evento *</Label>
              <Select name="eventType" defaultValue="INCIDENT">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(eventTypeConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Input id="description" name="description" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventDate">Fecha del Evento *</Label>
                <Input id="eventDate" name="eventDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="severity">Severidad</Label>
                <Select name="severity" defaultValue="MEDIA">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LEVE">Leve</SelectItem>
                    <SelectItem value="MEDIA">Media</SelectItem>
                    <SelectItem value="GRAVE">Grave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <Input id="location" name="location" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="points">Puntos</Label>
                <Input id="points" name="points" type="number" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="involvedParties">Partes Involucradas</Label>
              <Input id="involvedParties" name="involvedParties" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="outcome">Resultado</Label>
              <Input id="outcome" name="outcome" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Input id="notes" name="notes" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
              <Button type="submit" className="bg-[#1B3F66] hover:bg-[#0F2A47]" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Registro
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
