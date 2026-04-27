'use client';

import { useState, useCallback } from 'react';
import {
  Lock,
  Unlock,
  AlertTriangle,
  DollarSign,
  CheckCircle2,
  RefreshCw,
  FileText,
  Clock,
  Shield,
  Search,
  History,
  Truck,
  User,
  ArrowLeft,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BlockedPaymentCard } from '@/components/modules/payments/BlockedPaymentCard';
import {
  usePaymentBlockStats,
  useBlockedPayments,
  useUnblockPayment,
  useProcessAllPayments,
  usePaymentBlockHistory,
  usePaymentBlockChecklist,
  useCheckPayment,
} from '@/hooks/use-queries';
import { useToast } from '@/hooks/use-toast';
import type {
  BlockedSettlement,
  PaymentBlockHistory,
} from '@/types/api';

// ==========================================
// Stats Cards
// ==========================================
function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  subtitle?: string;
}) {
  return (
    <Card className="border border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium">{title}</p>
            <p className="text-lg font-bold text-gray-900 truncate">{value}</p>
            {subtitle && <p className="text-[10px] text-gray-400">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// Unblock Modal
// ==========================================
function UnblockModal({
  open,
  onClose,
  settlement,
  onConfirm,
  isUnblocking,
}: {
  open: boolean;
  onClose: () => void;
  settlement: BlockedSettlement | null;
  onConfirm: (settlementId: string, reason: string) => void;
  isUnblocking: boolean;
}) {
  const [reason, setReason] = useState('');

  const driverName = settlement?.trip?.driver?.employee
    ? `${settlement.trip.driver.employee.firstName} ${settlement.trip.driver.employee.lastName}`
    : '';
  const amount = settlement?.netPayment ?? 0;
  const blockedDays = settlement?.blockedDays ?? 0;

  const formattedAmount = new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  }).format(amount);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Unlock className="h-5 w-5 text-green-600" />
            Desbloquear Pago
          </DialogTitle>
          <DialogDescription>
            Desbloquear el pago manualmente. Esta acción quedará registrada en el historial de auditoría.
          </DialogDescription>
        </DialogHeader>

        {settlement && (
          <div className="space-y-4 py-2">
            {/* Settlement Info */}
            <div className="p-3 bg-gray-50 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Conductor:</span>
                <span className="font-medium text-gray-900">{driverName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Monto Bloqueado:</span>
                <span className="font-bold text-red-600">{formattedAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Días Bloqueado:</span>
                <span className="font-medium text-gray-900">{blockedDays} días</span>
              </div>
            </div>

            {/* Missing Docs */}
            {settlement.missingDocuments && settlement.missingDocuments.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg space-y-1">
                <p className="text-xs font-medium text-yellow-800 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Documentos pendientes ({settlement.missingDocuments.length})
                </p>
                {settlement.missingDocuments.map((doc) => (
                  <p key={doc.code} className="text-xs text-yellow-700">
                    • {doc.code} - {doc.name}
                  </p>
                ))}
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Motivo del desbloqueo <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Ingrese el motivo del desbloqueo (mínimo 10 caracteres)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-[10px] text-gray-400">
                {reason.length}/10 caracteres mínimos requeridos
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isUnblocking}>
            Cancelar
          </Button>
          <Button
            onClick={() => onConfirm(settlement?.id ?? '', reason)}
            disabled={isUnblocking || reason.trim().length < 10 || !settlement}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isUnblocking ? (
              <>
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                Desbloqueando...
              </>
            ) : (
              <>
                <Unlock className="h-4 w-4 mr-1" />
                Confirmar Desbloqueo
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// History Panel
// ==========================================
function HistoryPanel({ settlementId }: { settlementId: string | undefined }) {
  const { data: history, isLoading } = usePaymentBlockHistory(settlementId);

  if (!settlementId) {
    return (
      <div className="text-center py-12">
        <History className="h-10 w-10 mx-auto text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">Seleccione un pago bloqueado para ver su historial</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!history) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">No se encontró historial</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Status */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-xs font-medium text-gray-500 mb-2">Estado Actual</p>
        <div className="flex items-center gap-2">
          <Badge className={history.currentStatus.isPaymentBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
            {history.currentStatus.isPaymentBlocked ? 'Bloqueado' : 'Desbloqueado'}
          </Badge>
          <span className="text-xs text-gray-400">
            Docs: {history.currentStatus.documentsComplete ? 'Completos' : 'Incompletos'}
          </span>
        </div>
      </div>

      {/* History Timeline */}
      {history.history && history.history.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {history.history.map((entry, idx) => (
            <div key={idx} className="flex gap-3 text-sm">
              <div className="flex flex-col items-center">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  entry.details.isPaymentBlocked ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  {entry.details.isPaymentBlocked ? (
                    <Lock className="h-4 w-4 text-red-600" />
                  ) : (
                    <Unlock className="h-4 w-4 text-green-600" />
                  )}
                </div>
                {idx < history.history.length - 1 && (
                  <div className="w-px h-6 bg-gray-200" />
                )}
              </div>
              <div className="flex-1 min-w-0 pb-2">
                <p className="font-medium text-gray-900 text-xs">{entry.action}</p>
                <p className="text-[10px] text-gray-400">
                  {entry.userName} • {new Date(entry.timestamp).toLocaleString('es-BO')}
                </p>
                {entry.details.reason && (
                  <p className="text-[10px] text-gray-500 mt-0.5">{entry.details.reason}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <CheckCircle2 className="h-8 w-8 mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No hay registros de historial</p>
        </div>
      )}
    </div>
  );
}

// ==========================================
// Document Checklist Dialog
// ==========================================
function DocumentChecklistDialog({
  open,
  onClose,
  settlement,
}: {
  open: boolean;
  onClose: () => void;
  settlement: BlockedSettlement | null;
}) {
  const { toast } = useToast();
  const tripId = settlement?.trip?.id;
  const { data: checklist, isLoading: checklistLoading, refetch: refetchChecklist } = usePaymentBlockChecklist(tripId);
  const checkPaymentMutation = useCheckPayment();

  const driverName = settlement?.trip?.driver?.employee
    ? `${settlement.trip.driver.employee.firstName} ${settlement.trip.driver.employee.lastName}`
    : 'Desconocido';
  const truckPlate = settlement?.trip?.truck?.plateNumber || 'N/A';
  const micDta = settlement?.trip?.micDta || 'N/A';
  const blNumber = settlement?.trip?.billOfLading?.blNumber || 'N/A';

  const completionPercent = checklist
    ? checklist.summary.total > 0
      ? Math.round((checklist.summary.verified / checklist.summary.total) * 100)
      : 100
    : 0;

  const handleVerifyAndRefresh = useCallback(() => {
    if (!tripId) return;
    checkPaymentMutation.mutate(tripId, {
      onSuccess: (result) => {
        refetchChecklist();
        if (result.documentsComplete) {
          toast({
            title: 'Verificación completa',
            description: 'Todos los documentos están completos. El pago puede ser procesado.',
          });
        } else {
          toast({
            title: 'Documentos incompletos',
            description: result.blockReason || `Faltan ${result.missingDocuments?.length || 0} documento(s).`,
            variant: 'destructive',
          });
        }
      },
      onError: () => {
        toast({
          title: 'Error al verificar',
          description: 'No se pudo verificar el estado de documentos.',
          variant: 'destructive',
        });
      },
    });
  }, [tripId, checkPaymentMutation, refetchChecklist, toast]);

  // Status config for document items
  const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
    PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    RECEIVED: { label: 'Recibido', color: 'bg-blue-100 text-blue-800', icon: FileText },
    VERIFIED: { label: 'Verificado', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[580px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#1B3F66]" />
            Documentos del Viaje
          </DialogTitle>
          <DialogDescription>
            Revisa el estado de los documentos y verifica su completitud
          </DialogDescription>
        </DialogHeader>

        {settlement && (
          <div className="space-y-4">
            {/* Trip Info Header */}
            <div className="p-3 bg-gray-50 rounded-lg space-y-2 text-sm">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="font-mono font-medium text-gray-900">{micDta}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <span className="text-gray-400">BL:</span>
                  <span className="font-mono text-gray-900">{blNumber}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <User className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="text-gray-900">{driverName}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Truck className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="font-mono text-gray-900">{truckPlate}</span>
                </div>
              </div>
            </div>

            {/* Support Truck Indicator */}
            {settlement?.trip?.truck?.isSupportTruck && (
              <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                <Truck className="h-4 w-4 text-orange-600" />
                <span className="text-xs font-medium text-orange-800">
                  Camión de soporte - Se requiere FACTURA adicional
                </span>
              </div>
            )}

            {/* Loading */}
            {checklistLoading && (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            )}

            {/* Checklist Content */}
            {checklist && !checklistLoading && (
              <>
                {/* Payment Status Banner */}
                <div className={`p-3 rounded-lg border ${
                  checklist.paymentStatus.isBlocked
                    ? 'bg-red-50 border-red-200'
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {checklist.paymentStatus.isBlocked ? (
                      <Lock className="h-4 w-4 text-red-600" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      checklist.paymentStatus.isBlocked ? 'text-red-800' : 'text-green-800'
                    }`}>
                      {checklist.paymentStatus.isBlocked ? 'Pago Bloqueado' : 'Pago Habilitado'}
                    </span>
                  </div>
                  {checklist.paymentStatus.blockReason && (
                    <p className="text-xs text-red-600 mt-1">{checklist.paymentStatus.blockReason}</p>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progreso de documentos</span>
                    <span className="font-semibold text-gray-900">{completionPercent}%</span>
                  </div>
                  <Progress value={completionPercent} className="h-2.5" />
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                      ✓ {checklist.summary.verified} Verificados
                    </Badge>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                      ○ {checklist.summary.pending} Pendientes
                    </Badge>
                    {checklist.summary.blockingCount > 0 && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                        ⛔ {checklist.summary.blockingCount} Bloquean pago
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Document List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {checklist.documents && checklist.documents.length > 0 ? (
                    checklist.documents.map((doc, idx) => {
                      const status = statusConfig[doc.status] || statusConfig['PENDING'];
                      const StatusIcon = status.icon;
                      return (
                        <div
                          key={doc.id || idx}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                            doc.isBlocking
                              ? 'border-red-200 bg-red-50/50'
                              : 'border-gray-100 hover:bg-gray-50'
                          }`}
                        >
                          {/* Order */}
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-medium flex items-center justify-center">
                            {idx + 1}
                          </span>

                          {/* Code */}
                          <span className="flex-shrink-0 w-16 text-xs font-mono text-gray-500 truncate">
                            {doc.code}
                          </span>

                          {/* Name */}
                          <span className="flex-1 text-sm text-gray-700 truncate">
                            {doc.name}
                          </span>

                          {/* Required */}
                          {doc.isRequired && (
                            <Badge variant="outline" className="flex-shrink-0 bg-red-50 text-red-600 border-red-200 text-[10px] px-1.5 py-0">
                              Req.
                            </Badge>
                          )}

                          {/* Blocking Indicator */}
                          {doc.isBlocking && (
                            <Badge variant="outline" className="flex-shrink-0 bg-red-100 text-red-700 border-red-300 text-[10px] px-1.5 py-0">
                              Bloquea
                            </Badge>
                          )}

                          {/* Status */}
                          <Badge variant="outline" className={`flex-shrink-0 text-[10px] px-2 py-0.5 ${status.color}`}>
                            <StatusIcon className="h-3 w-3 mr-0.5 inline" />
                            {status.label}
                          </Badge>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6">
                      <CheckCircle2 className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">No hay documentos requeridos para este viaje</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* No checklist data */}
            {!checklist && !checklistLoading && (
              <div className="text-center py-8">
                <AlertTriangle className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No se pudo cargar el checklist de documentos</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} className="text-sm">
            Cerrar
          </Button>
          <Button
            onClick={handleVerifyAndRefresh}
            disabled={checkPaymentMutation.isPending || !tripId}
            className="bg-[#1B3F66] hover:bg-[#1B3F66]/90 text-white text-sm"
          >
            {checkPaymentMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-1" />
                Verificar y Actualizar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// Main Page
// ==========================================
export default function PaymentBlockPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'blocked' | 'history'>('blocked');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [unblockSettlement, setUnlockSettlement] = useState<BlockedSettlement | null>(null);
  const [unblockModalOpen, setUnlockModalOpen] = useState(false);
  const [docsSettlement, setDocsSettlement] = useState<BlockedSettlement | null>(null);
  const [docsDialogOpen, setDocsDialogOpen] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | undefined>(undefined);
  const [processAllOpen, setProcessAllOpen] = useState(false);

  // Queries
  const { data: stats, isLoading: statsLoading } = usePaymentBlockStats();
  const { data: blockedData, isLoading: blockedLoading } = useBlockedPayments({
    search: searchQuery || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });
  const unblockMutation = useUnblockPayment();
  const processAllMutation = useProcessAllPayments();

  // Handlers
  const handleUnblock = (settlementId: string, reason: string) => {
    unblockMutation.mutate(
      { settlementId, reason },
      {
        onSuccess: () => {
          setUnlockModalOpen(false);
          setUnlockSettlement(null);
          toast({
            title: 'Pago desbloqueado',
            description: 'El pago ha sido desbloqueado exitosamente.',
          });
        },
        onError: () => {
          toast({
            title: 'Error',
            description: 'No se pudo desbloquear el pago.',
            variant: 'destructive',
          });
        },
      },
    );
  };

  const handleProcessAll = () => {
    processAllMutation.mutate(undefined, {
      onSuccess: () => {
        setProcessAllOpen(false);
        toast({
          title: 'Procesamiento completo',
          description: 'Se verificaron todos los pagos pendientes.',
        });
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Error al procesar los pagos.',
          variant: 'destructive',
        });
      },
    });
  };

  const handleViewDocuments = useCallback((settlementId: string, tripId: string) => {
    const settlement = blockedData?.data.find((s) => s.id === settlementId);
    if (settlement) {
      setDocsSettlement(settlement);
      setDocsDialogOpen(true);
    }
  }, [blockedData]);

  const handleViewHistory = useCallback((settlementId: string) => {
    setSelectedHistoryId(settlementId);
    setActiveTab('history');
  }, []);

  // Format currency
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2,
    }).format(amount);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-[#1B3F66] flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Bloqueo de Pagos</h1>
              <p className="text-sm text-gray-500">
                Gestiona el bloqueo de pagos por documentos pendientes
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))
          ) : stats ? (
            <>
              <StatCard
                title="Total Pagos"
                value={stats.total}
                icon={DollarSign}
                color="bg-[#1B3F66]"
                subtitle="Con liquidación"
              />
              <StatCard
                title="Bloqueados"
                value={stats.blocked}
                icon={Lock}
                color="bg-red-500"
                subtitle={`${stats.blockedPercentage.toFixed(1)}% del total`}
              />
              <StatCard
                title="Desbloqueados"
                value={stats.unblocked}
                icon={CheckCircle2}
                color="bg-green-500"
              />
              <StatCard
                title="Monto Bloqueado"
                value={formatCurrency(stats.totalBlockedAmount)}
                icon={AlertTriangle}
                color="bg-orange-500"
                subtitle={`Prom: ${stats.avgBlockedDays.toFixed(1)} días`}
              />
            </>
          ) : null}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar conductor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 text-sm w-full sm:w-auto"
              placeholder="Desde"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 text-sm w-full sm:w-auto"
              placeholder="Hasta"
            />
          </div>
          <Button
            onClick={() => setProcessAllOpen(true)}
            disabled={processAllMutation.isPending}
            className="bg-[#1B3F66] hover:bg-[#1B3F66]/90 text-white h-9 text-sm"
          >
            {processAllMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Procesar Todo
          </Button>
        </div>

        {/* Tabs & Content */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'blocked' | 'history')}>
          <TabsList className="bg-white border border-gray-200 w-fit rounded-lg">
            <TabsTrigger value="blocked" className="text-sm data-[state=active]:bg-[#1B3F66] data-[state=active]:text-white rounded-md">
              <Lock className="h-4 w-4 mr-1" />
              Bloqueados
            </TabsTrigger>
            <TabsTrigger value="history" className="text-sm data-[state=active]:bg-[#1B3F66] data-[state=active]:text-white rounded-md">
              <History className="h-4 w-4 mr-1" />
              Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="blocked">
            {blockedLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-56 rounded-xl" />
                ))}
              </div>
            ) : blockedData && blockedData.data.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {blockedData.data.map((settlement) => (
                  <BlockedPaymentCard
                    key={settlement.id}
                    settlement={settlement}
                    onViewDocuments={(settlementId, tripId) => {
                      handleViewDocuments(settlementId, tripId);
                    }}
                    onUnblock={(s) => {
                      setUnlockSettlement(s);
                      setUnlockModalOpen(true);
                    }}
                    onViewHistory={(settlementId) => {
                      handleViewHistory(settlementId);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <CheckCircle2 className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900">Sin pagos bloqueados</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Todos los pagos tienen sus documentos completos
                </p>
              </div>
            )}

            {/* Pagination */}
            {blockedData && blockedData.pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!blockedData.pagination.hasPrev}
                  onClick={() => {}}
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-600">
                  Página {blockedData.pagination.page} de {blockedData.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!blockedData.pagination.hasNext}
                  onClick={() => {}}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <History className="h-5 w-5 text-gray-600" />
                  Historial de Bloqueos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HistoryPanel settlementId={selectedHistoryId} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Average Blocked Days Info */}
        {stats && stats.avgBlockedDays > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
            <Clock className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-blue-800">
              <span className="font-medium">Promedio de días bloqueado:</span> {stats.avgBlockedDays.toFixed(1)} días
            </p>
          </div>
        )}
      </div>

      {/* Unblock Modal */}
      <UnblockModal
        open={unblockModalOpen}
        onClose={() => setUnlockModalOpen(false)}
        settlement={unblockSettlement}
        onConfirm={handleUnblock}
        isUnblocking={unblockMutation.isPending}
      />

      {/* Document Checklist Dialog */}
      <DocumentChecklistDialog
        open={docsDialogOpen}
        onClose={() => {
          setDocsDialogOpen(false);
          setDocsSettlement(null);
        }}
        settlement={docsSettlement}
      />

      {/* Process All Confirmation */}
      <AlertDialog open={processAllOpen} onOpenChange={setProcessAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Procesar todos los pagos?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto verificará el estado de documentos de todos los viajes con liquidación pendiente
              y actualizará el estado de bloqueo según corresponda. Los cambios se registrarán en el historial de auditoría.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleProcessAll}
              disabled={processAllMutation.isPending}
              className="bg-[#1B3F66] hover:bg-[#1B3F66]/90 text-white"
            >
              {processAllMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Procesar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
