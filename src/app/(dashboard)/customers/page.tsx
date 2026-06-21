'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/providers/language-provider';
import { useAppStore } from '@/stores/use-app-store';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { Trash2 } from 'lucide-react';

export default function CustomersPage() {
  const { language, t } = useLanguage();
  const store = useAppStore();
  const { customers, invoices, addCustomer, updateCustomer, deleteCustomer, clearModuleData } = store;
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);

  const filtered = useMemo(() => {
    let result = [...customers];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(s) || c.phone.includes(s) || c.email.toLowerCase().includes(s));
    }
    return result;
  }, [customers, search]);

  const getCustomerTotals = (customerId: string) => {
    const custInvoices = invoices.filter(i => i.customerId === customerId);
    const totalInvoiced = custInvoices.reduce((s, i) => s + i.grandTotal, 0);
    const totalPaid = custInvoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
    return { totalInvoiced, totalPaid, totalDue: totalInvoiced - totalPaid };
  };

  const columns = [
    { key: 'name', header: t('customers.name'), sortable: true, render: (item: any) => language === 'ar' ? item.nameAr || item.name : item.name },
    { key: 'phone', header: t('customers.phone') },
    { key: 'email', header: t('customers.email') },
    { key: 'totalInvoiced', header: t('customers.totalInvoiced'), render: (item: any) => formatCurrency(getCustomerTotals(item.id).totalInvoiced, 'EGP', language) },
    { key: 'totalPaid', header: t('customers.totalPaid'), render: (item: any) => formatCurrency(getCustomerTotals(item.id).totalPaid, 'EGP', language) },
    { key: 'totalDue', header: t('customers.totalDue'), render: (item: any) => formatCurrency(getCustomerTotals(item.id).totalDue, 'EGP', language) },
    { key: 'creditLimit', header: t('customers.creditLimit'), render: (item: any) => formatCurrency(item.creditLimit, 'EGP', language) },
    { key: 'actions', header: t('app.actions'), render: (item: any) => (
      <div className="flex gap-1">
        <button className="btn-ghost btn-sm p-1" onClick={() => { setEditingId(item.id); setShowModal(true); }}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button className="btn-ghost btn-sm p-1 text-red-600" onClick={() => { if (confirm(t('app.deleteConfirm'))) deleteCustomer(item.id); }}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    )},
  ];

  const handleDeleteAll = () => {
    clearModuleData('customers');
    setShowDeleteAll(false);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('customers.title')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowDeleteAll(true)} className="gap-2 text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950">
            <Trash2 className="h-4 w-4" />
            {t('app.deleteAll')}
          </Button>
          <Button onClick={() => { setEditingId(null); setShowModal(true); }}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t('customers.addNew')}
        </Button>
      </div>
    </div>
      <Input placeholder={t('app.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      <DataTable columns={columns} data={filtered} emptyMessage={t('app.noData')} />
      
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? t('customers.editCustomer') : t('customers.addNew')}>
        <CustomerForm
          customerId={editingId}
          onSave={() => setShowModal(false)}
          onCancel={() => setShowModal(false)}
        />
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

function CustomerForm({ customerId, onSave, onCancel }: { customerId: string | null; onSave: () => void; onCancel: () => void }) {
  const { t } = useLanguage();
  const store = useAppStore();
  const existing = customerId ? store.customers.find(c => c.id === customerId) : null;
  const [name, setName] = useState(existing?.name || '');
  const [nameAr, setNameAr] = useState(existing?.nameAr || '');
  const [phone, setPhone] = useState(existing?.phone || '');
  const [email, setEmail] = useState(existing?.email || '');
  const [address, setAddress] = useState(existing?.address || '');
  const [taxNumber, setTaxNumber] = useState(existing?.taxNumber || '');
  const [creditLimit, setCreditLimit] = useState(String(existing?.creditLimit || 0));

  const handleSave = () => {
    const data = { name, nameAr, phone, email, address, taxNumber, creditLimit: parseFloat(creditLimit), totalInvoiced: existing?.totalInvoiced || 0, totalPaid: existing?.totalPaid || 0, totalDue: existing?.totalDue || 0, customPricingRules: existing?.customPricingRules || [] };
    if (existing) {
      store.updateCustomer(existing.id, data);
    } else {
      store.addCustomer(data);
    }
    onSave();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label={t('customers.name') + ' (EN)'} value={name} onChange={(e) => setName(e.target.value)} />
        <Input label={t('customers.name') + ' (AR)'} value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
        <Input label={t('customers.phone')} value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label={t('customers.email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label={t('customers.address')} value={address} onChange={(e) => setAddress(e.target.value)} />
        <Input label={t('customers.taxNumber')} value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} />
        <Input label={t('customers.creditLimit')} type="number" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>{t('app.cancel')}</Button>
        <Button onClick={handleSave}>{t('app.save')}</Button>
      </div>
    </div>
  );
}
