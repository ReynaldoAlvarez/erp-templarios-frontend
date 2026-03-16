'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { LoginCredentials } from '@/types/api';

export function useAuth() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading,
    login: storeLogin,
    logout: storeLogout,
    refreshUser,
    initialize,
  } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      await storeLogin(credentials);
      router.push('/dashboard');
    },
    [storeLogin, router]
  );

  const logout = useCallback(async () => {
    await storeLogout();
    router.push('/login');
  }, [storeLogout, router]);

  const hasPermission = useCallback(
    (permissionName: string): boolean => {
      if (!user?.permissions) return false;
      return user.permissions.includes(permissionName);
    },
    [user]
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]): boolean => {
      if (!user?.permissions) return false;
      return permissions.some((permission) => hasPermission(permission));
    },
    [user, hasPermission]
  );

  const hasAllPermissions = useCallback(
    (permissions: string[]): boolean => {
      if (!user?.permissions) return false;
      return permissions.every((permission) => hasPermission(permission));
    },
    [user, hasPermission]
  );

  const hasRole = useCallback(
    (roleName: string): boolean => {
      if (!user?.roles) return false;
      return user.roles.includes(roleName);
    },
    [user]
  );

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
  };
}

// Hook for protecting routes
export function useRequireAuth(redirectTo: string = '/login') {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return { isAuthenticated, isLoading, user };
}

// Hook for redirecting authenticated users
export function useRedirectIfAuthenticated(redirectTo: string = '/dashboard') {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return { isAuthenticated, isLoading };
}
