'use client';

import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '@/providers/language-provider';
import { useAppStore } from '@/stores/use-app-store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { Trash2, Plus, Pencil } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/confirm-modal';

export default function TreasuryPage() {
  const { language, t } = useLanguage();
  const store = useAppStore();
  const { treasuryAccounts, treasuryTransactions } = store;
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);

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
    { key: 'amount', header: t('invoices.total'), render: (item: any) => {
      const acc = treasuryAccounts.find(a => a.id === item.accountId);
      const currency = acc?.currency || 'EGP';
      return (
        <span className={item.type === 'income' ? 'text-emerald-600' : 'text-red-600'}>
          {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount, currency, language)}
        </span>
      );
    }, sortable: true },
    { key: 'paymentMethod', header: t('treasury.paymentMethod'), render: (item: any) => {
      const pm = store.paymentMethods.find(p => p.id === item.paymentMethod);
      return pm ? (language === 'ar' ? pm.nameAr : pm.name) : item.paymentMethod;
    }},
    { key: 'description', header: t('treasury.description'), render: (item: any) => language === 'ar' ? (item.descriptionAr || item.description) : item.description },
    { key: 'accountId', header: t('treasury.account'), render: (item: any) => {
      const acc = treasuryAccounts.find(a => a.id === item.accountId);
      return acc ? (language === 'ar' ? acc.nameAr : acc.name) : '-';
    }},
    { key: 'reconciled', header: t('treasury.reconciled'), render: (item: any) => (
      <button
        onClick={() => store.updateTreasuryTransaction(item.id, {
          isReconciled: !item.isReconciled,
          reconciledAt: !item.isReconciled ? new Date().toISOString() : null,
        })}
        className={`btn-ghost btn-sm px-2 py-0.5 text-xs rounded ${item.isReconciled ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950' : 'text-slate-400'}`}
      >
        {item.isReconciled ? t('treasury.reconciled') : t('treasury.reconcile')}
      </button>
    )},
    { key: 'recurring', header: t('treasury.recurring'), render: (item: any) => item.isRecurring ? (
      <span className="text-xs text-blue-600 font-medium">
        {item.recurringPattern === 'daily' ? t('treasury.everyDay')
          : item.recurringPattern === 'weekly' ? t('treasury.everyWeek')
          : item.recurringPattern === 'monthly' ? t('treasury.everyMonth')
          : item.recurringPattern === 'yearly' ? t('treasury.everyYear')
          : item.recurringPattern}
      </span>
    ) : '-'},
    { key: 'actions', header: '', render: (item: any) => (
      <div className="flex gap-1 justify-end">
        <button className="btn-ghost btn-sm p-1" onClick={() => { setEditingId(item.id); setShowModal(true); }}>
          <Pencil className="h-4 w-4" />
        </button>
        <button className="btn-ghost btn-sm p-1 text-red-600" onClick={() => setDeleteConfirmId(item.id)}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    )},
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
          <Button variant="outline" onClick={() => setShowAccountModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('treasury.newAccount')}
          </Button>
          <Button variant="outline" onClick={() => setShowDeleteAll(true)} className="gap-2 text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950">
            <Trash2 className="h-4 w-4" />
            {t('app.deleteAll')}
          </Button>
          <Button onClick={() => { setEditingId(null); setShowModal(true); }} className="gap-2">
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
          <div key={acc.id} className="kpi-card relative group">
            <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
              <button className="btn-ghost btn-sm p-1" onClick={() => { setEditingAccountId(acc.id); setShowAccountModal(true); }}>
                <Pencil className="h-3 w-3" />
              </button>
              <button className="btn-ghost btn-sm p-1 text-red-600" onClick={() => setDeleteAccountId(acc.id)}>
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
            <p className="kpi-label">{language === 'ar' ? acc.nameAr : acc.name}</p>
            <p className="kpi-value">{formatCurrency(acc.balance, acc.currency || 'EGP', language)}</p>
            <p className="text-xs text-slate-400 mt-1">{acc.currency || 'EGP'} - {acc.type}</p>
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

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingId(null); }} title={editingId ? t('app.edit') : t('treasury.addTransaction')} size="wide">
        <TransactionForm transactionId={editingId} onSave={() => { setShowModal(false); setEditingId(null); }} onCancel={() => { setShowModal(false); setEditingId(null); }} />
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
        onConfirm={() => {
          const tx = treasuryTransactions.find(t => t.id === deleteConfirmId);
          if (tx) {
            const acc = treasuryAccounts.find(a => a.id === tx.accountId);
            if (acc) {
              if (tx.type === 'income') store.updateTreasuryAccount(tx.accountId, { balance: (acc.balance || 0) - tx.amount });
              else if (tx.type === 'expense') store.updateTreasuryAccount(tx.accountId, { balance: (acc.balance || 0) + tx.amount });
              else if (tx.type === 'transfer') {
                const toAcc = treasuryAccounts.find(a => a.id === tx.toAccountId);
                if (toAcc) store.updateTreasuryAccount(tx.toAccountId!, { balance: (toAcc.balance || 0) - tx.amount });
                store.updateTreasuryAccount(tx.accountId, { balance: (acc.balance || 0) + tx.amount });
              }
            }
            store.deleteTreasuryTransaction(deleteConfirmId!);
          }
          setDeleteConfirmId(null);
        }}
        title={t('app.deleteConfirm')}
        message={t('app.deleteConfirm')}
        confirmLabel={t('app.yesDelete')}
        cancelLabel={t('app.cancel')}
      />

      <Modal isOpen={showAccountModal} onClose={() => { setShowAccountModal(false); setEditingAccountId(null); }} title={editingAccountId ? t('app.edit') : t('treasury.newAccount')}>
        <AccountForm accountId={editingAccountId} onSave={() => { setShowAccountModal(false); setEditingAccountId(null); }} onCancel={() => { setShowAccountModal(false); setEditingAccountId(null); }} />
      </Modal>

      <ConfirmModal
        isOpen={deleteAccountId !== null}
        onClose={() => setDeleteAccountId(null)}
        onConfirm={() => {
          store.deleteTreasuryAccount(deleteAccountId!);
          setDeleteAccountId(null);
        }}
        title={t('app.deleteConfirm')}
        message={t('app.deleteConfirm')}
        confirmLabel={t('app.yesDelete')}
        cancelLabel={t('app.cancel')}
      />
    </div>
  );
}

function TransactionForm({ transactionId, onSave, onCancel }: { transactionId: string | null; onSave: () => void; onCancel: () => void }) {
  const { t, language } = useLanguage();
  const store = useAppStore();
  const existing = transactionId ? store.treasuryTransactions.find(t => t.id === transactionId) : null;

  useEffect(() => {
    if (store.treasuryAccounts.length === 0) {
      store.addTreasuryAccount({
        name: 'Main Cash', nameAr: 'الخزينة الرئيسية', type: 'cash',
        balance: 0, currency: 'EGP', isDefault: true,
      });
    }
  }, []);

  const accounts = store.treasuryAccounts;

  const [type, setType] = useState<'income' | 'expense' | 'transfer'>(existing?.type || 'income');
  const [amount, setAmount] = useState(existing?.amount?.toString() || '');
  const [date, setDate] = useState(existing?.date?.split('T')[0] || new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState(existing?.accountId || accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(existing?.toAccountId || '');
  const [paymentMethod, setPaymentMethod] = useState(existing?.paymentMethod || store.paymentMethods[0]?.id || 'cash');
  const [description, setDescription] = useState(existing?.description || '');
  const [descriptionAr, setDescriptionAr] = useState(existing?.descriptionAr || '');
  const [isRecurring, setIsRecurring] = useState(existing?.isRecurring || false);
  const [recurringPattern, setRecurringPattern] = useState(existing?.recurringPattern || 'monthly');

  const numAmount = parseFloat(amount) || 0;
  const isValid = numAmount > 0 && accountId && (type !== 'transfer' || toAccountId);

  const handleSave = () => {
    if (!isValid) return;

    const paymentMethodName = store.paymentMethods.find(p => p.id === paymentMethod);
    const paymentMethodDetail = paymentMethodName ? (language === 'ar' ? paymentMethodName.nameAr : paymentMethodName.name) : paymentMethod;

    if (existing) {
      // Reverse old balance effects
      const oldAcc = store.treasuryAccounts.find(a => a.id === existing.accountId);
      if (oldAcc) {
        if (existing.type === 'income') store.updateTreasuryAccount(existing.accountId, { balance: (oldAcc.balance || 0) - existing.amount });
        else if (existing.type === 'expense') store.updateTreasuryAccount(existing.accountId, { balance: (oldAcc.balance || 0) + existing.amount });
        else if (existing.type === 'transfer') {
          const oldToAcc = store.treasuryAccounts.find(a => a.id === existing.toAccountId);
          if (oldToAcc) store.updateTreasuryAccount(existing.toAccountId!, { balance: (oldToAcc.balance || 0) - existing.amount });
          store.updateTreasuryAccount(existing.accountId, { balance: (oldAcc.balance || 0) + existing.amount });
        }
      }
      // Apply new balance effects
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
      store.updateTreasuryTransaction(existing.id, {
        type, amount: numAmount, date, accountId,
        fromAccountId: type === 'transfer' ? accountId : null,
        toAccountId: type === 'transfer' ? toAccountId : null,
        paymentMethod, paymentMethodDetail,
        description, descriptionAr,
        isRecurring, recurringPattern: isRecurring ? recurringPattern : null, nextOccurrence: isRecurring ? date : null,
      });
    } else {
      store.addTreasuryTransaction({
        type, amount: numAmount, date, accountId,
        fromAccountId: type === 'transfer' ? accountId : null,
        toAccountId: type === 'transfer' ? toAccountId : null,
        paymentMethod, paymentMethodDetail,
        categoryId: '', description, descriptionAr,
        referenceNumber: '', receiptUrl: '',
        linkedInvoiceId: null, linkedPOId: null, linkedReturnId: null,
        isRecurring, recurringPattern: isRecurring ? recurringPattern : null, nextOccurrence: isRecurring ? date : null,
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
          <span className="text-sm font-medium">{t('treasury.recurring')}</span>
        </label>
        {isRecurring && (
          <Select value={recurringPattern} onChange={(e) => setRecurringPattern(e.target.value)}
            options={[
              { value: 'daily', label: t('treasury.everyDay') },
              { value: 'weekly', label: t('treasury.everyWeek') },
              { value: 'monthly', label: t('treasury.everyMonth') },
              { value: 'yearly', label: t('treasury.everyYear') },
            ]} className="w-40" />
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>{t('app.cancel')}</Button>
        <Button onClick={handleSave} disabled={!isValid}>{t('app.save')}</Button>
      </div>
    </div>
  );
}

function AccountForm({ accountId, onSave, onCancel }: { accountId: string | null; onSave: () => void; onCancel: () => void }) {
  const { t, language } = useLanguage();
  const store = useAppStore();
  const existing = accountId ? store.treasuryAccounts.find(a => a.id === accountId) : null;

  const [name, setName] = useState(existing?.name || '');
  const [nameAr, setNameAr] = useState(existing?.nameAr || '');
  const [type, setType] = useState(existing?.type || 'cash');
  const [currency, setCurrency] = useState(existing?.currency || 'EGP');
  const [isDefault, setIsDefault] = useState(existing?.isDefault || false);

  const isValid = name.trim().length > 0;

  const handleSave = () => {
    if (!isValid) return;
    if (existing) {
      store.updateTreasuryAccount(existing.id, { name, nameAr, type, currency, isDefault });
    } else {
      store.addTreasuryAccount({ name, nameAr, type, balance: 0, currency, isDefault });
    }
    onSave();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label={t('treasury.accountName') + ' (EN)'} value={name} onChange={(e) => setName(e.target.value)} />
        <Input label={t('treasury.accountName') + ' (AR)'} value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
        <Select label={t('reports.accountType')} value={type} onChange={(e) => setType(e.target.value as any)}
          options={[
            { value: 'cash', label: t('treasury.cash') },
            { value: 'bank', label: t('treasury.bank') },
            { value: 'vodafone_cash', label: 'Vodafone Cash' },
            { value: 'instapay', label: 'Instapay' },
          ]} />
        <Select label={t('app.currency')} value={currency} onChange={(e) => setCurrency(e.target.value)}
          options={[
            { value: 'EGP', label: 'EGP' },
            { value: 'USD', label: 'USD' },
            { value: 'EUR', label: 'EUR' },
            { value: 'SAR', label: 'SAR' },
          ]} />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
        <span className="text-sm font-medium">{t('app.default')}</span>
      </label>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>{t('app.cancel')}</Button>
        <Button onClick={handleSave} disabled={!isValid}>{t('app.save')}</Button>
      </div>
    </div>
  );
}