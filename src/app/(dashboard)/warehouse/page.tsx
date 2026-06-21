'use client';

import { useMemo, useState } from 'react';
import { useLanguage } from '@/providers/language-provider';
import { useAppStore } from '@/stores/use-app-store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2 } from 'lucide-react';

export default function WarehousePage() {
  const { language, t } = useLanguage();
  const store = useAppStore();
  const { products, categories, stockMovements, warehouses, clearModuleData } = store;
  const [showDeleteAll, setShowDeleteAll] = useState(false);

  const stats = useMemo(() => {
    const totalSKUs = products.length;
    const totalValue = products.reduce((s, p) => s + (p.purchasePrice * p.stock), 0);
    const lowStock = products.filter(p => p.trackInventory && p.stock > 0 && p.stock <= p.lowStockThreshold).length;
    const outOfStock = products.filter(p => p.trackInventory && p.stock === 0).length;
    return { totalSKUs, totalValue, lowStock, outOfStock };
  }, [products]);

  const getCategoryName = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? (language === 'ar' ? cat.nameAr : cat.name) : '-';
  };

  const productColumns = [
    { key: 'name', header: t('products.name'), sortable: true, render: (item: any) => language === 'ar' ? item.nameAr : item.name },
    { key: 'sku', header: t('products.sku') },
    { key: 'categoryId', header: t('products.category'), render: (item: any) => getCategoryName(item.categoryId) },
    { key: 'stock', header: t('products.stock'), sortable: true, render: (item: any) => (
      <span className={`font-medium ${item.stock === 0 ? 'text-red-600' : item.stock <= item.lowStockThreshold ? 'text-amber-600' : 'text-emerald-600'}`}>
        {item.stock}
      </span>
    )},
    { key: 'lowStockThreshold', header: t('products.lowStockThreshold') },
    { key: 'status', header: t('app.status'), render: (item: any) => {
      if (!item.trackInventory) return <span className="badge-gray">{t('app.no')}</span>;
      if (item.stock === 0) return <span className="badge-red">{t('products.outOfStock')}</span>;
      if (item.stock <= item.lowStockThreshold) return <span className="badge-yellow">{t('products.lowStock')}</span>;
      return <span className="badge-green">{t('products.inStock')}</span>;
    }},
  ];

  const movementColumns = [
    { key: 'date', header: t('invoices.issueDate'), render: (item: any) => formatDate(item.date) },
    { key: 'productId', header: t('products.name'), render: (item: any) => {
      const p = products.find(pr => pr.id === item.productId);
      return p ? (language === 'ar' ? p.nameAr : p.name) : '-';
    }},
    { key: 'type', header: t('app.type'), render: (item: any) => (
      <span className={`badge ${item.type === 'in' ? 'badge-green' : item.type === 'out' ? 'badge-red' : 'badge-yellow'}`}>
        {item.type === 'in' ? 'IN' : item.type === 'out' ? 'OUT' : 'ADJ'}
      </span>
    )},
    { key: 'quantity', header: t('invoices.quantity'), sortable: true },
    { key: 'reason', header: t('returns.reason') },
    { key: 'warehouseId', header: 'Warehouse', render: (item: any) => {
      const w = warehouses.find(wh => wh.id === item.warehouseId);
      return w ? (language === 'ar' ? w.nameAr : w.name) : '-';
    }},
  ];

  const handleDeleteAll = () => {
    clearModuleData('stockMovements');
    setShowDeleteAll(false);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('warehouse.title')}</h1>
        <Button variant="outline" onClick={() => setShowDeleteAll(true)} className="gap-2 text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950">
          <Trash2 className="h-4 w-4" />
          {t('app.deleteAll')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="kpi-card">
          <p className="kpi-label">{t('warehouse.totalSKUs')}</p>
          <p className="kpi-value">{stats.totalSKUs}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">{t('warehouse.totalValue')}</p>
          <p className="kpi-value text-blue-600">{formatCurrency(stats.totalValue, 'EGP', language)}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">{t('warehouse.lowStock')}</p>
          <p className="kpi-value text-amber-600">{stats.lowStock}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">{t('warehouse.outOfStock')}</p>
          <p className="kpi-value text-red-600">{stats.outOfStock}</p>
        </div>
      </div>

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">{t('warehouse.stockLevels')}</TabsTrigger>
          <TabsTrigger value="movements">{t('warehouse.stockMovements')}</TabsTrigger>
        </TabsList>
        <TabsContent value="stock" className="mt-4">
          <DataTable columns={productColumns} data={products.filter(p => p.trackInventory)} emptyMessage={t('app.noData')} />
        </TabsContent>
        <TabsContent value="movements" className="mt-4">
          <DataTable columns={movementColumns} data={stockMovements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())} emptyMessage={t('app.noData')} />
        </TabsContent>
      </Tabs>

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
