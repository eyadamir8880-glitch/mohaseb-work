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
  invoice_items: 'invoiceItems',
  invoice_payments: 'payments',
  quotation_items: 'quotationItems',
  purchase_order_items: 'purchaseOrderItems',
  return_items: 'returnItems',
  deliveries: 'deliveries',
};

export function useSupabaseRealtime() {
  const isInitialized = useAppStore((s) => s.isInitialized);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounceRef = useRef<Record<string, number>>({});

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
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      Object.values(debounceRef.current).forEach(clearTimeout);
    };
  }, [isInitialized]);
}
