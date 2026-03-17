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
