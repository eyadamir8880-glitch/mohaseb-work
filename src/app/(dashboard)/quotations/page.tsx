'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/providers/language-provider';
import { useAppStore } from '@/stores/use-app-store';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { Trash2 } from 'lucide-react';

export default function QuotationsPage() {
  const { language, t } = useLanguage();
  const store = useAppStore();
  const { quotations, customers } = store;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);

  const filtered = useMemo(() => {
    let result = [...quotations];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(q => q.quotationNumber.toLowerCase().includes(s) || customers.find(c => c.id === q.customerId)?.name.toLowerCase().includes(s));
    }
    if (statusFilter) result = result.filter(q => q.status === statusFilter);
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [quotations, search, statusFilter, customers]);

  const handleConvertToInvoice = (quotation: any) => {
    const newInvoiceNum = `INV-${String(store.invoices.length + 1).padStart(3, '0')}`;
    const invoice = store.addInvoice({
      invoiceNumber: newInvoiceNum, customerId: quotation.customerId, items: quotation.items.map((i: any) => ({ ...i })),
      subtotal: quotation.subtotal, taxTotal: quotation.taxTotal, discountTotal: quotation.discountTotal,
      grandTotal: quotation.grandTotal, paidAmount: 0, status: 'draft', issueDate: new Date().toISOString().split('T')[0],
      dueDate: '', notes: `Converted from ${quotation.quotationNumber}`, terms: '', deliveryInfo: null, treasuryTransactionId: null, payments: [],
    });
    store.updateQuotation(quotation.id, { status: 'converted', convertedInvoiceId: invoice.id });
    store.addAuditLog({ timestamp: new Date().toISOString(), user: 'Admin', action: 'updated', module: 'quotations', recordId: quotation.id, oldValues: null, newValues: { status: 'converted' }, ip: window.location.hostname || '127.0.0.1' });
  };

  const columns = [
    { key: 'quotationNumber', header: t('quotations.quotationNumber'), sortable: true },
    { key: 'customerId', header: t('invoices.customer'), render: (item: any) => customers.find(c => c.id === item.customerId) ? (language === 'ar' ? customers.find(c => c.id === item.customerId)?.nameAr : customers.find(c => c.id === item.customerId)?.name) : '-' },
    { key: 'issueDate', header: t('invoices.issueDate'), render: (item: any) => formatDate(item.issueDate) },
    { key: 'expiryDate', header: t('quotations.expiryDate'), render: (item: any) => <span className={new Date(item.expiryDate) < new Date() ? 'text-red-600 font-medium' : ''}>{formatDate(item.expiryDate)}</span> },
    { key: 'grandTotal', header: t('invoices.grandTotal'), render: (item: any) => formatCurrency(item.grandTotal, 'EGP', language), sortable: true },
    { key: 'status', header: t('app.status'), render: (item: any) => (
      <span className={`badge ${getStatusColor(item.status)}`}>
        {t(`quotations.status.${item.status}` as any)}
      </span>
    )},
    { key: 'actions', header: t('app.actions'), render: (item: any) => (
      <div className="flex gap-1">
        <button className="btn-ghost btn-sm p-1" onClick={() => { setEditingId(item.id); setShowModal(true); }}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        {(item.status === 'accepted' || item.status === 'expired') && (
          <button className="btn-ghost btn-sm p-1 text-blue-600" onClick={() => handleConvertToInvoice(item)} title={t('quotations.convertToInvoice')}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          </button>
        )}
        <button className="btn-ghost btn-sm p-1 text-red-600" onClick={() => { if (confirm(t('app.deleteConfirm'))) store.deleteQuotation(item.id); }}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    )},
  ];

  const handleDeleteAll = () => {
    store.clearModuleData('quotations');
    setShowDeleteAll(false);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('quotations.title')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowDeleteAll(true)} className="gap-2 text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950">
            <Trash2 className="h-4 w-4" />
            {t('app.deleteAll')}
          </Button>
          <Button onClick={() => { setEditingId(null); setShowModal(true); }}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t('quotations.addNew')}
        </Button>
      </div>
    </div>
      <div className="flex gap-3">
        <Input placeholder={t('app.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[
          { value: '', label: t('app.filter') + '...' },
          { value: 'draft', label: t('quotations.status.draft') },
          { value: 'sent', label: t('quotations.status.sent') },
          { value: 'accepted', label: t('quotations.status.accepted') },
          { value: 'rejected', label: t('quotations.status.rejected') },
          { value: 'expired', label: t('quotations.status.expired') },
          { value: 'converted', label: t('quotations.status.converted') },
        ]} className="max-w-[180px]" />
      </div>
      <DataTable columns={columns} data={filtered} emptyMessage={t('app.noData')} />
      
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? t('quotations.editQuotation') : t('quotations.addNew')} size="wide">
        <QuotationForm quotationId={editingId} onSave={() => setShowModal(false)} onCancel={() => setShowModal(false)} />
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
    </div>
  );
}

function QuotationForm({ quotationId, onSave, onCancel }: { quotationId: string | null; onSave: () => void; onCancel: () => void }) {
  const { t, language } = useLanguage();
  const store = useAppStore();
  const existing = quotationId ? store.quotations.find(q => q.id === quotationId) : null;
  const [customerId, setCustomerId] = useState(existing?.customerId || '');
  const [issueDate, setIssueDate] = useState(existing?.issueDate || new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(existing?.expiryDate || new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0]);
  const [status, setStatus] = useState(existing?.status || 'draft');
  const [items, setItems] = useState(existing?.items || [{ id: '', productId: '', productName: '', productNameAr: '', sku: '', quantity: 1, unitPrice: 0, discountPercent: 0, taxPercent: 14, lineTotal: 0 }]);

  const handleItemChange = (index: number, field: string, value: string | number) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      if (field === 'productId') {
        const product = store.products.find(p => p.id === value);
        if (product) {
          item.productName = product.name;
          item.productNameAr = product.nameAr || '';
          item.unitPrice = product.sellingPrice;
        }
      }
      const qty = field === 'quantity' ? Number(value) : item.quantity;
      const price = field === 'unitPrice' ? Number(value) : item.unitPrice;
      const disc = field === 'discountPercent' ? Number(value) : item.discountPercent;
      item.lineTotal = qty * price * (1 - disc / 100);
      updated[index] = item;
      return updated;
    });
  };

  const addItem = () => setItems(prev => [...prev, { id: '', productId: '', productName: '', productNameAr: '', sku: '', quantity: 1, unitPrice: 0, discountPercent: 0, taxPercent: 14, lineTotal: 0 }]);
  const removeItem = (index: number) => setItems(prev => prev.filter((_, i) => i !== index));

  const calcTotals = () => {
    const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const discountTotal = items.reduce((s, i) => s + i.quantity * i.unitPrice * i.discountPercent / 100, 0);
    const taxTotal = items.reduce((s, i) => s + i.lineTotal * i.taxPercent / 100, 0);
    const grandTotal = items.reduce((s, i) => s + i.lineTotal * (1 + i.taxPercent / 100), 0);
    return { subtotal, discountTotal, taxTotal, grandTotal };
  };

  const handleSave = () => {
    const { subtotal, taxTotal, discountTotal, grandTotal } = calcTotals();
    const quotationItems = items.map(i => ({ ...i, id: i.id || crypto.randomUUID(), variantId: null }));
    if (existing) {
      store.updateQuotation(existing.id, { customerId, issueDate, expiryDate, status: status as any, items: quotationItems, subtotal, taxTotal, discountTotal, grandTotal });
    } else {
      store.addQuotation({
        quotationNumber: `QT-${String(store.quotations.length + 1).padStart(3, '0')}`,
        customerId, items: quotationItems, subtotal, taxTotal, discountTotal, grandTotal,
        status: status as any, issueDate, expiryDate, notes: '', terms: '', convertedInvoiceId: null,
      });
    }
    onSave();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Select label={t('invoices.customer')} value={customerId} onChange={(e) => setCustomerId(e.target.value)}
          options={store.customers.map(c => ({ value: c.id, label: language === 'ar' ? c.nameAr : c.name }))} placeholder={t('app.search')} />
        <Input label={t('invoices.issueDate')} type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
        <Input label={t('quotations.expiryDate')} type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
        <Select label={t('app.status')} value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted')}
          options={[
            { value: 'draft', label: t('quotations.status.draft') },
            { value: 'sent', label: t('quotations.status.sent') },
            { value: 'accepted', label: t('quotations.status.accepted') },
            { value: 'rejected', label: t('quotations.status.rejected') },
          ]} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">{t('invoices.items')}</label>
          <Button variant="outline" size="sm" onClick={addItem}>
            <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {t('invoices.addItem')}
          </Button>
        </div>
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-end">
            <Select value={item.productId}
              onChange={(e) => handleItemChange(i, 'productId', e.target.value)}
              options={store.products.map(p => ({ value: p.id, label: language === 'ar' ? p.nameAr || p.name : p.name }))}
              placeholder={t('app.select')} className="flex-[2]" />
            <Input type="number" min="1" value={item.quantity}
              onChange={(e) => handleItemChange(i, 'quantity', e.target.value)}
              className="w-20" label={t('invoices.quantity')} />
            <Input type="number" min="0" step="0.01" value={item.unitPrice}
              onChange={(e) => handleItemChange(i, 'unitPrice', e.target.value)}
              className="w-24" label={t('invoices.unitPrice')} />
            <Input type="number" min="0" max="100" step="1" value={item.discountPercent}
              onChange={(e) => handleItemChange(i, 'discountPercent', e.target.value)}
              className="w-20" label={t('invoices.discount')} />
            <div className="text-sm font-medium w-24 text-right pt-5">
              {formatCurrency(item.lineTotal * (1 + item.taxPercent / 100), 'EGP', language)}
            </div>
            <button className="btn-ghost btn-sm p-1 mb-1 text-red-600" onClick={() => removeItem(i)}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-end gap-1 text-sm border-t pt-3">
        {(() => { const { subtotal, taxTotal, grandTotal } = calcTotals(); return (
          <>
            <div className="flex justify-between w-64">
              <span>{t('invoices.subtotal')}</span>
              <span>{formatCurrency(subtotal, 'EGP', language)}</span>
            </div>
            <div className="flex justify-between w-64">
              <span>{t('invoices.taxTotal')}</span>
              <span>{formatCurrency(taxTotal, 'EGP', language)}</span>
            </div>
            <div className="flex justify-between w-64 font-bold">
              <span>{t('invoices.grandTotal')}</span>
              <span>{formatCurrency(grandTotal, 'EGP', language)}</span>
            </div>
          </>
        );})()}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>{t('app.cancel')}</Button>
        <Button onClick={handleSave} disabled={!customerId || items.length === 0 || items.some(i => !i.productId)}>{t('app.save')}</Button>
      </div>
    </div>
  );
}
