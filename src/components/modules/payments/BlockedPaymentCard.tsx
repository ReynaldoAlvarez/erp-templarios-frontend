'use client';

import {
  Lock,
  AlertTriangle,
  FileText,
  Clock,
  Truck,
  User,
  Unlock,
  History,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BlockedSettlement } from '@/types/api';

interface BlockedPaymentCardProps {
  settlement: BlockedSettlement;
  onViewDocuments?: (settlementId: string, tripId: string) => void;
  onUnblock?: (settlement: BlockedSettlement) => void;
  onViewHistory?: (settlementId: string) => void;
}

function getBlockedDaysColor(days: number): string {
  if (days > 5) return 'text-red-600';
  if (days > 3) return 'text-yellow-600';
  return 'text-green-600';
}

function getBlockedDaysBgColor(days: number): string {
  if (days > 5) return 'bg-red-50 border-red-200';
  if (days > 3) return 'bg-yellow-50 border-yellow-200';
  return 'bg-green-50 border-green-200';
}

export function BlockedPaymentCard({ settlement, onViewDocuments, onUnblock, onViewHistory }: BlockedPaymentCardProps) {
  const { id, netPayment, status, isPaymentBlocked, documentsComplete, blockedDays, missingDocuments, trip, createdAt } = settlement;
  const driverName = trip?.driver?.employee
    ? `${trip.driver.employee.firstName} ${trip.driver.employee.lastName}`
    : 'Desconocido';
  const truckPlate = trip?.truck?.plateNumber || 'N/A';
  const isSupportTruck = trip?.truck?.isSupportTruck ?? false;
  const blNumber = trip?.billOfLading?.blNumber || 'N/A';
  const micDta = trip?.micDta || 'N/A';
  const shortId = id.length > 8 ? `${id.slice(0, 8)}...` : id;

  const formattedAmount = new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  }).format(netPayment);

  return (
    <Card className="border border-gray-200 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {isPaymentBlocked ? (
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <Lock className="h-4 w-4 text-red-600" />
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <Unlock className="h-4 w-4 text-green-600" />
              </div>
            )}
            <div>
              <CardTitle className="text-sm font-semibold text-gray-900">{shortId}</CardTitle>
              <p className="text-xs text-gray-500">{status}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              className={`text-[10px] px-2 py-0.5 ${
                isPaymentBlocked
                  ? 'bg-red-100 text-red-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {isPaymentBlocked ? 'BLOQUEADO' : 'COMPLETO'}
            </Badge>
            <Badge variant="outline" className={getBlockedDaysBgColor(blockedDays)}>
              <Clock className="h-3 w-3 mr-0.5 inline" />
              <span className={getBlockedDaysColor(blockedDays)}>{blockedDays}d</span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Trip Info */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-gray-600">
            <FileText className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="font-medium">MIC/DTA:</span>
            <span className="text-gray-900 font-mono">{micDta}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <span className="font-medium">BL:</span>
            <span className="text-gray-900 font-mono">{blNumber}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <User className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="font-medium">Conductor:</span>
            <span className="text-gray-900">{driverName}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <Truck className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="font-medium">Camión:</span>
            <span className="text-gray-900 font-mono">{truckPlate}</span>
            {isSupportTruck && (
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-[10px] px-1.5 py-0">
                Soporte
              </Badge>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
          <span className="text-xs font-medium text-gray-600">Pago Neto</span>
          <span className="text-sm font-bold text-gray-900">{formattedAmount}</span>
        </div>

        {/* Missing Documents */}
        {missingDocuments && missingDocuments.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-600 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Documentos Faltantes ({missingDocuments.length})
            </p>
            <div className="max-h-24 overflow-y-auto space-y-1">
              {missingDocuments.map((doc) => (
                <div
                  key={`${settlement.id}-${doc.code}`}
                  className="flex items-center justify-between px-2 py-1 bg-yellow-50 border border-yellow-100 rounded text-xs"
                >
                  <span className="font-mono text-yellow-800">{doc.code}</span>
                  <Badge
                    className={`text-[9px] px-1.5 py-0 ${
                      doc.status === 'RECEIVED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {doc.status === 'RECEIVED' ? 'RECIBIDO' : 'PENDIENTE'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-8 bg-[#1B3F66] hover:bg-[#1B3F66]/90 text-white border-[#1B3F66]"
            onClick={() => onViewDocuments?.(id, trip.id)}
          >
            <FileText className="h-3.5 w-3.5 mr-1" />
            Ver Documentos
          </Button>
          {isPaymentBlocked && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs h-8 text-green-700 border-green-300 hover:bg-green-50"
              onClick={() => onUnblock?.(settlement)}
            >
              <Unlock className="h-3.5 w-3.5 mr-1" />
              Desbloquear
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 text-gray-600 border-gray-300 hover:bg-gray-50"
            onClick={() => onViewHistory?.(id)}
          >
            <History className="h-3.5 w-3.5 mr-1" />
            Historial
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
