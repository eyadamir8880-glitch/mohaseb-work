'use client';
import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/providers/language-provider';
import { useAppStore } from '@/stores/use-app-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDate, getStatusColor, generateId, generateNumber } from '@/lib/utils';
import { Plus, Search, Eye, Trash2, Wallet, Receipt, X } from 'lucide-react';
import { PAYMENT_METHODS } from '@/lib/constants';
import type { Invoice, InvoiceItem, Product } from '@/lib/types';

const statusFilters = ['all', 'draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled'] as const;

export default function InvoicesPage() {
  const { t, locale } = useLanguage();
  const store = useAppStore();
  const { invoices, customers, products, paymentMethods, recordPayment, addInvoice } = store;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    invoiceNumber: '',
    customerId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
    terms: '',
    items: [] as { productId: string; productName: string; productNameAr: string; quantity: number; unitPrice: number; discountPercent: number; taxPercent: number; lineTotal: number }[],
  });

  const resetCreateForm = () => {
    setCreateForm({
      invoiceNumber: generateNumber('INV', invoices),
      customerId: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      notes: '',
      terms: '',
      items: [{ productId: '', productName: '', productNameAr: '', quantity: 1, unitPrice: 0, discountPercent: 0, taxPercent: 14, lineTotal: 0 }],
    });
  };

  const openCreateModal = () => {
    resetCreateForm();
    setShowCreateModal(true);
  };

  const handleAddItem = () => {
    setCreateForm((prev) => ({
      ...prev,
      items: [...prev.items, { productId: '', productName: '', productNameAr: '', quantity: 1, unitPrice: 0, discountPercent: 0, taxPercent: 14, lineTotal: 0 }],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setCreateForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    setCreateForm((prev) => {
      const items = [...prev.items];
      const item = { ...items[index], [field]: value };
      if (field === 'productId') {
        const product = products.find((p) => p.id === value);
        if (product) {
          item.productName = product.name;
          item.productNameAr = product.nameAr;
          item.unitPrice = product.sellingPrice;
        }
      }
      if (field === 'quantity' || field === 'unitPrice' || field === 'discountPercent') {
        const qty = field === 'quantity' ? Number(value) : item.quantity;
        const price = field === 'unitPrice' ? Number(value) : item.unitPrice;
        const disc = field === 'discountPercent' ? Number(value) : item.discountPercent;
        item.lineTotal = qty * price * (1 - disc / 100);
      }
      items[index] = item;
      return { ...prev, items };
    });
  };

  const calcSubtotal = () => createForm.items.reduce((sum, i) => sum + Number(i.quantity) * Number(i.unitPrice), 0);
  const calcDiscount = () => createForm.items.reduce((sum, i) => sum + Number(i.quantity) * Number(i.unitPrice) * Number(i.discountPercent) / 100, 0);
  const calcTax = () => createForm.items.reduce((sum, i) => sum + Number(i.lineTotal) * Number(i.taxPercent) / 100, 0);
  const calcGrandTotal = () => createForm.items.reduce((sum, i) => sum + Number(i.lineTotal) * (1 + Number(i.taxPercent) / 100), 0);

  const handleCreateInvoice = () => {
    if (!createForm.customerId || createForm.items.length === 0) return;
    const items: InvoiceItem[] = createForm.items.map((i) => ({
      id: generateId(),
      productId: i.productId,
      variantId: null,
      productName: i.productName,
      productNameAr: i.productNameAr,
      sku: '',
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      discountPercent: i.discountPercent,
      taxPercent: i.taxPercent,
      lineTotal: i.lineTotal,
    }));
    const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const discountTotal = items.reduce((s, i) => s + i.quantity * i.unitPrice * i.discountPercent / 100, 0);
    const taxTotal = items.reduce((s, i) => s + i.lineTotal * i.taxPercent / 100, 0);
    const grandTotal = items.reduce((s, i) => s + i.lineTotal * (1 + i.taxPercent / 100), 0);
    addInvoice({
      invoiceNumber: createForm.invoiceNumber,
      customerId: createForm.customerId,
      items,
      subtotal,
      taxTotal,
      discountTotal,
      grandTotal,
      paidAmount: 0,
      status: 'draft',
      issueDate: createForm.issueDate,
      dueDate: createForm.dueDate,
      notes: createForm.notes,
      terms: createForm.terms,
      deliveryInfo: null,
      treasuryTransactionId: null,
      payments: [],
    });
    setShowCreateModal(false);
  };

  function getCustomerName(customerId: string): string {
    const c = customers.find(c => c.id === customerId);
    return c ? (locale === 'ar' ? c.nameAr || c.name : c.name) : '-';
  }

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const name = getCustomerName(inv.customerId);
      const matchesSearch = inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [invoices, search, statusFilter, customers, locale]);

  const handleDelete = (id: string) => {
    store.deleteInvoice(id);
  };

  const handleDeleteAll = () => {
    store.clearModuleData('invoices');
    setShowDeleteAll(false);
  };

  const handleRecordPayment = (inv: Invoice) => {
    setSelectedInvoice(inv);
    const remaining = inv.grandTotal - inv.paidAmount;
    setPaymentAmount(remaining.toFixed(2));
    setPaymentMethod('cash');
    setPaymentRef('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentNotes('');
    setShowPaymentModal(true);
  };

  const handleViewPayments = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setShowPaymentsModal(true);
  };

  const submitPayment = () => {
    if (!selectedInvoice) return;
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) return;
    recordPayment(selectedInvoice.id, {
      invoiceId: selectedInvoice.id,
      amount,
      paymentMethod,
      reference: paymentRef,
      paidAt: new Date(paymentDate).toISOString(),
      notes: paymentNotes,
    });
    setShowPaymentModal(false);
    setSelectedInvoice(null);
  };

  function getPaymentMethodName(methodId: string): string {
    const pm = paymentMethods.find(p => p.id === methodId) || PAYMENT_METHODS.find(p => p.id === methodId);
    return pm ? (locale === 'ar' ? pm.nameAr : pm.name) : methodId;
  }

  const remainingBalance = selectedInvoice ? selectedInvoice.grandTotal - selectedInvoice.paidAmount : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t.invoices.title}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowDeleteAll(true)} className="gap-2 text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950">
            <Trash2 className="h-4 w-4" />
            {t('app.deleteAll')}
          </Button>
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('invoices.addNew')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder={t.app.search} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[
          { value: 'all', label: t.app.all },
          ...statusFilters.filter(s => s !== 'all').map(s => ({ value: s, label: (t.invoices.statuses as any)[s] })),
        ]} className="w-40" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">{t.invoices.invoiceNumber}</th>
                  <th className="text-left p-3 font-medium">{t.invoices.customer}</th>
                  <th className="text-left p-3 font-medium">{t.invoices.issueDate}</th>
                  <th className="text-left p-3 font-medium">{t.invoices.dueDate}</th>
                  <th className="text-right p-3 font-medium">{t.invoices.grandTotal}</th>
                  <th className="text-center p-3 font-medium">{t.invoices.paid}</th>
                  <th className="text-center p-3 font-medium">{t.app.status}</th>
                  <th className="text-center p-3 font-medium">{t.app.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => {
                  const paidPercent = inv.grandTotal > 0 ? Math.min(100, Math.round((inv.paidAmount / inv.grandTotal) * 100)) : 0;
                  return (
                    <tr key={inv.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-3 font-medium">{inv.invoiceNumber}</td>
                      <td className="p-3">{getCustomerName(inv.customerId)}</td>
                      <td className="p-3">{formatDate(inv.issueDate, locale)}</td>
                      <td className="p-3">{formatDate(inv.dueDate, locale)}</td>
                      <td className="p-3 text-right font-medium">{formatCurrency(inv.grandTotal, 'EGP', locale)}</td>
                      <td className="p-3 text-center min-w-[120px]">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                paidPercent >= 100 ? 'bg-green-500' : paidPercent > 0 ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                              style={{ width: `${paidPercent}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(inv.paidAmount, 'EGP', locale)} / {formatCurrency(inv.grandTotal, 'EGP', locale)}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Badge className={getStatusColor(inv.status)}>
                          {(t.invoices.statuses as any)[inv.status]}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" title="Record Payment" onClick={() => handleRecordPayment(inv)}>
                            <Wallet className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="View Payments" onClick={() => handleViewPayments(inv)}>
                            <Receipt className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(inv.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title={t('invoices.addNew')} size="wide">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('invoices.invoiceNumber')} value={createForm.invoiceNumber}
              onChange={(e) => setCreateForm({ ...createForm, invoiceNumber: e.target.value })} />
            <Select label={t('invoices.customer')} value={createForm.customerId}
              onChange={(e) => setCreateForm({ ...createForm, customerId: e.target.value })}
              options={customers.map((c: any) => ({ value: c.id, label: locale === 'ar' ? c.nameAr || c.name : c.name }))}
              placeholder={t('app.select')} />
            <Input label={t('invoices.issueDate')} type="date" value={createForm.issueDate}
              onChange={(e) => setCreateForm({ ...createForm, issueDate: e.target.value })} />
            <Input label={t('invoices.dueDate')} type="date" value={createForm.dueDate}
              onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{t('invoices.items')}</label>
              <Button variant="outline" size="sm" onClick={handleAddItem}><Plus className="h-3 w-3 mr-1" />{t('invoices.addItem')}</Button>
            </div>
            {createForm.items.map((item, i) => (
              <div key={i} className="flex gap-2 items-end">
                <Select value={item.productId}
                  onChange={(e) => handleItemChange(i, 'productId', e.target.value)}
                  options={products.map((p: any) => ({ value: p.id, label: locale === 'ar' ? p.nameAr || p.name : p.name }))}
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
                  {formatCurrency(item.lineTotal * (1 + item.taxPercent / 100), 'EGP', locale)}
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(i)} className="mb-1">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-end gap-1 text-sm border-t pt-3">
            <div className="flex justify-between w-64">
              <span>{t('invoices.subtotal')}</span>
              <span>{formatCurrency(calcSubtotal(), 'EGP', locale)}</span>
            </div>
            <div className="flex justify-between w-64">
              <span>{t('invoices.discountTotal')}</span>
              <span className="text-red-600">-{formatCurrency(calcDiscount(), 'EGP', locale)}</span>
            </div>
            <div className="flex justify-between w-64">
              <span>{t('invoices.taxTotal')}</span>
              <span>{formatCurrency(calcTax(), 'EGP', locale)}</span>
            </div>
            <div className="flex justify-between w-64 font-bold border-t pt-1">
              <span>{t('invoices.grandTotal')}</span>
              <span>{formatCurrency(calcGrandTotal(), 'EGP', locale)}</span>
            </div>
          </div>

          <Input label={t('invoices.notes')} value={createForm.notes}
            onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })} />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>{t('app.cancel')}</Button>
            <Button onClick={handleCreateInvoice} disabled={!createForm.customerId || createForm.items.length === 0 || createForm.items.some((i) => !i.productId)}>{t('app.save')}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showPaymentModal} onClose={() => { setShowPaymentModal(false); setSelectedInvoice(null); }} title={t('invoices.paymentModal.title')} size="default">
        {selectedInvoice && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t.invoices.invoiceNumber}:</span>
                <span className="ml-2 font-medium">{selectedInvoice.invoiceNumber}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t.invoices.customer}:</span>
                <span className="ml-2 font-medium">{getCustomerName(selectedInvoice.customerId)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t.invoices.grandTotal}:</span>
                <span className="ml-2 font-medium">{formatCurrency(selectedInvoice.grandTotal, 'EGP', locale)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t.invoices.paidAmount}:</span>
                <span className="ml-2 font-medium">{formatCurrency(selectedInvoice.paidAmount, 'EGP', locale)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">{t.invoices.remaining}:</span>
                <span className="ml-2 font-bold text-lg">{formatCurrency(remainingBalance, 'EGP', locale)}</span>
              </div>
            </div>
            <Input label={t('invoices.paymentModal.amount')} type="number" step="0.01" min="0" max={remainingBalance} value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
            <Select label={t('invoices.paymentModal.method')} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} options={(paymentMethods.length ? paymentMethods : PAYMENT_METHODS).map(pm => ({ value: pm.id, label: locale === 'ar' ? pm.nameAr : pm.name }))} />
            <Input label={t('invoices.paymentModal.referenceNumber')} placeholder="e.g. check / transfer number" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} />
            <Input label={t('invoices.paymentModal.date')} type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
            <Input label={t('invoices.notes')} placeholder="Optional notes" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setShowPaymentModal(false); setSelectedInvoice(null); }}>{t('app.cancel')}</Button>
              <Button onClick={submitPayment} disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}>{t('invoices.paymentModal.confirm')}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showPaymentsModal} onClose={() => { setShowPaymentsModal(false); setSelectedInvoice(null); }} title={t('invoices.paymentHistory')} size="wide">
        {selectedInvoice && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm p-4 rounded-lg bg-muted/50">
              <div>
                <span className="text-muted-foreground">{t.invoices.invoiceNumber}:</span>
                <span className="ml-2 font-medium">{selectedInvoice.invoiceNumber}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t.invoices.grandTotal}:</span>
                <span className="ml-2 font-medium">{formatCurrency(selectedInvoice.grandTotal, 'EGP', locale)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t.invoices.paidAmount}:</span>
                <span className="ml-2 font-medium">{formatCurrency(selectedInvoice.paidAmount, 'EGP', locale)}</span>
              </div>
            </div>
            {selectedInvoice.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t('invoices.noPayments')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">{t('invoices.date')}</th>
                      <th className="text-left p-2 font-medium">{t('invoices.paymentModal.method')}</th>
                      <th className="text-left p-2 font-medium">{t('invoices.reference')}</th>
                      <th className="text-right p-2 font-medium">{t('invoices.paymentModal.amount')}</th>
                      <th className="text-left p-2 font-medium">{t('invoices.notes')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.payments.map((p) => (
                      <tr key={p.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">{formatDate(p.paidAt, locale)}</td>
                        <td className="p-2">{getPaymentMethodName(p.paymentMethod)}</td>
                        <td className="p-2">{p.reference || '-'}</td>
                        <td className="p-2 text-right font-medium text-green-600">{formatCurrency(p.amount, 'EGP', locale)}</td>
                        <td className="p-2 text-muted-foreground">{p.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => { setShowPaymentsModal(false); setSelectedInvoice(null); }}>{t('app.close')}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
