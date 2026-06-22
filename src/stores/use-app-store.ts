import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateMockData } from '@/lib/mock-data';
import { PAYMENT_METHODS, DEFAULT_SETTINGS } from '@/lib/constants';
import { generateId } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { isSupabaseConfigured, getSupabase } from '@/lib/supabase';
import type {
  Customer, Supplier, Product, ProductVariant, Category,
  Invoice, InvoicePayment, Quotation, PurchaseOrder, Return,
  TreasuryAccount, TreasuryTransaction, Warehouse, StockMovement,
  Employee, PayrollRecord, Asset, JournalEntry, ChartOfAccount,
  Notification, AuditLog, Setting, ImportSession, DiscountRule, PaymentMethod,
  ExternalPurchase, CustomerStatement
} from '@/lib/types';

interface AppStore {
  language: 'en' | 'ar';
  theme: 'light' | 'dark';

  customers: Customer[];
  suppliers: Supplier[];
  products: Product[];
  variants: ProductVariant[];
  categories: Category[];
  invoices: Invoice[];
  quotations: Quotation[];
  purchaseOrders: PurchaseOrder[];
  returns: Return[];
  treasuryAccounts: TreasuryAccount[];
  treasuryTransactions: TreasuryTransaction[];
  warehouses: Warehouse[];
  stockMovements: StockMovement[];
  employees: Employee[];
  payrollRecords: PayrollRecord[];
  assets: Asset[];
  journalEntries: JournalEntry[];
  chartOfAccounts: ChartOfAccount[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  settings: Setting[];
  importHistory: ImportSession[];
  discountRules: DiscountRule[];
  paymentMethods: PaymentMethod[];
  externalPurchases: ExternalPurchase[];
  customerStatements: CustomerStatement[];

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

  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => Supplier;
  updateSupplier: (id: string, data: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  addVariant: (variant: Omit<ProductVariant, 'id' | 'createdAt'>) => ProductVariant;
  updateVariant: (id: string, data: Partial<ProductVariant>) => void;
  deleteVariant: (id: string) => void;

  addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => Category;
  updateCategory: (id: string, data: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Invoice;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  recordPayment: (invoiceId: string, payment: Omit<InvoicePayment, 'id' | 'createdAt'>) => InvoicePayment;

  addQuotation: (quotation: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'>) => Quotation;
  updateQuotation: (id: string, data: Partial<Quotation>) => void;
  deleteQuotation: (id: string) => void;

  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>) => PurchaseOrder;
  updatePurchaseOrder: (id: string, data: Partial<PurchaseOrder>) => void;
  deletePurchaseOrder: (id: string) => void;

  addReturn: (ret: Omit<Return, 'id' | 'createdAt'>) => Return;
  updateReturn: (id: string, data: Partial<Return>) => void;

  addTreasuryAccount: (account: Omit<TreasuryAccount, 'id' | 'createdAt'>) => TreasuryAccount;
  updateTreasuryAccount: (id: string, data: Partial<TreasuryAccount>) => void;
  deleteTreasuryAccount: (id: string) => void;

  addTreasuryTransaction: (transaction: Omit<TreasuryTransaction, 'id' | 'createdAt' | 'updatedAt'>) => TreasuryTransaction;
  updateTreasuryTransaction: (id: string, data: Partial<TreasuryTransaction>) => void;

  addWarehouse: (warehouse: Omit<Warehouse, 'id' | 'createdAt'>) => Warehouse;
  updateWarehouse: (id: string, data: Partial<Warehouse>) => void;
  deleteWarehouse: (id: string) => void;

  addStockMovement: (movement: Omit<StockMovement, 'id' | 'createdAt'>) => StockMovement;

  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Employee;
  updateEmployee: (id: string, data: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  addPayrollRecord: (record: Omit<PayrollRecord, 'id' | 'createdAt'>) => PayrollRecord;
  updatePayrollRecord: (id: string, data: Partial<PayrollRecord>) => void;

  addAsset: (asset: Omit<Asset, 'id' | 'createdAt'>) => Asset;
  updateAsset: (id: string, data: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;

  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => JournalEntry;
  updateJournalEntry: (id: string, data: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;

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

  addExternalPurchase: (data: Omit<ExternalPurchase, 'id' | 'createdAt'>) => ExternalPurchase;
  deleteExternalPurchase: (id: string) => void;
  updateExternalPurchaseProductId: (id: string, productId: string | null) => void;

  addCustomerStatement: (data: Omit<CustomerStatement, 'id' | 'createdAt'>) => CustomerStatement;
  getCustomerStatements: (customerId: string) => CustomerStatement[];
}

async function syncToSupabase(method: 'post' | 'put' | 'delete', endpoint: string, data?: any) {
  if (!isSupabaseConfigured) return;
  try {
    if (method === 'delete') {
      await apiClient.delete(`${endpoint}/${data.id}`);
    } else if (method === 'put') {
      await apiClient.put(`${endpoint}/${data.id}`, data);
    } else {
      await apiClient.post(endpoint, data);
    }
  } catch (err) {
    console.error(`Supabase sync failed (${method} ${endpoint}):`, err);
  }
}

export const useAppStore = create<AppStore>()(
  persist<AppStore>(
    (set, get) => ({
  language: 'en',
  theme: 'light',
  customers: [],
  suppliers: [],
  products: [],
  variants: [],
  categories: [],
  invoices: [],
  quotations: [],
  purchaseOrders: [],
  returns: [],
  treasuryAccounts: [],
  treasuryTransactions: [],
  warehouses: [],
  stockMovements: [],
  employees: [],
  payrollRecords: [],
  assets: [],
  journalEntries: [],
  chartOfAccounts: [],
  notifications: [],
  auditLogs: [],
  settings: [],
  importHistory: [],
  discountRules: [],
  paymentMethods: [...PAYMENT_METHODS],
  externalPurchases: [],
  customerStatements: [],
  sidebarCollapsed: false,
  isInitialized: false,
  lastSaveTime: null,

  setLanguage: (lang: 'en' | 'ar') => set({ language: lang }),
  setTheme: (theme: 'light' | 'dark') => set({ theme }),
  toggleSidebar: () => set((state: any) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  initializeStore: async () => {
    if (isSupabaseConfigured) {
      try {
        const modules = [
          'customers', 'suppliers', 'products', 'variants', 'categories',
          'invoices', 'quotations', 'purchaseOrders', 'returns',
          'treasuryAccounts', 'treasuryTransactions', 'warehouses',
          'stockMovements', 'employees', 'payrollRecords', 'assets',
          'journalEntries', 'chartOfAccounts', 'notifications', 'auditLogs',
          'settings', 'importHistory', 'discountRules', 'paymentMethods',
          'externalPurchases', 'customerStatements',
        ] as const;

        const results = await Promise.all(
          modules.map((m) => apiClient.get<any[]>(m).catch(() => ({ data: [] })))
        );

        const stateData: Record<string, any[]> = {};
        modules.forEach((m, i) => { stateData[m] = results[i].data || []; });

        set({
          ...stateData,
          settings: stateData.settings.length > 0 ? stateData.settings : [],
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
        console.error('Supabase init failed, falling back to mock data', err);
      }
    }

    const data = generateMockData();
    const settingsArray: Setting[] = Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({
      id: generateId(), key, value: String(value), updatedAt: new Date().toISOString(),
    }));
    set({
      ...data, settings: settingsArray, paymentMethods: PAYMENT_METHODS,
      isInitialized: true,
    } as any);
    get().addAuditLog({
      timestamp: new Date().toISOString(), user: 'System', action: 'created',
      module: 'system', recordId: 'init', oldValues: null,
      newValues: { action: 'Application initialized with demo data' }, ip: '127.0.0.1',
    });
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
        'customers', 'suppliers', 'products', 'variants', 'categories',
        'invoices', 'quotations', 'purchaseOrders', 'returns',
        'treasuryAccounts', 'treasuryTransactions', 'warehouses',
        'stockMovements', 'employees', 'payrollRecords', 'assets',
        'journalEntries', 'chartOfAccounts', 'notifications', 'auditLogs',
        'settings', 'importHistory', 'discountRules', 'paymentMethods',
        'externalPurchases', 'customerStatements',
      ];
      for (const module of requiredModules) {
        if (!Array.isArray(state[module])) {
          console.error(`Invalid backup: missing ${module} module data`);
          return false;
        }
      }
      set({
        ...state, isInitialized: true, lastSaveTime: Date.now(),
        language: state.language || 'en', theme: state.theme || 'light',
        sidebarCollapsed: state.sidebarCollapsed || false,
      });
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
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'created', module: 'customers', recordId: customer.id, oldValues: null, newValues: data, ip: '192.168.1.100' });
    syncToSupabase('post', 'customers', customer);
    return customer;
  },
  updateCustomer: (id, data) => {
    const old = get().customers.find(c => c.id === id);
    set((state) => ({ customers: state.customers.map(c => c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c) }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'updated', module: 'customers', recordId: id, oldValues: old, newValues: data, ip: '192.168.1.100' });
    syncToSupabase('put', 'customers', { id, ...data });
  },
  deleteCustomer: (id) => {
    const old = get().customers.find(c => c.id === id);
    set((state) => ({ customers: state.customers.filter(c => c.id !== id) }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'deleted', module: 'customers', recordId: id, oldValues: old, newValues: null, ip: '192.168.1.100' });
    syncToSupabase('delete', 'customers', { id });
  },

  addSupplier: (data) => {
    const supplier: Supplier = { ...data, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    set((state) => ({ suppliers: [supplier, ...state.suppliers] }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'created', module: 'suppliers', recordId: supplier.id, oldValues: null, newValues: data, ip: '192.168.1.100' });
    syncToSupabase('post', 'suppliers', supplier);
    return supplier;
  },
  updateSupplier: (id, data) => {
    const old = get().suppliers.find(s => s.id === id);
    set((state) => ({ suppliers: state.suppliers.map(s => s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s) }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'updated', module: 'suppliers', recordId: id, oldValues: old, newValues: data, ip: '192.168.1.100' });
    syncToSupabase('put', 'suppliers', { id, ...data });
  },
  deleteSupplier: (id) => {
    const old = get().suppliers.find(s => s.id === id);
    set((state) => ({ suppliers: state.suppliers.filter(s => s.id !== id) }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'deleted', module: 'suppliers', recordId: id, oldValues: old, newValues: null, ip: '192.168.1.100' });
    syncToSupabase('delete', 'suppliers', { id });
  },

  addProduct: (data) => {
    const product: Product = { ...data, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    set((state) => ({ products: [product, ...state.products] }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'created', module: 'products', recordId: product.id, oldValues: null, newValues: data, ip: '192.168.1.100' });
    syncToSupabase('post', 'products', product);
    return product;
  },
  updateProduct: (id, data) => {
    const old = get().products.find(p => p.id === id);
    set((state) => ({ products: state.products.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p) }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'updated', module: 'products', recordId: id, oldValues: old, newValues: data, ip: '192.168.1.100' });
    syncToSupabase('put', 'products', { id, ...data });
  },
  deleteProduct: (id) => {
    const old = get().products.find(p => p.id === id);
    set((state) => ({ products: state.products.filter(p => p.id !== id), variants: state.variants.filter(v => v.productId !== id) }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'deleted', module: 'products', recordId: id, oldValues: old, newValues: null, ip: '192.168.1.100' });
    syncToSupabase('delete', 'products', { id });
  },

  addVariant: (data) => {
    const variant: ProductVariant = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    set((state) => ({ variants: [variant, ...state.variants] }));
    syncToSupabase('post', 'variants', variant);
    return variant;
  },
  updateVariant: (id, data) => {
    set((state) => ({ variants: state.variants.map(v => v.id === id ? { ...v, ...data } : v) }));
    syncToSupabase('put', 'variants', { id, ...data });
  },
  deleteVariant: (id) => {
    set((state) => ({ variants: state.variants.filter(v => v.id !== id) }));
    syncToSupabase('delete', 'variants', { id });
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
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'created', module: 'invoices', recordId: invoice.id, oldValues: null, newValues: data, ip: '192.168.1.100' });
    syncToSupabase('post', 'invoices', invoice);
    return invoice;
  },
  updateInvoice: (id, data) => {
    const old = get().invoices.find(i => i.id === id);
    set((state) => ({ invoices: state.invoices.map(i => i.id === id ? { ...i, ...data, updatedAt: new Date().toISOString() } : i) }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'updated', module: 'invoices', recordId: id, oldValues: old, newValues: data, ip: '192.168.1.100' });
    syncToSupabase('put', 'invoices', { id, ...data });
  },
  deleteInvoice: (id) => {
    const old = get().invoices.find(i => i.id === id);
    set((state) => ({ invoices: state.invoices.filter(i => i.id !== id) }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'deleted', module: 'invoices', recordId: id, oldValues: old, newValues: null, ip: '192.168.1.100' });
    syncToSupabase('delete', 'invoices', { id });
  },

  recordPayment: (invoiceId, data) => {
    const payment: InvoicePayment = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    const state = get();
    const invoice = state.invoices.find(i => i.id === invoiceId);
    if (!invoice) return payment;
    const newPaidAmount = invoice.paidAmount + payment.amount;
    const newStatus = newPaidAmount >= invoice.grandTotal ? 'paid' : 'partially_paid';
    set((state) => ({
      invoices: state.invoices.map(i =>
        i.id === invoiceId
          ? { ...i, paidAmount: newPaidAmount, status: newStatus, payments: [...i.payments, payment], updatedAt: new Date().toISOString() }
          : i
      ),
    }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'updated', module: 'invoices', recordId: invoiceId, oldValues: null, newValues: { paidAmount: newPaidAmount, status: newStatus }, ip: '192.168.1.100' });
    syncToSupabase('post', 'invoicePayments', { ...data, invoiceId, id: payment.id, createdAt: payment.createdAt });
    syncToSupabase('put', 'invoices', { id: invoiceId, paidAmount: newPaidAmount, status: newStatus });
    return payment;
  },

  addQuotation: (data) => {
    const quotation: Quotation = { ...data, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    set((state) => ({ quotations: [quotation, ...state.quotations] }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'created', module: 'quotations', recordId: quotation.id, oldValues: null, newValues: data, ip: '192.168.1.100' });
    syncToSupabase('post', 'quotations', quotation);
    return quotation;
  },
  updateQuotation: (id, data) => {
    const old = get().quotations.find(q => q.id === id);
    set((state) => ({ quotations: state.quotations.map(q => q.id === id ? { ...q, ...data, updatedAt: new Date().toISOString() } : q) }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'updated', module: 'quotations', recordId: id, oldValues: old, newValues: data, ip: '192.168.1.100' });
    syncToSupabase('put', 'quotations', { id, ...data });
  },
  deleteQuotation: (id) => {
    const old = get().quotations.find(q => q.id === id);
    set((state) => ({ quotations: state.quotations.filter(q => q.id !== id) }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'deleted', module: 'quotations', recordId: id, oldValues: old, newValues: null, ip: '192.168.1.100' });
    syncToSupabase('delete', 'quotations', { id });
  },

  addPurchaseOrder: (data) => {
    const po: PurchaseOrder = { ...data, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    set((state) => ({ purchaseOrders: [po, ...state.purchaseOrders] }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'created', module: 'purchaseOrders', recordId: po.id, oldValues: null, newValues: data, ip: '192.168.1.100' });
    syncToSupabase('post', 'purchaseOrders', po);
    return po;
  },
  updatePurchaseOrder: (id, data) => {
    const old = get().purchaseOrders.find(p => p.id === id);
    set((state) => ({ purchaseOrders: state.purchaseOrders.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p) }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'updated', module: 'purchaseOrders', recordId: id, oldValues: old, newValues: data, ip: '192.168.1.100' });
    syncToSupabase('put', 'purchaseOrders', { id, ...data });
  },
  deletePurchaseOrder: (id) => {
    const old = get().purchaseOrders.find(p => p.id === id);
    set((state) => ({ purchaseOrders: state.purchaseOrders.filter(p => p.id !== id) }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'deleted', module: 'purchaseOrders', recordId: id, oldValues: old, newValues: null, ip: '192.168.1.100' });
    syncToSupabase('delete', 'purchaseOrders', { id });
  },

  addReturn: (data) => {
    const ret: Return = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    set((state) => ({ returns: [ret, ...state.returns] }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'created', module: 'returns', recordId: ret.id, oldValues: null, newValues: data, ip: '192.168.1.100' });
    syncToSupabase('post', 'returns', ret);
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
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'created', module: 'treasury', recordId: transaction.id, oldValues: null, newValues: data, ip: '192.168.1.100' });
    syncToSupabase('post', 'treasuryTransactions', transaction);
    return transaction;
  },
  updateTreasuryTransaction: (id, data) => {
    set((state) => ({ treasuryTransactions: state.treasuryTransactions.map(t => t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t) }));
    syncToSupabase('put', 'treasuryTransactions', { id, ...data });
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

  addEmployee: (data) => {
    const emp: Employee = { ...data, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    set((state) => ({ employees: [emp, ...state.employees] }));
    syncToSupabase('post', 'employees', emp);
    return emp;
  },
  updateEmployee: (id, data) => {
    set((state) => ({ employees: state.employees.map(e => e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e) }));
    syncToSupabase('put', 'employees', { id, ...data });
  },
  deleteEmployee: (id) => {
    set((state) => ({ employees: state.employees.filter(e => e.id !== id) }));
    syncToSupabase('delete', 'employees', { id });
  },

  addPayrollRecord: (data) => {
    const record: PayrollRecord = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    set((state) => ({ payrollRecords: [record, ...state.payrollRecords] }));
    syncToSupabase('post', 'payrollRecords', record);
    return record;
  },
  updatePayrollRecord: (id, data) => {
    set((state) => ({ payrollRecords: state.payrollRecords.map(r => r.id === id ? { ...r, ...data } : r) }));
    syncToSupabase('put', 'payrollRecords', { id, ...data });
  },

  addAsset: (data) => {
    const asset: Asset = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    set((state) => ({ assets: [asset, ...state.assets] }));
    syncToSupabase('post', 'assets', asset);
    return asset;
  },
  updateAsset: (id, data) => {
    set((state) => ({ assets: state.assets.map(a => a.id === id ? { ...a, ...data } : a) }));
    syncToSupabase('put', 'assets', { id, ...data });
  },
  deleteAsset: (id) => {
    set((state) => ({ assets: state.assets.filter(a => a.id !== id) }));
    syncToSupabase('delete', 'assets', { id });
  },

  addJournalEntry: (data) => {
    const entry: JournalEntry = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    set((state) => ({ journalEntries: [entry, ...state.journalEntries] }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'created', module: 'journalEntries', recordId: entry.id, oldValues: null, newValues: data, ip: '192.168.1.100' });
    syncToSupabase('post', 'journalEntries', entry);
    return entry;
  },
  updateJournalEntry: (id, data) => {
    set((state) => ({ journalEntries: state.journalEntries.map(e => e.id === id ? { ...e, ...data } : e) }));
    syncToSupabase('put', 'journalEntries', { id, ...data });
  },
  deleteJournalEntry: (id) => {
    set((state) => ({ journalEntries: state.journalEntries.filter(e => e.id !== id) }));
    syncToSupabase('delete', 'journalEntries', { id });
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
    const ids = get().notifications.map(n => n.id);
    ids.forEach(id => syncToSupabase('put', 'notifications', { id, isRead: true, readAt: new Date().toISOString() }));
  },
  clearNotifications: () => {
    const oldNotifications = [...get().notifications];
    set({ notifications: [] });
    oldNotifications.forEach(n => syncToSupabase('delete', 'notifications', { id: n.id }));
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
    set({ [module]: [] } as any);
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'deleted', module, recordId: 'all', oldValues: null, newValues: null, ip: '192.168.1.100' });
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

  addExternalPurchase: (data) => {
    const purchase: ExternalPurchase = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    set((state) => ({ externalPurchases: [purchase, ...state.externalPurchases] }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'created', module: 'externalPurchases', recordId: purchase.id, oldValues: null, newValues: data, ip: '192.168.1.100' });
    syncToSupabase('post', 'externalPurchases', purchase);
    return purchase;
  },
  deleteExternalPurchase: (id) => {
    const old = get().externalPurchases.find(p => p.id === id);
    set((state) => ({ externalPurchases: state.externalPurchases.filter(p => p.id !== id) }));
    get().addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'deleted', module: 'externalPurchases', recordId: id, oldValues: old, newValues: null, ip: '192.168.1.100' });
    syncToSupabase('delete', 'externalPurchases', { id });
  },
  updateExternalPurchaseProductId: (id, productId) => {
    set((state) => ({ externalPurchases: state.externalPurchases.map(p => p.id === id ? { ...p, productId } : p) }));
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
}), {
  name: 'mohasebeyad-storage',
  partialize: (state: any) => {
    const { setLanguage, setTheme, toggleSidebar, initializeStore, resetToDemo,
            getStateSnapshot, loadState, addAuditLog, ...data } = state;
    return data;
  },
  merge: (persisted: any, current: any) => {
    if (persisted?.customers?.length > 0 || persisted?.products?.length > 0) {
      return { ...current, ...persisted, isInitialized: true };
    }
    return current;
  },
}),
);
