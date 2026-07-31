'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/providers/language-provider';
import { useAppStore } from '@/stores/use-app-store';
import { formatCurrency, formatDate, getStatusColor, getStatusTranslation, generateId } from '@/lib/utils';
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
    { key: 'returnNumber', header: t('returns.returnNumber'), sortable: true },
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
    { key: 'status', header: t('app.status'), render: (item: any) => (
      <span className={`badge ${getStatusColor(item.status)}`}>{getStatusTranslation(item.status, language)}</span>
    )},
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
        data={returns}
      />

      <Modal isOpen={showDeleteAll} onClose={() => setShowDeleteAll(false)} title={t('app.deleteAll')}>
        <p className="text-sm text-muted-foreground mb-4">{t('app.deleteAllWarning')}</p>
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
  const { invoices, returns } = store;
  const [originalInvoiceId, setOriginalInvoiceId] = useState('');
  const [condition, setCondition] = useState<'good' | 'bad'>('good');
  const [reason, setReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('cash');
  const [items, setItems] = useState<any[]>([]);

  const effectiveUnitPrice = (item: any) => {
    if (item.lineTotal && item.quantity) return item.lineTotal / item.quantity;
    return (item.unitPrice || 0) * (1 - (item.discountPercent || 0) / 100);
  };

  const lineRefund = (item: any) => Math.round(effectiveUnitPrice(item) * item.returnQty * 100) / 100;

  const handleInvoiceChange = (e: any) => {
    const invoiceId = e.target.value;
    setOriginalInvoiceId(invoiceId);
    const invoice = invoices.find(i => i.id === invoiceId);
    setItems(invoice ? invoice.items.map(item => ({ ...item, returnQty: 0 })) : []);
  };

  const handleSave = () => {
    const returnItems = items.filter(i => i.returnQty > 0).map(i => ({
      id: generateId(), productId: i.productId, variantId: i.variantId,
      productName: i.productName, productNameAr: i.productNameAr, sku: i.sku,
      quantity: i.returnQty, unitPrice: effectiveUnitPrice(i),
      refundAmount: lineRefund(i), condition, reason,
    }));

    const totalRefund = returnItems.reduce((s, i) => s + i.refundAmount, 0);

    const nextReturnNumber = (() => {
      const max = returns.reduce((m, r) => {
        const n = parseInt(String(r.returnNumber || '').replace(/^RET-(\d+)$/i, '$1'), 10);
        return Number.isFinite(n) && n > m ? n : m;
      }, 0);
      return `RET-${String(max + 1).padStart(3, '0')}`;
    })();

    store.addReturn({
      returnNumber: nextReturnNumber,
      type: 'customer', originalInvoiceId,
      items: returnItems, refundAmount: totalRefund, refundMethod,
      status: 'completed',
    });

    onSave();
  };

  return (
    <div className="space-y-4">
      <Select label={t('returns.originalInvoice')} value={originalInvoiceId} onChange={handleInvoiceChange} placeholder={t('app.search')}
        options={invoices.filter(i => ['sent', 'partially_paid', 'paid', 'partially_returned'].includes(i.status)).map(inv => ({ value: inv.id, label: `${inv.invoiceNumber} - ${formatCurrency(inv.grandTotal, 'EGP', language)}` }))} />

      {items.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">{t('invoices.items')}</p>
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 rounded-lg border p-3 dark:border-slate-700">
              <div className="flex-1">
                <p className="text-sm font-medium">{language === 'ar' ? item.productNameAr : item.productName}</p>
                <p className="text-xs text-slate-500">{item.sku} | {t('invoices.unitPrice')}: {formatCurrency(effectiveUnitPrice(item), 'EGP', language)} | {t('invoices.maxQty')}: {item.quantity}</p>
                {item.returnQty > 0 && (
                  <p className="text-xs text-emerald-600 mt-0.5">{t('returns.refundAmount')}: {formatCurrency(lineRefund(item), 'EGP', language)}</p>
                )}
              </div>
              <Input type="number" className="w-20" min={0} max={item.quantity} placeholder={t('invoices.quantity')}
                value={item.returnQty || 0}
                onChange={(e) => {
                  const newItems = [...items];
                  const val = parseInt(e.target.value) || 0;
                  newItems[idx] = { ...item, returnQty: Math.min(Math.max(val, 0), item.quantity) };
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

      <Select label={t('returns.refundMethod')} value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)}
        options={store.paymentMethods.filter(p => p.isActive !== false).map(m => ({ value: m.id, label: language === 'ar' ? m.nameAr : m.name }))} />

      <Input label={t('returns.reason')} value={reason} onChange={(e) => setReason(e.target.value)} />

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>{t('app.cancel')}</Button>
        <Button onClick={handleSave}>{t('app.save')}</Button>
      </div>
    </div>
  );
}
