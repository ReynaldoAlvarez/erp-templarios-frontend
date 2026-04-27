'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  AlertTriangle,
  Zap,
  Shield,
  Info,
  CheckCircle2,
  XCircle,
  Ban,
} from 'lucide-react';
import type {
  DelayedTrip,
  GeneratedSanctionPreview,
  GenerateAutomaticSanctionsResult,
  SanctionType,
  SanctionReason,
} from '@/types/api';

interface SanctionGenerationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  delayedTrips: DelayedTrip[];
  isGenerating: boolean;
  onGenerate: (tripIds: string[]) => void;
  preview?: GenerateAutomaticSanctionsResult | null;
  isPreviewing?: boolean;
}

const sanctionReasonConfig: Record<SanctionReason, { label: string; className: string }> = {
  DOCUMENT_DELAY: { label: 'Retraso Documentario', className: 'bg-orange-100 text-orange-800' },
  REPEATED_OFFENSE: { label: 'Reincidencia', className: 'bg-red-100 text-red-800' },
  SAFETY_VIOLATION: { label: 'Violacion de Seguridad', className: 'bg-purple-100 text-purple-800' },
  OTHER: { label: 'Otro', className: 'bg-gray-100 text-gray-800' },
};

const suggestedActionConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  FINE: { label: 'Multa', icon: AlertTriangle, className: 'text-orange-600' },
  SUSPENSION: { label: 'Suspension', icon: Ban, className: 'text-red-600' },
  WARNING: { label: 'Amonestacion', icon: Info, className: 'text-yellow-600' },
};

export default function SanctionGenerationModal({
  open,
  onOpenChange,
  delayedTrips,
  isGenerating,
  onGenerate,
  preview,
  isPreviewing,
}: SanctionGenerationModalProps) {
  const [selectedTripIds, setSelectedTripIds] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<'select' | 'preview' | 'result'>('select');

  const handleToggleTrip = (tripId: string) => {
    setSelectedTripIds((prev) => {
      const next = new Set(prev);
      if (next.has(tripId)) {
        next.delete(tripId);
      } else {
        next.add(tripId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedTripIds.size === delayedTrips.length) {
      setSelectedTripIds(new Set());
    } else {
      setSelectedTripIds(new Set(delayedTrips.map((t) => t.tripId)));
    }
  };

  const handlePreview = () => {
    setStep('preview');
    onGenerate(Array.from(selectedTripIds));
  };

  const handleConfirmGenerate = () => {
    onGenerate(Array.from(selectedTripIds));
  };

  const handleClose = () => {
    setStep('select');
    setSelectedTripIds(new Set());
    onOpenChange(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'USD' }).format(value);
  };

  const getDaysColor = (days: number) => {
    if (days <= 5) return 'text-yellow-600';
    if (days <= 10) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            Generacion Automatica de Sanciones
          </DialogTitle>
          <DialogDescription>
            {step === 'select' &&
              'Selecciona los viajes con retraso para generar sanciones automaticamente.'}
            {step === 'preview' &&
              'Revisa las sanciones que se generaran antes de confirmar.'}
            {step === 'result' && 'Resultado de la generacion de sanciones.'}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicators */}
        <div className="flex items-center gap-2 mb-2">
          {['select', 'preview', 'result'].map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s
                    ? 'bg-[#1B3F66] text-white'
                    : ['select', 'preview', 'result'].indexOf(step) > i
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {['select', 'preview', 'result'].indexOf(step) > i ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 2 && <div className="w-8 h-0.5 bg-gray-300" />}
            </div>
          ))}
        </div>

        {/* Step 1: Select delayed trips */}
        {step === 'select' && (
          <>
            {delayedTrips.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-2" />
                <p>No hay viajes con retraso pendientes de sancion.</p>
              </div>
            ) : (
              <>
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Se encontraron <strong>{delayedTrips.length}</strong> viajes con retraso.
                    Selecciona los viajes para los que deseas generar sanciones automaticas.
                  </AlertDescription>
                </Alert>

                <ScrollArea className="h-[350px] border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox
                            checked={
                              delayedTrips.length > 0 && selectedTripIds.size === delayedTrips.length
                            }
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>MIC/DTA</TableHead>
                        <TableHead>Conductor</TableHead>
                        <TableHead className="text-center">Dias Retraso</TableHead>
                        <TableHead>Multa Sugerida</TableHead>
                        <TableHead>Accion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {delayedTrips.map((trip) => (
                        <TableRow
                          key={trip.tripId}
                          className={`cursor-pointer ${selectedTripIds.has(trip.tripId) ? 'bg-blue-50' : ''}`}
                          onClick={() => handleToggleTrip(trip.tripId)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedTripIds.has(trip.tripId)}
                              onCheckedChange={() => handleToggleTrip(trip.tripId)}
                            />
                          </TableCell>
                          <TableCell className="font-mono font-medium">{trip.micDta}</TableCell>
                          <TableCell>{trip.driverName}</TableCell>
                          <TableCell className="text-center">
                            <span className={`font-bold ${getDaysColor(trip.daysDelayed)}`}>
                              {trip.daysDelayed}
                            </span>
                          </TableCell>
                          <TableCell>{formatCurrency(trip.suggestedFine)}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                suggestedActionConfig[trip.suggestedAction]?.className || ''
                              }
                            >
                              {suggestedActionConfig[trip.suggestedAction]?.label || trip.suggestedAction}
                            </Badge>
                            {trip.existingOffenses > 0 && (
                              <Badge variant="outline" className="ml-1 text-xs">
                                {trip.existingOffenses} ofensas previas
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>

                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    {selectedTripIds.size} de {delayedTrips.length} viajes seleccionados
                  </p>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handlePreview}
                    disabled={selectedTripIds.size === 0 || isPreviewing}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {isPreviewing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Shield className="mr-2 h-4 w-4" />
                    Previsualizar Sanciones ({selectedTripIds.size})
                  </Button>
                </DialogFooter>
              </>
            )}
          </>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && preview && (
          <>
            <Alert className="mb-4 border-orange-200 bg-orange-50">
              <Shield className="h-4 w-4 text-orange-600" />
              <AlertDescription>
                Se generaran <strong>{preview.totalToGenerate}</strong> sanciones por un monto total de{' '}
                <strong>{formatCurrency(preview.totalAmount)}</strong>.
                Revisa los detalles antes de confirmar.
              </AlertDescription>
            </Alert>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="border rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-[#1B3F66]">{preview.totalToGenerate}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-orange-600">{preview.totalFines}</p>
                <p className="text-xs text-gray-500">Multas</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-red-600">{preview.totalSuspensions}</p>
                <p className="text-xs text-gray-500">Suspensiones</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-yellow-600">{preview.totalWarnings}</p>
                <p className="text-xs text-gray-500">Amonestaciones</p>
              </div>
            </div>

            {/* Previews Table */}
            <ScrollArea className="h-[250px] border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>MIC/DTA</TableHead>
                    <TableHead>Conductor</TableHead>
                    <TableHead>Razon</TableHead>
                    <TableHead>Dias</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.previews.map((p, index) => (
                    <TableRow key={`${p.tripId}-${index}`}>
                      <TableCell className="font-mono text-sm">{p.micDta}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{p.driverName}</p>
                          {p.existingOffenses > 0 && (
                            <p className="text-xs text-red-500">
                              Reincidente ({p.existingOffenses} ofensas previas)
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            sanctionReasonConfig[p.sanctionReason]?.className || ''
                          }
                        >
                          {sanctionReasonConfig[p.sanctionReason]?.label || p.sanctionReason}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold">{p.daysDelayed}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            p.type === 'SUSPENSION'
                              ? 'bg-red-100 text-red-800'
                              : p.type === 'FINE'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {p.type === 'SUSPENSION'
                            ? 'Suspension'
                            : p.type === 'FINE'
                              ? 'Multa'
                              : 'Amonestacion'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(p.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('select')}>
                Volver
              </Button>
              <Button
                onClick={handleConfirmGenerate}
                disabled={isGenerating}
                className="bg-red-600 hover:bg-red-700"
              >
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <XCircle className="mr-2 h-4 w-4" />
                Confirmar Generacion ({preview.totalToGenerate})
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 2 Loading State */}
        {step === 'preview' && isPreviewing && !preview && (
          <div className="py-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#1B3F66]" />
            <p className="mt-2 text-gray-500">Calculando sanciones a generar...</p>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 'result' && (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-green-800">
              Sanciones generadas exitosamente
            </h3>
            <p className="text-gray-500 mt-1">
              Se han generado las sanciones automaticas para los viajes seleccionados.
            </p>
            <DialogFooter className="mt-6">
              <Button onClick={handleClose} className="bg-[#1B3F66] hover:bg-[#0F2A47]">
                Cerrar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
