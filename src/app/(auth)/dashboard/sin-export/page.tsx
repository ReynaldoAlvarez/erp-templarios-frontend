'use client';

import { useState } from 'react';
import {
  FileSpreadsheet,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Send,
  Eye,
  ExternalLink,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  useSINExports,
  useSINExportStats,
  useProcessSINExport,
  useRetrySINExport,
} from '@/hooks/use-queries';
import { SINExportStatus, SINExport } from '@/types/api';
import { useToast } from '@/hooks/use-toast';

const STATUS_LABELS: Record<SINExportStatus, string> = {
  PENDING: 'Pendiente',
  PROCESSING: 'Procesando',
  SUCCESS: 'Exitoso',
  FAILED: 'Fallido',
};

const STATUS_COLORS: Record<SINExportStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SUCCESS: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};

const STATUS_ICONS: Record<SINExportStatus, React.ReactNode> = {
  PENDING: <Clock className="h-4 w-4" />,
  PROCESSING: <RefreshCw className="h-4 w-4 animate-spin" />,
  SUCCESS: <CheckCircle className="h-4 w-4" />,
  FAILED: <XCircle className="h-4 w-4" />,
};

export default function SINExportPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SINExportStatus | undefined>();
  const [selectedExport, setSelectedExport] = useState<SINExport | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data: exportsData, isLoading } = useSINExports({
    page,
    limit: 10,
    search,
    status: statusFilter,
  });

  const { data: stats } = useSINExportStats();

  const processMutation = useProcessSINExport();
  const retryMutation = useRetrySINExport();

  const handleProcess = async (id: string) => {
    try {
      await processMutation.mutateAsync(id);
      toast({ title: 'Exportación procesada', description: 'La factura se envió al SIN' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo procesar la exportación', variant: 'destructive' });
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await retryMutation.mutateAsync(id);
      toast({ title: 'Reintento iniciado', description: 'Se está reintentando la exportación' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo reintentar', variant: 'destructive' });
    }
  };

  const handleViewDetail = (exportItem: SINExport) => {
    setSelectedExport(exportItem);
    setIsDetailOpen(true);
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(amount);
  
  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString('es-BO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SIN Export</h1>
          <p className="text-gray-500">Facturación electrónica Bolivia - Impuestos Nacionales</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exportaciones</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-[#1B3F66]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exitosos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.success || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fallidos</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.failed || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input placeholder="Buscar por factura..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter || ''} onValueChange={(v) => setStatusFilter(v as SINExportStatus || undefined)}>
              <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setSearch(''); setStatusFilter(undefined); }}>
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Factura</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>NIT</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Cargando...</TableCell></TableRow>
              ) : !exportsData?.data.length ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">No hay exportaciones</TableCell></TableRow>
              ) : (
                exportsData.data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{formatDate(item.createdAt)}</TableCell>
                    <TableCell className="font-medium">{item.invoice?.invoiceNumber || '-'}</TableCell>
                    <TableCell>{item.invoice?.client?.businessName || '-'}</TableCell>
                    <TableCell>{item.invoice?.client?.nit || '-'}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[item.status]}>
                        <span className="flex items-center gap-1">
                          {STATUS_ICONS[item.status]}
                          {STATUS_LABELS[item.status]}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.invoice?.totalAmount || 0)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {item.status === 'PENDING' && (
                          <Button variant="outline" size="sm" onClick={() => handleProcess(item.id)}>
                            <Send className="h-3 w-3" />
                          </Button>
                        )}
                        {item.status === 'FAILED' && (
                          <Button variant="outline" size="sm" onClick={() => handleRetry(item.id)}>
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => handleViewDetail(item)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {exportsData && exportsData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando {((page - 1) * 10) + 1} - {Math.min(page * 10, exportsData.pagination.total)} de {exportsData.pagination.total} registros
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>Anterior</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === exportsData.pagination.totalPages}>Siguiente</Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle de Exportación SIN</DialogTitle>
            <DialogDescription>Información detallada de la exportación</DialogDescription>
          </DialogHeader>
          {selectedExport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Estado</Label>
                  <Badge className={STATUS_COLORS[selectedExport.status]}>
                    <span className="flex items-center gap-1">
                      {STATUS_ICONS[selectedExport.status]}
                      {STATUS_LABELS[selectedExport.status]}
                    </span>
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Factura</Label>
                  <p className="font-medium">{selectedExport.invoice?.invoiceNumber}</p>
                </div>
              </div>
              
              {selectedExport.cuf && (
                <div>
                  <Label className="text-sm text-gray-500">CUF (Código Único de Facturación)</Label>
                  <p className="font-mono text-xs break-all bg-gray-50 p-2 rounded">{selectedExport.cuf}</p>
                </div>
              )}
              
              {selectedExport.cufd && (
                <div>
                  <Label className="text-sm text-gray-500">CUFD</Label>
                  <p className="font-mono text-xs break-all bg-gray-50 p-2 rounded">{selectedExport.cufd}</p>
                </div>
              )}
              
              {selectedExport.controlCode && (
                <div>
                  <Label className="text-sm text-gray-500">Código de Control</Label>
                  <p className="font-mono">{selectedExport.controlCode}</p>
                </div>
              )}
              
              {selectedExport.qrCode && (
                <div>
                  <Label className="text-sm text-gray-500">QR Code</Label>
                  <p className="font-mono text-xs break-all bg-gray-50 p-2 rounded">{selectedExport.qrCode}</p>
                </div>
              )}
              
              {selectedExport.errorMessage && (
                <div>
                  <Label className="text-sm text-red-500">Mensaje de Error</Label>
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{selectedExport.errorMessage}</p>
                </div>
              )}
              
              {selectedExport.retryCount > 0 && (
                <div>
                  <Label className="text-sm text-gray-500">Intentos de Reintento</Label>
                  <p>{selectedExport.retryCount}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={`text-sm font-medium ${className}`}>{children}</p>;
}
