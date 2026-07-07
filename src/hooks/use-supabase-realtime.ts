'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/use-app-store';
import { isSupabaseConfigured, getSupabase } from '@/lib/supabase';
import { apiClient } from '@/lib/api-client';
import type { RealtimeChannel } from '@supabase/supabase-js';

const TABLE_MODULE_MAP: Record<string, string> = {
  customers: 'customers',
  products: 'products',
  categories: 'categories',
  invoices: 'invoices',
  returns: 'returns',
  treasury_accounts: 'treasuryAccounts',
  treasury_transactions: 'treasuryTransactions',
  warehouses: 'warehouses',
  stock_movements: 'stockMovements',
  chart_of_accounts: 'chartOfAccounts',
  notifications: 'notifications',
  audit_logs: 'auditLogs',
  settings: 'settings',
  import_sessions: 'importHistory',
  discount_rules: 'discountRules',
  payment_methods: 'paymentMethods',
  customer_statements: 'customerStatements',
  invoice_items: 'invoiceItems',
  invoice_payments: 'payments',
  return_items: 'returnItems',
  deliveries: 'deliveries',
};

const POLL_MODULES = [
  'customers', 'products', 'categories',
  'invoices', 'returns',
  'treasuryAccounts', 'treasuryTransactions', 'warehouses',
  'stockMovements', 'chartOfAccounts', 'notifications', 'auditLogs',
  'settings', 'importHistory', 'discountRules', 'paymentMethods',
  'customerStatements',
];

export function useSupabaseRealtime() {
  const isInitialized = useAppStore((s) => s.isInitialized);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounceRef = useRef<Record<string, number>>({});
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPollRef = useRef<Record<string, { id: string | null; createdAt: string | null }>>({});
  const pollCountRef = useRef(0);
  const pollTimestamps = useRef<Record<string, number>>({});

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
          const mod = TABLE_MODULE_MAP[table];
          if (!mod || mod === 'invoiceItems' || mod === 'returnItems' || mod === 'deliveries') return;

          if ((payload as any).event_type === 'DELETE') {
            const recordId = (payload as any).old?.id;
            if (recordId) {
              useAppStore.setState((state: any) => {
                const arr = state[mod];
                if (!Array.isArray(arr)) return {};
                return { [mod]: arr.filter((r: any) => r.id !== recordId) };
              });
            }
            return;
          }

          if (debounceRef.current[mod]) {
            clearTimeout(debounceRef.current[mod]);
          }

          debounceRef.current[mod] = window.setTimeout(async () => {
            try {
              const res = await apiClient.get<any[]>(mod);
              if (res.data) {
                await mergeWithLocal(mod, res.data);
              }
            } catch (err) {
              console.error(`Realtime refetch failed for ${mod}:`, err);
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

    const mergeWithLocal = (module: string, supabaseData: any[]) => {
      const currentData = useAppStore.getState() as any;
      const localData: any[] = currentData[module] || [];
      const supabaseIds = new Set(supabaseData.map((r: any) => r.id));
      const onlyLocal = localData.filter((r: any) => !supabaseIds.has(r.id));
      if (onlyLocal.length > 0) {
        const now = Date.now();
        const lastPoll = pollTimestamps.current[module] || 0;
        const trulyLocal = onlyLocal.filter((r: any) => {
          const age = now - new Date(r.createdAt || r.updatedAt || now).getTime();
          return age < 10000;
        });
        useAppStore.setState({ [module]: [...trulyLocal, ...supabaseData] });
      } else {
        useAppStore.setState({ [module]: supabaseData });
      }
      pollTimestamps.current[module] = Date.now();
    };

    // Polling fallback: every 5 seconds check for changes
    // Lightweight check (limit:1, default sort by created_at DESC) every cycle
    // Full refetch every 60 seconds to catch updates and mid-list deletions
    const startPolling = () => {
      pollIntervalRef.current = setInterval(async () => {
        pollCountRef.current++;
        const isFullCycle = pollCountRef.current % 12 === 0;

        if (isFullCycle) {
          const results = await Promise.all(
            POLL_MODULES.map((module) =>
              apiClient.get<any[]>(module).then(res => ({ module, data: res.data })).catch(() => ({ module, data: null }))
            )
          );
          for (const { module, data } of results) {
            if (data) await mergeWithLocal(module, data);
          }
          return;
        }

        const checkResults = await Promise.all(
          POLL_MODULES.map((module) =>
            apiClient.get<any[]>(module, { limit: 1 }).then(res => ({ module, data: res.data })).catch(() => ({ module, data: null }))
          )
        );
        const changedModules = checkResults.filter(({ module, data }) => {
          const state = lastPollRef.current[module];
          if (data && data.length > 0) {
            const record = data[0];
            const changed = !state || state.id === null || state.id !== record.id || state.createdAt !== record.createdAt;
            lastPollRef.current[module] = { id: record.id, createdAt: record.createdAt };
            return changed;
          }
          const wasDeleted = state && state.id !== null;
          lastPollRef.current[module] = { id: null, createdAt: null };
          return wasDeleted;
        });
        if (changedModules.length > 0) {
          const fullResults = await Promise.all(
            changedModules.map(({ module }) =>
              apiClient.get<any[]>(module).then(res => ({ module, data: res.data })).catch(() => ({ module, data: null }))
            )
          );
          for (const { module, data } of fullResults) {
            if (data) await mergeWithLocal(module, data);
          }
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
        channelRef.current = null;
      }
      Object.values(debounceRef.current).forEach(clearTimeout);
      debounceRef.current = {};
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      lastPollRef.current = {};
      pollCountRef.current = 0;
      pollTimestamps.current = {};
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isInitialized]);
}
