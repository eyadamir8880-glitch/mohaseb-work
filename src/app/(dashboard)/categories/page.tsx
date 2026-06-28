'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/providers/language-provider';
import { useAppStore } from '@/stores/use-app-store';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2 } from 'lucide-react';

export default function CategoriesPage() {
  const { language, t } = useLanguage();
  const store = useAppStore();
  const { categories, addCategory, updateCategory, deleteCategory, clearModuleData } = store;
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tabType, setTabType] = useState<'product' | 'income' | 'expense'>('product');
  const [showDeleteAll, setShowDeleteAll] = useState(false);

  const filteredCategories = useMemo(() => categories.filter(c => c.type === tabType), [categories, tabType]);

  const getParentName = (parentId: string | null) => {
    if (!parentId) return '-';
    const parent = categories.find(c => c.id === parentId);
    return parent ? (language === 'ar' ? parent.nameAr : parent.name) : '-';
  };

  const handleDeleteAll = () => {
    clearModuleData('categories');
    setShowDeleteAll(false);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('categories.title')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowDeleteAll(true)} className="gap-2 text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950">
            <Trash2 className="h-4 w-4" />
            {t('app.deleteAll')}
          </Button>
          <Button onClick={() => { setEditingId(null); setShowModal(true); }}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t('categories.addNew')}
        </Button>
      </div>
    </div>

      <Tabs defaultValue="product" onValueChange={(v: string) => setTabType(v as any)}>
        <TabsList>
          <TabsTrigger value="product">{t('categories.product')}</TabsTrigger>
          <TabsTrigger value="income">{t('categories.income')}</TabsTrigger>
          <TabsTrigger value="expense">{t('categories.expense')}</TabsTrigger>
        </TabsList>
        <TabsContent value={tabType} className="mt-4">
          <div className="space-y-2">
            {filteredCategories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between rounded-lg border p-3 dark:border-slate-700">
                <div>
                  <p className="font-medium">{language === 'ar' ? cat.nameAr : cat.name}</p>
                  <p className="text-xs text-slate-500">{t('categories.parent')}: {getParentName(cat.parentId)} | {t('categories.type')}: {cat.type}</p>
                </div>
                <div className="flex gap-1">
                  <button className="btn-ghost btn-sm p-1" onClick={() => { setEditingId(cat.id); setShowModal(true); }}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button className="btn-ghost btn-sm p-1 text-red-600" onClick={() => { if (confirm(t('app.deleteConfirm'))) deleteCategory(cat.id); }}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            {filteredCategories.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">{t('app.noData')}</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? t('categories.editCategory') : t('categories.addNew')}>
        <CategoryForm categoryId={editingId} defaultType={tabType} onSave={() => setShowModal(false)} onCancel={() => setShowModal(false)} />
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

function CategoryForm({ categoryId, defaultType, onSave, onCancel }: { categoryId: string | null; defaultType: string; onSave: () => void; onCancel: () => void }) {
  const { t, language } = useLanguage();
  const store = useAppStore();
  const existing = categoryId ? store.categories.find(c => c.id === categoryId) : null;
  const [name, setName] = useState(existing?.name || '');
  const [type, setType] = useState(existing?.type || defaultType);
  const [parentId, setParentId] = useState(existing?.parentId || '');

  const handleSave = () => {
    const data = { name, nameAr: name, type: type as any, parentId: parentId || null, description: '', sortOrder: 0 };
    if (existing) {
      store.updateCategory(existing.id, data);
    } else {
      store.addCategory(data);
    }
    onSave();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label={t('categories.name')} value={name} onChange={(e) => setName(e.target.value)} />
        <Select label={t('categories.type')} value={type} onChange={(e) => setType(e.target.value)}
          options={[
            { value: 'product', label: t('categories.product') },
            { value: 'income', label: t('categories.income') },
            { value: 'expense', label: t('categories.expense') },
          ]} />
        <Select label={t('categories.parent')} value={parentId} onChange={(e) => setParentId(e.target.value)}
          options={[{ value: '', label: '-' }, ...store.categories.filter(c => c.id !== categoryId).map(c => ({ value: c.id, label: language === 'ar' ? c.nameAr : c.name }))]} />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>{t('app.cancel')}</Button>
        <Button onClick={handleSave}>{t('app.save')}</Button>
      </div>
    </div>
  );
}
