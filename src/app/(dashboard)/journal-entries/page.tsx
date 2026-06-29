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
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { Trash2 } from 'lucide-react';

export default function JournalEntriesPage() {
  const { language, t } = useLanguage();
  const store = useAppStore();
  const { journalEntries, chartOfAccounts } = store;
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAccounts, setShowAccounts] = useState(false);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const columns = [
    { key: 'date', header: t('journal.date'), render: (item: any) => formatDate(item.date) },
    { key: 'referenceNumber', header: t('journal.referenceNumber') },
    { key: 'description', header: t('journal.description'), render: (item: any) => language === 'ar' ? (item.descriptionAr || item.description) : item.description },
    { key: 'totalDebit', header: t('journal.totalDebit'), render: (item: any) => formatCurrency(item.totalDebit, 'EGP', language) },
    { key: 'totalCredit', header: t('journal.totalCredit'), render: (item: any) => formatCurrency(item.totalCredit, 'EGP', language) },
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
    store.clearModuleData('journalEntries');
    setShowDeleteAll(false);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('journal.title')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowDeleteAll(true)} className="gap-2 text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950">
            <Trash2 className="h-4 w-4" />
            {t('app.deleteAll')}
          </Button>
          <Button variant="outline" onClick={() => setShowAccounts(true)}>
            {t('journal.chartOfAccounts')}
          </Button>
          <Button onClick={() => { setEditingId(null); setShowModal(true); }}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {t('journal.addNew')}
          </Button>
        </div>
      </div>
      <DataTable columns={columns} data={journalEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())} emptyMessage={t('app.noData')} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? t('journal.editEntry') : t('journal.addNew')} size="wide">
        <JournalEntryForm entryId={editingId} onSave={() => setShowModal(false)} onCancel={() => setShowModal(false)} />
      </Modal>

      <Modal isOpen={showAccounts} onClose={() => setShowAccounts(false)} title={t('journal.chartOfAccounts')} size="wide">
        <ChartOfAccountsForm onClose={() => setShowAccounts(false)} />
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
        onConfirm={() => { store.deleteJournalEntry(deleteConfirmId!); }}
        title={t('app.deleteConfirm')}
        message={t('app.deleteConfirm')}
        confirmLabel={t('app.yesDelete')}
        cancelLabel={t('app.cancel')}
      />
    </div>
  );
}

function JournalEntryForm({ entryId, onSave, onCancel }: { entryId: string | null; onSave: () => void; onCancel: () => void }) {
  const { t, language } = useLanguage();
  const store = useAppStore();
  const existing = entryId ? store.journalEntries.find(e => e.id === entryId) : null;
  const [date, setDate] = useState(existing?.date || new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState(existing?.referenceNumber || `JE-${String(store.journalEntries.length + 1).padStart(3, '0')}`);
  const [description, setDescription] = useState(existing?.description || '');
  const [descriptionAr, setDescriptionAr] = useState(existing?.descriptionAr || '');
  const [lines, setLines] = useState<any[]>(existing?.lines || [{ id: '1', accountId: '', debit: 0, credit: 0, description: '', descriptionAr: '' }]);

  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const difference = totalDebit - totalCredit;

  const addLine = () => setLines([...lines, { id: String(Date.now()), accountId: '', debit: 0, credit: 0, description: '', descriptionAr: '' }]);
  const updateLine = (idx: number, field: string, value: any) => {
    const newLines = [...lines];
    newLines[idx] = { ...newLines[idx], [field]: value };
    setLines(newLines);
  };
  const removeLine = (idx: number) => { if (lines.length > 1) setLines(lines.filter((_, i) => i !== idx)); };

  const handleSave = () => {
    const journalLines = lines.map(l => ({
      id: l.id, journalEntryId: '', accountId: l.accountId,
      debit: parseFloat(l.debit) || 0, credit: parseFloat(l.credit) || 0,
      description: l.description, descriptionAr: l.descriptionAr,
    }));

    if (existing) {
      store.updateJournalEntry(existing.id, { date, referenceNumber, description, descriptionAr, lines: journalLines, totalDebit, totalCredit, attachments: [] });
    } else {
      store.addJournalEntry({ date, referenceNumber, description, descriptionAr, lines: journalLines, totalDebit, totalCredit, attachments: [] });
    }
    onSave();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label={t('journal.date')} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input label={t('journal.referenceNumber')} value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} />
        <Input label={t('journal.description')} value={description} onChange={(e) => setDescription(e.target.value)} />
        <Input label={t('journal.descriptionAr')} value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{t('journal.debit')} / {t('journal.credit')}</p>
          <Button variant="outline" size="sm" onClick={addLine}>+ Add Line</Button>
        </div>
        {lines.map((line, idx) => (
          <div key={line.id} className="flex items-start gap-2 rounded-lg border p-3 dark:border-slate-700">
            <div className="flex-1">
              <Select value={line.accountId} onChange={(e) => updateLine(idx, 'accountId', e.target.value)}
                options={store.chartOfAccounts.map(a => ({ value: a.id, label: `${a.code} - ${language === 'ar' ? a.nameAr : a.name}` }))}
                placeholder={t('journal.account')} />
            </div>
            <Input type="number" className="w-24" placeholder={t('journal.debit')} value={line.debit} onChange={(e) => updateLine(idx, 'debit', e.target.value)} />
            <Input type="number" className="w-24" placeholder={t('journal.credit')} value={line.credit} onChange={(e) => updateLine(idx, 'credit', e.target.value)} />
            <button className="btn-ghost p-1 text-red-600" onClick={() => removeLine(idx)}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3 dark:border-slate-700">
        <div className="flex gap-6 text-sm">
          <span>{t('journal.totalDebit')}: <strong>{formatCurrency(totalDebit, 'EGP', language)}</strong></span>
          <span>{t('journal.totalCredit')}: <strong>{formatCurrency(totalCredit, 'EGP', language)}</strong></span>
          <span className={difference !== 0 ? 'text-red-600 font-bold' : 'text-emerald-600'}>
            {t('journal.difference')}: {formatCurrency(difference, 'EGP', language)}
            {difference !== 0 && ` (${t('journal.mustBalance')})`}
          </span>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>{t('app.cancel')}</Button>
        <Button onClick={handleSave} disabled={difference !== 0}>{t('app.save')}</Button>
      </div>
    </div>
  );
}

function ChartOfAccountsForm({ onClose }: { onClose: () => void }) {
  const { t, language } = useLanguage();
  const store = useAppStore();
  const { chartOfAccounts, addChartOfAccount, deleteChartOfAccount } = store;
  const [newName, setNewName] = useState('');
  const [newNameAr, setNewNameAr] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'asset' | 'liability' | 'equity' | 'income' | 'expense'>('asset');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newName || !newCode) return;
    addChartOfAccount({ name: newName, nameAr: newNameAr, code: newCode, type: newType, parentId: null, balance: 0 });
    setNewName(''); setNewNameAr(''); setNewCode('');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end">
        <Input placeholder={t('journal.accountCode')} value={newCode} onChange={(e) => setNewCode(e.target.value)} className="w-24" />
        <Input placeholder={t('journal.account')} value={newName} onChange={(e) => setNewName(e.target.value)} />
        <Input placeholder={t('journal.accountAr')} value={newNameAr} onChange={(e) => setNewNameAr(e.target.value)} />
        <Select value={newType} onChange={(e) => setNewType(e.target.value as any)}
          options={[
            { value: 'asset', label: 'Asset' }, { value: 'liability', label: 'Liability' },
            { value: 'equity', label: 'Equity' }, { value: 'income', label: 'Income' },
            { value: 'expense', label: 'Expense' },
          ]} className="w-32" />
        <Button size="sm" onClick={handleAdd}>{t('journal.addAccount')}</Button>
      </div>
      <div className="max-h-64 space-y-1 overflow-y-auto">
        {chartOfAccounts.map(acc => (
          <div key={acc.id} className="flex items-center justify-between rounded-lg border p-2 text-sm dark:border-slate-700">
            <div>
              <span className="font-mono text-xs text-slate-500">{acc.code}</span>
              <span className="ml-2">{language === 'ar' ? acc.nameAr : acc.name}</span>
              <span className="ml-2 text-xs text-slate-400">({acc.type})</span>
            </div>
            <button className="btn-ghost p-1 text-red-600" onClick={() => setDeleteConfirmId(acc.id)}>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>{t('app.close')}</Button>
      </div>

      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => { deleteChartOfAccount(deleteConfirmId!); }}
        title={t('app.deleteConfirm')}
        message={t('app.deleteConfirm')}
        confirmLabel={t('app.yesDelete')}
        cancelLabel={t('app.cancel')}
      />
    </div>
  );
}
