'use client';

import { useState } from 'react';
import {
  FileCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { DocumentChecklistResponse, DocumentChecklistItem } from '@/types/api';

// Status configuration
const statusConfig = {
  PENDING: {
    label: 'Pendiente',
    color: 'bg-yellow-100 text-yellow-800',
    variant: 'outline' as const,
    icon: Clock,
  },
  RECEIVED: {
    label: 'Recibido',
    color: 'bg-blue-100 text-blue-800',
    variant: 'outline' as const,
    icon: FileCheck,
  },
  VERIFIED: {
    label: 'Verificado',
    color: 'bg-green-100 text-green-800',
    variant: 'outline' as const,
    icon: CheckCircle2,
  },
} as const;

interface DocumentChecklistProps {
  data?: DocumentChecklistResponse;
  isLoading?: boolean;
  onCreateDocuments?: () => void;
  isCreating?: boolean;
}

export function DocumentChecklist({ data, isLoading, onCreateDocuments, isCreating }: DocumentChecklistProps) {
  const [verifying, setVerifying] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Checklist de Documentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 flex-1" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { checklist, summary, isSupportTruck, truckPlate } = data;
  const completionPercent = summary.total > 0 ? Math.round((summary.verified / summary.total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Support Truck Indicator */}
      {isSupportTruck && (
        <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
          <Truck className="h-4 w-4 text-orange-600" />
          <span className="text-sm font-medium text-orange-800">
            Camión de soporte{truckPlate ? ` - ${truckPlate}` : ''}
          </span>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Checklist de Documentos</CardTitle>
            {onCreateDocuments && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={onCreateDocuments}
                    disabled={isCreating || summary.missing === 0}
                    className="bg-[#1B3F66] hover:bg-[#1B3F66]/90 text-white"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {isCreating ? 'Generando...' : 'Generar Faltantes'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {summary.missing > 0
                    ? `${summary.missing} documento(s) pendiente(s) por generar`
                    : 'Todos los documentos ya están generados'}
                </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progreso</span>
              <span className="font-semibold text-gray-900">{completionPercent}%</span>
            </div>
            <Progress value={completionPercent} className="h-2" />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{summary.verified} verificados</span>
              <span>de {summary.total} documentos</span>
            </div>
          </div>

          {/* Summary Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs font-medium">
              ✓ {summary.verified} Verificados
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-medium">
              ◉ {summary.received} Recibidos
            </Badge>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs font-medium">
              ○ {summary.pending} Pendientes
            </Badge>
          </div>

          {/* Checklist Items */}
          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
            {checklist.map((item: DocumentChecklistItem) => {
              const status = statusConfig[item.status];
              const StatusIcon = status.icon;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  {/* Order Number */}
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-medium flex items-center justify-center">
                    {item.order}
                  </span>

                  {/* Code */}
                  <span className="flex-shrink-0 w-20 text-xs font-mono text-gray-500 truncate" title={item.code}>
                    {item.code}
                  </span>

                  {/* Name */}
                  <span className="flex-1 text-sm text-gray-700 truncate" title={item.name}>
                    {item.name}
                  </span>

                  {/* Required Badge */}
                  {item.isRequired && (
                    <Badge variant="outline" className="flex-shrink-0 bg-red-50 text-red-600 border-red-200 text-[10px] px-1.5 py-0">
                      Req.
                    </Badge>
                  )}

                  {/* Status Badge */}
                  <Badge variant={status.variant} className={`flex-shrink-0 text-[10px] px-2 py-0.5 ${status.color}`}>
                    <StatusIcon className="h-3 w-3 mr-0.5 inline" />
                    {status.label}
                  </Badge>

                  {/* Verified Info */}
                  {item.status === 'VERIFIED' && item.verifiedByName && (
                    <span className="flex-shrink-0 text-[10px] text-gray-500 max-w-[100px] truncate" title={item.verifiedByName}>
                      {item.verifiedByName}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {checklist.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">No hay documentos requeridos para este viaje</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
