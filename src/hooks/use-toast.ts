'use client';
import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

let toastId = 0;
let globalSetToasts: React.Dispatch<React.SetStateAction<Toast[]>> | null = null;

export function useToastInternal() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  globalSetToasts = setToasts;

  const toast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = `toast_${++toastId}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, toast, dismiss };
}

export function toast(message: string, type: Toast['type'] = 'info') {
  if (globalSetToasts) {
    const id = `toast_${++toastId}`;
    globalSetToasts((prev: Toast[]) => [...prev, { id, message, type }]);
    setTimeout(() => {
      globalSetToasts?.((prev: Toast[]) => prev.filter((t: Toast) => t.id !== id));
    }, 4000);
  }
}
