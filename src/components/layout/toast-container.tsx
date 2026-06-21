'use client';
import React from 'react';
import { useLanguage } from '@/providers/language-provider';
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToastInternal } from '@/hooks/use-toast';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const colors = {
  success: 'border-green-500 bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200',
  error: 'border-red-500 bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200',
  info: 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200',
  warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200',
};

export function ToastContainer() {
  const { toasts, dismiss } = useToastInternal();
  const { dir } = useLanguage();

  return (
    <div className={cn(
      'fixed top-4 z-[100] flex flex-col gap-2 w-80',
      dir === 'rtl' ? 'left-4' : 'right-4'
    )}>
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-top-2',
              colors[toast.type]
            )}
          >
            <Icon className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="flex-1 text-sm">{toast.message}</p>
            <button onClick={() => dismiss(toast.id)} className="shrink-0 opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
