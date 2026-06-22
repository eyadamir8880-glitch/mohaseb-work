'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { useLanguage } from '@/providers/language-provider';
import { useAppStore } from '@/stores/use-app-store';
import { formatCurrency, generateId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { readFileAsArrayBuffer } from '@/lib/utils';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';

export default function ExternalPurchasesPage() {
  const { language, t } = useLanguage();
  const store = useAppStore();
  const { externalPurchases, products } = store;
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; warnings: string[] } | null>(null);

  const brands = useMemo(() => {
    const set = new Set(externalPurchases.map(p => p.brand).filter(Boolean));
    return Array.from(set).sort();
  }, [externalPurchases]);

  const filtered = useMemo(() => {
    let result = [...externalPurchases];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(p =>
        p.nameAr.toLowerCase().includes(s) ||
        p.partNum.toLowerCase().includes(s) ||
        p.brand.toLowerCase().includes(s) ||
        p.description.toLowerCase().includes(s)
      );
    }
    if (brandFilter) result = result.filter(p => p.brand === brandFilter);
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [externalPurchases, search, brandFilter]);

  const stats = useMemo(() => {
    const totalItems = externalPurchases.reduce((s, p) => s + p.quantity, 0);
    const totalCost = externalPurchases.reduce((s, p) => s + p.totalCostPrice, 0);
    const matchedCount = externalPurchases.filter(p => p.productId).length;
    return { totalImports: externalPurchases.length, totalItems, totalCost, matchedCount };
  }, [externalPurchases]);

  const columns = [
    { key: 'no', header: 'NO', render: (item: any) => <span className="font-mono text-xs">{item.no}</span> },
    { key: 'photo', header: 'PHOTO', render: (item: any) => (
      item.photo ? <img src={item.photo} alt="" className="h-8 w-8 rounded object-cover" /> : <span className="text-xs text-slate-400">—</span>
    )},
    { key: 'note', header: t('externalPurchases.note'), render: (item: any) => (
      <span className="text-xs text-slate-500 max-w-[100px] truncate block" title={item.note}>{item.note || '—'}</span>
    )},
    { key: 'nameAr', header: 'AR NAME', render: (item: any) => (
      <span className="text-sm font-medium">{item.nameAr}</span>
    )},
    { key: 'partNum', header: 'Part.Num', render: (item: any) => (
      <span className="font-mono text-xs text-blue-600 font-medium">{item.partNum}</span>
    )},
    { key: 'description', header: 'DISCRIPTION', render: (item: any) => (
      <span className="text-xs text-slate-500 max-w-[120px] truncate block" title={item.description}>{item.description || '—'}</span>
    )},
    { key: 'brand', header: 'BRAND', render: (item: any) => <span className="text-xs">{item.brand || '—'}</span> },
    { key: 'unit', header: 'Unit', render: (item: any) => <span className="text-xs">{item.unit || '—'}</span> },
    { key: 'quantity', header: 'QTY', render: (item: any) => <span className="font-mono text-sm text-right block">{item.quantity}</span>, sortable: true },
    { key: 'costPrice', header: 'C price', render: (item: any) => <span className="font-mono text-xs text-right block">{formatCurrency(item.costPrice, 'EGP', language)}</span> },
    { key: 'totalCostPrice', header: 'Total CP', render: (item: any) => <span className="font-mono text-xs text-right block">{formatCurrency(item.totalCostPrice, 'EGP', language)}</span>, sortable: true },
    { key: 'itemNo', header: 'ITEM NO.', render: (item: any) => <span className="font-mono text-xs">{item.itemNo || '—'}</span> },
    { key: 'weight', header: 'weght', render: (item: any) => <span className="font-mono text-xs text-right block">{item.weight || '—'}</span> },
    { key: 'totalWeight', header: 'T.W', render: (item: any) => <span className="font-mono text-xs text-right block">{item.totalWeight || '—'}</span> },
    { key: 'sellPrice', header: 'B PRICE', render: (item: any) => <span className="font-mono text-xs text-right block">{formatCurrency(item.sellPrice, 'EGP', language)}</span> },
    { key: 'totalSellPrice', header: 'TOTAL BP', render: (item: any) => <span className="font-mono text-xs text-right block">{formatCurrency(item.totalSellPrice, 'EGP', language)}</span>, sortable: true },
    { key: 'status', header: t('externalPurchases.status'), render: (item: any) => (
      item.productId
        ? <span className="badge badge-green text-xs">{t('externalPurchases.matched', { qty: item.quantity })}</span>
        : <span className="badge badge-yellow text-xs">{t('externalPurchases.skipped')}</span>
    )},
    { key: 'actions', header: t('app.actions'), render: (item: any) => (
      <button className="btn-ghost btn-sm p-1 text-red-600" onClick={() => {
        if (confirm(t('externalPurchases.deleteConfirm'))) store.deleteExternalPurchase(item.id);
      }}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('externalPurchases.title')}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            const ws = XLSX.utils.json_to_sheet(filtered.map(p => ({
              NO: p.no,
              PHOTO: p.photo,
              note: p.note,
              'AR NAME': p.nameAr,
              'Part.Num': p.partNum,
              DISCRIPTION: p.description,
              BRAND: p.brand,
              Unit: p.unit,
              QTY: p.quantity,
              'C price': p.costPrice,
              'Total CP': p.totalCostPrice,
              'ITEM NO.': p.itemNo,
              weght: p.weight,
              'T.W': p.totalWeight,
              'B PRICE': p.sellPrice,
              'TOTAL BP': p.totalSellPrice,
            })));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'External Purchases');
            XLSX.writeFile(wb, 'external-purchases.xlsx');
          }} className="gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            {t('externalPurchases.export')}
          </Button>
          <Button onClick={() => setShowImportModal(true)} className="gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            {t('externalPurchases.importExcel')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-slate-500">{t('externalPurchases.totalImports')}</p>
          <p className="text-2xl font-bold mt-1">{stats.totalImports}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500">{t('externalPurchases.itemsImported')}</p>
          <p className="text-2xl font-bold mt-1">{stats.totalItems}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500">{t('externalPurchases.totalCost')}</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalCost, 'EGP', language)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500">{t('externalPurchases.stockAdded')}</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{stats.matchedCount} / {stats.totalImports}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Input placeholder={t('externalPurchases.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <select className="input max-w-[160px]" value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
          <option value="">{t('externalPurchases.allBrands')}</option>
          {brands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <DataTable columns={columns as any} data={filtered} emptyMessage={t('externalPurchases.noImports')} />

      {showImportModal && (
        <ImportModal
          language={language}
          t={t}
          store={store}
          products={products}
          onClose={() => setShowImportModal(false)}
          onResult={(result) => {
            setImportResult(result);
            setShowImportModal(false);
          }}
        />
      )}

      {importResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setImportResult(null)} />
          <div className="relative bg-background rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold mb-2">{t('externalPurchases.importComplete')}</h2>
            <div className="space-y-2 mt-4">
              <p className="text-sm text-green-600">{t('externalPurchases.importedCount', { count: importResult.imported })}</p>
              {importResult.skipped > 0 && <p className="text-sm text-amber-600">{t('externalPurchases.skippedCount', { count: importResult.skipped })}</p>}
              {importResult.warnings.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto">
                  {importResult.warnings.map((w, i) => <p key={i} className="text-xs text-slate-500">• {w}</p>)}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setImportResult(null)}>{t('app.close')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ImportModal({ language, t, store, products, onClose, onResult }: {
  language: 'en' | 'ar';
  t: any;
  store: any;
  products: any[];
  onClose: () => void;
  onResult: (result: { imported: number; skipped: number; warnings: string[] }) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    const buffer = await readFileAsArrayBuffer(f);
    const zip = await JSZip.loadAsync(buffer);

    const photos: string[] = [];
    const mediaFolder = zip.folder('xl/media');
    if (mediaFolder) {
      const mediaFiles = Object.keys(mediaFolder.files).sort();
      for (const path of mediaFiles) {
        const entry = mediaFolder.files[path];
        if (!entry.dir) {
          const blob = await entry.async('blob');
          const url = URL.createObjectURL(blob);
          photos.push(url);
        }
      }
    }

    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    const mapped = rows.map((row: any, idx: number) => ({
      no: row['NO'] || idx + 1,
      photo: photos[idx] || '',
      note: String(row['note'] || row['Note'] || row['NOTE'] || ''),
      nameAr: String(row['AR NAME'] || row['AR_NAME'] || row['ArName'] || row['name_ar'] || ''),
      partNum: String(row['Part.Num'] || row['PartNum'] || row['PART_NUM'] || row['part_num'] || ''),
      description: String(row['DISCRIPTION'] || row['Description'] || row['DESCRIPTION'] || ''),
      brand: String(row['BRAND'] || row['Brand'] || ''),
      unit: String(row['Unit'] || row['UNIT'] || ''),
      quantity: parseFloat(String(row['QTY'] || row['Qty'] || row['qty'] || 0)) || 0,
      costPrice: parseFloat(String(row['C price'] || row['C_price'] || row['cPrice'] || row['cost_price'] || 0)) || 0,
      totalCostPrice: parseFloat(String(row['Total CP'] || row['Total_CP'] || row['totalCP'] || row['total_cost_price'] || 0)) || 0,
      itemNo: String(row['ITEM NO.'] || row['ITEM_NO'] || row['ItemNo'] || row['item_no'] || ''),
      weight: parseFloat(String(row['weght'] || row['Weight'] || row['WEIGHT'] || row['weight'] || 0)) || 0,
      totalWeight: parseFloat(String(row['T.W'] || row['TW'] || row['T_W'] || row['totalWeight'] || row['total_weight'] || 0)) || 0,
      sellPrice: parseFloat(String(row['B PRICE'] || row['B_PRICE'] || row['bPrice'] || row['sell_price'] || 0)) || 0,
      totalSellPrice: parseFloat(String(row['TOTAL BP'] || row['TOTAL_BP'] || row['totalBP'] || row['total_sell_price'] || 0)) || 0,
    }));

    const withMatch = mapped.map((item: any) => {
      const match = products.find((p: any) => p.sku === item.partNum);
      return { ...item, matched: !!match, productId: match?.id || null, productName: match?.name || null };
    });

    setPreview(withMatch);
  }, [products]);

  const handleImport = async () => {
    if (!preview) return;
    setProcessing(true);

    let imported = 0;
    let skipped = 0;
    const warnings: string[] = [];

    for (const item of preview) {
      if (!item.partNum) { skipped++; continue; }

      const matchedProduct = item.matched ? products.find((p: any) => p.sku === item.partNum) : null;

      if (matchedProduct) {
        store.updateProduct(matchedProduct.id, { stock: matchedProduct.stock + item.quantity });
      } else {
        warnings.push(`${language === 'ar' ? 'لم يتم العثور على منتج' : 'Product not found'}: ${item.partNum}`);
        skipped++;
        continue;
      }

      const photoUrl = item.photo || '';

      const supabase = (await import('@/lib/supabase')).getSupabase();
      let storedPhoto = '';
      if (photoUrl && photoUrl.startsWith('blob:')) {
        try {
          const blobRes = await fetch(photoUrl);
          const blob = await blobRes.blob();
          const fileName = `external-purchases/${generateId()}_${item.partNum}.png`;
          const { data: uploadData } = await supabase.storage.from('uploads').upload(fileName, blob);
          if (uploadData) {
            const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);
            storedPhoto = publicUrl;
          }
        } catch {}
      }

      store.addExternalPurchase({
        no: item.no, photo: storedPhoto, note: item.note,
        nameAr: item.nameAr, partNum: item.partNum, description: item.description,
        brand: item.brand, unit: item.unit, quantity: item.quantity,
        costPrice: item.costPrice, totalCostPrice: item.totalCostPrice,
        itemNo: item.itemNo, weight: item.weight, totalWeight: item.totalWeight,
        sellPrice: item.sellPrice, totalSellPrice: item.totalSellPrice,
        productId: matchedProduct.id, importSessionId: null,
      });

      imported++;
    }

    store.addImportSession({
      id: generateId(), filename: file?.name || '', uploadedAt: new Date().toISOString(),
      totalRows: preview.length, importedCount: imported, updatedCount: 0,
      skippedCount: skipped, errorCount: 0, errorReport: warnings.join('\n'),
    });

    setProcessing(false);
    onResult({ imported, skipped, warnings });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-background rounded-lg shadow-xl w-full max-w-3xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{t('externalPurchases.importTitle')}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">&times;</button>
        </div>

        {!file && (
          <div
            className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <svg className="w-12 h-12 mx-auto text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
            </svg>
            <p className="text-sm text-slate-600">{t('externalPurchases.dragDrop')}</p>
            <p className="text-xs text-slate-400 mt-1">{t('externalPurchases.supportedFormats')}</p>
            <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>
        )}

        {preview && (
          <>
            <div className="mt-4 mb-3">
              <h3 className="text-sm font-semibold mb-2">{t('externalPurchases.preview')} ({preview.length} rows)</h3>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-2 text-left">Part.Num</th>
                      <th className="p-2 text-left">AR NAME</th>
                      <th className="p-2 text-left">BRAND</th>
                      <th className="p-2 text-right">QTY</th>
                      <th className="p-2 text-right">C price</th>
                      <th className="p-2 text-right">Total CP</th>
                      <th className="p-2 text-right">B PRICE</th>
                      <th className="p-2 text-right">Total BP</th>
                      <th className="p-2 text-left">{t('externalPurchases.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 5).map((item, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2 font-mono text-blue-600">{item.partNum}</td>
                        <td className="p-2">{item.nameAr}</td>
                        <td className="p-2">{item.brand}</td>
                        <td className="p-2 text-right font-mono">{item.quantity}</td>
                        <td className="p-2 text-right font-mono">{item.costPrice}</td>
                        <td className="p-2 text-right font-mono">{item.totalCostPrice}</td>
                        <td className="p-2 text-right font-mono">{item.sellPrice}</td>
                        <td className="p-2 text-right font-mono">{item.totalSellPrice}</td>
                        <td className="p-2">
                          {item.matched
                            ? <span className="badge badge-green">{t('externalPurchases.matched', { qty: item.quantity })}</span>
                            : <span className="badge badge-yellow">{t('externalPurchases.skipped')}</span>
                          }
                        </td>
                      </tr>
                    ))}
                    {preview.length > 5 && (
                      <tr className="border-t text-slate-400">
                        <td colSpan={9} className="p-2 text-center text-xs">... {language === 'ar' ? 'و' : 'and'} {preview.length - 5} {language === 'ar' ? 'أخرى' : 'more'}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { setFile(null); setPreview(null); }} disabled={processing}>{t('app.cancel')}</Button>
              <Button onClick={handleImport} disabled={processing}>
                {processing ? t('import.processing') : t('externalPurchases.importItems', { count: preview.length })}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
