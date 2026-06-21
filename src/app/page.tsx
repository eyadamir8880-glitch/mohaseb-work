'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeProvider, LanguageProvider, ToastProvider, ApiProvider } from '@/providers';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <ApiProvider>
            <div className="flex h-screen items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                <p className="text-lg font-medium">Mohasebeyad</p>
                <p className="text-sm text-slate-500">Redirecting to dashboard...</p>
              </div>
            </div>
          </ApiProvider>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
