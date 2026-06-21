'use client';
import React, { createContext, useContext } from 'react';
import { useToastInternal } from './use-toast';

const ToastContext = createContext<ReturnType<typeof useToastInternal> | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toastState = useToastInternal();
  return (
    <ToastContext.Provider value={toastState}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
