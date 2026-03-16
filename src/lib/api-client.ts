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

  getCredit: async (id: string): Promise<{ hasCredit: boolean; creditLimit: number; usedCredit: number; availableCredit: number }> => {
    const response = await api.get<{ data: { hasCredit: boolean; creditLimit: number; usedCredit: number; availableCredit: number } }>(`/clients/${id}/credit`);
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

  getProgress: async (id: string): Promise<{ totalWeight: number; transportedWeight: number; remainingWeight: number; progressPercent: number }> => {
    const response = await api.get<{ data: { totalWeight: number; transportedWeight: number; remainingWeight: number; progressPercent: number } }>(`/bl/${id}/progress`);
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

export default apiClient;
