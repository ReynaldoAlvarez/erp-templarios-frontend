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
  assetsApi,
  liabilitiesApi,
  maintenanceApi,
  sanctionsApi,
  driverHistoryApi,
  trucksApi,
  driversApi,
  cashFlowApi,
  paymentsApi,
  sinExportApi,
  notificationsApi,
  documentTypesApi,
  tramosApi,
  documentAutomationApi,
  paymentBlockApi,
  sanctionsAutomationApi,
  tripReportsApi,
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

// ==========================================
// Payment Block Hooks
// ==========================================

export function usePaymentBlockStats() {
  return useQuery({
    queryKey: ['payment-block', 'stats'],
    queryFn: () => paymentBlockApi.getStats(),
    staleTime: 30000,
  });
}

export function useBlockedPayments(params?: import('@/types/api').PaymentBlockListParams) {
  return useQuery({
    queryKey: ['payment-block', 'blocked', params],
    queryFn: () => paymentBlockApi.getBlockedPayments(params),
  });
}

export function usePaymentBlockChecklist(tripId: string | undefined) {
  return useQuery({
    queryKey: ['payment-block', 'checklist', tripId],
    queryFn: () => paymentBlockApi.getChecklist(tripId!),
    enabled: !!tripId,
  });
}

export function usePaymentBlockHistory(settlementId: string | undefined) {
  return useQuery({
    queryKey: ['payment-block', 'history', settlementId],
    queryFn: () => paymentBlockApi.getHistory(settlementId!),
    enabled: !!settlementId,
  });
}

export function useCheckPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tripId: string) => paymentBlockApi.checkPayment(tripId),
    onSuccess: (_, tripId) => {
      queryClient.invalidateQueries({ queryKey: ['payment-block', 'checklist', tripId] });
      queryClient.invalidateQueries({ queryKey: ['payment-block', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['payment-block', 'blocked'] });
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
    },
  });
}

export function useCanProcessPayment() {
  return useMutation({
    mutationFn: (settlementId: string) => paymentBlockApi.canProcess(settlementId),
  });
}

export function useUnblockPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ settlementId, reason }: { settlementId: string; reason: string }) =>
      paymentBlockApi.unblock(settlementId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-block'] });
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
    },
  });
}

export function useProcessAllPayments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => paymentBlockApi.processAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-block'] });
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
    },
  });
}

// ==========================================
// Sprint 7: Assets, Liabilities, Maintenance, Sanctions, Driver History
// ==========================================

// ============ Assets Hooks ============
export function useAssets(params?: import('@/types/api').AssetListParams) {
  return useQuery({
    queryKey: ['assets', params],
    queryFn: () => assetsApi.getAll(params),
  });
}

export function useAsset(id: string | undefined) {
  return useQuery({
    queryKey: ['assets', id],
    queryFn: () => assetsApi.getById(id!),
    enabled: !!id,
  });
}

export function useAssetCategories() {
  return useQuery({
    queryKey: ['assets', 'categories'],
    queryFn: () => assetsApi.getCategories(),
    staleTime: 300000, // 5 minutes
  });
}

export function useAssetStats() {
  return useQuery({
    queryKey: ['assets', 'stats'],
    queryFn: () => assetsApi.getStats(),
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: import('@/types/api').CreateAssetInput) => assetsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: import('@/types/api').UpdateAssetInput }) =>
      assetsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['assets', id] });
    },
  });
}

export function useUpdateAssetDepreciation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, depreciationRate, currentValue }: { id: string; depreciationRate: number; currentValue: number }) =>
      assetsApi.updateDepreciation(id, depreciationRate, currentValue),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['assets', id] });
    },
  });
}

export function useDeactivateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assetsApi.deactivate(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['assets', id] });
    },
  });
}

export function useActivateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assetsApi.activate(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['assets', id] });
    },
  });
}

// ============ Liabilities Hooks ============
export function useLiabilities(params?: import('@/types/api').LiabilityListParams) {
  return useQuery({
    queryKey: ['liabilities', params],
    queryFn: () => liabilitiesApi.getAll(params),
  });
}

export function useLiability(id: string | undefined) {
  return useQuery({
    queryKey: ['liabilities', id],
    queryFn: () => liabilitiesApi.getById(id!),
    enabled: !!id,
  });
}

export function useLiabilityTypes() {
  return useQuery({
    queryKey: ['liabilities', 'types'],
    queryFn: () => liabilitiesApi.getTypes(),
    staleTime: 300000, // 5 minutes
  });
}

export function useLiabilityStats() {
  return useQuery({
    queryKey: ['liabilities', 'stats'],
    queryFn: () => liabilitiesApi.getStats(),
  });
}

export function useOverdueLiabilities() {
  return useQuery({
    queryKey: ['liabilities', 'overdue'],
    queryFn: () => liabilitiesApi.getOverdue(),
  });
}

export function useCreateLiability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: import('@/types/api').CreateLiabilityInput) => liabilitiesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liabilities'] });
    },
  });
}

export function useUpdateLiability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: import('@/types/api').UpdateLiabilityInput }) =>
      liabilitiesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['liabilities'] });
      queryClient.invalidateQueries({ queryKey: ['liabilities', id] });
    },
  });
}

export function useUpdateLiabilityStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: import('@/types/api').LiabilityStatus }) =>
      liabilitiesApi.updateStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['liabilities'] });
      queryClient.invalidateQueries({ queryKey: ['liabilities', id] });
    },
  });
}

export function useRegisterLiabilityPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: import('@/types/api').CreateLiabilityPaymentInput }) =>
      liabilitiesApi.registerPayment(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['liabilities'] });
      queryClient.invalidateQueries({ queryKey: ['liabilities', id] });
    },
  });
}

// ============ Maintenance Hooks ============
export function useMaintenance(params?: import('@/types/api').MaintenanceListParams) {
  return useQuery({
    queryKey: ['maintenance', params],
    queryFn: () => maintenanceApi.getAll(params),
  });
}

export function useMaintenanceRecord(id: string | undefined) {
  return useQuery({
    queryKey: ['maintenance', id],
    queryFn: () => maintenanceApi.getById(id!),
    enabled: !!id,
  });
}

export function useMaintenanceTypes() {
  return useQuery({
    queryKey: ['maintenance', 'types'],
    queryFn: () => maintenanceApi.getTypes(),
    staleTime: 300000, // 5 minutes
  });
}

export function useMaintenanceStats() {
  return useQuery({
    queryKey: ['maintenance', 'stats'],
    queryFn: () => maintenanceApi.getStats(),
  });
}

export function useUpcomingMaintenance() {
  return useQuery({
    queryKey: ['maintenance', 'upcoming'],
    queryFn: () => maintenanceApi.getUpcoming(),
  });
}

export function useMaintenanceByTruck(truckId: string | undefined) {
  return useQuery({
    queryKey: ['maintenance', 'truck', truckId],
    queryFn: () => maintenanceApi.getByTruck(truckId!),
    enabled: !!truckId,
  });
}

export function useCreateMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: import('@/types/api').CreateMaintenanceInput) => maintenanceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    },
  });
}

export function useUpdateMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: import('@/types/api').UpdateMaintenanceInput }) =>
      maintenanceApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance', id] });
    },
  });
}

export function useStartMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => maintenanceApi.start(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance', id] });
    },
  });
}

export function useCompleteMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, cost, notes }: { id: string; cost?: number; notes?: string }) =>
      maintenanceApi.complete(id, cost, notes),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance', id] });
    },
  });
}

export function useCancelMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      maintenanceApi.cancel(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance', id] });
    },
  });
}

// ============ Sanctions Hooks ============
export function useSanctions(params?: import('@/types/api').SanctionListParams) {
  return useQuery({
    queryKey: ['sanctions', params],
    queryFn: () => sanctionsApi.getAll(params),
  });
}

export function useSanction(id: string | undefined) {
  return useQuery({
    queryKey: ['sanctions', id],
    queryFn: () => sanctionsApi.getById(id!),
    enabled: !!id,
  });
}

export function useSanctionTypes() {
  return useQuery({
    queryKey: ['sanctions', 'types'],
    queryFn: () => sanctionsApi.getTypes(),
    staleTime: 300000, // 5 minutes
  });
}

export function useSanctionStats() {
  return useQuery({
    queryKey: ['sanctions', 'stats'],
    queryFn: () => sanctionsApi.getStats(),
  });
}

export function useActiveSanctions() {
  return useQuery({
    queryKey: ['sanctions', 'active'],
    queryFn: () => sanctionsApi.getActive(),
  });
}

export function useSanctionsByDriver(driverId: string | undefined) {
  return useQuery({
    queryKey: ['sanctions', 'driver', driverId],
    queryFn: () => sanctionsApi.getByDriver(driverId!),
    enabled: !!driverId,
  });
}

export function useCreateSanction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: import('@/types/api').CreateSanctionInput) => sanctionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sanctions'] });
    },
  });
}

export function useUpdateSanction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: import('@/types/api').UpdateSanctionInput }) =>
      sanctionsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['sanctions'] });
      queryClient.invalidateQueries({ queryKey: ['sanctions', id] });
    },
  });
}

export function useCompleteSanction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sanctionsApi.complete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['sanctions'] });
      queryClient.invalidateQueries({ queryKey: ['sanctions', id] });
    },
  });
}

export function useCancelSanction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      sanctionsApi.cancel(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['sanctions'] });
      queryClient.invalidateQueries({ queryKey: ['sanctions', id] });
    },
  });
}

// ============ Sanctions Automation Hooks ============
export function useSanctionConfig() {
  return useQuery({
    queryKey: ['sanctions', 'config'],
    queryFn: () => sanctionsAutomationApi.getConfig(),
    staleTime: 300000, // 5 minutes
    retry: 1,
  });
}

export function useSanctionReasons() {
  return useQuery({
    queryKey: ['sanctions', 'reasons'],
    queryFn: () => sanctionsAutomationApi.getReasons(),
    staleTime: 300000, // 5 minutes
    retry: 1,
  });
}

export function useDelayedTrips() {
  return useQuery({
    queryKey: ['sanctions', 'delayed-trips'],
    queryFn: () => sanctionsAutomationApi.getDelayedTrips(),
    refetchInterval: 60000, // Refetch every minute
    retry: 1,
  });
}

export function useGenerateAutomaticSanctions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: import('@/types/api').GenerateAutomaticSanctionsInput) =>
      sanctionsAutomationApi.generateAutomatic(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sanctions'] });
      queryClient.invalidateQueries({ queryKey: ['sanctions', 'delayed-trips'] });
      queryClient.invalidateQueries({ queryKey: ['sanctions', 'automation-stats'] });
    },
  });
}

export function useCheckRecurringOffense(driverId: string | undefined) {
  return useQuery({
    queryKey: ['sanctions', 'recurring', driverId],
    queryFn: () => sanctionsAutomationApi.checkRecurring(driverId!),
    enabled: !!driverId,
    retry: 1,
  });
}

export function useProcessDriverSanctions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (driverId: string) => sanctionsAutomationApi.processDriver(driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sanctions'] });
      queryClient.invalidateQueries({ queryKey: ['sanctions', 'delayed-trips'] });
      queryClient.invalidateQueries({ queryKey: ['sanctions', 'automation-stats'] });
    },
  });
}

export function useSanctionAutomationStats() {
  return useQuery({
    queryKey: ['sanctions', 'automation-stats'],
    queryFn: () => sanctionsAutomationApi.getAutomationStats(),
    retry: 1,
  });
}

// ============ Driver History Hooks ============
export function useDriverHistory(params?: import('@/types/api').DriverHistoryListParams) {
  return useQuery({
    queryKey: ['driverHistory', params],
    queryFn: () => driverHistoryApi.getAll(params),
  });
}

export function useDriverHistoryRecord(id: string | undefined) {
  return useQuery({
    queryKey: ['driverHistory', id],
    queryFn: () => driverHistoryApi.getById(id!),
    enabled: !!id,
  });
}

export function useDriverEventTypes() {
  return useQuery({
    queryKey: ['driverHistory', 'eventTypes'],
    queryFn: () => driverHistoryApi.getEventTypes(),
    staleTime: 300000, // 5 minutes
  });
}

export function useDriverHistoryStats() {
  return useQuery({
    queryKey: ['driverHistory', 'stats'],
    queryFn: () => driverHistoryApi.getStats(),
  });
}

export function useDriverHistoryByDriver(driverId: string | undefined) {
  return useQuery({
    queryKey: ['driverHistory', 'driver', driverId],
    queryFn: () => driverHistoryApi.getByDriver(driverId!),
    enabled: !!driverId,
  });
}

export function useDriverTimeline(driverId: string | undefined) {
  return useQuery({
    queryKey: ['driverHistory', 'timeline', driverId],
    queryFn: () => driverHistoryApi.getTimeline(driverId!),
    enabled: !!driverId,
  });
}

export function useDriverSummary(driverId: string | undefined) {
  return useQuery({
    queryKey: ['driverHistory', 'summary', driverId],
    queryFn: () => driverHistoryApi.getSummary(driverId!),
    enabled: !!driverId,
  });
}

export function useCreateDriverHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: import('@/types/api').CreateDriverHistoryInput) => driverHistoryApi.create(data),
    onSuccess: (_, { driverId }) => {
      queryClient.invalidateQueries({ queryKey: ['driverHistory'] });
      queryClient.invalidateQueries({ queryKey: ['driverHistory', 'driver', driverId] });
      queryClient.invalidateQueries({ queryKey: ['driverHistory', 'timeline', driverId] });
      queryClient.invalidateQueries({ queryKey: ['driverHistory', 'summary', driverId] });
    },
  });
}

export function useDeleteDriverHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => driverHistoryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverHistory'] });
    },
  });
}

// ============ Additional Hooks for Sprint 7 ============

export function useDriversList(params?: import('@/types/api').DriverListParams) {
  return useQuery({
    queryKey: ['drivers', params],
    queryFn: () => driversApi.getAll(params),
  });
}

export function useTrucksList(params?: import('@/types/api').TruckListParams) {
  return useQuery({
    queryKey: ['trucks', params],
    queryFn: () => trucksApi.getAll(params),
  });
}

// ==========================================
// Sprint 7 Finance Enhancement: Cash Flow, Payments, SIN Export, Notifications
// ==========================================

// ============ Cash Flow Hooks ============
export function useCashFlow(params?: import('@/types/api').CashFlowListParams) {
  return useQuery({
    queryKey: ['cashFlow', params],
    queryFn: () => cashFlowApi.getAll(params),
  });
}

export function useCashFlowRecord(id: string | undefined) {
  return useQuery({
    queryKey: ['cashFlow', id],
    queryFn: () => cashFlowApi.getById(id!),
    enabled: !!id,
  });
}

export function useCashFlowTypes() {
  return useQuery({
    queryKey: ['cashFlow', 'types'],
    queryFn: () => cashFlowApi.getTypes(),
    staleTime: 300000,
  });
}

export function useCashFlowCategories() {
  return useQuery({
    queryKey: ['cashFlow', 'categories'],
    queryFn: () => cashFlowApi.getCategories(),
    staleTime: 300000,
  });
}

export function useCashFlowPaymentMethods() {
  return useQuery({
    queryKey: ['cashFlow', 'paymentMethods'],
    queryFn: () => cashFlowApi.getPaymentMethods(),
    staleTime: 300000,
  });
}

export function useCashFlowSummary(params?: { dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: ['cashFlow', 'summary', params],
    queryFn: () => cashFlowApi.getSummary(params),
  });
}

export function useCashFlowDaily(date: string | undefined) {
  return useQuery({
    queryKey: ['cashFlow', 'daily', date],
    queryFn: () => cashFlowApi.getDaily(date!),
    enabled: !!date,
  });
}

export function useCashFlowMonthly(year: number, month: number) {
  return useQuery({
    queryKey: ['cashFlow', 'monthly', year, month],
    queryFn: () => cashFlowApi.getMonthly(year, month),
  });
}

export function useCreateCashFlow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: import('@/types/api').CreateCashFlowInput) => cashFlowApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashFlow'] });
      queryClient.invalidateQueries({ queryKey: ['cashFlow', 'summary'] });
    },
  });
}

export function useUpdateCashFlow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: import('@/types/api').UpdateCashFlowInput }) =>
      cashFlowApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['cashFlow'] });
      queryClient.invalidateQueries({ queryKey: ['cashFlow', id] });
      queryClient.invalidateQueries({ queryKey: ['cashFlow', 'summary'] });
    },
  });
}

export function useDeleteCashFlow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cashFlowApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashFlow'] });
      queryClient.invalidateQueries({ queryKey: ['cashFlow', 'summary'] });
    },
  });
}

// ============ Payments Hooks ============
export function usePayments(params?: import('@/types/api').PaymentListParams) {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: () => paymentsApi.getAll(params),
  });
}

export function usePayment(id: string | undefined) {
  return useQuery({
    queryKey: ['payments', id],
    queryFn: () => paymentsApi.getById(id!),
    enabled: !!id,
  });
}

export function usePaymentTypes() {
  return useQuery({
    queryKey: ['payments', 'types'],
    queryFn: () => paymentsApi.getTypes(),
    staleTime: 300000,
  });
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: ['payments', 'methods'],
    queryFn: () => paymentsApi.getMethods(),
    staleTime: 300000,
  });
}

export function usePaymentStatuses() {
  return useQuery({
    queryKey: ['payments', 'statuses'],
    queryFn: () => paymentsApi.getStatuses(),
    staleTime: 300000,
  });
}

export function usePendingPayments() {
  return useQuery({
    queryKey: ['payments', 'pending'],
    queryFn: () => paymentsApi.getPending(),
  });
}

export function usePaymentStats(params?: { driverId?: string; dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: ['payments', 'stats', params],
    queryFn: () => paymentsApi.getStats(params),
  });
}

export function usePaymentsByDriver(driverId: string | undefined) {
  return useQuery({
    queryKey: ['payments', 'driver', driverId],
    queryFn: () => paymentsApi.getByDriver(driverId!),
    enabled: !!driverId,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: import('@/types/api').CreatePaymentInput) => paymentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'stats'] });
    },
  });
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: import('@/types/api').UpdatePaymentInput }) =>
      paymentsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments', id] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'stats'] });
    },
  });
}

export function useApprovePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.approve(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments', id] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'stats'] });
    },
  });
}

export function useCompletePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paymentDate }: { id: string; paymentDate?: string }) =>
      paymentsApi.complete(id, paymentDate),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments', id] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'stats'] });
    },
  });
}

export function useCancelPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      paymentsApi.cancel(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments', id] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'stats'] });
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'stats'] });
    },
  });
}

// ============ SIN Export Hooks ============
export function useSINExports(params?: import('@/types/api').SINExportListParams) {
  return useQuery({
    queryKey: ['sinExports', params],
    queryFn: () => sinExportApi.getAll(params),
  });
}

export function useSINExport(id: string | undefined) {
  return useQuery({
    queryKey: ['sinExports', id],
    queryFn: () => sinExportApi.getById(id!),
    enabled: !!id,
  });
}

export function useSINExportStatuses() {
  return useQuery({
    queryKey: ['sinExports', 'statuses'],
    queryFn: () => sinExportApi.getStatuses(),
    staleTime: 300000,
  });
}

export function usePendingSINExports() {
  return useQuery({
    queryKey: ['sinExports', 'pending'],
    queryFn: () => sinExportApi.getPending(),
  });
}

export function useFailedSINExports() {
  return useQuery({
    queryKey: ['sinExports', 'failed'],
    queryFn: () => sinExportApi.getFailed(),
  });
}

export function useSINExportStats() {
  return useQuery({
    queryKey: ['sinExports', 'stats'],
    queryFn: () => sinExportApi.getStats(),
  });
}

export function useSINExportByInvoice(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ['sinExports', 'invoice', invoiceId],
    queryFn: () => sinExportApi.getByInvoice(invoiceId!),
    enabled: !!invoiceId,
  });
}

export function useSINInvoiceJSON(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ['sinExports', 'invoiceJson', invoiceId],
    queryFn: () => sinExportApi.getInvoiceJson(invoiceId!),
    enabled: !!invoiceId,
  });
}

export function useCreateSINExport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: string) => sinExportApi.create(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sinExports'] });
      queryClient.invalidateQueries({ queryKey: ['sinExports', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['sinExports', 'stats'] });
    },
  });
}

export function useProcessSINExport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sinExportApi.process(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['sinExports'] });
      queryClient.invalidateQueries({ queryKey: ['sinExports', id] });
      queryClient.invalidateQueries({ queryKey: ['sinExports', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['sinExports', 'stats'] });
    },
  });
}

export function useRetrySINExport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sinExportApi.retry(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['sinExports'] });
      queryClient.invalidateQueries({ queryKey: ['sinExports', id] });
      queryClient.invalidateQueries({ queryKey: ['sinExports', 'failed'] });
      queryClient.invalidateQueries({ queryKey: ['sinExports', 'stats'] });
    },
  });
}

// ============ Notifications Hooks ============
export function useNotifications(params?: import('@/types/api').NotificationListParams) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationsApi.getAll(params),
  });
}

export function useNotification(id: string | undefined) {
  return useQuery({
    queryKey: ['notifications', id],
    queryFn: () => notificationsApi.getById(id!),
    enabled: !!id,
  });
}

export function useNotificationTypes() {
  return useQuery({
    queryKey: ['notifications', 'types'],
    queryFn: () => notificationsApi.getTypes(),
    staleTime: 300000,
  });
}

export function useNotificationPriorities() {
  return useQuery({
    queryKey: ['notifications', 'priorities'],
    queryFn: () => notificationsApi.getPriorities(),
    staleTime: 300000,
  });
}

export function useNotificationCounts() {
  return useQuery({
    queryKey: ['notifications', 'counts'],
    queryFn: () => notificationsApi.getCounts(),
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useUnreadNotifications() {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationsApi.getUnread(),
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: import('@/types/api').CreateNotificationInput) => notificationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'counts'] });
    },
  });
}

export function useCreateBulkNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: import('@/types/api').CreateNotificationInput[]) => notificationsApi.createBulk(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'counts'] });
    },
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', id] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'counts'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'counts'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'counts'] });
    },
  });
}

export function useDeleteReadNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.deleteRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'counts'] });
    },
  });
}

// ==========================================
// DocumentTypes and Tramos
// ==========================================

// ============ DocumentTypes Hooks ============
export function useDocumentTypes(params?: import('@/types/api').DocumentTypeListParams) {
  return useQuery({
    queryKey: ['documentTypes', params],
    queryFn: () => documentTypesApi.getAll(params),
  });
}

export function useDocumentType(id: string | undefined) {
  return useQuery({
    queryKey: ['documentTypes', id],
    queryFn: () => documentTypesApi.getById(id!),
    enabled: !!id,
  });
}

export function useActiveDocumentTypes() {
  return useQuery({
    queryKey: ['documentTypes', 'active'],
    queryFn: () => documentTypesApi.getActive(),
    staleTime: 300000,
  });
}

export function useRequiredDocumentTypes(forSupportOnly?: boolean) {
  return useQuery({
    queryKey: ['documentTypes', 'required', forSupportOnly],
    queryFn: () => documentTypesApi.getRequired(forSupportOnly),
    staleTime: 300000,
  });
}

export function useDocumentTypeStats() {
  return useQuery({
    queryKey: ['documentTypes', 'stats'],
    queryFn: () => documentTypesApi.getStats(),
  });
}

export function useCreateDocumentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: import('@/types/api').CreateDocumentTypeInput) => documentTypesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentTypes'] });
      queryClient.invalidateQueries({ queryKey: ['documentTypes', 'stats'] });
    },
  });
}

export function useUpdateDocumentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: import('@/types/api').UpdateDocumentTypeInput }) =>
      documentTypesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['documentTypes'] });
      queryClient.invalidateQueries({ queryKey: ['documentTypes', id] });
      queryClient.invalidateQueries({ queryKey: ['documentTypes', 'stats'] });
    },
  });
}

export function useDeleteDocumentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentTypesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentTypes'] });
      queryClient.invalidateQueries({ queryKey: ['documentTypes', 'stats'] });
    },
  });
}

export function useRestoreDocumentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentTypesApi.restore(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['documentTypes'] });
      queryClient.invalidateQueries({ queryKey: ['documentTypes', id] });
      queryClient.invalidateQueries({ queryKey: ['documentTypes', 'stats'] });
    },
  });
}

export function useReorderDocumentTypes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: Array<{ id: string; displayOrder: number }>) => documentTypesApi.reorder(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentTypes'] });
    },
  });
}

// ============ Tramos Hooks ============
export function useTramos(params?: import('@/types/api').TramoListParams) {
  return useQuery({
    queryKey: ['tramos', params],
    queryFn: () => tramosApi.getAll(params),
  });
}

export function useTramo(id: string | undefined) {
  return useQuery({
    queryKey: ['tramos', id],
    queryFn: () => tramosApi.getById(id!),
    enabled: !!id,
  });
}

export function useActiveTramos() {
  return useQuery({
    queryKey: ['tramos', 'active'],
    queryFn: () => tramosApi.getActive(),
    staleTime: 300000,
  });
}

export function useTramoOrigins() {
  return useQuery({
    queryKey: ['tramos', 'origins'],
    queryFn: () => tramosApi.getOrigins(),
    staleTime: 300000,
  });
}

export function useTramoDestinations() {
  return useQuery({
    queryKey: ['tramos', 'destinations'],
    queryFn: () => tramosApi.getDestinations(),
    staleTime: 300000,
  });
}

export function useTramoStats() {
  return useQuery({
    queryKey: ['tramos', 'stats'],
    queryFn: () => tramosApi.getStats(),
  });
}

export function useTramosByOrigin(origin: string | undefined) {
  return useQuery({
    queryKey: ['tramos', 'origin', origin],
    queryFn: () => tramosApi.getByOrigin(origin!),
    enabled: !!origin,
  });
}

export function useTramosByDestination(destination: string | undefined) {
  return useQuery({
    queryKey: ['tramos', 'destination', destination],
    queryFn: () => tramosApi.getByDestination(destination!),
    enabled: !!destination,
  });
}

export function useCreateTramo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: import('@/types/api').CreateTramoInput) => tramosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tramos'] });
      queryClient.invalidateQueries({ queryKey: ['tramos', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['tramos', 'origins'] });
      queryClient.invalidateQueries({ queryKey: ['tramos', 'destinations'] });
    },
  });
}

export function useUpdateTramo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: import('@/types/api').UpdateTramoInput }) =>
      tramosApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tramos'] });
      queryClient.invalidateQueries({ queryKey: ['tramos', id] });
      queryClient.invalidateQueries({ queryKey: ['tramos', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['tramos', 'origins'] });
      queryClient.invalidateQueries({ queryKey: ['tramos', 'destinations'] });
    },
  });
}

export function useDeleteTramo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tramosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tramos'] });
      queryClient.invalidateQueries({ queryKey: ['tramos', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['tramos', 'origins'] });
      queryClient.invalidateQueries({ queryKey: ['tramos', 'destinations'] });
    },
  });
}

export function useRestoreTramo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tramosApi.restore(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['tramos'] });
      queryClient.invalidateQueries({ queryKey: ['tramos', id] });
      queryClient.invalidateQueries({ queryKey: ['tramos', 'stats'] });
    },
  });
}

// ============ Document Automation Hooks ============
export const useDocumentAutomationStats = () =>
  useQuery({
    queryKey: ['document-automation', 'stats'],
    queryFn: () => documentAutomationApi.getStats(),
    staleTime: 5 * 60 * 1000,
  });

export const useDocumentChecklist = (tripId: string | null | undefined) =>
  useQuery({
    queryKey: ['document-automation', 'checklist', tripId],
    queryFn: () => documentAutomationApi.getChecklist(tripId!),
    enabled: !!tripId,
  });

export const useVerifyTripDocuments = (tripId: string | null | undefined) =>
  useQuery({
    queryKey: ['document-automation', 'verify', tripId],
    queryFn: () => documentAutomationApi.verifyTrip(tripId!),
    enabled: false,
  });

export const useCreateDocumentsForTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tripId, documentTypeIds }: { tripId: string; documentTypeIds?: string[] }) =>
      documentAutomationApi.createDocumentsForTrip(tripId, documentTypeIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-automation'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};

export const useBatchCreateDocuments = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: import('@/types/api').BatchCreateDocumentsInput) =>
      documentAutomationApi.batchCreateDocuments(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-automation'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};

// ==========================================
// Trip Reports Hooks
// ==========================================

export function useTripReports(params?: import('@/types/api').TripReportsListParams) {
  return useQuery({
    queryKey: ['trip-reports', params],
    queryFn: () => tripReportsApi.getAll(params),
  });
}

export function useTripReportsStats() {
  return useQuery({
    queryKey: ['trip-reports', 'stats'],
    queryFn: () => tripReportsApi.getStats(),
    staleTime: 30000,
  });
}

export function useTripReportsBlockedPayments(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['trip-reports', 'blocked-payments', params],
    queryFn: () => tripReportsApi.getBlockedPayments(params),
  });
}

export function useTripReportsIncompleteDocuments(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['trip-reports', 'incomplete-documents', params],
    queryFn: () => tripReportsApi.getIncompleteDocuments(params),
  });
}

export function useTripReportByBL(blNumber: string | undefined) {
  return useQuery({
    queryKey: ['trip-reports', 'bl', blNumber],
    queryFn: () => tripReportsApi.getByBL(blNumber!),
    enabled: !!blNumber,
  });
}

export function useTripReportBLSummary(blNumber: string | undefined) {
  return useQuery({
    queryKey: ['trip-reports', 'bl-summary', blNumber],
    queryFn: () => tripReportsApi.getBLSummary(blNumber!),
    enabled: !!blNumber,
  });
}

export function useGenerateTripReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tripId: string) => tripReportsApi.generateFromTrip(tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-reports'] });
    },
  });
}

export function useGenerateMissingTripReports() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => tripReportsApi.generateMissing(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-reports'] });
    },
  });
}

export function useUpdateTripReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: import('@/types/api').UpdateTripReportInput }) =>
      tripReportsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['trip-reports'] });
      queryClient.invalidateQueries({ queryKey: ['trip-reports', id] });
    },
  });
}

export function useRegenerateTripReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tripReportsApi.regenerate(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['trip-reports'] });
      queryClient.invalidateQueries({ queryKey: ['trip-reports', id] });
    },
  });
}

export function useDeleteTripReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tripReportsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-reports'] });
    },
  });
}
