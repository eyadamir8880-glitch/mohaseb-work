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

  useSupabaseRealtime();

  useEffect(() => {
    if (isInitialized) return;

    const tryInit = () => {
      if (isSupabaseConfigured) {
        initializeStore();
      } else {
        const state = useAppStore.getState();
        if (state.customers.length > 0 || state.products.length > 0) {
          useAppStore.setState({ isInitialized: true });
        } else {
          initializeStore();
        }
      }
    };

    if (useAppStore.persist.hasHydrated()) {
      tryInit();
    } else {
      const unsub = useAppStore.persist.onFinishHydration(() => {
        tryInit();
      });
      return () => unsub();
    }
  }, [isInitialized, initializeStore]);

  useEffect(() => {
    if (isInitialized && !isSupabaseConfigured) {
      const state = useAppStore.getState();
      setMockDb({
        customers: state.customers,
        suppliers: state.suppliers,
        products: state.products,
        invoices: state.invoices,
        categories: state.categories,
        quotations: state.quotations,
        purchaseOrders: state.purchaseOrders,
        returns: state.returns,
        treasuryAccounts: state.treasuryAccounts,
        treasuryTransactions: state.treasuryTransactions,
        warehouses: state.warehouses,
        stockMovements: state.stockMovements,
        employees: state.employees,
        assets: state.assets,
        journalEntries: state.journalEntries,
        chartOfAccounts: state.chartOfAccounts,
        notifications: state.notifications,
        auditLogs: state.auditLogs,
        settings: state.settings,
        variants: state.variants,
        importHistory: state.importHistory,
        discountRules: state.discountRules,
        payrollRecords: state.payrollRecords,
        externalPurchases: state.externalPurchases,
        customerStatements: state.customerStatements,
      });
    }
  }, [isInitialized, isSupabaseConfigured, language, theme]);

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
