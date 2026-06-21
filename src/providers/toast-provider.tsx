'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  showToast: () => {},
  dismissToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2" style={{ direction: 'ltr' }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`animate-slide-in rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm transition-all ${
              toast.variant === 'success' ? 'border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100' :
              toast.variant === 'error' ? 'border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100' :
              toast.variant === 'warning' ? 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100' :
              'border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{toast.title}</p>
                {toast.description && (
                  <p className="mt-1 text-xs opacity-80">{toast.description}</p>
                )}
              </div>
              <button onClick={() => dismissToast(toast.id)} className="shrink-0 opacity-60 hover:opacity-100">
                ✕
              </button>
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="h-full animate-shrink rounded-full bg-current opacity-30" />
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
