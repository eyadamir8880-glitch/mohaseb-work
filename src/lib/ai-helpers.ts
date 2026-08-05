'use client';

import type { AIAttachment, AIContext } from './ai-types';

const MAX_IMAGE_EDGE = 1200;
const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;

export function buildAIContext(store: any, language: 'en' | 'ar'): AIContext {
  const settings: Record<string, string> = {};
  for (const s of store.settings || []) settings[s.key] = s.value;

  const customers = (store.customers || []).slice(0, 2000).map((c: any) => ({
    id: c.id, name: c.name || '', nameAr: c.nameAr || '', phone: c.phone || '', totalDue: c.totalDue || 0,
  }));

  const products = (store.products || []).slice(0, 3000).map((p: any) => ({
    id: p.id, name: p.name || '', nameAr: p.nameAr || '', sku: p.sku || '',
    sellingPrice: p.sellingPrice || 0, stock: p.stock || 0, unitOfMeasure: p.unitOfMeasure || '',
  }));

  const recentInvoices = [...(store.invoices || [])]
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 60)
    .map((i: any) => {
      const cust = (store.customers || []).find((c: any) => c.id === i.customerId);
      return {
        number: i.invoiceNumber || '', customerName: cust ? cust.name || cust.nameAr : '',
        grandTotal: i.grandTotal || 0, paidAmount: i.paidAmount || 0,
        status: i.status || '', issueDate: i.issueDate || '',
      };
    });

  return {
    language,
    settings: { companyName: settings.companyName || '', currency: settings.defaultCurrency || 'EGP' },
    customers, products, recentInvoices,
  };
}

function fileToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error || new Error('read failed'));
    reader.readAsDataURL(blob);
  });
}

async function compressImage(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('image load failed'));
      image.src = url;
    });
    let { width, height } = img;
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(width, height));
    width = Math.round(width * scale);
    height = Math.round(height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('compress failed'))), 'image/jpeg', 0.82);
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

const XLSX_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

async function parseSpreadsheet(file: File): Promise<string> {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const lines: string[] = [];
  for (const sheetName of workbook.SheetNames.slice(0, 5)) {
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any;
    if (rows.length === 0) continue;
    lines.push(`[Sheet: ${sheetName}]`);
    for (const row of rows.slice(0, 500)) {
      lines.push(String(row).replace(/\t/g, ' | '));
    }
  }
  return lines.join('\n');
}

export async function readAttachment(file: File): Promise<AIAttachment> {
  const name = file.name || 'attachment';
  const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
  const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(name);

  if (XLSX_EXTENSIONS.includes(ext)) {
    const text = await parseSpreadsheet(file);
    return { id: crypto.randomUUID(), name, mimeType: 'text/csv', text, size: file.size };
  }

  if (file.type.startsWith('text/') || ext === '.txt') {
    return { id: crypto.randomUUID(), name, mimeType: file.type || 'text/plain', text: await file.text(), size: file.size };
  }

  const raw = isImage ? await compressImage(file) : file;
  if (raw.size > MAX_ATTACHMENT_BYTES) {
    throw new Error(`File "${name}" is too large (max 4MB).`);
  }
  const data = await fileToBase64(raw);
  const previewUrl = isImage ? `data:image/jpeg;base64,${data}` : undefined;
  return { id: crypto.randomUUID(), name, mimeType: isImage ? 'image/jpeg' : file.type || 'application/octet-stream', data, previewUrl, size: raw.size };
}
