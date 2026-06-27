export type Language = 'en' | 'ar';
export type Theme = 'light' | 'dark';

export interface Customer {
  id: string;
  name: string;
  nameAr?: string;
  phone: string;
  email: string;
  address: string;
  taxNumber: string;
  creditLimit: number;
  totalInvoiced: number;
  totalPaid: number;
  totalDue: number;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  nameAr?: string;
  sku: string;
  barcode: string;
  description: string;
  descriptionAr?: string;
  categoryId: string;
  unitOfMeasure: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  trackInventory: boolean;
  lowStockThreshold: number;
  imageUrl: string;
  hasVariants: boolean;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  productNameAr?: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  lineTotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  items: InvoiceItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  paidAmount: number;
  status: string;
  issueDate: string;
  dueDate: string;
  notes: string;
  payments: any[];
  createdAt: string;
}
