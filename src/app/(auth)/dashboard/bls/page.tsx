'use client';

import { useState, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import axios from 'axios';
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
  BarChart3,
  Download,
  Upload,
  FileDown,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
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
import * as XLSX from 'xlsx';

// Form schemas
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

const cancelSchema = z.object({
  reason: z.string().min(1, 'La razón de cancelación es requerida'),
});

type BLFormData = z.infer<typeof blSchema>;
type CancelFormData = z.infer<typeof cancelSchema>;

// Status config
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
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
};

// Interface para progreso del BL
interface BLProgress {
  totalWeight: number;
  deliveredWeight: number;
  pendingWeight: number;
  progressPercent: number;
  totalTrips: number;
  deliveredTrips: number;
  pendingTrips: number;
  tripsByStatus?: {
    scheduled: number;
    inTransit: number;
    delivered: number;
    cancelled: number;
  };
}

export default function BLsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clienteFilter, setClienteFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [selectedBL, setSelectedBL] = useState<BillOfLading | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<{
    total: number;
    created: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const [parsedItems, setParsedItems] = useState<unknown[]>([]);

  // Queries
  const { data: blsData, isLoading } = useQuery({
    queryKey: ['bls', { page, limit, search, status: statusFilter, clientId: clienteFilter, dateFrom, dateTo }],
    queryFn: () => blsApi.getAll({
      page,
      limit,
      search: search || undefined,
      status: statusFilter !== 'all' ? statusFilter as BLStatus : undefined,
      clientId: clienteFilter !== 'all' ? clienteFilter : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
  });

  const { data: clientesData } = useQuery({
    queryKey: ['clientes', { limit: 100 }],
    queryFn: () => clientesApi.getAll({ limit: 100 }),
  });

  const clientes = clientesData?.data || [];

  // Progress Query
  const progressQuery = useQuery({
    queryKey: ['bl-progress', selectedBL?.id],
    queryFn: () => blsApi.getProgress(selectedBL!.id),
    enabled: !!selectedBL?.id && isProgressOpen,
  });

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
    onError: (error: unknown) => {
      const message = getErrorMessage(error, 'No se pudo crear el BL.');
      toast({
        variant: 'destructive',
        title: 'Error al crear BL',
        description: message,
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
    onError: (error: unknown) => {
      const message = getErrorMessage(error, 'No se pudo actualizar el BL.');
      toast({
        variant: 'destructive',
        title: 'Error al actualizar',
        description: message,
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
    onError: (error: unknown) => {
      const message = getErrorMessage(error, 'No se pudo cancelar el BL.');
      toast({
        variant: 'destructive',
        title: 'Error al cancelar',
        description: message,
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: (items: Array<{ blNumber: string; clientNit: string; clientName: string; totalWeight: number; unitCount: number; cargoType?: string; originPort: string; customsPoint: string; finalDestination: string }>) =>
      blsApi.importFromJSON(items),
    onSuccess: (result) => {
      setImportResults(result);
      queryClient.invalidateQueries({ queryKey: ['bls'] });
      toast({
        title: 'Importación completada',
        description: `${result.created} BLs creados, ${result.skipped} omitidos, ${result.errors.length} errores`,
      });
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error, 'Error al importar BLs.');
      toast({
        variant: 'destructive',
        title: 'Error en importación',
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
    onError: (error: unknown) => {
      const message = getErrorMessage(error, 'No se pudo aprobar el BL.');
      toast({
        variant: 'destructive',
        title: 'Error al aprobar',
        description: message,
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
    defaultValues: { reason: '' },
  });

  // Handlers
  const handleCreate = (data: BLFormData) => {
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

  const handleEdit = (data: BLFormData) => {
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

  const handleCancel = (data: CancelFormData) => {
    if (!selectedBL) return;
    cancelMutation.mutate({ id: selectedBL.id, reason: data.reason });
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

  const openProgressDialog = (bl: BillOfLading) => {
    setSelectedBL(bl);
    setIsProgressOpen(true);
  };

  // Excel column mapping: friendly Spanish names → backend API field names
  const excelColumnMap: Record<string, string> = {
    'Número BL': 'blNumber',
    'NIT Cliente': 'clientNit',
    'Nombre Cliente': 'clientName',
    'Peso Total (kg)': 'totalWeight',
    'Unidades': 'unitCount',
    'Tipo de Carga': 'cargoType',
    'Puerto Origen': 'originPort',
    'Aduana': 'customsPoint',
    'Destino Final': 'finalDestination',
  };

  const excelColumns = Object.keys(excelColumnMap);

  // Generate Excel template for download
  const handleDownloadTemplate = useCallback(() => {
    try {
      const templateData = [
        excelColumns,
        ['BL-2024-001', '1023456789', 'EMPRESA S.R.L.', 25000, 6, 'Tubos de acero', 'Desaguadero', 'Desaguadero', 'La Paz'],
        ['BL-2024-002', '2034567890', 'IMPORTADORA ANDINA S.A.', 35000, 9, 'Planchas de acero', 'Arica', 'Arica', 'Santa Cruz'],
      ];

      const ws = XLSX.utils.aoa_to_sheet(templateData);

      // Set column widths
      ws['!cols'] = [
        { wch: 18 }, // Número BL
        { wch: 16 }, // NIT Cliente
        { wch: 30 }, // Nombre Cliente
        { wch: 16 }, // Peso Total (kg)
        { wch: 10 }, // Unidades
        { wch: 22 }, // Tipo de Carga
        { wch: 18 }, // Puerto Origen
        { wch: 18 }, // Aduana
        { wch: 18 }, // Destino Final
      ];

      // Style header row (bold) - XLSX community edition supports basic styling
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BLs');
      XLSX.writeFile(wb, 'plantilla-importacion-bls.xlsx');

      toast({
        title: 'Plantilla descargada',
        description: 'Archivo plantilla-importacion-bls.xlsx descargado exitosamente. Llena los datos y súbelo para importar.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al generar la plantilla.';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
      });
    }
  }, [toast]);

  // Parse Excel file to JSON array matching the backend API format
  const handleFileUpload = useCallback((file: File) => {
    setImportFile(file);
    setImportResults(null);
    setParsedItems([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

        if (jsonData.length === 0) {
          toast({
            variant: 'destructive',
            title: 'Archivo vacío',
            description: 'El archivo Excel no contiene datos. Agrega al menos un BL.',
          });
          return;
        }

        // Map Spanish column headers to backend field names
        const mappedItems = jsonData.map((row) => {
          const mapped: Record<string, unknown> = {};
          for (const [excelCol, apiField] of Object.entries(excelColumnMap)) {
            const value = row[excelCol];
            if (value !== undefined && value !== '') {
              // Convert numeric fields
              if (apiField === 'totalWeight' || apiField === 'unitCount') {
                mapped[apiField] = Number(value) || 0;
              } else {
                mapped[apiField] = String(value).trim();
              }
            }
          }
          return mapped;
        });

        setParsedItems(mappedItems);
        toast({
          title: 'Archivo leído',
          description: `Se encontraron ${mappedItems.length} BL(s) en el archivo.`,
        });
      } catch {
        setParsedItems([]);
        toast({
          variant: 'destructive',
          title: 'Error al leer archivo',
          description: 'No se pudo leer el archivo Excel. Verifica que sea un archivo .xlsx o .xls válido.',
        });
      }
    };
    reader.readAsArrayBuffer(file);
  }, [toast]);

  const handleImport = () => {
    if (parsedItems.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Sin datos',
        description: 'No hay BLs para importar. Carga un archivo Excel con datos.',
      });
      return;
    }
    importMutation.mutate(parsedItems as Parameters<typeof importMutation.mutate>[0]);
  };

  // Pagination
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Descargar Plantilla
          </Button>
          <Button
            variant="outline"
            className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
            onClick={() => {
              setImportFile(null);
              setImportResults(null);
              setParsedItems([]);
              setIsImportOpen(true);
            }}
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar BLs
          </Button>
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
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
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
            {/* Date Range Filter */}
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="dateFrom" className="text-sm text-gray-500">Desde</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                  className="mt-1"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="dateTo" className="text-sm text-gray-500">Hasta</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                  className="mt-1"
                />
              </div>
              {(dateFrom || dateTo) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                    setPage(1);
                  }}
                >
                  Limpiar fechas
                </Button>
              )}
            </div>
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
                                <DropdownMenuItem onClick={() => openProgressDialog(bl)}>
                                  <BarChart3 className="h-4 w-4 mr-2" />
                                  Ver Progreso
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditDialog(bl)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                {bl.status === 'SCHEDULED' && !bl.approvedById && (
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

      {/* Import BL Dialog */}
      <Dialog open={isImportOpen} onOpenChange={(open) => {
        if (!open) {
          setIsImportOpen(false);
          setImportFile(null);
          setImportResults(null);
          setParsedItems([]);
        }
      }}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Importar BLs desde Excel
            </DialogTitle>
            <DialogDescription>
              Carga un archivo Excel (.xlsx / .xls) con los datos de los BLs para importarlos masivamente.
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 hover:underline mt-1 text-sm"
              >
                <FileDown className="h-3.5 w-3.5" />
                Descargar plantilla de Excel
              </button>
            </DialogDescription>
          </DialogHeader>

          {/* Results display */}
          {importResults && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-sm">Resultado de la importación</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-[#1B3F66]">{importResults.total}</div>
                    <div className="text-xs text-gray-500 mt-1">Total Procesados</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-600">{importResults.created}</div>
                    <div className="text-xs text-gray-500 mt-1">Creados Exitosamente</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-amber-600">{importResults.skipped}</div>
                    <div className="text-xs text-gray-500 mt-1">Duplicados Omitidos</div>
                  </div>
                </div>
                {importResults.errors.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-red-600 font-medium text-sm">
                      <AlertCircle className="h-4 w-4" />
                      Errores ({importResults.errors.length})
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {importResults.errors.map((err, idx) => (
                        <div key={idx} className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">
                          {err}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsImportOpen(false)}>
                  Cerrar
                </Button>
                <Button
                  onClick={() => {
                    setImportResults(null);
                    setImportFile(null);
                    setParsedItems([]);
                  }}
                  className="bg-[#1B3F66] hover:bg-[#1B3F66]/90"
                >
                  Importar más BLs
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Input section (shown when no results yet) */}
          {!importResults && (
            <div className="space-y-4">
              {/* Column info card */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Columnas requeridas en el archivo Excel:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {excelColumns.map((col) => (
                        <Badge key={col} variant="outline" className="text-xs bg-white border-blue-200 text-blue-700">
                          {col}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Excel file upload zone */}
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-[#1B3F66]/50 hover:bg-gray-50 transition-colors"
                onClick={() => document.getElementById('import-file-input')?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files[0];
                  if (file) {
                    const ext = file.name.split('.').pop()?.toLowerCase();
                    if (ext === 'xlsx' || ext === 'xls') {
                      handleFileUpload(file);
                    } else {
                      toast({
                        variant: 'destructive',
                        title: 'Archivo inválido',
                        description: 'Solo se permiten archivos Excel (.xlsx o .xls)',
                      });
                    }
                  }
                }}
              >
                <input
                  id="import-file-input"
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                    e.target.value = '';
                  }}
                />
                <FileSpreadsheet className="h-10 w-10 mx-auto text-emerald-500 mb-3" />
                <p className="text-sm text-gray-600">
                  {importFile ? (
                    <span className="text-emerald-600 font-medium">{importFile.name}</span>
                  ) : (
                    'Haz clic o arrastra un archivo Excel aquí'
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Formatos aceptados: .xlsx, .xls
                </p>
              </div>

              {/* Preview table */}
              {parsedItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">
                      Vista previa ({parsedItems.length} BL{parsedItems.length > 1 ? 's' : ''})
                    </h4>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Listo para importar
                    </Badge>
                  </div>
                  <div className="border rounded-lg max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">#</TableHead>
                          <TableHead className="text-xs">Número BL</TableHead>
                          <TableHead className="text-xs">NIT</TableHead>
                          <TableHead className="text-xs">Cliente</TableHead>
                          <TableHead className="text-xs">Peso (kg)</TableHead>
                          <TableHead className="text-xs">Unidades</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedItems.slice(0, 50).map((item, idx) => {
                          const bl = item as Record<string, unknown>;
                          return (
                            <TableRow key={idx}>
                              <TableCell className="text-xs text-gray-500">{idx + 1}</TableCell>
                              <TableCell className="text-xs font-medium">{String(bl.blNumber || '-')}</TableCell>
                              <TableCell className="text-xs">{String(bl.clientNit || '-')}</TableCell>
                              <TableCell className="text-xs">{String(bl.clientName || '-')}</TableCell>
                              <TableCell className="text-xs">{String(bl.totalWeight || '-')}</TableCell>
                              <TableCell className="text-xs">{String(bl.unitCount || '-')}</TableCell>
                            </TableRow>
                          );
                        })}
                        {parsedItems.length > 50 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-xs text-gray-500 py-2">
                              ... y {parsedItems.length - 50} BLs más
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Validation error display */}
              {(importFile && parsedItems.length === 0) && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-lg p-3 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  No se pudieron leer BLs del archivo. Verifica que las columnas coincidan con la plantilla.
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsImportOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleImport}
                  disabled={parsedItems.length === 0 || importMutation.isPending}
                >
                  {importMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Upload className="h-4 w-4 mr-2" />
                  Importar {parsedItems.length > 0 ? `${parsedItems.length} BL${parsedItems.length > 1 ? 's' : ''}` : ''}
                </Button>
              </DialogFooter>
            </div>
          )}
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

      {/* Progress Dialog */}
      <Dialog open={isProgressOpen} onOpenChange={setIsProgressOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Progreso del BL</DialogTitle>
            <DialogDescription>
              {selectedBL?.blNumber} - {selectedBL?.client?.businessName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {progressQuery.isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-[#1B3F66]" />
              </div>
            ) : progressQuery.data ? (
              <div className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progreso General</span>
                    <span className="font-medium">{progressQuery.data.progressPercent?.toFixed(1) || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-[#1B3F66] h-3 rounded-full transition-all" 
                      style={{ width: `${Math.min(progressQuery.data.progressPercent || 0, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500">Peso Total</div>
                      <div className="text-xl font-bold text-[#1B3F66]">
                        {progressQuery.data.totalWeight?.toLocaleString() || 0} kg
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500">Entregado</div>
                      <div className="text-xl font-bold text-green-600">
                        {progressQuery.data.deliveredWeight?.toLocaleString() || 0} kg
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500">Pendiente</div>
                      <div className="text-xl font-bold text-orange-600">
                        {progressQuery.data.pendingWeight?.toLocaleString() || 0} kg
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500">Viajes</div>
                      <div className="text-xl font-bold">
                        {progressQuery.data.deliveredTrips || 0} / {progressQuery.data.totalTrips || 0}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Trips by Status */}
                {progressQuery.data.tripsByStatus && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Viajes por Estado</div>
                    <div className="flex gap-2 flex-wrap">
                      {progressQuery.data.tripsByStatus.scheduled > 0 && (
                        <Badge className="bg-yellow-100 text-yellow-800">Programados: {progressQuery.data.tripsByStatus.scheduled}</Badge>
                      )}
                      {progressQuery.data.tripsByStatus.inTransit > 0 && (
                        <Badge className="bg-blue-100 text-blue-800">En Tránsito: {progressQuery.data.tripsByStatus.inTransit}</Badge>
                      )}
                      {progressQuery.data.tripsByStatus.delivered > 0 && (
                        <Badge className="bg-green-100 text-green-800">Entregados: {progressQuery.data.tripsByStatus.delivered}</Badge>
                      )}
                      {progressQuery.data.tripsByStatus.cancelled > 0 && (
                        <Badge className="bg-red-100 text-red-800">Cancelados: {progressQuery.data.tripsByStatus.cancelled}</Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No se pudo cargar el progreso del BL
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProgressOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
