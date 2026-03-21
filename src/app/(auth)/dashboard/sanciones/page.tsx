'use client';

import { useState, useMemo } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import {
  useSanctions,
  useSanctionTypes,
  useSanctionStats,
  useActiveSanctions,
  useCreateSanction,
  useUpdateSanction,
  useCompleteSanction,
  useCancelSanction,
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
  AlertTriangle,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  Edit,
  Loader2,
  AlertOctagon,
} from 'lucide-react';
import type { Sanction, SanctionType, SanctionStatus, CreateSanctionInput, UpdateSanctionInput } from '@/types/api';

// Según el backend: PENDING, COMPLETED, CANCELLED
const statusConfig: Record<SanctionStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
  COMPLETED: { label: 'Completada', className: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelada', className: 'bg-gray-100 text-gray-800' },
};

// Según el backend: FINE, SUSPENSION, WARNING
const typeConfig: Record<SanctionType, { label: string; className: string }> = {
  WARNING: { label: 'Amonestación', className: 'bg-yellow-100 text-yellow-800' },
  FINE: { label: 'Multa', className: 'bg-orange-100 text-orange-800' },
  SUSPENSION: { label: 'Suspensión', className: 'bg-red-100 text-red-800' },
};

// Helper functions para manejar la estructura del backend
const getStatusValue = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null && 'count' in value) {
    return (value as { count: number }).count;
  }
  return 0;
};

const getStatusAmount = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null && 'amount' in value) {
    return (value as { amount: number }).amount;
  }
  return 0;
};

// Helper para obtener nombre completo del driver (maneja ambas estructuras)
const getDriverName = (driver: { 
  fullName?: string; 
  firstName?: string; 
  lastName?: string;
  employee?: { firstName?: string; lastName?: string }; 
} | null | undefined): string => {
  if (!driver) return '-';
  // Si tiene fullName, usarlo
  if (driver.fullName) return driver.fullName;
  // Si tiene employee con firstName/lastName (estructura backend)
  if (driver.employee?.firstName && driver.employee?.lastName) {
    return `${driver.employee.firstName} ${driver.employee.lastName}`;
  }
  if (driver.employee?.firstName) return driver.employee.firstName;
  if (driver.employee?.lastName) return driver.employee.lastName;
  // Si tiene firstName/lastName directo
  if (driver.firstName && driver.lastName) {
    return `${driver.firstName} ${driver.lastName}`;
  }
  return driver.firstName || driver.lastName || '-';
};

export default function SancionesPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [driverFilter, setDriverFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSanction, setEditingSanction] = useState<Sanction | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const params = useMemo(() => ({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    type: typeFilter !== 'all' ? typeFilter as SanctionType : undefined,
    status: statusFilter !== 'all' ? statusFilter as SanctionStatus : undefined,
    driverId: driverFilter !== 'all' ? driverFilter : undefined,
  }), [page, debouncedSearch, typeFilter, statusFilter, driverFilter]);

  const { data: sanctionsData, isLoading } = useSanctions(params);
  const { data: types } = useSanctionTypes();
  const { data: stats } = useSanctionStats();
  const { data: active } = useActiveSanctions();
  const { data: driversData } = useDriversList({ limit: 100 });

  const createMutation = useCreateSanction();
  const updateMutation = useUpdateSanction();
  const completeMutation = useCompleteSanction();
  const cancelMutation = useCancelSanction();

  const handleOpenDialog = (sanction?: Sanction) => {
    setEditingSanction(sanction || null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSanction(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: CreateSanctionInput | UpdateSanctionInput = {
      driverId: formData.get('driverId') as string,
      type: formData.get('type') as SanctionType,
      reason: formData.get('reason') as string,
      amount: parseFloat(formData.get('amount') as string) || undefined,
      startDate: formData.get('startDate') as string || undefined,
      notes: formData.get('notes') as string || undefined,
    };

    if (editingSanction) {
      updateMutation.mutate({ id: editingSanction.id, data }, { onSuccess: handleCloseDialog });
    } else {
      createMutation.mutate(data as CreateSanctionInput, { onSuccess: handleCloseDialog });
    }
  };

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '-';
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(num);
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-BO');
  };

  // Obtener datos de forma segura
  const sanctionList = sanctionsData?.data || [];
  const pagination = sanctionsData?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3F66]">Sanciones</h1>
          <p className="text-gray-600">Control de sanciones a conductores</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-[#1B3F66] hover:bg-[#0F2A47]">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Sanción
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Sanciones</CardTitle>
              <AlertTriangle className="h-4 w-4 text-[#1B3F66]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getStatusValue(stats.total)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pendientes</CardTitle>
              <AlertOctagon className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{getStatusValue(stats.byStatus?.PENDING)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Multas Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(getStatusAmount(stats.totalFines) || getStatusAmount(stats.byType?.FINE))}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Amonestaciones</CardTitle>
              <Users className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getStatusValue(stats.byType?.WARNING)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Sanctions Alert */}
      {active && active.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800">
              Sanciones Activas ({active.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {active.slice(0, 5).map((s) => (
                <Badge key={s.id} variant="outline" className="bg-white">
                  {getDriverName(s.driver)} - {typeConfig[s.type]?.label || s.type}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por conductor o motivo..."
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
            {(driversData?.data || []).map((driver) => (
              <SelectItem key={driver.id} value={driver.id}>
                {getDriverName(driver)}
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
            {Object.entries(typeConfig).map(([value, config]) => (
              <SelectItem key={value} value={value}>{config.label}</SelectItem>
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
              <TableHead>Conductor</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Fecha Inicio</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
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
            ) : sanctionList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No se encontraron sanciones
                </TableCell>
              </TableRow>
            ) : (
              sanctionList.map((sanction) => (
                <TableRow key={sanction.id}>
                  <TableCell className="font-medium">{getDriverName(sanction.driver)}</TableCell>
                  <TableCell>
                    <Badge className={typeConfig[sanction.type]?.className || 'bg-gray-100 text-gray-800'}>
                      {typeConfig[sanction.type]?.label || sanction.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{sanction.reason}</TableCell>
                  <TableCell>{formatDate(sanction.startDate)}</TableCell>
                  <TableCell>{sanction.amount ? formatCurrency(sanction.amount) : '-'}</TableCell>
                  <TableCell>
                    <Badge className={statusConfig[sanction.status]?.className || 'bg-gray-100 text-gray-800'}>
                      {statusConfig[sanction.status]?.label || sanction.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(sanction)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {sanction.status === 'PENDING' && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => completeMutation.mutate(sanction.id)} title="Completar">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => cancelMutation.mutate({ id: sanction.id })} title="Cancelar">
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
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
            <DialogTitle>{editingSanction ? 'Editar Sanción' : 'Nueva Sanción'}</DialogTitle>
            <DialogDescription>
              {editingSanction ? 'Modifica los datos de la sanción' : 'Registra una nueva sanción'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="driverId">Conductor *</Label>
              <Select name="driverId" defaultValue={editingSanction?.driverId} required>
                <SelectTrigger><SelectValue placeholder="Seleccionar conductor" /></SelectTrigger>
                <SelectContent>
                  {(driversData?.data || []).map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>{getDriverName(driver)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select name="type" defaultValue={editingSanction?.type || 'WARNING'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(typeConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo *</Label>
              <Input id="reason" name="reason" defaultValue={editingSanction?.reason} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha de Inicio</Label>
                <Input id="startDate" name="startDate" type="date" defaultValue={editingSanction?.startDate?.split('T')[0]} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Monto (BOB)</Label>
                <Input id="amount" name="amount" type="number" step="0.01" defaultValue={editingSanction?.amount || ''} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Input id="notes" name="notes" defaultValue={editingSanction?.notes || ''} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
              <Button type="submit" className="bg-[#1B3F66] hover:bg-[#0F2A47]" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingSanction ? 'Guardar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
