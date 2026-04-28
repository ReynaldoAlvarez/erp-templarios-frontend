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
  CreditCard,
  Eye,
  RotateCcw,
  DollarSign,
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
import { useClientes, useCreateCliente, useUpdateCliente, useDeleteCliente, useRestoreCliente, useClienteCredit } from '@/hooks/use-queries';
import { Client } from '@/types/api';

// Form schemas - with conditional credit validation
const clienteSchema = z.object({
  businessName: z.string().min(1, 'La razón social es requerida'),
  nit: z.string().min(1, 'El NIT es requerido'),
  contactName: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  hasCredit: z.boolean().optional(),
  creditLimit: z.number().optional().nullable(),
}).refine((data) => {
  // Si hasCredit es true, creditLimit debe ser mayor a 0
  if (data.hasCredit && (!data.creditLimit || data.creditLimit <= 0)) {
    return false;
  }
  return true;
}, {
  message: 'El límite de crédito es requerido cuando el cliente tiene crédito',
  path: ['creditLimit'],
});

type ClienteFormData = z.infer<typeof clienteSchema>;

// Status badge config
const getStatusConfig = (isActive: boolean) => {
  return isActive 
    ? { label: 'Activo', className: 'bg-green-100 text-green-800 border-green-200' }
    : { label: 'Inactivo', className: 'bg-gray-100 text-gray-800 border-gray-200' };
};

// Helper para extraer mensaje de error del backend
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (axios.isAxiosError(error)) {
    const backendMessage = error.response?.data?.message;
    if (backendMessage) return backendMessage;
    
    // Errores de validación
    const errors = error.response?.data?.errors;
    if (errors && Array.isArray(errors)) {
      return errors.map((e: { message?: string; msg?: string }) => e.message || e.msg).join(', ');
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
};

export default function ClientesPage() {
  const { toast } = useToast();

  // State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [activoFilter, setActivoFilter] = useState<string>('all');
  const [creditoFilter, setCreditoFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCreditOpen, setIsCreditOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Client | null>(null);

  // Queries (centralized hooks)
  const { data: clientesData, isLoading } = useClientes({
    page,
    limit,
    search: search || undefined,
    isActive: activoFilter !== 'all' ? activoFilter === 'true' : undefined,
    hasCredit: creditoFilter !== 'all' ? creditoFilter === 'true' : undefined,
  });

  const creditQuery = useClienteCredit(isCreditOpen ? selectedCliente?.id : undefined);

  // Mutations (centralized hooks - cache invalidation handled by hooks, toasts at call sites)
  const createMutation = useCreateCliente();
  const updateMutation = useUpdateCliente();
  const deleteMutation = useDeleteCliente();
  const restoreMutation = useRestoreCliente();

  // Forms
  const createForm = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      businessName: '',
      nit: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',
      hasCredit: false,
      creditLimit: null,
    },
  });

  const editForm = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      businessName: '',
      nit: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',
      hasCredit: false,
      creditLimit: null,
    },
  });

  // Handlers
  const handleCreate = async (data: ClienteFormData) => {
    createMutation.mutate({
      businessName: data.businessName,
      nit: data.nit,
      contactName: data.contactName || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
      address: data.address || undefined,
      hasCredit: data.hasCredit || false,
      creditLimit: data.hasCredit ? data.creditLimit || 0 : undefined,
    }, {
      onSuccess: () => {
        toast({
          title: 'Cliente creado',
          description: 'El cliente ha sido creado exitosamente.',
        });
        setIsCreateOpen(false);
        createForm.reset();
      },
      onError: (error: unknown) => {
        const message = getErrorMessage(error, 'No se pudo crear el cliente.');
        toast({
          variant: 'destructive',
          title: 'Error al crear cliente',
          description: message,
        });
      },
    });
  };

  const handleEdit = async (data: ClienteFormData) => {
    if (!selectedCliente) return;
    updateMutation.mutate({
      id: selectedCliente.id,
      data: {
        businessName: data.businessName,
        nit: data.nit,
        contactName: data.contactName || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
        hasCredit: data.hasCredit,
        creditLimit: data.hasCredit ? data.creditLimit || 0 : undefined,
      },
    }, {
      onSuccess: () => {
        toast({
          title: 'Cliente actualizado',
          description: 'El cliente ha sido actualizado exitosamente.',
        });
        setIsEditOpen(false);
        setSelectedCliente(null);
        editForm.reset();
      },
      onError: (error: unknown) => {
        const message = getErrorMessage(error, 'No se pudo actualizar el cliente.');
        toast({
          variant: 'destructive',
          title: 'Error al actualizar',
          description: message,
        });
      },
    });
  };

  const handleDelete = async () => {
    if (!selectedCliente) return;
    deleteMutation.mutate(selectedCliente.id, {
      onSuccess: () => {
        toast({
          title: 'Cliente desactivado',
          description: 'El cliente ha sido desactivado exitosamente.',
        });
        setIsDeleteOpen(false);
        setSelectedCliente(null);
      },
      onError: (error: unknown) => {
        const message = getErrorMessage(error, 'No se pudo desactivar el cliente.');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: message,
        });
      },
    });
  };

  const handleRestore = (cliente: Client) => {
    restoreMutation.mutate(cliente.id, {
      onSuccess: () => {
        toast({
          title: 'Cliente reactivado',
          description: 'El cliente ha sido reactivado exitosamente.',
        });
      },
      onError: (error: unknown) => {
        const message = getErrorMessage(error, 'No se pudo reactivar el cliente.');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: message,
        });
      },
    });
  };

  const openEditDialog = (cliente: Client) => {
    setSelectedCliente(cliente);
    editForm.reset({
      businessName: cliente.businessName,
      nit: cliente.nit,
      contactName: cliente.contactName || '',
      phone: cliente.phone || '',
      email: cliente.email || '',
      address: cliente.address || '',
      hasCredit: cliente.hasCredit,
      creditLimit: cliente.creditLimit ? parseFloat(cliente.creditLimit) : null,
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (cliente: Client) => {
    setSelectedCliente(cliente);
    setIsDeleteOpen(true);
  };

  const openCreditDialog = async (cliente: Client) => {
    setSelectedCliente(cliente);
    setIsCreditOpen(true);
  };

  // Pagination helpers
  const totalPages = clientesData?.pagination?.totalPages || 1;
  const totalClientes = clientesData?.pagination?.total || 0;
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const clientes = clientesData?.data || [];

  const watchHasCredit = createForm.watch('hasCredit');
  const watchEditHasCredit = editForm.watch('hasCredit');

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
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Activo</SelectItem>
                <SelectItem value="false">Inactivo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={creditoFilter} onValueChange={(value) => {
              setCreditoFilter(value);
              setPage(1);
            }}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Crédito" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Con crédito</SelectItem>
                <SelectItem value="false">Sin crédito</SelectItem>
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
                      <TableHead>Crédito</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No se encontraron clientes
                        </TableCell>
                      </TableRow>
                    ) : (
                      clientes.map((cliente) => (
                        <TableRow key={cliente.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-[#1B3F66] flex items-center justify-center text-white text-sm font-medium">
                                {cliente.businessName?.[0]?.toUpperCase() || 'C'}
                              </div>
                              <div className="font-medium text-gray-900">
                                {cliente.businessName}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600">{cliente.nit}</TableCell>
                          <TableCell className="text-gray-600">{cliente.contactName || '-'}</TableCell>
                          <TableCell className="text-gray-600">{cliente.phone || '-'}</TableCell>
                          <TableCell>
                            {cliente.hasCredit ? (
                              <div className="flex items-center gap-1">
                                <CreditCard className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-600">
                                  Bs {parseFloat(cliente.creditLimit || '0').toLocaleString()}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400">No</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStatusConfig(cliente.isActive).className}
                            >
                              {getStatusConfig(cliente.isActive).label}
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
                                {cliente.hasCredit && (
                                  <DropdownMenuItem onClick={() => openCreditDialog(cliente)}>
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    Ver Crédito
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => openEditDialog(cliente)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {cliente.isActive ? (
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => openDeleteDialog(cliente)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Desactivar
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    className="text-green-600"
                                    onClick={() => handleRestore(cliente)}
                                  >
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Reactivar
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
                name="businessName"
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Razón Social *</Label>
                    <Input {...field} id="businessName" placeholder="Empresa S.R.L." className={fieldState.invalid ? 'border-red-500' : ''} />
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
                name="contactName"
                control={createForm.control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contacto</Label>
                    <Input {...field} id="contactName" placeholder="Juan Pérez" />
                  </div>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="phone"
                  control={createForm.control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input {...field} id="phone" placeholder="+591 7XXXXXXX" />
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
                name="address"
                control={createForm.control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input {...field} id="address" placeholder="Av. Principal #123" />
                  </div>
                )}
              />
              <Controller
                name="hasCredit"
                control={createForm.control}
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasCredit"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="hasCredit" className="cursor-pointer">
                      Tiene crédito
                    </Label>
                  </div>
                )}
              />
              {watchHasCredit && (
                <Controller
                  name="creditLimit"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="creditLimit">Límite de Crédito (Bs) *</Label>
                      <Input
                        {...field}
                        id="creditLimit"
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
              <Button type="submit" className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
                name="businessName"
                control={editForm.control}
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label htmlFor="edit-businessName">Razón Social *</Label>
                    <Input {...field} id="edit-businessName" className={fieldState.invalid ? 'border-red-500' : ''} />
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
                name="contactName"
                control={editForm.control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="edit-contactName">Contacto</Label>
                    <Input {...field} id="edit-contactName" />
                  </div>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="phone"
                  control={editForm.control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">Teléfono</Label>
                      <Input {...field} id="edit-phone" />
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
                name="address"
                control={editForm.control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="edit-address">Dirección</Label>
                    <Input {...field} id="edit-address" />
                  </div>
                )}
              />
              <Controller
                name="hasCredit"
                control={editForm.control}
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-hasCredit"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="edit-hasCredit" className="cursor-pointer">
                      Tiene crédito
                    </Label>
                  </div>
                )}
              />
              {watchEditHasCredit && (
                <Controller
                  name="creditLimit"
                  control={editForm.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="edit-creditLimit">Límite de Crédito (Bs) *</Label>
                      <Input
                        {...field}
                        id="edit-creditLimit"
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
              <Button type="submit" className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará a {selectedCliente?.businessName} del sistema.
              El cliente no podrá realizar nuevas operaciones hasta ser reactivado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Credit Status Dialog */}
      <Dialog open={isCreditOpen} onOpenChange={setIsCreditOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Estado de Crédito</DialogTitle>
            <DialogDescription>
              {selectedCliente?.businessName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {creditQuery.isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-[#1B3F66]" />
              </div>
            ) : creditQuery.data ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500">Límite de Crédito</div>
                      <div className="text-xl font-bold text-[#1B3F66]">
                        Bs {creditQuery.data.creditLimit?.toLocaleString() || 0}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500">Crédito Usado</div>
                      <div className="text-xl font-bold text-orange-600">
                        Bs {creditQuery.data.usedCredit?.toLocaleString() || 0}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500">Disponible</div>
                      <div className="text-xl font-bold text-green-600">
                        Bs {creditQuery.data.availableCredit?.toLocaleString() || 0}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500">Utilización</div>
                      <div className="text-xl font-bold">
                        {creditQuery.data.utilizationPercent?.toFixed(1) || 0}%
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-[#1B3F66] h-2 rounded-full transition-all" 
                    style={{ width: `${Math.min(creditQuery.data.utilizationPercent || 0, 100)}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                No se pudo cargar el estado de crédito
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreditOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
