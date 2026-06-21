import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'EGP', language: 'en' | 'ar' = 'en'): string {
  const formatted = amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (language === 'ar') {
    return `ج.م ${formatted}`;
  }
  return `${formatted} ${currency}`;
}

export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

export function formatDate(dateStr: string, language: 'en' | 'ar' = 'en'): string {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateFull(dateStr: string, language: 'en' | 'ar' = 'en'): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function generateNumber(prefix: string, existing: any[]): string {
  const count = existing.length + 1;
  return `${prefix}-${String(count).padStart(3, '0')}`;
}

export function calculateLineTotal(qty: number, price: number, discount: number, tax: number): number {
  const afterDiscount = (qty * price) * (1 - discount / 100);
  return afterDiscount * (1 + tax / 100);
}

export function calculateSubtotal(items: any[]): number {
  return items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
}

export function calculateTaxTotal(items: any[]): number {
  return items.reduce((sum: number, item: any) => {
    const lineTotal = item.quantity * item.unitPrice;
    const afterDiscount = lineTotal * (1 - (item.discountPercent || 0) / 100);
    return sum + (afterDiscount * (item.taxPercent || 0) / 100);
  }, 0);
}

export function calculateDiscountTotal(items: any[]): number {
  return items.reduce((sum: number, item: any) => {
    const lineTotal = item.quantity * item.unitPrice;
    return sum + (lineTotal * (item.discountPercent || 0) / 100);
  }, 0);
}

export function calculateGrandTotal(items: any[]): number {
  return calculateSubtotal(items) + calculateTaxTotal(items) - calculateDiscountTotal(items);
}

export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '...' : str;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    partially_paid: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    expired: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    converted: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    received: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    on_leave: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    terminated: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
}

export function getStatusTranslation(status: string, language: 'en' | 'ar'): string {
  const translations: Record<string, Record<string, string>> = {
    draft: { en: 'Draft', ar: 'مسودة' },
    sent: { en: 'Sent', ar: 'مرسل' },
    paid: { en: 'Paid', ar: 'مدفوع' },
    partially_paid: { en: 'Partially Paid', ar: 'مدفوع جزئياً' },
    overdue: { en: 'Overdue', ar: 'متأخر' },
    cancelled: { en: 'Cancelled', ar: 'ملغي' },
    accepted: { en: 'Accepted', ar: 'مقبول' },
    rejected: { en: 'Rejected', ar: 'مرفوض' },
    expired: { en: 'Expired', ar: 'منتهي' },
    converted: { en: 'Converted', ar: 'محول' },
    received: { en: 'Received', ar: 'مستلم' },
    active: { en: 'Active', ar: 'نشط' },
    on_leave: { en: 'On Leave', ar: 'في إجازة' },
    terminated: { en: 'Terminated', ar: 'منتهي' },
    partially_received: { en: 'Partially Received', ar: 'مستلم جزئياً' },
    partially_returned: { en: 'Partially Returned', ar: 'مسترجع جزئياً' },
    fully_returned: { en: 'Fully Returned', ar: 'مسترجع بالكامل' },
    out_for_delivery: { en: 'Out for Delivery', ar: 'في طريق التوصيل' },
    delivered: { en: 'Delivered', ar: 'تم التوصيل' },
    failed: { en: 'Failed', ar: 'فشل' },
    pending: { en: 'Pending', ar: 'قيد الانتظار' },
    pickup: { en: 'Pickup', ar: 'استلام' },
    internal: { en: 'Internal', ar: 'داخلي' },
    third_party: { en: 'Third Party', ar: 'خارجي' },
    good: { en: 'Good', ar: 'جيد' },
    bad: { en: 'Bad', ar: 'تالف' },
  };
  return translations[status]?.[language] || status;
}

export function downloadAsJson(data: any, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadAsCsv(data: any[], filename: string): void {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => {
      const val = row[h];
      if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(','))
  ].join('\n');
  
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function parseEasternArabicNumerals(str: string): string {
  const easternArabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const westernArabic = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  let result = str;
  easternArabic.forEach((e, i) => {
    result = result.replace(new RegExp(e, 'g'), westernArabic[i]);
  });
  return result;
}

export function cleanNumericInput(value: string): number {
  const cleaned = parseEasternArabicNumerals(value)
    .replace(/[^0-9.\-]/g, '')
    .trim();
  return parseFloat(cleaned) || 0;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
