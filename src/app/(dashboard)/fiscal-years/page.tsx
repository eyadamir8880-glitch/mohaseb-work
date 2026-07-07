'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/providers/language-provider';
import { useAppStore } from '@/stores/use-app-store';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { generateId } from '@/lib/utils';

export default function FiscalYearsPage() {
  const { language, t } = useLanguage();
  const store = useAppStore();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [closeConfirmId, setCloseConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', nameAr: '', startDate: '', endDate: '' });

  const fiscalYears = useMemo(() =>
    [...store.fiscalYears].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
    [store.fiscalYears]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', nameAr: '', startDate: '', endDate: '' });
    setShowModal(true);
  };

  const openEdit = (fy: typeof store.fiscalYears[0]) => {
    setEditingId(fy.id);
    setForm({ name: fy.name, nameAr: fy.nameAr, startDate: fy.startDate.split('T')[0], endDate: fy.endDate.split('T')[0] });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name || !form.startDate || !form.endDate) return;
    if (editingId) {
      store.updateFiscalYear(editingId, {
        name: form.name, nameAr: form.nameAr,
        startDate: form.startDate, endDate: form.endDate,
      });
    } else {
      store.addFiscalYear({
        name: form.name, nameAr: form.nameAr,
        startDate: form.startDate, endDate: form.endDate,
        isClosed: false, closedAt: null,
      });
    }
    setShowModal(false);
  };

  const handleClose = (id: string) => {
    store.closeFiscalYear(id);
    setCloseConfirmId(null);
  };

  const openYears = fiscalYears.filter(fy => !fy.isClosed).length;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('fiscalYears.title')}</h1>
        <Button onClick={openCreate}>{t('fiscalYears.create')}</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="kpi-card">
          <p className="kpi-label">{t('reports.summary')}</p>
          <p className="kpi-value">{fiscalYears.length}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">{t('fiscalYears.isClosed') === 'Open' ? 'Open' : t('fiscalYears.isClosed') === 'مغلقة' ? 'مفتوحة' : t('app.all')}</p>
          <p className="kpi-value text-emerald-600">{openYears}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">{t('fiscalYears.isClosed')}</p>
          <p className="kpi-value text-red-600">{fiscalYears.filter(fy => fy.isClosed).length}</p>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>{t('fiscalYears.name')}</th>
              <th>{t('fiscalYears.startDate')}</th>
              <th>{t('fiscalYears.endDate')}</th>
              <th>{t('fiscalYears.isClosed')}</th>
              <th>{t('fiscalYears.closedAt')}</th>
              <th className="text-right">{t('app.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {fiscalYears.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-sm text-slate-500">{t('fiscalYears.noData')}</td></tr>
            ) : fiscalYears.map(fy => (
              <tr key={fy.id}>
                <td className="font-medium">{language === 'ar' ? fy.nameAr || fy.name : fy.name}</td>
                <td>{formatDate(fy.startDate, language)}</td>
                <td>{formatDate(fy.endDate, language)}</td>
                <td>
                  <span className={`badge ${fy.isClosed ? 'badge-red' : 'badge-green'}`}>
                    {fy.isClosed ? t('app.yes') : t('app.no')}
                  </span>
                </td>
                <td>{fy.closedAt ? formatDate(fy.closedAt, language) : '-'}</td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(fy)} disabled={fy.isClosed}>
                      {t('app.edit')}
                    </Button>
                    {!fy.isClosed && (
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setCloseConfirmId(fy.id)}>
                        {t('fiscalYears.close')}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => store.deleteFiscalYear(fy.id)}>
                      {t('app.delete')}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? t('fiscalYears.edit') : t('fiscalYears.create')}>
        <div className="space-y-4">
          <Input label={t('fiscalYears.name')} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input label={t('fiscalYears.nameAr')} value={form.nameAr} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))} />
          <Input type="date" label={t('fiscalYears.startDate')} value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
          <Input type="date" label={t('fiscalYears.endDate')} value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>{t('app.cancel')}</Button>
            <Button onClick={handleSave}>{t('app.save')}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={closeConfirmId !== null}
        onClose={() => setCloseConfirmId(null)}
        onConfirm={() => { if (closeConfirmId) handleClose(closeConfirmId); }}
        title={t('fiscalYears.close')}
        message={t('fiscalYears.confirmClose')}
      />
    </div>
  );
}
