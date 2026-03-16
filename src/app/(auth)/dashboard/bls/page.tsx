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
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Anchor,
  Calculator,
  Package,
  MapPin,
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
import {
  useBLs,
  useClientes,
  useCreateBL,
  useUpdateBL,
  useDeleteBL,
  useCalcularFlota,
} from '@/hooks/use-queries';
import { BL, CalcularFlotaResult } from '@/types/api';

// Form schemas
const blSchema = z.object({
  numero: z.string().min(1, 'El número de BL es requerido'),
  pesoTotal: z.number().min(0.01, 'El peso debe ser mayor a 0'),
  unidades: z.number().min(1, 'Las unidades deben ser al menos 1'),
  tipoCarga: z.string().optional().or(z.literal('')),
  puertoOrigen: z.string().min(1, 'El puerto de origen es requerido'),
  aduana: z.string().min(1, 'La aduana es requerida'),
  destinoFinal: z.string().min(1, 'El destino final es requerido'),
  nave: z.string().optional().or(z.literal('')),
  consignatario: z.string().optional().or(z.literal('')),
  tipoEntrega: z.enum(['DIRECTO', 'INDIRECTO']).optional(),
  clienteId: z.string().min(1, 'El cliente es requerido'),
});

type BLFormData = z.infer<typeof blSchema>;

// Status badge config
const estadoConfig: Record<string, { label: string; className: string }> = {
  PENDIENTE: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  EN_PROCESO: { label: 'En Proceso', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  COMPLETADO: { label: 'Completado', className: 'bg-green-100 text-green-800 border-green-200' },
};

const tipoEntregaConfig: Record<string, { label: string }> = {
  DIRECTO: { label: 'Directo' },
  INDIRECTO: { label: 'Indirecto' },
};

export default function BLsPage() {
  const { toast } = useToast();

  // State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [clienteFilter, setClienteFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isFlotaOpen, setIsFlotaOpen] = useState(false);
  const [selectedBL, setSelectedBL] = useState<BL | null>(null);
  const [flotaResult, setFlotaResult] = useState<CalcularFlotaResult | null>(null);

  // Queries
  const { data: blsData, isLoading } = useBLs({
    page,
    limit,
    search: search || undefined,
    estado: estadoFilter !== 'all' ? estadoFilter as 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' : undefined,
    clienteId: clienteFilter !== 'all' ? clienteFilter : undefined,
  });

  const { data: clientesData } = useClientes({ limit: 100 });
  const clientes = clientesData?.data || [];

  // Mutations
  const createBL = useCreateBL();
  const updateBL = useUpdateBL();
  const deleteBL = useDeleteBL();
  const calcularFlota = useCalcularFlota();

  // Forms
  const createForm = useForm<BLFormData>({
    resolver: zodResolver(blSchema),
    defaultValues: {
      numero: '',
      pesoTotal: 0,
      unidades: 1,
      tipoCarga: '',
      puertoOrigen: '',
      aduana: '',
      destinoFinal: '',
      nave: '',
      consignatario: '',
      tipoEntrega: 'DIRECTO',
      clienteId: '',
    },
  });

  const editForm = useForm<BLFormData>({
    resolver: zodResolver(blSchema),
    defaultValues: {
      numero: '',
      pesoTotal: 0,
      unidades: 1,
      tipoCarga: '',
      puertoOrigen: '',
      aduana: '',
      destinoFinal: '',
      nave: '',
      consignatario: '',
      tipoEntrega: 'DIRECTO',
      clienteId: '',
    },
  });

  // Handlers
  const handleCreate = async (data: BLFormData) => {
    try {
      await createBL.mutateAsync({
        numero: data.numero,
        pesoTotal: data.pesoTotal,
        unidades: data.unidades,
        tipoCarga: data.tipoCarga || undefined,
        puertoOrigen: data.puertoOrigen,
        aduana: data.aduana,
        destinoFinal: data.destinoFinal,
        nave: data.nave || undefined,
        consignatario: data.consignatario || undefined,
        tipoEntrega: data.tipoEntrega,
        clienteId: data.clienteId,
      });
      toast({
        title: 'BL creado',
        description: 'El Bill of Lading ha sido creado exitosamente.',
      });
      setIsCreateOpen(false);
      createForm.reset();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo crear el BL. Intente nuevamente.',
      });
    }
  };

  const handleEdit = async (data: BLFormData) => {
    if (!selectedBL) return;
    try {
      await updateBL.mutateAsync({
        id: selectedBL.id,
        data: {
          numero: data.numero,
          pesoTotal: data.pesoTotal,
          unidades: data.unidades,
          tipoCarga: data.tipoCarga || undefined,
          puertoOrigen: data.puertoOrigen,
          aduana: data.aduana,
          destinoFinal: data.destinoFinal,
          nave: data.nave || undefined,
          consignatario: data.consignatario || undefined,
          tipoEntrega: data.tipoEntrega,
          clienteId: data.clienteId,
        },
      });
      toast({
        title: 'BL actualizado',
        description: 'El Bill of Lading ha sido actualizado exitosamente.',
      });
      setIsEditOpen(false);
      setSelectedBL(null);
      editForm.reset();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el BL. Intente nuevamente.',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedBL) return;
    try {
      await deleteBL.mutateAsync(selectedBL.id);
      toast({
        title: 'BL eliminado',
        description: 'El Bill of Lading ha sido eliminado exitosamente.',
      });
      setIsDeleteOpen(false);
      setSelectedBL(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar el BL. Intente nuevamente.',
      });
    }
  };

  const handleCalcularFlota = async (bl: BL) => {
    try {
      const result = await calcularFlota.mutateAsync(bl.id);
      setFlotaResult(result);
      setSelectedBL(bl);
      setIsFlotaOpen(true);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo calcular la flota. Intente nuevamente.',
      });
    }
  };

  const openEditDialog = (bl: BL) => {
    setSelectedBL(bl);
    editForm.reset({
      numero: bl.numero,
      pesoTotal: bl.pesoTotal,
      unidades: bl.unidades,
      tipoCarga: bl.tipoCarga || '',
      puertoOrigen: bl.puertoOrigen,
      aduana: bl.aduana,
      destinoFinal: bl.destinoFinal,
      nave: bl.nave || '',
      consignatario: bl.consignatario || '',
      tipoEntrega: bl.tipoEntrega,
      clienteId: bl.clienteId,
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (bl: BL) => {
    setSelectedBL(bl);
    setIsDeleteOpen(true);
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
                    {cliente.razonSocial}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={estadoFilter} onValueChange={(value) => {
              setEstadoFilter(value);
              setPage(1);
            }}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="EN_PROCESO">En Proceso</SelectItem>
                <SelectItem value="COMPLETADO">Completado</SelectItem>
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
                                {bl.numero}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {bl.cliente?.razonSocial || '-'}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {bl.pesoTotal.toLocaleString()} kg
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {bl.unidades}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            <div className="max-w-[150px] truncate" title={bl.puertoOrigen}>
                              {bl.puertoOrigen}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            <div className="max-w-[150px] truncate" title={bl.destinoFinal}>
                              {bl.destinoFinal}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={estadoConfig[bl.estado]?.className}
                            >
                              {estadoConfig[bl.estado]?.label}
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
                                <DropdownMenuItem onClick={() => handleCalcularFlota(bl)}>
                                  <Calculator className="h-4 w-4 mr-2" />
                                  Calcular Flota
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => openDeleteDialog(bl)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar
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
                  name="numero"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="numero">Número BL *</Label>
                      <Input {...field} id="numero" placeholder="BL-2024-001" className={fieldState.invalid ? 'border-red-500' : ''} />
                      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
                <Controller
                  name="clienteId"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="clienteId">Cliente *</Label>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clientes.map((cliente) => (
                            <SelectItem key={cliente.id} value={cliente.id}>
                              {cliente.razonSocial}
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
                  name="pesoTotal"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="pesoTotal">Peso Total (kg) *</Label>
                      <Input
                        {...field}
                        id="pesoTotal"
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
                  name="unidades"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="unidades">Unidades *</Label>
                      <Input
                        {...field}
                        id="unidades"
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
                  name="tipoCarga"
                  control={createForm.control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="tipoCarga">Tipo de Carga</Label>
                      <Input {...field} id="tipoCarga" placeholder="Contenedor" />
                    </div>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="puertoOrigen"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="puertoOrigen">Puerto de Origen *</Label>
                      <Input {...field} id="puertoOrigen" placeholder="Shanghai" className={fieldState.invalid ? 'border-red-500' : ''} />
                      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
                <Controller
                  name="destinoFinal"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="destinoFinal">Destino Final *</Label>
                      <Input {...field} id="destinoFinal" placeholder="La Paz" className={fieldState.invalid ? 'border-red-500' : ''} />
                      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
              </div>
              <Controller
                name="aduana"
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label htmlFor="aduana">Aduana *</Label>
                    <Input {...field} id="aduana" placeholder="Aduana de Desaguadero" className={fieldState.invalid ? 'border-red-500' : ''} />
                    {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                  </div>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="nave"
                  control={createForm.control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="nave">Nave</Label>
                      <Input {...field} id="nave" placeholder="Nombre del barco" />
                    </div>
                  )}
                />
                <Controller
                  name="consignatario"
                  control={createForm.control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="consignatario">Consignatario</Label>
                      <Input {...field} id="consignatario" placeholder="Nombre del consignatario" />
                    </div>
                  )}
                />
              </div>
              <Controller
                name="tipoEntrega"
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label htmlFor="tipoEntrega">Tipo de Entrega *</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DIRECTO">Directo</SelectItem>
                        <SelectItem value="INDIRECTO">Indirecto</SelectItem>
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
              <Button type="submit" className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" disabled={createBL.isPending}>
                {createBL.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
                  name="numero"
                  control={editForm.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="edit-numero">Número BL *</Label>
                      <Input {...field} id="edit-numero" className={fieldState.invalid ? 'border-red-500' : ''} />
                      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
                <Controller
                  name="clienteId"
                  control={editForm.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="edit-clienteId">Cliente *</Label>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clientes.map((cliente) => (
                            <SelectItem key={cliente.id} value={cliente.id}>
                              {cliente.razonSocial}
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
                  name="pesoTotal"
                  control={editForm.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="edit-pesoTotal">Peso Total (kg) *</Label>
                      <Input
                        {...field}
                        id="edit-pesoTotal"
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
                  name="unidades"
                  control={editForm.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="edit-unidades">Unidades *</Label>
                      <Input
                        {...field}
                        id="edit-unidades"
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
                  name="tipoCarga"
                  control={editForm.control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="edit-tipoCarga">Tipo de Carga</Label>
                      <Input {...field} id="edit-tipoCarga" />
                    </div>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="puertoOrigen"
                  control={editForm.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="edit-puertoOrigen">Puerto de Origen *</Label>
                      <Input {...field} id="edit-puertoOrigen" className={fieldState.invalid ? 'border-red-500' : ''} />
                      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
                <Controller
                  name="destinoFinal"
                  control={editForm.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="edit-destinoFinal">Destino Final *</Label>
                      <Input {...field} id="edit-destinoFinal" className={fieldState.invalid ? 'border-red-500' : ''} />
                      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
              </div>
              <Controller
                name="aduana"
                control={editForm.control}
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label htmlFor="edit-aduana">Aduana *</Label>
                    <Input {...field} id="edit-aduana" className={fieldState.invalid ? 'border-red-500' : ''} />
                    {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                  </div>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="nave"
                  control={editForm.control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="edit-nave">Nave</Label>
                      <Input {...field} id="edit-nave" />
                    </div>
                  )}
                />
                <Controller
                  name="consignatario"
                  control={editForm.control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="edit-consignatario">Consignatario</Label>
                      <Input {...field} id="edit-consignatario" />
                    </div>
                  )}
                />
              </div>
              <Controller
                name="tipoEntrega"
                control={editForm.control}
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label htmlFor="edit-tipoEntrega">Tipo de Entrega *</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DIRECTO">Directo</SelectItem>
                        <SelectItem value="INDIRECTO">Indirecto</SelectItem>
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
              <Button type="submit" className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" disabled={updateBL.isPending}>
                {updateBL.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar BL?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el BL {selectedBL?.numero} del sistema.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
            >
              {deleteBL.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Calcular Flota Dialog */}
      <Dialog open={isFlotaOpen} onOpenChange={setIsFlotaOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-[#1B3F66]" />
              Cálculo de Flota
            </DialogTitle>
            <DialogDescription>
              BL: {selectedBL?.numero}
            </DialogDescription>
          </DialogHeader>
          {flotaResult && (
            <div className="space-y-4 py-4">
              <div className="bg-[#1B3F66]/5 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Peso Total:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedBL?.pesoTotal.toLocaleString()} kg
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Camiones Necesarios:</span>
                  <span className="font-bold text-2xl text-[#1B3F66]">
                    {flotaResult.camionesNecesarios}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Capacidad Total:</span>
                  <span className="font-semibold text-gray-900">
                    {flotaResult.capacidadTotal.toLocaleString()} kg
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Peso Restante:</span>
                  <span className="font-semibold text-gray-900">
                    {flotaResult.pesoRestante.toLocaleString()} kg
                  </span>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  {flotaResult.camionesNecesarios} camione{flotaResult.camionesNecesarios !== 1 ? 's' : ''} con capacidad estándar de 25,000 kg pueden transportar esta carga.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              className="bg-[#1B3F66] hover:bg-[#1B3F66]/90"
              onClick={() => setIsFlotaOpen(false)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
