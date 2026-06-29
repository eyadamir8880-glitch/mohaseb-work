'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/providers/language-provider';
import { useAppStore } from '@/stores/use-app-store';
import { formatCurrency, formatDate, getStatusColor, generateId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { Trash2 } from 'lucide-react';

export default function ReturnsPage() {
  const { language, t } = useLanguage();
  const store = useAppStore();
  const { returns, invoices } = store;
  const [showModal, setShowModal] = useState(false);
  const [showDeleteAll, setShowDeleteAll] = useState(false);

  const columns = [
    { key: 'returnNumber', header: 'Return #', sortable: true },
    { key: 'type', header: t('app.type'), render: (item: any) => (
      <span className="badge badge-blue">
        {t('returns.customerReturn')}
      </span>
    )},
    { key: 'originalInvoiceId', header: t('returns.originalInvoice'), render: (item: any) => {
      const inv = invoices.find(i => i.id === item.originalInvoiceId);
      return inv?.invoiceNumber || '-';
    }},
    { key: 'refundAmount', header: t('returns.refundAmount'), render: (item: any) => formatCurrency(item.refundAmount, 'EGP', language) },
    { key: 'condition', header: t('returns.condition'), render: (item: any) => (
      <span className={`badge ${item.condition === 'good' ? 'badge-green' : 'badge-red'}`}>
        {item.condition === 'good' ? t('returns.good') : t('returns.bad')}
      </span>
    )},
    { key: 'createdAt', header: t('auditLog.timestamp'), render: (item: any) => formatDate(item.createdAt) },
  ];

  const handleDeleteAll = () => {
    store.clearModuleData('returns');
    setShowDeleteAll(false);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('returns.title')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowDeleteAll(true)} className="gap-2 text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950">
            <Trash2 className="h-4 w-4" />
            {t('app.deleteAll')}
          </Button>
          <Button onClick={() => setShowModal(true)}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t('returns.addNew')}
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={returns.filter(r => r.type === 'customer')}
        searchable
        sortable
      />

      <Modal isOpen={showDeleteAll} onClose={() => setShowDeleteAll(false)} title={t('app.deleteAllWarning')}>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setShowDeleteAll(false)}>{t('app.cancel')}</Button>
          <Button variant="primary" onClick={handleDeleteAll} className="bg-red-600 hover:bg-red-700">{t('app.deleteAll')}</Button>
        </div>
      </Modal>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={t('returns.addNew')} size="wide">
        <ReturnForm onSave={() => setShowModal(false)} onCancel={() => setShowModal(false)} />
      </Modal>
    </div>
  );
}

function ReturnForm({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  const { t, language } = useLanguage();
  const store = useAppStore();
  const { invoices } = store;
  const [originalInvoiceId, setOriginalInvoiceId] = useState('');
  const [condition, setCondition] = useState<'good' | 'bad'>('good');
  const [reason, setReason] = useState('');
  const [items, setItems] = useState<any[]>([]);

  const selectedInvoice = invoices.find(i => i.id === originalInvoiceId);

  const loadInvoiceItems = () => {
    if (selectedInvoice) {
      setItems(selectedInvoice.items.map(item => ({ ...item, returnQty: 0, refundAmount: 0 })));
    }
  };

  const handleSave = () => {
    const returnItems = items.filter(i => i.returnQty > 0).map(i => ({
      id: generateId(), productId: i.productId, variantId: i.variantId,
      productName: i.productName, productNameAr: i.productNameAr, sku: i.sku,
      quantity: i.returnQty, unitPrice: i.unitPrice || 0,
      refundAmount: (i.unitPrice || 0) * i.returnQty, condition, reason,
    }));

    const totalRefund = returnItems.reduce((s, i) => s + i.refundAmount, 0);

    if (selectedInvoice) {
      returnItems.filter(i => condition === 'good').forEach(item => {
        const product = store.products.find(p => p.id === item.productId);
        if (product) store.updateProduct(product.id, { stock: product.stock + item.quantity });
        store.addStockMovement({
          productId: item.productId, variantId: item.variantId, type: 'in', quantity: item.quantity,
          reason: 'Customer Return', date: new Date().toISOString().split('T')[0],
          referenceType: 'return', referenceId: '', warehouseId: store.warehouses[0]?.id || '',
        });
      });

      store.updateInvoice(selectedInvoice.id, {
        status: selectedInvoice.grandTotal <= totalRefund ? 'fully_returned' : 'partially_returned',
      });
    }

    store.addReturn({
      returnNumber: `RET-${String(store.returns.length + 1).padStart(3, '0')}`,
      type: 'customer', originalInvoiceId, originalPOId: null,
      items: returnItems, refundAmount: totalRefund, refundMethod: 'cash',
      status: 'completed',
    });

    onSave();
  };

  return (
    <div className="space-y-4">
      <Select label={t('returns.originalInvoice')} value={originalInvoiceId} onChange={(e) => { setOriginalInvoiceId(e.target.value); }} placeholder={t('app.search')}
        options={invoices.filter(i => ['sent', 'partially_paid', 'paid'].includes(i.status)).map(inv => ({ value: inv.id, label: `${inv.invoiceNumber} - ${formatCurrency(inv.grandTotal, 'EGP', language)}` }))} />
      {originalInvoiceId && (
        <Button variant="outline" size="sm" onClick={loadInvoiceItems}>{t('invoices.items')}</Button>
      )}

      {items.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">{t('invoices.items')}</p>
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 rounded-lg border p-3 dark:border-slate-700">
              <div className="flex-1">
                <p className="text-sm font-medium">{language === 'ar' ? item.productNameAr : item.productName}</p>
                <p className="text-xs text-slate-500">{item.sku} | {t('invoices.unitPrice')}: {formatCurrency(item.unitPrice, 'EGP', language)}</p>
              </div>
              <Input type="number" className="w-20" placeholder={t('invoices.quantity')}
                value={item.returnQty || 0}
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[idx] = { ...item, returnQty: parseInt(e.target.value) || 0 };
                  setItems(newItems);
                }} />
            </div>
          ))}
        </div>
      )}

      <Select label={t('returns.condition')} value={condition} onChange={(e) => setCondition(e.target.value as any)}
        options={[
          { value: 'good', label: t('returns.good') },
          { value: 'bad', label: t('returns.bad') },
        ]} />
      
      <div>
        <label className="label">{t('returns.reason')}</label>
        <input className="input mt-1" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Damaged, Wrong Item, etc." />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>{t('app.cancel')}</Button>
        <Button onClick={handleSave}>{t('app.save')}</Button>
      </div>
    </div>
  );
}
