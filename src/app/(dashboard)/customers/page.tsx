'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/providers/language-provider';
import { useAppStore } from '@/stores/use-app-store';
import { formatCurrency, readFileAsArrayBuffer } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { Badge } from '@/components/ui/badge';
import { Trash2, Upload } from 'lucide-react';
import { PAYMENT_METHODS } from '@/lib/constants';

export default function CustomersPage() {
  const { language, t } = useLanguage();
  const store = useAppStore();
  const { customers, invoices, addCustomer, updateCustomer, deleteCustomer, clearModuleData } = store;
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [importing, setImporting] = useState(false);
  const [parsedRows, setParsedRows] = useState<{
    name: string; totalDebt: number; collected: number; remaining: number;
    valid: boolean; reason: string; selected: boolean; rowIndex: number; isExisting: boolean;
  }[]>([]);
  const [importResult, setImportResult] = useState<{ imported: number; updated: number; skipped: number; errors: string[] } | null>(null);

  const filtered = useMemo(() => {
    let result = [...customers];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(s) || (c.nameAr && c.nameAr.toLowerCase().includes(s)) || c.phone.includes(s) || (c.email && c.email.toLowerCase().includes(s)));
    }
    return result;
  }, [customers, search]);

  const customerTotals = useMemo(() => {
    const map: Record<string, { totalInvoiced: number; totalPaid: number; totalDue: number }> = {};
    for (const c of customers) {
      const custInvoices = invoices.filter(i => i.customerId === c.id);
      const totalInvoiced = custInvoices.reduce((s, i) => s + i.grandTotal, 0);
      const totalPaid = custInvoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
      map[c.id] = { totalInvoiced, totalPaid, totalDue: totalInvoiced - totalPaid };
    }
    return map;
  }, [customers, invoices]);

  const columns = [
    { key: 'name', header: t('customers.name'), sortable: true, render: (item: any) => language === 'ar' ? item.nameAr || item.name : item.name },
    { key: 'phone', header: t('customers.phone') },
    { key: 'email', header: t('customers.email') },
    { key: 'totalInvoiced', header: t('customers.totalInvoiced'), render: (item: any) => formatCurrency(customerTotals[item.id]?.totalInvoiced || 0, 'EGP', language) },
    { key: 'totalPaid', header: t('customers.totalPaid'), render: (item: any) => formatCurrency(customerTotals[item.id]?.totalPaid || 0, 'EGP', language) },
    { key: 'totalDue', header: t('customers.totalDue'), render: (item: any) => formatCurrency(customerTotals[item.id]?.totalDue || 0, 'EGP', language) },
    { key: 'creditLimit', header: t('customers.creditLimit'), render: (item: any) => formatCurrency(item.creditLimit, 'EGP', language) },
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
    clearModuleData('customers');
    setShowDeleteAll(false);
  };

  const getCol = (row: any, ...keys: string[]) => {
    const rowKeys = Object.keys(row);
    for (const k of keys) {
      const match = rowKeys.find(rk => rk.toLowerCase() === k.toLowerCase());
      if (match && row[match] !== undefined && row[match] !== '') return String(row[match]).trim();
    }
    return '';
  };

  const toNumber = (raw: string) => {
    const ar = '٠١٢٣٤٥٦٧٨٩';
    const fa = '۰۱۲۳۴۵۶۷۸۹';
    let s = String(raw || '');
    for (let i = 0; i < 10; i++) {
      s = s.split(ar[i]).join(String(i)).split(fa[i]).join(String(i));
    }
    s = s.replace(/[^0-9.]/g, '');
    return parseFloat(s) || 0;
  };

  const parseFile = async (file: File) => {
    setImporting(true);
    setImportStep('upload');
    try {
      const XLSX = await import('xlsx');
      const buffer = await readFileAsArrayBuffer(file);
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);
      const parsed = rows.map((row, i) => {
        const name = getCol(row, 'العميل', 'customer', 'customer name', 'customer_name', 'customerName', 'client', 'name');
        const totalDebt = toNumber(getCol(row, 'اجمالي الفواتير', 'total invoices', 'total_invoices', 'totalInvoices', 'debt', 'totalDebt', 'total invoiced'));
        const collected = toNumber(getCol(row, 'المحصل', 'collected', 'total paid', 'total_paid', 'totalPaid', 'paid'));
        const remaining = toNumber(getCol(row, 'المتبقي', 'remaining', 'remaining balance', 'remaining_balance', 'remainingBalance', 'balance', 'due'));
        let valid = true;
        let reason = '';
        if (!name) { valid = false; reason = t('customerImport.missingName'); }
        const normalized = name.trim().toLowerCase();
        const isExisting = valid && customers.some(c => (c.name || '').toLowerCase().trim() === normalized || (c.nameAr || '').toLowerCase().trim() === normalized);
        return { name, totalDebt, collected, remaining, valid, reason, selected: valid, rowIndex: i, isExisting };
      });
      const seenNames = new Set<string>();
      parsed.forEach((row, i) => {
        const normalized = row.name.trim().toLowerCase();
        if (row.valid && normalized && seenNames.has(normalized)) {
          row.valid = false;
          row.reason = t('customerImport.duplicateName');
          row.selected = false;
        }
        if (normalized) seenNames.add(normalized);
      });
      setParsedRows(parsed);
      setImportStep('preview');
    } catch (e: any) {
      setImportResult({ imported: 0, updated: 0, skipped: 0, errors: [e.message] });
      setImportStep('result');
    } finally {
      setImporting(false);
    }
  };

  const toggleRow = (index: number) => {
    setParsedRows(prev => prev.map((r, i) => i === index ? { ...r, selected: !r.selected } : r));
  };

  const toggleSelectAll = () => {
    const allSelected = parsedRows.every(r => r.selected || !r.valid);
    setParsedRows(prev => prev.map(r => r.valid ? { ...r, selected: !allSelected } : r));
  };

  const executeImport = async () => {
    const selected = parsedRows.filter(r => r.selected);
    if (selected.length === 0) return;
    setImporting(true);
    try {
      const method = [...store.paymentMethods, ...PAYMENT_METHODS].find(p => p.id === 'cash');
      const result = await store.importCustomers(
        selected.map(r => ({ name: r.name, totalDebt: r.totalDebt, collected: r.collected, remaining: r.remaining })),
        {
          openingBalanceLabel: t('customerImport.openingBalance'),
          paymentReceivedLabel: t('customerImport.paymentReceived'),
          treasuryNote: t('customerImport.treasuryNote'),
          cashLabel: method ? (method.nameAr || method.name) : 'cash',
        }
      );
      setImportResult({ imported: result.imported, updated: result.updated, skipped: parsedRows.length - selected.length, errors: [] });
    } catch (e: any) {
      setImportResult({ imported: 0, updated: 0, skipped: parsedRows.length - selected.length, errors: [e.message] });
    } finally {
      setImporting(false);
      setImportStep('result');
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('customers.title')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImport(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            {t('customerImport.title')}
          </Button>
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

      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => { deleteCustomer(deleteConfirmId!); }}
        title={t('app.deleteConfirm')}
        message={t('app.deleteConfirm')}
        confirmLabel={t('app.yesDelete')}
        cancelLabel={t('app.cancel')}
      />

      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => { if (!importing) { setShowImport(false); setImportResult(null); setImportStep('upload'); setParsedRows([]); } }} />
          <div className="relative bg-background rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-semibold mb-4">{t('customerImport.title')}</h2>

            {importStep === 'upload' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{t('import.dragDrop')}</p>
                <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) parseFile(f); }}>
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">{t('import.dragDrop')}</p>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    id="customer-excel-upload"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) parseFile(f); }}
                  />
                  <Button variant="outline" className="mt-3" onClick={() => document.getElementById('customer-excel-upload')?.click()}>
                    {t('import.selectFile')}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>{t('import.expectedColumns')}:</p>
                  <ul className="list-disc list-inside">
                    <li>{t('customerImport.customerName')} (<span dir="rtl">العميل</span>)</li>
                    <li>{t('customerImport.totalDebt')} (<span dir="rtl">اجمالي الفواتير</span>)</li>
                    <li>{t('customerImport.collected')} (<span dir="rtl">المحصل</span>)</li>
                    <li>{t('customerImport.remaining')} (<span dir="rtl">المتبقي</span>)</li>
                  </ul>
                </div>
                {importing && <p className="text-sm text-center text-primary">{t('import.processing')}</p>}
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => { setShowImport(false); setImportResult(null); setImportStep('upload'); setParsedRows([]); }}>{t('app.cancel')}</Button>
                </div>
              </div>
            )}

            {importStep === 'preview' && !importing && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {parsedRows.filter(r => r.valid).length} {t('import.valid')} / {parsedRows.length} {t('import.totalRows').toLowerCase()}
                  </p>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={parsedRows.filter(r => r.valid).every(r => r.selected)} onChange={toggleSelectAll} className="h-4 w-4" />
                    {t('import.selectAll')}
                  </label>
                </div>
                <div className="max-h-64 overflow-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="w-10 p-2 text-center">
                          <input type="checkbox" checked={parsedRows.filter(r => r.valid).every(r => r.selected)} onChange={toggleSelectAll} className="h-4 w-4" />
                        </th>
                        <th className="text-center p-2">#</th>
                        <th className="text-left p-2">{t('customerImport.customerName')}</th>
                        <th className="text-right p-2">{t('customerImport.totalDebt')}</th>
                        <th className="text-right p-2">{t('customerImport.collected')}</th>
                        <th className="text-right p-2">{t('customerImport.remaining')}</th>
                        <th className="text-center p-2">{t('app.status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((row, i) => (
                        <tr key={i} className={`border-b hover:bg-muted/50 ${!row.valid ? 'opacity-60' : ''}`}>
                          <td className="p-2 text-center">
                            <input type="checkbox" checked={row.selected} disabled={!row.valid}
                              onChange={() => toggleRow(i)} className="h-4 w-4" />
                          </td>
                          <td className="p-2 text-center font-mono text-xs">{i + 1}</td>
                          <td className="p-2">{row.name || '-'}</td>
                          <td className="p-2 text-right">{row.totalDebt > 0 ? formatCurrency(row.totalDebt, 'EGP', language) : '-'}</td>
                          <td className="p-2 text-right">{row.collected > 0 ? formatCurrency(row.collected, 'EGP', language) : '-'}</td>
                          <td className="p-2 text-right">{row.remaining > 0 ? formatCurrency(row.remaining, 'EGP', language) : '-'}</td>
                          <td className="p-2 text-center">
                            {row.valid ? (
                              row.isExisting ? (
                                <Badge variant="yellow">{t('customerImport.exists')}</Badge>
                              ) : (
                                <Badge variant="green">{t('import.valid')}</Badge>
                              )
                            ) : (
                              <span className="text-xs text-red-500">{row.reason}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" disabled={importing} onClick={() => { setImportStep('upload'); setParsedRows([]); }}>{t('import.importAnother')}</Button>
                  <Button onClick={executeImport} disabled={importing || !parsedRows.some(r => r.selected)}>
                    {importing ? t('import.processing') : `${t('import.importSelected')} (${parsedRows.filter(r => r.selected).length})`}
                  </Button>
                </div>
              </div>
            )}

            {importStep === 'result' && importResult && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{t('import.importComplete')}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span>{t('import.imported')}: <strong>{importResult.imported}</strong></span>
                  <span>{t('customerImport.updated')}: <strong>{importResult.updated}</strong></span>
                  <span>{t('import.skipped')}: <strong>{importResult.skipped}</strong></span>
                </div>
                {importResult.errors.length > 0 && (
                  <div>
                    <p className="text-sm text-red-500 mb-1">{t('import.errors')}:</p>
                    {importResult.errors.slice(0, 5).map((e, i) => (
                      <p key={i} className="text-xs text-red-400">- {e}</p>
                    ))}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setImportStep('upload'); setImportResult(null); setParsedRows([]); }}>{t('import.importAnother')}</Button>
                  <Button onClick={() => { setShowImport(false); setImportResult(null); setImportStep('upload'); setParsedRows([]); }}>{t('app.close')}</Button>
                </div>
              </div>
            )}
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
  const [phone, setPhone] = useState(existing?.phone || '');
  const [email, setEmail] = useState(existing?.email || '');
  const [address, setAddress] = useState(existing?.address || '');
  const [taxNumber, setTaxNumber] = useState(existing?.taxNumber || '');
  const [creditLimit, setCreditLimit] = useState(String(existing?.creditLimit || 0));

  const handleSave = () => {
    const data = { name, nameAr: name, phone, email, address, taxNumber, creditLimit: parseFloat(creditLimit) || 0, totalInvoiced: existing?.totalInvoiced || 0, totalPaid: existing?.totalPaid || 0, totalDue: existing?.totalDue || 0, customPricingRules: existing?.customPricingRules || [] };
    if (existing) {
      store.updateCustomer(existing.id, data);
    } else {
      store.addCustomer(data);
    }
    onSave();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label={t('customers.name')} value={name} onChange={(e) => setName(e.target.value)} />
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
