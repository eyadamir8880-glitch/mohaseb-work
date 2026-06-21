'use client';
import React from 'react';
import { ThemeProvider } from './theme-provider';
import { LanguageProvider } from './language-provider';
import { ToastContainer } from '@/components/layout/toast-container';
import { ToastProvider } from '@/hooks/use-toast-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <ToastContainer />
          {children}
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
