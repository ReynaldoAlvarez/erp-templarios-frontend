import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosInstance,
} from 'axios';
import { ApiError, User, LoginCredentials, AuthResponse } from '@/types/api';
import { tokenCookies } from '@/lib/cookies';

// ==========================================
// Token Management
// ==========================================
export const tokenManager = {
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return tokenCookies.getAccessToken();
  },

  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return tokenCookies.getRefreshToken();
  },

  setTokens: (accessToken: string, refreshToken: string, rememberMe: boolean = false): void => {
    if (typeof window === 'undefined') return;
    tokenCookies.setTokens(accessToken, refreshToken, rememberMe);
  },

  clearTokens: (): void => {
    if (typeof window === 'undefined') return;
    tokenCookies.clearTokens();
  },

  hasAccessToken: (): boolean => {
    if (typeof window === 'undefined') return false;
    return tokenCookies.hasAccessToken();
  },
};

// ==========================================
// Axios Instance
// ==========================================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// ==========================================
// Request Interceptor
// ==========================================
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// ==========================================
// Response Interceptor (Token Refresh)
// ==========================================
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenManager.getRefreshToken();

      if (!refreshToken) {
        tokenManager.clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        tokenManager.setTokens(accessToken, newRefreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        processQueue(null, accessToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        tokenManager.clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ==========================================
// API Helper Functions
// ==========================================
export const api = {
  get: <T>(url: string, params?: Record<string, string | number | boolean | undefined>) =>
    apiClient.get<T>(url, { params }),

  post: <T>(url: string, data?: unknown) =>
    apiClient.post<T>(url, data),

  put: <T>(url: string, data?: unknown) =>
    apiClient.put<T>(url, data),

  patch: <T>(url: string, data?: unknown) =>
    apiClient.patch<T>(url, data),

  delete: <T>(url: string) =>
    apiClient.delete<T>(url),
};

// ==========================================
// Auth API
// ==========================================
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<{ data: AuthResponse }>('/auth/login', {
      email: credentials?.email,
      password: credentials?.password,
    });
    
    const { accessToken, refreshToken, user } = response.data.data;
    tokenManager.setTokens(accessToken, refreshToken, credentials?.rememberMe);
    
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      tokenManager.clearTokens();
    }
  },

  me: async (): Promise<User> => {
    const response = await api.get<{ data: User }>('/auth/me');
    return response.data.data;
  },

  refreshToken: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const response = await api.post<{ data: { accessToken: string; refreshToken: string } }>('/auth/refresh-token', {
      refreshToken,
    });
    
    const { accessToken, refreshToken: newRefreshToken } = response.data.data;
    tokenManager.setTokens(accessToken, newRefreshToken);
    
    return response.data.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  },
};

// ==========================================
// Users API
// ==========================================
// Backend response: { success: true, data: User[], meta: { page, limit, total, totalPages } }
interface BackendUsersResponse {
  success: boolean;
  message: string;
  data: User[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const usersApi = {
  getAll: async (params?: import('@/types/api').PaginationParams): Promise<import('@/types/api').PaginatedResponse<User>> => {
    const response = await api.get<BackendUsersResponse>('/users', params);
    const { data: users, meta } = response.data;

    return {
      data: users,
      pagination: {
        page: meta.page,
        limit: meta.limit,
        total: meta.total,
        totalPages: meta.totalPages,
        hasNext: meta.page < meta.totalPages,
        hasPrev: meta.page > 1,
      },
    };
  },

  getById: async (id: string): Promise<User> => {
    const response = await api.get<{ data: User }>(`/users/${id}`);
    return response.data.data;
  },

  create: async (data: import('@/types/api').CreateUserInput): Promise<User> => {
    const response = await api.post<{ data: User }>('/users', data);
    return response.data.data;
  },

  update: async (id: string, data: import('@/types/api').UpdateUserInput): Promise<User> => {
    const response = await api.put<{ data: User }>(`/users/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  assignRoles: async (id: string, roleIds: string[]): Promise<User> => {
    const response = await api.post<{ data: User }>(`/users/${id}/roles`, { roleIds });
    return response.data.data;
  },

  unlock: async (id: string): Promise<User> => {
    const response = await api.post<{ data: User }>(`/users/${id}/unlock`);
    return response.data.data;
  },
};

// ==========================================
// Roles API
// ==========================================
export const rolesApi = {
  getAll: async (): Promise<import('@/types/api').Role[]> => {
    const response = await api.get<{ data: import('@/types/api').Role[] }>('/roles');
    return response.data.data;
  },

  getById: async (id: string): Promise<import('@/types/api').Role> => {
    const response = await api.get<{ data: import('@/types/api').Role }>(`/roles/${id}`);
    return response.data.data;
  },

  create: async (data: import('@/types/api').CreateRoleInput): Promise<import('@/types/api').Role> => {
    const response = await api.post<{ data: import('@/types/api').Role }>('/roles', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<import('@/types/api').CreateRoleInput>): Promise<import('@/types/api').Role> => {
    const response = await api.put<{ data: import('@/types/api').Role }>(`/roles/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/roles/${id}`);
  },
};

// ==========================================
// Permissions API
// ==========================================
export const permissionsApi = {
  getAll: async (): Promise<import('@/types/api').Permission[]> => {
    const response = await api.get<{ data: import('@/types/api').Permission[] }>('/permissions');
    return response.data.data;
  },
};

// ==========================================
// Clientes API
// ==========================================
// Backend response structure:
// { success: true, data: { clients: [...], total, page, limit, totalPages }, timestamp }
interface BackendClientsResponse {
  success: boolean;
  message: string;
  data: {
    clients: import('@/types/api').Client[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

export const clientesApi = {
  getAll: async (params?: import('@/types/api').ClientListParams): Promise<import('@/types/api').PaginatedResponse<import('@/types/api').Client>> => {
    const response = await api.get<BackendClientsResponse>('/clients', params);
    const { clients, total, page, limit, totalPages } = response.data.data;

    return {
      data: clients,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },

  getById: async (id: string): Promise<import('@/types/api').Client> => {
    const response = await api.get<{ data: import('@/types/api').Client }>(`/clients/${id}`);
    return response.data.data;
  },

  create: async (data: import('@/types/api').CreateClientInput): Promise<import('@/types/api').Client> => {
    const response = await api.post<{ data: import('@/types/api').Client }>('/clients', data);
    return response.data.data;
  },

  update: async (id: string, data: import('@/types/api').UpdateClientInput): Promise<import('@/types/api').Client> => {
    const response = await api.put<{ data: import('@/types/api').Client }>(`/clients/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/clients/${id}`);
  },

  restore: async (id: string): Promise<import('@/types/api').Client> => {
    const response = await api.post<{ data: import('@/types/api').Client }>(`/clients/${id}/restore`);
    return response.data.data;
  },

  search: async (query: string): Promise<import('@/types/api').Client[]> => {
    const response = await api.get<{ data: import('@/types/api').Client[] }>('/clients/search', { q: query });
    return response.data.data;
  },

  getCredit: async (id: string): Promise<{
    hasCredit: boolean;
    creditLimit: number;
    usedCredit: number;
    availableCredit: number;
    utilizationPercent: number;
    pendingInvoices: number;
  }> => {
    const response = await api.get<{ data: {
      hasCredit: boolean;
      creditLimit: number;
      usedCredit: number;
      availableCredit: number;
      utilizationPercent: number;
      pendingInvoices: number;
    } }>(`/clients/${id}/credit`);
    return response.data.data;
  },
};

// ==========================================
// BLs API
// ==========================================
// Backend response structure:
// { success: true, data: { bls: [...], total, page, limit, totalPages }, timestamp }
interface BackendBLsResponse {
  success: boolean;
  message: string;
  data: {
    bls: import('@/types/api').BillOfLading[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

export const blsApi = {
  getAll: async (params?: import('@/types/api').BLListParams): Promise<import('@/types/api').PaginatedResponse<import('@/types/api').BillOfLading>> => {
    const response = await api.get<BackendBLsResponse>('/bl', params);
    const { bls, total, page, limit, totalPages } = response.data.data;

    return {
      data: bls,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },

  getById: async (id: string): Promise<import('@/types/api').BillOfLading> => {
    const response = await api.get<{ data: import('@/types/api').BillOfLading }>(`/bl/${id}`);
    return response.data.data;
  },

  getByNumber: async (blNumber: string): Promise<import('@/types/api').BillOfLading> => {
    const response = await api.get<{ data: import('@/types/api').BillOfLading }>(`/bl/number/${blNumber}`);
    return response.data.data;
  },

  create: async (data: import('@/types/api').CreateBLInput): Promise<import('@/types/api').BillOfLading> => {
    const response = await api.post<{ data: import('@/types/api').BillOfLading }>('/bl', data);
    return response.data.data;
  },

  update: async (id: string, data: import('@/types/api').UpdateBLInput): Promise<import('@/types/api').BillOfLading> => {
    const response = await api.put<{ data: import('@/types/api').BillOfLading }>(`/bl/${id}`, data);
    return response.data.data;
  },

  // NOTA: El backend no tiene endpoint DELETE para BLs, usar cancel() en su lugar
  // delete: async (id: string): Promise<void> => {
  //   await api.delete(`/bl/${id}`);
  // },

  approve: async (id: string): Promise<import('@/types/api').BillOfLading> => {
    const response = await api.post<{ data: import('@/types/api').BillOfLading }>(`/bl/${id}/approve`);
    return response.data.data;
  },

  cancel: async (id: string, reason: string): Promise<import('@/types/api').BillOfLading> => {
    const response = await api.post<{ data: import('@/types/api').BillOfLading }>(`/bl/${id}/cancel`, { reason });
    return response.data.data;
  },

  getProgress: async (id: string): Promise<{
    totalWeight: number;
    deliveredWeight: number;
    pendingWeight: number;
    progressPercent: number;
    totalTrips: number;
    deliveredTrips: number;
    pendingTrips: number;
    tripsByStatus?: {
      scheduled: number;
      inTransit: number;
      delivered: number;
      cancelled: number;
    };
  }> => {
    const response = await api.get<{ data: {
      totalWeight: number;
      deliveredWeight: number;
      pendingWeight: number;
      progressPercent: number;
      totalTrips: number;
      deliveredTrips: number;
      pendingTrips: number;
      tripsByStatus?: {
        scheduled: number;
        inTransit: number;
        delivered: number;
        cancelled: number;
      };
    } }>(`/bl/${id}/progress`);
    return response.data.data;
  },

  search: async (query: string): Promise<import('@/types/api').BillOfLading[]> => {
    const response = await api.get<{ data: import('@/types/api').BillOfLading[] }>('/bl/search', { q: query });
    return response.data.data;
  },

  importFromJSON: async (items: Array<{ blNumber: string; clientNit: string; clientName: string; totalWeight: number; unitCount: number; cargoType?: string; originPort: string; customsPoint: string; finalDestination: string }>): Promise<{ total: number; created: number; skipped: number; errors: string[] }> => {
    const response = await api.post<{ data: { total: number; created: number; skipped: number; errors: string[] } }>('/bl/import/json', items);
    return response.data.data;
  },
};

// ==========================================
// Fleet API - Trucks
// ==========================================
interface BackendTrucksResponse {
  success: boolean;
  message: string;
  data: {
    trucks: import('@/types/api').Truck[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

export const trucksApi = {
  getAll: async (params?: import('@/types/api').TruckListParams): Promise<import('@/types/api').PaginatedResponse<import('@/types/api').Truck>> => {
    const response = await api.get<BackendTrucksResponse>('/fleet/trucks', params);
    const { trucks, total, page, limit, totalPages } = response.data.data;

    return {
      data: trucks,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },

  getAvailable: async (date?: string): Promise<import('@/types/api').Truck[]> => {
    const params = date ? { date } : undefined;
    const response = await api.get<{ data: import('@/types/api').Truck[] }>('/fleet/trucks/available', params);
    return response.data.data;
  },

  search: async (query: string): Promise<import('@/types/api').Truck[]> => {
    const response = await api.get<{ data: import('@/types/api').Truck[] }>('/fleet/trucks/search', { q: query });
    return response.data.data;
  },

  getById: async (id: string): Promise<import('@/types/api').Truck> => {
    const response = await api.get<{ data: import('@/types/api').Truck }>(`/fleet/trucks/${id}`);
    return response.data.data;
  },

  create: async (data: import('@/types/api').CreateTruckInput): Promise<import('@/types/api').Truck> => {
    const response = await api.post<{ data: import('@/types/api').Truck }>('/fleet/trucks', data);
    return response.data.data;
  },

  update: async (id: string, data: import('@/types/api').UpdateTruckInput): Promise<import('@/types/api').Truck> => {
    const response = await api.put<{ data: import('@/types/api').Truck }>(`/fleet/trucks/${id}`, data);
    return response.data.data;
  },

  updateMileage: async (id: string, mileage: number): Promise<import('@/types/api').Truck> => {
    const response = await api.patch<{ data: import('@/types/api').Truck }>(`/fleet/trucks/${id}/mileage`, { mileage });
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/fleet/trucks/${id}`);
  },

  restore: async (id: string): Promise<import('@/types/api').Truck> => {
    const response = await api.post<{ data: import('@/types/api').Truck }>(`/fleet/trucks/${id}/restore`);
    return response.data.data;
  },
};

// ==========================================
// Fleet API - Trailers
// ==========================================
interface BackendTrailersResponse {
  success: boolean;
  message: string;
  data: {
    trailers: import('@/types/api').Trailer[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

export const trailersApi = {
  getAll: async (params?: import('@/types/api').TrailerListParams): Promise<import('@/types/api').PaginatedResponse<import('@/types/api').Trailer>> => {
    const response = await api.get<BackendTrailersResponse>('/fleet/trailers', params);
    const { trailers, total, page, limit, totalPages } = response.data.data;

    return {
      data: trailers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },

  getAvailable: async (): Promise<import('@/types/api').Trailer[]> => {
    const response = await api.get<{ data: import('@/types/api').Trailer[] }>('/fleet/trailers/available');
    return response.data.data;
  },

  search: async (query: string): Promise<import('@/types/api').Trailer[]> => {
    const response = await api.get<{ data: import('@/types/api').Trailer[] }>('/fleet/trailers/search', { q: query });
    return response.data.data;
  },

  getById: async (id: string): Promise<import('@/types/api').Trailer> => {
    const response = await api.get<{ data: import('@/types/api').Trailer }>(`/fleet/trailers/${id}`);
    return response.data.data;
  },

  create: async (data: import('@/types/api').CreateTrailerInput): Promise<import('@/types/api').Trailer> => {
    const response = await api.post<{ data: import('@/types/api').Trailer }>('/fleet/trailers', data);
    return response.data.data;
  },

  update: async (id: string, data: import('@/types/api').UpdateTrailerInput): Promise<import('@/types/api').Trailer> => {
    const response = await api.put<{ data: import('@/types/api').Trailer }>(`/fleet/trailers/${id}`, data);
    return response.data.data;
  },

  assign: async (id: string, truckId: string | null): Promise<import('@/types/api').Trailer> => {
    const response = await api.patch<{ data: import('@/types/api').Trailer }>(`/fleet/trailers/${id}/assign`, { truckId });
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/fleet/trailers/${id}`);
  },

  restore: async (id: string): Promise<import('@/types/api').Trailer> => {
    const response = await api.post<{ data: import('@/types/api').Trailer }>(`/fleet/trailers/${id}/restore`);
    return response.data.data;
  },
};

// ==========================================
// Drivers API
// ==========================================
interface BackendDriversResponse {
  success: boolean;
  message: string;
  data: {
    drivers: import('@/types/api').Driver[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

export const driversApi = {
  getAll: async (params?: import('@/types/api').DriverListParams): Promise<import('@/types/api').PaginatedResponse<import('@/types/api').Driver>> => {
    const response = await api.get<BackendDriversResponse>('/drivers', params);
    const { drivers, total, page, limit, totalPages } = response.data.data;

    return {
      data: drivers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },

  getAvailable: async (): Promise<import('@/types/api').Driver[]> => {
    const response = await api.get<{ data: import('@/types/api').Driver[] }>('/drivers/available');
    return response.data.data;
  },

  search: async (query: string): Promise<import('@/types/api').Driver[]> => {
    const response = await api.get<{ data: import('@/types/api').Driver[] }>('/drivers/search', { q: query });
    return response.data.data;
  },

  getById: async (id: string): Promise<import('@/types/api').Driver> => {
    const response = await api.get<{ data: import('@/types/api').Driver }>(`/drivers/${id}`);
    return response.data.data;
  },

  getStats: async (id: string): Promise<import('@/types/api').DriverStats> => {
    const response = await api.get<{ data: import('@/types/api').DriverStats }>(`/drivers/${id}/stats`);
    return response.data.data;
  },

  create: async (data: import('@/types/api').CreateDriverInput): Promise<import('@/types/api').Driver> => {
    const response = await api.post<{ data: import('@/types/api').Driver }>('/drivers', data);
    return response.data.data;
  },

  update: async (id: string, data: import('@/types/api').UpdateDriverInput): Promise<import('@/types/api').Driver> => {
    const response = await api.put<{ data: import('@/types/api').Driver }>(`/drivers/${id}`, data);
    return response.data.data;
  },

  setAvailability: async (id: string, isAvailable: boolean): Promise<import('@/types/api').Driver> => {
    const response = await api.patch<{ data: import('@/types/api').Driver }>(`/drivers/${id}/availability`, { isAvailable });
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/drivers/${id}`);
  },

  restore: async (id: string): Promise<import('@/types/api').Driver> => {
    const response = await api.post<{ data: import('@/types/api').Driver }>(`/drivers/${id}/restore`);
    return response.data.data;
  },
};

// ==========================================
// Expenses API
// ==========================================
interface BackendExpensesResponse {
  success: boolean;
  message: string;
  data: {
    expenses: import('@/types/api').Expense[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

export const expensesApi = {
  getAll: async (params?: import('@/types/api').ExpenseListParams): Promise<import('@/types/api').PaginatedResponse<import('@/types/api').Expense>> => {
    const response = await api.get<BackendExpensesResponse>('/expenses', params);
    const { expenses, total, page, limit, totalPages } = response.data.data;

    return {
      data: expenses,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },

  getCategories: async (): Promise<import('@/types/api').ExpenseCategoryOption[]> => {
    const response = await api.get<{ data: import('@/types/api').ExpenseCategoryOption[] }>('/expenses/categories');
    return response.data.data;
  },

  getStats: async (params?: { driverId?: string; dateFrom?: string; dateTo?: string }): Promise<import('@/types/api').ExpenseStats> => {
    const response = await api.get<{ data: import('@/types/api').ExpenseStats }>('/expenses/stats', params);
    return response.data.data;
  },

  getByDriver: async (driverId: string, limit?: number): Promise<import('@/types/api').Expense[]> => {
    const params = limit ? { limit } : undefined;
    const response = await api.get<{ data: import('@/types/api').Expense[] }>(`/expenses/driver/${driverId}`, params);
    return response.data.data;
  },

  getByTrip: async (tripId: string): Promise<import('@/types/api').Expense[]> => {
    const response = await api.get<{ data: import('@/types/api').Expense[] }>(`/expenses/trip/${tripId}`);
    return response.data.data;
  },

  getById: async (id: string): Promise<import('@/types/api').Expense> => {
    const response = await api.get<{ data: import('@/types/api').Expense }>(`/expenses/${id}`);
    return response.data.data;
  },

  create: async (data: import('@/types/api').CreateExpenseInput): Promise<import('@/types/api').Expense> => {
    const response = await api.post<{ data: import('@/types/api').Expense }>('/expenses', data);
    return response.data.data;
  },

  update: async (id: string, data: import('@/types/api').UpdateExpenseInput): Promise<import('@/types/api').Expense> => {
    const response = await api.put<{ data: import('@/types/api').Expense }>(`/expenses/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/expenses/${id}`);
  },
};

// ==========================================
// Trips API
// ==========================================
interface BackendTripsResponse {
  success: boolean;
  message: string;
  data: {
    trips: import('@/types/api').Trip[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

export const tripsApi = {
  getAll: async (params?: import('@/types/api').TripListParams): Promise<import('@/types/api').PaginatedResponse<import('@/types/api').Trip>> => {
    const response = await api.get<BackendTripsResponse>('/trips', params);
    const { trips, total, page, limit, totalPages } = response.data.data;

    return {
      data: trips,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },

  getById: async (id: string): Promise<import('@/types/api').Trip> => {
    const response = await api.get<{ data: import('@/types/api').Trip }>(`/trips/${id}`);
    return response.data.data;
  },

  create: async (data: import('@/types/api').CreateTripInput): Promise<import('@/types/api').Trip> => {
    const response = await api.post<{ data: import('@/types/api').Trip }>('/trips', data);
    return response.data.data;
  },

  update: async (id: string, data: import('@/types/api').UpdateTripInput): Promise<import('@/types/api').Trip> => {
    const response = await api.put<{ data: import('@/types/api').Trip }>(`/trips/${id}`, data);
    return response.data.data;
  },

  updateStatus: async (id: string, status: import('@/types/api').TripStatus): Promise<import('@/types/api').Trip> => {
    const response = await api.patch<{ data: import('@/types/api').Trip }>(`/trips/${id}/status`, { status });
    return response.data.data;
  },

  getStats: async (): Promise<import('@/types/api').TripStats> => {
    const response = await api.get<{ data: import('@/types/api').TripStats }>('/trips/stats');
    return response.data.data;
  },

  getAvailableResources: async (): Promise<import('@/types/api').AvailableResources> => {
    const response = await api.get<{ data: import('@/types/api').AvailableResources }>('/trips/available');
    return response.data.data;
  },

  search: async (query: string): Promise<import('@/types/api').Trip[]> => {
    const response = await api.get<{ data: import('@/types/api').Trip[] }>('/trips/search', { q: query });
    return response.data.data;
  },
};

// ==========================================
// Border Crossings API
// ==========================================
interface BackendBorderCrossingsResponse {
  success: boolean;
  message: string;
  data: {
    crossings: import('@/types/api').BorderCrossing[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

export const borderCrossingsApi = {
  getAll: async (params?: import('@/types/api').BorderCrossingListParams): Promise<import('@/types/api').PaginatedResponse<import('@/types/api').BorderCrossing>> => {
    const response = await api.get<BackendBorderCrossingsResponse>('/border-crossings', params);
    const { crossings, total, page, limit, totalPages } = response.data.data;

    return {
      data: crossings,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },

  getById: async (id: string): Promise<import('@/types/api').BorderCrossing> => {
    const response = await api.get<{ data: import('@/types/api').BorderCrossing }>(`/border-crossings/${id}`);
    return response.data.data;
  },

  getByTrip: async (tripId: string): Promise<import('@/types/api').BorderCrossing[]> => {
    const response = await api.get<{ data: import('@/types/api').BorderCrossing[] }>(`/border-crossings/trip/${tripId}`);
    return response.data.data;
  },

  create: async (data: import('@/types/api').CreateBorderCrossingInput): Promise<import('@/types/api').BorderCrossing> => {
    const response = await api.post<{ data: import('@/types/api').BorderCrossing }>('/border-crossings', data);
    return response.data.data;
  },

  registerExit: async (id: string): Promise<import('@/types/api').BorderCrossing> => {
    const response = await api.post<{ data: import('@/types/api').BorderCrossing }>(`/border-crossings/${id}/exit`);
    return response.data.data;
  },

  addChannelHistory: async (id: string, data: import('@/types/api').AddChannelHistoryInput): Promise<import('@/types/api').BorderChannelHistory> => {
    const response = await api.post<{ data: import('@/types/api').BorderChannelHistory }>(`/border-crossings/${id}/channel`, data);
    return response.data.data;
  },

  getChannelHistory: async (id: string): Promise<import('@/types/api').BorderChannelHistory[]> => {
    const response = await api.get<{ data: import('@/types/api').BorderChannelHistory[] }>(`/border-crossings/${id}/history`);
    return response.data.data;
  },

  getActive: async (): Promise<import('@/types/api').BorderCrossing[]> => {
    const response = await api.get<{ data: import('@/types/api').BorderCrossing[] }>('/border-crossings/active');
    return response.data.data;
  },

  getStats: async (): Promise<import('@/types/api').BorderCrossingStats> => {
    const response = await api.get<{ data: import('@/types/api').BorderCrossingStats }>('/border-crossings/stats');
    return response.data.data;
  },

  getBorderNames: async (): Promise<string[]> => {
    const response = await api.get<{ data: string[] }>('/border-crossings/names');
    return response.data.data;
  },
};

// ==========================================
// Documents API
// ==========================================
interface BackendDocumentsResponse {
  success: boolean;
  message: string;
  data: {
    documents: import('@/types/api').TripDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

export const documentsApi = {
  getAll: async (params?: import('@/types/api').DocumentListParams): Promise<import('@/types/api').PaginatedResponse<import('@/types/api').TripDocument>> => {
    const response = await api.get<BackendDocumentsResponse>('/documents', params);
    const { documents, total, page, limit, totalPages } = response.data.data;

    return {
      data: documents,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },

  getById: async (id: string): Promise<import('@/types/api').TripDocument> => {
    const response = await api.get<{ data: import('@/types/api').TripDocument }>(`/documents/${id}`);
    return response.data.data;
  },

  getByTrip: async (tripId: string): Promise<import('@/types/api').TripDocument[]> => {
    const response = await api.get<{ data: import('@/types/api').TripDocument[] }>(`/documents/trip/${tripId}`);
    return response.data.data;
  },

  create: async (data: import('@/types/api').CreateDocumentInput): Promise<import('@/types/api').TripDocument> => {
    const response = await api.post<{ data: import('@/types/api').TripDocument }>('/documents', data);
    return response.data.data;
  },

  update: async (id: string, data: import('@/types/api').UpdateDocumentInput): Promise<import('@/types/api').TripDocument> => {
    const response = await api.put<{ data: import('@/types/api').TripDocument }>(`/documents/${id}`, data);
    return response.data.data;
  },

  updateStatus: async (id: string, status: import('@/types/api').DocumentStatus): Promise<import('@/types/api').TripDocument> => {
    const response = await api.patch<{ data: import('@/types/api').TripDocument }>(`/documents/${id}/status`, { status });
    return response.data.data;
  },

  markAsReceived: async (id: string): Promise<import('@/types/api').TripDocument> => {
    const response = await api.post<{ data: import('@/types/api').TripDocument }>(`/documents/${id}/receive`);
    return response.data.data;
  },

  markAsVerified: async (id: string): Promise<import('@/types/api').TripDocument> => {
    const response = await api.post<{ data: import('@/types/api').TripDocument }>(`/documents/${id}/verify`);
    return response.data.data;
  },

  getStats: async (): Promise<import('@/types/api').DocumentStats> => {
    const response = await api.get<{ data: import('@/types/api').DocumentStats }>('/documents/stats');
    return response.data.data;
  },
};

// ==========================================
// Settlements API
// ==========================================
interface BackendSettlementsResponse {
  success: boolean;
  message: string;
  data: {
    settlements: import('@/types/api').Settlement[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

export const settlementsApi = {
  getAll: async (params?: import('@/types/api').SettlementListParams): Promise<import('@/types/api').PaginatedResponse<import('@/types/api').Settlement>> => {
    const response = await api.get<BackendSettlementsResponse>('/settlements', params);
    const { settlements, total, page, limit, totalPages } = response.data.data;

    return {
      data: settlements,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },

  getById: async (id: string): Promise<import('@/types/api').Settlement> => {
    const response = await api.get<{ data: import('@/types/api').Settlement }>(`/settlements/${id}`);
    return response.data.data;
  },

  getByTrip: async (tripId: string): Promise<import('@/types/api').Settlement | null> => {
    const response = await api.get<{ data: import('@/types/api').Settlement | null }>(`/settlements/trip/${tripId}`);
    return response.data.data;
  },

  create: async (data: import('@/types/api').CreateSettlementInput): Promise<import('@/types/api').Settlement> => {
    const response = await api.post<{ data: import('@/types/api').Settlement }>('/settlements', data);
    return response.data.data;
  },

  update: async (id: string, data: import('@/types/api').UpdateSettlementInput): Promise<import('@/types/api').Settlement> => {
    const response = await api.put<{ data: import('@/types/api').Settlement }>(`/settlements/${id}`, data);
    return response.data.data;
  },

  approve: async (id: string): Promise<import('@/types/api').Settlement> => {
    const response = await api.post<{ data: import('@/types/api').Settlement }>(`/settlements/${id}/approve`);
    return response.data.data;
  },

  markAsPaid: async (id: string): Promise<import('@/types/api').Settlement> => {
    const response = await api.post<{ data: import('@/types/api').Settlement }>(`/settlements/${id}/pay`);
    return response.data.data;
  },

  getStats: async (params?: { dateFrom?: string; dateTo?: string }): Promise<import('@/types/api').SettlementStats> => {
    const response = await api.get<{ data: import('@/types/api').SettlementStats }>('/settlements/stats', params);
    return response.data.data;
  },

  // Calculate settlement values from trip data (for pre-filling forms)
  calculateFromTrip: async (tripId: string, params?: { exchangeRate?: number; freightUsd?: number; externalCommission?: number; advance?: number }): Promise<import('@/types/api').SettlementCalculation> => {
    const response = await api.get<{ data: import('@/types/api').SettlementCalculation }>(`/settlements/calculate/${tripId}`, params);
    return response.data.data;
  },

  getPending: async (): Promise<import('@/types/api').Settlement[]> => {
    const response = await api.get<{ data: import('@/types/api').Settlement[] }>('/settlements/pending');
    return response.data.data;
  },
};

// ==========================================
// Invoices API
// ==========================================
interface BackendInvoicesResponse {
  success: boolean;
  message: string;
  data: {
    invoices: import('@/types/api').Invoice[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

export const invoicesApi = {
  getAll: async (params?: import('@/types/api').InvoiceListParams): Promise<import('@/types/api').PaginatedResponse<import('@/types/api').Invoice>> => {
    const response = await api.get<BackendInvoicesResponse>('/invoices', params);
    const { invoices, total, page, limit, totalPages } = response.data.data;

    return {
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },

  getById: async (id: string): Promise<import('@/types/api').Invoice> => {
    const response = await api.get<{ data: import('@/types/api').Invoice }>(`/invoices/${id}`);
    return response.data.data;
  },

  getByNumber: async (invoiceNumber: string): Promise<import('@/types/api').Invoice> => {
    const response = await api.get<{ data: import('@/types/api').Invoice }>(`/invoices/number/${invoiceNumber}`);
    return response.data.data;
  },

  create: async (data: import('@/types/api').CreateInvoiceInput): Promise<import('@/types/api').Invoice> => {
    const response = await api.post<{ data: import('@/types/api').Invoice }>('/invoices', data);
    return response.data.data;
  },

  update: async (id: string, data: import('@/types/api').UpdateInvoiceInput): Promise<import('@/types/api').Invoice> => {
    const response = await api.put<{ data: import('@/types/api').Invoice }>(`/invoices/${id}`, data);
    return response.data.data;
  },

  approve: async (id: string): Promise<import('@/types/api').Invoice> => {
    const response = await api.post<{ data: import('@/types/api').Invoice }>(`/invoices/${id}/approve`);
    return response.data.data;
  },

  markAsPaid: async (id: string): Promise<import('@/types/api').Invoice> => {
    const response = await api.post<{ data: import('@/types/api').Invoice }>(`/invoices/${id}/pay`);
    return response.data.data;
  },

  cancel: async (id: string, reason: string): Promise<import('@/types/api').Invoice> => {
    const response = await api.post<{ data: import('@/types/api').Invoice }>(`/invoices/${id}/cancel`, { reason });
    return response.data.data;
  },

  addTrip: async (invoiceId: string, tripId: string): Promise<void> => {
    await api.post(`/invoices/${invoiceId}/trips`, { tripId });
  },

  removeTrip: async (invoiceId: string, tripId: string): Promise<void> => {
    await api.delete(`/invoices/${invoiceId}/trips/${tripId}`);
  },

  getByClient: async (clientId: string): Promise<import('@/types/api').Invoice[]> => {
    const response = await api.get<{ data: import('@/types/api').Invoice[] }>(`/invoices/client/${clientId}`);
    return response.data.data;
  },

  getPending: async (): Promise<import('@/types/api').Invoice[]> => {
    const response = await api.get<{ data: import('@/types/api').Invoice[] }>('/invoices/pending');
    return response.data.data;
  },

  getStats: async (params?: { clientId?: string; dateFrom?: string; dateTo?: string }): Promise<import('@/types/api').InvoiceStats> => {
    const response = await api.get<{ data: import('@/types/api').InvoiceStats }>('/invoices/stats', params);
    return response.data.data;
  },

  // Calculate invoice values from trips (for pre-filling forms)
  calculateFromTrips: async (tripIds: string[], exchangeRate?: number): Promise<import('@/types/api').InvoiceCalculation> => {
    const response = await api.post<{ data: import('@/types/api').InvoiceCalculation }>('/invoices/calculate', { tripIds, exchangeRate });
    return response.data.data;
  },
};

// ==========================================
// Routes API
// ==========================================
interface BackendRoutesResponse {
  success: boolean;
  message: string;
  data: {
    routes: import('@/types/api').Route[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

export const routesApi = {
  getAll: async (params?: { page?: number; limit?: number }): Promise<import('@/types/api').PaginatedResponse<import('@/types/api').Route>> => {
    const response = await api.get<BackendRoutesResponse>('/routes', params);
    const { routes, total, page, limit, totalPages } = response.data.data;

    return {
      data: routes,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },

  getCommon: async (): Promise<import('@/types/api').Route[]> => {
    const response = await api.get<{ data: import('@/types/api').Route[] }>('/routes/common');
    return response.data.data;
  },

  getByTrip: async (tripId: string): Promise<import('@/types/api').Route[]> => {
    const response = await api.get<{ data: import('@/types/api').Route[] }>(`/routes/trip/${tripId}`);
    return response.data.data;
  },

  getById: async (id: string): Promise<import('@/types/api').Route> => {
    const response = await api.get<{ data: import('@/types/api').Route }>(`/routes/${id}`);
    return response.data.data;
  },

  create: async (data: import('@/types/api').CreateRouteInput): Promise<import('@/types/api').Route> => {
    const response = await api.post<{ data: import('@/types/api').Route }>('/routes', data);
    return response.data.data;
  },

  update: async (id: string, data: import('@/types/api').UpdateRouteInput): Promise<import('@/types/api').Route> => {
    const response = await api.put<{ data: import('@/types/api').Route }>(`/routes/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/routes/${id}`);
  },
};

export default apiClient;
