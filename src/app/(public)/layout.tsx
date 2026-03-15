'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, isHydrated } = useAuth();

  useEffect(() => {
    // Redirect to dashboard if already authenticated
    if (isHydrated && !isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router, isHydrated]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1B3F66] p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
