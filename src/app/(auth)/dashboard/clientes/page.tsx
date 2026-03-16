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
  Building2,
  CreditCard,
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  useClientes,
  useCreateCliente,
  useUpdateCliente,
  useDeleteCliente,
} from '@/hooks/use-queries';
import { Cliente } from '@/types/api';

// Form schemas
const clienteSchema = z.object({
  razonSocial: z.string().min(1, 'La razón social es requerida'),
  nit: z.string().min(1, 'El NIT es requerido'),
  contacto: z.string().optional().or(z.literal('')),
  telefono: z.string().optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  direccion: z.string().optional().or(z.literal('')),
  credito: z.boolean().optional(),
  limiteCredito: z.number().min(0, 'El límite debe ser mayor o igual a 0').optional().nullable(),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

// Status badge config
const statusConfig: Record<boolean, { label: string; className: string }> = {
  true: { label: 'Activo', className: 'bg-green-100 text-green-800 border-green-200' },
  false: { label: 'Inactivo', className: 'bg-gray-100 text-gray-800 border-gray-200' },
};

export default function ClientesPage() {
  const { toast } = useToast();

  // State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [activoFilter, setActivoFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  // Queries
  const { data: clientesData, isLoading } = useClientes({
    page,
    limit,
    search: search || undefined,
    activo: activoFilter !== 'all' ? activoFilter === 'true' : undefined,
  });

  // Mutations
  const createCliente = useCreateCliente();
  const updateCliente = useUpdateCliente();
  const deleteCliente = useDeleteCliente();

  // Forms
  const createForm = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      razonSocial: '',
      nit: '',
      contacto: '',
      telefono: '',
      email: '',
      direccion: '',
      credito: false,
      limiteCredito: null,
    },
  });

  const editForm = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      razonSocial: '',
      nit: '',
      contacto: '',
      telefono: '',
      email: '',
      direccion: '',
      credito: false,
      limiteCredito: null,
    },
  });

  // Handlers
  const handleCreate = async (data: ClienteFormData) => {
    try {
      await createCliente.mutateAsync({
        razonSocial: data.razonSocial,
        nit: data.nit,
        contacto: data.contacto || undefined,
        telefono: data.telefono || undefined,
        email: data.email || undefined,
        direccion: data.direccion || undefined,
        credito: data.credito,
        limiteCredito: data.limiteCredito || undefined,
      });
      toast({
        title: 'Cliente creado',
        description: 'El cliente ha sido creado exitosamente.',
      });
      setIsCreateOpen(false);
      createForm.reset();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo crear el cliente. Intente nuevamente.',
      });
    }
  };

  const handleEdit = async (data: ClienteFormData) => {
    if (!selectedCliente) return;
    try {
      await updateCliente.mutateAsync({
        id: selectedCliente.id,
        data: {
          razonSocial: data.razonSocial,
          nit: data.nit,
          contacto: data.contacto || undefined,
          telefono: data.telefono || undefined,
          email: data.email || undefined,
          direccion: data.direccion || undefined,
          credito: data.credito,
          limiteCredito: data.limiteCredito || undefined,
        },
      });
      toast({
        title: 'Cliente actualizado',
        description: 'El cliente ha sido actualizado exitosamente.',
      });
      setIsEditOpen(false);
      setSelectedCliente(null);
      editForm.reset();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el cliente. Intente nuevamente.',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedCliente) return;
    try {
      await deleteCliente.mutateAsync(selectedCliente.id);
      toast({
        title: 'Cliente eliminado',
        description: 'El cliente ha sido eliminado exitosamente.',
      });
      setIsDeleteOpen(false);
      setSelectedCliente(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar el cliente. Intente nuevamente.',
      });
    }
  };

  const openEditDialog = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    editForm.reset({
      razonSocial: cliente.razonSocial,
      nit: cliente.nit,
      contacto: cliente.contacto || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      direccion: cliente.direccion || '',
      credito: cliente.credito,
      limiteCredito: cliente.limiteCredito || null,
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setIsDeleteOpen(true);
  };

  // Pagination helpers
  const totalPages = clientesData?.pagination?.totalPages || 1;
  const totalClientes = clientesData?.pagination?.total || 0;
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const clientes = clientesData?.data || [];

  const watchCredito = createForm.watch('credito');
  const watchEditCredito = editForm.watch('credito');

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Gestión de Clientes
          </h1>
          <p className="text-gray-500 mt-1">
            Administra los clientes de la empresa
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
          Nuevo Cliente
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por razón social, NIT..."
                className="pl-10"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select value={activoFilter} onValueChange={(value) => {
              setActivoFilter(value);
              setPage(1);
            }}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Activo</SelectItem>
                <SelectItem value="false">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
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
                      <TableHead>Razón Social</TableHead>
                      <TableHead>NIT</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Crédito</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No se encontraron clientes
                        </TableCell>
                      </TableRow>
                    ) : (
                      clientes.map((cliente) => (
                        <TableRow key={cliente.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-[#1B3F66] flex items-center justify-center text-white text-sm font-medium">
                                {cliente.razonSocial?.[0]?.toUpperCase() || 'C'}
                              </div>
                              <div className="font-medium text-gray-900">
                                {cliente.razonSocial}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600">{cliente.nit}</TableCell>
                          <TableCell className="text-gray-600">{cliente.contacto || '-'}</TableCell>
                          <TableCell className="text-gray-600">{cliente.telefono || '-'}</TableCell>
                          <TableCell className="text-gray-600">{cliente.email || '-'}</TableCell>
                          <TableCell>
                            {cliente.credito ? (
                              <div className="flex items-center gap-1">
                                <CreditCard className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-600">
                                  Bs {cliente.limiteCredito?.toLocaleString() || 0}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400">No</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={statusConfig[cliente.activo]?.className}
                            >
                              {statusConfig[cliente.activo]?.label}
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
                                <DropdownMenuItem onClick={() => openEditDialog(cliente)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => openDeleteDialog(cliente)}
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
              {clientes.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-gray-500">
                    Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, totalClientes)} de {totalClientes} clientes
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

      {/* Create Cliente Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crear Cliente</DialogTitle>
            <DialogDescription>
              Ingresa los datos del nuevo cliente
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreate)}>
            <div className="space-y-4 py-4">
              <Controller
                name="razonSocial"
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label htmlFor="razonSocial">Razón Social *</Label>
                    <Input {...field} id="razonSocial" placeholder="Empresa S.R.L." className={fieldState.invalid ? 'border-red-500' : ''} />
                    {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                  </div>
                )}
              />
              <Controller
                name="nit"
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label htmlFor="nit">NIT *</Label>
                    <Input {...field} id="nit" placeholder="123456789" className={fieldState.invalid ? 'border-red-500' : ''} />
                    {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                  </div>
                )}
              />
              <Controller
                name="contacto"
                control={createForm.control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="contacto">Contacto</Label>
                    <Input {...field} id="contacto" placeholder="Juan Pérez" />
                  </div>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="telefono"
                  control={createForm.control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono</Label>
                      <Input {...field} id="telefono" placeholder="+591 7XXXXXXX" />
                    </div>
                  )}
                />
                <Controller
                  name="email"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input {...field} id="email" type="email" placeholder="correo@ejemplo.com" className={fieldState.invalid ? 'border-red-500' : ''} />
                      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
              </div>
              <Controller
                name="direccion"
                control={createForm.control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="direccion">Dirección</Label>
                    <Input {...field} id="direccion" placeholder="Av. Principal #123" />
                  </div>
                )}
              />
              <Controller
                name="credito"
                control={createForm.control}
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="credito"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="credito" className="cursor-pointer">
                      Tiene crédito
                    </Label>
                  </div>
                )}
              />
              {watchCredito && (
                <Controller
                  name="limiteCredito"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="limiteCredito">Límite de Crédito (Bs)</Label>
                      <Input
                        {...field}
                        id="limiteCredito"
                        type="number"
                        placeholder="10000"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        className={fieldState.invalid ? 'border-red-500' : ''}
                      />
                      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" disabled={createCliente.isPending}>
                {createCliente.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Cliente Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Modifica los datos del cliente
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)}>
            <div className="space-y-4 py-4">
              <Controller
                name="razonSocial"
                control={editForm.control}
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label htmlFor="edit-razonSocial">Razón Social *</Label>
                    <Input {...field} id="edit-razonSocial" className={fieldState.invalid ? 'border-red-500' : ''} />
                    {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                  </div>
                )}
              />
              <Controller
                name="nit"
                control={editForm.control}
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label htmlFor="edit-nit">NIT *</Label>
                    <Input {...field} id="edit-nit" className={fieldState.invalid ? 'border-red-500' : ''} />
                    {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                  </div>
                )}
              />
              <Controller
                name="contacto"
                control={editForm.control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="edit-contacto">Contacto</Label>
                    <Input {...field} id="edit-contacto" />
                  </div>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="telefono"
                  control={editForm.control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="edit-telefono">Teléfono</Label>
                      <Input {...field} id="edit-telefono" />
                    </div>
                  )}
                />
                <Controller
                  name="email"
                  control={editForm.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="edit-email">Email</Label>
                      <Input {...field} id="edit-email" type="email" className={fieldState.invalid ? 'border-red-500' : ''} />
                      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
              </div>
              <Controller
                name="direccion"
                control={editForm.control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="edit-direccion">Dirección</Label>
                    <Input {...field} id="edit-direccion" />
                  </div>
                )}
              />
              <Controller
                name="credito"
                control={editForm.control}
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-credito"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="edit-credito" className="cursor-pointer">
                      Tiene crédito
                    </Label>
                  </div>
                )}
              />
              {watchEditCredito && (
                <Controller
                  name="limiteCredito"
                  control={editForm.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="edit-limiteCredito">Límite de Crédito (Bs)</Label>
                      <Input
                        {...field}
                        id="edit-limiteCredito"
                        type="number"
                        placeholder="10000"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        className={fieldState.invalid ? 'border-red-500' : ''}
                      />
                      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" disabled={updateCliente.isPending}>
                {updateCliente.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará a {selectedCliente?.razonSocial} del sistema.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
            >
              {deleteCliente.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
