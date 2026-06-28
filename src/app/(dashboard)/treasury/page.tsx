'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/providers/language-provider';
import { useAppStore } from '@/stores/use-app-store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { Trash2, Plus } from 'lucide-react';

export default function TreasuryPage() {
  const { language, t } = useLanguage();
  const store = useAppStore();
  const { treasuryAccounts, treasuryTransactions } = store;
  const [showModal, setShowModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [showDeleteAll, setShowDeleteAll] = useState(false);

  const filtered = useMemo(() => {
    let result = [...treasuryTransactions];
    if (typeFilter) result = result.filter(t => t.type === typeFilter);
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [treasuryTransactions, typeFilter]);

  const columns = [
    { key: 'date', header: t('invoices.issueDate'), render: (item: any) => formatDate(item.date) },
    { key: 'type', header: t('app.type'), render: (item: any) => (
      <span className={`badge ${item.type === 'income' ? 'badge-green' : item.type === 'expense' ? 'badge-red' : 'badge-blue'}`}>
        {item.type === 'income' ? t('treasury.income') : item.type === 'expense' ? t('treasury.expense') : t('treasury.transfer')}
      </span>
    )},
    { key: 'amount', header: t('invoices.total'), render: (item: any) => (
      <span className={item.type === 'income' ? 'text-emerald-600' : 'text-red-600'}>
        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount, 'EGP', language)}
      </span>
    ), sortable: true },
    { key: 'paymentMethod', header: t('treasury.paymentMethod'), render: (item: any) => {
      const pm = store.paymentMethods.find(p => p.id === item.paymentMethod);
      return pm ? (language === 'ar' ? pm.nameAr : pm.name) : item.paymentMethod;
    }},
    { key: 'description', header: t('treasury.description'), render: (item: any) => language === 'ar' ? (item.descriptionAr || item.description) : item.description },
    { key: 'accountId', header: t('treasury.account'), render: (item: any) => {
      const acc = treasuryAccounts.find(a => a.id === item.accountId);
      return acc ? (language === 'ar' ? acc.nameAr : acc.name) : '-';
    }},
  ];

  const handleDeleteAll = () => {
    store.clearModuleData('treasuryTransactions');
    store.treasuryAccounts.forEach(acc => store.updateTreasuryAccount(acc.id, { balance: 0 }));
    setShowDeleteAll(false);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('treasury.title')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowDeleteAll(true)} className="gap-2 text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950">
            <Trash2 className="h-4 w-4" />
            {t('app.deleteAll')}
          </Button>
          <Button onClick={() => setShowModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('treasury.addTransaction')}
        </Button>
      </div>
    </div>

      {/* Account Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="kpi-card bg-primary/10 border-primary/30">
          <p className="kpi-label font-bold">{t('treasury.total')}</p>
          <p className="kpi-value text-primary">{formatCurrency(treasuryAccounts.reduce((s, a) => s + a.balance, 0), 'EGP', language)}</p>
        </div>
        {treasuryAccounts.map(acc => (
          <div key={acc.id} className="kpi-card">
            <p className="kpi-label">{language === 'ar' ? acc.nameAr : acc.name}</p>
            <p className="kpi-value">{formatCurrency(acc.balance, 'EGP', language)}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} options={[
          { value: '', label: t('app.filter') + '...' },
          { value: 'income', label: t('treasury.income') },
          { value: 'expense', label: t('treasury.expense') },
          { value: 'transfer', label: t('treasury.transfer') },
        ]} className="max-w-[180px]" />
      </div>

      <DataTable columns={columns} data={filtered} emptyMessage={t('app.noData')} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={t('treasury.addTransaction')} size="wide">
        <TransactionForm onSave={() => setShowModal(false)} onCancel={() => setShowModal(false)} />
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

function TransactionForm({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  const { t, language } = useLanguage();
  const store = useAppStore();

  // Auto-create default account if none exist
  let accounts = store.treasuryAccounts;
  if (accounts.length === 0) {
    store.addTreasuryAccount({
      name: 'Main Cash', nameAr: 'الخزينة الرئيسية', type: 'cash',
      balance: 0, currency: 'EGP', isActive: true,
    });
    accounts = store.treasuryAccounts;
  }

  const [type, setType] = useState<'income' | 'expense' | 'transfer'>('income');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(store.paymentMethods[0]?.id || 'cash');
  const [description, setDescription] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');

  const numAmount = parseFloat(amount) || 0;
  const isValid = numAmount > 0 && accountId && (type !== 'transfer' || toAccountId);

  const paymentMethodName = store.paymentMethods.find(p => p.id === paymentMethod);
  const paymentMethodDetail = paymentMethodName ? (language === 'ar' ? paymentMethodName.nameAr : paymentMethodName.name) : paymentMethod;

  const handleSave = () => {
    if (!isValid) return;
    store.addTreasuryTransaction({
      type, amount: numAmount, date, accountId,
      fromAccountId: type === 'transfer' ? accountId : null,
      toAccountId: type === 'transfer' ? toAccountId : null,
      paymentMethod, paymentMethodDetail,
      categoryId: '', description, descriptionAr,
      referenceNumber: '', receiptUrl: '',
      linkedInvoiceId: null, linkedPOId: null, linkedReturnId: null,
      isRecurring: false, recurringPattern: null, nextOccurrence: null,
      isReconciled: false, reconciledAt: null,
    });

    if (type === 'income') {
      const acc = store.treasuryAccounts.find(a => a.id === accountId);
      if (acc) store.updateTreasuryAccount(accountId, { balance: (acc.balance || 0) + numAmount });
    } else if (type === 'expense') {
      const acc = store.treasuryAccounts.find(a => a.id === accountId);
      if (acc) store.updateTreasuryAccount(accountId, { balance: (acc.balance || 0) - numAmount });
    } else if (type === 'transfer') {
      const fromAcc = store.treasuryAccounts.find(a => a.id === accountId);
      const toAcc = store.treasuryAccounts.find(a => a.id === toAccountId);
      if (fromAcc) store.updateTreasuryAccount(accountId, { balance: (fromAcc.balance || 0) - numAmount });
      if (toAcc) store.updateTreasuryAccount(toAccountId, { balance: (toAcc.balance || 0) + numAmount });
    }

    onSave();
  };

  return (
    <div className="space-y-4">
      <Select label={t('app.type')} value={type} onChange={(e) => setType(e.target.value as 'income' | 'expense' | 'transfer')}
        options={[
          { value: 'income', label: t('treasury.income') },
          { value: 'expense', label: t('treasury.expense') },
          { value: 'transfer', label: t('treasury.transfer') },
        ]} />
      
      <div className="grid grid-cols-2 gap-4">
        <Input label={t('invoices.paymentModal.amount')} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Input label={t('invoices.paymentModal.date')} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        
        {type !== 'transfer' && (
          <Select label={t('treasury.account')} value={accountId} onChange={(e) => setAccountId(e.target.value)}
            options={accounts.map(a => ({ value: a.id, label: language === 'ar' ? a.nameAr : a.name }))} />
        )}
        
        {type === 'transfer' && (
          <>
            <Select label={t('treasury.fromAccount')} value={accountId} onChange={(e) => setAccountId(e.target.value)}
              options={accounts.map(a => ({ value: a.id, label: language === 'ar' ? a.nameAr : a.name }))} />
            <Select label={t('treasury.toAccount')} value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}
              options={accounts.map(a => ({ value: a.id, label: language === 'ar' ? a.nameAr : a.name }))} />
          </>
        )}

        <Select label={t('treasury.paymentMethod')} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
          options={store.paymentMethods.filter(p => p.isActive).map(p => ({ value: p.id, label: language === 'ar' ? p.nameAr : p.name }))} />
        
        {type !== 'transfer' && (
          <>
            <Input label={t('treasury.description') + ' (EN)'} value={description} onChange={(e) => setDescription(e.target.value)} />
            <Input label={t('treasury.description') + ' (AR)'} value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} />
          </>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>{t('app.cancel')}</Button>
        <Button onClick={handleSave} disabled={!isValid}>{t('app.save')}</Button>
      </div>
    </div>
  );
}