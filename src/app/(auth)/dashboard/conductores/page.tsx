'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import axios from 'axios';
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  RotateCcw,
  Star,
  ToggleLeft,
  ToggleRight,
  BarChart3,
  Calendar,
  DollarSign,
  MapPin,
} from 'lucide-react';

import {
  Card,
  CardContent,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { driversApi } from '@/lib/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Driver, CreateDriverInput, UpdateDriverInput, ContractType, DriverStats } from '@/types/api';

// Form schema
const driverSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
  identityCard: z.string().min(1, 'La cédula es requerida'),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  birthDate: z.string().optional().or(z.literal('')),
  salary: z.number().min(0, 'El salario debe ser positivo').optional(),
  licenseNumber: z.string().min(1, 'El número de licencia es requerido'),
  licenseCategory: z.string().min(1, 'La categoría es requerida'),
  licenseExpiryDate: z.string().min(1, 'La fecha de vencimiento es requerida'),
  contractType: z.enum(['MONTHLY', 'TRIP']),
  branchId: z.string().min(1, 'La sucursal es requerida'),
});

type DriverFormData = z.infer<typeof driverSchema>;

// License categories
const licenseCategories = [
  { value: 'A', label: 'A' },
  { value: 'A.I.a', label: 'A.I.a' },
  { value: 'A.I.b', label: 'A.I.b' },
  { value: 'A.II.a', label: 'A.II.a' },
  { value: 'A.II.b', label: 'A.II.b' },
  { value: 'A.III.a', label: 'A.III.a' },
  { value: 'A.III.b', label: 'A.III.b' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
];

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
  if (error instanceof Error) return error.message;
  return defaultMessage;
};

export default function ConductoresPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [activoFilter, setActivoFilter] = useState<string>('all');
  const [disponibleFilter, setDisponibleFilter] = useState<string>('all');
  const [contratoFilter, setContratoFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [selectedDriverStats, setSelectedDriverStats] = useState<DriverStats | null>(null);

  // Queries
  const { data: driversData, isLoading } = useQuery({
    queryKey: ['drivers', { page, limit, search, isActive: activoFilter, isAvailable: disponibleFilter, contractType: contratoFilter }],
    queryFn: () => driversApi.getAll({
      page,
      limit,
      search: search || undefined,
      isActive: activoFilter !== 'all' ? activoFilter === 'true' : undefined,
      isAvailable: disponibleFilter !== 'all' ? disponibleFilter === 'true' : undefined,
      contractType: contratoFilter !== 'all' ? contratoFilter as ContractType : undefined,
    }),
  });

  // TODO: Fetch branches from API when available
  // const { data: branches } = useQuery({
  //   queryKey: ['branches'],
  //   queryFn: () => branchesApi.getAll(),
  // });
  // Placeholder branches for now
  const branches = [
    { id: 'default-branch-id', name: 'Sucursal Principal - La Paz' },
  ];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateDriverInput) => driversApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast({ title: 'Conductor creado', description: 'El conductor ha sido creado exitosamente.' });
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Error al crear',
        description: getErrorMessage(error, 'No se pudo crear el conductor.'),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDriverInput }) => driversApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast({ title: 'Conductor actualizado', description: 'El conductor ha sido actualizado.' });
      setIsEditOpen(false);
      setSelectedDriver(null);
      editForm.reset();
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Error al actualizar',
        description: getErrorMessage(error, 'No se pudo actualizar el conductor.'),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => driversApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast({ title: 'Conductor desactivado', description: 'El conductor ha sido desactivado.' });
      setIsDeleteOpen(false);
      setSelectedDriver(null);
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getErrorMessage(error, 'No se pudo desactivar el conductor.'),
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => driversApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast({ title: 'Conductor reactivado', description: 'El conductor ha sido reactivado.' });
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getErrorMessage(error, 'No se pudo reactivar el conductor.'),
      });
    },
  });

  const availabilityMutation = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) => driversApi.setAvailability(id, isAvailable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast({ title: 'Disponibilidad actualizada', description: 'La disponibilidad del conductor ha sido actualizada.' });
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getErrorMessage(error, 'No se pudo actualizar la disponibilidad.'),
      });
    },
  });

  // Forms
  const createForm = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      firstName: '', lastName: '', identityCard: '', phone: '', email: '', address: '',
      birthDate: '', salary: undefined,
      licenseNumber: '', licenseCategory: 'A', licenseExpiryDate: '', contractType: 'MONTHLY',
      branchId: 'default-branch-id',
    },
  });

  const editForm = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      firstName: '', lastName: '', identityCard: '', phone: '', email: '', address: '',
      birthDate: '', salary: undefined,
      licenseNumber: '', licenseCategory: 'A', licenseExpiryDate: '', contractType: 'MONTHLY',
      branchId: '',
    },
  });

  // Handlers
  const handleCreate = (data: DriverFormData) => {
    createMutation.mutate({
      firstName: data.firstName,
      lastName: data.lastName,
      identityCard: data.identityCard,
      phone: data.phone || undefined,
      email: data.email || undefined,
      address: data.address || undefined,
      birthDate: data.birthDate || undefined,
      salary: data.salary || undefined,
      licenseNumber: data.licenseNumber,
      licenseCategory: data.licenseCategory,
      licenseExpiryDate: data.licenseExpiryDate,
      contractType: data.contractType,
      branchId: data.branchId,
    });
  };

  const handleEdit = (data: DriverFormData) => {
    if (!selectedDriver) return;
    updateMutation.mutate({
      id: selectedDriver.id,
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        identityCard: data.identityCard,
        phone: data.phone || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
        birthDate: data.birthDate || undefined,
        salary: data.salary || undefined,
        licenseNumber: data.licenseNumber,
        licenseCategory: data.licenseCategory,
        licenseExpiryDate: data.licenseExpiryDate,
        contractType: data.contractType,
        branchId: data.branchId,
      },
    });
  };

  const handleDelete = () => {
    if (!selectedDriver) return;
    deleteMutation.mutate(selectedDriver.id);
  };

  const handleRestore = (driver: Driver) => {
    restoreMutation.mutate(driver.id);
  };

  const handleToggleAvailability = (driver: Driver) => {
    availabilityMutation.mutate({ id: driver.id, isAvailable: !driver.isAvailable });
  };

  const openEditDialog = (driver: Driver) => {
    setSelectedDriver(driver);
    editForm.reset({
      firstName: driver.firstName,
      lastName: driver.lastName,
      identityCard: driver.identityCard,
      phone: driver.phone || '',
      email: driver.email || '',
      address: driver.address || '',
      birthDate: driver.birthDate ? driver.birthDate.split('T')[0] : '',
      salary: driver.salary || undefined,
      licenseNumber: driver.licenseNumber,
      licenseCategory: driver.licenseCategory,
      licenseExpiryDate: driver.licenseExpiryDate ? driver.licenseExpiryDate.split('T')[0] : '',
      contractType: driver.contractType,
      branchId: driver.branchId || '',
    });
    setIsEditOpen(true);
  };

  const openStatsDialog = async (driver: Driver) => {
    setSelectedDriver(driver);
    try {
      const stats = await driversApi.getStats(driver.id);
      setSelectedDriverStats(stats);
      setIsStatsOpen(true);
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron obtener las estadísticas del conductor.',
      });
    }
  };

  // Pagination
  const totalPages = driversData?.pagination?.totalPages || 1;
  const totalDrivers = driversData?.pagination?.total || 0;
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const drivers = driversData?.data || [];

  // Check if license is expiring soon (within 30 days)
  const isLicenseExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  };

  const isLicenseExpired = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  };

  // Calculate age from birthDate
  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Format salary
  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(salary);
  };

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gestión de Conductores</h1>
          <p className="text-gray-500 mt-1">Administra los conductores de la empresa</p>
        </div>
        <Button className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" onClick={() => { createForm.reset(); setIsCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo Conductor
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, cédula, licencia..."
                className="pl-10"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={disponibleFilter} onValueChange={(v) => { setDisponibleFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="Disponibilidad" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Disponibles</SelectItem>
                <SelectItem value="false">No disponibles</SelectItem>
              </SelectContent>
            </Select>
            <Select value={contratoFilter} onValueChange={(v) => { setContratoFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="Contrato" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="MONTHLY">Mensual</SelectItem>
                <SelectItem value="PER_TRIP">Por viaje</SelectItem>
              </SelectContent>
            </Select>
            <Select value={activoFilter} onValueChange={(v) => { setActivoFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="Activos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Activos</SelectItem>
                <SelectItem value="false">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
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
                      <TableHead>Nombre</TableHead>
                      <TableHead>Cédula</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Licencia</TableHead>
                      <TableHead>Venc. Licencia</TableHead>
                      <TableHead>Contrato / Salario</TableHead>
                      <TableHead>Disponible</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drivers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                          No se encontraron conductores
                        </TableCell>
                      </TableRow>
                    ) : (
                      drivers.map((driver) => (
                        <TableRow key={driver.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-[#1B3F66] flex items-center justify-center text-white">
                                <UserCircle className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="font-medium">{driver.fullName || `${driver.firstName} ${driver.lastName}`}</div>
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                  {driver.birthDate && (
                                    <span>{calculateAge(driver.birthDate)} años</span>
                                  )}
                                  {driver.branch?.name && (
                                    <><span className="mx-1">•</span><span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{driver.branch.name}</span></>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{driver.identityCard}</TableCell>
                          <TableCell>
                            <div>
                              <div className="text-sm">{driver.phone || '-'}</div>
                              <div className="text-xs text-gray-500">{driver.email || '-'}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{driver.licenseNumber}</div>
                              <div className="text-sm text-gray-500">Cat. {driver.licenseCategory}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {driver.licenseExpiryDate ? (
                              <div className={isLicenseExpired(driver.licenseExpiryDate) ? 'text-red-600' : isLicenseExpiringSoon(driver.licenseExpiryDate) ? 'text-orange-600' : ''}>
                                {new Date(driver.licenseExpiryDate).toLocaleDateString()}
                                {isLicenseExpired(driver.licenseExpiryDate) && (
                                  <Badge variant="destructive" className="ml-2 text-xs">Vencida</Badge>
                                )}
                                {!isLicenseExpired(driver.licenseExpiryDate) && isLicenseExpiringSoon(driver.licenseExpiryDate) && (
                                  <Badge variant="outline" className="ml-2 text-xs bg-orange-50 text-orange-700 border-orange-200">Próxima a vencer</Badge>
                                )}
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <div>
                              <Badge variant="outline" className={driver.contractType === 'MONTHLY' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}>
                                {driver.contractType === 'MONTHLY' ? 'Mensual' : 'Por viaje'}
                              </Badge>
                              {driver.salary && driver.contractType === 'MONTHLY' && (
                                <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />{formatSalary(driver.salary)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={driver.isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {driver.isAvailable ? 'Sí' : 'No'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={driver.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {driver.isActive ? 'Activo' : 'Inactivo'}
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
                                <DropdownMenuItem onClick={() => openStatsDialog(driver)}>
                                  <BarChart3 className="h-4 w-4 mr-2" /> Ver Estadísticas
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleAvailability(driver)} disabled={!driver.isActive}>
                                  {driver.isAvailable ? (
                                    <><ToggleLeft className="h-4 w-4 mr-2" /> Marcar No Disponible</>
                                  ) : (
                                    <><ToggleRight className="h-4 w-4 mr-2" /> Marcar Disponible</>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditDialog(driver)}>
                                  <Edit className="h-4 w-4 mr-2" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {driver.isActive ? (
                                  <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedDriver(driver); setIsDeleteOpen(true); }}>
                                    <Trash2 className="h-4 w-4 mr-2" /> Desactivar
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem className="text-green-600" onClick={() => handleRestore(driver)}>
                                    <RotateCcw className="h-4 w-4 mr-2" /> Reactivar
                                  </DropdownMenuItem>
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
              {drivers.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-gray-500">
                    Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, totalDrivers)} de {totalDrivers} conductores
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                      <SelectTrigger className="w-[70px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={() => setPage(page - 1)} disabled={!canPrev}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm">Página {page} de {totalPages}</div>
                    <Button variant="outline" size="icon" onClick={() => setPage(page + 1)} disabled={!canNext}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Conductor</DialogTitle>
            <DialogDescription>Ingresa los datos del nuevo conductor. Se creará también como empleado.</DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4 py-4">
            {/* Datos Personales */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700 border-b pb-1">Datos Personales</h4>
              <div className="grid grid-cols-2 gap-4">
                <Controller name="firstName" control={createForm.control} render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label>Nombre *</Label>
                    <Input {...field} placeholder="Juan" className={fieldState.invalid ? 'border-red-500' : ''} />
                    {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                  </div>
                )} />
                <Controller name="lastName" control={createForm.control} render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label>Apellido *</Label>
                    <Input {...field} placeholder="Pérez" className={fieldState.invalid ? 'border-red-500' : ''} />
                    {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                  </div>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Controller name="identityCard" control={createForm.control} render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label>Cédula de Identidad *</Label>
                    <Input {...field} placeholder="12345678 LP" className={fieldState.invalid ? 'border-red-500' : ''} />
                    {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                  </div>
                )} />
                <Controller name="birthDate" control={createForm.control} render={({ field }) => (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Fecha de Nacimiento</Label>
                    <Input {...field} type="date" />
                  </div>
                )} />
              </div>
              <Controller name="address" control={createForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <Input {...field} placeholder="Zona Norte, La Paz" />
                </div>
              )} />
            </div>

            {/* Contacto */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700 border-b pb-1">Contacto</h4>
              <div className="grid grid-cols-2 gap-4">
                <Controller name="phone" control={createForm.control} render={({ field }) => (
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input {...field} placeholder="+591 71234567" />
                  </div>
                )} />
                <Controller name="email" control={createForm.control} render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input {...field} type="email" placeholder="conductor@ejemplo.com" className={fieldState.invalid ? 'border-red-500' : ''} />
                    {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                  </div>
                )} />
              </div>
            </div>

            {/* Licencia */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700 border-b pb-1">Licencia de Conducir</h4>
              <div className="grid grid-cols-3 gap-4">
                <Controller name="licenseNumber" control={createForm.control} render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label>Número de Licencia *</Label>
                    <Input {...field} placeholder="LIC-2024-001" className={fieldState.invalid ? 'border-red-500' : ''} />
                    {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                  </div>
                )} />
                <Controller name="licenseCategory" control={createForm.control} render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label>Categoría *</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {licenseCategories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                  </div>
                )} />
                <Controller name="licenseExpiryDate" control={createForm.control} render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label>Vencimiento *</Label>
                    <Input {...field} type="date" className={fieldState.invalid ? 'border-red-500' : ''} />
                    {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                  </div>
                )} />
              </div>
            </div>

            {/* Contrato */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700 border-b pb-1">Información Laboral</h4>
              <div className="grid grid-cols-3 gap-4">
                <Controller name="contractType" control={createForm.control} render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label>Tipo de Contrato *</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MONTHLY">Mensual</SelectItem>
                        <SelectItem value="PER_TRIP">Por Viaje</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                  </div>
                )} />
                <Controller name="salary" control={createForm.control} render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> Salario (Bs)</Label>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      placeholder="5000.00"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      className={fieldState.invalid ? 'border-red-500' : ''}
                      disabled={createForm.watch('contractType') === 'TRIP'}
                    />
                    {createForm.watch('contractType') === 'TRIP' && (
                      <p className="text-xs text-gray-500">Solo para contrato mensual</p>
                    )}
                    {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                  </div>
                )} />
                <Controller name="branchId" control={createForm.control} render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Sucursal *</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                  </div>
                )} />
              </div>
            </div>

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
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Conductor</DialogTitle>
            <DialogDescription>Modifica los datos del conductor</DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4 py-4">
            {/* Datos Personales */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700 border-b pb-1">Datos Personales</h4>
              <div className="grid grid-cols-2 gap-4">
                <Controller name="firstName" control={editForm.control} render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label>Nombre *</Label>
                    <Input {...field} className={fieldState.invalid ? 'border-red-500' : ''} />
                    {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                  </div>
                )} />
                <Controller name="lastName" control={editForm.control} render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label>Apellido *</Label>
                    <Input {...field} className={fieldState.invalid ? 'border-red-500' : ''} />
                    {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                  </div>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Controller name="identityCard" control={editForm.control} render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label>Cédula de Identidad *</Label>
                    <Input {...field} className={fieldState.invalid ? 'border-red-500' : ''} />
                    {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                  </div>
                )} />
                <Controller name="birthDate" control={editForm.control} render={({ field }) => (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Fecha de Nacimiento</Label>
                    <Input {...field} type="date" />
                  </div>
                )} />
              </div>
              <Controller name="address" control={editForm.control} render={({ field }) => (
                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <Input {...field} />
                </div>
              )} />
            </div>

            {/* Contacto */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700 border-b pb-1">Contacto</h4>
              <div className="grid grid-cols-2 gap-4">
                <Controller name="phone" control={editForm.control} render={({ field }) => (
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input {...field} />
                  </div>
                )} />
                <Controller name="email" control={editForm.control} render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input {...field} type="email" className={fieldState.invalid ? 'border-red-500' : ''} />
                    {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                  </div>
                )} />
              </div>
            </div>

            {/* Licencia */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700 border-b pb-1">Licencia de Conducir</h4>
              <div className="grid grid-cols-3 gap-4">
                <Controller name="licenseNumber" control={editForm.control} render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label>Número de Licencia *</Label>
                    <Input {...field} className={fieldState.invalid ? 'border-red-500' : ''} />
                    {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                  </div>
                )} />
                <Controller name="licenseCategory" control={editForm.control} render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label>Categoría *</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {licenseCategories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                  </div>
                )} />
                <Controller name="licenseExpiryDate" control={editForm.control} render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label>Vencimiento *</Label>
                    <Input {...field} type="date" className={fieldState.invalid ? 'border-red-500' : ''} />
                    {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                  </div>
                )} />
              </div>
            </div>

            {/* Contrato */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700 border-b pb-1">Información Laboral</h4>
              <div className="grid grid-cols-3 gap-4">
                <Controller name="contractType" control={editForm.control} render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label>Tipo de Contrato *</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MONTHLY">Mensual</SelectItem>
                        <SelectItem value="PER_TRIP">Por Viaje</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                  </div>
                )} />
                <Controller name="salary" control={editForm.control} render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> Salario (Bs)</Label>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      className={fieldState.invalid ? 'border-red-500' : ''}
                      disabled={editForm.watch('contractType') === 'TRIP'}
                    />
                    {editForm.watch('contractType') === 'TRIP' && (
                      <p className="text-xs text-gray-500">Solo para contrato mensual</p>
                    )}
                    {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                  </div>
                )} />
                <Controller name="branchId" control={editForm.control} render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Sucursal *</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={fieldState.invalid ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                  </div>
                )} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-[#1B3F66] hover:bg-[#1B3F66]/90" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={isStatsOpen} onOpenChange={setIsStatsOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Estadísticas del Conductor</DialogTitle>
            <DialogDescription>
              {selectedDriver?.fullName || `${selectedDriver?.firstName} ${selectedDriver?.lastName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {selectedDriverStats ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Total Viajes</div>
                    <div className="text-2xl font-bold text-[#1B3F66]">{selectedDriverStats.totalTrips}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Peso Transportado</div>
                    <div className="text-2xl font-bold text-[#1B3F66]">{selectedDriverStats.totalWeightTransported?.toLocaleString()} Tn</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Promedio Horas</div>
                    <div className="text-2xl font-bold text-[#1B3F66]">{selectedDriverStats.avgDeliveryHours?.toFixed(1) || '-'} h</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Rating</div>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      <span className="text-2xl font-bold text-[#1B3F66]">{selectedDriverStats.rating?.toFixed(1) || '-'}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Total Gastos</div>
                  <div className="text-2xl font-bold text-[#1B3F66]">Bs {selectedDriverStats.totalGastos?.toLocaleString() || 0}</div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-[#1B3F66]" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatsOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar conductor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará al conductor {selectedDriver?.fullName || `${selectedDriver?.firstName} ${selectedDriver?.lastName}`}.
              El conductor no estará disponible para nuevos viajes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
