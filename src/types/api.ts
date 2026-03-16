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
export interface Cliente {
  id: string;
  razonSocial: string;
  nit: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  credito: boolean;
  limiteCredito?: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClienteInput {
  razonSocial: string;
  nit: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  credito?: boolean;
  limiteCredito?: number;
}

export interface UpdateClienteInput {
  razonSocial?: string;
  nit?: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  credito?: boolean;
  limiteCredito?: number;
  activo?: boolean;
}

export interface ClienteListParams extends PaginationParams {
  activo?: boolean;
  credito?: boolean;
}

// ============ BL Types ============
export interface BL {
  id: string;
  numero: string;
  pesoTotal: number;
  unidades: number;
  tipoCarga?: string;
  puertoOrigen: string;
  aduana: string;
  destinoFinal: string;
  nave?: string;
  consignatario?: string;
  tipoEntrega: 'DIRECTO' | 'INDIRECTO';
  clienteId: string;
  cliente?: Cliente;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO';
  createdAt: string;
  updatedAt: string;
}

export interface CreateBLInput {
  numero: string;
  pesoTotal: number;
  unidades: number;
  tipoCarga?: string;
  puertoOrigen: string;
  aduana: string;
  destinoFinal: string;
  nave?: string;
  consignatario?: string;
  tipoEntrega?: 'DIRECTO' | 'INDIRECTO';
  clienteId: string;
}

export interface UpdateBLInput {
  numero?: string;
  pesoTotal?: number;
  unidades?: number;
  tipoCarga?: string;
  puertoOrigen?: string;
  aduana?: string;
  destinoFinal?: string;
  nave?: string;
  consignatario?: string;
  tipoEntrega?: 'DIRECTO' | 'INDIRECTO';
  clienteId?: string;
  estado?: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO';
}

export interface CalcularFlotaResult {
  camionesNecesarios: number;
  capacidadTotal: number;
  pesoRestante: number;
}

export interface BLListParams extends PaginationParams {
  estado?: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO';
  clienteId?: string;
}
