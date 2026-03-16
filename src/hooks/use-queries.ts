'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  usersApi,
  rolesApi,
  permissionsApi,
  clientesApi,
  blsApi,
} from '@/lib/api-client';
import {
  UserListParams,
  CreateUserInput,
  UpdateUserInput,
  CreateRoleInput,
  ClienteListParams,
  CreateClienteInput,
  UpdateClienteInput,
  BLListParams,
  CreateBLInput,
  UpdateBLInput,
} from '@/types/api';

// ==========================================
// Users Queries
// ==========================================
export function useUsers(params?: UserListParams) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => usersApi.getAll(params),
  });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => usersApi.getById(id!),
    enabled: !!id,
  });
}

// ==========================================
// Users Mutations
// ==========================================
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserInput) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserInput }) =>
      usersApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', id] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useAssignUserRoles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, roleIds }: { id: string; roleIds: string[] }) =>
      usersApi.assignRoles(id, roleIds),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', id] });
    },
  });
}

// ==========================================
// Roles Queries
// ==========================================
export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.getAll(),
  });
}

export function useRole(id: string | undefined) {
  return useQuery({
    queryKey: ['roles', id],
    queryFn: () => rolesApi.getById(id!),
    enabled: !!id,
  });
}

// ==========================================
// Roles Mutations
// ==========================================
export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRoleInput) => rolesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateRoleInput> }) =>
      rolesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles', id] });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rolesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

// ==========================================
// Permissions Queries
// ==========================================
export function usePermissions(module?: string) {
  return useQuery({
    queryKey: ['permissions', module],
    queryFn: () => permissionsApi.getAll(),
  });
}

// ==========================================
// Clientes Queries
// ==========================================
export function useClientes(params?: ClienteListParams) {
  return useQuery({
    queryKey: ['clientes', params],
    queryFn: () => clientesApi.getAll(params),
  });
}

export function useCliente(id: string | undefined) {
  return useQuery({
    queryKey: ['clientes', id],
    queryFn: () => clientesApi.getById(id!),
    enabled: !!id,
  });
}

// ==========================================
// Clientes Mutations
// ==========================================
export function useCreateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClienteInput) => clientesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClienteInput }) =>
      clientesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['clientes', id] });
    },
  });
}

export function useDeleteCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

// ==========================================
// BLs Queries
// ==========================================
export function useBLs(params?: BLListParams) {
  return useQuery({
    queryKey: ['bls', params],
    queryFn: () => blsApi.getAll(params),
  });
}

export function useBL(id: string | undefined) {
  return useQuery({
    queryKey: ['bls', id],
    queryFn: () => blsApi.getById(id!),
    enabled: !!id,
  });
}

// ==========================================
// BLs Mutations
// ==========================================
export function useCreateBL() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBLInput) => blsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bls'] });
    },
  });
}

export function useUpdateBL() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBLInput }) =>
      blsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['bls'] });
      queryClient.invalidateQueries({ queryKey: ['bls', id] });
    },
  });
}

export function useDeleteBL() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => blsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bls'] });
    },
  });
}

export function useCalcularFlota() {
  return useMutation({
    mutationFn: (id: string) => blsApi.calcularFlota(id),
  });
}
