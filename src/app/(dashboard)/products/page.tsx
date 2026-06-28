'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/providers/language-provider';
import { useAppStore } from '@/stores/use-app-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, generateId, readFileAsArrayBuffer } from '@/lib/utils';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, Upload } from 'lucide-react';
import type { Product } from '@/lib/types';

export default function ProductsPage() {
  const { language, t } = useLanguage();
  const store = useAppStore();
  const products = store.products;
  const productCategories = store.categories.filter(c => c.type === 'product');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [importing, setImporting] = useState(false);
  const [parsedRows, setParsedRows] = useState<{
    sku: string; name: string; price: number; valid: boolean; reason: string; selected: boolean; rowIndex: number;
  }[]>([]);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [form, setForm] = useState({
    name: '', nameAr: '', sku: '', barcode: '', description: '',
    categoryId: '', purchasePrice: 0, sellingPrice: 0, stock: 0,
    trackInventory: true, lowStockThreshold: 0, unitOfMeasure: 'piece',
  });

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      const matchCat = catFilter === 'all' || p.categoryId === catFilter;
      return matchSearch && matchCat;
    });
  }, [products, search, catFilter]);

  const resetForm = () => setForm({
    name: '', nameAr: '', sku: '', barcode: '', description: '',
    categoryId: '', purchasePrice: 0, sellingPrice: 0, stock: 0,
    trackInventory: true, lowStockThreshold: 0, unitOfMeasure: 'piece',
  });

  const getCategoryName = (catId: string) => {
    return productCategories.find((c) => c.id === catId)?.name || '-';
  };

  const openAdd = () => {
    resetForm();
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setForm({
      name: p.name,
      nameAr: p.nameAr || '',
      sku: p.sku,
      barcode: p.barcode,
      description: p.description,
      categoryId: p.categoryId,
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
      stock: p.stock,
      trackInventory: p.trackInventory,
      lowStockThreshold: p.lowStockThreshold,
      unitOfMeasure: p.unitOfMeasure || 'piece',
    });
    setEditingId(p.id);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name || !form.sku) return;
    if (editingId) {
      store.updateProduct(editingId, {
        name: form.name, nameAr: form.nameAr, sku: form.sku, barcode: form.barcode,
        description: form.description, categoryId: form.categoryId,
        purchasePrice: form.purchasePrice, sellingPrice: form.sellingPrice,
        trackInventory: form.trackInventory,
        stock: form.stock, lowStockThreshold: form.lowStockThreshold,
        unitOfMeasure: form.unitOfMeasure,
      });
    } else {
      store.addProduct({
        name: form.name, nameAr: form.nameAr, sku: form.sku, barcode: form.barcode,
        description: form.description, descriptionAr: '',
        categoryId: form.categoryId,
        purchasePrice: form.purchasePrice, sellingPrice: form.sellingPrice,
        unitOfMeasure: form.unitOfMeasure, baseUnit: form.unitOfMeasure,
        conversionRate: 1, trackInventory: form.trackInventory,
        stock: form.stock, lowStockThreshold: form.lowStockThreshold, reorderPoint: 0,
        imageUrl: '', hasVariants: false, alternateSkus: [],
      });
    }
    setShowModal(false);
    resetForm();
    setEditingId(null);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    store.deleteProduct(deleteId);
    setDeleteId(null);
  };

  const handleDeleteAll = () => {
    store.clearModuleData('products');
    setShowDeleteAll(false);
  };

  const getCol = (row: any, ...keys: string[]) => {
    const rowKeys = Object.keys(row);
    for (const k of keys) {
      const match = rowKeys.find(rk => rk.toLowerCase() === k.toLowerCase());
      if (match && row[match]) return String(row[match]).trim();
    }
    return '';
  };

  const parseFile = async (file: File) => {
    setImporting(true);
    setImportStep('upload');
    try {
      const XLSX = await import('xlsx');
      const buffer = await readFileAsArrayBuffer(file);
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);
      const existingSkus = new Set(products.map(p => p.sku.toLowerCase()));
      const parsed = rows.map((row, i) => {
        const sku = getCol(row, 'product number', 'product_number', 'sku', 'productNumber', 'item number', 'item_number');
        const name = getCol(row, 'name', 'product name', 'product_name', 'productName');
        const rawPrice = getCol(row, 'selling price', 'selling_price', 'sellingPrice', 'price', 'unit price', 'unit_price').replace(/[^0-9.]/g, '');
        const price = parseFloat(rawPrice) || 0;
        let valid = true;
        let reason = '';
        if (!sku) { valid = false; reason = t('import.missingSku'); }
        else if (!name) { valid = false; reason = t('import.missingName'); }
        else if (!rawPrice) { valid = false; reason = t('import.missingPrice'); }
        else if (existingSkus.has(sku.toLowerCase())) { valid = false; reason = t('import.duplicateSku'); }
        return { sku, name, price, valid, reason, selected: valid, rowIndex: i };
      });
      setParsedRows(parsed);
      setImportStep('preview');
    } catch (e: any) {
      setImportResult({ imported: 0, skipped: 0, errors: [e.message] });
      setImportStep('result');
    } finally {
      setImporting(false);
    }
  };

  const toggleRow = (index: number) => {
    setParsedRows(prev => prev.map((r, i) => i === index ? { ...r, selected: !r.selected } : r));
  };

  const toggleSelectAll = () => {
    const allSelected = parsedRows.every(r => r.selected || !r.valid);
    setParsedRows(prev => prev.map(r => r.valid ? { ...r, selected: !allSelected } : r));
  };

  const executeImport = () => {
    const selected = parsedRows.filter(r => r.selected);
    if (selected.length === 0) return;
    if (selected.length > 50) {
      store.bulkAddProducts(selected.map(row => ({
        name: row.name, nameAr: '', sku: row.sku, barcode: '', description: '', descriptionAr: '',
        categoryId: '', purchasePrice: 0, sellingPrice: row.price,
        unitOfMeasure: 'piece', baseUnit: 'piece', conversionRate: 1,
        trackInventory: true, stock: 0, lowStockThreshold: 0, reorderPoint: 0,
        imageUrl: '', hasVariants: false, alternateSkus: [],
      })));
      setImportResult({ imported: selected.length, skipped: parsedRows.length - selected.length, errors: [] });
      setImportStep('result');
      return;
    }
    for (const row of selected) {
      try {
        store.addProduct({
          name: row.name, nameAr: '', sku: row.sku, barcode: '', description: '', descriptionAr: '',
          categoryId: '', purchasePrice: 0, sellingPrice: row.price,
          unitOfMeasure: 'piece', baseUnit: 'piece', conversionRate: 1,
          trackInventory: true, stock: 0, lowStockThreshold: 0, reorderPoint: 0,
          imageUrl: '', hasVariants: false, alternateSkus: [],
        });
      } catch (e: any) {
        setImportResult({ imported: 0, skipped: 0, errors: [`${row.sku}: ${e.message}`] });
        setImportStep('result');
        return;
      }
    }
    setImportResult({ imported: selected.length, skipped: parsedRows.length - selected.length, errors: [] });
    setImportStep('result');
  };

  const getStockColor = (p: Product) => {
    if (!p.trackInventory) return '';
    if (p.stock <= 0) return 'text-red-600 dark:text-red-400';
    if (p.stock <= p.lowStockThreshold) return 'text-amber-600 dark:text-amber-400';
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">{t('products.title')}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImport(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            {t('import.title')}
          </Button>
          <Button variant="outline" onClick={() => setShowDeleteAll(true)} className="gap-2 text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950">
            <Trash2 className="h-4 w-4" />
            {t('app.deleteAll')}
          </Button>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('products.newProduct')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('app.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="input w-48"
        >
          <option value="all">{t('app.all')}</option>
          {productCategories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3">{t('products.name')}</th>
                  <th className="text-left p-3">SKU</th>
                  <th className="text-left p-3">{t('app.category')}</th>
                  <th className="text-right p-3">{t('products.purchasePrice')}</th>
                  <th className="text-right p-3">{t('products.sellingPrice')}</th>
                  <th className="text-center p-3">{t('products.currentStock')}</th>
                  <th className="text-center p-3">{t('app.status')}</th>
                  <th className="text-center p-3">{t('app.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3 text-muted-foreground font-mono text-xs">{p.sku}</td>
                    <td className="p-3 text-muted-foreground">{getCategoryName(p.categoryId)}</td>
                    <td className="p-3 text-right">{formatCurrency(p.purchasePrice, 'EGP', language)}</td>
                    <td className="p-3 text-right font-medium">{formatCurrency(p.sellingPrice, 'EGP', language)}</td>
                    <td className="p-3 text-center">
                      {p.trackInventory ? (
                        <span className={`inline-flex items-center gap-1 font-semibold ${getStockColor(p)}`}>
                          {p.stock <= p.lowStockThreshold && (
                            <AlertTriangle className="h-3.5 w-3.5" />
                          )}
                          {p.stock}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {p.trackInventory && p.stock <= p.lowStockThreshold ? (
                        <Badge variant="yellow">{t('products.lowStock')}</Badge>
                      ) : p.trackInventory && p.stock <= 0 ? (
                        <Badge variant="red">Out</Badge>
                      ) : (
                        <Badge variant="green">Active</Badge>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-background rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editingId ? t('products.editProduct') : t('products.newProduct')}
              </h2>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-1 text-muted-foreground hover:text-foreground">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">{t('products.name')}</label>
                <div className="flex gap-2">
                  <Input placeholder="English" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <Input placeholder="العربية" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">SKU</label>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
              <div>
                <label className="label">{t('products.barcode')}</label>
                <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="label">{t('products.description')}</label>
                <textarea
                  className="input w-full min-h-[60px] resize-none"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <label className="label">{t('app.category')}</label>
                <select
                  className="input"
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                >
                  <option value="">{t('app.all')}</option>
                  {productCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{t('products.unit')}</label>
                <select
                  className="input"
                  value={form.unitOfMeasure}
                  onChange={(e) => setForm({ ...form, unitOfMeasure: e.target.value })}
                >
                  <option value="piece">{t('products.unit')}</option>
                  <option value="box">Box</option>
                  <option value="meter">Meter</option>
                  <option value="liter">Liter</option>
                  <option value="kilogram">Kilogram</option>
                  <option value="pair">Pair</option>
                  <option value="dozen">Dozen</option>
                </select>
              </div>
              <div>
                <label className="label">{t('products.purchasePrice')}</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.purchasePrice}
                  onChange={(e) => setForm({ ...form, purchasePrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="label">{t('products.sellingPrice')}</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.sellingPrice}
                  onChange={(e) => setForm({ ...form, sellingPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="col-span-2 flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.trackInventory}
                    onChange={(e) => setForm({ ...form, trackInventory: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">{t('products.trackInventory')}</span>
                </label>
              </div>
              {form.trackInventory && (
                <>
                  <div>
                    <label className="label">{t('products.currentStock')}</label>
                    <Input
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="label">{t('products.lowStockThreshold')}</label>
                    <Input
                      type="number"
                      min="0"
                      value={form.lowStockThreshold}
                      onChange={(e) => setForm({ ...form, lowStockThreshold: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowModal(false)}>{t('app.cancel')}</Button>
              <Button onClick={handleSave}>{t('app.save')}</Button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative bg-background rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-lg font-semibold mb-2">{t('app.confirmDelete')}</h2>
            <p className="text-sm text-muted-foreground mb-4">{t('app.noData')}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteId(null)}>{t('app.cancel')}</Button>
              <Button variant="danger" onClick={handleDelete}>{t('app.yesDelete')}</Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowDeleteAll(false)} />
          <div className="relative bg-background rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-lg font-semibold mb-2">{t('app.deleteAll')}</h2>
            <p className="text-sm text-muted-foreground mb-4">{t('app.deleteAllWarning')}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteAll(false)}>{t('app.cancel')}</Button>
              <Button variant="danger" onClick={handleDeleteAll}>{t('app.yesDelete')}</Button>
            </div>
          </div>
        </div>
      )}

      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => { if (!importing) { setShowImport(false); setImportResult(null); setImportStep('upload'); setParsedRows([]); } }} />
          <div className="relative bg-background rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-semibold mb-4">{t('import.title')}</h2>

            {importStep === 'upload' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{t('import.dragDrop')}</p>
                <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) parseFile(f); }}>
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">{t('import.dragDrop')}</p>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    id="excel-upload"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) parseFile(f); }}
                  />
                  <Button variant="outline" className="mt-3" onClick={() => document.getElementById('excel-upload')?.click()}>
                    {t('import.selectFile')}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>{t('import.expectedColumns')}:</p>
                  <ul className="list-disc list-inside">
                    <li>{t('import.itemNumber')} ({t('import.productNumber')})</li>
                    <li>{t('import.productName')}</li>
                    <li>{t('import.price')} ({t('import.sellingPrice')})</li>
                  </ul>
                </div>
                {importing && <p className="text-sm text-center text-primary">{t('import.processing')}</p>}
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => { setShowImport(false); setImportResult(null); setImportStep('upload'); setParsedRows([]); }}>{t('app.cancel')}</Button>
                </div>
              </div>
            )}

            {importStep === 'preview' && !importing && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {parsedRows.filter(r => r.valid).length} {t('import.valid')} / {parsedRows.length} {t('import.totalRows').toLowerCase()}
                  </p>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={parsedRows.filter(r => r.valid).every(r => r.selected)} onChange={toggleSelectAll} className="h-4 w-4" />
                    {t('import.selectAll')}
                  </label>
                </div>
                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="w-10 p-2 text-center">
                          <input type="checkbox" checked={parsedRows.filter(r => r.valid).every(r => r.selected)} onChange={toggleSelectAll} className="h-4 w-4" />
                        </th>
                        <th className="text-left p-2">SKU</th>
                        <th className="text-left p-2">{t('import.productName')}</th>
                        <th className="text-right p-2">{t('import.price')}</th>
                        <th className="text-center p-2">{t('app.status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((row, i) => (
                        <tr key={i} className={`border-b hover:bg-muted/50 ${!row.valid ? 'opacity-60' : ''}`}>
                          <td className="p-2 text-center">
                            <input type="checkbox" checked={row.selected} disabled={!row.valid}
                              onChange={() => toggleRow(i)} className="h-4 w-4" />
                          </td>
                          <td className="p-2 font-mono text-xs">{row.sku || '-'}</td>
                          <td className="p-2">{row.name || '-'}</td>
                          <td className="p-2 text-right">{row.price > 0 ? formatCurrency(row.price, 'EGP', language) : '-'}</td>
                          <td className="p-2 text-center">
                            {row.valid ? (
                              <Badge variant="green">{t('import.valid')}</Badge>
                            ) : (
                              <span className="text-xs text-red-500">{row.reason}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setImportStep('upload'); setParsedRows([]); }}>{t('import.importAnother')}</Button>
                  <Button onClick={executeImport} disabled={!parsedRows.some(r => r.selected)}>
                    {t('import.importSelected')} ({parsedRows.filter(r => r.selected).length})
                  </Button>
                </div>
              </div>
            )}

            {importStep === 'result' && importResult && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{t('import.importComplete')}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span>{t('import.imported')}: <strong>{importResult.imported}</strong></span>
                  <span>{t('import.skipped')}: <strong>{importResult.skipped}</strong></span>
                </div>
                {importResult.errors.length > 0 && (
                  <div>
                    <p className="text-sm text-red-500 mb-1">{t('import.errors')}:</p>
                    {importResult.errors.slice(0, 5).map((e, i) => (
                      <p key={i} className="text-xs text-red-400">- {e}</p>
                    ))}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setImportStep('upload'); setImportResult(null); setParsedRows([]); }}>{t('import.importAnother')}</Button>
                  <Button onClick={() => { setShowImport(false); setImportResult(null); setImportStep('upload'); setParsedRows([]); }}>{t('app.close')}</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
