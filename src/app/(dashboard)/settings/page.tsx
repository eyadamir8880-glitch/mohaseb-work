'use client';

import { useState } from 'react';
import { useLanguage } from '@/providers/language-provider';
import { useTheme } from '@/providers/theme-provider';
import { useAppStore } from '@/stores/use-app-store';
import { downloadAsJson, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';

export default function SettingsPage() {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const store = useAppStore();
  const [newPmName, setNewPmName] = useState('');
  const [newPmNameAr, setNewPmNameAr] = useState('');
  const [newPmType, setNewPmType] = useState('vodafone_cash');

  const handleSaveSession = () => {
    const snapshot = store.getStateSnapshot();
    downloadAsJson(snapshot, `mohasebeyad-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    store.addNotification({
      type: 'system', title: 'Session Saved', titleAr: 'تم حفظ الجلسة',
      message: 'Session backup downloaded', messageAr: 'تم تنزيل نسخة احتياطية',
      module: 'settings', recordId: '', isRead: false, readAt: null,
    });
  };

  const handleLoadSession = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const success = store.loadState(data);
        if (success) store.addNotification({ type: 'system', title: 'Session Loaded', titleAr: 'تم تحميل الجلسة', message: 'Session loaded successfully', messageAr: 'تم تحميل الجلسة بنجاح', module: 'settings', recordId: '', isRead: false, readAt: null });
        else alert(t('common.invalidBackup').replace('{module}', 'unknown'));
      } catch (err) { alert('Failed to load: ' + (err as Error).message); }
    };
    input.click();
  };

  const handleExportAll = () => {
    downloadAsJson(store.getStateSnapshot(), `mohasebeyad-full-export-${new Date().toISOString().split('T')[0]}.json`);
  };

  const handleResetData = () => {
    if (confirm('Reset all data to demo? This will delete all changes.')) {
      store.resetToDemo();
    }
  };

  const getSetting = (key: string) => {
    const setting = store.settings.find(s => s.key === key);
    return setting?.value ?? '';
  };

  const updateSetting = (key: string, value: string) => {
    store.updateSetting(key, value);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('settings.title')}</h1>
        <Button onClick={() => {
          store.updateSetting('_saved', Date.now().toString());
          store.addNotification({ type: 'system', title: 'Settings Saved', titleAr: 'تم حفظ الإعدادات', message: 'All settings have been saved', messageAr: 'تم حفظ جميع الإعدادات', module: 'settings', recordId: '', isRead: false, readAt: null });
        }}>
          {t('settings.saveSettings')}
        </Button>
      </div>

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company">{t('settings.company')}</TabsTrigger>
          <TabsTrigger value="invoice">{t('settings.invoice')}</TabsTrigger>
          <TabsTrigger value="payment">{t('settings.paymentMethods')}</TabsTrigger>
          <TabsTrigger value="data">{t('settings.dataManagement')}</TabsTrigger>
          <TabsTrigger value="import">{t('settings.importHistory')}</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Company Name (EN)" value={getSetting('companyName')} onChange={(e) => updateSetting('companyName', e.target.value)} />
            <Input label="Company Name (AR)" value={getSetting('companyNameAr')} onChange={(e) => updateSetting('companyNameAr', e.target.value)} />
            <Input label="Phone" value={getSetting('companyPhone')} onChange={(e) => updateSetting('companyPhone', e.target.value)} />
            <Input label="Email" value={getSetting('companyEmail')} onChange={(e) => updateSetting('companyEmail', e.target.value)} />
            <Input label="Address (EN)" value={getSetting('companyAddress')} onChange={(e) => updateSetting('companyAddress', e.target.value)} />
            <Input label="Address (AR)" value={getSetting('companyAddressAr')} onChange={(e) => updateSetting('companyAddressAr', e.target.value)} />
            <Input label="Tax Number" value={getSetting('companyTaxNumber')} onChange={(e) => updateSetting('companyTaxNumber', e.target.value)} />
            <Select label="Currency" value={getSetting('defaultCurrency')} onChange={(e) => updateSetting('defaultCurrency', e.target.value)}
              options={[{ value: 'EGP', label: 'EGP (ج.م)' }, { value: 'SAR', label: 'SAR (ر.س)' }, { value: 'USD', label: 'USD ($)' }]} />
          </div>
        </TabsContent>

        <TabsContent value="invoice" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Invoice Prefix" value={getSetting('invoicePrefix')} onChange={(e) => updateSetting('invoicePrefix', e.target.value)} />
            <Input label="Quotation Prefix" value={getSetting('quotationPrefix')} onChange={(e) => updateSetting('quotationPrefix', e.target.value)} />
            <Input label="PO Prefix" value={getSetting('poPrefix')} onChange={(e) => updateSetting('poPrefix', e.target.value)} />
            <Input label="Default Tax Rate (%)" type="number" value={getSetting('defaultTaxRate')} onChange={(e) => updateSetting('defaultTaxRate', e.target.value)} />
          </div>
          <div>
            <label className="label">Invoice Terms (EN)</label>
            <textarea className="input mt-1 min-h-[80px]" value={getSetting('invoiceTerms')} onChange={(e) => updateSetting('invoiceTerms', e.target.value)} />
          </div>
          <div>
            <label className="label">Invoice Terms (AR)</label>
            <textarea className="input mt-1 min-h-[80px]" value={getSetting('invoiceTermsAr')} onChange={(e) => updateSetting('invoiceTermsAr', e.target.value)} />
          </div>
        </TabsContent>

        <TabsContent value="payment" className="mt-4 space-y-4">
          <div className="space-y-2">
            {store.paymentMethods.map(pm => (
              <div key={pm.id} className="flex items-center justify-between rounded-lg border p-3 dark:border-slate-700">
                <div>
                  <p className="font-medium">{language === 'ar' ? pm.nameAr : pm.name}</p>
                  <p className="text-xs text-slate-500">{pm.type} | {pm.accountHolder} {pm.isProtected && '(Protected)'}</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-slate-500">{t('app.status')}</span>
                  <input type="checkbox" checked={pm.isActive}
                    onChange={() => store.updatePaymentMethod(pm.id, { isActive: !pm.isActive })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                </label>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 dark:border-slate-700">
            <p className="text-sm font-medium mb-2">Add Custom Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Name (EN)" value={newPmName} onChange={(e) => setNewPmName(e.target.value)} />
              <Input placeholder="Name (AR)" value={newPmNameAr} onChange={(e) => setNewPmNameAr(e.target.value)} />
              <Select options={[
                { value: 'vodafone_cash', label: 'Vodafone Cash' },
                { value: 'instapay', label: 'InstaPay' },
                { value: 'cash', label: 'Cash' },
                { value: 'bank', label: 'Bank Transfer' },
              ]} value={newPmType} onChange={(e) => setNewPmType(e.target.value)} />
            </div>
            <Button size="sm" className="mt-2" onClick={() => {
              if (newPmName) {
                store.addCustomPaymentMethod({ name: newPmName, nameAr: newPmNameAr || newPmName, type: newPmType, accountHolder: '', icon: '', isActive: true, sortOrder: store.paymentMethods.length + 1 });
                setNewPmName('');
                setNewPmNameAr('');
                setNewPmType('vodafone_cash');
                store.addNotification({ type: 'system', title: 'Payment Method Added', titleAr: 'تم إضافة طريقة الدفع', message: `${newPmName} has been added`, messageAr: `تم إضافة ${newPmNameAr || newPmName}`, module: 'settings', recordId: '', isRead: false, readAt: null });
              }
            }}>Add</Button>
          </div>
        </TabsContent>

        <TabsContent value="data" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <h3 className="card-title mb-2">{t('common.saveSession')}</h3>
              <p className="mb-4 text-sm text-slate-500">Download current state as JSON backup</p>
              <Button onClick={handleSaveSession} className="w-full">{t('common.saveSession')}</Button>
            </div>
            <div className="card">
              <h3 className="card-title mb-2">{t('common.loadSession')}</h3>
              <p className="mb-4 text-sm text-slate-500">Load a previously saved session file</p>
              <Button onClick={handleLoadSession} variant="outline" className="w-full">{t('common.loadSession')}</Button>
            </div>
            <div className="card">
              <h3 className="card-title mb-2">{t('settings.exportAll')}</h3>
              <p className="mb-4 text-sm text-slate-500">Export all data as JSON</p>
              <Button onClick={handleExportAll} variant="outline" className="w-full">{t('settings.exportAll')}</Button>
            </div>
            <div className="card">
              <h3 className="card-title mb-2">{t('settings.resetDemo')}</h3>
              <p className="mb-4 text-sm text-slate-500">Reset to demo data (irreversible)</p>
              <Button onClick={handleResetData} variant="danger" className="w-full">{t('settings.resetDemo')}</Button>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title mb-4">{t('app.theme')} & {t('app.language')}</h3>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-slate-500">{t('common.lightMode')} / {t('common.darkMode')}</p>
                <p className="font-medium capitalize">{theme}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">{t('app.language')}</p>
                <p className="font-medium">{language === 'en' ? 'English' : 'العربية'}</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="import" className="mt-4">
          <DataTable
            columns={[
              { key: 'filename', header: t('import.filename') },
              { key: 'uploadedAt', header: t('import.uploadedAt'), render: (item: any) => formatDate(item.uploadedAt) },
              { key: 'totalRows', header: t('import.totalRows') },
              { key: 'importedCount', header: t('import.imported') },
              { key: 'errorCount', header: t('import.errors') },
            ]}
            data={store.importHistory}
            emptyMessage={t('app.noData')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
