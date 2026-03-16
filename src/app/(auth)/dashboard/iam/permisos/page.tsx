'use client';

import { useState } from 'react';
import {
  Search,
  Loader2,
  Shield,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePermissions } from '@/hooks/use-queries';
import { Permission } from '@/types/api';

export default function PermisosPage() {
  // State
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');

  // Queries
  const { data: permissions = [], isLoading } = usePermissions(
    moduleFilter !== 'all' ? moduleFilter : undefined
  );

  // Get unique modules
  const modules = [...new Set(permissions.map((p) => p.module))];

  // Filter permissions by search
  const filteredPermissions = permissions.filter(
    (permission) =>
      permission.name.toLowerCase().includes(search.toLowerCase()) ||
      (permission.description && permission.description.toLowerCase().includes(search.toLowerCase())) ||
      permission.resource.toLowerCase().includes(search.toLowerCase())
  );

  // Group permissions by module
  const groupedPermissions = filteredPermissions.reduce<Record<string, Permission[]>>((acc, permission) => {
    const module = permission.module;
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(permission);
    return acc;
  }, {});

  // Action colors
  const actionColors: Record<string, string> = {
    create: 'bg-green-100 text-green-800 border-green-200',
    read: 'bg-blue-100 text-blue-800 border-blue-200',
    update: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    delete: 'bg-red-100 text-red-800 border-red-200',
    manage: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Gestión de Permisos
        </h1>
        <p className="text-gray-500 mt-1">
          Visualiza los permisos disponibles en el sistema
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar permisos..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los módulos</SelectItem>
                {modules.map((module) => (
                  <SelectItem key={module} value={module}>
                    {module}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Permissions by Module */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-[#1B3F66]" />
          </CardContent>
        </Card>
      ) : Object.keys(groupedPermissions).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Shield className="h-12 w-12 mb-4 opacity-50" />
            <p>No se encontraron permisos</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedPermissions).map(([module, perms]) => (
          <Card key={module}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-[#1B3F66]" />
                    {module}
                  </CardTitle>
                  <CardDescription>
                    {perms.length} permiso{perms.length !== 1 ? 's' : ''} en este módulo
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-[#1B3F66]/10 text-[#1B3F66]">
                  {module}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Recurso</TableHead>
                      <TableHead>Acción</TableHead>
                      <TableHead>Descripción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {perms.map((permission) => (
                      <TableRow key={permission.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          {permission.name}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {permission.resource}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={actionColors[permission.action] || 'bg-gray-100 text-gray-800'}
                          >
                            {permission.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {permission.description || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
