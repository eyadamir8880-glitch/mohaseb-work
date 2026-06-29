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
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { Trash2 } from 'lucide-react';

export default function PurchaseOrdersPage() {
  const { language, t } = useLanguage();
  const store = useAppStore();
  const { purchaseOrders, suppliers } = store;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [receiveModal, setReceiveModal] = useState<string | null>(null);
  const [payModal, setPayModal] = useState<string | null>(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = [...purchaseOrders];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(p => p.poNumber.toLowerCase().includes(s) || suppliers.find(sp => sp.id === p.supplierId)?.name.toLowerCase().includes(s));
    }
    if (statusFilter) result = result.filter(p => p.status === statusFilter);
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [purchaseOrders, search, statusFilter, suppliers]);

  const handleReceiveStock = (poId: string, receivedQtys: Record<string, number>) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) return;
    store.updatePurchaseOrder(po.id, { status: 'received', receivedDate: new Date().toISOString().split('T')[0] });
    po.items.forEach((item: any) => {
      const qty = receivedQtys[item.id] || 0;
      if (qty <= 0) return;
      const product = store.products.find(p => p.id === item.productId);
      if (product) {
        store.updateProduct(product.id, { stock: product.stock + qty });
      }
      store.addStockMovement({
        productId: item.productId, variantId: item.variantId, type: 'in', quantity: qty,
        reason: 'Purchase Order Received', date: new Date().toISOString().split('T')[0],
        referenceType: 'purchase_order', referenceId: po.id, warehouseId: store.warehouses[0]?.id || '',
      });
    });
    setReceiveModal(null);
  };

  const columns = [
    { key: 'poNumber', header: t('purchaseOrders.poNumber'), sortable: true },
    { key: 'supplierId', header: t('purchaseOrders.supplier'), render: (item: any) => suppliers.find(s => s.id === item.supplierId) ? (language === 'ar' ? suppliers.find(s => s.id === item.supplierId)?.nameAr : suppliers.find(s => s.id === item.supplierId)?.name) : '-' },
    { key: 'orderDate', header: t('purchaseOrders.orderDate'), render: (item: any) => formatDate(item.orderDate) },
    { key: 'expectedDate', header: t('purchaseOrders.expectedDate'), render: (item: any) => formatDate(item.expectedDate) },
    { key: 'grandTotal', header: t('invoices.grandTotal'), render: (item: any) => formatCurrency(item.grandTotal, 'EGP', language), sortable: true },
    { key: 'status', header: t('app.status'), render: (item: any) => (
      <span className={`badge ${getStatusColor(item.status)}`}>{t(`purchaseOrders.status.${item.status}` as any)}</span>
    )},
    { key: 'actions', header: t('app.actions'), render: (item: any) => (
      <div className="flex gap-1">
        {(item.status === 'sent' || item.status === 'draft') && (
          <button className="btn-ghost btn-sm p-1 text-blue-600" onClick={() => setReceiveModal(item.id)} title={t('purchaseOrders.receiveStock')}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        )}
        {(item.status === 'received' || item.status === 'partially_received') && (
          <button className="btn-ghost btn-sm p-1 text-emerald-600" onClick={() => setPayModal(item.id)} title={t('purchaseOrders.markPaid')}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}
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
    store.clearModuleData('purchaseOrders');
    setShowDeleteAll(false);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('purchaseOrders.title')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowDeleteAll(true)} className="gap-2 text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950">
            <Trash2 className="h-4 w-4" />
            {t('app.deleteAll')}
          </Button>
          <Button onClick={() => { setEditingId(null); setShowModal(true); }}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t('purchaseOrders.addNew')}
        </Button>
      </div>
    </div>
      <div className="flex gap-3">
        <Input placeholder={t('app.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[
          { value: '', label: t('app.filter') + '...' },
          { value: 'draft', label: t('purchaseOrders.status.draft') },
          { value: 'sent', label: t('purchaseOrders.status.sent') },
          { value: 'received', label: t('purchaseOrders.status.received') },
          { value: 'paid', label: t('purchaseOrders.status.paid') },
          { value: 'cancelled', label: t('purchaseOrders.status.cancelled') },
        ]} className="max-w-[180px]" />
      </div>
      <DataTable columns={columns} data={filtered} emptyMessage={t('app.noData')} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? t('purchaseOrders.editPO') : t('purchaseOrders.addNew')} size="wide">
        <POForm poId={editingId} onSave={() => setShowModal(false)} onCancel={() => setShowModal(false)} />
      </Modal>

      <Modal isOpen={!!receiveModal} onClose={() => setReceiveModal(null)} title={t('purchaseOrders.receiveStock')}>
        {receiveModal && <ReceiveStockForm poId={receiveModal} onSave={(qtys) => handleReceiveStock(receiveModal, qtys)} onCancel={() => setReceiveModal(null)} />}
      </Modal>

      <Modal isOpen={!!payModal} onClose={() => setPayModal(null)} title={t('purchaseOrders.markPaid')}>
        {payModal && <POPaymentForm poId={payModal} onSave={() => setPayModal(null)} onCancel={() => setPayModal(null)} />}
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
        onConfirm={() => { store.deletePurchaseOrder(deleteConfirmId!); }}
        title={t('app.deleteConfirm')}
        message={t('app.deleteConfirm')}
        confirmLabel={t('app.yesDelete')}
        cancelLabel={t('app.cancel')}
      />
    </div>
  );
}

function POForm({ poId, onSave, onCancel }: { poId: string | null; onSave: () => void; onCancel: () => void }) {
  const { t, language } = useLanguage();
  const store = useAppStore();
  const existing = poId ? store.purchaseOrders.find(p => p.id === poId) : null;
  const [supplierId, setSupplierId] = useState(existing?.supplierId || '');
  const [orderDate, setOrderDate] = useState(existing?.orderDate || new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState(existing?.expectedDate || '');
  const [status, setStatus] = useState(existing?.status || 'draft');
  const [notes, setNotes] = useState(existing?.notes || '');
  const [items, setItems] = useState(existing?.items || [{ id: '', productId: '', productName: '', productNameAr: '', sku: '', orderedQuantity: 1, receivedQuantity: 0, unitPrice: 0, lineTotal: 0 }]);

  const handleItemChange = (index: number, field: string, value: string | number) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      if (field === 'productId') {
        const product = store.products.find(p => p.id === value);
        if (product) {
          item.productName = product.name;
          item.productNameAr = product.nameAr || '';
          item.unitPrice = product.purchasePrice || product.sellingPrice;
        }
      }
      const qty = (field === 'orderedQuantity' ? Number(value) : item.orderedQuantity) || 0;
      const price = (field === 'unitPrice' ? Number(value) : item.unitPrice) || 0;
      item.lineTotal = qty * price;
      updated[index] = item;
      return updated;
    });
  };

  const addItem = () => setItems(prev => [...prev, { id: '', productId: '', productName: '', productNameAr: '', sku: '', orderedQuantity: 1, receivedQuantity: 0, unitPrice: 0, lineTotal: 0 }]);
  const removeItem = (index: number) => setItems(prev => prev.filter((_, i) => i !== index));

  const handleSave = () => {
    const poItems = items.map(i => ({ ...i, id: i.id || crypto.randomUUID(), variantId: null }));
    const subtotal = items.reduce((s, i) => s + (i.orderedQuantity || 0) * (i.unitPrice || 0), 0);
    if (existing) {
      store.updatePurchaseOrder(existing.id, { supplierId, orderDate, expectedDate, status: status as any, notes, items: poItems, subtotal, taxTotal: 0, grandTotal: subtotal });
    } else {
      store.addPurchaseOrder({
        poNumber: `PO-${String(store.purchaseOrders.length + 1).padStart(3, '0')}`,
        supplierId, items: poItems, subtotal, taxTotal: 0, grandTotal: subtotal, paidAmount: 0,
        status: status as any, orderDate, expectedDate, receivedDate: null, notes, treasuryTransactionId: null,
      });
    }
    onSave();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Select label={t('purchaseOrders.supplier')} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
          options={store.suppliers.map(s => ({ value: s.id, label: language === 'ar' ? s.nameAr : s.name }))} placeholder={t('app.search')} />
        <Input label={t('purchaseOrders.orderDate')} type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
        <Input label={t('purchaseOrders.expectedDate')} type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
        <Select label={t('app.status')} value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'sent' | 'partially_received' | 'received' | 'paid' | 'cancelled')}
          options={[
            { value: 'draft', label: t('purchaseOrders.status.draft') },
            { value: 'sent', label: t('purchaseOrders.status.sent') },
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
            <Input type="number" min="1" value={item.orderedQuantity}
              onChange={(e) => handleItemChange(i, 'orderedQuantity', e.target.value)}
              className="w-20" label={t('purchaseOrders.orderedQuantity')} />
            <Input type="number" min="0" step="0.01" value={item.unitPrice}
              onChange={(e) => handleItemChange(i, 'unitPrice', e.target.value)}
              className="w-24" label={t('invoices.unitPrice')} />
            <div className="text-sm font-medium w-24 text-right pt-5">
              {formatCurrency((item.orderedQuantity || 0) * (item.unitPrice || 0), 'EGP', language)}
            </div>
            <button className="btn-ghost btn-sm p-1 mb-1 text-red-600" onClick={() => removeItem(i)}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-between text-sm border-t pt-3">
        <span className="font-medium">{t('invoices.grandTotal')}: {formatCurrency(items.reduce((s, i) => s + (i.orderedQuantity || 0) * (i.unitPrice || 0), 0), 'EGP', language)}</span>
      </div>

      <div>
        <label className="label">{t('invoices.notes')}</label>
        <textarea className="input mt-1 min-h-[60px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>{t('app.cancel')}</Button>
        <Button onClick={handleSave} disabled={!supplierId || items.length === 0 || items.some(i => !i.productId)}>{t('app.save')}</Button>
      </div>
    </div>
  );
}

function ReceiveStockForm({ poId, onSave, onCancel }: { poId: string; onSave: (qtys: Record<string, number>) => void; onCancel: () => void }) {
  const { t, language } = useLanguage();
  const store = useAppStore();
  const po = store.purchaseOrders.find(p => p.id === poId);
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>(() => {
    const qtys: Record<string, number> = {};
    po?.items.forEach(item => { qtys[item.id] = item.orderedQuantity - item.receivedQuantity; });
    return qtys;
  });

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">{po?.poNumber}</p>
      {po?.items.map(item => (
        <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3 dark:border-slate-700">
          <div className="flex-1">
            <p className="text-sm font-medium">{language === 'ar' ? item.productNameAr : item.productName}</p>
            <p className="text-xs text-slate-500">{t('products.sku')}: {item.sku} | {t('purchaseOrders.orderDate')}: {item.orderedQuantity}</p>
          </div>
          <Input type="number" className="w-24" value={receivedQtys[item.id] || 0}
            onChange={(e) => setReceivedQtys({ ...receivedQtys, [item.id]: parseInt(e.target.value) || 0 })}
          />
        </div>
      ))}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>{t('app.cancel')}</Button>
        <Button onClick={() => onSave(receivedQtys)}>{t('purchaseOrders.receiveStock')}</Button>
      </div>
    </div>
  );
}

function POPaymentForm({ poId, onSave, onCancel }: { poId: string; onSave: () => void; onCancel: () => void }) {
  const { t, language } = useLanguage();
  const store = useAppStore();
  const po = store.purchaseOrders.find(p => p.id === poId);
  const [amount, setAmount] = useState(String(po?.grandTotal || 0));
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSavePayment = () => {
    if (!po) return;
    const paidAmount = parseFloat(amount) || 0;
    store.updatePurchaseOrder(po.id, { paidAmount, status: 'paid' });
    const accId = store.treasuryAccounts[0]?.id || '';
    store.addTreasuryTransaction({
      type: 'expense', amount: paidAmount, date: paymentDate, accountId: accId,
      fromAccountId: null, toAccountId: null, paymentMethod, paymentMethodDetail: paymentMethod,
      categoryId: '', description: `Payment for ${po.poNumber}`, descriptionAr: `دفعة لأمر الشراء ${po.poNumber}`,
      referenceNumber: '', receiptUrl: '', linkedInvoiceId: null, linkedPOId: po.id,
      linkedReturnId: null, isRecurring: false, recurringPattern: null, nextOccurrence: null,
      isReconciled: false, reconciledAt: null,
    });
    if (accId) {
      const acc = store.treasuryAccounts.find(a => a.id === accId);
      if (acc) {
        store.updateTreasuryAccount(accId, { balance: (acc.balance || 0) - paidAmount });
      }
    }
    onSave();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">{t('purchaseOrders.poNumber')}: <strong>{po?.poNumber}</strong> | {t('invoices.grandTotal')}: <strong>{formatCurrency(po?.grandTotal || 0, 'EGP', language)}</strong></p>
      <Input label={t('invoices.paymentModal.amount')} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <Input label={t('invoices.paymentModal.date')} type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
      <Select label={t('invoices.paymentModal.method')} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
        options={store.paymentMethods.filter(p => p.isActive).map(p => ({ value: p.id, label: language === 'ar' ? p.nameAr : p.name }))} />
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>{t('app.cancel')}</Button>
        <Button onClick={handleSavePayment}>{t('purchaseOrders.markPaid')}</Button>
      </div>
    </div>
  );
}
