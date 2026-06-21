import type { PaymentMethod } from './types';

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'cash', name: 'Cash', nameAr: 'نقداً', type: 'cash', accountHolder: '-', icon: 'wallet', isActive: true, isProtected: true, sortOrder: 1 },
  { id: 'bank', name: 'Bank Transfer', nameAr: 'تحويل بنكي', type: 'bank', accountHolder: '-', icon: 'landmark', isActive: true, isProtected: true, sortOrder: 2 },
  { id: 'card', name: 'Card', nameAr: 'بطاقة', type: 'card', accountHolder: '-', icon: 'credit_card', isActive: true, isProtected: true, sortOrder: 3 },
  { id: 'check', name: 'Check', nameAr: 'شيك', type: 'check', accountHolder: '-', icon: 'file_text', isActive: true, isProtected: true, sortOrder: 4 },
  { id: 'vodafone_cash_omar', name: 'Vodafone Cash - Omar', nameAr: 'فودافون كاش عمر', type: 'vodafone_cash', accountHolder: 'عمر', icon: 'smartphone', isActive: true, isProtected: true, sortOrder: 5 },
  { id: 'vodafone_cash_amir', name: 'Vodafone Cash - Amir', nameAr: 'فودافون كاش امير', type: 'vodafone_cash', accountHolder: 'امير', icon: 'smartphone', isActive: true, isProtected: true, sortOrder: 6 },
  { id: 'vodafone_cash_islam', name: 'Vodafone Cash - Islam', nameAr: 'فودافون كاش اسلام', type: 'vodafone_cash', accountHolder: 'اسلام', icon: 'smartphone', isActive: true, isProtected: true, sortOrder: 7 },
  { id: 'vodafone_cash_eyad', name: 'Vodafone Cash - Eyad', nameAr: 'فودافون كاش اياد', type: 'vodafone_cash', accountHolder: 'اياد', icon: 'smartphone', isActive: true, isProtected: true, sortOrder: 8 },
  { id: 'instapay_amir', name: 'InstaPay - Amir', nameAr: 'انستا باي امير', type: 'instapay', accountHolder: 'امير', icon: 'smartphone', isActive: true, isProtected: true, sortOrder: 9 },
  { id: 'instapay_islam', name: 'InstaPay - Islam', nameAr: 'انستا باي اسلام', type: 'instapay', accountHolder: 'اسلام', icon: 'smartphone', isActive: true, isProtected: true, sortOrder: 10 },
];

export const DEFAULT_SETTINGS = {
  companyName: 'Mohasebeyad',
  companyNameAr: 'محاسب ياد',
  companyPhone: '+20 100 000 0000',
  companyEmail: 'info@mohasebeyad.com',
  companyAddress: 'Cairo, Egypt',
  companyAddressAr: 'القاهرة، مصر',
  companyTaxNumber: '123-456-789',
  invoicePrefix: 'INV-',
  quotationPrefix: 'QT-',
  poPrefix: 'PO-',
  returnPrefix: 'RET-',
  defaultCurrency: 'EGP',
  defaultTaxRate: 14,
  invoiceTerms: 'Payment due within 30 days',
  invoiceTermsAr: 'الدفع مستحق خلال 30 يوماً',
  posReceiptFooter: 'Thank you for your purchase!',
  posReceiptFooterAr: 'شكراً لتسوقكم!',
  defaultWarehouseId: '',
  lowStockThreshold: 10,
  dateFormat: 'DD/MM/YYYY',
  showHijriDate: false,
  notificationOverdueDays: 3,
  notificationQuoteExpiryDays: 3,
};

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', labelAr: 'لوحة التحكم', href: '/dashboard', icon: 'LayoutDashboard' },
  { id: 'pos', label: 'POS', labelAr: 'نقطة البيع', href: '/pos', icon: 'ShoppingCart' },
  { id: 'invoices', label: 'Invoices', labelAr: 'الفواتير', href: '/invoices', icon: 'FileText' },
  { id: 'quotations', label: 'Quotations', labelAr: 'العروض', href: '/quotations', icon: 'FileCheck' },
  { id: 'customers', label: 'Customers', labelAr: 'العملاء', href: '/customers', icon: 'Users' },
  { id: 'suppliers', label: 'Suppliers', labelAr: 'الموردين', href: '/suppliers', icon: 'Truck' },
  { id: 'products', label: 'Products', labelAr: 'المنتجات', href: '/products', icon: 'Package' },
  { id: 'variants', label: 'Variants', labelAr: 'المتغيرات', href: '/variants', icon: 'Layers' },
  { id: 'warehouse', label: 'Warehouse', labelAr: 'المستودع', href: '/warehouse', icon: 'Warehouse' },
  { id: 'purchase-orders', label: 'POs', labelAr: 'أوامر الشراء', href: '/purchase-orders', icon: 'ClipboardList' },
  { id: 'returns', label: 'Returns', labelAr: 'المرتجعات', href: '/returns', icon: 'RotateCcw' },
  { id: 'treasury', label: 'Treasury', labelAr: 'الخزينة', href: '/treasury', icon: 'Landmark' },
  { id: 'employees', label: 'Employees', labelAr: 'الموظفين', href: '/employees', icon: 'Briefcase' },
  { id: 'journal-entries', label: 'Journal', labelAr: 'القيود', href: '/journal-entries', icon: 'BookOpen' },
  { id: 'assets', label: 'Assets', labelAr: 'الأصول', href: '/assets', icon: 'Building2' },
  { id: 'categories', label: 'Categories', labelAr: 'التصنيفات', href: '/categories', icon: 'Tags' },
  { id: 'reports', label: 'Reports', labelAr: 'التقارير', href: '/reports', icon: 'BarChart3' },
  { id: 'settings', label: 'Settings', labelAr: 'الإعدادات', href: '/settings', icon: 'Settings' },
];

export const UNITS_OF_MEASURE = [
  { value: 'piece', label: 'Piece', labelAr: 'قطعة' },
  { value: 'set', label: 'Set', labelAr: 'طقم' },
  { value: 'box', label: 'Box', labelAr: 'صندوق' },
  { value: 'meter', label: 'Meter', labelAr: 'متر' },
  { value: 'liter', label: 'Liter', labelAr: 'لتر' },
  { value: 'kilogram', label: 'Kilogram', labelAr: 'كيلو جرام' },
  { value: 'gram', label: 'Gram', labelAr: 'جرام' },
  { value: 'pair', label: 'Pair', labelAr: 'زوج' },
  { value: 'dozen', label: 'Dozen', labelAr: 'دستة' },
];

export const ASSET_CATEGORIES = [
  { value: 'equipment', label: 'Equipment', labelAr: 'معدات' },
  { value: 'vehicle', label: 'Vehicle', labelAr: 'مركبة' },
  { value: 'computer', label: 'Computer', labelAr: 'حاسوب' },
  { value: 'furniture', label: 'Furniture', labelAr: 'أثاث' },
  { value: 'other', label: 'Other', labelAr: 'أخرى' },
];

export const LOW_STOCK_COLORS = {
  in_stock: 'text-green-600 dark:text-green-400',
  low_stock: 'text-amber-600 dark:text-amber-400',
  out_of_stock: 'text-red-600 dark:text-red-400',
};

export const MODULES = [
  'products', 'customers', 'suppliers', 'invoices', 'quotations',
  'purchaseOrders', 'returns', 'treasury', 'stock', 'employees',
  'assets', 'journalEntries', 'settings'
];
