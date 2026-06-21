export interface Customer {
  id: string;
  name: string;
  nameAr: string;
  phone: string;
  email: string;
  address: string;
  taxNumber: string;
  creditLimit: number;
  totalInvoiced: number;
  totalPaid: number;
  totalDue: number;
  customPricingRules: PricingRule[];
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  nameAr: string;
  phone: string;
  email: string;
  address: string;
  taxNumber: string;
  paymentTerms: number;
  notes: string;
  totalPOs: number;
  totalPaid: number;
  balanceDue: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  nameAr: string;
  sku: string;
  alternateSkus: string[];
  barcode: string;
  description: string;
  descriptionAr: string;
  categoryId: string;
  unitOfMeasure: string;
  baseUnit: string;
  conversionRate: number;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  trackInventory: boolean;
  lowStockThreshold: number;
  reorderPoint: number;
  imageUrl: string;
  hasVariants: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  barcode: string;
  attributeName: string;
  attributeValue: string;
  priceOverride: number | null;
  stock: number;
  imageUrl: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  nameAr: string;
  type: 'product' | 'income' | 'expense';
  parentId: string | null;
  description: string;
  sortOrder: number;
  createdAt: string;
}

export interface ChartOfAccount {
  id: string;
  name: string;
  nameAr: string;
  code: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  parentId: string | null;
  balance: number;
  createdAt: string;
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  reference: string;
  paidAt: string;
  notes: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  variantId: string | null;
  productName: string;
  productNameAr: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  lineTotal: number;
}

export interface DeliveryInfo {
  type: 'pickup' | 'internal' | 'third_party';
  driverId: string | null;
  cost: number;
  expectedDate: string;
  trackingNumber: string;
  status: 'pending' | 'out_for_delivery' | 'delivered' | 'failed';
  notes: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  items: InvoiceItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  paidAmount: number;
  status: 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled' | 'partially_returned' | 'fully_returned';
  issueDate: string;
  dueDate: string;
  notes: string;
  terms: string;
  deliveryInfo: DeliveryInfo | null;
  treasuryTransactionId: string | null;
  payments: InvoicePayment[];
  createdAt: string;
  updatedAt: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  items: InvoiceItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';
  issueDate: string;
  expiryDate: string;
  notes: string;
  terms: string;
  convertedInvoiceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  variantId: string | null;
  productName: string;
  productNameAr: string;
  sku: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  paidAmount: number;
  status: 'draft' | 'sent' | 'partially_received' | 'received' | 'paid' | 'cancelled';
  orderDate: string;
  expectedDate: string;
  receivedDate: string | null;
  notes: string;
  treasuryTransactionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnItem {
  id: string;
  productId: string;
  variantId: string | null;
  productName: string;
  productNameAr: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
  condition: 'good' | 'bad';
  reason: string;
}

export interface Return {
  id: string;
  returnNumber: string;
  type: 'customer' | 'supplier';
  originalInvoiceId: string | null;
  originalPOId: string | null;
  items: ReturnItem[];
  refundAmount: number;
  refundMethod: string;
  status: string;
  createdAt: string;
}

export interface TreasuryAccount {
  id: string;
  name: string;
  nameAr: string;
  type: 'cash' | 'bank' | 'vodafone_cash' | 'instapay';
  balance: number;
  currency: string;
  isDefault: boolean;
  createdAt: string;
}

export interface TreasuryTransaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  date: string;
  accountId: string;
  fromAccountId: string | null;
  toAccountId: string | null;
  paymentMethod: string;
  paymentMethodDetail: string;
  categoryId: string;
  description: string;
  descriptionAr: string;
  referenceNumber: string;
  receiptUrl: string;
  linkedInvoiceId: string | null;
  linkedPOId: string | null;
  linkedReturnId: string | null;
  isRecurring: boolean;
  recurringPattern: string | null;
  nextOccurrence: string | null;
  isReconciled: boolean;
  reconciledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  variantId: string | null;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  date: string;
  referenceType: string;
  referenceId: string;
  warehouseId: string;
  createdAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  nameAr: string;
  location: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  nameAr: string;
  position: string;
  positionAr: string;
  phone: string;
  email: string;
  address: string;
  joinDate: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'active' | 'on_leave' | 'terminated';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  paymentDate: string | null;
  treasuryTransactionId: string | null;
  status: 'pending' | 'paid';
  createdAt: string;
}

export interface JournalLine {
  id: string;
  journalEntryId: string;
  accountId: string;
  debit: number;
  credit: number;
  description: string;
  descriptionAr: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  referenceNumber: string;
  description: string;
  descriptionAr: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  attachments: string[];
  createdAt: string;
}

export interface DepreciationRecord {
  id: string;
  assetId: string;
  date: string;
  amount: number;
  accumulatedDepreciation: number;
  bookValue: number;
}

export interface Asset {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  purchaseDate: string;
  purchaseCost: number;
  salvageValue: number;
  usefulLife: number;
  depreciationMethod: 'straight_line' | 'declining_balance';
  currentBookValue: number;
  status: 'active' | 'disposed';
  disposalDate: string | null;
  disposalPrice: number | null;
  depreciationRecords: DepreciationRecord[];
  createdAt: string;
}

export interface Delivery {
  id: string;
  invoiceId: string;
  type: 'pickup' | 'internal' | 'third_party';
  driverId: string | null;
  cost: number;
  expectedDate: string;
  trackingNumber: string;
  status: 'pending' | 'out_for_delivery' | 'delivered' | 'failed';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: 'low_stock' | 'invoice_overdue' | 'payment_received' | 'po_expected' | 'recurring_transaction' | 'quote_expiring' | 'system';
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  module: string;
  recordId: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: 'created' | 'updated' | 'deleted' | 'viewed' | 'exported' | 'imported' | 'printed' | 'paid' | 'received' | 'transferred' | 'reconciled';
  module: string;
  recordId: string;
  oldValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
  ip: string;
  createdAt: string;
}

export interface ImportSession {
  id: string;
  filename: string;
  uploadedAt: string;
  totalRows: number;
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  errorReport: string | null;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
}

export interface DiscountRule {
  id: string;
  name: string;
  nameAr: string;
  type: 'global' | 'customer' | 'volume';
  percentage: number;
  fixedAmount: number | null;
  minQuantity: number;
  applicableProducts: string[];
  applicableCustomers: string[];
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  nameAr: string;
  type: 'vodafone_cash' | 'instapay' | 'cash' | 'bank' | 'card' | 'check';
  accountHolder: string;
  icon: string;
  isActive: boolean;
  isProtected: boolean;
  sortOrder: number;
}

export interface PricingRule {
  id: string;
  productId: string;
  discountPercent: number;
  fixedPrice: number | null;
}

export interface AppState {
  // Language & Theme
  language: 'en' | 'ar';
  theme: 'light' | 'dark';
  
  // Data modules
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
  
  // UI State
  sidebarCollapsed: boolean;
  
  // Actions
  setLanguage: (lang: 'en' | 'ar') => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  loadState: (state: Partial<AppState>) => void;
  resetState: () => void;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface ImportRow {
  rowNumber: number;
  name: string;
  nameAr: string;
  sku: string;
  alternateSkus: string[];
  price: number;
  errors: { field: string; message: string; severity: 'error' | 'warning' }[];
  isValid: boolean;
  isSelected: boolean;
}

export type PageWithId = {
  id: string;
  label: string;
  labelAr: string;
  href: string;
  icon: string;
  badge?: number;
};
