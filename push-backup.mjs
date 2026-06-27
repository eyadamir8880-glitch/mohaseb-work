import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';

const envFile = readFileSync('.env.local', 'utf-8');
const env = Object.fromEntries(envFile.split('\n').filter(l => l.trim() && !l.startsWith('#')).map(l => l.split('=').map(s => s.trim())));
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const headers = { 'Content-Type': 'application/json', 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + ANON_KEY, 'Prefer': 'resolution=merge-duplicates' };

const filePath = process.argv[2];
if (!filePath) { console.log('Usage: node push-backup.mjs <path-to-backup.json>'); process.exit(1); }

const backup = JSON.parse(readFileSync(filePath, 'utf-8'));

function cleanRecord(rec) {
  if (rec === null || rec === undefined) return rec;
  if (Array.isArray(rec)) return rec.map(cleanRecord);
  if (typeof rec !== 'object' || rec instanceof Date) return rec;
  const result = {};
  for (let [key, value] of Object.entries(rec)) {
    const snakeKey = key.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
    if (snakeKey === 'custom_pricing_rules') continue;
    if ((snakeKey.endsWith('_id') || snakeKey === 'category_id') && value === '') value = null;
    result[snakeKey] = cleanRecord(value);
  }
  return result;
}

async function post(table, records) {
  if (!records || records.length === 0) return;
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/' + table, {
      method: 'POST', headers, body: JSON.stringify(records),
    });
    if (r.ok) {
      console.log(`OK ${table}: ${records.length} records`);
    } else {
      const body = await r.text();
      console.log(`FAIL ${table} (${r.status}): ${body.slice(0, 300)}`);
    }
  } catch (e) {
    console.log(`ERROR ${table}: ${e.message}`);
  }
}

async function del(table) {
  try {
    await fetch(SUPABASE_URL + '/rest/v1/' + table, { method: 'DELETE', headers });
  } catch {}
}

const TABLES = [
  'invoice_payments', 'invoice_items', 'invoices', 'products', 'customers',
  'payment_methods', 'categories',
];

async function push() {
  // Clear tables in reverse dependency order
  for (const t of [...TABLES].reverse()) await del(t);

  // 1. Default category
  const defaultCategoryId = '00000000-0000-4000-8000-000000000001';
  await post('categories', [{ id: defaultCategoryId, name: 'General', name_ar: 'عام', type: 'product' }]);

  // 2. Payment methods
  if (backup.paymentMethods?.length) {
    const pmRecords = backup.paymentMethods.map(pm => ({
      id: randomUUID(), name: pm.name, name_ar: pm.nameAr || '', type: pm.type,
      is_active: pm.isActive ?? true, is_protected: pm.isProtected ?? false, sort_order: pm.sortOrder ?? 0,
    }));
    await post('payment_methods', pmRecords);
  }

  // 3. Customers
  if (backup.customers?.length) {
    await post('customers', backup.customers.map(c => cleanRecord(c)));
  }

  // 4. Products - assign default category, create stubs for missing products referenced in invoices
  const existingProductIds = new Set((backup.products || []).map(p => p.id));
  const referencedProductIds = new Set();
  for (const inv of (backup.invoices || [])) {
    for (const item of (inv.items || [])) {
      if (!existingProductIds.has(item.productId)) referencedProductIds.add(item.productId);
    }
  }
  const allProducts = [];
  const productTemplate = { id: '', name: '', nameAr: '', sku: '', alternateSkus: [], barcode: '', description: '', descriptionAr: '', categoryId: defaultCategoryId, unitOfMeasure: '', baseUnit: '', conversionRate: 1, purchasePrice: 0, sellingPrice: 0, stock: 0, trackInventory: true, lowStockThreshold: 0, reorderPoint: 0, imageUrl: '', hasVariants: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  for (const p of (backup.products || [])) {
    allProducts.push({ ...productTemplate, ...p, categoryId: defaultCategoryId });
  }
  for (const pid of referencedProductIds) {
    const inv = (backup.invoices || []).find(i => i.items?.some(item => item.productId === pid));
    const item = inv?.items?.find(item => item.productId === pid);
    allProducts.push({ ...productTemplate, id: pid, name: item?.productName || 'Unknown', sellingPrice: item?.unitPrice || 0 });
  }
  if (allProducts.length) {
    await post('products', allProducts.map(p => cleanRecord(p)));
  }

  // 5. Invoices
  if (backup.invoices?.length) {
    const invoiceRecords = backup.invoices.map(inv => {
      const { items, payments, ...rest } = inv;
      return rest;
    });
    await post('invoices', invoiceRecords.map(r => cleanRecord(r)));

    // 6. Invoice items
    const allItems = [];
    for (const inv of backup.invoices) {
      if (inv.items) {
        for (const item of inv.items) {
          allItems.push({ ...item, invoice_id: inv.id });
        }
      }
    }
    if (allItems.length) await post('invoice_items', allItems.map(r => cleanRecord(r)));

    // 7. Invoice payments
    const allPayments = [];
    for (const inv of backup.invoices) {
      if (inv.payments) {
        for (const pmt of inv.payments) {
          allPayments.push({ ...pmt, invoice_id: inv.id });
        }
      }
    }
    if (allPayments.length) await post('invoice_payments', allPayments.map(r => cleanRecord(r)));
  }

  console.log('Done');
}

push();
