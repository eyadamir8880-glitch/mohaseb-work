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
import { ASSET_CATEGORIES } from '@/lib/constants';
import { Trash2 } from 'lucide-react';

export default function AssetsPage() {
  const { language, t } = useLanguage();
  const store = useAppStore();
  const { assets, addAsset, updateAsset, deleteAsset, clearModuleData } = store;
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDepreciation, setShowDepreciation] = useState<string | null>(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);

  const columns = [
    { key: 'name', header: t('assets.name'), sortable: true, render: (item: any) => language === 'ar' ? item.nameAr || item.name : item.name },
    { key: 'category', header: t('assets.category'), render: (item: any) => {
      const cat = ASSET_CATEGORIES.find(c => c.value === item.category);
      return cat ? (language === 'ar' ? cat.labelAr : cat.label) : item.category;
    }},
    { key: 'purchaseDate', header: t('assets.purchaseDate'), render: (item: any) => formatDate(item.purchaseDate) },
    { key: 'purchaseCost', header: t('assets.purchaseCost'), render: (item: any) => formatCurrency(item.purchaseCost, 'EGP', language) },
    { key: 'currentBookValue', header: t('assets.currentBookValue'), render: (item: any) => formatCurrency(item.currentBookValue, 'EGP', language) },
    { key: 'status', header: t('app.status'), render: (item: any) => (
      <span className={`badge ${item.status === 'active' ? 'badge-green' : 'badge-red'}`}>
        {item.status === 'active' ? t('employees.active') : t('assets.disposal')}
      </span>
    )},
    { key: 'actions', header: t('app.actions'), render: (item: any) => (
      <div className="flex gap-1">
        <button className="btn-ghost btn-sm p-1" onClick={() => { setEditingId(item.id); setShowModal(true); }}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button className="btn-ghost btn-sm p-1 text-blue-600" onClick={() => setShowDepreciation(item.id)} title={t('assets.depreciationSchedule')}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>
        <button className="btn-ghost btn-sm p-1 text-red-600" onClick={() => { if (confirm(t('app.deleteConfirm'))) deleteAsset(item.id); }}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    )},
  ];

  const selectedAsset = showDepreciation ? assets.find(a => a.id === showDepreciation) : null;

  const handleDeleteAll = () => {
    clearModuleData('assets');
    setShowDeleteAll(false);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('assets.title')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowDeleteAll(true)} className="gap-2 text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950">
            <Trash2 className="h-4 w-4" />
            {t('app.deleteAll')}
          </Button>
          <Button onClick={() => { setEditingId(null); setShowModal(true); }}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t('assets.addNew')}
        </Button>
      </div>
    </div>
      <DataTable columns={columns} data={assets} emptyMessage={t('app.noData')} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? t('assets.editAsset') : t('assets.addNew')}>
        <AssetForm assetId={editingId} onSave={() => setShowModal(false)} onCancel={() => setShowModal(false)} />
      </Modal>

      <Modal isOpen={!!showDepreciation} onClose={() => setShowDepreciation(null)} title={t('assets.depreciationSchedule')} size="wide">
        {selectedAsset && (
          <div className="space-y-4">
            <p className="text-lg font-medium">{language === 'ar' ? selectedAsset.nameAr : selectedAsset.name}</p>
            <p className="text-sm text-slate-500">
              {t('assets.purchaseCost')}: {formatCurrency(selectedAsset.purchaseCost, 'EGP', language)} | 
              {t('assets.currentBookValue')}: {formatCurrency(selectedAsset.currentBookValue, 'EGP', language)}
            </p>
            <table className="table w-full text-sm">
              <thead>
                <tr>
                  <th className="border-b p-2 text-left">{t('journal.date')}</th>
                  <th className="border-b p-2 text-left">{t('journal.debit')}</th>
                  <th className="border-b p-2 text-left">Accumulated</th>
                  <th className="border-b p-2 text-left">{t('assets.currentBookValue')}</th>
                </tr>
              </thead>
              <tbody>
                {(selectedAsset.depreciationRecords || []).map((rec: any) => (
                  <tr key={rec.id}>
                    <td className="border-b p-2">{formatDate(rec.date)}</td>
                    <td className="border-b p-2">{formatCurrency(rec.amount, 'EGP', language)}</td>
                    <td className="border-b p-2">{formatCurrency(rec.accumulatedDepreciation, 'EGP', language)}</td>
                    <td className="border-b p-2">{formatCurrency(rec.bookValue, 'EGP', language)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowDepreciation(null)}>{t('app.close')}</Button>
            </div>
          </div>
        )}
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

function AssetForm({ assetId, onSave, onCancel }: { assetId: string | null; onSave: () => void; onCancel: () => void }) {
  const { t, language } = useLanguage();
  const store = useAppStore();
  const existing = assetId ? store.assets.find(a => a.id === assetId) : null;
  const [name, setName] = useState(existing?.name || '');
  const [category, setCategory] = useState(existing?.category || 'equipment');
  const [purchaseDate, setPurchaseDate] = useState(existing?.purchaseDate || new Date().toISOString().split('T')[0]);
  const [purchaseCost, setPurchaseCost] = useState(String(existing?.purchaseCost || 0));
  const [salvageValue, setSalvageValue] = useState(String(existing?.salvageValue || 0));
  const [usefulLife, setUsefulLife] = useState(String(existing?.usefulLife || 5));
  const [depreciationMethod, setDepreciationMethod] = useState(existing?.depreciationMethod || 'straight_line');

  const cost = parseFloat(purchaseCost) || 0;
  const salvage = parseFloat(salvageValue) || 0;
  const life = parseInt(usefulLife) || 1;
  const annualDepreciation = depreciationMethod === 'straight_line' ? (cost - salvage) / life : (cost - salvage) * 0.2;
  const currentBookValue = cost - annualDepreciation;

  const handleSave = () => {
    const data = {
      name, nameAr: name, category, purchaseDate, purchaseCost: cost,
      salvageValue: salvage, usefulLife: life, depreciationMethod: depreciationMethod as any,
      currentBookValue, status: 'active' as const,
      disposalDate: null, disposalPrice: null, depreciationRecords: [],
    };
    if (existing) {
      store.updateAsset(existing.id, data);
    } else {
      store.addAsset(data);
    }
    onSave();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label={t('assets.name')} value={name} onChange={(e) => setName(e.target.value)} />
        <Select label={t('assets.category')} value={category} onChange={(e) => setCategory(e.target.value)}
          options={ASSET_CATEGORIES.map(c => ({ value: c.value, label: language === 'ar' ? c.labelAr : c.label }))} />
        <Input label={t('assets.purchaseDate')} type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
        <Input label={t('assets.purchaseCost')} type="number" value={purchaseCost} onChange={(e) => setPurchaseCost(e.target.value)} />
        <Input label={t('assets.salvageValue')} type="number" value={salvageValue} onChange={(e) => setSalvageValue(e.target.value)} />
        <Input label={t('assets.usefulLife')} type="number" value={usefulLife} onChange={(e) => setUsefulLife(e.target.value)} />
        <Select label={t('assets.depreciationMethod')} value={depreciationMethod} onChange={(e) => setDepreciationMethod(e.target.value as 'straight_line' | 'declining_balance')}
          options={[
            { value: 'straight_line', label: t('assets.straightLine') },
            { value: 'declining_balance', label: t('assets.decliningBalance') },
          ]} />
      </div>
      <div className="rounded-lg border p-3 text-sm dark:border-slate-700">
        <p>{t('assets.currentBookValue')}: <strong>{formatCurrency(currentBookValue, 'EGP', language)}</strong></p>
        <p className="text-xs text-slate-500">{t('assets.depreciationMethod')}: {annualDepreciation.toFixed(2)}/year</p>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>{t('app.cancel')}</Button>
        <Button onClick={handleSave}>{t('app.save')}</Button>
      </div>
    </div>
  );
}
