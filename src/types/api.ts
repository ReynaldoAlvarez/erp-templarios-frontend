// ==========================================
// API Types for ERP TEMPLARIOS S.R.L.
// ==========================================

// ============ User Types ============
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  phone?: string;
  avatar?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  emailVerified?: boolean;
  lastLoginAt?: string | null;
  company?: Company;
  roles: UserRole[];
  permissions?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserRole {
  id: string;
  name: string;
  color?: string;
}

export interface Company {
  id: string;
  name: string;
  nit: string;
  address: string;
  phone: string;
  email: string;
  logo?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleIds: string[];
  companyId?: string;
}

export interface UpdateUserInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleIds?: string[];
  isActive?: boolean;
}

// ============ Role Types ============
export interface Role {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
  permissions?: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleInput {
  name: string;
  description?: string;
  color?: string;
  permissionIds?: string[];
}

// ============ Permission Types ============
export interface Permission {
  id: string;
  module: string;
  resource: string;
  action: string;
  description?: string;
  name: string;
  createdAt: string;
}

// ============ Auth Types ============
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresIn?: number;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ============ API Error Types ============
export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiError;

// ============ Pagination Types ============
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============ User List Params ============
export interface UserListParams extends PaginationParams {
  status?: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
}

// ============ Navigation Types ============
export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavItem[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

// ============ Cliente Types ============
// Backend field names (English)
export interface Client {
  id: string;
  businessName: string;      // Razón social
  nit: string;               // NIT
  contactName?: string;      // Nombre contacto
  phone?: string;            // Teléfono
  email?: string;            // Email
  address?: string;          // Dirección
  hasCredit: boolean;        // Tiene crédito
  creditLimit?: string;      // Límite de crédito (string from backend)
  isActive: boolean;         // Está activo
  billsOfLadingCount?: number;
  invoicesCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Alias for backward compatibility
export type Cliente = Client;

export interface CreateClientInput {
  businessName: string;
  nit: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  hasCredit?: boolean;
  creditLimit?: number;
}

export type CreateClienteInput = CreateClientInput;

export interface UpdateClientInput {
  businessName?: string;
  nit?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  hasCredit?: boolean;
  creditLimit?: number;
}

export type UpdateClienteInput = UpdateClientInput;

export interface ClientListParams extends PaginationParams {
  isActive?: boolean;
  hasCredit?: boolean;
}

export type ClienteListParams = ClientListParams;

// ============ BL (Bill of Lading) Types ============
// Backend field names (English)
export type BLStatus = 'SCHEDULED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
export type DeliveryType = 'DIRECT' | 'INDIRECT';

export interface BLClient {
  id: string;
  businessName: string;
  nit: string;
}

export interface BLProgress {
  totalWeight: number;
  transportedWeight: number;
  remainingWeight: number;
  progressPercent: number;
  deliveredTrips: number;
  totalTrips: number;
}

export interface BillOfLading {
  id: string;
  blNumber: string;          // Número de BL
  totalWeight: string;       // Peso total (string from backend)
  unitCount: number;         // Cantidad de unidades
  cargoType?: string;        // Tipo de carga
  originPort: string;        // Puerto de origen
  customsPoint: string;      // Punto aduanero
  finalDestination: string;  // Destino final
  vessel?: string;           // Nave
  consignee?: string;        // Consignatario
  deliveryType: DeliveryType;
  clientId: string;
  client?: BLClient;
  status: BLStatus;
  approvedById?: string;
  approvedAt?: string;
  tripsCount?: number;
  progress?: BLProgress;
  createdAt: string;
  updatedAt: string;
}

// Alias for backward compatibility
export type BL = BillOfLading;

export interface CreateBLInput {
  blNumber: string;
  totalWeight: number;
  unitCount: number;
  cargoType?: string;
  originPort: string;
  customsPoint: string;
  finalDestination: string;
  vessel?: string;
  consignee?: string;
  deliveryType?: DeliveryType;
  clientId: string;
}

export interface UpdateBLInput {
  blNumber?: string;
  totalWeight?: number;
  unitCount?: number;
  cargoType?: string;
  originPort?: string;
  customsPoint?: string;
  finalDestination?: string;
  vessel?: string;
  consignee?: string;
  deliveryType?: DeliveryType;
  clientId?: string;
}

export interface CalcularFlotaResult {
  camionesNecesarios: number;
  capacidadTotal: number;
  pesoRestante: number;
}

export interface BLListParams extends PaginationParams {
  status?: BLStatus;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ============ Truck (Camión) Types ============
export type TruckStatus = 'AVAILABLE' | 'SCHEDULED' | 'IN_TRANSIT' | 'MAINTENANCE';

export interface Truck {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  axles?: number;
  capacityTons: number;
  operationPermit?: string;
  operationPermitExpiry?: string;
  mileage: number;
  status: TruckStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTruckInput {
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  axles?: number;
  capacityTons: number;
  operationPermit?: string;
  operationPermitExpiry?: string;
  mileage?: number;
}

export interface UpdateTruckInput {
  plateNumber?: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  axles?: number;
  capacityTons?: number;
  operationPermit?: string;
  operationPermitExpiry?: string;
  mileage?: number;
}

export interface TruckListParams extends PaginationParams {
  status?: TruckStatus;
  isActive?: boolean;
}

// ============ Trailer (Remolque) Types ============
export interface Trailer {
  id: string;
  plateNumber: string;
  type: string;
  brand?: string;
  year?: number;
  capacityTons: number;
  operationPermit?: string;
  operationPermitExpiry?: string;
  truckId?: string;
  truck?: Truck;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTrailerInput {
  plateNumber: string;
  type: string;
  brand?: string;
  year?: number;
  capacityTons: number;
  operationPermit?: string;
  operationPermitExpiry?: string;
  truckId?: string;
}

export interface UpdateTrailerInput {
  plateNumber?: string;
  type?: string;
  brand?: string;
  year?: number;
  capacityTons?: number;
  operationPermit?: string;
  operationPermitExpiry?: string;
}

export interface TrailerListParams extends PaginationParams {
  truckId?: string;
  isActive?: boolean;
}

// ============ Driver (Conductor) Types ============
export type ContractType = 'MONTHLY' | 'TRIP';

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  identityCard: string;
  phone?: string;
  email?: string;
  address?: string;
  birthDate?: string;
  salary?: number;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  contractType: ContractType;
  isAvailable: boolean;
  isActive: boolean;
  branchId?: string;
  branch?: { id: string; name: string };
  totalTrips?: number;
  totalWeightTransported?: number;
  avgDeliveryHours?: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDriverInput {
  firstName: string;
  lastName: string;
  identityCard: string;
  phone?: string;
  email?: string;
  address?: string;
  birthDate?: string;
  salary?: number;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  contractType: ContractType;
  branchId: string;
}

export interface UpdateDriverInput {
  firstName?: string;
  lastName?: string;
  identityCard?: string;
  phone?: string;
  email?: string;
  address?: string;
  birthDate?: string;
  salary?: number;
  licenseNumber?: string;
  licenseCategory?: string;
  licenseExpiryDate?: string;
  contractType?: ContractType;
  branchId?: string;
}

export interface DriverListParams extends PaginationParams {
  isAvailable?: boolean;
  contractType?: ContractType;
  isActive?: boolean;
}

export interface DriverStats {
  totalTrips: number;
  totalWeightTransported: number;
  avgDeliveryHours: number;
  rating: number;
  totalGastos: number;
}

// ============ Expense (Gasto) Types ============
export type ExpenseCategory = 'FUEL' | 'TOLL' | 'FOOD' | 'MAINTENANCE' | 'OTHER';

export interface Expense {
  id: string;
  driverId: string;
  driver?: Driver;
  driverName?:string;
  tripId?: string;
  category: ExpenseCategory;
  concept: string;
  amount: number;
  expenseDate: string;
  notes?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseInput {
  driverId: string;
  tripId?: string;
  category: ExpenseCategory;
  concept: string;
  amount: number;
  expenseDate: string;
  notes?: string;
  receiptUrl?: string;
}

export interface UpdateExpenseInput {
  driverId?: string;
  tripId?: string;
  category?: ExpenseCategory;
  concept?: string;
  amount?: number;
  expenseDate?: string;
  notes?: string;
  receiptUrl?: string;
}

export interface ExpenseListParams extends PaginationParams {
  driverId?: string;
  tripId?: string;
  category?: ExpenseCategory;
  dateFrom?: string;
  dateTo?: string;
}

export interface ExpenseCategoryOption {
  value: ExpenseCategory;
  label: string;
}

export interface ExpenseStats {
  totalExpenses: number;
  byCategory: Record<ExpenseCategory, number>;
  count: number;
}

// ============ Trip Types ============
export type TripStatus = 'SCHEDULED' | 'IN_TRANSIT' | 'AT_BORDER' | 'DELIVERED' | 'CANCELLED';

export interface Trip {
  id: string;
  micDta: string;
  departureDate: string;
  arrivalDate?: string | null;
  billOfLadingId: string;
  truckId: string;
  driverId: string;
  trailerId?: string | null;
  weight: string;  // STRING del backend
  ratePerTon?: string;  // STRING del backend
  notes?: string;
  status: TripStatus;
  billOfLading?: {
    id: string;
    blNumber: string;
    client?: { id: string; businessName: string };
  };
  truck?: { id: string; plateNumber: string; brand?: string; model?: string };
  driver?: {
    id: string;
    employeeId?: string;
    licenseNumber: string;
    licenseCategory: string;
    licenseExpiryDate: string;
    contractType: 'MONTHLY' | 'TRIP';
    isAvailable: boolean;
    rating?: string;
    totalTrips: number;
    isActive: boolean;
    employee?: {
      firstName: string;
      lastName: string;
    };
    firstName?: string;
    lastName?: string;
    fullName?: string;
    phone?: string;
  };
  trailer?: { id: string; plateNumber: string; type: string };
  routes?: Route[];
  borderCrossingsCount?: number;
  documentsCount?: number;
  routesCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTripInput {
  micDta: string;
  departureDate: string;
  arrivalDate?: string;
  billOfLadingId: string;
  truckId: string;
  driverId: string;
  trailerId?: string;
  weight: number;
  ratePerTon?: number;
  notes?: string;
}

export interface UpdateTripInput {
  micDta?: string;
  departureDate?: string;
  arrivalDate?: string;
  truckId?: string;
  driverId?: string;
  trailerId?: string;
  weight?: number;
  ratePerTon?: number;
  notes?: string;
}

export interface TripListParams extends PaginationParams {
  status?: TripStatus;
  blId?: string;
  driverId?: string;
  truckId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface TripStats {
  total: number;
  byStatus: Record<TripStatus, number>;
  totalWeight: number;
}

// Available Resources for Trip Creation
export interface AvailableResources {
  trucks: Array<{ id: string; plateNumber: string; brand: string; model: string; capacityTons: number }>;
  drivers: Array<{ id: string; licenseNumber: string; firstName: string; lastName: string; fullName: string }>;
  trailers: Array<{ id: string; plateNumber: string; type: string; capacityTons: number }>;
}

// ============ Document Types ============
export type DocumentStatus = 'PENDING' | 'RECEIVED' | 'VERIFIED';

export interface TripDocument {
  id: string;
  tripId: string;
  documentType: string;
  documentNumber?: string;
  documentDate: string;
  status: DocumentStatus;
  fileUrl?: string;
  isLocalFile: boolean;
  notes?: string;
  receivedById?: string;
  receivedAt?: string;
  trip?: {
    id: string;
    micDta: string;
    billOfLading?: { blNumber: string };
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentInput {
  tripId: string;
  documentType: string;
  documentNumber?: string;
  documentDate?: string;
  fileUrl?: string;
  isLocalFile?: boolean;
  notes?: string;
}

export interface UpdateDocumentInput {
  documentType?: string;
  documentNumber?: string;
  documentDate?: string;
  fileUrl?: string;
  isLocalFile?: boolean;
  notes?: string;
}

export interface DocumentListParams extends PaginationParams {
  tripId?: string;
  status?: DocumentStatus;
  documentType?: string;
}

export interface DocumentStats {
  total: number;
  pending: number;
  byStatus: Record<DocumentStatus, number>;
}

// ============ Settlement Types ============
export type SettlementStatus = 'PENDING' | 'APPROVED' | 'PAID';

export interface Settlement {
  id: string;
  tripId: string;
  freightUsd: number;
  freightBob: number;
  exchangeRate: number;
  pricePerTon: number;
  taxIt3Percent: number;
  retention7Percent: number;
  externalCommission?: number;
  advance: number;
  netPayment: number;
  status: SettlementStatus;
  approvedById?: string;
  approvedAt?: string;
  paidById?: string;
  paidAt?: string;
  notes?: string;
  trip?: {
    id: string;
    micDta?: string;
    billOfLading?: { blNumber: string };
    driver?: { firstName?: string; lastName?: string; fullName?: string };
    truck?: { plateNumber: string };
  };
  approvedBy?: { firstName: string; lastName: string };
  paidBy?: { firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateSettlementInput {
  tripId: string;
  freightUsd: number;
  freightBob: number;
  exchangeRate: number;
  pricePerTon: number;
  taxIt3Percent: number;
  retention7Percent: number;
  externalCommission?: number;
  advance?: number;
  notes?: string;
}

export interface UpdateSettlementInput {
  freightUsd?: number;
  freightBob?: number;
  exchangeRate?: number;
  pricePerTon?: number;
  taxIt3Percent?: number;
  retention7Percent?: number;
  externalCommission?: number;
  advance?: number;
  notes?: string;
}

export interface SettlementListParams extends PaginationParams {
  status?: SettlementStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface SettlementStats {
  total: number;
  byStatus: Record<SettlementStatus, { count: number; total: number }>;
  totals: {
    freightBob: number;
    taxIt3: number;
    retention: number;
    netPayment: number;
  };
}

// ============ Invoice Types ============
export type InvoiceStatus = 'PENDING' | 'ISSUED' | 'PAID' | 'CANCELLED';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  invoiceDate: string;
  totalAmount: number;
  amountUsd?: number;
  exchangeRate?: number;
  status: InvoiceStatus;
  approvedById?: string;
  approvedAt?: string;
  issuedAt?: string;
  paidAt?: string;
  notes?: string;
  client?: { id: string; businessName: string; nit: string };
  approvedBy?: { firstName: string; lastName: string };
  invoiceTrips?: Array<{
    trip: {
      id: string;
      micDta?: string;
      billOfLading?: { blNumber: string };
    };
  }>;
  tripsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceInput {
  invoiceNumber: string;
  clientId: string;
  invoiceDate?: string;
  totalAmount: number;
  amountUsd?: number;
  exchangeRate?: number;
  notes?: string;
  tripIds?: string[];
}

export interface UpdateInvoiceInput {
  invoiceNumber?: string;
  clientId?: string;
  invoiceDate?: string;
  totalAmount?: number;
  amountUsd?: number;
  exchangeRate?: number;
  notes?: string;
  tripIds?: string[];
}

export interface InvoiceListParams extends PaginationParams {
  status?: InvoiceStatus;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface InvoiceStats {
  total: number;
  byStatus: Record<InvoiceStatus, { count: number; total: number }>;
  totalAmount: number;
}

// ============ Border Crossing Types ============
export type BorderChannel = 'GREEN' | 'YELLOW' | 'RED';

export interface BorderChannelHistory {
  id: string;
  borderCrossingId: string;
  channel: BorderChannel;
  changedAt: string;
  reason?: string;
  notes?: string;
  responsible?: string;
}

export interface BorderCrossing {
  id: string;
  tripId: string;
  borderName: string;
  arrivedAt: string;
  exitedAt?: string;
  channel?: BorderChannel;
  channelHistory?: BorderChannelHistory[];
  trip?: {
    id: string;
    micDta: string;
    billOfLading?: { blNumber: string };
  };
  createdAt: string;
}

export interface CreateBorderCrossingInput {
  tripId: string;
  borderName: string;
  arrivedAt?: string;
}

export interface UpdateBorderCrossingInput {
  borderName?: string;
  arrivedAt?: string;
  exitedAt?: string;
  channel?: BorderChannel;
}

export interface BorderCrossingListParams extends PaginationParams {
  tripId?: string;
  active?: boolean;
}

export interface BorderCrossingStats {
  total: number;
  active: number;
  byBorder: Record<string, number>;
  avgDurationHours: number;
}

// ============ Route Types ============
export interface Route {
  id: string;
  tripId: string;
  origin: string;
  destination: string;
  distanceKm?: number;
  rate?: number;
  durationHours?: number;
  createdAt: string;
}

export interface CreateRouteInput {
  tripId: string;
  origin: string;
  destination: string;
  distanceKm?: number;
  rate?: number;
  durationHours?: number;
}

export interface UpdateRouteInput {
  origin?: string;
  destination?: string;
  distanceKm?: number;
  rate?: number;
  durationHours?: number;
}

// ============ Dashboard Types ============
export interface DashboardOverview {
  totalTrips: number;
  totalWeight: number;
  activeDrivers: number;
  activeTrucks: number;
}

export interface TripsByStatus {
  scheduled: number;
  inTransit: number;
  atBorder: number;
  delivered: number;
  cancelled: number;
}

export interface DashboardPending {
  documents: number;
  settlements: number;
  invoices: number;
}

export interface RecentTrip {
  id: string;
  micDta: string;
  status: string;
  weight: number;
  client: string;
  truck: string;
  driver: string;
  departureDate: string;
}

export interface MainDashboard {
  overview: DashboardOverview;
  tripsByStatus: TripsByStatus;
  pending: DashboardPending;
  recentTrips: RecentTrip[];
}

export interface FinancialDashboardSettlements {
  count: number;
  totalFreightUsd: number;
  totalFreightBob: number;
  totalNetPayment: number;
  pendingCount: number;
  pendingAmount: number;
}

export interface OverdueInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  totalAmount: number;
  issuedAt: string;
  daysOverdue: number;
}

export interface FinancialDashboardInvoices {
  count: number;
  totalAmount: number;
  overdueCount: number;
  overdueAmount: number;
  overdueInvoices: OverdueInvoice[];
}

export interface ExpenseByCategory {
  count: number;
  total: number;
}

export interface FinancialDashboardExpenses {
  count: number;
  total: number;
  byCategory: Record<string, ExpenseByCategory>;
}

export interface FinancialDashboard {
  settlements: FinancialDashboardSettlements;
  invoices: FinancialDashboardInvoices;
  expenses: FinancialDashboardExpenses;
}

export interface ActiveBorderCrossing {
  id: string;
  borderName: string;
  arrivedAt: string;
  trip: {
    micDta: string;
    client: string;
    driver: string;
    truck: string;
  };
}

export interface OperationalDashboardBorders {
  totalCrossings: number;
  activeCrossings: ActiveBorderCrossing[];
  channelDistribution: Record<BorderChannel, number>;
}

export interface OperationalDashboardDocuments {
  byStatus: Record<DocumentStatus, number>;
}

export interface TopDriver {
  id: string;
  name: string;
  totalTrips: number;
  rating: number;
}

export interface TopTruck {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  totalTrips: number;
}

export interface TopRoute {
  origin: string;
  destination: string;
  tripCount: number;
}

export interface OperationalDashboard {
  borders: OperationalDashboardBorders;
  documents: OperationalDashboardDocuments;
  topDrivers: TopDriver[];
  topTrucks: TopTruck[];
  topRoutes: TopRoute[];
}

export interface DashboardParams {
  startDate?: string;
  endDate?: string;
}

// ============ Report Types ============
export interface ReportType {
  type: string;
  label: string;
  description: string;
}

export interface TripReportSummary {
  totalTrips: number;
  totalWeight: number;
  byStatus: Record<string, number>;
  byClient: Record<string, { count: number; weight: number }>;
  byDriver: Record<string, { count: number; weight: number }>;
  byTruck: Record<string, { count: number; weight: number }>;
  averageTripDuration: number;
  totalBorderCrossings: number;
  channelDistribution: Record<BorderChannel, number>;
}

export interface TripReportItem {
  id: string;
  micDta: string;
  status: string;
  departureDate: string;
  arrivalDate?: string;
  weight: number;
  ratePerTon: number;
  client: string;
  blNumber: string;
  truck: string;
  trailer: string;
  driver: string;
  routeCount: number;
  borderCrossingCount: number;
  documentCount: number;
  hasSettlement: boolean;
  totalExpenses: number;
}

export interface TripReport {
  summary: TripReportSummary;
  trips: TripReportItem[];
  generatedAt: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface FinancialReportSettlements {
  count: number;
  totalFreightUsd: number;
  totalFreightBob: number;
  totalNetPayment: number;
  averageSettlement: number;
  byStatus: Record<SettlementStatus, { count: number; total: number }>;
}

export interface FinancialReportInvoices {
  count: number;
  totalAmount: number;
  averageInvoice: number;
  byStatus: Record<InvoiceStatus, { count: number; total: number }>;
}

export interface FinancialReportExpenses {
  count: number;
  total: number;
  averageExpense: number;
  byCategory: Record<string, { count: number; total: number }>;
}

export interface FinancialReport {
  settlements: FinancialReportSettlements;
  invoices: FinancialReportInvoices;
  expenses: FinancialReportExpenses;
  generatedAt: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface ClientReportItem {
  id: string;
  businessName: string;
  nit: string;
  totalTrips: number;
  totalWeight: number;
  totalInvoiced: number;
  pendingInvoices: number;
  tripsDelivered: number;
  tripsInTransit: number;
}

export interface ClientReport {
  clients: ClientReportItem[];
  totalClients: number;
  activeClients: number;
  generatedAt: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface DriverReportItem {
  id: string;
  name: string;
  identityCard: string;
  licenseNumber: string;
  totalTrips: number;
  totalWeight: number;
  avgDeliveryHours: number;
  rating: number;
  totalExpenses: number;
  totalSettlements: number;
}

export interface DriverReport {
  drivers: DriverReportItem[];
  totalDrivers: number;
  activeDrivers: number;
  generatedAt: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface TruckReportItem {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  capacityTons: number;
  totalTrips: number;
  totalWeight: number;
  utilizationPercent: number;
  totalMileage: number;
  status: TruckStatus;
}

export interface TruckReport {
  trucks: TruckReportItem[];
  totalTrucks: number;
  activeTrucks: number;
  averageUtilization: number;
  generatedAt: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface BorderReportItem {
  borderName: string;
  totalCrossings: number;
  avgDurationHours: number;
  channelDistribution: Record<BorderChannel, number>;
}

export interface BorderReport {
  borders: BorderReportItem[];
  totalCrossings: number;
  avgDurationOverall: number;
  generatedAt: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface ReportParams {
  startDate?: string;
  endDate?: string;
}
