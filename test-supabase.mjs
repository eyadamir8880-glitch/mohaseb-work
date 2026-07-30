import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();

console.log('URL:', url);
console.log('Key:', key ? key.substring(0, 20) + '...' : 'MISSING');

const supabase = createClient(url, key);

// Test 1: minimal product
const testProduct = {
  id: crypto.randomUUID(),
  name: 'Test Product',
  name_ar: '',
  sku: 'TEST-001',
  alternate_skus: [],
  barcode: '',
  description: '',
  description_ar: '',
  category_id: null,
  unit_of_measure: '',
  base_unit: '',
  conversion_rate: 1,
  purchase_price: 0,
  selling_price: 100,
  stock: 0,
  track_inventory: true,
  low_stock_threshold: 0,
  reorder_point: 0,
  image_url: '',
  has_variants: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

console.log('\n=== Test 1: Minimal product upsert ===');
const { data, error } = await supabase.from('products').upsert(testProduct, { onConflict: 'id' }).select().single();
if (error) {
  console.error('ERROR:', JSON.stringify(error, null, 2));
} else {
  console.log('SUCCESS:', data.name);
}

// Test 2: product with all fields that camelToSnake would produce
const testProduct2 = {
  id: crypto.randomUUID(),
  name: 'Test Product 2',
  name_ar: 'منتج تجريبي',
  sku: 'TEST-002',
  alternate_skus: ['ALT-001'],
  barcode: '123456789',
  description: 'A test product',
  description_ar: 'منتج تجريبي',
  category_id: null,
  unit_of_measure: 'piece',
  base_unit: 'piece',
  conversion_rate: 1,
  purchase_price: 50,
  selling_price: 100,
  stock: 25,
  track_inventory: true,
  low_stock_threshold: 5,
  reorder_point: 10,
  image_url: '',
  has_variants: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

console.log('\n=== Test 2: Full product upsert ===');
const { data: d2, error: e2 } = await supabase.from('products').upsert(testProduct2, { onConflict: 'id' }).select().single();
if (e2) {
  console.error('ERROR:', JSON.stringify(e2, null, 2));
} else {
  console.log('SUCCESS:', d2.name);
}

// Test 3: product with extra unknown field (like what the app might send)
const testProduct3 = {
  id: crypto.randomUUID(),
  name: 'Test Product 3',
  name_ar: '',
  sku: 'TEST-003',
  alternate_skus: [],
  barcode: '',
  description: '',
  description_ar: '',
  category_id: null,
  unit_of_measure: '',
  base_unit: '',
  conversion_rate: 1,
  purchase_price: 0,
  selling_price: 100,
  stock: 0,
  track_inventory: true,
  low_stock_threshold: 0,
  reorder_point: 0,
  image_url: '',
  has_variants: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  custom_field_that_doesnt_exist: 'test',
  items: [],
};

console.log('\n=== Test 3: Product with extra fields ===');
const { data: d3, error: e3 } = await supabase.from('products').upsert(testProduct3, { onConflict: 'id' }).select().single();
if (e3) {
  console.error('ERROR:', JSON.stringify(e3, null, 2));
} else {
  console.log('SUCCESS:', d3.name);
}

// Cleanup
await supabase.from('products').delete().in('sku', ['TEST-001', 'TEST-002', 'TEST-003']);
console.log('\nCleaned up test products');
