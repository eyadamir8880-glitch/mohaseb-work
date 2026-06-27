'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/use-app-store';
import { isSupabaseConfigured, getSupabase } from '@/lib/supabase';
import { apiClient } from '@/lib/api-client';
import type { RealtimeChannel } from '@supabase/supabase-js';

const TABLE_MODULE_MAP: Record<string, string> = {
  customers: 'customers',
  suppliers: 'suppliers',
  products: 'products',
  product_variants: 'variants',
  categories: 'categories',
  invoices: 'invoices',
  quotations: 'quotations',
  purchase_orders: 'purchaseOrders',
  returns: 'returns',
  treasury_accounts: 'treasuryAccounts',
  treasury_transactions: 'treasuryTransactions',
  warehouses: 'warehouses',
  stock_movements: 'stockMovements',
  employees: 'employees',
  payroll_records: 'payrollRecords',
  assets: 'assets',
  journal_entries: 'journalEntries',
  chart_of_accounts: 'chartOfAccounts',
  notifications: 'notifications',
  audit_logs: 'auditLogs',
  settings: 'settings',
  import_sessions: 'importHistory',
  discount_rules: 'discountRules',
  payment_methods: 'paymentMethods',
  external_purchases: 'externalPurchases',
  customer_statements: 'customerStatements',
  invoice_items: 'invoiceItems',
  invoice_payments: 'payments',
  quotation_items: 'quotationItems',
  purchase_order_items: 'purchaseOrderItems',
  return_items: 'returnItems',
  deliveries: 'deliveries',
};

const POLL_MODULES = [
  'customers', 'suppliers', 'products', 'variants', 'categories',
  'invoices', 'quotations', 'purchaseOrders', 'returns',
  'treasuryAccounts', 'treasuryTransactions', 'warehouses',
  'stockMovements', 'employees', 'payrollRecords', 'assets',
  'journalEntries', 'chartOfAccounts', 'notifications', 'auditLogs',
  'settings', 'importHistory', 'discountRules', 'paymentMethods',
  'externalPurchases', 'customerStatements',
];

export function useSupabaseRealtime() {
  const isInitialized = useAppStore((s) => s.isInitialized);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounceRef = useRef<Record<string, number>>({});
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPollRef = useRef<Record<string, { id: string | null; createdAt: string | null }>>({});
  const pollCountRef = useRef(0);

  useEffect(() => {
    if (!isSupabaseConfigured || !isInitialized) return;

    const supabase = getSupabase();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        async (payload) => {
          const table = payload.table as string;
          const module = TABLE_MODULE_MAP[table];
          if (!module || module === 'invoiceItems' || module === 'quotationItems' || module === 'purchaseOrderItems' || module === 'returnItems' || module === 'deliveries') return;

          if (debounceRef.current[module]) {
            clearTimeout(debounceRef.current[module]);
          }

          debounceRef.current[module] = window.setTimeout(async () => {
            try {
              const res = await apiClient.get<any[]>(module);
              if (res.data) {
                useAppStore.setState({ [module]: res.data });
              }
            } catch (err) {
              console.error(`Realtime refetch failed for ${module}:`, err);
            }
          }, 500);
        }
      )
      .subscribe((status) => {
        console.log('Supabase Realtime status:', status);
      });

    channelRef.current = channel;

    // Initialize poll state for all modules
    for (const m of POLL_MODULES) {
      lastPollRef.current[m] = { id: null, createdAt: null };
    }

    // Polling fallback: every 5 seconds check for changes
    // Lightweight check (limit:1, default sort by created_at DESC) every cycle
    // Full refetch every 60 seconds to catch updates and mid-list deletions
    const startPolling = () => {
      pollIntervalRef.current = setInterval(async () => {
        pollCountRef.current++;
        const isFullCycle = pollCountRef.current % 12 === 0;

        if (isFullCycle) {
          for (const module of POLL_MODULES) {
            try {
              const res = await apiClient.get<any[]>(module);
              if (res.data) {
                useAppStore.setState({ [module]: res.data });
              }
            } catch {}
          }
          return;
        }

        for (const module of POLL_MODULES) {
          try {
            const res = await apiClient.get<any[]>(module, { limit: 1 });
            const state = lastPollRef.current[module];
            if (res.data && res.data.length > 0) {
              const record = res.data[0];
              const changed = !state || state.id === null || state.id !== record.id || state.createdAt !== record.createdAt;
              if (changed) {
                const full = await apiClient.get<any[]>(module);
                if (full.data) {
                  useAppStore.setState({ [module]: full.data });
                }
              }
              lastPollRef.current[module] = { id: record.id, createdAt: record.createdAt };
            } else {
              if (state && state.id !== null) {
                useAppStore.setState({ [module]: [] });
              }
              lastPollRef.current[module] = { id: null, createdAt: null };
            }
          } catch {}
        }
      }, 5000);
    };

    // Only poll when page is visible
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (!pollIntervalRef.current) startPolling();
      } else {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    startPolling();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      Object.values(debounceRef.current).forEach(clearTimeout);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isInitialized]);
}
