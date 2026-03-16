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
  get: <T>(url: string, params?: Record<string, unknown>) =>
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
interface BackendClientesResponse {
  success: boolean;
  message: string;
  data: import('@/types/api').Cliente[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const clientesApi = {
  getAll: async (params?: import('@/types/api').ClienteListParams): Promise<import('@/types/api').PaginatedResponse<import('@/types/api').Cliente>> => {
    const response = await api.get<BackendClientesResponse>('/clientes', params);
    const { data: clientes, meta } = response.data;

    return {
      data: clientes,
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

  getById: async (id: string): Promise<import('@/types/api').Cliente> => {
    const response = await api.get<{ data: import('@/types/api').Cliente }>(`/clientes/${id}`);
    return response.data.data;
  },

  create: async (data: import('@/types/api').CreateClienteInput): Promise<import('@/types/api').Cliente> => {
    const response = await api.post<{ data: import('@/types/api').Cliente }>('/clientes', data);
    return response.data.data;
  },

  update: async (id: string, data: import('@/types/api').UpdateClienteInput): Promise<import('@/types/api').Cliente> => {
    const response = await api.put<{ data: import('@/types/api').Cliente }>(`/clientes/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/clientes/${id}`);
  },
};

// ==========================================
// BLs API
// ==========================================
interface BackendBLsResponse {
  success: boolean;
  message: string;
  data: import('@/types/api').BL[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const blsApi = {
  getAll: async (params?: import('@/types/api').BLListParams): Promise<import('@/types/api').PaginatedResponse<import('@/types/api').BL>> => {
    const response = await api.get<BackendBLsResponse>('/bls', params);
    const { data: bls, meta } = response.data;

    return {
      data: bls,
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

  getById: async (id: string): Promise<import('@/types/api').BL> => {
    const response = await api.get<{ data: import('@/types/api').BL }>(`/bls/${id}`);
    return response.data.data;
  },

  create: async (data: import('@/types/api').CreateBLInput): Promise<import('@/types/api').BL> => {
    const response = await api.post<{ data: import('@/types/api').BL }>('/bls', data);
    return response.data.data;
  },

  update: async (id: string, data: import('@/types/api').UpdateBLInput): Promise<import('@/types/api').BL> => {
    const response = await api.put<{ data: import('@/types/api').BL }>(`/bls/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/bls/${id}`);
  },

  calcularFlota: async (id: string): Promise<import('@/types/api').CalcularFlotaResult> => {
    const response = await api.post<{ data: import('@/types/api').CalcularFlotaResult }>(`/bls/${id}/calcular-flota`);
    return response.data.data;
  },
};

export default apiClient;
