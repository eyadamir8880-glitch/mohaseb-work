import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateMockData } from '@/lib/mock-data';
import { PAYMENT_METHODS, DEFAULT_SETTINGS } from '@/lib/constants';
import { generateId } from '@/lib/utils';
import { apiClient, camelToSnake, batchDeleteFromSupabase } from '@/lib/api-client';
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
  bulkAddProducts: (products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]) => Product[];
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
                  const cleanBatch = data.slice(i, i + 50).map((d: any) => {
                    const { items, payments, ...rest } = d;
                    return camelToSnake(rest);
                  });
                  await (supabase as any).from(table).insert(cleanBatch);
                }
              } catch {}
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
    set({
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
    } as any);
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
        'customerStatements',
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
          customerStatements: 'customer_statements',
        };
        const supabase = getSupabase();
        for (const m of requiredModules) {
          const data = state[m];
          if (data && data.length > 0) {
            try {
              const table = tableMap[m] || m;
              (supabase as any).from(table).insert(data.map((d: any) => camelToSnake(d))).then(() => {}).catch((e: any) => console.error(`Batch insert ${table} failed:`, e));
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
    batchDeleteFromSupabase('customerStatements', statementIds);
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
  bulkAddProducts: (dataArr) => {
    const products = dataArr.map(data => ({ ...data, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Product));
    set((state) => ({ products: [...products, ...state.products] }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'created', module: 'products', recordId: `${products.length} bulk`, oldValues: null, newValues: { count: products.length }, ip: '' });
    if (isSupabaseConfigured) {
      try {
        const supabase = getSupabase();
        (supabase as any).from('products').insert(products.map(p => camelToSnake(p))).then(() => {}).catch((e: any) => console.error('Batch insert products failed:', e));
      } catch {}
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
    batchDeleteFromSupabase('stockMovements', stockMovementIds);
    batchDeleteFromSupabase('returnItems', returnItemIds);
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
        supabase.from('invoice_items').insert(itemsWithInvoice.map(camelToSnake)).then(({ error }: any) => {
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
      const state = get();
      invoice.items.forEach(item => {
        const product = state.products.find(p => p.id === item.productId);
        if (product && product.trackInventory) {
          get().updateProduct(product.id, { stock: Math.max(0, product.stock - item.quantity) });
          get().addStockMovement({
            productId: item.productId, variantId: item.variantId, type: 'out', quantity: item.quantity,
            reason: `Invoice ${invoice.invoiceNumber}`,
            date: invoice.issueDate?.split('T')[0] || new Date().toISOString().split('T')[0],
            referenceType: 'invoice', referenceId: invoice.id,
            warehouseId: state.warehouses[0]?.id || '',
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
      const state = get();
      old.items.forEach(item => {
        const product = state.products.find(p => p.id === item.productId);
        if (product && product.trackInventory) {
          get().updateProduct(product.id, { stock: Math.max(0, product.stock - item.quantity) });
          get().addStockMovement({
            productId: item.productId, variantId: item.variantId, type: 'out', quantity: item.quantity,
            reason: `Invoice ${old.invoiceNumber} status changed to ${newStatus}`,
            date: new Date().toISOString().split('T')[0],
            referenceType: 'invoice', referenceId: id,
            warehouseId: state.warehouses[0]?.id || '',
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
      const state = get();
      old.items.forEach(item => {
        const product = state.products.find(p => p.id === item.productId);
        if (product && product.trackInventory) {
          get().updateProduct(product.id, { stock: product.stock + item.quantity });
          get().addStockMovement({
            productId: item.productId, variantId: item.variantId, type: 'in', quantity: item.quantity,
            reason: `Cancelled invoice ${old.invoiceNumber}`,
            date: new Date().toISOString().split('T')[0],
            referenceType: 'invoice', referenceId: id,
            warehouseId: state.warehouses[0]?.id || '',
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
      const state = get();
      old.items.forEach(item => {
        const product = state.products.find(p => p.id === item.productId);
        if (product && product.trackInventory) {
          get().updateProduct(product.id, { stock: product.stock + item.quantity });
          get().addStockMovement({
            productId: item.productId, variantId: item.variantId, type: 'in', quantity: item.quantity,
            reason: `Reversal of deleted invoice ${old.invoiceNumber}`,
            date: new Date().toISOString().split('T')[0],
            referenceType: 'invoice', referenceId: id,
            warehouseId: state.warehouses[0]?.id || '',
          });
        }
      });
    }
    // Reverse related treasury transactions
    (old?.payments || []).forEach(p => {
      const txs = get().treasuryTransactions.filter(tx => tx.linkedInvoiceId === id);
      txs.forEach(tx => {
        const acc = get().treasuryAccounts.find(a => a.id === tx.accountId);
        if (acc) {
          get().updateTreasuryAccount(tx.accountId, { balance: Math.max(0, (acc.balance || 0) - p.amount) });
        }
        get().deleteTreasuryTransaction(tx.id);
      });
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
        const product = state.products.find(p => p.id === item.productId);
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

    // Stock reversal/update based on return items
    if (ret.items && ret.items.length > 0) {
      ret.items.forEach((item: ReturnItem) => {
        const product = get().products.find(p => p.id === item.productId);
        if (product) {
          if (ret.type === 'customer') {
            // Customer return: restore stock
            get().updateProduct(product.id, { stock: (product.stock || 0) + item.quantity });
          } else {
            // Supplier return: reduce stock
            get().updateProduct(product.id, { stock: Math.max(0, (product.stock || 0) - item.quantity) });
          }
        }
        get().addStockMovement({
          productId: item.productId, variantId: item.variantId, type: ret.type === 'customer' ? 'in' : 'out',
          quantity: item.quantity, reason: `${ret.type === 'customer' ? 'Customer Return' : 'Supplier Return'} - ${ret.returnNumber}`,
          date: new Date().toISOString().split('T')[0],
          referenceType: 'return', referenceId: ret.id, warehouseId: '',
        });
      });
    }

    // Update invoice status for customer returns
    if (ret.type === 'customer' && ret.originalInvoiceId) {
      const invoice = get().invoices.find(inv => inv.id === ret.originalInvoiceId);
      if (invoice) {
        const allReturnedItems = ret.items?.length || 0;
        const invoiceItems = invoice.items?.length || 0;
        const isFullReturn = allReturnedItems >= invoiceItems && ret.items?.every((ri, idx) => {
          const invItem = invoice.items?.[idx];
          return invItem && ri.quantity >= invItem.quantity;
        });
        get().updateInvoice(ret.originalInvoiceId, { status: isFullReturn ? 'fully_returned' : 'partially_returned' });
      }
    }

    // Customer statement for refund
    if (ret.type === 'customer' && ret.originalInvoiceId && ret.refundAmount > 0) {
      get().addCustomerStatement({
        customerId: get().invoices.find(inv => inv.id === ret.originalInvoiceId)?.customerId || '',
        date: new Date().toISOString().split('T')[0],
        type: 'payment',
        referenceNumber: ret.returnNumber,
        description: `Refund - ${ret.returnNumber}`,
        descriptionAr: `مرتجعات - ${ret.returnNumber}`,
        debit: 0,
        credit: ret.refundAmount,
        balance: 0,
      });
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
        linkedInvoiceId: ret.type === 'customer' ? ret.originalInvoiceId : null,
        linkedPOId: ret.type === 'supplier' ? ret.originalPOId : null,
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
    set((state) => ({ notifications: state.notifications.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })) }));
    const unread = get().notifications.filter(n => !n.isRead).map(n => n.id);
    if (isSupabaseConfigured && unread.length > 0) {
      try {
        const supabase = getSupabase();
        supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).in('id', unread).then(() => {}).catch((e: any) => console.error('Batch mark notifications read failed:', e));
      } catch {}
    }
    set((state) => ({ notifications: state.notifications.map(n => n.isRead ? n : { ...n, isRead: true, readAt: new Date().toISOString() }) }));
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

  clearModuleData: (module) => {
    const oldData = [...(get() as any)[module]];
    // Cascade cleanup for invoices
    if (module === 'invoices') {
      const invoiceIds = oldData.map((i: any) => i.id);
      const invoiceNumbers = oldData.map((i: any) => i.invoiceNumber);
      // Delete linked treasury transactions
      const linkedTxs = get().treasuryTransactions.filter(tx => invoiceIds.includes(tx.linkedInvoiceId));
      linkedTxs.forEach(tx => {
        get().deleteTreasuryTransaction(tx.id);
      });
      // Reset all treasury account balances
      get().treasuryAccounts.forEach(acc => {
        get().updateTreasuryAccount(acc.id, { balance: 0 });
      });
      // Delete related customer statements
      set((state) => ({
        customerStatements: state.customerStatements.filter(s => !invoiceNumbers.includes(s.referenceNumber))
      }));
    }
    set({ [module]: [] } as any);
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'deleted', module, recordId: 'all', oldValues: null, newValues: null, ip: '' });
    if (isSupabaseConfigured) {
      try {
        batchDeleteFromSupabase(module, oldData.map((item: any) => item.id));
      } catch {}
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
    syncToSupabase('delete', `fiscalYears/${id}`, {});
  },


}), {
  name: 'mohasebeyad-storage',
  partialize: (state: any) => {
    const { setLanguage, setTheme, toggleSidebar, initializeStore, resetToDemo,
            getStateSnapshot, loadState, addAuditLog, ...data } = state;
    return data;
  },
  merge: (persisted: any, current: any) => {
    const hasAnyData = persisted && Object.values(persisted).some((v: any) => Array.isArray(v) && v.length > 0);
    if (hasAnyData) {
      const merged = { ...current, ...persisted, isInitialized: isSupabaseConfigured ? false : true };
      for (const key of Object.keys(current)) {
        if (Array.isArray(current[key]) && !Array.isArray(merged[key])) {
          merged[key] = [];
        }
      }
      return merged;
    }
    return current;
  },
}),
);
