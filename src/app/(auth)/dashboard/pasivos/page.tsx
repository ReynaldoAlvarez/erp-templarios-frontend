'use client';

import { useState, useMemo } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import {
  useLiabilities,
  useLiabilityTypes,
  useLiabilityStats,
  useOverdueLiabilities,
  useCreateLiability,
  useUpdateLiability,
  useRegisterLiabilityPayment,
} from '@/hooks/use-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plus,
  Search,
  CreditCard,
  DollarSign,
  AlertTriangle,
  Calendar,
  Edit,
  Loader2,
  Banknote,
} from 'lucide-react';
import type { Liability, LiabilityType, LiabilityStatus, CreateLiabilityInput, UpdateLiabilityInput } from '@/types/api';

const statusConfig: Record<LiabilityStatus, { label: string; className: string }> = {
  ACTIVE: { label: 'Activo', className: 'bg-green-100 text-green-800' },
  PAID: { label: 'Pagado', className: 'bg-blue-100 text-blue-800' },
  DEFAULTED: { label: 'En mora', className: 'bg-red-100 text-red-800' },
  RESTRUCTURED: { label: 'Restructurado', className: 'bg-yellow-100 text-yellow-800' },
};

const typeLabels: Record<LiabilityType, string> = {
  LOAN: 'Préstamo',
  MORTGAGE: 'Hipoteca',
  CREDIT: 'Crédito',
  OTHER: 'Otro',
};

export default function PasivosPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedLiability, setSelectedLiability] = useState<Liability | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const params = useMemo(() => ({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    type: typeFilter !== 'all' ? typeFilter as LiabilityType : undefined,
    status: statusFilter !== 'all' ? statusFilter as LiabilityStatus : undefined,
  }), [page, debouncedSearch, typeFilter, statusFilter]);

  const { data: liabilitiesData, isLoading } = useLiabilities(params);
  const { data: types } = useLiabilityTypes();
  const { data: stats } = useLiabilityStats();
  const { data: overdue } = useOverdueLiabilities();

  const createMutation = useCreateLiability();
  const updateMutation = useUpdateLiability();
  const paymentMutation = useRegisterLiabilityPayment();

  const handleOpenDialog = (liability?: Liability) => {
    setSelectedLiability(liability || null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedLiability(null);
  };

  const handleOpenPaymentDialog = (liability: Liability) => {
    setSelectedLiability(liability);
    setIsPaymentDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: CreateLiabilityInput | UpdateLiabilityInput = {
      name: formData.get('name') as string,
      type: formData.get('type') as LiabilityType,
      description: formData.get('description') as string || undefined,
      lender: formData.get('lender') as string,
      principalAmount: parseFloat(formData.get('principalAmount') as string),
      interestRate: parseFloat(formData.get('interestRate') as string),
      interestType: formData.get('interestType') as string || undefined,
      startDate: formData.get('startDate') as string,
      dueDate: formData.get('dueDate') as string,
      monthlyPayment: parseFloat(formData.get('monthlyPayment') as string) || undefined,
      totalPayments: parseInt(formData.get('totalPayments') as string) || undefined,
      collateral: formData.get('collateral') as string || undefined,
      notes: formData.get('notes') as string || undefined,
    };

    if (selectedLiability) {
      updateMutation.mutate({ id: selectedLiability.id, data }, { onSuccess: handleCloseDialog });
    } else {
      createMutation.mutate(data as CreateLiabilityInput, { onSuccess: handleCloseDialog });
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLiability) return;

    const formData = new FormData(e.currentTarget);
    const data = {
      liabilityId: selectedLiability.id,
      amount: parseFloat(formData.get('amount') as string),
      paymentDate: formData.get('paymentDate') as string,
      principalAmount: parseFloat(formData.get('principalAmount') as string) || undefined,
      interestAmount: parseFloat(formData.get('interestAmount') as string) || undefined,
      notes: formData.get('notes') as string || undefined,
    };

    paymentMutation.mutate(data, { onSuccess: () => {
      setIsPaymentDialogOpen(false);
      setSelectedLiability(null);
    }});
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-BO');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3F66]">Pasivos</h1>
          <p className="text-gray-600">Gestión de deudas y obligaciones financieras</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-[#1B3F66] hover:bg-[#0F2A47]">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Pasivo
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Pasivos</CardTitle>
              <CreditCard className="h-4 w-4 text-[#1B3F66]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Deuda Total</CardTitle>
              <DollarSign className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalDebt)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pagos Mensuales</CardTitle>
              <Banknote className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalMonthlyPayments)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">En Mora</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overdue?.length || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por nombre o prestamista..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {types?.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(statusConfig).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Prestamista</TableHead>
              <TableHead>Principal</TableHead>
              <TableHead>Saldo Actual</TableHead>
              <TableHead>Cuota Mensual</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#1B3F66]" />
                </TableCell>
              </TableRow>
            ) : liabilitiesData?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  No se encontraron pasivos
                </TableCell>
              </TableRow>
            ) : (
              liabilitiesData?.data.map((liability) => (
                <TableRow key={liability.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{liability.name}</div>
                      {liability.description && (
                        <div className="text-sm text-gray-500">{liability.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{typeLabels[liability.type]}</TableCell>
                  <TableCell>{liability.lender}</TableCell>
                  <TableCell>{formatCurrency(liability.principalAmount)}</TableCell>
                  <TableCell>{formatCurrency(liability.currentBalance)}</TableCell>
                  <TableCell>{liability.monthlyPayment ? formatCurrency(liability.monthlyPayment) : '-'}</TableCell>
                  <TableCell>{formatDate(liability.dueDate)}</TableCell>
                  <TableCell>
                    <Badge className={statusConfig[liability.status].className}>
                      {statusConfig[liability.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(liability)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {liability.status === 'ACTIVE' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenPaymentDialog(liability)}
                          title="Registrar pago"
                        >
                          <DollarSign className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {liabilitiesData && liabilitiesData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando {((page - 1) * 10) + 1} - {Math.min(page * 10, liabilitiesData.pagination.total)} de {liabilitiesData.pagination.total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={!liabilitiesData.pagination.hasPrev}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={!liabilitiesData.pagination.hasNext}>
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedLiability ? 'Editar Pasivo' : 'Nuevo Pasivo'}</DialogTitle>
            <DialogDescription>
              {selectedLiability ? 'Modifica los datos del pasivo' : 'Ingresa los datos del nuevo pasivo'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input id="name" name="name" defaultValue={selectedLiability?.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select name="type" defaultValue={selectedLiability?.type || 'LOAN'}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="description">Descripción</Label>
                <Input id="description" name="description" defaultValue={selectedLiability?.description || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lender">Prestamista *</Label>
                <Input id="lender" name="lender" defaultValue={selectedLiability?.lender} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="principalAmount">Monto Principal (BOB) *</Label>
                <Input id="principalAmount" name="principalAmount" type="number" step="0.01" defaultValue={selectedLiability?.principalAmount} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interestRate">Tasa de Interés (%) *</Label>
                <Input id="interestRate" name="interestRate" type="number" step="0.01" defaultValue={selectedLiability?.interestRate} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyPayment">Cuota Mensual (BOB)</Label>
                <Input id="monthlyPayment" name="monthlyPayment" type="number" step="0.01" defaultValue={selectedLiability?.monthlyPayment || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha de Inicio *</Label>
                <Input id="startDate" name="startDate" type="date" defaultValue={selectedLiability?.startDate?.split('T')[0]} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Fecha de Vencimiento *</Label>
                <Input id="dueDate" name="dueDate" type="date" defaultValue={selectedLiability?.dueDate?.split('T')[0]} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalPayments">Total de Cuotas</Label>
                <Input id="totalPayments" name="totalPayments" type="number" defaultValue={selectedLiability?.totalPayments || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="collateral">Garantía</Label>
                <Input id="collateral" name="collateral" defaultValue={selectedLiability?.collateral || ''} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes">Notas</Label>
                <Input id="notes" name="notes" defaultValue={selectedLiability?.notes || ''} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
              <Button type="submit" className="bg-[#1B3F66] hover:bg-[#0F2A47]" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedLiability ? 'Guardar Cambios' : 'Crear Pasivo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              Registrar pago para: {selectedLiability?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto del Pago (BOB) *</Label>
              <Input id="amount" name="amount" type="number" step="0.01" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Fecha del Pago *</Label>
              <Input id="paymentDate" name="paymentDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="principalAmount">Monto Principal</Label>
                <Input id="principalAmount" name="principalAmount" type="number" step="0.01" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interestAmount">Monto Interés</Label>
                <Input id="interestAmount" name="interestAmount" type="number" step="0.01" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Input id="notes" name="notes" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={paymentMutation.isPending}>
                {paymentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar Pago
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
