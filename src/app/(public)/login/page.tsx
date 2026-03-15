'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/components/modules/auth/login-form';
import { useRedirectIfAuthenticated } from '@/hooks/use-auth';

export default function LoginPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useRedirectIfAuthenticated('/dashboard');

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-16 w-16 bg-white/20 rounded-xl" />
          <div className="h-8 w-48 bg-white/20 rounded" />
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full shadow-xl border-0">
      <CardHeader className="space-y-1 pb-4">
        {/* Logo */}
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#1B3F66] p-2 rounded-xl">
              <Truck className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#1B3F66]">TEMPLARIOS</span>
          </div>
        </div>
        <CardTitle className="text-xl text-center text-gray-800">
          Iniciar Sesión
        </CardTitle>
        <p className="text-sm text-center text-gray-500">
          Ingrese sus credenciales para acceder al sistema
        </p>
      </CardHeader>
      <CardContent className="pt-2">
        <LoginForm />
      </CardContent>
    </Card>
  );
}
