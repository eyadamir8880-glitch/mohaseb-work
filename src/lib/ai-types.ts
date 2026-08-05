export type AIMode = 'chat' | 'invoice';

export interface AIAttachment {
  id: string;
  name: string;
  mimeType: string;
  data?: string;
  text?: string;
  previewUrl?: string;
  size: number;
}

export interface InvoiceDraftItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
}

export interface InvoiceDraft {
  customerName?: string;
  notes?: string;
  items: InvoiceDraftItem[];
}

export interface NewCustomerDraft {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface NewProductDraft {
  name: string;
  nameAr?: string;
  sellingPrice?: number;
  sku?: string;
  unitOfMeasure?: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  attachments?: AIAttachment[];
  draft?: InvoiceDraft | null;
  newCustomers?: NewCustomerDraft[];
  newProducts?: NewProductDraft[];
  pending?: boolean;
  error?: boolean;
}

export interface AIServerResponse {
  reply: string;
  draft?: InvoiceDraft | null;
  newCustomers?: NewCustomerDraft[];
  newProducts?: NewProductDraft[];
}

export interface AIContext {
  language: string;
  settings: { companyName: string; currency: string };
  customers: { id: string; name: string; nameAr: string; phone: string; totalDue: number }[];
  products: { id: string; name: string; nameAr: string; sku: string; sellingPrice: number; stock: number; unitOfMeasure: string }[];
  recentInvoices: { number: string; customerName: string; grandTotal: number; paidAmount: number; status: string; issueDate: string }[];
}
