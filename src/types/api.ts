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

// ============ Calculation Types (Sprint 4 Automation) ============

// Settlement calculation response
export interface SettlementCalculation {
  tripId: string;
  tripNumber?: string;
  grossAmount: number;
  itPercentage: number;
  itAmount: number;
  retentionPercentage: number;
  retentionAmount: number;
  netAmount: number;
  calculations: {
    formula: string;
    itFormula: string;
    retentionFormula: string;
  };
}

// Invoice calculation response
export interface InvoiceCalculation {
  clientId: string;
  clientName: string;
  tripIds: string[];
  totalWeight: number;
  subtotal: number;
  calculations: {
    tripCount: number;
    allDelivered: boolean;
    sameClient: boolean;
  };
}

// Invoice calculation input
export interface CalculateInvoiceInput {
  tripIds: string[];
}

// Border names list response
export interface BorderName {
  name: string;
  count?: number;
}

// ============ Dashboard Types (Sprint 6) ============

// Dashboard params for date range filtering
export interface DashboardParams {
  startDate?: string;
  endDate?: string;
}

// Main Dashboard Types
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
  client: string;
  driver: string;
  truck: string;
  weight: number;
  status: string;
  departureDate: string;
}

export interface MainDashboard {
  overview: DashboardOverview;
  tripsByStatus: TripsByStatus;
  pending: DashboardPending;
  recentTrips: RecentTrip[];
}

// Financial Dashboard Types
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
  amount: number;
  dueDate: string;
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
  category: string;
  total: number;
  count: number;
}

export interface FinancialDashboardExpenses {
  count: number;
  total: number;
  byCategory: ExpenseByCategory[];
}

export interface FinancialDashboard {
  settlements: FinancialDashboardSettlements;
  invoices: FinancialDashboardInvoices;
  expenses: FinancialDashboardExpenses;
}

// Operational Dashboard Types
export interface ActiveBorderCrossing {
  id: string;
  borderName: string;
  arrivedAt: string;
  channel: string;
  trip: {
    micDta: string;
    client: string;
    driver: string;
    truck: string;
  };
}

export interface OperationalDashboardBorders {
  totalCrossings: number;
  activeCrossings: number;
  channelDistribution: {
    green: number;
    yellow: number;
    red: number;
  };
}

export interface DocumentsByStatus {
  pending: number;
  verified: number;
  received: number;
}

export interface TopDriver {
  id: string;
  name: string;
  totalTrips: number;
  totalWeight: number;
  avgDeliveryHours: number;
  rating: number;
}

export interface TopTruck {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  totalTrips: number;
  totalWeight: number;
  utilizationPercent: number;
}

export interface TopRoute {
  origin: string;
  destination: string;
  count: number;
  totalWeight: number;
}

export interface OperationalDashboard {
  borders: OperationalDashboardBorders;
  activeCrossings: ActiveBorderCrossing[];
  documents: DocumentsByStatus;
  topDrivers: TopDriver[];
  topTrucks: TopTruck[];
  topRoutes: TopRoute[];
}

// ============ Report Types (Sprint 6) ============

export interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface ReportParams {
  startDate: string;
  endDate: string;
  clientId?: string;
  driverId?: string;
  truckId?: string;
}

// Trips Report
export interface TripReportSummary {
  totalTrips: number;
  totalWeight: number;
  avgDeliveryHours: number;
  borderCrossings: number;
  byStatus: TripsByStatus;
  byClient: Record<string, number>;
  byDriver: Record<string, number>;
  byTruck: Record<string, number>;
  channelDistribution: {
    green: number;
    yellow: number;
    red: number;
  };
}

export interface TripReportItem {
  id: string;
  micDta: string;
  client: string;
  driver: string;
  truck: string;
  weight: number;
  status: string;
  departureDate: string;
  deliveryDate?: string;
  borderCrossings: number;
}

export interface TripReport {
  summary: TripReportSummary;
  trips: TripReportItem[];
}

// Financial Report
export interface FinancialReportSettlements {
  count: number;
  totalFreightUsd: number;
  totalFreightBob: number;
  totalNetPayment: number;
}

export interface FinancialReportInvoices {
  count: number;
  totalAmount: number;
  avgAmount: number;
}

export interface FinancialReportExpenses {
  count: number;
  total: number;
  avgAmount: number;
  byCategory: ExpenseByCategory[];
}

export interface FinancialReport {
  settlements: FinancialReportSettlements;
  invoices: FinancialReportInvoices;
  expenses: FinancialReportExpenses;
}

// Client Report
export interface ClientReportItem {
  id: string;
  businessName: string;
  nit: string;
  totalTrips: number;
  totalWeight: number;
  totalInvoiced: number;
  pendingAmount: number;
}

export interface ClientReport {
  totalClients: number;
  activeClients: number;
  clients: ClientReportItem[];
}

// Driver Report
export interface DriverReportItem {
  id: string;
  name: string;
  licenseNumber: string;
  totalTrips: number;
  totalWeight: number;
  avgDeliveryHours: number;
  rating: number;
}

export interface DriverReport {
  totalDrivers: number;
  activeDrivers: number;
  drivers: DriverReportItem[];
}

// Fleet Report
export interface TruckReportItem {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  capacityTons: number;
  totalTrips: number;
  totalWeight: number;
  utilizationPercent: number;
  status: string;
}

export interface TruckReport {
  totalTrucks: number;
  activeTrucks: number;
  avgUtilization: number;
  trucks: TruckReportItem[];
}

// Border Report
export interface BorderReportItem {
  borderName: string;
  totalCrossings: number;
  avgDurationHours: number;
  channelDistribution: {
    green: number;
    yellow: number;
    red: number;
  };
}

export interface BorderReport {
  totalCrossings: number;
  avgDurationHours: number;
  borders: BorderReportItem[];
}

// ============ Sprint 5 Phase 3: Payment Block Types ============

export interface PaymentBlockMissingDocument {
  code: string;
  name: string;
  status: 'PENDING' | 'RECEIVED';
}

export interface BlockedSettlement {
  id: string;
  netPayment: number;
  status: string;
  isPaymentBlocked: boolean;
  documentsComplete: boolean;
  blockedDays: number;
  missingDocuments: PaymentBlockMissingDocument[];
  trip: {
    id: string;
    micDta: string;
    driver: {
      id: string;
      employee: {
        firstName: string;
        lastName: string;
        phone?: string;
      };
    };
    truck: {
      plateNumber: string;
      isSupportTruck: boolean;
    };
    billOfLading: {
      blNumber: string;
    };
  };
  createdAt: string;
}

export interface PaymentBlockStats {
  total: number;
  blocked: number;
  unblocked: number;
  blockedPercentage: number;
  totalBlockedAmount: number;
  byDriver: Array<{
    driverId: string;
    driverName: string;
    blockedCount: number;
    totalAmount: number;
  }>;
  byMissingDocument: Array<{
    code: string;
    name: string;
    count: number;
  }>;
  avgBlockedDays: number;
}

export interface PaymentBlockChecklist {
  tripId: string;
  micDta: string;
  blNumber: string;
  driverName: string;
  truckPlate: string;
  isSupportTruck: boolean;
  documents: Array<{
    id: string;
    code: string;
    name: string;
    isRequired: boolean;
    status: 'PENDING' | 'RECEIVED' | 'VERIFIED';
    isBlocking: boolean;
  }>;
  paymentStatus: {
    hasSettlement: boolean;
    isBlocked: boolean;
    blockReason: string | null;
    documentsComplete: boolean;
    canApprove: boolean;
    canPay: boolean;
  };
  summary: {
    total: number;
    verified: number;
    pending: number;
    missing: number;
    blockingCount: number;
  };
}

export interface PaymentBlockCheckResult {
  tripId: string;
  documentsComplete: boolean;
  isPaymentBlocked: boolean;
  blockReason: string | null;
  missingDocuments: string[];
  previousState: {
    documentsComplete: boolean;
    isPaymentBlocked: boolean;
  };
  notificationSent: boolean;
}

export interface PaymentBlockCanProcess {
  canProcess: boolean;
  reason: string | null;
  missingDocuments: string[];
}

export interface PaymentBlockUnblockResult {
  settlement: {
    id: string;
    tripId: string;
    isPaymentBlocked: boolean;
    documentsComplete: boolean;
    notes: string;
  };
  previousState: {
    isPaymentBlocked: boolean;
  };
  auditLog: {
    id: string;
    userId: string;
    action: string;
    entity: string;
    entityId: string;
    createdAt: string;
  };
}

export interface PaymentBlockProcessAllResult {
  processed: number;
  blocked: number;
  unblocked: number;
  errors: string[];
}

export interface PaymentBlockHistoryEntry {
  action: string;
  userId: string;
  userName: string;
  timestamp: string;
  details: {
    isPaymentBlocked: boolean;
    reason?: string;
  };
}

export interface PaymentBlockHistory {
  settlementId: string;
  currentStatus: {
    isPaymentBlocked: boolean;
    documentsComplete: boolean;
  };
  history: PaymentBlockHistoryEntry[];
}

export interface PaymentBlockListParams extends PaginationParams {
  driverId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ============ Sprint 7: Assets, Liabilities, Maintenance, Sanctions, Driver History ============

// ============ Asset (Activos) Types ============
// Según schema.prisma: VEHICLE, EQUIPMENT, PROPERTY, OTHER
export type AssetCategory = 'VEHICLE' | 'EQUIPMENT' | 'PROPERTY' | 'OTHER';

export interface Asset {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  category: AssetCategory;
  value: number;                // Valor del activo
  acquisitionDate?: string;     // Fecha de adquisición
  usefulLifeMonths?: number;    // Vida útil en meses
  depreciation: number;         // Depreciación acumulada
  isActive: boolean;            // Estado activo/inactivo (NO hay status enum)
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssetInput {
  name: string;
  category: AssetCategory;
  description?: string;
  value: number;                // Backend espera 'value'
  acquisitionDate?: string;
  usefulLifeMonths?: number;    // Backend usa meses
  depreciation?: number;
}

export interface UpdateAssetInput {
  name?: string;
  category?: AssetCategory;
  description?: string;
  value?: number;
  acquisitionDate?: string;
  usefulLifeMonths?: number;
  depreciation?: number;
  isActive?: boolean;
}

export interface AssetListParams extends PaginationParams {
  category?: AssetCategory;
  isActive?: boolean;
}

export interface AssetStats {
  total: number;
  totalValue: number;
  totalDepreciation: number;
  byCategory: Record<AssetCategory, { count: number; value: number }>;
}

export interface AssetCategoryOption {
  value: AssetCategory;
  label: string;
}

// ============ Liability (Pasivos) Types ============
// Según schema.prisma: LOAN, ACCOUNTS_PAYABLE, MORTGAGE, OTHER
export type LiabilityType = 'LOAN' | 'ACCOUNTS_PAYABLE' | 'MORTGAGE' | 'OTHER';
// Según schema.prisma: PENDING, PARTIAL, PAID
export type LiabilityStatus = 'PENDING' | 'PARTIAL' | 'PAID';

export interface Liability {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  type: LiabilityType;
  amount: number;               // Monto total
  interestRate?: number;        // Tasa de interés
  startDate?: string;           // Fecha de inicio
  dueDate?: string;             // Fecha de vencimiento
  status: LiabilityStatus;      // PENDING, PARTIAL, PAID
  createdAt: string;
  updatedAt: string;
}

export interface CreateLiabilityInput {
  name: string;
  type: LiabilityType;
  description?: string;
  amount: number;               // Backend espera 'amount'
  interestRate?: number;
  startDate?: string;
  dueDate?: string;
}

export interface UpdateLiabilityInput {
  name?: string;
  type?: LiabilityType;
  description?: string;
  amount?: number;
  interestRate?: number;
  startDate?: string;
  dueDate?: string;
  status?: LiabilityStatus;
}

export interface LiabilityListParams extends PaginationParams {
  type?: LiabilityType;
  status?: LiabilityStatus;
}

export interface LiabilityStats {
  total: number;
  totalDebt: number;
  byType: Record<LiabilityType, { count: number; amount: number }>;
  byStatus: Record<LiabilityStatus, number>;
}

export interface LiabilityTypeOption {
  value: LiabilityType;
  label: string;
}

// ============ Maintenance (Mantenimientos) Types ============
// Según schema.prisma
export type MaintenanceType = 'PREVENTIVE' | 'CORRECTIVE';
export type MaintenanceStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface Maintenance {
  id: string;
  truckId: string;
  truck?: {
    id: string;
    plateNumber: string;
    brand?: string;
    model?: string;
  };
  type: MaintenanceType;
  description: string;
  mileage?: number;
  startDate: string;
  endDate?: string;
  cost?: number;
  workshop?: string;
  status: MaintenanceStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaintenanceInput {
  truckId: string;
  type: MaintenanceType;
  description: string;
  mileage?: number;
  startDate?: string;
  cost?: number;
  workshop?: string;
  notes?: string;
}

export interface UpdateMaintenanceInput {
  truckId?: string;
  type?: MaintenanceType;
  description?: string;
  mileage?: number;
  startDate?: string;
  endDate?: string;
  cost?: number;
  workshop?: string;
  notes?: string;
  status?: MaintenanceStatus;
}

export interface MaintenanceListParams extends PaginationParams {
  truckId?: string;
  type?: MaintenanceType;
  status?: MaintenanceStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface MaintenanceStats {
  total: number;
  totalCost: number;
  avgCost: number;
  byType: Record<MaintenanceType, { count: number; cost: number }>;
  byStatus: Record<MaintenanceStatus, number>;
  upcomingCount: number;
}

export interface MaintenanceTypeOption {
  value: MaintenanceType;
  label: string;
}

// ============ Sanction (Sanciones) Types ============
// Según schema.prisma + Sprint 5 Phase 4: Sanciones Automáticas
export type SanctionType = 'FINE' | 'SUSPENSION' | 'WARNING';
export type SanctionStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';
export type SanctionReason = 'DOCUMENT_DELAY' | 'REPEATED_OFFENSE' | 'SAFETY_VIOLATION' | 'OTHER';

export interface Sanction {
  id: string;
  driverId: string;
  driver?: {
    id: string;
    employeeId?: string;
    employee?: {
      firstName?: string;
      lastName?: string;
      phone?: string;
    };
    firstName?: string;
    lastName?: string;
    fullName?: string;
  };
  type: SanctionType;
  reason: string;
  sanctionReason?: SanctionReason;
  tripId?: string;
  daysDelayed?: number;
  automatic?: boolean;
  amount?: number | string;
  startDate: string;
  endDate?: string;
  status: SanctionStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSanctionInput {
  driverId: string;
  type: SanctionType;
  reason: string;
  sanctionReason?: SanctionReason;
  tripId?: string;
  daysDelayed?: number;
  automatic?: boolean;
  amount?: number;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export interface UpdateSanctionInput {
  type?: SanctionType;
  reason?: string;
  sanctionReason?: SanctionReason;
  tripId?: string;
  daysDelayed?: number;
  automatic?: boolean;
  amount?: number;
  startDate?: string;
  endDate?: string;
  status?: SanctionStatus;
  notes?: string;
}

export interface SanctionListParams extends PaginationParams {
  driverId?: string;
  type?: SanctionType;
  status?: SanctionStatus;
  sanctionReason?: SanctionReason;
  automatic?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface SanctionStats {
  total: number;
  activeCount: number;
  totalFines: number;
  automaticCount: number;
  manualCount: number;
  byType: Record<SanctionType, number>;
  byStatus: Record<SanctionStatus, number>;
  byReason: Record<SanctionReason, number>;
}

export interface SanctionTypeOption {
  value: SanctionType;
  label: string;
}

// Sprint 5 Phase 4: Sanciones Automáticas - Nuevos Tipos
export interface SanctionReasonOption {
  value: SanctionReason;
  label: string;
  description: string;
}

export interface SanctionConfig {
  gracePeriodDays: number;
  finePerDayUsd: number;
  maxFineDays: number;
  maxFineAmount: number;
  suspensionThresholds: {
    first: number;
    second: number;
    third: number;
    fourth: number;
    fifthPlus: number;
  };
}

export interface DelayedTrip {
  tripId: string;
  micDta: string;
  driverId: string;
  driverName: string;
  daysDelayed: number;
  suggestedFine: number;
  suggestedAction: 'FINE' | 'SUSPENSION' | 'WARNING';
  existingOffenses: number;
}

export interface GenerateAutomaticSanctionsInput {
  tripIds?: string[];
  driverIds?: string[];
  dryRun?: boolean;
}

export interface GeneratedSanctionPreview {
  tripId: string;
  micDta: string;
  driverId: string;
  driverName: string;
  type: SanctionType;
  sanctionReason: SanctionReason;
  daysDelayed: number;
  amount: number;
  existingOffenses: number;
}

export interface GenerateAutomaticSanctionsResult {
  previews: GeneratedSanctionPreview[];
  totalToGenerate: number;
  totalFines: number;
  totalSuspensions: number;
  totalWarnings: number;
  totalAmount: number;
}

export interface RecurringOffenseCheck {
  driverId: string;
  driverName: string;
  totalSanctions: number;
  pendingSanctions: number;
  completedSanctions: number;
  offenseLevel: 'FIRST' | 'SECOND' | 'THIRD' | 'FOURTH' | 'RECURRENT';
  suggestedSuspensionDays: number;
  lastSanctionDate?: string;
}

export interface ProcessDriverSanctionsResult {
  driverId: string;
  driverName: string;
  sanctionsGenerated: number;
  sanctionsSkipped: number;
  totalAmount: number;
}

export interface SanctionAutomationStats {
  totalAutomatic: number;
  totalManual: number;
  automationRate: number;
  totalFinesGenerated: number;
  totalSuspensionsGenerated: number;
  totalWarningsGenerated: number;
  totalAmountGenerated: number;
  pendingDelayedTrips: number;
  averageDaysDelayed: number;
  topSanctionedDrivers: Array<{
    driverId: string;
    driverName: string;
    sanctionCount: number;
    totalAmount: number;
  }>;
  byReason: Record<SanctionReason, number>;
}

// ============ Driver History (Historial de Conductores) Types ============
// Según schema.prisma
export type HistoryEventType = 'INCIDENT' | 'ACCIDENT' | 'AWARD' | 'STATUS_CHANGE';

export interface DriverHistory {
  id: string;
  driverId: string;
  driver?: {
    id: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
  };
  eventType: HistoryEventType;
  description: string;
  notes?: string;
  occurredAt: string;
  createdAt: string;
}

export interface CreateDriverHistoryInput {
  driverId: string;
  eventType: HistoryEventType;
  description: string;
  notes?: string;
  occurredAt?: string;
}

export interface UpdateDriverHistoryInput {
  eventType?: HistoryEventType;
  description?: string;
  notes?: string;
  occurredAt?: string;
}

export interface DriverHistoryListParams extends PaginationParams {
  driverId?: string;
  eventType?: HistoryEventType;
  dateFrom?: string;
  dateTo?: string;
}

export interface DriverHistoryStats {
  total: number;
  byEventType: Record<HistoryEventType, number>;
}

export interface HistoryEventTypeOption {
  value: HistoryEventType;
  label: string;
}

// ============ Sprint 7 Finance Enhancement: Cash Flow, Payments, SIN Export, Notifications ============

// ============ Cash Flow (Flujo de Caja) Types ============
export type CashFlowType = 'INCOME' | 'EXPENSE';
export type CashFlowCategory = 'FREIGHT' | 'FUEL' | 'MAINTENANCE' | 'SALARY' | 'TOLL' | 'OTHER';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'CARD' | 'OTHER';

export interface CashFlow {
  id: string;
  type: CashFlowType;
  category: CashFlowCategory;
  concept: string;           // Backend usa "concept" no "description"
  amount: number;
  reference?: string;
  entity?: string;           // Entidad relacionada (Trip, Invoice, etc.)
  entityId?: string;         // ID de la entidad relacionada
  paymentMethod: PaymentMethod;
  paymentDate: string;       // Backend usa "paymentDate" no "date"
  notes?: string;
  createdBy?: string;
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCashFlowInput {
  type: CashFlowType;
  category: CashFlowCategory;
  amount: number;
  concept: string;           // Backend usa "concept"
  paymentDate: string;       // Backend usa "paymentDate"
  paymentMethod: PaymentMethod;
  reference?: string;
  entity?: string;
  entityId?: string;
  notes?: string;
}

export interface UpdateCashFlowInput {
  type?: CashFlowType;
  category?: CashFlowCategory;
  amount?: number;
  concept?: string;
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  reference?: string;
  entity?: string;
  entityId?: string;
  notes?: string;
}

export interface CashFlowListParams extends PaginationParams {
  type?: CashFlowType;
  category?: CashFlowCategory;
  paymentMethod?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
}

export interface CashFlowSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: Record<CashFlowCategory, { income: number; expense: number }>;
  byPaymentMethod: Record<PaymentMethod, number>;
}

export interface CashFlowDaily {
  date: string;
  income: number;
  expense: number;
  balance: number;
  transactions: CashFlow[];
}

export interface CashFlowMonthly {
  year: number;
  month: number;
  income: number;
  expense: number;
  balance: number;
  byCategory: Record<CashFlowCategory, { income: number; expense: number }>;
}

export interface CashFlowTypeOption {
  value: CashFlowType;
  label: string;
}

export interface CashFlowCategoryOption {
  value: CashFlowCategory;
  label: string;
}

export interface PaymentMethodOption {
  value: PaymentMethod;
  label: string;
}

// ============ Payments (Pagos y Anticipos) Types ============
export type PaymentType = 'ADVANCE' | 'SETTLEMENT' | 'INVOICE' | 'EXPENSE_REIMBURSEMENT';
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED';
export type PaymentCurrency = 'BOB' | 'USD';

export interface Payment {
  id: string;
  type: PaymentType;
  concept: string;              // Backend usa "concept" no "description"
  amount: number | string;      // Backend devuelve string
  currency: PaymentCurrency;
  exchangeRate?: number | null;
  amountBob: number | string;
  paymentMethod: PaymentMethod;
  reference?: string;
  bankAccount?: string | null;
  status: PaymentStatus;
  tripId?: string | null;
  invoiceId?: string | null;
  settlementId?: string | null;
  driverId?: string | null;
  expenseId?: string | null;
  approvedById?: string | null;
  approvedAt?: string | null;
  paidAt?: string | null;       // Backend usa "paidAt" no "completedAt"
  scheduledDate?: string;
  paymentDate?: string | null;
  notes?: string;
  createdBy?: string;
  trip?: {
    id: string;
    micDta: string;
    departureDate?: string;
    arrivalDate?: string;
    billOfLading?: {
      id: string;
      blNumber: string;
      client?: {
        id: string;
        businessName: string;
      };
    };
  };
  driver?: {
    id: string;
    employeeId?: string;
    licenseNumber?: string;
    licenseCategory?: string;
    contractType?: string;
    isAvailable?: boolean;
    rating?: string;
    totalTrips?: number;
    isActive?: boolean;
    employee?: {
      id: string;
      firstName: string;
      lastName: string;
      identityCard?: string;
      phone?: string;
      email?: string;
    };
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
  };
  approvedBy?: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentInput {
  type: PaymentType;
  concept: string;              // Backend usa "concept"
  amount: number;
  currency?: PaymentCurrency;   // Default: BOB
  exchangeRate?: number;        // Requerido si currency es USD
  paymentMethod: PaymentMethod;
  reference?: string;
  driverId?: string;
  tripId?: string;
  settlementId?: string;
  invoiceId?: string;
  expenseId?: string;
  scheduledDate?: string;
  notes?: string;
}

export interface UpdatePaymentInput {
  concept?: string;
  amount?: number;
  currency?: PaymentCurrency;
  exchangeRate?: number;
  paymentMethod?: PaymentMethod;
  reference?: string;
  scheduledDate?: string;
  notes?: string;
}

export interface CompletePaymentInput {
  paymentDate?: string;
}

export interface PaymentListParams extends PaginationParams {
  type?: PaymentType;
  status?: PaymentStatus;
  driverId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaymentStats {
  total: number;
  totalAmount: number;
  pendingAmount: number;
  completedAmount: number;
  byType: Record<PaymentType, { count: number; amount: number }>;
  byStatus: Record<PaymentStatus, { count: number; amount: number }>;
}

export interface PaymentTypeOption {
  value: PaymentType;
  label: string;
}

export interface PaymentStatusOption {
  value: PaymentStatus;
  label: string;
}

// ============ SIN Export (Facturación Electrónica Bolivia) Types ============
export type SINExportStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';

export interface SINExport {
  id: string;
  invoiceId: string;
  status: SINExportStatus;
  cuf?: string;                    // Código Único de Facturación
  cufd?: string;                   // Código Único de Facturación Diaria
  controlCode?: string;            // Código de Control
  qrCode?: string;                 // QR Code para factura
  sinResponse?: Record<string, unknown>;  // Respuesta del SIN
  errorMessage?: string;
  retryCount: number;
  invoice?: {
    id: string;
    invoiceNumber: string;
    client?: {
      businessName: string;
      nit: string;
    };
    totalAmount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SINExportListParams extends PaginationParams {
  status?: SINExportStatus;
  invoiceId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface SINExportStats {
  total: number;
  pending: number;
  success: number;
  failed: number;
  totalAmount: number;
  successRate: number;
}

export interface SINExportStatusOption {
  value: SINExportStatus;
  label: string;
}

export interface SINInvoiceJSON {
  cabecera: {
    nitEmisor: string;
    razonSocialEmisor: string;
    municipio: string;
    telefono: string;
    numeroFactura: string;
    cuf: string;
    cufd: string;
    codigoSucursal: number;
    direccion: string;
    codigoPuntoVenta: number;
    fechaEmision: string;
    nombreRazonSocial: string;
    codigoTipoDocumentoIdentidad: number;
    numeroDocumento: string;
    complemento?: string;
    codigoCliente: string;
    codigoMetodoPago: number;
    numeroTarjeta?: string;
    montoTotal: number;
    montoTotalSujetoIva: number;
    codigoMoneda: number;
    tipoCambio: number;
    montoTotalMoneda: number;
    montoGiftCard?: number;
    descuentoAdicional?: number;
    codigoExcepcion?: number;
    cafc?: string;
    leyenda: string;
    usuario: string;
    codigoDocumentoSector: number;
  };
  detalle: Array<{
    actividadEconomica: string;
    codigoProductoSin: string;
    codigoProducto: string;
    descripcion: string;
    cantidad: number;
    unidadMedida: number;
    precioUnitario: number;
    montoDescuento?: number;
    subTotal: number;
    numeroSerie?: string;
    numeroImei?: string;
  }>;
}

// ============ Notifications (Notificaciones) Types ============
export type NotificationType = 'TRIP' | 'SETTLEMENT' | 'INVOICE' | 'MAINTENANCE' | 'DOCUMENT' | 'SYSTEM' | 'BORDER';
export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  isRead: boolean;
  readAt?: string;
  actionUrl?: string;
  entityType?: string;
  entityId?: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationListParams extends PaginationParams {
  type?: NotificationType;
  priority?: NotificationPriority;
  isRead?: boolean;
}

export interface NotificationCounts {
  total: number;
  unread: number;
  byPriority: Record<NotificationPriority, number>;
  byType: Record<NotificationType, number>;
}

export interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  actionUrl?: string;
  entityType?: string;
  entityId?: string;
  data?: Record<string, unknown>;
}

export interface NotificationTypeOption {
  value: NotificationType;
  label: string;
}

export interface NotificationPriorityOption {
  value: NotificationPriority;
  label: string;
}

// ============ Sprint 5: DocumentTypes and Tramos ============

// ============ DocumentType (Tipos de Documento) Types ============
export interface DocumentType {
  id: string;
  code: string;              // "MIC", "CRT", "ASPB", "NOTA_TARJA", "BALANZA", "FACTURA"
  name: string;              // "Manifiesto Internacional de Carga"
  description?: string;
  isRequired: boolean;
  isForSupportOnly: boolean; // true = solo para camiones de apoyo
  displayOrder: number;      // Orden de presentación
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  documentsCount?: number;   // Solo en getById
}

export interface CreateDocumentTypeInput {
  code: string;
  name: string;
  description?: string;
  isRequired?: boolean;
  isForSupportOnly?: boolean;
  displayOrder?: number;
}

export interface UpdateDocumentTypeInput {
  code?: string;
  name?: string;
  description?: string;
  isRequired?: boolean;
  isForSupportOnly?: boolean;
  displayOrder?: number;
  isActive?: boolean;
}

export interface DocumentTypeListParams extends PaginationParams {
  isActive?: boolean;
}

export interface DocumentTypeStats {
  total: number;
  active: number;
  inactive: number;
  required: number;
  optional: number;
  forSupportOnly: number;
}

// ============ Tramo (Rutas Predefinidas) Types ============
export interface Tramo {
  id: string;
  code: string;            // "MAT-CBA", "ARI-LPZ" (único)
  name: string;            // "Matarani - Cochabamba"
  origin: string;          // "Matarani"
  destination: string;     // "Cochabamba"
  distanceKm?: number;     // 845.50
  estimatedHours?: number; // 18
  baseRateUsd?: number;    // 1200.00
  baseRateBob?: number;    // 8352.00
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  routesCount?: number;    // Solo en getById
}

export interface CreateTramoInput {
  code: string;
  name: string;
  origin: string;
  destination: string;
  distanceKm?: number;
  estimatedHours?: number;
  baseRateUsd?: number;
  baseRateBob?: number;
  notes?: string;
}

export interface UpdateTramoInput {
  code?: string;
  name?: string;
  origin?: string;
  destination?: string;
  distanceKm?: number;
  estimatedHours?: number;
  baseRateUsd?: number;
  baseRateBob?: number;
  notes?: string;
  isActive?: boolean;
}

export interface TramoListParams extends PaginationParams {
  isActive?: boolean;
  origin?: string;
  destination?: string;
}

export interface TramoStats {
  total: number;
  active: number;
  inactive: number;
  avgDistance: number;
  avgEstimatedHours: number;
  avgBaseRateUsd: number;
  totalOrigins: number;
  totalDestinations: number;
}

// ============ Sprint 5 Phase 2: Document Automation ============

// Raw backend document item from checklist
export interface DocumentChecklistItemRaw {
  id: string | null;
  code: string;
  name: string;
  isRequired: boolean;
  status: 'PENDING' | 'RECEIVED' | 'VERIFIED' | null;
  documentNumber?: string | null;
  fileUrl?: string | null;
  receivedAt?: string | null;
}

// Frontend-friendly checklist item (mapped from raw)
export interface DocumentChecklistItem {
  id: string;
  code: string;
  name: string;
  isRequired: boolean;
  isForSupportOnly: boolean;
  order: number;
  documentId?: string | null;
  status: 'PENDING' | 'RECEIVED' | 'VERIFIED';
  fileUrl?: string | null;
  documentNumber?: string | null;
  receivedAt?: string | null;
}

// Frontend-friendly checklist response (mapped from backend)
export interface DocumentChecklistResponse {
  tripId: string;
  truckId?: string;
  truckPlate?: string;
  isSupportTruck: boolean;
  checklist: DocumentChecklistItem[];
  summary: {
    total: number;
    verified: number;
    received: number;
    pending: number;
    missing: number;
    documentsComplete: boolean;
  };
}

// Stats from backend
export interface DocumentAutomationStats {
  totalTrips: number;
  tripsWithCompleteDocs: number;
  tripsWithIncompleteDocs: number;
  tripsWithBlockedPayments: number;
  documentsByType: Array<{
    code: string;
    name: string;
    total: number;
    verified: number;
    pending: number;
  }>;
}

// Verify trip response
export interface DocumentVerifyResponse {
  documentsComplete: boolean;
  isPaymentBlocked: boolean;
  missingDocuments: string[];
  verifiedCount: number;
  pendingCount: number;
  totalCount: number;
}

// Batch create input
export interface BatchCreateDocumentsInput {
  tripIds: string[];
  documentTypeIds?: string[];
}

// Batch create result per trip
export interface BatchCreateTripResult {
  tripId: string;
  created: number;
}
