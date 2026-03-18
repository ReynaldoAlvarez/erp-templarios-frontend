'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import axios from 'axios';
import {
  Search, Plus, MoreHorizontal, Edit, Loader2, ChevronLeft, ChevronRight,
  FileText, CheckCircle, Clock, AlertTriangle, FileCheck, FileX, Upload, Download,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi, tripsApi } from '@/lib/api-client';
import { TripDocument, CreateDocumentInput, UpdateDocumentInput, DocumentStatus } from '@/types/api';

// Form schema
const documentSchema = z.object({
  tripId: z.string().min(1, 'El viaje es requerido'),
  documentType: z.string().min(1, 'El tipo de documento es requerido'),
  documentNumber: z.string().optional(),
  documentDate: z.string().optional(),
  fileUrl: z.string().optional(),
  isLocalFile: z.boolean().optional(),
  notes: z.string().optional(),
});

type DocumentFormData = z.infer<typeof documentSchema>;

// Status config
const statusConfig: Record<DocumentStatus, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING: { label: 'Pendiente', className: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock },
  RECEIVED: { label: 'Recibido', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: FileCheck },
  VERIFIED: { label: 'Verificado', className: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
};

// Document types
const DOCUMENT_TYPES = [
  'BL Original', 'Factura Comercial', 'Packing List', 'Certificado de Origen',
  'Seguro', 'MIC/DTA', 'Declaración de Importación', 'Póliza', 'Carta de Porte', 'Otros'
];

// Helper
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (axios.isAxiosError(error)) return error.response?.data?.message || defaultMessage;
  return error instanceof Error ? error.message : defaultMessage;
};

// Format date
const formatDate = (date: string | undefined) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('es-BO');
};

export default function DocumentosPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<TripDocument | null>(null);

  // Queries
  const { data: documentsData, isLoading } = useQuery({
    queryKey: ['documents', { page, limit, search, status: statusFilter, documentType: typeFilter }],
    queryFn: () => documentsApi.getAll({
      page,
      limit,
      status: statusFilter !== 'all' ? statusFilter as DocumentStatus : undefined,
      documentType: typeFilter || undefined,
    }),
  });

  const { data: stats } = useQuery({
    queryKey: ['documents', 'stats'],
    queryFn: () => documentsApi.getStats(),
  });

  const { data: trips } = useQuery({
    queryKey: ['trips', { limit: 100 }],
    queryFn: () => tripsApi.getAll({ limit: 100 }),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateDocumentInput) => documentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({ title: 'Documento creado', description: 'El documento ha sido creado exitosamente.' });
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: (error: unknown) => {
      toast({ variant: 'destructive', title: 'Error al crear', description: getErrorMessage(error, 'No se pudo crear el documento.') });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocumentInput }) => documentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({ title: 'Documento actualizado' });
      setIsEditOpen(false);
      setSelectedDocument(null);
    },
    onError: (error: unknown) => {
      toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error, 'No se pudo actualizar.') });
    },
  });

  const receiveMutation = useMutation({
    mutationFn: (id: string) => documentsApi.receive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({ title: 'Documento recibido' });
    },
    onError: (error: unknown) => {
      toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error, 'No se pudo marcar como recibido.') });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => documentsApi.verify(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({ title: 'Documento verificado' });
    },
    onError: (error: unknown) => {
      toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error, 'No se pudo verificar.') });
    },
  });

  // Forms
  const createForm = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: { tripId: '', documentType: '', documentNumber: '', documentDate: '', fileUrl: '', notes: '' },
  });

  const editForm = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: { tripId: '', documentType: '', documentNumber: '', documentDate: '', fileUrl: '', notes: '' },
  });

  // Handlers
  const handleCreate = (data: DocumentFormData) => {
    createMutation.mutate({
      tripId: data.tripId,
      documentType: data.documentType,
      documentNumber: data.documentNumber || undefined,
      documentDate: data.documentDate || undefined,
      fileUrl: data.fileUrl || undefined,
      notes: data.notes || undefined,
    });
  };

  const handleEdit = (data: DocumentFormData) => {
    if (!selectedDocument) return;
    updateMutation.mutate({
      id: selectedDocument.id,
      data: {
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        fileUrl: data.fileUrl,
        notes: data.notes,
      },
    });
  };

  const openEditDialog = (doc: TripDocument) => {
    setSelectedDocument(doc);
    editForm.reset({
      tripId: doc.tripId,
      documentType: doc.documentType,
      documentNumber: doc.documentNumber || '',
      documentDate: doc.documentDate ? doc.documentDate.split('T')[0] : '',
      fileUrl: doc.fileUrl || '',
      notes: doc.notes || '',
    });
    setIsEditOpen(true);
  };

  // Pagination
  const totalPages = documentsData?.pagination?.totalPages || 1;
  const totalItems = documentsData?.pagination?.total || 0;
  const documents = documentsData?.data || [];
  const tripsList = trips?.data || [];

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Documentos</h1>
          <p className="text-gray-500 mt-1">Gestión de documentos de viajes</p>
        </div>
        <Button className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" onClick={() => { createForm.reset(); setIsCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo Documento
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1B3F66]">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recibidos</CardTitle>
            <FileCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.byStatus?.RECEIVED || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verificados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.byStatus?.VERIFIED || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Buscar documento..." className="pl-10" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
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
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-[#1B3F66]" /></div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Número</TableHead>
                      <TableHead>Viaje (MIC/DTA)</TableHead>
                      <TableHead>BL</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No se encontraron documentos</TableCell></TableRow>
                    ) : (
                      documents.map((doc) => {
                        const stConfig = statusConfig[doc.status];
                        const StatusIcon = stConfig?.icon || FileText;
                        return (
                          <TableRow key={doc.id} className="hover:bg-gray-50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-[#1B3F66]/10 flex items-center justify-center">
                                  <FileText className="h-4 w-4 text-[#1B3F66]" />
                                </div>
                                <span className="font-medium">{doc.documentType}</span>
                              </div>
                            </TableCell>
                            <TableCell>{doc.documentNumber || '-'}</TableCell>
                            <TableCell>{doc.trip?.micDta || '-'}</TableCell>
                            <TableCell>{doc.trip?.billOfLading?.blNumber || '-'}</TableCell>
                            <TableCell>{formatDate(doc.documentDate)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={stConfig?.className}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {stConfig?.label || doc.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditDialog(doc)}><Edit className="h-4 w-4 mr-2" /> Editar</DropdownMenuItem>
                                  {doc.status === 'PENDING' && (
                                    <DropdownMenuItem onClick={() => receiveMutation.mutate(doc.id)}>
                                      <FileCheck className="h-4 w-4 mr-2" /> Marcar Recibido
                                    </DropdownMenuItem>
                                  )}
                                  {doc.status === 'RECEIVED' && (
                                    <DropdownMenuItem onClick={() => verifyMutation.mutate(doc.id)}>
                                      <CheckCircle className="h-4 w-4 mr-2" /> Verificar
                                    </DropdownMenuItem>
                                  )}
                                  {doc.fileUrl && (
                                    <DropdownMenuItem onClick={() => window.open(doc.fileUrl!, '_blank')}>
                                      <Download className="h-4 w-4 mr-2" /> Descargar
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
              {documents.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-gray-500">Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, totalItems)} de {totalItems}</div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setPage(page - 1)} disabled={page <= 1}><ChevronLeft className="h-4 w-4" /></Button>
                    <div className="text-sm">Página {page} de {totalPages}</div>
                    <Button variant="outline" size="icon" onClick={() => setPage(page + 1)} disabled={page >= totalPages}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crear Documento</DialogTitle>
            <DialogDescription>Ingresa los datos del documento</DialogDescription>
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
            <Controller name="documentType" control={createForm.control} render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label>Tipo de Documento *</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
              </div>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <Controller name="documentNumber" control={createForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Número de Documento</Label>
                  <Input {...field} placeholder="Ej: DOC-001" />
                </div>
              )} />
              <Controller name="documentDate" control={createForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input {...field} type="date" />
                </div>
              )} />
            </div>
            <Controller name="fileUrl" control={createForm.control} render={({ field }) => (
              <div className="space-y-2">
                <Label>URL del Archivo</Label>
                <Input {...field} placeholder="https://..." />
              </div>
            )} />
            <Controller name="notes" control={createForm.control} render={({ field }) => (
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea {...field} rows={2} />
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Documento</DialogTitle>
            <DialogDescription>Modifica los datos del documento</DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4 py-4">
            <Controller name="documentType" control={editForm.control} render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label>Tipo de Documento *</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )} />
            <Controller name="documentNumber" control={editForm.control} render={({ field }) => (
              <div className="space-y-2">
                <Label>Número de Documento</Label>
                <Input {...field} />
              </div>
            )} />
            <Controller name="fileUrl" control={editForm.control} render={({ field }) => (
              <div className="space-y-2">
                <Label>URL del Archivo</Label>
                <Input {...field} />
              </div>
            )} />
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
    </div>
  );
}
