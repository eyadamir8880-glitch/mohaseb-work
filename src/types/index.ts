export type Language = 'en' | 'ar';
export type Theme = 'light' | 'dark';
export type Currency = 'EGP' | 'SAR' | 'USD';
export type Direction = 'ltr' | 'rtl';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PurchaseOrderStatus = 'draft' | 'sent' | 'received' | 'paid' | 'cancelled';
export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'cash' | 'bank' | 'card' | 'check';
export type StockMovementType = 'in' | 'out' | 'adjustment';
export type AccountType = 'cash' | 'bank' | 'petty';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  taxNumber: string;
  creditLimit: number;
  totalInvoices: number;
  totalPaid: number;
  totalDue: number;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  description: string;
  purchasePrice: number;
  sellingPrice: number;
  profitMargin: number;
  categoryId: string;
  unit: string;
  trackInventory: boolean;
  currentStock: number;
  lowStockThreshold: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  nameAr: string;
  parentId: string | null;
  type: 'product' | 'income' | 'expense';
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  discount: number;
  tax: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  status: InvoiceStatus;
  notes: string;
  createdAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  issueDate: string;
  expectedDeliveryDate: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  grandTotal: number;
  status: PurchaseOrderStatus;
  notes: string;
  createdAt: string;
}

export interface TreasuryAccount {
  id: string;
  name: string;
  nameAr: string;
  type: AccountType;
  balance: number;
  createdAt: string;
}

export interface TreasuryTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  categoryId: string;
  categoryName: string;
  categoryNameAr: string;
  description: string;
  referenceNumber: string;
  accountId: string;
  accountName: string;
  linkedInvoiceId?: string;
  linkedPOId?: string;
  receiptUrl?: string;
  reconciled: boolean;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  quantity: number;
  reason: string;
  date: string;
  warehouseId: string;
  warehouseName: string;
  createdAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  nameAr: string;
  location: string;
  createdAt: string;
}

export interface AppSettings {
  companyName: string;
  companyNameAr: string;
  logo: string;
  address: string;
  addressAr: string;
  taxNumber: string;
  currency: Currency;
  language: Language;
  theme: Theme;
  invoicePrefix: string;
  invoiceNextNumber: number;
  invoiceTerms: string;
  invoiceTermsAr: string;
  poPrefix: string;
  poNextNumber: number;
}

export interface DashboardKPIs {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  outstandingInvoices: number;
  currentBalance: number;
}

export interface MonthlyTrend {
  month: string;
  revenue: number;
  expenses: number;
}

export interface CashFlowItem {
  date: string;
  inflow: number;
  outflow: number;
  balance: number;
}

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDate: string;
  accountId: string;
  active: boolean;
}
