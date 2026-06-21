'use client';

import { useEffect, type ReactNode } from 'react';
import { useAppStore } from '@/stores/use-app-store';
import { setMockDb } from '@/lib/api-client';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useSupabaseRealtime } from '@/hooks/use-supabase-realtime';

export function ApiProvider({ children }: { children: ReactNode }) {
  const isInitialized = useAppStore((state) => state.isInitialized);
  const initializeStore = useAppStore((state) => state.initializeStore);
  const language = useAppStore((state) => state.language);
  const theme = useAppStore((state) => state.theme);
  const customers = useAppStore((state) => state.customers);
  const suppliers = useAppStore((state) => state.suppliers);
  const products = useAppStore((state) => state.products);
  const invoices = useAppStore((state) => state.invoices);
  const treasuryTransactions = useAppStore((state) => state.treasuryTransactions);

  useSupabaseRealtime();

  useEffect(() => {
    if (!isInitialized) {
      initializeStore();
    }
  }, [isInitialized, initializeStore]);

  useEffect(() => {
    if (isInitialized && !isSupabaseConfigured) {
      setMockDb({
        customers, suppliers, products, invoices,
        categories: useAppStore.getState().categories,
        quotations: useAppStore.getState().quotations,
        purchaseOrders: useAppStore.getState().purchaseOrders,
        returns: useAppStore.getState().returns,
        treasuryAccounts: useAppStore.getState().treasuryAccounts,
        treasuryTransactions,
        warehouses: useAppStore.getState().warehouses,
        stockMovements: useAppStore.getState().stockMovements,
        employees: useAppStore.getState().employees,
        assets: useAppStore.getState().assets,
        journalEntries: useAppStore.getState().journalEntries,
        chartOfAccounts: useAppStore.getState().chartOfAccounts,
        notifications: useAppStore.getState().notifications,
        auditLogs: useAppStore.getState().auditLogs,
        settings: useAppStore.getState().settings,
        variants: useAppStore.getState().variants,
        importHistory: useAppStore.getState().importHistory,
        discountRules: useAppStore.getState().discountRules,
        payrollRecords: useAppStore.getState().payrollRecords,
      });
    }
  }, [isInitialized, isSupabaseConfigured, customers, suppliers, products, invoices, treasuryTransactions]);

  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-slate-600 dark:text-slate-400">Loading Mohasebeyad...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
