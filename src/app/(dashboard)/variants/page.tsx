'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/providers/language-provider';
import { useAppStore } from '@/stores/use-app-store';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { Trash2 } from 'lucide-react';

export default function VariantsPage() {
  const { language, t } = useLanguage();
  const store = useAppStore();
  const { variants, products, addVariant, updateVariant, deleteVariant, clearModuleData } = store;
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productFilter, setProductFilter] = useState('');
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = [...variants];
    if (productFilter) result = result.filter(v => v.productId === productFilter);
    return result;
  }, [variants, productFilter]);

  const getProductName = (productId: string) => {
    const p = products.find(pr => pr.id === productId);
    return p ? (language === 'ar' ? p.nameAr : p.name) : '-';
  };

  const columns = [
    { key: 'productId', header: t('products.name'), render: (item: any) => getProductName(item.productId) },
    { key: 'sku', header: t('products.sku') },
    { key: 'attributeName', header: 'Attribute' },
    { key: 'attributeValue', header: 'Value' },
    { key: 'priceOverride', header: t('products.sellingPrice'), render: (item: any) => item.priceOverride ? formatCurrency(item.priceOverride, 'EGP', language) : '-' },
    { key: 'stock', header: t('products.stock') },
    { key: 'actions', header: t('app.actions'), render: (item: any) => (
      <div className="flex gap-1">
        <button className="btn-ghost btn-sm p-1" onClick={() => { setEditingId(item.id); setShowModal(true); }}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button className="btn-ghost btn-sm p-1 text-red-600" onClick={() => setDeleteConfirmId(item.id)}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    )},
  ];

  const handleDeleteAll = () => {
    clearModuleData('variants');
    setShowDeleteAll(false);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('products.variants')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowDeleteAll(true)} className="gap-2 text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950">
            <Trash2 className="h-4 w-4" />
            {t('app.deleteAll')}
          </Button>
          <Button onClick={() => { setEditingId(null); setShowModal(true); }}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t('products.addVariant')}
        </Button>
      </div>
    </div>
      <Select value={productFilter} onChange={(e) => setProductFilter(e.target.value)}
        options={[{ value: '', label: t('app.filter') + '...' }, ...products.map(p => ({ value: p.id, label: language === 'ar' ? p.nameAr : p.name }))]}
        className="max-w-xs" />
      <DataTable columns={columns} data={filtered} emptyMessage={t('app.noData')} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? t('products.editVariant') : t('products.addVariant')}>
        <VariantForm variantId={editingId} onSave={() => setShowModal(false)} onCancel={() => setShowModal(false)} />
      </Modal>

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

      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => { deleteVariant(deleteConfirmId!); }}
        title={t('app.deleteConfirm')}
        message={t('app.deleteConfirm')}
        confirmLabel={t('app.yesDelete')}
        cancelLabel={t('app.cancel')}
      />
    </div>
  );
}

function VariantForm({ variantId, onSave, onCancel }: { variantId: string | null; onSave: () => void; onCancel: () => void }) {
  const { t, language } = useLanguage();
  const store = useAppStore();
  const existing = variantId ? store.variants.find(v => v.id === variantId) : null;
  const [productId, setProductId] = useState(existing?.productId || '');
  const [sku, setSku] = useState(existing?.sku || '');
  const [attributeName, setAttributeName] = useState(existing?.attributeName || '');
  const [attributeValue, setAttributeValue] = useState(existing?.attributeValue || '');
  const [priceOverride, setPriceOverride] = useState(String(existing?.priceOverride || ''));
  const [stock, setStock] = useState(String(existing?.stock || 0));

  const handleSave = () => {
    const data = { productId, sku, attributeName, attributeValue, priceOverride: priceOverride ? parseFloat(priceOverride) : null, stock: parseInt(stock) || 0, imageUrl: '', barcode: '' };
    if (existing) {
      store.updateVariant(existing.id, data);
    } else {
      store.addVariant(data);
    }
    onSave();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Select label={t('products.name')} value={productId} onChange={(e) => setProductId(e.target.value)}
          options={store.products.map(p => ({ value: p.id, label: language === 'ar' ? p.nameAr : p.name }))} placeholder={t('app.search')} />
        <Input label={t('products.sku')} value={sku} onChange={(e) => setSku(e.target.value)} />
        <Input label="Attribute Name" value={attributeName} onChange={(e) => setAttributeName(e.target.value)} placeholder="e.g., Year, Size, Color" />
        <Input label="Attribute Value" value={attributeValue} onChange={(e) => setAttributeValue(e.target.value)} placeholder="e.g., 2022, XL, Red" />
        <Input label={t('products.sellingPrice') + ' (optional)'} type="number" value={priceOverride} onChange={(e) => setPriceOverride(e.target.value)} />
        <Input label={t('products.stock')} type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>{t('app.cancel')}</Button>
        <Button onClick={handleSave}>{t('app.save')}</Button>
      </div>
    </div>
  );
}
