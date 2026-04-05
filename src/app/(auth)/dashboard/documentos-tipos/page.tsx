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
  Layers,
  CheckCircle,
  Truck,
  FileText,
  ArrowUpDown,
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentTypesApi } from '@/lib/api-client';
import { DocumentType, CreateDocumentTypeInput, UpdateDocumentTypeInput, DocumentTypeListParams } from '@/types/api';

// Form schema
const documentTypeSchema = z.object({
  code: z.string().min(1, 'El código es requerido').max(20, 'Máximo 20 caracteres'),
  name: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  description: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  isRequired: z.boolean(),
  isForSupportOnly: z.boolean(),
  displayOrder: z.number().min(0, 'Debe ser mayor o igual a 0'),
});

type DocumentTypeFormData = z.infer<typeof documentTypeSchema>;

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

export default function DocumentosTiposPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | null>(null);

  // Queries
  const params: DocumentTypeListParams = {
    page,
    limit,
    search: search || undefined,
    isActive: isActiveFilter === 'all' ? undefined : isActiveFilter === 'true',
  };

  const { data: documentTypesData, isLoading } = useQuery({
    queryKey: ['documentTypes', params],
    queryFn: () => documentTypesApi.getAll(params),
  });

  const { data: stats } = useQuery({
    queryKey: ['documentTypes', 'stats'],
    queryFn: () => documentTypesApi.getStats(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateDocumentTypeInput) => documentTypesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentTypes'] });
      toast({ title: 'Tipo de documento creado', description: 'El tipo de documento ha sido creado exitosamente.' });
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Error al crear',
        description: getErrorMessage(error, 'No se pudo crear el tipo de documento.'),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocumentTypeInput }) =>
      documentTypesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentTypes'] });
      toast({ title: 'Tipo de documento actualizado', description: 'El tipo de documento ha sido actualizado.' });
      setIsEditOpen(false);
      setSelectedDocumentType(null);
      editForm.reset();
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Error al actualizar',
        description: getErrorMessage(error, 'No se pudo actualizar el tipo de documento.'),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentTypesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentTypes'] });
      toast({ title: 'Tipo de documento eliminado', description: 'El tipo de documento ha sido eliminado.' });
      setIsDeleteOpen(false);
      setSelectedDocumentType(null);
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getErrorMessage(error, 'No se pudo eliminar el tipo de documento.'),
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => documentTypesApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentTypes'] });
      toast({ title: 'Tipo de documento restaurado', description: 'El tipo de documento ha sido restaurado.' });
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getErrorMessage(error, 'No se pudo restaurar el tipo de documento.'),
      });
    },
  });

  // Forms
  const createForm = useForm<DocumentTypeFormData>({
    resolver: zodResolver(documentTypeSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      isRequired: false,
      isForSupportOnly: false,
      displayOrder: 0,
    },
  });

  const editForm = useForm<DocumentTypeFormData>({
    resolver: zodResolver(documentTypeSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      isRequired: false,
      isForSupportOnly: false,
      displayOrder: 0,
    },
  });

  // Handlers
  const handleCreate = (data: DocumentTypeFormData) => {
    createMutation.mutate({
      code: data.code,
      name: data.name,
      description: data.description || undefined,
      isRequired: data.isRequired,
      isForSupportOnly: data.isForSupportOnly,
      displayOrder: data.displayOrder,
    });
  };

  const handleEdit = (data: DocumentTypeFormData) => {
    if (!selectedDocumentType) return;
    updateMutation.mutate({
      id: selectedDocumentType.id,
      data: {
        code: data.code,
        name: data.name,
        description: data.description || undefined,
        isRequired: data.isRequired,
        isForSupportOnly: data.isForSupportOnly,
        displayOrder: data.displayOrder,
      },
    });
  };

  const handleDelete = () => {
    if (!selectedDocumentType) return;
    deleteMutation.mutate(selectedDocumentType.id);
  };

  const handleRestore = (id: string) => {
    restoreMutation.mutate(id);
  };

  const openEditDialog = (documentType: DocumentType) => {
    setSelectedDocumentType(documentType);
    editForm.reset({
      code: documentType.code,
      name: documentType.name,
      description: documentType.description || '',
      isRequired: documentType.isRequired,
      isForSupportOnly: documentType.isForSupportOnly,
      displayOrder: documentType.displayOrder,
    });
    setIsEditOpen(true);
  };

  // Pagination
  const totalPages = documentTypesData?.pagination?.totalPages || 1;
  const totalItems = documentTypesData?.pagination?.total || 0;
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const documentTypes = documentTypesData?.data || [];

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Tipos de Documento</h1>
          <p className="text-gray-500 mt-1">Gestiona los tipos de documento del sistema</p>
        </div>
        <Button className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" onClick={() => { createForm.reset(); setIsCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo Tipo
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1B3F66]">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.active || 0} activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.active || 0}</div>
            <p className="text-xs text-muted-foreground">Tipos activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requeridos</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.required || 0}</div>
            <p className="text-xs text-muted-foreground">Documentos obligatorios</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solo Apoyo</CardTitle>
            <Truck className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.forSupportOnly || 0}</div>
            <p className="text-xs text-muted-foreground">Camiones de apoyo</p>
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
                placeholder="Buscar por código o nombre..."
                className="pl-10"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={isActiveFilter} onValueChange={(v) => { setIsActiveFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Activos</SelectItem>
                <SelectItem value="false">Inactivos</SelectItem>
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
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Orden</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Requerido</TableHead>
                      <TableHead>Solo Apoyo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documentTypes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No se encontraron tipos de documento
                        </TableCell>
                      </TableRow>
                    ) : (
                      documentTypes.map((dt) => (
                        <TableRow key={dt.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <ArrowUpDown className="h-3 w-3 text-gray-400" />
                              <span className="text-sm">{dt.displayOrder}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {dt.code}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{dt.name}</div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-gray-500">
                            {dt.description || '-'}
                          </TableCell>
                          <TableCell>
                            {dt.isRequired ? (
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                                Requerido
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500">
                                Opcional
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {dt.isForSupportOnly ? (
                              <Badge className="bg-orange-50 text-orange-700 border-orange-200">
                                <Truck className="h-3 w-3 mr-1" />
                                Apoyo
                              </Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                dt.isActive
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }
                            >
                              {dt.isActive ? 'Activo' : 'Inactivo'}
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
                                <DropdownMenuItem onClick={() => openEditDialog(dt)}>
                                  <Edit className="h-4 w-4 mr-2" /> Editar
                                </DropdownMenuItem>
                                {!dt.isActive && (
                                  <DropdownMenuItem onClick={() => handleRestore(dt.id)}>
                                    <CheckCircle className="h-4 w-4 mr-2" /> Restaurar
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => { setSelectedDocumentType(dt); setIsDeleteOpen(true); }}
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

              {/* Pagination */}
              {documentTypes.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-gray-500">
                    Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, totalItems)} de {totalItems} tipos
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
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Tipo de Documento</DialogTitle>
            <DialogDescription>Ingresa los datos del nuevo tipo de documento</DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Controller name="code" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input {...field} placeholder="MIC" maxLength={20} className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="displayOrder" control={createForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Orden</Label>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    className={fieldState.invalid ? 'border-red-500' : ''}
                  />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
            </div>
            <Controller name="name" control={createForm.control} render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input {...field} placeholder="Manifiesto Internacional de Carga" className={fieldState.invalid ? 'border-red-500' : ''} />
                {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
              </div>
            )} />
            <Controller name="description" control={createForm.control} render={({ field }) => (
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea {...field} placeholder="Descripción del tipo de documento..." rows={3} />
              </div>
            )} />
            <div className="flex items-center gap-6">
              <Controller name="isRequired" control={createForm.control} render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label className="text-sm font-medium cursor-pointer">Requerido</Label>
                </div>
              )} />
              <Controller name="isForSupportOnly" control={createForm.control} render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label className="text-sm font-medium cursor-pointer">Solo camiones de apoyo</Label>
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
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Tipo de Documento</DialogTitle>
            <DialogDescription>Modifica los datos del tipo de documento</DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Controller name="code" control={editForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input {...field} maxLength={20} className={fieldState.invalid ? 'border-red-500' : ''} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
              <Controller name="displayOrder" control={editForm.control} render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Orden</Label>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    className={fieldState.invalid ? 'border-red-500' : ''}
                  />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )} />
            </div>
            <Controller name="name" control={editForm.control} render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input {...field} className={fieldState.invalid ? 'border-red-500' : ''} />
                {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
              </div>
            )} />
            <Controller name="description" control={editForm.control} render={({ field }) => (
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea {...field} rows={3} />
              </div>
            )} />
            <div className="flex items-center gap-6">
              <Controller name="isRequired" control={editForm.control} render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label className="text-sm font-medium cursor-pointer">Requerido</Label>
                </div>
              )} />
              <Controller name="isForSupportOnly" control={editForm.control} render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label className="text-sm font-medium cursor-pointer">Solo camiones de apoyo</Label>
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
            <AlertDialogTitle>¿Eliminar tipo de documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el tipo de documento &quot;{selectedDocumentType?.name}&quot;.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
