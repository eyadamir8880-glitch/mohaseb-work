'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/providers/language-provider';
import { useAppStore } from '@/stores/use-app-store';
import { formatCurrency, formatDate, downloadAsCsv } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ReportsPage() {
  const { language, t } = useLanguage();
  const store = useAppStore();
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 90*24*60*60*1000).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('financial');

  const filteredInvoices = useMemo(() => {
    return store.invoices.filter(i => {
      const d = new Date(i.createdAt);
      return d >= new Date(dateFrom) && d <= new Date(dateTo + 'T23:59:59');
    });
  }, [store.invoices, dateFrom, dateTo]);

  const filteredTransactions = useMemo(() => {
    return store.treasuryTransactions.filter(t => {
      const d = new Date(t.date);
      return d >= new Date(dateFrom) && d <= new Date(dateTo + 'T23:59:59');
    });
  }, [store.treasuryTransactions, dateFrom, dateTo]);

  // P&L Calculation
  const profitLoss = useMemo(() => {
    const revenue = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { revenue, expenses, netProfit: revenue - expenses };
  }, [filteredTransactions, filteredInvoices]);

  // Payment method breakdown
  const paymentMethodBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    filteredTransactions.forEach(t => {
      const method = t.paymentMethod || 'cash';
      breakdown[method] = (breakdown[method] || 0) + t.amount;
    });
    return Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  }, [filteredTransactions]);

  // Sales by product
  const salesByProduct = useMemo(() => {
    const productSales: Record<string, { qty: number; total: number }> = {};
    filteredInvoices.filter(i => i.status === 'paid' || i.status === 'partially_paid').forEach(inv => {
      (inv.items || []).forEach(item => {
        if (!productSales[item.productId]) productSales[item.productId] = { qty: 0, total: 0 };
        productSales[item.productId].qty += item.quantity;
        productSales[item.productId].total += item.lineTotal;
      });
    });
    return Object.entries(productSales).sort((a, b) => b[1].total - a[1].total);
  }, [filteredInvoices]);

  const exportCurrentReport = () => {
    let data: Record<string, any>[] = [];
    let filename = `report-${Date.now()}.csv`;

    if (activeTab === 'financial') {
      data = [
        { metric: t('treasury.income'), amount: profitLoss.revenue },
        { metric: t('treasury.expense'), amount: profitLoss.expenses },
        { metric: t('dashboard.netProfit'), amount: profitLoss.netProfit },
      ];
    } else if (activeTab === 'sales') {
      data = salesByProduct.map(([productId, d]) => {
        const product = store.products.find(p => p.id === productId);
        return {
          product: product ? (language === 'ar' ? product.nameAr : product.name) : 'Unknown',
          quantity: d.qty,
          total: d.total,
        };
      });
    } else if (activeTab === 'treasury') {
      data = paymentMethodBreakdown.map(([method, amount]) => ({
        method: store.paymentMethods.find(p => p.id === method)?.name || method,
        amount,
      }));
    } else if (activeTab === 'inventory') {
      data = store.products.map(p => ({
        product: language === 'ar' ? p.nameAr : p.name,
        sku: p.sku,
        stock: p.stock,
        purchasePrice: p.purchasePrice,
        sellingPrice: p.sellingPrice,
        totalValue: p.purchasePrice * p.stock,
      }));
    }
    downloadAsCsv(data, filename);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('reports.title')}</h1>
        <div className="flex items-center gap-3">
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" label={t('reports.from')} />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" label={t('reports.to')} />
          <Button variant="outline" onClick={exportCurrentReport}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t('reports.exportCsv')}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="financial" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="financial">{t('reports.financial')}</TabsTrigger>
          <TabsTrigger value="sales">{t('dashboard.salesByCategory')}</TabsTrigger>
          <TabsTrigger value="treasury">{t('treasury.paymentMethodBreakdown')}</TabsTrigger>
          <TabsTrigger value="inventory">{t('reports.inventoryValuation')}</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="mt-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card">
              <h3 className="card-title mb-4">{t('reports.profitAndLoss')}</h3>
              <div className="space-y-3">
                <div className="flex justify-between border-b pb-2 dark:border-slate-700">
                  <span>{t('treasury.income')}</span>
                  <span className="font-medium text-emerald-600">{formatCurrency(profitLoss.revenue, 'EGP', language)}</span>
                </div>
                <div className="flex justify-between border-b pb-2 dark:border-slate-700">
                  <span>{t('treasury.expense')}</span>
                  <span className="font-medium text-red-600">{formatCurrency(profitLoss.expenses, 'EGP', language)}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="font-bold">{t('dashboard.netProfit')}</span>
                  <span className={`font-bold ${profitLoss.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(profitLoss.netProfit, 'EGP', language)}
                  </span>
                </div>
              </div>
            </div>
            <div className="card">
              <h3 className="card-title mb-4">{t('reports.trialBalance')}</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {store.chartOfAccounts.map(acc => (
                  <div key={acc.id} className="flex justify-between text-sm border-b pb-1 dark:border-slate-700">
                    <span>{acc.code} - {language === 'ar' ? acc.nameAr : acc.name}</span>
                    <span className="font-mono">{formatCurrency(acc.balance, 'EGP', language)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="mt-4">
          <div className="card">
            <h3 className="card-title mb-4">{t('reports.salesByProduct')}</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {salesByProduct.map(([productId, data]) => {
                const product = store.products.find(p => p.id === productId);
                return (
                  <div key={productId} className="flex items-center justify-between rounded-lg border p-3 text-sm dark:border-slate-700">
                    <div className="flex-1">
                      <p className="font-medium">{product ? (language === 'ar' ? product.nameAr : product.name) : 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{t('invoices.quantity')}: {data.qty}</p>
                    </div>
                    <span className="font-medium">{formatCurrency(data.total, 'EGP', language)}</span>
                  </div>
                );
              })}
              {salesByProduct.length === 0 && <p className="py-8 text-center text-sm text-slate-500">{t('app.noData')}</p>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="treasury" className="mt-4">
          <div className="card">
            <h3 className="card-title mb-4">{t('treasury.paymentMethodBreakdown')}</h3>
            <div className="space-y-3">
              {paymentMethodBreakdown.map(([methodId, amount]) => {
                const pm = store.paymentMethods.find(p => p.id === methodId);
                return (
                  <div key={methodId} className="flex items-center justify-between border-b pb-2 dark:border-slate-700">
                    <span>{pm ? (language === 'ar' ? pm.nameAr : pm.name) : methodId}</span>
                    <div className="flex items-center gap-4">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div className="h-full rounded-full bg-blue-500" style={{
                          width: `${(amount / Math.max(...paymentMethodBreakdown.map(([, a]) => a), 1)) * 100}%`
                        }} />
                      </div>
                      <span className="w-28 text-right font-medium">{formatCurrency(amount, 'EGP', language)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="mt-4">
          <div className="card">
            <h3 className="card-title mb-4">{t('reports.inventoryValuation')}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="kpi-card">
                <p className="kpi-label">{t('warehouse.totalSKUs')}</p>
                <p className="kpi-value">{store.products.length}</p>
              </div>
              <div className="kpi-card">
                <p className="kpi-label">{t('warehouse.totalValue')} ({t('products.purchasePrice')})</p>
                <p className="kpi-value">{formatCurrency(store.products.reduce((s, p) => s + p.purchasePrice * p.stock, 0), 'EGP', language)}</p>
              </div>
              <div className="kpi-card">
                <p className="kpi-label">{t('warehouse.totalValue')} ({t('products.sellingPrice')})</p>
                <p className="kpi-value">{formatCurrency(store.products.reduce((s, p) => s + p.sellingPrice * p.stock, 0), 'EGP', language)}</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
