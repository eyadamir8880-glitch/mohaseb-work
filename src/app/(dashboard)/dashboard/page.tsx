'use client';
import React, { useEffect, useMemo } from 'react';
import { useLanguage } from '@/providers/language-provider';
import { useAppStore } from '@/stores/use-app-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate, getStatusColor, formatNumber } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, FileText, Wallet, Plus, UserPlus, Package, ArrowRightLeft, Activity } from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function DashboardPage() {
  const { t, locale } = useLanguage();
  const invoices = useAppStore((s) => s.invoices);
  const transactions = useAppStore((s) => s.treasuryTransactions);
  const products = useAppStore((s) => s.products);
  const customers = useAppStore((s) => s.customers);

  function getCustomerName(customerId: string): string {
    const c = customers.find(c => c.id === customerId);
    return c ? (locale === 'ar' ? c.nameAr || c.name : c.name) : '-';
  }

  const kpis = useMemo(() => {
    const totalRevenue = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const outstandingAmt = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + i.grandTotal, 0);
    const currentBalance = (250000 + 1500000 + 15000) - totalExpenses + totalRevenue;
    return {
      totalRevenue, totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      outstandingInvoices: outstandingAmt,
      currentBalance,
    };
  }, [transactions, invoices]);

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const arMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return months.map((m, i) => {
      const monthTxns = transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === i && d.getFullYear() === 2024;
      });
      const rev = monthTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = monthTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return { month: locale === 'ar' ? arMonths[i] : m, revenue: rev, expenses: exp };
    });
  }, [transactions, locale]);

  const salesByCategory = useMemo(() => {
    const byCat: Record<string, number> = {};
    invoices.forEach((inv) => {
      const cat = getCustomerName(inv.customerId);
      byCat[cat] = (byCat[cat] || 0) + inv.grandTotal;
    });
    return Object.entries(byCat).slice(0, 5).map(([name, value]) => ({ name, value }));
  }, [invoices, customers, locale]);

  const recentActivity = useMemo(() => {
    const all = [
      ...invoices.map((i) => ({ date: i.createdAt, text: `${t.invoices.title} ${i.invoiceNumber} - ${getCustomerName(i.customerId)}`, status: i.status, type: 'invoice' as const })),
      ...transactions.map((tx) => ({ date: tx.createdAt, text: `${tx.type === 'income' ? tx.description : tx.description}`, status: tx.type, type: 'transaction' as const })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
    return all;
  }, [invoices, transactions, t, customers, locale]);

  const quickActions = [
    { label: t.dashboard.newInvoice, icon: FileText, href: '/invoices', color: 'bg-blue-500' },
    { label: t.dashboard.newCustomer, icon: UserPlus, href: '/customers', color: 'bg-green-500' },
    { label: t.dashboard.newProduct, icon: Package, href: '/products', color: 'bg-purple-500' },
    { label: t.dashboard.newTransaction, icon: ArrowRightLeft, href: '/treasury', color: 'bg-amber-500' },
  ];

  const kpiCards = [
    { title: t.dashboard.totalRevenue, value: kpis.totalRevenue, icon: TrendingUp, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950' },
    { title: t.dashboard.totalExpenses, value: kpis.totalExpenses, icon: TrendingDown, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950' },
    { title: t.dashboard.netProfit, value: kpis.netProfit, icon: DollarSign, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950' },
    { title: t.dashboard.outstandingInvoices, value: kpis.outstandingInvoices, icon: FileText, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950' },
    { title: t.dashboard.currentBalance, value: kpis.currentBalance, icon: Wallet, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t.dashboard.title}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{kpi.title}</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(kpi.value, 'EGP', locale)}</p>
                  </div>
                  <div className={`p-3 rounded-full ${kpi.bg}`}>
                    <Icon className={`h-6 w-6 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.revenueVsExpenses}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="revenue" fill="#22c55e" name={t.dashboard.totalRevenue} radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#ef4444" name={t.dashboard.totalExpenses} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.salesByCategory}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={salesByCategory} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                  {salesByCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.monthlyTrends}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} name={t.dashboard.totalRevenue} />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name={t.dashboard.totalExpenses} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.recentActivity}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <Activity className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate">{item.text}</span>
                  <Badge variant={item.status === 'paid' || item.status === 'income' ? 'green' : item.status === 'overdue' ? 'red' : item.status === 'sent' || item.status === 'expense' ? 'yellow' : 'gray'}>
                    {item.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground shrink-0">{formatDate(item.date, locale)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.dashboard.quickActions}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.label} href={action.href}>
                  <Button className="gap-2">
                    <Icon className="h-4 w-4" />
                    {action.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
