'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  FileText,
  Route,
  Table2,
  Lock,
  AlertTriangle,
  Zap,
  BarChart3,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  ShieldAlert,
  ArrowRight,
  FileCheck2,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useSprint5Dashboard } from '@/hooks/use-queries';
import { useQueryClient } from '@tanstack/react-query';

// ==========================================
// Date Range Helpers (same pattern as main dashboard)
// ==========================================

const dateRangeOptions = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Esta Semana' },
  { value: 'month', label: 'Este Mes' },
  { value: 'quarter', label: 'Este Trimestre' },
  { value: 'year', label: 'Este Año' },
];

function getDateRange(range: string): { startDate: string; endDate: string } {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (range) {
    case 'today':
      return {
        startDate: startOfDay.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
      };
    case 'week': {
      const dayOfWeek = startOfDay.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(startOfDay);
      monday.setDate(startOfDay.getDate() + diffToMonday);
      return {
        startDate: monday.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
      };
    }
    case 'month':
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
      };
    case 'quarter': {
      const quarter = Math.floor(now.getMonth() / 3);
      return {
        startDate: new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
      };
    }
    case 'year':
      return {
        startDate: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
      };
    default:
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
      };
  }
}

// ==========================================
// Skeleton Card
// ==========================================

function CardSkeleton() {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-4 w-36" />
      </CardContent>
    </Card>
  );
}

function WideCardSkeleton() {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// Stat Card Component
// ==========================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg?: string;
  iconColor?: string;
}

function StatCard({ title, value, subtitle, icon: Icon, iconBg = 'bg-[#1B3F66]/10', iconColor = 'text-[#1B3F66]' }: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className={`h-8 w-8 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

// ==========================================
// Progress Card Component
// ==========================================

interface ProgressCardProps {
  title: string;
  value: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  details?: Array<{ label: string; value: number; color?: string }>;
}

function ProgressCard({ title, value, label, icon: Icon, color = '#1B3F66', details }: ProgressCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className="h-8 w-8 rounded-lg bg-[#1B3F66]/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-[#1B3F66]" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value.toFixed(1)}%</div>
        <Progress value={value} className="mt-2 h-2" />
        <p className="text-xs text-gray-500 mt-2">{label}</p>
        {details && details.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {details.map((d, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                <span className={`inline-block w-2 h-2 rounded-full mr-1.5`} style={{ backgroundColor: d.color || color }} />
                {d.label}: {d.value}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==========================================
// Main Page Component
// ==========================================

export default function Sprint5DashboardPage() {
  const [dateRange, setDateRange] = useState('month');
  const queryClient = useQueryClient();

  const dateParams = useMemo(() => getDateRange(dateRange), [dateRange]);
  const { data, isLoading, isError, refetch, isRefetching } = useSprint5Dashboard(dateParams);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleDateRangeChange = useCallback((value: string) => {
    setDateRange(value);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B3F66] to-[#2D6A9F] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8" />
                <div>
                  <h1 className="text-2xl font-bold">Dashboard Sprint 5</h1>
                  <p className="text-sm text-blue-200">
                    Vista consolidada de operaciones automatizadas
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={dateRange} onValueChange={handleDateRangeChange}>
                <SelectTrigger className="w-[160px] bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateRangeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={handleRefresh}
                disabled={isRefetching}
              >
                <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error State */}
        {isError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-3 py-6">
              <XCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-700">Error al cargar los datos del dashboard. Intente nuevamente.</p>
              <Button variant="outline" size="sm" onClick={handleRefresh} className="ml-auto">
                Reintentar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <WideCardSkeleton key={i} />)}
            </div>
          </>
        )}

        {/* Data Display */}
        {data && !isLoading && (
          <>
            {/* Row 1: KPI Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Tipos de Documento"
                value={data.documentTypes.total}
                subtitle={`${data.documentTypes.active} activos, ${data.documentTypes.inactive} inactivos`}
                icon={FileText}
              />
              <StatCard
                title="Tramos Activos"
                value={data.tramos.total}
                subtitle={`${data.tramos.active} tramos registrados`}
                icon={Route}
              />
              <StatCard
                title="Reportes de Viajes"
                value={data.tripReports.total}
                subtitle={`${data.tripReports.withCompleteDocs} con docs completos`}
                icon={Table2}
              />
              <StatCard
                title="Pagos Bloqueados"
                value={data.paymentBlocks.blocked}
                subtitle={`$${data.paymentBlocks.totalRetentionAmount.toFixed(2)} USD retenidos`}
                icon={Lock}
                iconBg="bg-red-50"
                iconColor="text-red-600"
              />
            </div>

            {/* Row 2: Progress Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ProgressCard
                title="Completitud de Documentos"
                value={data.documents.completionRate}
                label={`${data.documents.verified} verificados de ${data.documents.verified + data.documents.pending} totales`}
                icon={FileCheck2}
                details={[
                  { label: 'Verificados', value: data.documents.verified, color: '#34D399' },
                  { label: 'Pendientes', value: data.documents.pending, color: '#FCD34D' },
                  ...(data.documents.byStatus?.REJECTED ? [{ label: 'Rechazados', value: data.documents.byStatus.REJECTED, color: '#F87171' }] : []),
                ]}
              />
              <ProgressCard
                title="Docs por Tipo"
                value={data.documents.completionRate}
                label="Distribucion por tipo de documento"
                icon={BarChart3}
                details={data.documents.byType?.map((bt) => ({
                  label: bt.name || bt.type,
                  value: bt.count,
                })).slice(0, 5)}
              />
              <ProgressCard
                title="Tasa de Automatizacion"
                value={data.automation.automationRate}
                label={`${data.automation.documentsAutoGenerated} auto vs ${data.automation.documentsManuallyCreated} manuales`}
                icon={Zap}
                color="#F59E0B"
                details={[
                  { label: 'Auto-generados', value: data.automation.documentsAutoGenerated, color: '#F59E0B' },
                  { label: 'Manuales', value: data.automation.documentsManuallyCreated, color: '#6B7280' },
                ]}
              />
            </div>

            {/* Row 3: Trip Reports + Sanctions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Trip Reports Card */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <Table2 className="h-5 w-5 text-[#1B3F66]" />
                    <CardTitle className="text-base font-semibold text-gray-900">Reportes de Viajes</CardTitle>
                  </div>
                  <Link href="/dashboard/reportes-viajes">
                    <Button variant="ghost" size="sm" className="text-[#1B3F66] hover:text-[#2D6A9F]">
                      Ver todos <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-700">{data.tripReports.withCompleteDocs}</p>
                      <p className="text-xs text-green-600 mt-1">Docs Completos</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-700">{data.tripReports.withBlockedPayments}</p>
                      <p className="text-xs text-red-600 mt-1">Pagos Bloqueados</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Estado de Pagos</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-16">Pendiente</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-yellow-400 h-full rounded-full transition-all"
                          style={{
                            width: data.tripReports.total > 0
                              ? `${(data.tripReports.byPaymentStatus.pending / data.tripReports.total) * 100}%`
                              : '0%',
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-8 text-right">
                        {data.tripReports.byPaymentStatus.pending}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-16">Parcial</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-blue-400 h-full rounded-full transition-all"
                          style={{
                            width: data.tripReports.total > 0
                              ? `${(data.tripReports.byPaymentStatus.partial / data.tripReports.total) * 100}%`
                              : '0%',
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-8 text-right">
                        {data.tripReports.byPaymentStatus.partial}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-16">Pagado</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-green-500 h-full rounded-full transition-all"
                          style={{
                            width: data.tripReports.total > 0
                              ? `${(data.tripReports.byPaymentStatus.paid / data.tripReports.total) * 100}%`
                              : '0%',
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-8 text-right">
                        {data.tripReports.byPaymentStatus.paid}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 text-xs text-gray-500">
                    <span>Tasa docs: <strong className="text-gray-700">{data.tripReports.docsCompletionRate.toFixed(1)}%</strong></span>
                    <span>Tasa bloqueo: <strong className="text-red-600">{data.tripReports.paymentBlockRate.toFixed(1)}%</strong></span>
                  </div>
                </CardContent>
              </Card>

              {/* Sanctions Card */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <CardTitle className="text-base font-semibold text-gray-900">Sanciones</CardTitle>
                  </div>
                  <Link href="/dashboard/sanciones">
                    <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-600">
                      Ver todas <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-700">{data.sanctions.byType?.FINE || 0}</p>
                      <p className="text-xs text-orange-600 mt-1">Multas</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-700">{data.sanctions.byType?.SUSPENSION || 0}</p>
                      <p className="text-xs text-red-600 mt-1">Suspensiones</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-700">{data.sanctions.byType?.WARNING || 0}</p>
                      <p className="text-xs text-yellow-600 mt-1">Amonestaciones</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Por Razon</p>
                    <div className="space-y-1.5">
                      {data.sanctions.byReason && Object.entries(data.sanctions.byReason).map(([reason, count]) => {
                        const reasonLabels: Record<string, string> = {
                          DOCUMENT_DELAY: 'Retraso Docs',
                          REPEATED_OFFENSE: 'Reincidencia',
                          SAFETY_VIOLATION: 'Seguridad',
                          OTHER: 'Otro',
                        };
                        const maxCount = Math.max(...Object.values(data.sanctions.byReason), 1);
                        return (
                          <div key={reason} className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-24 truncate">{reasonLabels[reason] || reason}</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-orange-400 h-full rounded-full transition-all"
                                style={{ width: `${(count / maxCount) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-gray-700 w-6 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t">
                    <span className="text-gray-500">
                      Total: <strong className="text-gray-700">{data.sanctions.total}</strong> ({data.sanctions.active} activas)
                    </span>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        <Zap className="h-3 w-3 mr-1" /> Auto: {data.sanctions.automatic} ({data.sanctions.automaticRate.toFixed(0)}%)
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700">
                        Manual: {data.sanctions.manual}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Row 4: Payment Blocks + Tramos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Payment Blocks Card */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-red-500" />
                    <CardTitle className="text-base font-semibold text-gray-900">Bloqueo de Pagos</CardTitle>
                  </div>
                  <Link href="/dashboard/bloqueo-pagos">
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                      Ver detalles <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <Lock className="h-5 w-5 text-red-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-red-700">{data.paymentBlocks.blocked}</p>
                      <p className="text-xs text-red-600 mt-1">Bloqueados</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-green-700">{data.paymentBlocks.unblocked}</p>
                      <p className="text-xs text-green-600 mt-1">Liberados</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <DollarSign className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-blue-700">${data.paymentBlocks.totalRetentionAmount.toFixed(0)}</p>
                      <p className="text-xs text-blue-600 mt-1">USD Retenidos</p>
                    </div>
                  </div>

                  {data.paymentBlocks.blocked > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                        <p className="text-xs text-amber-700">
                          Hay <strong>{data.paymentBlocks.blocked}</strong> liquidaciones con pagos bloqueados por documentacion incompleta.
                          El monto total retenido es de <strong>${data.paymentBlocks.totalRetentionAmount.toFixed(2)} USD</strong>.
                        </p>
                      </div>
                    </div>
                  )}

                  {data.paymentBlocks.blocked === 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <p className="text-xs text-green-700">
                          Todos los pagos estan desbloqueados. No hay retenciones activas.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tramos Card */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <Route className="h-5 w-5 text-[#1B3F66]" />
                    <CardTitle className="text-base font-semibold text-gray-900">Tramos (Rutas)</CardTitle>
                  </div>
                  <Link href="/dashboard/tramos">
                    <Button variant="ghost" size="sm" className="text-[#1B3F66] hover:text-[#2D6A9F]">
                      Gestionar <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center p-3 bg-[#1B3F66]/5 rounded-lg flex-1">
                      <p className="text-2xl font-bold text-[#1B3F66]">{data.tramos.total}</p>
                      <p className="text-xs text-gray-500 mt-1">Total Tramos</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg flex-1">
                      <p className="text-2xl font-bold text-green-700">{data.tramos.active}</p>
                      <p className="text-xs text-gray-500 mt-1">Activos</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {data.tramos.topOrigins && data.tramos.topOrigins.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Top Origenes</p>
                        <div className="flex flex-wrap gap-2">
                          {data.tramos.topOrigins.map((o, i) => (
                            <Badge key={i} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              <Route className="h-3 w-3 mr-1" />
                              {o.origin} ({o.count})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {data.tramos.topDestinations && data.tramos.topDestinations.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Top Destinos</p>
                        <div className="flex flex-wrap gap-2">
                          {data.tramos.topDestinations.map((d, i) => (
                            <Badge key={i} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <Route className="h-3 w-3 mr-1" />
                              {d.destination} ({d.count})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Row 5: Automation Summary */}
            <Card className="hover:shadow-md transition-shadow bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-600" />
                  <CardTitle className="text-base font-semibold text-gray-900">Resumen de Automatizacion</CardTitle>
                </div>
                <Badge className="bg-amber-500 hover:bg-amber-600">
                  Sprint 5
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="relative inline-flex items-center justify-center w-20 h-20">
                      <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845a15.9155 15.9155 0 010 31.831 15.9155 15.9155 0 010-31.831"
                          fill="none"
                          stroke="#E5E7EB"
                          strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845a15.9155 15.9155 0 010 31.831 15.9155 15.9155 0 010-31.831"
                          fill="none"
                          stroke="#F59E0B"
                          strokeWidth="3"
                          strokeDasharray={`${data.automation.automationRate}, 100`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute text-lg font-bold text-gray-900">{data.automation.automationRate.toFixed(0)}%</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700 mt-2">Tasa de Automatizacion</p>
                  </div>
                  <div className="space-y-3 sm:col-span-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                        <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                          <Zap className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-gray-900">{data.automation.documentsAutoGenerated}</p>
                          <p className="text-xs text-gray-500">Auto-generados</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-gray-900">{data.automation.documentsManuallyCreated}</p>
                          <p className="text-xs text-gray-500">Creados manualmente</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                      <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Documentos completos:{' '}
                          <strong className="text-green-700">{data.documents.verified}</strong> de{' '}
                          <strong>{data.documents.verified + data.documents.pending}</strong>
                        </p>
                        <p className="text-xs text-gray-500">
                          Completitud: {data.documents.completionRate.toFixed(1)}% | Sanciones automaticas: {data.sanctions.automaticRate.toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
