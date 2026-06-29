'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/providers/language-provider';
import { useAppStore } from '@/stores/use-app-store';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { Trash2 } from 'lucide-react';

export default function SuppliersPage() {
  const { language, t } = useLanguage();
  const store = useAppStore();
  const { suppliers, purchaseOrders, addSupplier, updateSupplier, deleteSupplier, clearModuleData } = store;
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = [...suppliers];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(s) || c.phone.includes(s));
    }
    return result;
  }, [suppliers, search]);

  const getSupplierTotals = (supplierId: string) => {
    const pos = purchaseOrders.filter(p => p.supplierId === supplierId);
    const totalPOs = pos.reduce((s, p) => s + p.grandTotal, 0);
    const totalPaid = pos.reduce((s, p) => s + (p.paidAmount || 0), 0);
    return { totalPOs, totalPaid, balanceDue: totalPOs - totalPaid };
  };

  const columns = [
    { key: 'name', header: t('suppliers.name'), sortable: true, render: (item: any) => language === 'ar' ? item.nameAr || item.name : item.name },
    { key: 'phone', header: t('suppliers.phone') },
    { key: 'email', header: t('suppliers.email') },
    { key: 'totalPOs', header: t('suppliers.totalPOs'), render: (item: any) => formatCurrency(getSupplierTotals(item.id).totalPOs, 'EGP', language) },
    { key: 'totalPaid', header: t('suppliers.totalPaid'), render: (item: any) => formatCurrency(getSupplierTotals(item.id).totalPaid, 'EGP', language) },
    { key: 'balanceDue', header: t('suppliers.balanceDue'), render: (item: any) => formatCurrency(getSupplierTotals(item.id).balanceDue, 'EGP', language) },
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
    clearModuleData('suppliers');
    setShowDeleteAll(false);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('suppliers.title')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowDeleteAll(true)} className="gap-2 text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950">
            <Trash2 className="h-4 w-4" />
            {t('app.deleteAll')}
          </Button>
          <Button onClick={() => { setEditingId(null); setShowModal(true); }}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t('suppliers.addNew')}
        </Button>
      </div>
    </div>
      <Input placeholder={t('app.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      <DataTable columns={columns} data={filtered} emptyMessage={t('app.noData')} />
      
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? t('suppliers.editSupplier') : t('suppliers.addNew')}>
        <SupplierForm supplierId={editingId} onSave={() => setShowModal(false)} onCancel={() => setShowModal(false)} />
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
        onConfirm={() => { deleteSupplier(deleteConfirmId!); }}
        title={t('app.deleteConfirm')}
        message={t('app.deleteConfirm')}
        confirmLabel={t('app.yesDelete')}
        cancelLabel={t('app.cancel')}
      />
    </div>
  );
}

function SupplierForm({ supplierId, onSave, onCancel }: { supplierId: string | null; onSave: () => void; onCancel: () => void }) {
  const { t } = useLanguage();
  const store = useAppStore();
  const existing = supplierId ? store.suppliers.find(s => s.id === supplierId) : null;
  const [name, setName] = useState(existing?.name || '');
  const [phone, setPhone] = useState(existing?.phone || '');
  const [email, setEmail] = useState(existing?.email || '');
  const [address, setAddress] = useState(existing?.address || '');
  const [taxNumber, setTaxNumber] = useState(existing?.taxNumber || '');
  const [paymentTerms, setPaymentTerms] = useState(String(existing?.paymentTerms || 30));
  const [notes, setNotes] = useState(existing?.notes || '');

  const handleSave = () => {
    const data = { name, nameAr: name, phone, email, address, taxNumber, paymentTerms: parseInt(paymentTerms) || 30, notes, totalPOs: existing?.totalPOs || 0, totalPaid: existing?.totalPaid || 0, balanceDue: existing?.balanceDue || 0 };
    if (existing) {
      store.updateSupplier(existing.id, data);
    } else {
      store.addSupplier(data);
    }
    onSave();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label={t('suppliers.name')} value={name} onChange={(e) => setName(e.target.value)} />
        <Input label={t('suppliers.phone')} value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label={t('suppliers.email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label={t('suppliers.address')} value={address} onChange={(e) => setAddress(e.target.value)} />
        <Input label={t('suppliers.taxNumber')} value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} />
        <Input label={t('suppliers.paymentTerms')} type="number" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
      </div>
      <div>
        <label className="label">{t('suppliers.notes')}</label>
        <textarea className="input mt-1 min-h-[60px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>{t('app.cancel')}</Button>
        <Button onClick={handleSave}>{t('app.save')}</Button>
      </div>
    </div>
  );
}
