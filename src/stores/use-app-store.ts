import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import { generateMockData } from '@/lib/mock-data';
import { PAYMENT_METHODS, DEFAULT_SETTINGS } from '@/lib/constants';
import { generateId } from '@/lib/utils';
import { apiClient, camelToSnake, batchDeleteFromSupabase, updateSetNullFromSupabase } from '@/lib/api-client';
import { isSupabaseConfigured, getSupabase } from '@/lib/supabase';
import type {
  Customer, Product, Category,
  Invoice, InvoicePayment, Return, ReturnItem,
  TreasuryAccount, TreasuryTransaction, Warehouse, StockMovement,
  ChartOfAccount,
  Notification, AuditLog, Setting, ImportSession, DiscountRule, PaymentMethod,
  CustomerStatement, FiscalYear
} from '@/lib/types';

interface AppStore {
  language: 'en' | 'ar';
  theme: 'light' | 'dark';

  customers: Customer[];
  products: Product[];
  categories: Category[];
  invoices: Invoice[];
  returns: Return[];
  treasuryAccounts: TreasuryAccount[];
  treasuryTransactions: TreasuryTransaction[];
  warehouses: Warehouse[];
  stockMovements: StockMovement[];
  chartOfAccounts: ChartOfAccount[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  settings: Setting[];
  importHistory: ImportSession[];
  discountRules: DiscountRule[];
  paymentMethods: PaymentMethod[];
  customerStatements: CustomerStatement[];
  fiscalYears: FiscalYear[];

  sidebarCollapsed: boolean;
  isInitialized: boolean;
  lastSaveTime: number | null;

  setLanguage: (lang: 'en' | 'ar') => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;

  initializeStore: () => Promise<void>;
  resetToDemo: () => void;

  getStateSnapshot: () => any;
  loadState: (state: any) => boolean;

  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  bulkAddProducts: (dataArr: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]) => Product[] | Promise<Product[]>;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => Category;
  updateCategory: (id: string, data: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Invoice;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  recordPayment: (invoiceId: string, payment: Omit<InvoicePayment, 'id' | 'createdAt'>) => InvoicePayment;

  addReturn: (ret: Omit<Return, 'id' | 'createdAt'>) => Return;
  updateReturn: (id: string, data: Partial<Return>) => void;

  addTreasuryAccount: (account: Omit<TreasuryAccount, 'id' | 'createdAt'>) => TreasuryAccount;
  updateTreasuryAccount: (id: string, data: Partial<TreasuryAccount>) => void;
  deleteTreasuryAccount: (id: string) => void;

  addTreasuryTransaction: (transaction: Omit<TreasuryTransaction, 'id' | 'createdAt' | 'updatedAt'>) => TreasuryTransaction;
  updateTreasuryTransaction: (id: string, data: Partial<TreasuryTransaction>) => void;
  deleteTreasuryTransaction: (id: string) => void;

  addWarehouse: (warehouse: Omit<Warehouse, 'id' | 'createdAt'>) => Warehouse;
  updateWarehouse: (id: string, data: Partial<Warehouse>) => void;
  deleteWarehouse: (id: string) => void;

  addStockMovement: (movement: Omit<StockMovement, 'id' | 'createdAt'>) => StockMovement;

  addChartOfAccount: (account: Omit<ChartOfAccount, 'id' | 'createdAt'>) => ChartOfAccount;
  updateChartOfAccount: (id: string, data: Partial<ChartOfAccount>) => void;
  deleteChartOfAccount: (id: string) => void;

  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;

  addAuditLog: (log: Omit<AuditLog, 'id' | 'createdAt'>) => void;

  updateSetting: (key: string, value: string) => void;

  addImportSession: (session: ImportSession) => void;
  clearModuleData: (module: string) => void;

  addDiscountRule: (rule: Omit<DiscountRule, 'id' | 'createdAt'>) => DiscountRule;
  updateDiscountRule: (id: string, data: Partial<DiscountRule>) => void;
  deleteDiscountRule: (id: string) => void;

  updatePaymentMethod: (id: string, data: Partial<PaymentMethod>) => void;
  addCustomPaymentMethod: (method: Omit<PaymentMethod, 'id' | 'isProtected'>) => PaymentMethod;

  addCustomerStatement: (data: Omit<CustomerStatement, 'id' | 'createdAt'>) => CustomerStatement;
  getCustomerStatements: (customerId: string) => CustomerStatement[];

  addFiscalYear: (data: Omit<FiscalYear, 'id' | 'createdAt'>) => FiscalYear;
  updateFiscalYear: (id: string, data: Partial<FiscalYear>) => void;
  closeFiscalYear: (id: string) => void;
  deleteFiscalYear: (id: string) => void;

}

function stripChildArrays(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj;
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!Array.isArray(value)) {
      result[key] = value;
    }
  }
  return result;
}

export const syncPausedModules = new Set<string>();

async function syncToSupabase(method: 'post' | 'put' | 'delete', endpoint: string, data?: any, retries = 3) {
  if (!isSupabaseConfigured) return;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const cleanData = stripChildArrays(data);
      if (method === 'delete') {
        await apiClient.delete(`${endpoint}/${data.id}`);
      } else if (method === 'put') {
        await apiClient.put(`${endpoint}/${data.id}`, cleanData);
      } else {
        await apiClient.post(endpoint, cleanData);
      }
      return;
    } catch (err) {
      if (attempt < retries - 1) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      } else {
        console.error(`Supabase sync failed (${method} ${endpoint}):`, err);
      }
    }
  }
}

const UI_STATE_KEYS = ['language', 'theme', 'sidebarCollapsed'];

const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      // Quota exceeded (data too large for localStorage). Persist only UI state
      // so data-heavy Supabase-backed installs don't crash; data still loads from Supabase.
      try {
        const full = JSON.parse(value || '{}');
        const trimmed: Record<string, unknown> = {};
        for (const k of Object.keys(full)) {
          const v = full[k];
          if (UI_STATE_KEYS.includes(k) || (Array.isArray(v) && v.length === 0) || typeof v !== 'object') {
            trimmed[k] = v;
          }
        }
        localStorage.setItem(name, JSON.stringify(trimmed));
      } catch {
        // storage unavailable; skip persistence
      }
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {}
  },
};

export const useAppStore = create<AppStore>()(
  persist<AppStore>(
    (set, get) => ({
  language: 'en',
  theme: 'light',
  customers: [],
  products: [],
  categories: [],
  invoices: [],
  returns: [],
  treasuryAccounts: [],
  treasuryTransactions: [],
  warehouses: [],
  stockMovements: [],
  chartOfAccounts: [],
  notifications: [],
  auditLogs: [],
  settings: [],
  importHistory: [],
  discountRules: [],
  paymentMethods: [...PAYMENT_METHODS],
  customerStatements: [],
  fiscalYears: [],
  sidebarCollapsed: false,
  isInitialized: false,
  lastSaveTime: null,

  setLanguage: (lang: 'en' | 'ar') => set({ language: lang }),
  setTheme: (theme: 'light' | 'dark') => set({ theme }),
  toggleSidebar: () => set((state: any) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  initializeStore: async () => {
    const modules = [
      'customers', 'products', 'categories',
      'invoices', 'returns',
      'treasuryAccounts', 'treasuryTransactions', 'warehouses',
      'stockMovements', 'chartOfAccounts', 'notifications', 'auditLogs',
      'settings', 'importHistory', 'discountRules', 'paymentMethods',
      'customerStatements', 'fiscalYears',
    ] as const;

    const localState: Record<string, any[]> = {};
    modules.forEach((m) => { localState[m] = (get() as any)[m] || []; });
    const hasLocalData = modules.some(m => localState[m]?.length > 0);

    if (isSupabaseConfigured) {
      try {
        const results = await Promise.all(
          modules.map((m) => apiClient.get<any[]>(m).catch(() => ({ data: [] })))
        );

        const stateData: Record<string, any[]> = {};
        let supabaseHasData = false;

        modules.forEach((m, i) => {
          const localData = localState[m] || [];
          const supabaseData = results[i].data || [];
          const localIds = new Set(localData.map((r: any) => r.id));
          const merged = [...localData];
          for (const r of supabaseData) {
            if (!localIds.has(r.id)) merged.push(r);
          }
          stateData[m] = merged;
          if (supabaseData.length > 0) supabaseHasData = true;
        });

        if (hasLocalData && !supabaseHasData) {
          const tableMap: Record<string, string> = {
            treasuryAccounts: 'treasury_accounts',
            treasuryTransactions: 'treasury_transactions', stockMovements: 'stock_movements',
            chartOfAccounts: 'chart_of_accounts',
            auditLogs: 'audit_logs', importHistory: 'import_sessions',
            discountRules: 'discount_rules', paymentMethods: 'payment_methods',
            customerStatements: 'customer_statements', fiscalYears: 'fiscal_years',
          };
          const supabase = getSupabase();
          for (const m of modules) {
            const data = localState[m];
            if (data && data.length > 0) {
              try {
                const table = tableMap[m] || m;
                for (let i = 0; i < data.length; i += 50) {
                  const batch = data.slice(i, i + 50);
                  // For invoices, upload items and payments separately
                  if (m === 'invoices') {
                    const allItems: any[] = [];
                    const allPayments: any[] = [];
                    const invoiceBatch = batch.map((d: any) => {
                      const { items, payments, ...rest } = d;
                      if (items) items.forEach((item: any) => allItems.push({ ...item, invoiceId: d.id }));
                      if (payments) payments.forEach((p: any) => allPayments.push({ ...p, invoiceId: d.id }));
                      return camelToSnake(rest);
                    });
                    await (supabase as any).from(table).upsert(invoiceBatch, { onConflict: 'id' });
                    if (allItems.length > 0) {
                      await (supabase as any).from('invoice_items').upsert(allItems.map(camelToSnake), { onConflict: 'id' });
                    }
                    if (allPayments.length > 0) {
                      await (supabase as any).from('invoice_payments').upsert(allPayments.map(camelToSnake), { onConflict: 'id' });
                    }
                  } else if (m === 'returns') {
                    const allReturnItems: any[] = [];
                    const returnBatch = batch.map((d: any) => {
                      const { items, ...rest } = d;
                      if (items) items.forEach((item: any) => allReturnItems.push({ ...item, returnId: d.id }));
                      return camelToSnake(rest);
                    });
                    await (supabase as any).from(table).upsert(returnBatch, { onConflict: 'id' });
                    if (allReturnItems.length > 0) {
                      await (supabase as any).from('return_items').upsert(allReturnItems.map(camelToSnake), { onConflict: 'id' });
                    }
                  } else {
                    const cleanBatch = batch.map((d: any) => camelToSnake(d));
                    await (supabase as any).from(table).upsert(cleanBatch, { onConflict: 'id' });
                  }
                }
              } catch (e) { console.error(`Bootstrap upload ${m} failed:`, e); }
            }
          }
        }

        const defaultSettingsArray = Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({
          id: generateId(), key, value: String(value), updatedAt: new Date().toISOString(),
        }));
        set({
          ...stateData,
          settings: stateData.settings.length > 0 ? stateData.settings : defaultSettingsArray,
          paymentMethods: stateData.paymentMethods.length > 0 ? stateData.paymentMethods : [...PAYMENT_METHODS],
          isInitialized: true,
          lastSaveTime: Date.now(),
        } as any);

        get().addAuditLog({
          timestamp: new Date().toISOString(), user: 'System', action: 'created',
          module: 'system', recordId: 'init', oldValues: null,
          newValues: { action: 'Application initialized from Supabase' }, ip: '127.0.0.1',
        });
        return;
      } catch (err) {
        console.error('Supabase init failed, falling back to local/mock data', err);
      }
    }

    if (hasLocalData) {
      set({ isInitialized: true } as any);
    } else {
      set({
        settings: Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({
          id: generateId(), key, value: String(value), updatedAt: new Date().toISOString(),
        })),
        paymentMethods: PAYMENT_METHODS,
        isInitialized: true,
      } as any);
    }
  },

  resetToDemo: () => {
    const data = generateMockData();
    const settingsArray: Setting[] = Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({
      id: generateId(), key, value: String(value), updatedAt: new Date().toISOString(),
    }));
    const finalData = {
      ...data, settings: settingsArray, paymentMethods: PAYMENT_METHODS,
      notifications: [{
        id: generateId(), type: 'system', title: 'Data Reset', titleAr: 'إعادة تعيين البيانات',
        message: 'All demo data has been reset successfully',
        messageAr: 'تم إعادة تعيين جميع البيانات التجريبية بنجاح',
        module: 'system', recordId: 'reset', isRead: false, readAt: null,
        createdAt: new Date().toISOString(),
      }],
      auditLogs: [{
        id: generateId(), timestamp: new Date().toISOString(), user: 'Admin',
        action: 'created', module: 'system', recordId: 'reset',
        oldValues: null, newValues: { action: 'Application data reset to demo' },
        ip: '127.0.0.1', createdAt: new Date().toISOString(),
      }],
    } as any;
    set(finalData);

    if (isSupabaseConfigured) {
      const tableMap: Record<string, string> = {
        treasuryAccounts: 'treasury_accounts',
        treasuryTransactions: 'treasury_transactions', stockMovements: 'stock_movements',
        chartOfAccounts: 'chart_of_accounts',
        auditLogs: 'audit_logs', importHistory: 'import_sessions',
        discountRules: 'discount_rules', paymentMethods: 'payment_methods',
        customerStatements: 'customer_statements', fiscalYears: 'fiscal_years',
      };
      const supabaseTables = ['customers', 'products', 'categories', 'invoices', 'returns',
        'treasury_accounts', 'treasury_transactions', 'warehouses', 'stock_movements',
        'chart_of_accounts', 'notifications', 'audit_logs', 'settings', 'import_sessions',
        'discount_rules', 'payment_methods', 'customer_statements', 'fiscal_years'];
      const supabase = getSupabase();
      // Delete all existing data first
      for (const table of supabaseTables) {
        (supabase as any).from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000').then(() => {}).catch(() => {});
      }
      // Insert new demo data (delayed to allow deletes to start)
      setTimeout(() => {
        const modules = Object.keys(tableMap).concat(['customers', 'products', 'categories', 'invoices', 'returns', 'warehouses']);
        for (const m of modules) {
          const mData = finalData[m];
          if (mData && mData.length > 0) {
            const table = tableMap[m] || m;
            try {
              for (let i = 0; i < mData.length; i += 50) {
                const cleanBatch = mData.slice(i, i + 50).map((d: any) => {
                  const { items, payments, ...rest } = d;
                  return camelToSnake(rest);
                });
                (supabase as any).from(table).upsert(cleanBatch, { onConflict: 'id' }).then(() => {}).catch(() => {});
              }
            } catch {}
          }
        }
      }, 1000);
    }
  },

  getStateSnapshot: () => {
    const state = get();
    const { setLanguage, setTheme, toggleSidebar, initializeStore, resetToDemo,
      getStateSnapshot, loadState, set: _setFn, ...data } = state as any;
    return { version: '1.0', exportedAt: new Date().toISOString(), ...data };
  },

  loadState: (state: any) => {
    try {
      const requiredModules = [
        'customers', 'products', 'categories',
        'invoices', 'returns',
        'treasuryAccounts', 'treasuryTransactions', 'warehouses',
        'stockMovements', 'chartOfAccounts', 'notifications', 'auditLogs',
        'settings', 'importHistory', 'discountRules', 'paymentMethods',
        'customerStatements', 'fiscalYears',
      ];
      for (const mod of requiredModules) {
        if (!Array.isArray(state[mod])) {
          console.error(`Invalid backup: missing ${mod} module data`);
          return false;
        }
      }
      set({
        ...state, isInitialized: true, lastSaveTime: Date.now(),
        language: state.language || 'en', theme: state.theme || 'light',
        sidebarCollapsed: state.sidebarCollapsed || false,
      });

      if (isSupabaseConfigured) {
        const tableMap: Record<string, string> = {
          treasuryAccounts: 'treasury_accounts',
          treasuryTransactions: 'treasury_transactions', stockMovements: 'stock_movements',
          chartOfAccounts: 'chart_of_accounts',
          auditLogs: 'audit_logs', importHistory: 'import_sessions',
          discountRules: 'discount_rules', paymentMethods: 'payment_methods',
          customerStatements: 'customer_statements', fiscalYears: 'fiscal_years',
        };
        const supabase = getSupabase();
        for (const m of requiredModules) {
          const data = state[m];
          if (data && data.length > 0) {
            try {
              const table = tableMap[m] || m;
              if (m === 'invoices') {
                const invoiceItems = data.flatMap((inv: any) => (inv.items || []).map((item: any) => ({ ...item, invoiceId: inv.id })));
                if (invoiceItems.length > 0) {
                  for (let i = 0; i < invoiceItems.length; i += 50) {
                    const batch = invoiceItems.slice(i, i + 50).map((d: any) => camelToSnake(d));
                    (supabase as any).from('invoice_items').upsert(batch, { onConflict: 'id' }).then(() => {}).catch((e: any) => console.error('Batch upsert invoice_items failed:', e));
                  }
                }
                const invoicePayments = data.flatMap((inv: any) => (inv.payments || []).map((p: any) => ({ ...p, invoiceId: inv.id })));
                if (invoicePayments.length > 0) {
                  for (let i = 0; i < invoicePayments.length; i += 50) {
                    const batch = invoicePayments.slice(i, i + 50).map((d: any) => camelToSnake(d));
                    (supabase as any).from('invoice_payments').upsert(batch, { onConflict: 'id' }).then(() => {}).catch((e: any) => console.error('Batch upsert invoice_payments failed:', e));
                  }
                }
                const cleanInvs = data.map((inv: any) => {
                  const { items, payments, ...rest } = inv;
                  return rest;
                });
                for (let i = 0; i < cleanInvs.length; i += 50) {
                  const batch = cleanInvs.slice(i, i + 50).map((d: any) => camelToSnake(d));
                  (supabase as any).from(table).upsert(batch, { onConflict: 'id' }).then(() => {}).catch((e: any) => console.error(`Batch upsert ${table} failed:`, e));
                }
              } else if (m === 'returns') {
                const returnItems = data.flatMap((ret: any) => (ret.items || []).map((item: any) => ({ ...item, returnId: ret.id })));
                if (returnItems.length > 0) {
                  for (let i = 0; i < returnItems.length; i += 50) {
                    const batch = returnItems.slice(i, i + 50).map((d: any) => camelToSnake(d));
                    (supabase as any).from('return_items').upsert(batch, { onConflict: 'id' }).then(() => {}).catch((e: any) => console.error('Batch upsert return_items failed:', e));
                  }
                }
                const cleanRets = data.map((ret: any) => {
                  const { items, ...rest } = ret;
                  return rest;
                });
                for (let i = 0; i < cleanRets.length; i += 50) {
                  const batch = cleanRets.slice(i, i + 50).map((d: any) => camelToSnake(d));
                  (supabase as any).from(table).upsert(batch, { onConflict: 'id' }).then(() => {}).catch((e: any) => console.error(`Batch upsert ${table} failed:`, e));
                }
              } else {
                for (let i = 0; i < data.length; i += 50) {
                  const batch = data.slice(i, i + 50).map((d: any) => camelToSnake(d));
                  (supabase as any).from(table).upsert(batch, { onConflict: 'id' }).then(() => {}).catch((e: any) => console.error(`Batch upsert ${table} failed:`, e));
                }
              }
            } catch {}
          }
        }
      }

      return true;
    } catch (err) {
      console.error('Failed to load state:', err);
      return false;
    }
  },

  // ---- CRUD with Supabase sync ----

  addCustomer: (data) => {
    const customer: Customer = { ...data, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    set((state) => ({ customers: [customer, ...state.customers] }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'created', module: 'customers', recordId: customer.id, oldValues: null, newValues: data, ip: '' });
    syncToSupabase('post', 'customers', customer);
    return customer;
  },
  updateCustomer: (id, data) => {
    const old = get().customers.find(c => c.id === id);
    set((state) => ({ customers: state.customers.map(c => c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c) }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'updated', module: 'customers', recordId: id, oldValues: old, newValues: data, ip: '' });
    syncToSupabase('put', 'customers', { id, ...data });
  },
  deleteCustomer: (id) => {
    const old = get().customers.find(c => c.id === id);
    const state = get();
    const customerInvoices = state.invoices.filter(i => i.customerId === id);
    const invoiceIds = customerInvoices.map(i => i.id);
    const invoiceItemIds = customerInvoices.flatMap(i => (i.items || []).map(item => item.id));
    const statementIds = (state.customerStatements || []).filter(s => s.customerId === id).map(s => s.id);
    batchDeleteFromSupabase('invoice-items', invoiceItemIds);
    batchDeleteFromSupabase('invoices', invoiceIds);
    batchDeleteFromSupabase('customer_statements', statementIds);
    set((state) => ({
      customers: state.customers.filter(c => c.id !== id),
      invoices: state.invoices.filter(i => i.customerId !== id),
      customerStatements: (state.customerStatements || []).filter(s => s.customerId !== id),
    }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'deleted', module: 'customers', recordId: id, oldValues: old, newValues: null, ip: '' });
    syncToSupabase('delete', 'customers', { id });
  },

  addProduct: (data) => {
    const product: Product = { ...data, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    set((state) => ({ products: [product, ...state.products] }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'created', module: 'products', recordId: product.id, oldValues: null, newValues: data, ip: '' });
    syncToSupabase('post', 'products', product);
    return product;
  },
  bulkAddProducts: async (dataArr) => {
    const products = dataArr.map(data => ({ ...data, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Product));
    set((state) => ({ products: [...products, ...state.products] }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'created', module: 'products', recordId: `${products.length} bulk`, oldValues: null, newValues: { count: products.length }, ip: '' });
    if (isSupabaseConfigured) {
      try {
        const supabase = getSupabase();
        const BATCH_SIZE = 50;
        for (let i = 0; i < products.length; i += BATCH_SIZE) {
          const batch = products.slice(i, i + BATCH_SIZE).map((p: any) => {
            const row: any = {};
            for (const [k, v] of Object.entries(p)) {
              const sk = k.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2').toLowerCase();
              if (k.endsWith('Id') && v === '') row[sk] = null;
              else row[sk] = v;
            }
            return row;
          });
          const { error } = await (supabase as any).from('products').upsert(batch, { onConflict: 'id' });
          if (error) {
            console.error(`Batch upsert products error (batch ${i / BATCH_SIZE + 1}):`, error);
          }
        }
      } catch (e) {
        console.error('Bulk products sync failed:', e);
      }
    }
    return products;
  },
  updateProduct: (id, data) => {
    const old = get().products.find(p => p.id === id);
    set((state) => ({ products: state.products.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p) }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'updated', module: 'products', recordId: id, oldValues: old, newValues: data, ip: '' });
    syncToSupabase('put', 'products', { id, ...data });
  },
  deleteProduct: (id) => {
    const old = get().products.find(p => p.id === id);
    set((state) => ({ products: state.products.filter(p => p.id !== id) }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'deleted', module: 'products', recordId: id, oldValues: old, newValues: null, ip: '' });
    const state = get();
    const invoiceItemIds = state.invoices.flatMap(i => (i.items || []).filter(item => item.productId === id).map(item => item.id));
    const stockMovementIds = state.stockMovements.filter(m => m.productId === id).map(m => m.id);
    const returnItemIds = state.returns.flatMap(r => (r.items || []).filter(item => item.productId === id).map(item => item.id));
    batchDeleteFromSupabase('invoice-items', invoiceItemIds);
    batchDeleteFromSupabase('stock_movements', stockMovementIds);
    batchDeleteFromSupabase('return_items', returnItemIds);
    syncToSupabase('delete', 'products', { id });
  },

  addCategory: (data) => {
    const category: Category = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    set((state) => ({ categories: [...state.categories, category] }));
    syncToSupabase('post', 'categories', category);
    return category;
  },
  updateCategory: (id, data) => {
    set((state) => ({ categories: state.categories.map(c => c.id === id ? { ...c, ...data } : c) }));
    syncToSupabase('put', 'categories', { id, ...data });
  },
  deleteCategory: (id) => {
    set((state) => ({ categories: state.categories.filter(c => c.id !== id) }));
    syncToSupabase('delete', 'categories', { id });
  },

  addInvoice: (data) => {
    const invoice: Invoice = { ...data, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    set((state) => ({ invoices: [invoice, ...state.invoices] }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'created', module: 'invoices', recordId: invoice.id, oldValues: null, newValues: data, ip: '' });
    const { items, payments, ...invoiceFields } = invoice;
    syncToSupabase('post', 'invoices', invoiceFields);
    if (items && items.length > 0 && isSupabaseConfigured) {
      const itemsWithInvoice = items.map(item => ({ ...item, invoiceId: invoice.id }));
      try {
        const supabase = getSupabase();
        Promise.resolve((supabase as any).from('invoice_items').insert(itemsWithInvoice.map(camelToSnake))).then(({ error }: any) => {
          if (error) itemsWithInvoice.forEach(item => syncToSupabase('post', 'invoice-items', item));
        }).catch(() => itemsWithInvoice.forEach(item => syncToSupabase('post', 'invoice-items', item)));
      } catch {
        itemsWithInvoice.forEach(item => syncToSupabase('post', 'invoice-items', item));
      }
    } else if (items) {
      items.forEach(item => syncToSupabase('post', 'invoice-items', { ...item, invoiceId: invoice.id }));
    }
    if (invoice.customerId && invoice.status !== 'draft') {
      get().addCustomerStatement({
        customerId: invoice.customerId,
        date: invoice.issueDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        type: 'invoice',
        referenceNumber: invoice.invoiceNumber,
        description: `Invoice ${invoice.invoiceNumber}`,
        descriptionAr: `فاتورة ${invoice.invoiceNumber}`,
        debit: invoice.grandTotal,
        credit: 0,
        balance: 0,
      });
    }
    if (invoice.status !== 'draft' && invoice.items) {
      invoice.items.forEach(item => {
        const product = get().products.find(p => p.id === item.productId);
        if (product && product.trackInventory) {
          get().updateProduct(product.id, { stock: Math.max(0, product.stock - item.quantity) });
          get().addStockMovement({
            productId: item.productId, variantId: item.variantId, type: 'out', quantity: item.quantity,
            reason: `Invoice ${invoice.invoiceNumber}`,
            date: invoice.issueDate?.split('T')[0] || new Date().toISOString().split('T')[0],
            referenceType: 'invoice', referenceId: invoice.id,
            warehouseId: get().warehouses[0]?.id || '',
          });
        }
      });
    }
    return invoice;
  },
  updateInvoice: (id, data) => {
    const old = get().invoices.find(i => i.id === id);
    const newStatus = data.status || old?.status || 'draft';
    const wasNonDraft = old?.status !== 'draft' && old?.status !== undefined;
    if (old && old.status === 'draft' && newStatus !== 'draft' && old.items) {
      old.items.forEach(item => {
        const product = get().products.find(p => p.id === item.productId);
        if (product && product.trackInventory) {
          get().updateProduct(product.id, { stock: Math.max(0, product.stock - item.quantity) });
          get().addStockMovement({
            productId: item.productId, variantId: item.variantId, type: 'out', quantity: item.quantity,
            reason: `Invoice ${old.invoiceNumber} status changed to ${newStatus}`,
            date: new Date().toISOString().split('T')[0],
            referenceType: 'invoice', referenceId: id,
            warehouseId: get().warehouses[0]?.id || '',
          });
        }
      });
      if (old.customerId) {
        get().addCustomerStatement({
          customerId: old.customerId,
          date: old.issueDate?.split('T')[0] || new Date().toISOString().split('T')[0],
          type: 'invoice',
          referenceNumber: old.invoiceNumber,
          description: `Invoice ${old.invoiceNumber}`,
          descriptionAr: `فاتورة ${old.invoiceNumber}`,
          debit: old.grandTotal,
          credit: 0,
          balance: 0,
        });
      }
    }
    if (wasNonDraft && newStatus === 'cancelled' && old.items) {
      old.items.forEach(item => {
        const product = get().products.find(p => p.id === item.productId);
        if (product && product.trackInventory) {
          get().updateProduct(product.id, { stock: product.stock + item.quantity });
          get().addStockMovement({
            productId: item.productId, variantId: item.variantId, type: 'in', quantity: item.quantity,
            reason: `Cancelled invoice ${old.invoiceNumber}`,
            date: new Date().toISOString().split('T')[0],
            referenceType: 'invoice', referenceId: id,
            warehouseId: get().warehouses[0]?.id || '',
          });
        }
      });
    }
    set((state) => ({ invoices: state.invoices.map(i => i.id === id ? { ...i, ...data, updatedAt: new Date().toISOString() } : i) }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'updated', module: 'invoices', recordId: id, oldValues: old, newValues: data, ip: '' });
    syncToSupabase('put', 'invoices', { id, ...data });
  },
  deleteInvoice: (id) => {
    const old = get().invoices.find(i => i.id === id);
    if (old && old.status !== 'draft' && old.items) {
      old.items.forEach(item => {
        const product = get().products.find(p => p.id === item.productId);
        if (product && product.trackInventory) {
          get().updateProduct(product.id, { stock: product.stock + item.quantity });
          get().addStockMovement({
            productId: item.productId, variantId: item.variantId, type: 'in', quantity: item.quantity,
            reason: `Reversal of deleted invoice ${old.invoiceNumber}`,
            date: new Date().toISOString().split('T')[0],
            referenceType: 'invoice', referenceId: id,
            warehouseId: get().warehouses[0]?.id || '',
          });
        }
      });
    }
    // Reverse related treasury transactions
    const linkedTxs = get().treasuryTransactions.filter(tx => tx.linkedInvoiceId === id);
    linkedTxs.forEach(tx => {
      if (tx.type === 'transfer') {
        if (tx.fromAccountId) {
          const fromAcc = get().treasuryAccounts.find(a => a.id === tx.fromAccountId);
          if (fromAcc) {
            get().updateTreasuryAccount(tx.fromAccountId, { balance: (fromAcc.balance || 0) + tx.amount });
          }
        }
        if (tx.toAccountId) {
          const toAcc = get().treasuryAccounts.find(a => a.id === tx.toAccountId);
          if (toAcc) {
            get().updateTreasuryAccount(tx.toAccountId, { balance: (toAcc.balance || 0) - tx.amount });
          }
        }
      } else {
        const acc = get().treasuryAccounts.find(a => a.id === tx.accountId);
        if (acc) {
          const reversal = tx.type === 'income' ? -tx.amount : tx.amount;
          get().updateTreasuryAccount(tx.accountId, { balance: (acc.balance || 0) + reversal });
        }
      }
      get().deleteTreasuryTransaction(tx.id);
    });
    // Remove related customer statements
    if (old?.customerId) {
      set((state) => ({
        customerStatements: state.customerStatements.filter(s => s.referenceNumber !== old.invoiceNumber)
      }));
    }
    set((state) => ({ invoices: state.invoices.filter(i => i.id !== id) }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'deleted', module: 'invoices', recordId: id, oldValues: old, newValues: null, ip: '' });
    syncToSupabase('delete', 'invoices', { id });
  },

  recordPayment: (invoiceId, data) => {
    const payment: InvoicePayment = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    const state = get();
    const invoice = state.invoices.find(i => i.id === invoiceId);
    if (!invoice) return payment;
    const newPaidAmount = invoice.paidAmount + payment.amount;
    const newStatus = newPaidAmount >= invoice.grandTotal ? 'paid' : 'partially_paid';
    const wasDraft = invoice.status === 'draft';
    const { accountId: preferredAccountId, ...paymentData } = data as any;
    set((state) => ({
      invoices: state.invoices.map(i =>
        i.id === invoiceId
          ? { ...i, paidAmount: newPaidAmount, status: newStatus, payments: [...(i.payments || []), payment], updatedAt: new Date().toISOString() }
          : i
      ),
    }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'updated', module: 'invoices', recordId: invoiceId, oldValues: null, newValues: { paidAmount: newPaidAmount, status: newStatus }, ip: '' });
    syncToSupabase('post', 'invoice-payments', { ...paymentData, invoiceId, id: payment.id, createdAt: payment.createdAt });
    syncToSupabase('put', 'invoices', { id: invoiceId, paidAmount: newPaidAmount, status: newStatus });

    if (wasDraft && invoice.items) {
      invoice.items.forEach(item => {
        const product = get().products.find(p => p.id === item.productId);
        if (product && product.trackInventory) {
          get().updateProduct(product.id, { stock: Math.max(0, product.stock - item.quantity) });
          get().addStockMovement({
            productId: item.productId, variantId: item.variantId, type: 'out', quantity: item.quantity,
            reason: `Payment for ${invoice.invoiceNumber}`,
            date: new Date().toISOString().split('T')[0],
            referenceType: 'invoice', referenceId: invoiceId,
            warehouseId: state.warehouses[0]?.id || '',
          });
        }
      });
    }

    let treasuryAccounts = state.treasuryAccounts;
    if (treasuryAccounts.length === 0) {
      get().addTreasuryAccount({
        name: 'Main Cash', nameAr: 'الخزينة الرئيسية', type: 'cash',
        balance: 0, currency: 'EGP', isDefault: true,
      });
      treasuryAccounts = get().treasuryAccounts;
    }
    const accountId = preferredAccountId || treasuryAccounts[0]?.id || '';
    const paymentMethodName = [...state.paymentMethods, ...PAYMENT_METHODS].find(p => p.id === data.paymentMethod);
    const tx = get().addTreasuryTransaction({
      type: 'income', amount: payment.amount, date: data.paidAt?.split('T')[0] || new Date().toISOString().split('T')[0],
      accountId,
      fromAccountId: null, toAccountId: null,
      paymentMethod: data.paymentMethod, paymentMethodDetail: paymentMethodName ? (paymentMethodName.nameAr || paymentMethodName.name) : data.paymentMethod,
      categoryId: '', description: `Payment for ${invoice.invoiceNumber}`,
      descriptionAr: `دفعة للفاتورة ${invoice.invoiceNumber}`,
      referenceNumber: data.reference || '', receiptUrl: '',
      linkedInvoiceId: invoiceId, linkedPOId: null, linkedReturnId: null,
      isRecurring: false, recurringPattern: null, nextOccurrence: null,
      isReconciled: false, reconciledAt: null,
    });
    set((state) => ({
      invoices: state.invoices.map(i =>
        i.id === invoiceId ? { ...i, treasuryTransactionId: tx.id } : i
      ),
    }));
    if (accountId) {
      const account = treasuryAccounts.find(a => a.id === accountId);
      if (account) {
        get().updateTreasuryAccount(accountId, { balance: (account.balance || 0) + payment.amount });
      }
    }

    if (invoice.customerId) {
      get().addCustomerStatement({
        customerId: invoice.customerId,
        date: data.paidAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        type: 'payment',
        referenceNumber: invoice.invoiceNumber,
        description: `Payment received for ${invoice.invoiceNumber}`,
        descriptionAr: `تم استلام دفعة للفاتورة ${invoice.invoiceNumber}`,
        debit: 0,
        credit: payment.amount,
        balance: 0,
      });
    }
    return payment;
  },

  addReturn: (data) => {
    const ret: Return = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    set((state) => ({ returns: [ret, ...state.returns] }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'created', module: 'returns', recordId: ret.id, oldValues: null, newValues: data, ip: '' });
    syncToSupabase('post', 'returns', ret);

    // Stock update based on return items (only good condition items restore stock)
    if (ret.items && ret.items.length > 0) {
      ret.items.forEach((item: ReturnItem) => {
        if ((item as any).condition === 'good' || !(item as any).condition) {
          const product = get().products.find(p => p.id === item.productId);
          if (product) {
            get().updateProduct(product.id, { stock: (product.stock || 0) + item.quantity });
          }
        }
        get().addStockMovement({
          productId: item.productId, variantId: item.variantId, type: 'in',
          quantity: item.quantity, reason: `Customer Return - ${ret.returnNumber}`,
          date: new Date().toISOString().split('T')[0],
          referenceType: 'return', referenceId: ret.id, warehouseId: '',
        });
      });
    }

    // Update invoice status
    if (ret.originalInvoiceId) {
      const invoice = get().invoices.find(inv => inv.id === ret.originalInvoiceId);
      if (invoice) {
        const allReturnedItems = ret.items?.length || 0;
        const invoiceItems = invoice.items?.length || 0;
        const isFullReturn = allReturnedItems >= invoiceItems && ret.items?.every(ri => {
          const invItem = invoice.items?.find(ii => ii.productId === ri.productId);
          return invItem && ri.quantity >= invItem.quantity;
        });
        get().updateInvoice(ret.originalInvoiceId, { status: isFullReturn ? 'fully_returned' : 'partially_returned' });
      }
    }

    // Customer statement for refund
    if (ret.originalInvoiceId && ret.refundAmount > 0) {
      const refundDate = new Date().toISOString().split('T')[0];
      const refundInvoice = get().invoices.find(inv => inv.id === ret.originalInvoiceId);
      if (refundInvoice?.customerId) {
        get().addCustomerStatement({
          customerId: refundInvoice.customerId,
          date: refundDate,
          type: 'return',
          referenceNumber: ret.returnNumber,
          description: `Refund - ${ret.returnNumber}`,
          descriptionAr: `مرتجعات - ${ret.returnNumber}`,
          debit: 0,
          credit: ret.refundAmount,
          balance: 0,
        });
      }
    }

    if (ret.refundAmount > 0) {
      const state = get();
      let treasuryAccounts = state.treasuryAccounts;
      if (treasuryAccounts.length === 0) {
        get().addTreasuryAccount({
          name: 'Main Cash', nameAr: 'الخزينة الرئيسية', type: 'cash',
          balance: 0, currency: 'EGP', isDefault: true,
        });
        treasuryAccounts = get().treasuryAccounts;
      }
      const accountId = treasuryAccounts[0]?.id || '';
      const refundMethodName = [...get().paymentMethods, ...PAYMENT_METHODS].find(p => p.id === ret.refundMethod);
      get().addTreasuryTransaction({
        type: 'expense', amount: ret.refundAmount, date: new Date().toISOString().split('T')[0],
        accountId,
        fromAccountId: null, toAccountId: null,
        paymentMethod: ret.refundMethod, paymentMethodDetail: refundMethodName ? (refundMethodName.nameAr || refundMethodName.name) : ret.refundMethod,
        categoryId: '', description: `Refund for ${ret.returnNumber}`,
        descriptionAr: `مرتجعات ${ret.returnNumber}`,
        referenceNumber: ret.returnNumber, receiptUrl: '',
        linkedInvoiceId: ret.originalInvoiceId,
        linkedPOId: null,
        linkedReturnId: ret.id,
        isRecurring: false, recurringPattern: null, nextOccurrence: null,
        isReconciled: false, reconciledAt: null,
      });
      if (accountId) {
        const account = treasuryAccounts.find(a => a.id === accountId);
        if (account) {
          get().updateTreasuryAccount(accountId, { balance: (account.balance || 0) - ret.refundAmount });
        }
      }
    }
    return ret;
  },
  updateReturn: (id, data) => {
    set((state) => ({ returns: state.returns.map(r => r.id === id ? { ...r, ...data } : r) }));
    syncToSupabase('put', 'returns', { id, ...data });
  },

  addTreasuryAccount: (data) => {
    const account: TreasuryAccount = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    set((state) => ({ treasuryAccounts: [...state.treasuryAccounts, account] }));
    syncToSupabase('post', 'treasuryAccounts', account);
    return account;
  },
  updateTreasuryAccount: (id, data) => {
    set((state) => ({ treasuryAccounts: state.treasuryAccounts.map(a => a.id === id ? { ...a, ...data } : a) }));
    syncToSupabase('put', 'treasuryAccounts', { id, ...data });
  },
  deleteTreasuryAccount: (id) => {
    set((state) => ({ treasuryAccounts: state.treasuryAccounts.filter(a => a.id !== id) }));
    syncToSupabase('delete', 'treasuryAccounts', { id });
  },

  addTreasuryTransaction: (data) => {
    const transaction: TreasuryTransaction = { ...data, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    set((state) => ({ treasuryTransactions: [transaction, ...state.treasuryTransactions] }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'created', module: 'treasury', recordId: transaction.id, oldValues: null, newValues: data, ip: '' });
    syncToSupabase('post', 'treasuryTransactions', transaction);
    return transaction;
  },
  updateTreasuryTransaction: (id, data) => {
    set((state) => ({ treasuryTransactions: state.treasuryTransactions.map(t => t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t) }));
    syncToSupabase('put', 'treasuryTransactions', { id, ...data });
  },
  deleteTreasuryTransaction: (id) => {
    set((state) => ({ treasuryTransactions: state.treasuryTransactions.filter(t => t.id !== id) }));
    syncToSupabase('delete', 'treasuryTransactions', { id });
  },

  addWarehouse: (data) => {
    const wh: Warehouse = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    set((state) => ({ warehouses: [...state.warehouses, wh] }));
    syncToSupabase('post', 'warehouses', wh);
    return wh;
  },
  updateWarehouse: (id, data) => {
    set((state) => ({ warehouses: state.warehouses.map(w => w.id === id ? { ...w, ...data } : w) }));
    syncToSupabase('put', 'warehouses', { id, ...data });
  },
  deleteWarehouse: (id) => {
    set((state) => ({ warehouses: state.warehouses.filter(w => w.id !== id) }));
    syncToSupabase('delete', 'warehouses', { id });
  },

  addStockMovement: (data) => {
    const movement: StockMovement = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    set((state) => ({ stockMovements: [movement, ...state.stockMovements] }));
    syncToSupabase('post', 'stockMovements', movement);
    return movement;
  },

  addChartOfAccount: (data) => {
    const account: ChartOfAccount = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    set((state) => ({ chartOfAccounts: [...state.chartOfAccounts, account] }));
    syncToSupabase('post', 'chartOfAccounts', account);
    return account;
  },
  updateChartOfAccount: (id, data) => {
    set((state) => ({ chartOfAccounts: state.chartOfAccounts.map(a => a.id === id ? { ...a, ...data } : a) }));
    syncToSupabase('put', 'chartOfAccounts', { id, ...data });
  },
  deleteChartOfAccount: (id) => {
    set((state) => ({ chartOfAccounts: state.chartOfAccounts.filter(a => a.id !== id) }));
    syncToSupabase('delete', 'chartOfAccounts', { id });
  },

  addNotification: (data) => {
    const notification: Notification = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    set((state) => ({ notifications: [notification, ...state.notifications] }));
    syncToSupabase('post', 'notifications', notification);
  },
  markNotificationRead: (id) => {
    set((state) => ({ notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n) }));
    syncToSupabase('put', 'notifications', { id, isRead: true, readAt: new Date().toISOString() });
  },
  markAllNotificationsRead: () => {
    const unread = get().notifications.filter(n => !n.isRead).map(n => n.id);
    set((state) => ({ notifications: state.notifications.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })) }));
    if (isSupabaseConfigured && unread.length > 0) {
      try {
        const supabase = getSupabase();
        Promise.resolve((supabase as any).from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).in('id', unread)).then(() => {}).catch((e: any) => console.error('Batch mark notifications read failed:', e));
      } catch {}
    }

  },
  clearNotifications: () => {
    const ids = get().notifications.map(n => n.id);
    set({ notifications: [] });
    batchDeleteFromSupabase('notifications', ids);
  },

  addAuditLog: (data) => {
    const log: AuditLog = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    set((state) => ({ auditLogs: [log, ...state.auditLogs].slice(0, 5000) }));
    syncToSupabase('post', 'auditLogs', log);
  },

  updateSetting: (key, value) => {
    set((state) => ({ settings: state.settings.map(s => s.key === key ? { ...s, value, updatedAt: new Date().toISOString() } : s) }));
    const setting = get().settings.find(s => s.key === key);
    if (setting) syncToSupabase('put', 'settings', setting);
  },

  addImportSession: (session) => {
    set((state) => ({ importHistory: [session, ...state.importHistory] }));
    syncToSupabase('post', 'importHistory', session);
  },

  clearModuleData: async (module) => {
    syncPausedModules.add(module);
    try {
    const oldData = [...(get() as any)[module]];
    // Cascade cleanup for invoices
    if (module === 'invoices') {
      const invoiceIds = oldData.map((i: any) => i.id);
      const invoiceNumbers = oldData.map((i: any) => i.invoiceNumber);
      // Unlink linked treasury transactions
      await updateSetNullFromSupabase('treasury-transactions', 'linked_invoice_id', invoiceIds);
      // Unlink converted quotations
      await updateSetNullFromSupabase('quotations', 'converted_invoice_id', invoiceIds);
      // Delete child records from Supabase using actual child IDs
      const childItemIds = oldData.flatMap((i: any) => (i.items || []).map((item: any) => item.id));
      const childPaymentIds = oldData.flatMap((i: any) => (i.payments || []).map((p: any) => p.id));
      await batchDeleteFromSupabase('invoice-items', childItemIds);
      await batchDeleteFromSupabase('invoice-payments', childPaymentIds);
      // Delete related customer statements
      const stmtIds = get().customerStatements.filter(s => invoiceNumbers.includes(s.referenceNumber)).map(s => s.id);
      set((state) => ({
        customerStatements: state.customerStatements.filter(s => !invoiceNumbers.includes(s.referenceNumber))
      }));
      await batchDeleteFromSupabase('customerStatements', stmtIds);
    }
    // Cascade cleanup for products
    if (module === 'products') {
      const productIds = oldData.map((p: any) => p.id);
      const stockMovementIds = get().stockMovements.filter(m => productIds.includes(m.productId)).map(m => m.id);
      const returnItemIds = get().returns.flatMap(r => (r.items || []).filter(item => productIds.includes(item.productId)).map(item => item.id));
      await batchDeleteFromSupabase('invoice-items', productIds, 'product_id');
      await batchDeleteFromSupabase('quotation-items', productIds, 'product_id');
      await batchDeleteFromSupabase('purchase-order-items', productIds, 'product_id');
      await batchDeleteFromSupabase('stock-movements', stockMovementIds);
      await batchDeleteFromSupabase('return-items', returnItemIds);
    }
    // Cascade cleanup for returns
    if (module === 'returns') {
      const returnIds = oldData.map((r: any) => r.id);
      // Reverse stock restored by returns
      oldData.forEach((ret: any) => {
        (ret.items || []).forEach((item: any) => {
          if (item.condition === 'good' || !item.condition) {
            const product = get().products.find(p => p.id === item.productId);
            if (product) get().updateProduct(product.id, { stock: Math.max(0, (product.stock || 0) - item.quantity) });
          }
        });
      });
      // Remove return stock movements
      const stockMovementIds = get().stockMovements.filter(m => m.referenceType === 'return' && returnIds.includes(m.referenceId)).map(m => m.id);
      await batchDeleteFromSupabase('stock-movements', stockMovementIds);
      set((state) => ({
        stockMovements: state.stockMovements.filter(m => !(m.referenceType === 'return' && returnIds.includes(m.referenceId))),
      }));
      // Delete linked treasury refund transactions and restore account balances
      const linkedRefundTxs = get().treasuryTransactions.filter(tx => returnIds.includes(tx.linkedReturnId));
      const linkedTxIds = linkedRefundTxs.map(tx => tx.id);
      linkedRefundTxs.forEach(tx => {
        const acc = get().treasuryAccounts.find(a => a.id === tx.accountId);
        if (acc) get().updateTreasuryAccount(tx.accountId, { balance: (acc.balance || 0) + tx.amount });
      });
      await batchDeleteFromSupabase('treasury-transactions', linkedTxIds);
      // Delete return items
      const returnItemIds = oldData.flatMap((r: any) => (r.items || []).map((item: any) => item.id));
      await batchDeleteFromSupabase('return-items', returnItemIds);
      // Remove refund customer statements
      const refundStmtIds = get().customerStatements.filter(s => returnIds.includes(s.referenceNumber)).map(s => s.id);
      set((state) => ({
        customerStatements: state.customerStatements.filter(s => !returnIds.includes(s.referenceNumber)),
      }));
      await batchDeleteFromSupabase('customerStatements', refundStmtIds);
    }
    // Cascade cleanup for customers
    if (module === 'customers') {
      const customerIds = oldData.map((c: any) => c.id);
      await batchDeleteFromSupabase('pricing-rules', customerIds, 'customer_id');
      await batchDeleteFromSupabase('quotations', customerIds, 'customer_id');
      const customerInvoices = get().invoices.filter(i => customerIds.includes(i.customerId));
      const invoiceIds = customerInvoices.map((i: any) => i.id);
      await updateSetNullFromSupabase('treasury-transactions', 'linked_invoice_id', invoiceIds);
      const childItemIds = customerInvoices.flatMap((i: any) => (i.items || []).map((item: any) => item.id));
      const childPaymentIds = customerInvoices.flatMap((i: any) => (i.payments || []).map((p: any) => p.id));
      await batchDeleteFromSupabase('invoice-items', childItemIds);
      await batchDeleteFromSupabase('invoice-payments', childPaymentIds);
      await batchDeleteFromSupabase('invoices', invoiceIds);
    }
    // Cascade cleanup for categories
    if (module === 'categories') {
      const categoryIds = oldData.map((c: any) => c.id);
      const linkedProductIds = get().products.filter(p => categoryIds.includes(p.categoryId)).map((p: any) => p.id);
      if (linkedProductIds.length > 0) {
        const stockMovementIds = get().stockMovements.filter(m => linkedProductIds.includes(m.productId)).map(m => m.id);
        const returnItemIds = get().returns.flatMap(r => (r.items || []).filter(item => linkedProductIds.includes(item.productId)).map(item => item.id));
        await batchDeleteFromSupabase('invoice-items', linkedProductIds, 'product_id');
        await batchDeleteFromSupabase('quotation-items', linkedProductIds, 'product_id');
        await batchDeleteFromSupabase('purchase-order-items', linkedProductIds, 'product_id');
        await batchDeleteFromSupabase('stock-movements', stockMovementIds);
        await batchDeleteFromSupabase('return-items', returnItemIds);
        await batchDeleteFromSupabase('products', linkedProductIds);
      }
      const linkedTxIds = get().treasuryTransactions.filter(tx => categoryIds.includes(tx.categoryId)).map(tx => tx.id);
      if (linkedTxIds.length > 0) {
        await batchDeleteFromSupabase('treasury-transactions', linkedTxIds);
        get().treasuryAccounts.forEach(acc => {
          get().updateTreasuryAccount(acc.id, { balance: 0 });
        });
      }
    }
    // Recalculate treasury balances after clearing transactions
    if (module === 'treasuryTransactions') {
      get().treasuryAccounts.forEach(acc => {
        get().updateTreasuryAccount(acc.id, { balance: 0 });
      });
    }
    // Delete from Supabase FIRST, then clear local state
    if (isSupabaseConfigured) {
      await batchDeleteFromSupabase(module, oldData.map((item: any) => item.id));
    }
    set({ [module]: [] } as any);
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'deleted', module, recordId: 'all', oldValues: null, newValues: null, ip: '' });
    } finally {
      syncPausedModules.delete(module);
    }
  },

  addDiscountRule: (data) => {
    const rule: DiscountRule = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    set((state) => ({ discountRules: [rule, ...state.discountRules] }));
    syncToSupabase('post', 'discountRules', rule);
    return rule;
  },
  updateDiscountRule: (id, data) => {
    set((state) => ({ discountRules: state.discountRules.map(r => r.id === id ? { ...r, ...data } : r) }));
    syncToSupabase('put', 'discountRules', { id, ...data });
  },
  deleteDiscountRule: (id) => {
    set((state) => ({ discountRules: state.discountRules.filter(r => r.id !== id) }));
    syncToSupabase('delete', 'discountRules', { id });
  },

  updatePaymentMethod: (id, data) => {
    set((state) => ({ paymentMethods: state.paymentMethods.map(p => p.id === id ? { ...p, ...data } : p) }));
    syncToSupabase('put', 'paymentMethods', { id, ...data });
  },
  addCustomPaymentMethod: (data) => {
    const method: PaymentMethod = { ...data, id: generateId(), isProtected: false };
    set((state) => ({ paymentMethods: [...state.paymentMethods, method] }));
    syncToSupabase('post', 'paymentMethods', method);
    return method;
  },

  addCustomerStatement: (data) => {
    const statement: CustomerStatement = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    set((state) => ({ customerStatements: [statement, ...state.customerStatements] }));
    syncToSupabase('post', 'customerStatements', statement);
    return statement;
  },
  getCustomerStatements: (customerId) => {
    return get().customerStatements.filter(s => s.customerId === customerId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  addFiscalYear: (data) => {
    const year: FiscalYear = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    set((state) => ({ fiscalYears: [...state.fiscalYears, year] }));
    syncToSupabase('post', 'fiscalYears', year);
    return year;
  },
  updateFiscalYear: (id, data) => {
    set((state) => ({ fiscalYears: state.fiscalYears.map(y => y.id === id ? { ...y, ...data } : y) }));
    syncToSupabase('put', 'fiscalYears', { ...get().fiscalYears.find(y => y.id === id), ...data });
  },
  closeFiscalYear: (id) => {
    set((state) => ({
      fiscalYears: state.fiscalYears.map(y => y.id === id ? { ...y, isClosed: true, closedAt: new Date().toISOString() } : y),
    }));
    const year = get().fiscalYears.find(y => y.id === id);
    if (year) syncToSupabase('put', 'fiscalYears', { ...year, isClosed: true, closedAt: new Date().toISOString() });
  },
  deleteFiscalYear: (id) => {
    set((state) => ({ fiscalYears: state.fiscalYears.filter(y => y.id !== id) }));
    syncToSupabase('delete', 'fiscalYears', { id });
  },


}), {
  name: 'mohasebeyad-storage',
  storage: createJSONStorage(() => safeStorage),
  partialize: (state: any) => {
    const { setLanguage, setTheme, toggleSidebar, initializeStore, resetToDemo,
            getStateSnapshot, loadState, addAuditLog, ...data } = state;
    return data;
  },
  merge: (persisted: any, current: any) => {
    const ui = {
      language: persisted?.language ?? current.language,
      theme: persisted?.theme ?? current.theme,
      sidebarCollapsed: persisted?.sidebarCollapsed ?? current.sidebarCollapsed,
    };
    const hasAnyData = persisted && Object.values(persisted).some((v: any) => Array.isArray(v) && v.length > 0);
    if (hasAnyData) {
      const merged = { ...current, ...persisted, ...ui, isInitialized: isSupabaseConfigured ? false : true };
      for (const key of Object.keys(current)) {
        if (Array.isArray(current[key]) && !Array.isArray(merged[key])) {
          merged[key] = [];
        }
      }
      return merged;
    }
    return { ...current, ...ui };
  },
}),
);
