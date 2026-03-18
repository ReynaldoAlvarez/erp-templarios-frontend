'use client';

import { useState, useMemo } from 'react';
import {
  useAssets,
  useAssetCategories,
  useAssetStats,
  useCreateAsset,
  useUpdateAsset,
  useDeactivateAsset,
  useActivateAsset,
} from '@/hooks/use-queries';
import { useDebounce } from '@/hooks/use-debounce';
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
  Building2,
  DollarSign,
  TrendingDown,
  BarChart3,
  Edit,
  Power,
  PowerOff,
  Loader2,
} from 'lucide-react';
import type { Asset, AssetCategory, AssetStatus, CreateAssetInput, UpdateAssetInput } from '@/types/api';

const statusConfig: Record<AssetStatus, { label: string; className: string }> = {
  ACTIVE: { label: 'Activo', className: 'bg-green-100 text-green-800' },
  DEPRECIATED: { label: 'Depreciado', className: 'bg-yellow-100 text-yellow-800' },
  SOLD: { label: 'Vendido', className: 'bg-blue-100 text-blue-800' },
  DISPOSED: { label: 'Dado de baja', className: 'bg-red-100 text-red-800' },
};

const categoryLabels: Record<AssetCategory, string> = {
  VEHICLE: 'Vehículos',
  EQUIPMENT: 'Equipos',
  FURNITURE: 'Mobiliario',
  REAL_ESTATE: 'Inmuebles',
  OTHER: 'Otros',
};

export default function ActivosPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const params = useMemo(() => ({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    category: categoryFilter !== 'all' ? categoryFilter as AssetCategory : undefined,
    status: statusFilter !== 'all' ? statusFilter as AssetStatus : undefined,
  }), [page, debouncedSearch, categoryFilter, statusFilter]);

  const { data: assetsData, isLoading } = useAssets(params);
  const { data: categories } = useAssetCategories();
  const { data: stats } = useAssetStats();

  const createMutation = useCreateAsset();
  const updateMutation = useUpdateAsset();
  const deactivateMutation = useDeactivateAsset();
  const activateMutation = useActivateAsset();

  const handleOpenDialog = (asset?: Asset) => {
    setEditingAsset(asset || null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAsset(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: CreateAssetInput | UpdateAssetInput = {
      name: formData.get('name') as string,
      category: formData.get('category') as AssetCategory,
      description: formData.get('description') as string || undefined,
      acquisitionDate: formData.get('acquisitionDate') as string,
      acquisitionCost: parseFloat(formData.get('acquisitionCost') as string),
      depreciationRate: parseFloat(formData.get('depreciationRate') as string) || 0,
      usefulLifeYears: parseInt(formData.get('usefulLifeYears') as string) || undefined,
      residualValue: parseFloat(formData.get('residualValue') as string) || undefined,
      location: formData.get('location') as string || undefined,
      responsiblePerson: formData.get('responsiblePerson') as string || undefined,
      invoiceNumber: formData.get('invoiceNumber') as string || undefined,
      supplier: formData.get('supplier') as string || undefined,
      notes: formData.get('notes') as string || undefined,
    };

    if (editingAsset) {
      updateMutation.mutate({ id: editingAsset.id, data }, { onSuccess: handleCloseDialog });
    } else {
      createMutation.mutate(data as CreateAssetInput, { onSuccess: handleCloseDialog });
    }
  };

  const handleToggleActive = (asset: Asset) => {
    if (asset.isActive) {
      deactivateMutation.mutate(asset.id);
    } else {
      activateMutation.mutate(asset.id);
    }
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
          <h1 className="text-2xl font-bold text-[#1B3F66]">Activos</h1>
          <p className="text-gray-600">Gestión de activos fijos de la empresa</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-[#1B3F66] hover:bg-[#0F2A47]">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Activo
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Activos</CardTitle>
              <Building2 className="h-4 w-4 text-[#1B3F66]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Depreciación Acumulada</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalDepreciation)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Valor Actual</CardTitle>
              <BarChart3 className="h-4 w-4 text-[#1B3F66]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalValue - stats.totalDepreciation)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por nombre o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
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
              <TableHead>Categoría</TableHead>
              <TableHead>Costo Adquisición</TableHead>
              <TableHead>Valor Actual</TableHead>
              <TableHead>Depreciación</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#1B3F66]" />
                </TableCell>
              </TableRow>
            ) : assetsData?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No se encontraron activos
                </TableCell>
              </TableRow>
            ) : (
              assetsData?.data.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{asset.name}</div>
                      {asset.description && (
                        <div className="text-sm text-gray-500">{asset.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{categoryLabels[asset.category]}</TableCell>
                  <TableCell>{formatCurrency(asset.acquisitionCost)}</TableCell>
                  <TableCell>{formatCurrency(asset.currentValue)}</TableCell>
                  <TableCell>{asset.depreciationRate}%</TableCell>
                  <TableCell>
                    <Badge className={statusConfig[asset.status].className}>
                      {statusConfig[asset.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(asset)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(asset)}
                        title={asset.isActive ? 'Desactivar' : 'Activar'}
                      >
                        {asset.isActive ? (
                          <PowerOff className="h-4 w-4 text-red-500" />
                        ) : (
                          <Power className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {assetsData && assetsData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando {((page - 1) * 10) + 1} - {Math.min(page * 10, assetsData.pagination.total)} de {assetsData.pagination.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={!assetsData.pagination.hasPrev}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={!assetsData.pagination.hasNext}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAsset ? 'Editar Activo' : 'Nuevo Activo'}</DialogTitle>
            <DialogDescription>
              {editingAsset ? 'Modifica los datos del activo' : 'Ingresa los datos del nuevo activo'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingAsset?.name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoría *</Label>
                <Select name="category" defaultValue={editingAsset?.category || 'EQUIPMENT'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  name="description"
                  defaultValue={editingAsset?.description || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acquisitionDate">Fecha de Adquisición *</Label>
                <Input
                  id="acquisitionDate"
                  name="acquisitionDate"
                  type="date"
                  defaultValue={editingAsset?.acquisitionDate?.split('T')[0]}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acquisitionCost">Costo de Adquisición (BOB) *</Label>
                <Input
                  id="acquisitionCost"
                  name="acquisitionCost"
                  type="number"
                  step="0.01"
                  defaultValue={editingAsset?.acquisitionCost}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="depreciationRate">Tasa de Depreciación (%)</Label>
                <Input
                  id="depreciationRate"
                  name="depreciationRate"
                  type="number"
                  step="0.01"
                  defaultValue={editingAsset?.depreciationRate || 0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usefulLifeYears">Vida Útil (años)</Label>
                <Input
                  id="usefulLifeYears"
                  name="usefulLifeYears"
                  type="number"
                  defaultValue={editingAsset?.usefulLifeYears || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="residualValue">Valor Residual (BOB)</Label>
                <Input
                  id="residualValue"
                  name="residualValue"
                  type="number"
                  step="0.01"
                  defaultValue={editingAsset?.residualValue || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={editingAsset?.location || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsiblePerson">Responsable</Label>
                <Input
                  id="responsiblePerson"
                  name="responsiblePerson"
                  defaultValue={editingAsset?.responsiblePerson || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Nº Factura</Label>
                <Input
                  id="invoiceNumber"
                  name="invoiceNumber"
                  defaultValue={editingAsset?.invoiceNumber || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Proveedor</Label>
                <Input
                  id="supplier"
                  name="supplier"
                  defaultValue={editingAsset?.supplier || ''}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes">Notas</Label>
                <Input
                  id="notes"
                  name="notes"
                  defaultValue={editingAsset?.notes || ''}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#1B3F66] hover:bg-[#0F2A47]"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingAsset ? 'Guardar Cambios' : 'Crear Activo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
