'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/providers/language-provider';
import { useAppStore } from '@/stores/use-app-store';
import { formatCurrency, formatDate, downloadAsCsv } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ReportsPage() {
  const { language, t } = useLanguage();
  const store = useAppStore();
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 90*24*60*60*1000).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('agedReceivables');

  const filteredTransactions = useMemo(() => {
    return store.treasuryTransactions.filter(t => {
      const d = new Date(t.date);
      return d >= new Date(dateFrom) && d <= new Date(dateTo + 'T23:59:59');
    });
  }, [store.treasuryTransactions, dateFrom, dateTo]);

  const agedReceivables = useMemo(() => {
    const now = new Date();
    return store.customers.map(customer => {
      const unpaidInvoices = store.invoices.filter(
        inv => inv.customerId === customer.id && (inv.status === 'sent' || inv.status === 'overdue' || inv.status === 'partially_paid')
      );
      let current = 0, days31to60 = 0, days61to90 = 0, over90 = 0;
      unpaidInvoices.forEach(inv => {
        const dueDate = new Date(inv.dueDate);
        const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const remaining = inv.grandTotal - inv.paidAmount;
        if (daysOverdue <= 30) current += remaining;
        else if (daysOverdue <= 60) days31to60 += remaining;
        else if (daysOverdue <= 90) days61to90 += remaining;
        else over90 += remaining;
      });
      return { customer, current, days31to60, days61to90, over90, totalDue: current + days31to60 + days61to90 + over90 };
    }).filter(r => r.totalDue > 0);
  }, [store.customers, store.invoices]);

  const cashFlow = useMemo(() => {
    const operatingIncome = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const operatingExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const transfers = filteredTransactions.filter(t => t.type === 'transfer');

    const netOperating = operatingIncome - operatingExpenses;

    const totalAccountsOpening = store.treasuryAccounts.reduce((s, a) => s + a.balance, 0);
    const totalAccountsClosing = totalAccountsOpening + netOperating;

    return {
      operatingIncome,
      operatingExpenses,
      netOperating,
      transfers,
      openingCash: totalAccountsOpening,
      closingCash: totalAccountsClosing,
    };
  }, [filteredTransactions, store.treasuryAccounts]);

  const exportReport = () => {
    let data: Record<string, any>[] = [];
    let filename = `report-${Date.now()}.csv`;

    if (activeTab === 'agedReceivables') {
      data = agedReceivables.map(r => ({
        [t('app.name')]: language === 'ar' ? r.customer.nameAr : r.customer.name,
        [t('reports.current')]: r.current,
        [t('reports.days31to60')]: r.days31to60,
        [t('reports.days61to90')]: r.days61to90,
        [t('reports.over90Days')]: r.over90,
        [t('reports.totalDue')]: r.totalDue,
      }));
    } else if (activeTab === 'cashFlow') {
      data = [
        { category: t('reports.operatingActivities'), item: t('treasury.income'), amount: cashFlow.operatingIncome },
        { category: t('reports.operatingActivities'), item: t('treasury.expense'), amount: -cashFlow.operatingExpenses },
        { category: t('reports.operatingActivities'), item: t('reports.netCashFlow'), amount: cashFlow.netOperating },
        { category: t('reports.summary'), item: t('reports.beginningCash'), amount: cashFlow.openingCash },
        { category: t('reports.summary'), item: t('reports.endingCash'), amount: cashFlow.closingCash },
      ];
    } else if (activeTab === 'inventoryValuation') {
      data = store.products.map(p => ({
        [t('products.name')]: language === 'ar' ? p.nameAr : p.name,
        [t('reports.totalStockValue')]: p.purchasePrice * p.stock,
        [t('reports.costOfSales')]: inventoryValuation.productMovements[p.id]?.outvalue || 0,
      }));
    }
    downloadAsCsv(data, filename);
  };

  const inventoryValuation = useMemo(() => {
    const productMap = new Map(store.products.map(p => [p.id, p]));
    const productMovements: Record<string, { inqty: number; invalue: number; outqty: number; outvalue: number }> = {};
    const filteredMovements = store.stockMovements.filter(m => {
      const d = new Date(m.date);
      return d >= new Date(dateFrom) && d <= new Date(dateTo + 'T23:59:59');
    });
    filteredMovements.forEach(m => {
      if (!productMovements[m.productId]) productMovements[m.productId] = { inqty: 0, invalue: 0, outqty: 0, outvalue: 0 };
      const product = productMap.get(m.productId);
      if (!product) return;
      const unitCost = product.purchasePrice;
      if (m.type === 'in') {
        productMovements[m.productId].inqty += m.quantity;
        productMovements[m.productId].invalue += m.quantity * unitCost;
      } else if (m.type === 'out') {
        productMovements[m.productId].outqty += m.quantity;
        productMovements[m.productId].outvalue += m.quantity * unitCost;
      }
    });
    const totalCOGS = Object.values(productMovements).reduce((s, v) => s + v.outvalue, 0);
    const totalStockValue = store.products.reduce((s, p) => s + p.purchasePrice * p.stock, 0);
    return { productMovements, totalCOGS, totalStockValue };
  }, [store.products, store.stockMovements, dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('reports.title')}</h1>
        <div className="flex items-center gap-3">
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" label={t('reports.from')} />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" label={t('reports.to')} />
          <Button variant="outline" onClick={exportReport}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t('reports.exportCsv')}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="agedReceivables" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="agedReceivables">{t('reports.agedReceivables')}</TabsTrigger>
          <TabsTrigger value="cashFlow">{t('reports.cashFlow')}</TabsTrigger>
          <TabsTrigger value="inventoryValuation">{t('reports.inventoryValuation')}</TabsTrigger>
        </TabsList>

        <TabsContent value="agedReceivables" className="mt-4">
          <div className="card overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>{t('app.name')}</th>
                  <th>{t('app.phone')}</th>
                  <th className="text-right">{t('reports.current')}</th>
                  <th className="text-right">{t('reports.days31to60')}</th>
                  <th className="text-right">{t('reports.days61to90')}</th>
                  <th className="text-right">{t('reports.over90Days')}</th>
                  <th className="text-right">{t('reports.totalDue')}</th>
                </tr>
              </thead>
              <tbody>
                {agedReceivables.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-sm text-slate-500">{t('app.noData')}</td></tr>
                ) : agedReceivables.map(r => (
                  <tr key={r.customer.id}>
                    <td>{language === 'ar' ? r.customer.nameAr : r.customer.name}</td>
                    <td>{r.customer.phone}</td>
                    <td className={`text-right ${r.current > 0 ? 'text-emerald-600' : ''}`}>{r.current > 0 ? formatCurrency(r.current, 'EGP', language) : '-'}</td>
                    <td className={`text-right ${r.days31to60 > 0 ? 'text-yellow-600' : ''}`}>{r.days31to60 > 0 ? formatCurrency(r.days31to60, 'EGP', language) : '-'}</td>
                    <td className={`text-right ${r.days61to90 > 0 ? 'text-orange-600' : ''}`}>{r.days61to90 > 0 ? formatCurrency(r.days61to90, 'EGP', language) : '-'}</td>
                    <td className={`text-right ${r.over90 > 0 ? 'text-red-600 font-medium' : ''}`}>{r.over90 > 0 ? formatCurrency(r.over90, 'EGP', language) : '-'}</td>
                    <td className="text-right font-medium">{formatCurrency(r.totalDue, 'EGP', language)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-bold">
                  <td colSpan={2}>{t('reports.summary')}</td>
                  <td className="text-right">{formatCurrency(agedReceivables.reduce((s, r) => s + r.current, 0), 'EGP', language)}</td>
                  <td className="text-right">{formatCurrency(agedReceivables.reduce((s, r) => s + r.days31to60, 0), 'EGP', language)}</td>
                  <td className="text-right">{formatCurrency(agedReceivables.reduce((s, r) => s + r.days61to90, 0), 'EGP', language)}</td>
                  <td className="text-right">{formatCurrency(agedReceivables.reduce((s, r) => s + r.over90, 0), 'EGP', language)}</td>
                  <td className="text-right">{formatCurrency(agedReceivables.reduce((s, r) => s + r.totalDue, 0), 'EGP', language)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="cashFlow" className="mt-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card">
              <h3 className="card-title mb-4">{t('reports.operatingActivities')}</h3>
              <div className="space-y-3">
                <div className="flex justify-between border-b pb-2 dark:border-slate-700">
                  <span>{t('treasury.income')}</span>
                  <span className="font-medium text-emerald-600">{formatCurrency(cashFlow.operatingIncome, 'EGP', language)}</span>
                </div>
                <div className="flex justify-between border-b pb-2 dark:border-slate-700">
                  <span>{t('treasury.expense')}</span>
                  <span className="font-medium text-red-600">{formatCurrency(cashFlow.operatingExpenses, 'EGP', language)}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="font-bold">{t('reports.netCashFlow')}</span>
                  <span className={`font-bold ${cashFlow.netOperating >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(cashFlow.netOperating, 'EGP', language)}
                  </span>
                </div>
              </div>
            </div>
            <div className="card">
              <h3 className="card-title mb-4">{t('reports.summary')}</h3>
              <div className="space-y-3">
                <div className="flex justify-between border-b pb-2 dark:border-slate-700">
                  <span>{t('reports.beginningCash')}</span>
                  <span className="font-mono">{formatCurrency(cashFlow.openingCash, 'EGP', language)}</span>
                </div>
                <div className="flex justify-between border-b pb-2 dark:border-slate-700">
                  <span>{t('reports.netCashFlow')}</span>
                  <span className={`font-mono ${cashFlow.netOperating >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(cashFlow.netOperating, 'EGP', language)}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="font-bold">{t('reports.endingCash')}</span>
                  <span className="font-bold text-lg">{formatCurrency(cashFlow.closingCash, 'EGP', language)}</span>
                </div>
              </div>
            </div>
          </div>
          {cashFlow.transfers.length > 0 && (
            <div className="card mt-4">
              <h3 className="card-title mb-4">{t('treasury.transfers')}</h3>
              <div className="space-y-2">
                {cashFlow.transfers.map(t => (
                  <div key={t.id} className="flex justify-between border-b pb-1 text-sm dark:border-slate-700">
                    <span>{language === 'ar' ? t.descriptionAr : t.description}</span>
                    <span className="font-mono">{formatCurrency(t.amount, 'EGP', language)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="inventoryValuation" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="kpi-card">
              <p className="kpi-label">{t('warehouse.totalSKUs')}</p>
              <p className="kpi-value">{store.products.length}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">{t('warehouse.totalValue')} ({t('products.purchasePrice')})</p>
              <p className="kpi-value">{formatCurrency(inventoryValuation.totalStockValue, 'EGP', language)}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">{t('reports.costOfSales')}</p>
              <p className="kpi-value text-red-600">{formatCurrency(inventoryValuation.totalCOGS, 'EGP', language)}</p>
            </div>
          </div>
          <div className="card mt-4 overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>{t('products.name')}</th>
                  <th className="text-right">{t('warehouse.totalValue')}</th>
                  <th className="text-right">{t('invoices.quantity')}</th>
                  <th className="text-right">{t('reports.costOfSales')}</th>
                </tr>
              </thead>
              <tbody>
                {store.products.map(p => {
                  const mov = inventoryValuation.productMovements[p.id];
                  return (
                    <tr key={p.id}>
                      <td>{language === 'ar' ? p.nameAr : p.name}</td>
                      <td className="text-right">{formatCurrency(p.purchasePrice * p.stock, 'EGP', language)}</td>
                      <td className="text-right">{mov ? (mov.inqty - mov.outqty) : 0}</td>
                      <td className="text-right text-red-600">{mov ? formatCurrency(mov.outvalue, 'EGP', language) : '-'}</td>
                    </tr>
                  );
                })}
                {store.products.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-sm text-slate-500">{t('app.noData')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
