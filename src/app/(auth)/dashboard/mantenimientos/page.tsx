'use client';

import { useState, useMemo } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import {
  useMaintenance,
  useMaintenanceTypes,
  useMaintenanceStats,
  useCreateMaintenance,
  useUpdateMaintenance,
  useStartMaintenance,
  useCompleteMaintenance,
  useTrucksList,
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
  Wrench,
  DollarSign,
  Clock,
  Calendar,
  Edit,
  Play,
  CheckCircle,
  Loader2,
  Truck,
} from 'lucide-react';
import type { Maintenance, MaintenanceType, MaintenanceStatus, CreateMaintenanceInput, UpdateMaintenanceInput } from '@/types/api';

// Según schema.prisma: PENDING, IN_PROGRESS, COMPLETED
const statusConfig: Record<MaintenanceStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
  IN_PROGRESS: { label: 'En Progreso', className: 'bg-blue-100 text-blue-800' },
  COMPLETED: { label: 'Completado', className: 'bg-green-100 text-green-800' },
};

// Según schema.prisma: PREVENTIVE, CORRECTIVE
const typeLabels: Record<MaintenanceType, string> = {
  PREVENTIVE: 'Preventivo',
  CORRECTIVE: 'Correctivo',
};

// Helper functions para manejar la estructura del backend
// El backend puede devolver byStatus como {count, cost} o como número directo
const getStatusValue = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null && 'count' in value) {
    return (value as { count: number }).count;
  }
  return 0;
};

const getStatusCost = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null && 'cost' in value) {
    return (value as { cost: number }).cost;
  }
  return 0;
};

export default function MantenimientosPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [truckFilter, setTruckFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const params = useMemo(() => ({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    type: typeFilter !== 'all' ? typeFilter as MaintenanceType : undefined,
    status: statusFilter !== 'all' ? statusFilter as MaintenanceStatus : undefined,
    truckId: truckFilter !== 'all' ? truckFilter : undefined,
  }), [page, debouncedSearch, typeFilter, statusFilter, truckFilter]);

  const { data: maintenanceData, isLoading } = useMaintenance(params);
  const { data: types } = useMaintenanceTypes();
  const { data: stats } = useMaintenanceStats();
  const { data: trucksData } = useTrucksList({ limit: 100 });

  const createMutation = useCreateMaintenance();
  const updateMutation = useUpdateMaintenance();
  const startMutation = useStartMaintenance();
  const completeMutation = useCompleteMaintenance();

  const handleOpenDialog = (maintenance?: Maintenance) => {
    setEditingMaintenance(maintenance || null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMaintenance(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: CreateMaintenanceInput | UpdateMaintenanceInput = {
      truckId: formData.get('truckId') as string,
      type: formData.get('type') as MaintenanceType,
      description: formData.get('description') as string,
      startDate: formData.get('startDate') as string || undefined,
      mileage: parseInt(formData.get('mileage') as string) || undefined,
      cost: parseFloat(formData.get('cost') as string) || undefined,
      workshop: formData.get('workshop') as string || undefined,
      notes: formData.get('notes') as string || undefined,
    };

    if (editingMaintenance) {
      updateMutation.mutate({ id: editingMaintenance.id, data }, { onSuccess: handleCloseDialog });
    } else {
      createMutation.mutate(data as CreateMaintenanceInput, { onSuccess: handleCloseDialog });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(value);
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-BO');
  };

  // Obtener datos de forma segura
  const maintenanceList = maintenanceData?.data || [];
  const pagination = maintenanceData?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3F66]">Mantenimientos</h1>
          <p className="text-gray-600">Control de mantenimiento de flota</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-[#1B3F66] hover:bg-[#0F2A47]">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Mantenimiento
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
              <Wrench className="h-4 w-4 text-[#1B3F66]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getStatusValue(stats.total)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Costo Total</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(getStatusCost(stats.totalCost))}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">En Progreso</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getStatusValue(stats.byStatus?.IN_PROGRESS)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Próximos</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getStatusValue(stats.upcomingCount)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por descripción o taller..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={truckFilter} onValueChange={setTruckFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Camión" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los camiones</SelectItem>
            {(trucksData?.data || []).map((truck) => (
              <SelectItem key={truck.id} value={truck.id}>
                {truck.plateNumber}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {Object.entries(typeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(statusConfig).map(([value, config]) => (
              <SelectItem key={value} value={value}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Camión</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Fecha Inicio</TableHead>
              <TableHead>Costo</TableHead>
              <TableHead>Taller</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#1B3F66]" />
                </TableCell>
              </TableRow>
            ) : maintenanceList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No se encontraron mantenimientos
                </TableCell>
              </TableRow>
            ) : (
              maintenanceList.map((maintenance) => (
                <TableRow key={maintenance.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-gray-400" />
                      {maintenance.truck?.plateNumber || '-'}
                    </div>
                  </TableCell>
                  <TableCell>{typeLabels[maintenance.type] || maintenance.type}</TableCell>
                  <TableCell className="max-w-xs truncate">{maintenance.description}</TableCell>
                  <TableCell>{formatDate(maintenance.startDate)}</TableCell>
                  <TableCell>{maintenance.cost ? formatCurrency(maintenance.cost) : '-'}</TableCell>
                  <TableCell>{maintenance.workshop || '-'}</TableCell>
                  <TableCell>
                    <Badge className={statusConfig[maintenance.status]?.className || 'bg-gray-100 text-gray-800'}>
                      {statusConfig[maintenance.status]?.label || maintenance.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(maintenance)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {maintenance.status === 'PENDING' && (
                        <Button variant="ghost" size="icon" onClick={() => startMutation.mutate(maintenance.id)} title="Iniciar">
                          <Play className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      {maintenance.status === 'IN_PROGRESS' && (
                        <Button variant="ghost" size="icon" onClick={() => completeMutation.mutate({ id: maintenance.id })} title="Completar">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando {((page - 1) * 10) + 1} - {Math.min(page * 10, pagination.total)} de {pagination.total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={!pagination.hasPrev}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={!pagination.hasNext}>
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingMaintenance ? 'Editar Mantenimiento' : 'Nuevo Mantenimiento'}</DialogTitle>
            <DialogDescription>
              {editingMaintenance ? 'Modifica los datos del mantenimiento' : 'Programa un nuevo mantenimiento'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="truckId">Camión *</Label>
              <Select name="truckId" defaultValue={editingMaintenance?.truckId} required>
                <SelectTrigger><SelectValue placeholder="Seleccionar camión" /></SelectTrigger>
                <SelectContent>
                  {(trucksData?.data || []).map((truck) => (
                    <SelectItem key={truck.id} value={truck.id}>
                      {truck.plateNumber} - {truck.brand} {truck.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select name="type" defaultValue={editingMaintenance?.type || 'PREVENTIVE'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Input id="description" name="description" defaultValue={editingMaintenance?.description} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha de Inicio</Label>
                <Input id="startDate" name="startDate" type="date" defaultValue={editingMaintenance?.startDate?.split('T')[0]} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mileage">Kilometraje</Label>
                <Input id="mileage" name="mileage" type="number" defaultValue={editingMaintenance?.mileage || ''} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Costo (BOB)</Label>
                <Input id="cost" name="cost" type="number" step="0.01" defaultValue={editingMaintenance?.cost || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workshop">Taller</Label>
                <Input id="workshop" name="workshop" defaultValue={editingMaintenance?.workshop || ''} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Input id="notes" name="notes" defaultValue={editingMaintenance?.notes || ''} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
              <Button type="submit" className="bg-[#1B3F66] hover:bg-[#0F2A47]" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingMaintenance ? 'Guardar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
