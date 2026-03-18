'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  usersApi,
  rolesApi,
  permissionsApi,
  clientesApi,
  blsApi,
  tripsApi,
  documentsApi,
  settlementsApi,
  invoicesApi,
  borderCrossingsApi,
  routesApi,
  dashboardApi,
  reportsApi,
} from '@/lib/api-client';
import {
  UserListParams,
  CreateUserInput,
  UpdateUserInput,
  CreateRoleInput,
  ClientListParams,
  CreateClientInput,
  UpdateClientInput,
  BLListParams,
  CreateBLInput,
  UpdateBLInput,
  TripListParams,
  CreateTripInput,
  UpdateTripInput,
  DocumentListParams,
  CreateDocumentInput,
  UpdateDocumentInput,
  SettlementListParams,
  CreateSettlementInput,
  UpdateSettlementInput,
  InvoiceListParams,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  BorderCrossingListParams,
  CreateBorderCrossingInput,
  UpdateBorderCrossingInput,
  CreateRouteInput,
  UpdateRouteInput,
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
export function useClientes(params?: ClientListParams) {
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
    mutationFn: (data: CreateClientInput) => clientesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientInput }) =>
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

export function useApproveBL() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => blsApi.approve(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['bls'] });
      queryClient.invalidateQueries({ queryKey: ['bls', id] });
    },
  });
}

export function useCancelBL() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      blsApi.cancel(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['bls'] });
      queryClient.invalidateQueries({ queryKey: ['bls', id] });
    },
  });
}

// ==========================================
// Trips Queries
// ==========================================
export function useTrips(params?: TripListParams) {
  return useQuery({
    queryKey: ['trips', params],
    queryFn: () => tripsApi.getAll(params),
  });
}

export function useTrip(id: string | undefined) {
  return useQuery({
    queryKey: ['trips', id],
    queryFn: () => tripsApi.getById(id!),
    enabled: !!id,
  });
}

export function useTripStats() {
  return useQuery({
    queryKey: ['trips', 'stats'],
    queryFn: () => tripsApi.getStats(),
  });
}

export function useAvailableResources() {
  return useQuery({
    queryKey: ['trips', 'resources'],
    queryFn: () => tripsApi.getAvailableResources(),
  });
}

// ==========================================
// Trips Mutations
// ==========================================
export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTripInput) => tripsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trips', 'stats'] });
    },
  });
}

export function useUpdateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTripInput }) =>
      tripsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trips', id] });
    },
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tripsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trips', 'stats'] });
    },
  });
}

export function useUpdateTripStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: import('@/types/api').TripStatus }) =>
      tripsApi.updateStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trips', id] });
      queryClient.invalidateQueries({ queryKey: ['trips', 'stats'] });
    },
  });
}

// ==========================================
// Documents Queries
// ==========================================
export function useDocuments(params?: DocumentListParams) {
  return useQuery({
    queryKey: ['documents', params],
    queryFn: () => documentsApi.getAll(params),
  });
}

export function useDocument(id: string | undefined) {
  return useQuery({
    queryKey: ['documents', id],
    queryFn: () => documentsApi.getById(id!),
    enabled: !!id,
  });
}

export function useDocumentsByTrip(tripId: string | undefined) {
  return useQuery({
    queryKey: ['documents', 'trip', tripId],
    queryFn: () => documentsApi.getByTrip(tripId!),
    enabled: !!tripId,
  });
}

export function useDocumentStats() {
  return useQuery({
    queryKey: ['documents', 'stats'],
    queryFn: () => documentsApi.getStats(),
  });
}

// ==========================================
// Documents Mutations
// ==========================================
export function useCreateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDocumentInput) => documentsApi.create(data),
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['documents', 'trip', tripId] });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocumentInput }) =>
      documentsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['documents', id] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useMarkDocumentReceived() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentsApi.markAsReceived(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useMarkDocumentVerified() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentsApi.markAsVerified(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

// ==========================================
// Settlements Queries
// ==========================================
export function useSettlements(params?: SettlementListParams) {
  return useQuery({
    queryKey: ['settlements', params],
    queryFn: () => settlementsApi.getAll(params),
  });
}

export function useSettlement(id: string | undefined) {
  return useQuery({
    queryKey: ['settlements', id],
    queryFn: () => settlementsApi.getById(id!),
    enabled: !!id,
  });
}

export function useSettlementByTrip(tripId: string | undefined) {
  return useQuery({
    queryKey: ['settlements', 'trip', tripId],
    queryFn: () => settlementsApi.getByTrip(tripId!),
    enabled: !!tripId,
  });
}

export function useSettlementStats(params?: { dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: ['settlements', 'stats', params],
    queryFn: () => settlementsApi.getStats(params),
  });
}

// ==========================================
// Settlements Mutations
// ==========================================
export function useCreateSettlement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSettlementInput) => settlementsApi.create(data),
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({ queryKey: ['settlements', 'trip', tripId] });
    },
  });
}

export function useUpdateSettlement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSettlementInput }) =>
      settlementsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({ queryKey: ['settlements', id] });
    },
  });
}

export function useDeleteSettlement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => settlementsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
    },
  });
}

export function useApproveSettlement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => settlementsApi.approve(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({ queryKey: ['settlements', id] });
    },
  });
}

export function useMarkSettlementPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => settlementsApi.markAsPaid(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({ queryKey: ['settlements', id] });
    },
  });
}

// ==========================================
// Invoices Queries
// ==========================================
export function useInvoices(params?: InvoiceListParams) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: () => invoicesApi.getAll(params),
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: () => invoicesApi.getById(id!),
    enabled: !!id,
  });
}

export function useInvoiceStats(params?: { clientId?: string; dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: ['invoices', 'stats', params],
    queryFn: () => invoicesApi.getStats(params),
  });
}

// ==========================================
// Invoices Mutations
// ==========================================
export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInvoiceInput) => invoicesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvoiceInput }) =>
      invoicesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', id] });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoicesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useApproveInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoicesApi.approve(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', id] });
    },
  });
}

export function useIssueInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoicesApi.issue(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', id] });
    },
  });
}

export function useMarkInvoicePaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoicesApi.markAsPaid(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', id] });
    },
  });
}

export function useCancelInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      invoicesApi.cancel(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', id] });
    },
  });
}

// ==========================================
// Border Crossings Queries
// ==========================================
export function useBorderCrossings(params?: BorderCrossingListParams) {
  return useQuery({
    queryKey: ['borderCrossings', params],
    queryFn: () => borderCrossingsApi.getAll(params),
  });
}

export function useBorderCrossing(id: string | undefined) {
  return useQuery({
    queryKey: ['borderCrossings', id],
    queryFn: () => borderCrossingsApi.getById(id!),
    enabled: !!id,
  });
}

export function useBorderCrossingsByTrip(tripId: string | undefined) {
  return useQuery({
    queryKey: ['borderCrossings', 'trip', tripId],
    queryFn: () => borderCrossingsApi.getByTrip(tripId!),
    enabled: !!tripId,
  });
}

export function useActiveBorderCrossings() {
  return useQuery({
    queryKey: ['borderCrossings', 'active'],
    queryFn: () => borderCrossingsApi.getActive(),
  });
}

export function useBorderCrossingStats() {
  return useQuery({
    queryKey: ['borderCrossings', 'stats'],
    queryFn: () => borderCrossingsApi.getStats(),
  });
}

// ==========================================
// Border Crossings Mutations
// ==========================================
export function useCreateBorderCrossing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBorderCrossingInput) => borderCrossingsApi.create(data),
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: ['borderCrossings'] });
      queryClient.invalidateQueries({ queryKey: ['borderCrossings', 'trip', tripId] });
    },
  });
}

export function useUpdateBorderCrossing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBorderCrossingInput }) =>
      borderCrossingsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['borderCrossings'] });
      queryClient.invalidateQueries({ queryKey: ['borderCrossings', id] });
    },
  });
}

export function useDeleteBorderCrossing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => borderCrossingsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borderCrossings'] });
    },
  });
}

export function useRegisterBorderExit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => borderCrossingsApi.registerExit(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['borderCrossings'] });
      queryClient.invalidateQueries({ queryKey: ['borderCrossings', id] });
    },
  });
}

export function useUpdateBorderChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, channel, reason }: { id: string; channel: import('@/types/api').BorderChannel; reason?: string }) =>
      borderCrossingsApi.updateChannel(id, channel, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['borderCrossings'] });
      queryClient.invalidateQueries({ queryKey: ['borderCrossings', id] });
    },
  });
}

// ==========================================
// Routes Queries
// ==========================================
export function useRoutesByTrip(tripId: string | undefined) {
  return useQuery({
    queryKey: ['routes', 'trip', tripId],
    queryFn: () => routesApi.getByTrip(tripId!),
    enabled: !!tripId,
  });
}

// ==========================================
// Routes Mutations
// ==========================================
export function useCreateRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRouteInput) => routesApi.create(data),
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: ['routes', 'trip', tripId] });
    },
  });
}

export function useUpdateRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data, tripId }: { id: string; data: UpdateRouteInput; tripId: string }) =>
      routesApi.update(id, data),
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: ['routes', 'trip', tripId] });
    },
  });
}

export function useDeleteRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tripId }: { id: string; tripId: string }) => routesApi.delete(id),
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: ['routes', 'trip', tripId] });
    },
  });
}

// ==========================================
// Dashboard Queries
// ==========================================
export function useMainDashboard(params?: import('@/types/api').DashboardParams) {
  return useQuery({
    queryKey: ['dashboard', 'main', params],
    queryFn: () => dashboardApi.getMain(params),
    staleTime: 30000, // 30 seconds - avoid refetching too frequently
  });
}

export function useFinancialDashboard(params?: import('@/types/api').DashboardParams) {
  return useQuery({
    queryKey: ['dashboard', 'financial', params],
    queryFn: () => dashboardApi.getFinancial(params),
    staleTime: 30000, // 30 seconds
  });
}

export function useOperationalDashboard(params?: import('@/types/api').DashboardParams) {
  return useQuery({
    queryKey: ['dashboard', 'operational', params],
    queryFn: () => dashboardApi.getOperational(params),
    staleTime: 30000, // 30 seconds
  });
}

export function useDashboardSummary(params?: import('@/types/api').DashboardParams) {
  return useQuery({
    queryKey: ['dashboard', 'summary', params],
    queryFn: () => dashboardApi.getSummary(params),
    staleTime: 30000, // 30 seconds
  });
}

// ==========================================
// Reports Queries
// ==========================================
export function useReportTypes() {
  return useQuery({
    queryKey: ['reports', 'types'],
    queryFn: () => reportsApi.getTypes(),
    staleTime: 300000, // 5 minutes - report types rarely change
  });
}

export function useTripsReport(params?: import('@/types/api').ReportParams) {
  return useQuery({
    queryKey: ['reports', 'trips', params],
    queryFn: () => reportsApi.getTrips(params),
    enabled: !!params?.startDate && !!params?.endDate,
  });
}

export function useFinancialReport(params?: import('@/types/api').ReportParams) {
  return useQuery({
    queryKey: ['reports', 'financial', params],
    queryFn: () => reportsApi.getFinancial(params),
    enabled: !!params?.startDate && !!params?.endDate,
  });
}

export function useClientsReport(params?: import('@/types/api').ReportParams) {
  return useQuery({
    queryKey: ['reports', 'clients', params],
    queryFn: () => reportsApi.getClients(params),
    enabled: !!params?.startDate && !!params?.endDate,
  });
}

export function useDriversReport(params?: import('@/types/api').ReportParams) {
  return useQuery({
    queryKey: ['reports', 'drivers', params],
    queryFn: () => reportsApi.getDrivers(params),
    enabled: !!params?.startDate && !!params?.endDate,
  });
}

export function useFleetReport(params?: import('@/types/api').ReportParams) {
  return useQuery({
    queryKey: ['reports', 'fleet', params],
    queryFn: () => reportsApi.getFleet(params),
    enabled: !!params?.startDate && !!params?.endDate,
  });
}

export function useBordersReport(params?: import('@/types/api').ReportParams) {
  return useQuery({
    queryKey: ['reports', 'borders', params],
    queryFn: () => reportsApi.getBorders(params),
    enabled: !!params?.startDate && !!params?.endDate,
  });
}
