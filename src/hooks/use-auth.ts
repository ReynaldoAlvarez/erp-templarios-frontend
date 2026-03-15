'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { LoginCredentials } from '@/types/api';

export function useAuth() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  
  const {
    user,
    isAuthenticated,
    isLoading,
    login: storeLogin,
    logout: storeLogout,
    refreshUser,
    initialize,
  } = useAuthStore();

  // Wait for hydration to complete to avoid mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      initialize();
    }
  }, [initialize, isHydrated]);

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
    isLoading: isLoading || !isHydrated,
    login,
    logout,
    refreshUser,
    initialize,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isHydrated,
  };
}

// Hook for protecting routes
export function useRequireAuth(redirectTo: string = '/login') {
  const { isAuthenticated, isLoading, user, isHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && !isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo, isHydrated]);

  return { isAuthenticated, isLoading, user };
}

// Hook for redirecting authenticated users
export function useRedirectIfAuthenticated(redirectTo: string = '/dashboard') {
  const { isAuthenticated, isLoading, isHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && !isLoading && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo, isHydrated]);

  return { isAuthenticated, isLoading };
}
