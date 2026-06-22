import { ApiResponse, ApiError, AuditLog, Notification } from './types';
import supabaseClient, { isSupabaseConfigured } from './supabase';

const BASE_URL = '/api/';
const API_VERSION = 'v1';

let mockDb: any = null;

export function setMockDb(db: any) {
  mockDb = db;
}

export function getMockDb() {
  return mockDb;
}

function snakeToCamel(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      result[camelKey] = snakeToCamel(value);
    }
    return result;
  }
  return obj;
}

function camelToSnake(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(camelToSnake);
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
      result[snakeKey] = camelToSnake(value);
    }
    return result;
  }
  return obj;
}

const endpointToTable: Record<string, string> = {
  'customers': 'customers',
  'suppliers': 'suppliers',
  'products': 'products',
  'variants': 'variants',
  'categories': 'categories',
  'invoices': 'invoices',
  'invoice-items': 'invoice_items',
  'quotations': 'quotations',
  'purchase-orders': 'purchase_orders',
  'purchaseOrders': 'purchase_orders',
  'returns': 'returns',
  'treasury-accounts': 'treasury_accounts',
  'treasuryAccounts': 'treasury_accounts',
  'treasury-transactions': 'treasury_transactions',
  'treasuryTransactions': 'treasury_transactions',
  'warehouses': 'warehouses',
  'stock-movements': 'stock_movements',
  'stockMovements': 'stock_movements',
  'employees': 'employees',
  'assets': 'assets',
  'journal-entries': 'journal_entries',
  'journalEntries': 'journal_entries',
  'chart-of-accounts': 'chart_of_accounts',
  'chartOfAccounts': 'chart_of_accounts',
  'notifications': 'notifications',
  'audit-logs': 'audit_logs',
  'auditLogs': 'audit_logs',
  'settings': 'settings',
  'import-history': 'import_history',
  'importHistory': 'import_history',
  'discount-rules': 'discount_rules',
  'discountRules': 'discount_rules',
  'payment-methods': 'payment_methods',
  'paymentMethods': 'payment_methods',
  'payroll-records': 'payroll_records',
  'payrollRecords': 'payroll_records',
  'deliveries': 'deliveries',
  'pricing-rules': 'pricing_rules',
  'externalPurchases': 'external_purchases',
  'external-purchases': 'external_purchases',
  'customerStatements': 'customer_statements',
  'customer-statements': 'customer_statements',
  'productCategories': 'categories',
  'treasuryCategories': 'categories',
};

function getTable(endpoint: string): string | null {
  const parts = endpoint.split('/').filter(Boolean);
  const module = parts[0] || '';
  return endpointToTable[module] || null;
}

function getId(endpoint: string): string | null {
  const parts = endpoint.split('/').filter(Boolean);
  return parts.length > 1 ? parts[1] : null;
}

async function supabaseGet<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
  const table = getTable(endpoint);
  if (!table) return [] as any;

  if (table === 'categories' && endpoint.includes('productCategories')) {
    let query = (supabaseClient! as any).from('categories').select('*').eq('type', 'product');
    const all = await query;
    return snakeToCamel(all.data || []) as any;
  }
  if (table === 'categories' && endpoint.includes('treasuryCategories')) {
    let query = (supabaseClient! as any).from('categories').select('*').in('type', ['income', 'expense']);
    const all = await query;
    return snakeToCamel(all.data || []) as any;
  }

  if (endpoint === 'dashboard') {
    return supabaseGetDashboard() as any;
  }

  let query = (supabaseClient! as any).from(table).select('*');

  if (params) {
    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,name_ar.ilike.%${params.search}%,sku.ilike.%${params.search}%,description.ilike.%${params.search}%`);
    }
    if (params.status) query = query.eq('status', params.status);
    if (params.categoryId) query = query.eq('category_id', params.categoryId);
    if (params.customerId) query = query.eq('customer_id', params.customerId);
    if (params.supplierId) query = query.eq('supplier_id', params.supplierId);
    if (params.dateFrom) query = query.gte('created_at', params.dateFrom);
    if (params.dateTo) query = query.lte('created_at', params.dateTo);
    if (params.type) query = query.eq('type', params.type);
    if (params.productId) query = query.eq('product_id', params.productId);
    if (params.invoiceId) query = query.eq('invoice_id', params.invoiceId);
    if (params.accountId) query = query.eq('account_id', params.accountId);
    if (params.warehouseId) query = query.eq('warehouse_id', params.warehouseId);
    if (params.employeeId) query = query.eq('employee_id', params.employeeId);
    if (params.isRead !== undefined) query = query.eq('is_read', params.isRead);
    if (params.module) query = query.eq('module', params.module);
    if (params.sortBy) {
      query = query.order(params.sortBy, { ascending: params.sortOrder === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }
    if (params.limit) query = query.limit(params.limit);
    if (params.offset) query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw { code: 'SUPABASE_ERROR', message: error.message };
  return snakeToCamel(data || []) as any;
}

const delay = (ms?: number) => {
  const d = ms || Math.floor(Math.random() * 500) + 300;
  return new Promise(resolve => setTimeout(resolve, d));
};

const shouldFail = () => Math.random() < 0.05;

const requestInterceptor = (config: any) => ({
  ...config,
  headers: {
    ...config.headers,
    'Authorization': 'Bearer mock-token-xxx',
    'X-API-Version': API_VERSION,
  },
});

const responseInterceptor = <T>(response: ApiResponse<T>): ApiResponse<T> => response;

const errorInterceptor = (error: ApiError): ApiError => error;

function getModule(endpoint: string): string {
  const parts = endpoint.split('/').filter(Boolean);
  return parts[0] || '';
}

export const apiClient = {
  get: async <T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> => {
    if (isSupabaseConfigured && supabaseClient) {
      try {
        const data = await supabaseGet<T>(endpoint, params);
        return responseInterceptor({ data, status: 200, message: 'Success' });
      } catch (err: any) {
        throw errorInterceptor({ code: err.code || 'SERVER_ERROR', message: err.message || 'Failed to fetch data' });
      }
    }

    await delay();
    if (shouldFail()) {
      throw errorInterceptor({ code: 'SERVER_ERROR', message: 'Internal server error. Please try again.' });
    }
    const result = handleGetRequest<T>(endpoint, params);
    return responseInterceptor({ data: result, status: 200, message: 'Success' });
  },

  post: async <T>(endpoint: string, data: any): Promise<ApiResponse<T>> => {
    if (isSupabaseConfigured && supabaseClient) {
      try {
        const table = getTable(endpoint);
        if (!table || table === 'categories' || endpoint.includes('dashboard')) {
          return responseInterceptor({ data: data as any, status: 201, message: 'Created successfully' });
        }
        const { data: inserted, error } = await (supabaseClient! as any)
          .from(table)
          .insert(camelToSnake(data))
          .select()
          .single();
        if (error) throw { code: 'SUPABASE_ERROR', message: error.message };

        await (supabaseClient! as any).from('audit_logs').insert({
          timestamp: new Date().toISOString(),
          user: 'Admin',
          action: 'created',
          module: table,
          record_id: (inserted as any)?.id || '',
          old_values: null,
          new_values: camelToSnake(data),
          ip: '192.168.1.100',
        });

        return responseInterceptor({ data: snakeToCamel(inserted), status: 201, message: 'Created successfully' });
      } catch (err: any) {
        throw errorInterceptor({ code: err.code || 'SERVER_ERROR', message: err.message || 'Failed to create' });
      }
    }

    await delay();
    if (shouldFail()) {
      throw errorInterceptor({ code: 'SERVER_ERROR', message: 'Internal server error. Please try again.' });
    }
    const result = handlePostRequest<T>(endpoint, data);
    return responseInterceptor({ data: result, status: 201, message: 'Created successfully' });
  },

  put: async <T>(endpoint: string, data: any): Promise<ApiResponse<T>> => {
    if (isSupabaseConfigured && supabaseClient) {
      try {
        const table = getTable(endpoint);
        const id = getId(endpoint) || data.id;
        if (!table || !id) {
          return responseInterceptor({ data: data as any, status: 200, message: 'Updated successfully' });
        }

        const { data: oldData } = await (supabaseClient! as any).from(table).select('*').eq('id', id).single();

        const { data: updated, error } = await (supabaseClient! as any)
          .from(table)
          .update(camelToSnake(data))
          .eq('id', id)
          .select()
          .single();
        if (error) throw { code: 'SUPABASE_ERROR', message: error.message };

        await (supabaseClient! as any).from('audit_logs').insert({
          timestamp: new Date().toISOString(),
          user: 'Admin',
          action: 'updated',
          module: table,
          record_id: id,
          old_values: oldData || null,
          new_values: camelToSnake(data),
          ip: '192.168.1.100',
        });

        return responseInterceptor({ data: snakeToCamel(updated), status: 200, message: 'Updated successfully' });
      } catch (err: any) {
        throw errorInterceptor({ code: err.code || 'SERVER_ERROR', message: err.message || 'Failed to update' });
      }
    }

    await delay();
    if (shouldFail()) {
      throw errorInterceptor({ code: 'SERVER_ERROR', message: 'Internal server error. Please try again.' });
    }
    const result = handlePutRequest<T>(endpoint, data);
    return responseInterceptor({ data: result, status: 200, message: 'Updated successfully' });
  },

  delete: async <T>(endpoint: string): Promise<ApiResponse<T>> => {
    if (isSupabaseConfigured && supabaseClient) {
      try {
        const table = getTable(endpoint);
        const id = getId(endpoint);
        if (!table || !id) {
          return responseInterceptor({ data: null as any, status: 200, message: 'Deleted successfully' });
        }

        const { data: oldData } = await (supabaseClient! as any).from(table).select('*').eq('id', id).single();

        const { error } = await (supabaseClient! as any).from(table).delete().eq('id', id);
        if (error) throw { code: 'SUPABASE_ERROR', message: error.message };

        await (supabaseClient! as any).from('audit_logs').insert({
          timestamp: new Date().toISOString(),
          user: 'Admin',
          action: 'deleted',
          module: table,
          record_id: id,
          old_values: oldData || null,
          new_values: null,
          ip: '192.168.1.100',
        });

        return responseInterceptor({ data: snakeToCamel(oldData), status: 200, message: 'Deleted successfully' });
      } catch (err: any) {
        throw errorInterceptor({ code: err.code || 'SERVER_ERROR', message: err.message || 'Failed to delete' });
      }
    }

    await delay();
    if (shouldFail()) {
      throw errorInterceptor({ code: 'SERVER_ERROR', message: 'Internal server error. Please try again.' });
    }
    const result = handleDeleteRequest<T>(endpoint);
    return responseInterceptor({ data: result, status: 200, message: 'Deleted successfully' });
  },

  upload: async <T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> => {
    if (isSupabaseConfigured && supabaseClient) {
      const file = formData.get('file') as File;
      if (file) {
        const { data, error } = await (supabaseClient! as any).storage
          .from('uploads')
          .upload(`imports/${Date.now()}_${file.name}`, file);
        if (error) throw errorInterceptor({ code: 'UPLOAD_FAILED', message: error.message });
        return responseInterceptor({ data: data as any, status: 201, message: 'Uploaded successfully' });
      }
    }

    await delay(800);
    if (shouldFail()) {
      throw errorInterceptor({ code: 'UPLOAD_FAILED', message: 'File upload failed. Please try again.' });
    }
    const result = handleUploadRequest<T>(endpoint, formData);
    return responseInterceptor({ data: result, status: 201, message: 'Uploaded successfully' });
  },
};

async function supabaseGetDashboard(): Promise<any> {
  if (!supabaseClient) return {};

  const [invoicesRes, expensesRes, incomesRes, accountsRes, productsRes] = await Promise.all([
    (supabaseClient as any).from('invoices').select('grand_total, paid_amount, status'),
    (supabaseClient as any).from('treasury_transactions').select('amount, type').eq('type', 'expense'),
    (supabaseClient as any).from('treasury_transactions').select('amount, type').eq('type', 'income'),
    (supabaseClient as any).from('treasury_accounts').select('balance'),
    (supabaseClient as any).from('products').select('stock, low_stock_threshold, track_inventory').eq('track_inventory', true),
  ]);

  const totalRevenue = (incomesRes.data || []).reduce((s: number, t: any) => s + t.amount, 0);
  const totalExpenses = (expensesRes.data || []).reduce((s: number, t: any) => s + t.amount, 0);
  const balance = (accountsRes.data || []).reduce((s: number, a: any) => s + a.balance, 0);
  const invoices = invoicesRes.data || [];
  const outstandingInvoices = invoices
    .filter((i: any) => ['sent', 'overdue', 'partially_paid'].includes(i.status))
    .reduce((s: number, i: any) => s + (i.grand_total - (i.paid_amount || 0)), 0);
  const lowStockCount = (productsRes.data || []).filter((p: any) => p.stock <= p.low_stock_threshold).length;

  const recentLogs = await (supabaseClient as any).from('audit_logs').select('*').order('created_at', { ascending: false }).limit(20);

  return {
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    balance,
    outstandingInvoices,
    lowStockCount,
    recentActivity: snakeToCamel(recentLogs.data || []),
    invoicesByMonth: {},
    expensesByMonth: {},
  };
}

function handleGetRequest<T>(endpoint: string, params?: Record<string, any>): T {
  const module = getModule(endpoint);
  if (!mockDb) return [] as any;

  switch (module) {
    case 'customers':
      return filterData(mockDb.customers, params) as any;
    case 'suppliers':
      return filterData(mockDb.suppliers, params) as any;
    case 'products':
      return filterData(mockDb.products, params) as any;
    case 'productCategories':
      return filterData(mockDb.categories.filter((c: any) => c.type === 'product'), params) as any;
    case 'treasuryCategories':
      return filterData(mockDb.categories.filter((c: any) => c.type === 'income' || c.type === 'expense'), params) as any;
    case 'variants':
      return filterData(mockDb.variants, params) as any;
    case 'categories':
      return filterData(mockDb.categories, params) as any;
    case 'invoices':
      return filterData(mockDb.invoices, params) as any;
    case 'quotations':
      return filterData(mockDb.quotations, params) as any;
    case 'purchase-orders':
    case 'purchaseOrders':
      return filterData(mockDb.purchaseOrders, params) as any;
    case 'returns':
      return filterData(mockDb.returns, params) as any;
    case 'treasury-accounts':
    case 'treasuryAccounts':
      return filterData(mockDb.treasuryAccounts, params) as any;
    case 'treasury-transactions':
    case 'treasuryTransactions':
      return filterData(mockDb.treasuryTransactions, params) as any;
    case 'warehouses':
      return filterData(mockDb.warehouses, params) as any;
    case 'stock-movements':
    case 'stockMovements':
      return filterData(mockDb.stockMovements, params) as any;
    case 'employees':
      return filterData(mockDb.employees, params) as any;
    case 'assets':
      return filterData(mockDb.assets, params) as any;
    case 'journal-entries':
    case 'journalEntries':
      return filterData(mockDb.journalEntries, params) as any;
    case 'chart-of-accounts':
    case 'chartOfAccounts':
      return filterData(mockDb.chartOfAccounts, params) as any;
    case 'notifications':
      return filterData(mockDb.notifications, params) as any;
    case 'audit-logs':
    case 'auditLogs':
      return filterData(mockDb.auditLogs, params) as any;
    case 'settings':
      return filterData(mockDb.settings, params) as any;
    case 'import-history':
    case 'importHistory':
      return filterData(mockDb.importHistory, params) as any;
    case 'discount-rules':
    case 'discountRules':
      return filterData(mockDb.discountRules, params) as any;
    case 'payment-methods':
    case 'paymentMethods':
      return filterData(mockDb.paymentMethods, params) as any;
    case 'externalPurchases':
    case 'external-purchases':
      return filterData(mockDb.externalPurchases, params) as any;
    case 'customerStatements':
    case 'customer-statements':
      return filterData(mockDb.customerStatements, params) as any;
    case 'dashboard':
      return getDashboardData() as any;
    default:
      return [] as any;
  }
}

function handlePostRequest<T>(endpoint: string, data: any): T {
  const module = getModule(endpoint);
  if (!mockDb) return data as any;

  const auditLog = createAuditLog('created', module, null, data);
  mockDb.auditLogs.unshift(auditLog);
  generateNotification('created', module, data);

  const item = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };

  switch (module) {
    case 'customers': mockDb.customers.unshift(item); break;
    case 'suppliers': mockDb.suppliers.unshift(item); break;
    case 'products': mockDb.products.unshift(item); break;
    case 'variants': mockDb.variants.unshift(item); break;
    case 'categories': mockDb.categories.unshift(item); break;
    case 'invoices': mockDb.invoices.unshift(item); break;
    case 'quotations': mockDb.quotations.unshift(item); break;
    case 'purchase-orders':
    case 'purchaseOrders': mockDb.purchaseOrders.unshift({...item, items: data.items || []}); break;
    case 'externalPurchases':
    case 'external-purchases': mockDb.externalPurchases.unshift(item); break;
    case 'customerStatements':
    case 'customer-statements': mockDb.customerStatements.unshift(item); break;
    case 'returns': mockDb.returns.unshift(item); break;
    case 'treasury-accounts':
    case 'treasuryAccounts': mockDb.treasuryAccounts.unshift(item); break;
    case 'treasury-transactions':
    case 'treasuryTransactions': mockDb.treasuryTransactions.unshift(item); break;
    case 'warehouses': mockDb.warehouses.unshift(item); break;
    case 'stock-movements':
    case 'stockMovements': mockDb.stockMovements.unshift(item); break;
    case 'employees': mockDb.employees.unshift(item); break;
    case 'assets': mockDb.assets.unshift(item); break;
    case 'journal-entries':
    case 'journalEntries': mockDb.journalEntries.unshift(item); break;
    case 'chart-of-accounts':
    case 'chartOfAccounts': mockDb.chartOfAccounts.unshift(item); break;
  }

  return item as any;
}

function handlePutRequest<T>(endpoint: string, data: any): T {
  const module = getModule(endpoint);
  if (!mockDb) return data as any;

  let oldValues = null;
  const updateCollection = (collection: any[]) => {
    const index = collection.findIndex((item: any) => item.id === data.id);
    if (index !== -1) {
      oldValues = { ...collection[index] };
      collection[index] = { ...collection[index], ...data, updatedAt: new Date().toISOString() };
      return collection[index];
    }
    return data;
  };

  let updated;
  switch (module) {
    case 'customers': updated = updateCollection(mockDb.customers); break;
    case 'suppliers': updated = updateCollection(mockDb.suppliers); break;
    case 'products': updated = updateCollection(mockDb.products); break;
    case 'variants': updated = updateCollection(mockDb.variants); break;
    case 'categories': updated = updateCollection(mockDb.categories); break;
    case 'invoices': updated = updateCollection(mockDb.invoices); break;
    case 'quotations': updated = updateCollection(mockDb.quotations); break;
    case 'purchase-orders':
    case 'purchaseOrders': updated = updateCollection(mockDb.purchaseOrders); break;
    case 'returns': updated = updateCollection(mockDb.returns); break;
    case 'treasury-accounts':
    case 'treasuryAccounts': updated = updateCollection(mockDb.treasuryAccounts); break;
    case 'treasury-transactions':
    case 'treasuryTransactions': updated = updateCollection(mockDb.treasuryTransactions); break;
    case 'warehouses': updated = updateCollection(mockDb.warehouses); break;
    case 'employees': updated = updateCollection(mockDb.employees); break;
    case 'assets': updated = updateCollection(mockDb.assets); break;
    case 'journal-entries':
    case 'journalEntries': updated = updateCollection(mockDb.journalEntries); break;
    case 'chart-of-accounts':
    case 'chartOfAccounts': updated = updateCollection(mockDb.chartOfAccounts); break;
    default: updated = data;
  }

  const auditLog = createAuditLog('updated', module, data.id, data, oldValues);
  mockDb.auditLogs.unshift(auditLog);

  return updated as any;
}

function handleDeleteRequest<T>(endpoint: string): T {
  const module = getModule(endpoint);
  const id = endpoint.split('/').pop();
  if (!mockDb || !id) return null as any;

  const deleteFromCollection = (collection: any[]) => {
    const index = collection.findIndex((item: any) => item.id === id);
    if (index !== -1) {
      const deleted = collection.splice(index, 1)[0];
      return deleted;
    }
    return null;
  };

  let deleted;
  switch (module) {
    case 'customers': deleted = deleteFromCollection(mockDb.customers); break;
    case 'suppliers': deleted = deleteFromCollection(mockDb.suppliers); break;
    case 'products': deleted = deleteFromCollection(mockDb.products); break;
    case 'variants': deleted = deleteFromCollection(mockDb.variants); break;
    case 'categories': deleted = deleteFromCollection(mockDb.categories); break;
    case 'invoices': deleted = deleteFromCollection(mockDb.invoices); break;
    case 'quotations': deleted = deleteFromCollection(mockDb.quotations); break;
    case 'purchase-orders':
    case 'purchaseOrders': deleted = deleteFromCollection(mockDb.purchaseOrders); break;
    case 'externalPurchases':
    case 'external-purchases': deleted = deleteFromCollection(mockDb.externalPurchases); break;
  }

  if (deleted) {
    const auditLog = createAuditLog('deleted', module, id, null, deleted);
    mockDb.auditLogs.unshift(auditLog);
  }

  return deleted as any;
}

function handleUploadRequest<T>(endpoint: string, formData: FormData): T {
  return { filename: formData.get('file') || 'uploaded-file.xlsx', rows: 100, imported: 95, errors: 5 } as any;
}

function filterData(data: any[], params?: Record<string, any>): any {
  if (!params || Object.keys(params).length === 0) return data;

  let result = [...data];

  Object.entries(params).forEach(([key, value]) => {
    if (key === 'search' && value) {
      const searchStr = (value as string).toLowerCase();
      result = result.filter(item =>
        Object.values(item).some(val =>
          String(val).toLowerCase().includes(searchStr)
        )
      );
    }
    if (key === 'status' && value) {
      result = result.filter(item => item.status === value);
    }
    if (key === 'categoryId' && value) {
      result = result.filter(item => item.categoryId === value);
    }
    if (key === 'customerId' && value) {
      result = result.filter(item => item.customerId === value);
    }
    if (key === 'supplierId' && value) {
      result = result.filter(item => item.supplierId === value);
    }
    if (key === 'dateFrom' && value) {
      result = result.filter(item => new Date(item.createdAt) >= new Date(value as string));
    }
    if (key === 'dateTo' && value) {
      result = result.filter(item => new Date(item.createdAt) <= new Date(value as string));
    }
  });

  return result;
}

function getDashboardData(): any {
  if (!mockDb) return {};

  const invoices = mockDb.invoices || [];
  const expenses = (mockDb.treasuryTransactions || []).filter((t: any) => t.type === 'expense');
  const incomes = (mockDb.treasuryTransactions || []).filter((t: any) => t.type === 'income');

  const totalRevenue = incomes.reduce((sum: number, t: any) => sum + t.amount, 0);
  const totalExpenses = expenses.reduce((sum: number, t: any) => sum + t.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const balance = (mockDb.treasuryAccounts || []).reduce((sum: number, a: any) => sum + a.balance, 0);
  const outstandingInvoices = invoices
    .filter((i: any) => i.status === 'sent' || i.status === 'overdue' || i.status === 'partially_paid')
    .reduce((sum: number, i: any) => sum + (i.grandTotal - (i.paidAmount || 0)), 0);

  const lowStockProducts = (mockDb.products || []).filter((p: any) => p.trackInventory && p.stock <= p.lowStockThreshold);

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    balance,
    outstandingInvoices,
    lowStockCount: lowStockProducts.length,
    recentActivity: (mockDb.auditLogs || []).slice(0, 20),
    invoicesByMonth: {},
    expensesByMonth: {},
  };
}

function createAuditLog(action: AuditLog['action'], module: string, recordId: string | null, newValues: any, oldValues?: any): AuditLog {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    user: 'Admin',
    action,
    module,
    recordId: recordId || newValues?.id || '',
    oldValues: oldValues || null,
    newValues: newValues || null,
    ip: '192.168.1.100',
    createdAt: new Date().toISOString(),
  };
}

function generateNotification(action: string, module: string, data: any): void {
  if (!mockDb) return;
  const notification: Notification = {
    id: crypto.randomUUID(),
    type: 'system',
    title: `${module.charAt(0).toUpperCase() + module.slice(1)} ${action}`,
    titleAr: `تم ${action === 'created' ? 'إنشاء' : 'تحديث'} ${module}`,
    message: `${module.charAt(0).toUpperCase() + module.slice(1)} has been ${action} successfully`,
    messageAr: `تم ${action === 'created' ? 'إنشاء' : 'تحديث'} ${module} بنجاح`,
    module,
    recordId: data?.id || '',
    isRead: false,
    readAt: null,
    createdAt: new Date().toISOString(),
  };
  mockDb.notifications.unshift(notification);
}

export { delay, shouldFail, filterData, snakeToCamel, camelToSnake };
