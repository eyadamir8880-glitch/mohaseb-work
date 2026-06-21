'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { ThemeProvider, LanguageProvider, ToastProvider, ApiProvider } from '@/providers';
import { useAppStore } from '@/stores/use-app-store';
import { useEffect } from 'react';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const language = useAppStore((state) => state.language);

  return (
    <div className="flex min-h-screen" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Sidebar />
      <div className={`flex-1 transition-all duration-200 ${sidebarCollapsed ? 'ml-[70px] mr-0' : 'ml-[260px] mr-0'} ${language === 'ar' ? (sidebarCollapsed ? 'mr-[70px] ml-0' : 'mr-[260px] ml-0') : ''}`}>
        <Header />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <ApiProvider>
            <DashboardContent>
              {children}
            </DashboardContent>
          </ApiProvider>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
