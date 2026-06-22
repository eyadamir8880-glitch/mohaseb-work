'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/providers/language-provider';
import { useAppStore } from '@/stores/use-app-store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export default function CustomerAccountPage() {
  const { language, t } = useLanguage();
  const store = useAppStore();
  const { customers, invoices, customerStatements } = store;

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [showEntryForm, setShowEntryForm] = useState(false);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryRef, setEntryRef] = useState('');
  const [entryDesc, setEntryDesc] = useState('');
  const [entryDescAr, setEntryDescAr] = useState('');
  const [entryDebit, setEntryDebit] = useState('');
  const [entryCredit, setEntryCredit] = useState('');
  const [entryType, setEntryType] = useState<'payment' | 'opening_balance'>('payment');

  const customer = customers.find(c => c.id === selectedCustomerId);

  const statements = useMemo(() => {
    if (!selectedCustomerId) return [];
    return store.getCustomerStatements(selectedCustomerId);
  }, [selectedCustomerId, customerStatements, store]);

  const customerInvoices = useMemo(() => {
    if (!selectedCustomerId) return [];
    return invoices
      .filter(i => i.customerId === selectedCustomerId)
      .sort((a, b) => new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime());
  }, [selectedCustomerId, invoices]);

  const transactionRows = useMemo(() => {
    const rows: {
      date: string;
      reference: string;
      description: string;
      descriptionAr: string;
      debit: number;
      credit: number;
      type: string;
    }[] = [];

    let openingBalance = 0;

    customerInvoices.forEach(inv => {
      const total = inv.grandTotal;
      rows.push({
        date: inv.issueDate,
        reference: inv.invoiceNumber,
        description: `Invoice ${inv.invoiceNumber}`,
        descriptionAr: `فاتورة ${inv.invoiceNumber}`,
        debit: total,
        credit: 0,
        type: 'invoice',
      });
      openingBalance -= total;

      if (inv.payments?.length) {
        inv.payments.forEach((p: any) => {
          rows.push({
            date: p.paidAt?.split('T')[0] || inv.issueDate,
            reference: p.reference || inv.invoiceNumber,
            description: `Payment - ${p.paymentMethod}`,
            descriptionAr: `دفعة - ${p.paymentMethod}`,
            debit: 0,
            credit: p.amount,
            type: 'payment',
          });
          openingBalance += p.amount;
        });
      }
    });

    statements.forEach(s => {
      rows.push({
        date: s.date,
        reference: s.referenceNumber,
        description: s.description,
        descriptionAr: s.descriptionAr,
        debit: s.debit,
        credit: s.credit,
        type: s.type,
      });
      if (s.type === 'opening_balance') {
        openingBalance = s.credit - s.debit;
      }
    });

    rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
    let runningBalance = openingBalance;

    const withBalance = rows.map(r => {
      runningBalance += r.credit - r.debit;
      return { ...r, balance: runningBalance };
    });

    return {
      rows: withBalance,
      openingBalance,
      totalDebit,
      totalCredit,
      closingBalance: openingBalance + totalCredit - totalDebit,
    };
  }, [customerInvoices, statements]);

  const filteredRows = useMemo(() => {
    let result = transactionRows.rows;
    if (dateFrom) result = result.filter(r => r.date >= dateFrom);
    if (dateTo) result = result.filter(r => r.date <= dateTo);
    return result;
  }, [transactionRows, dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('customerAccount.title')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('customerAccount.selectCustomerHint')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()} className="gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            {t('customerAccount.print')}
          </Button>
        </div>
      </div>

      <div className="card p-5">
        <div className="grid grid-cols-3 gap-4">
          <Select
            label={t('customerAccount.selectCustomer')}
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            options={[
              { value: '', label: `-- ${t('customerAccount.selectCustomer')} --` },
              ...customers.map(c => ({ value: c.id, label: language === 'ar' ? c.nameAr : c.name })),
            ]}
          />
          <Input label={t('customerAccount.from')} type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <Input label={t('customerAccount.to')} type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      {customer && (
        <>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowEntryForm(!showEntryForm)} className="gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {t('customerAccount.addEntry')}
            </Button>
          </div>

          {showEntryForm && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-4">{t('customerAccount.addEntry')}</h3>
              <div className="grid grid-cols-3 gap-4">
                <Input label={t('customerAccount.date')} type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
                <Input label={t('customerAccount.reference')} value={entryRef} onChange={(e) => setEntryRef(e.target.value)} placeholder="e.g. MAN-001" />
                <Select label={t('customerAccount.type')} value={entryType} onChange={(e) => setEntryType(e.target.value as any)} options={[
                  { value: 'payment', label: t('customerAccount.payment') },
                  { value: 'opening_balance', label: t('customerAccount.openingBalance') },
                ]} />
                <Input label={t('customerAccount.description')} value={entryDesc} onChange={(e) => setEntryDesc(e.target.value)} placeholder="English description" />
                <Input label={t('customerAccount.descriptionAr')} value={entryDescAr} onChange={(e) => setEntryDescAr(e.target.value)} placeholder="الوصف بالعربية" />
                <Input label={t('customerAccount.debit')} type="number" value={entryDebit} onChange={(e) => setEntryDebit(e.target.value)} placeholder="0" />
                <Input label={t('customerAccount.credit')} type="number" value={entryCredit} onChange={(e) => setEntryCredit(e.target.value)} placeholder="0" />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => { setShowEntryForm(false); setEntryDate(new Date().toISOString().split('T')[0]); setEntryRef(''); setEntryDesc(''); setEntryDescAr(''); setEntryDebit(''); setEntryCredit(''); }}>{t('app.cancel')}</Button>
                <Button onClick={() => {
                  if (!entryDebit && !entryCredit) return;
                  store.addCustomerStatement({
                    customerId: selectedCustomerId,
                    date: entryDate,
                    type: entryType,
                    referenceNumber: entryRef || `MAN-${Date.now()}`,
                    description: entryDesc,
                    descriptionAr: entryDescAr,
                    debit: parseFloat(entryDebit) || 0,
                    credit: parseFloat(entryCredit) || 0,
                    balance: 0,
                  });
                  setShowEntryForm(false);
                  setEntryRef('');
                  setEntryDesc('');
                  setEntryDescAr('');
                  setEntryDebit('');
                  setEntryCredit('');
                }}>{t('app.save')}</Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 gap-4">
            <div className="card p-4">
              <p className="text-xs text-slate-500">{t('customers.name')}</p>
              <p className="text-lg font-semibold mt-1">{language === 'ar' ? customer.nameAr : customer.name}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-slate-500">{t('customerAccount.openingBalance')}</p>
              <p className="text-lg font-semibold mt-1">{formatCurrency(transactionRows.openingBalance, 'EGP', language)}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-slate-500">{t('customerAccount.totalDebit')}</p>
              <p className="text-lg font-semibold mt-1 text-red-600">{formatCurrency(transactionRows.totalDebit, 'EGP', language)}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-slate-500">{t('customerAccount.closingBalance')}</p>
              <p className={`text-lg font-semibold mt-1 ${transactionRows.closingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(transactionRows.closingBalance, 'EGP', language)}
              </p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="p-3 text-left font-medium text-xs text-slate-500 uppercase">{t('customerAccount.date')}</th>
                    <th className="p-3 text-left font-medium text-xs text-slate-500 uppercase">{t('customerAccount.reference')}</th>
                    <th className="p-3 text-left font-medium text-xs text-slate-500 uppercase">{t('customerAccount.description')}</th>
                    <th className="p-3 text-right font-medium text-xs text-slate-500 uppercase">{t('customerAccount.debit')}</th>
                    <th className="p-3 text-right font-medium text-xs text-slate-500 uppercase">{t('customerAccount.credit')}</th>
                    <th className="p-3 text-right font-medium text-xs text-slate-500 uppercase">{t('customerAccount.balance')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-sm text-slate-400">{t('customerAccount.noTransactions')}</td>
                    </tr>
                  )}
                  {filteredRows.map((row, idx) => (
                    <tr key={idx} className={`border-b hover:bg-slate-50 ${row.type === 'opening_balance' ? 'bg-slate-50 font-medium' : ''}`}>
                      <td className="p-3 text-xs text-slate-600">{formatDate(row.date)}</td>
                      <td className="p-3 text-xs font-mono text-blue-600">{row.reference}</td>
                      <td className="p-3 text-xs">{language === 'ar' ? row.descriptionAr : row.description}</td>
                      <td className="p-3 text-xs text-right font-mono">{row.debit > 0 ? formatCurrency(row.debit, 'EGP', language) : '—'}</td>
                      <td className="p-3 text-xs text-right font-mono">{row.credit > 0 ? formatCurrency(row.credit, 'EGP', language) : '—'}</td>
                      <td className={`p-3 text-xs text-right font-mono font-medium ${row.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(Math.abs(row.balance), 'EGP', language)}
                        {row.balance < 0 && <span className="text-xs text-red-500 ml-1">Dr</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-semibold">
                    <td colSpan={3} className="p-3 text-xs">{t('customerAccount.totalDebit')}</td>
                    <td className="p-3 text-xs text-right font-mono">{formatCurrency(transactionRows.totalDebit, 'EGP', language)}</td>
                    <td className="p-3 text-xs text-right font-mono">{formatCurrency(transactionRows.totalCredit, 'EGP', language)}</td>
                    <td className="p-3 text-xs text-right font-mono">{formatCurrency(transactionRows.closingBalance, 'EGP', language)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}

      {!selectedCustomerId && (
        <div className="card p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-sm text-slate-400">{t('customerAccount.selectCustomerHint')}</p>
        </div>
      )}
    </div>
  );
}
