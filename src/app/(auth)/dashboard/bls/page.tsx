'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Anchor,
  CheckCircle,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { blsApi, clientesApi } from '@/lib/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BillOfLading, CreateBLInput, UpdateBLInput, BLStatus, DeliveryType } from '@/types/api';

// Form schemas - using backend field names
const blSchema = z.object({
  blNumber: z.string().min(1, 'El número de BL es requerido'),
  totalWeight: z.number().min(0.01, 'El peso debe ser mayor a 0'),
  unitCount: z.number().min(1, 'Las unidades deben ser al menos 1'),
  cargoType: z.string().optional().or(z.literal('')),
  originPort: z.string().min(1, 'El puerto de origen es requerido'),
  customsPoint: z.string().min(1, 'La aduana es requerida'),
  finalDestination: z.string().min(1, 'El destino final es requerido'),
  vessel: z.string().optional().or(z.literal('')),
  consignee: z.string().optional().or(z.literal('')),
  deliveryType: z.enum(['DIRECT', 'INDIRECT']).optional(),
  clientId: z.string().min(1, 'El cliente es requerido'),
});

// Cancel reason schema
const cancelSchema = z.object({
  reason: z.string().min(1, 'La razón de cancelación es requerida'),
});

type BLFormData = z.infer<typeof blSchema>;
type CancelFormData = z.infer<typeof cancelSchema>;

// Status badge config
const statusConfig: Record<BLStatus, { label: string; className: string }> = {
  SCHEDULED: { label: 'Programado', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  IN_TRANSIT: { label: 'En Tránsito', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  DELIVERED: { label: 'Entregado', className: 'bg-green-100 text-green-800 border-green-200' },
  CANCELLED: { label: 'Cancelado', className: 'bg-red-100 text-red-800 border-red-200' },
};

const deliveryTypeConfig: Record<DeliveryType, { label: string }> = {
  DIRECT: { label: 'Directo' },
  INDIRECT: { label: 'Indirecto' },
};

export default function BLsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clienteFilter, setClienteFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [selectedBL, setSelectedBL] = useState<BillOfLading | null>(null);

  // Queries
  const { data: blsData, isLoading } = useQuery({
    queryKey: ['bls', { page, limit, search, status: statusFilter, clientId: clienteFilter }],
    queryFn: () => blsApi.getAll({
      page,
      limit,
      search: search || undefined,
      status: statusFilter !== 'all' ? statusFilter as BLStatus : undefined,
      clientId: clienteFilter !== 'all' ? clienteFilter : undefined,
    }),
  });

  const { data: clientesData } = useQuery({
    queryKey: ['clientes', { limit: 100 }],
    queryFn: () => clientesApi.getAll({ limit: 100 }),
  });

  const clientes = clientesData?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateBLInput) => blsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bls'] });
      toast({
        title: 'BL creado',
        description: 'El Bill of Lading ha sido creado exitosamente.',
      });
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo crear el BL. Intente nuevamente.',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBLInput }) =>
      blsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bls'] });
      toast({
        title: 'BL actualizado',
        description: 'El Bill of Lading ha sido actualizado exitosamente.',
      });
      setIsEditOpen(false);
      setSelectedBL(null);
      editForm.reset();
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el BL. Intente nuevamente.',
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      blsApi.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bls'] });
      toast({
        title: 'BL cancelado',
        description: 'El Bill of Lading ha sido cancelado exitosamente.',
      });
      setIsCancelOpen(false);
      setSelectedBL(null);
      cancelForm.reset();
    },
    onError: (error: Error) => {
      const message = error?.message || 'No se pudo cancelar el BL. Intente nuevamente.';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => blsApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bls'] });
      toast({
        title: 'BL aprobado',
        description: 'El Bill of Lading ha sido aprobado exitosamente.',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo aprobar el BL. Intente nuevamente.',
      });
    },
  });

  // Forms
  const createForm = useForm<BLFormData>({
    resolver: zodResolver(blSchema),
    defaultValues: {
      blNumber: '',
      totalWeight: 0,
      unitCount: 1,
      cargoType: '',
      originPort: '',
      customsPoint: '',
      finalDestination: '',
      vessel: '',
      consignee: '',
      deliveryType: 'DIRECT',
      clientId: '',
    },
  });

  const editForm = useForm<BLFormData>({
    resolver: zodResolver(blSchema),
    defaultValues: {
      blNumber: '',
      totalWeight: 0,
      unitCount: 1,
      cargoType: '',
      originPort: '',
      customsPoint: '',
      finalDestination: '',
      vessel: '',
      consignee: '',
      deliveryType: 'DIRECT',
      clientId: '',
    },
  });

  const cancelForm = useForm<CancelFormData>({
    resolver: zodResolver(cancelSchema),
    defaultValues: {
      reason: '',
    },
  });

  // Handlers
  const handleCreate = async (data: BLFormData) => {
    createMutation.mutate({
      blNumber: data.blNumber,
      totalWeight: data.totalWeight,
      unitCount: data.unitCount,
      cargoType: data.cargoType || undefined,
      originPort: data.originPort,
      customsPoint: data.customsPoint,
      finalDestination: data.finalDestination,
      vessel: data.vessel || undefined,
      consignee: data.consignee || undefined,
      deliveryType: data.deliveryType,
      clientId: data.clientId,
    });
  };

  const handleEdit = async (data: BLFormData) => {
    if (!selectedBL) return;
    updateMutation.mutate({
      id: selectedBL.id,
      data: {
        blNumber: data.blNumber,
        totalWeight: data.totalWeight,
        unitCount: data.unitCount,
        cargoType: data.cargoType || undefined,
        originPort: data.originPort,
        customsPoint: data.customsPoint,
        finalDestination: data.finalDestination,
        vessel: data.vessel || undefined,
        consignee: data.consignee || undefined,
        deliveryType: data.deliveryType,
        clientId: data.clientId,
      },
    });
  };

  const handleCancel = async (data: CancelFormData) => {
    if (!selectedBL) return;
    cancelMutation.mutate({
      id: selectedBL.id,
      reason: data.reason,
    });
  };

  const handleApprove = (bl: BillOfLading) => {
    approveMutation.mutate(bl.id);
  };

  const openEditDialog = (bl: BillOfLading) => {
    setSelectedBL(bl);
    editForm.reset({
      blNumber: bl.blNumber,
      totalWeight: parseFloat(bl.totalWeight || '0'),
      unitCount: bl.unitCount,
      cargoType: bl.cargoType || '',
      originPort: bl.originPort,
      customsPoint: bl.customsPoint,
      finalDestination: bl.finalDestination,
      vessel: bl.vessel || '',
      consignee: bl.consignee || '',
      deliveryType: bl.deliveryType,
      clientId: bl.clientId,
    });
    setIsEditOpen(true);
  };

  const openCancelDialog = (bl: BillOfLading) => {
    setSelectedBL(bl);
    cancelForm.reset({ reason: '' });
    setIsCancelOpen(true);
  };

  // Pagination helpers
  const totalPages = blsData?.pagination?.totalPages || 1;
  const totalBLs = blsData?.pagination?.total || 0;
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const bls = blsData?.data || [];

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Bill of Lading (BLs)
          </h1>
          <p className="text-gray-500 mt-1">
            Gestiona los Bills of Lading de importación
          </p>
        </div>
        <Button
          className="bg-[#1B3F66] hover:bg-[#1B3F66]/90"
          onClick={() => {
            createForm.reset();
            setIsCreateOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo BL
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por número de BL..."
                className="pl-10"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select value={clienteFilter} onValueChange={(value) => {
              setClienteFilter(value);
              setPage(1);
            }}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los clientes</SelectItem>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.businessName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="SCHEDULED">Programado</SelectItem>
                <SelectItem value="IN_TRANSIT">En Tránsito</SelectItem>
                <SelectItem value="DELIVERED">Entregado</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* BLs Table */}
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
                      <TableHead>Número BL</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Peso (kg)</TableHead>
                      <TableHead>Unidades</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bls.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No se encontraron BLs
                        </TableCell>
                      </TableRow>
                    ) : (
                      bls.map((bl) => (
                        <TableRow key={bl.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-[#1B3F66]/10 flex items-center justify-center text-[#1B3F66]">
                                <Anchor className="h-4 w-4" />
                              </div>
                              <div className="font-medium text-gray-900">
                                {bl.blNumber}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {bl.client?.businessName || '-'}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {parseFloat(bl.totalWeight || '0').toLocaleString()} kg
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {bl.unitCount}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            <div className="max-w-[150px] truncate" title={bl.originPort}>
                              {bl.originPort}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            <div className="max-w-[150px] truncate" title={bl.finalDestination}>
                              {bl.finalDestination}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={statusConfig[bl.status]?.className}
                            >
                              {statusConfig[bl.status]?.label}
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
                                <DropdownMenuItem onClick={() => openEditDialog(bl)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                {bl.status === 'SCHEDULED' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleApprove(bl)}>
                                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                      Aprobar
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {bl.status !== 'CANCELLED' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => openCancelDialog(bl)}
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Cancelar
                                    </DropdownMenuItem>
                                  </>
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
              {bls.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-gray-500">
                    Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, totalBLs)} de {totalBLs} BLs
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={String(limit)} onValueChange={(v) => {
                      setLimit(Number(v));
                      setPage(1);
                    }}>
                      <SelectTrigger className="w-[70px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage(page - 1)}
                      disabled={!canPrev}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm text-gray-600">
                      Página {page} de {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage(page + 1)}
                      disabled={!canNext}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create BL Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Bill of Lading</DialogTitle>
            <DialogDescription>
              Ingresa los datos del nuevo BL
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreate)}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="blNumber"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="blNumber">Número BL *</Label>
                      <Input {...field} id="blNumber" placeholder="BL-2024-001" className={fieldState.invalid ? 'border-red-500' : ''} />
                      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
                <Controller
                  name="clientId"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="clientId">Cliente *</Label>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clientes.map((cliente) => (
                            <SelectItem key={cliente.id} value={cliente.id}>
                              {cliente.businessName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Controller
                  name="totalWeight"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="totalWeight">Peso Total (kg) *</Label>
                      <Input
                        {...field}
                        id="totalWeight"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                        className={fieldState.invalid ? 'border-red-500' : ''}
                      />
                      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
                <Controller
                  name="unitCount"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="unitCount">Unidades *</Label>
                      <Input
                        {...field}
                        id="unitCount"
                        type="number"
                        placeholder="1"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                        className={fieldState.invalid ? 'border-red-500' : ''}
                      />
                      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
                <Controller
                  name="cargoType"
                  control={createForm.control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="cargoType">Tipo de Carga</Label>
                      <Input {...field} id="cargoType" placeholder="Bobinas de acero" />
                    </div>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="originPort"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="originPort">Puerto de Origen *</Label>
                      <Input {...field} id="originPort" placeholder="Desaguadero" className={fieldState.invalid ? 'border-red-500' : ''} />
                      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
                <Controller
                  name="finalDestination"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="finalDestination">Destino Final *</Label>
                      <Input {...field} id="finalDestination" placeholder="Cochabamba" className={fieldState.invalid ? 'border-red-500' : ''} />
                      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
              </div>
              <Controller
                name="customsPoint"
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label htmlFor="customsPoint">Aduana *</Label>
                    <Input {...field} id="customsPoint" placeholder="Desaguadero" className={fieldState.invalid ? 'border-red-500' : ''} />
                    {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                  </div>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="vessel"
                  control={createForm.control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="vessel">Nave</Label>
                      <Input {...field} id="vessel" placeholder="MSC Maria" />
                    </div>
                  )}
                />
                <Controller
                  name="consignee"
                  control={createForm.control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="consignee">Consignatario</Label>
                      <Input {...field} id="consignee" placeholder="Nombre del consignatario" />
                    </div>
                  )}
                />
              </div>
              <Controller
                name="deliveryType"
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label htmlFor="deliveryType">Tipo de Entrega *</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DIRECT">Directo</SelectItem>
                        <SelectItem value="INDIRECT">Indirecto</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                  </div>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit BL Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Bill of Lading</DialogTitle>
            <DialogDescription>
              Modifica los datos del BL
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="blNumber"
                  control={editForm.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="edit-blNumber">Número BL *</Label>
                      <Input {...field} id="edit-blNumber" className={fieldState.invalid ? 'border-red-500' : ''} />
                      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
                <Controller
                  name="clientId"
                  control={editForm.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="edit-clientId">Cliente *</Label>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clientes.map((cliente) => (
                            <SelectItem key={cliente.id} value={cliente.id}>
                              {cliente.businessName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Controller
                  name="totalWeight"
                  control={editForm.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="edit-totalWeight">Peso Total (kg) *</Label>
                      <Input
                        {...field}
                        id="edit-totalWeight"
                        type="number"
                        step="0.01"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                        className={fieldState.invalid ? 'border-red-500' : ''}
                      />
                      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
                <Controller
                  name="unitCount"
                  control={editForm.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="edit-unitCount">Unidades *</Label>
                      <Input
                        {...field}
                        id="edit-unitCount"
                        type="number"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                        className={fieldState.invalid ? 'border-red-500' : ''}
                      />
                      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
                <Controller
                  name="cargoType"
                  control={editForm.control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="edit-cargoType">Tipo de Carga</Label>
                      <Input {...field} id="edit-cargoType" />
                    </div>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="originPort"
                  control={editForm.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="edit-originPort">Puerto de Origen *</Label>
                      <Input {...field} id="edit-originPort" className={fieldState.invalid ? 'border-red-500' : ''} />
                      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
                <Controller
                  name="finalDestination"
                  control={editForm.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="edit-finalDestination">Destino Final *</Label>
                      <Input {...field} id="edit-finalDestination" className={fieldState.invalid ? 'border-red-500' : ''} />
                      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
              </div>
              <Controller
                name="customsPoint"
                control={editForm.control}
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label htmlFor="edit-customsPoint">Aduana *</Label>
                    <Input {...field} id="edit-customsPoint" className={fieldState.invalid ? 'border-red-500' : ''} />
                    {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                  </div>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="vessel"
                  control={editForm.control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="edit-vessel">Nave</Label>
                      <Input {...field} id="edit-vessel" />
                    </div>
                  )}
                />
                <Controller
                  name="consignee"
                  control={editForm.control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="edit-consignee">Consignatario</Label>
                      <Input {...field} id="edit-consignee" />
                    </div>
                  )}
                />
              </div>
              <Controller
                name="deliveryType"
                control={editForm.control}
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label htmlFor="edit-deliveryType">Tipo de Entrega *</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DIRECT">Directo</SelectItem>
                        <SelectItem value="INDIRECT">Indirecto</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                  </div>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel BL Dialog */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Cancelar Bill of Lading</DialogTitle>
            <DialogDescription>
              Ingresa la razón de cancelación para el BL {selectedBL?.blNumber}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={cancelForm.handleSubmit(handleCancel)}>
            <div className="space-y-4 py-4">
              <Controller
                name="reason"
                control={cancelForm.control}
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label htmlFor="cancel-reason">Razón de cancelación *</Label>
                    <Input
                      {...field}
                      id="cancel-reason"
                      placeholder="Ej: Cancelación por solicitud del cliente"
                      className={fieldState.invalid ? 'border-red-500' : ''}
                    />
                    {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                  </div>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCancelOpen(false)}>
                Cerrar
              </Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={cancelMutation.isPending}>
                {cancelMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Cancelar BL
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
