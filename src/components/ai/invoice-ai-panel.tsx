'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/stores/use-app-store';
import { useLanguage } from '@/providers/language-provider';
import { buildAIContext } from '@/lib/ai-helpers';
import { AIChat } from '@/components/ai/ai-chat';
import { useAIChat } from '@/components/ai/use-ai-chat';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import type { AIAttachment, AIMessage, InvoiceDraft } from '@/lib/ai-types';

export interface ResolvedInvoiceForm {
  customerId: string;
  items: {
    productId: string;
    productName: string;
    productNameAr: string;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    taxPercent: number;
    lineTotal: number;
  }[];
  notes: string;
}

interface InvoiceAIPanelProps {
  onApplyDraft: (form: ResolvedInvoiceForm) => void;
  compact?: boolean;
}

export function InvoiceAIPanel({ onApplyDraft, compact }: InvoiceAIPanelProps) {
  const { t, language } = useLanguage();
  const store = useAppStore();
  const chat = useAIChat('invoice');
  const [approvedNew, setApprovedNew] = useState<Set<string>>(new Set());
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const [applyError, setApplyError] = useState('');

  const context = useCallback(() => buildAIContext(store, language as 'en' | 'ar'), [store, language]);

  const handleSend = useCallback(
    (text: string, attachments: AIAttachment[]) => {
      chat.send(text, attachments, { context: context(), language });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chat, context, language]
  );

  const lastDraftMsg = useMemo(() => {
    for (let i = chat.messages.length - 1; i >= 0; i--) {
      const m = chat.messages[i];
      if (m.role === 'assistant' && m.draft && m.draft.items && m.draft.items.length > 0) return m;
    }
    return null;
  }, [chat.messages]);

  const resolution = useMemo(() => {
    if (!lastDraftMsg?.draft) return null;
    const draft: InvoiceDraft = lastDraftMsg.draft;
    const customerName = (draft.customerName || '').trim();
    const existingCustomer = customerName
      ? store.customers.find(
          (c) => c.name.toLowerCase() === customerName.toLowerCase() || (c.nameAr || '').toLowerCase() === customerName.toLowerCase()
        )
      : null;

    const items = draft.items.map((item) => {
      const name = (item.productName || '').trim();
      const existing = store.products.find(
        (p) => p.name.toLowerCase() === name.toLowerCase() || (p.nameAr || '').toLowerCase() === name.toLowerCase()
      );
      return { item, name, existing, newName: existing ? '' : name, price: item.unitPrice || existing?.sellingPrice || 0 };
    });

    const newCustomer = !existingCustomer && customerName ? { name: customerName } : null;

    const newProducts = items
      .filter((x) => !x.existing)
      .map((x) => ({ name: x.newName, sellingPrice: x.price }));

    const subtotal = items.reduce((s, x) => s + (x.item.quantity || 0) * x.price, 0);
    const discountTotal = items.reduce(
      (s, x) => s + (x.item.quantity || 0) * x.price * ((x.item.discountPercent || 0) / 100),
      0
    );
    const grandTotal = subtotal - discountTotal;

    return { draft, customerName, existingCustomer, newCustomer, items, newProducts, subtotal, discountTotal, grandTotal };
  }, [lastDraftMsg, store.customers, store.products]);

  const pendingNew = useMemo(() => {
    if (!lastDraftMsg) return [];
    const names = [
      ...(lastDraftMsg.newCustomers || []).map((c) => c.name),
      ...(resolution?.newCustomer ? [resolution.newCustomer.name] : []),
      ...(resolution?.newProducts || []).map((p) => p.name),
    ];
    return names.filter((n, i, arr) => n && arr.indexOf(n) === i);
  }, [lastDraftMsg, resolution]);

  useEffect(() => {
    if (lastDraftMsg) setApprovedNew(new Set(pendingNew));
  }, [lastDraftMsg, pendingNew]);

  const applyDraft = () => {
    if (!resolution || !lastDraftMsg) return;
    setApplyError('');
    try {
      let customerId = resolution.existingCustomer?.id || '';
      if (!customerId && resolution.newCustomer && approvedNew.has(resolution.newCustomer.name)) {
        const name = resolution.newCustomer.name;
        const cust = store.addCustomer({
          name, nameAr: name, phone: '', email: '', address: '', taxNumber: '',
          creditLimit: 0, totalInvoiced: 0, totalPaid: 0, totalDue: 0, customPricingRules: [],
        });
        customerId = cust.id;
      }

      if (!customerId) {
        setApplyError(t('ai.applyNoCustomer'));
        return;
      }

      const createdProducts = new Map<string, { id: string; name: string; nameAr: string }>();
      for (const p of store.products) {
        const key = p.name.toLowerCase();
        if (!createdProducts.has(key)) createdProducts.set(key, { id: p.id, name: p.name, nameAr: p.nameAr || p.name });
        if (p.nameAr) {
          const keyAr = p.nameAr.toLowerCase();
          if (!createdProducts.has(keyAr)) createdProducts.set(keyAr, { id: p.id, name: p.name, nameAr: p.nameAr || p.name });
        }
      }

      for (const p of resolution.newProducts) {
        const key = (p.name || '').toLowerCase();
        if (!key || createdProducts.has(key) || !approvedNew.has(p.name)) continue;
        const created = store.addProduct({
          name: p.name, nameAr: p.name || '', sku: '', alternateSkus: [], barcode: '', description: '', descriptionAr: '',
          categoryId: '', unitOfMeasure: 'pc', baseUnit: 'pc', conversionRate: 1,
          purchasePrice: 0, sellingPrice: p.sellingPrice || 0, stock: 0, trackInventory: false,
          lowStockThreshold: 0, reorderPoint: 0, imageUrl: '', hasVariants: false,
        });
        createdProducts.set(key, { id: created.id, name: created.name, nameAr: created.nameAr || created.name });
      }

      const items = resolution.items.map((x) => {
        const product = createdProducts.get(x.newName.toLowerCase());
        const quantity = Number(x.item.quantity) || 0;
        const unitPrice = Number(x.price) || 0;
        const discountPercent = Number(x.item.discountPercent) || 0;
        const taxPercent = Number(x.item.taxPercent) || 0;
        return {
          productId: product?.id || '',
          productName: product?.name || x.name,
          productNameAr: product?.nameAr || x.name,
          quantity,
          unitPrice,
          discountPercent,
          taxPercent,
          lineTotal: quantity * unitPrice * (1 - discountPercent / 100),
        };
      });

      if (items.some((i) => !i.productId)) {
        setApplyError(t('ai.applyMissingProduct'));
        return;
      }

      onApplyDraft({ customerId, items, notes: resolution.draft.notes || '' });
      setAppliedId(lastDraftMsg.id);
      setApprovedNew(new Set());
    } catch (e: any) {
      setApplyError(e?.message || 'Apply failed.');
    }
  };

  const toggleNew = (name: string) => {
    setApprovedNew((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const renderDraftCard = (msg: AIMessage) => {
    if (msg.id !== lastDraftMsg?.id || !resolution) return null;
    if (appliedId === msg.id) {
      return (
        <div className="mt-2 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/40 px-3 py-2 text-xs text-green-700 dark:text-green-300">
          ✓ {t('ai.applied')}
        </div>
      );
    }

    const allPending = pendingNew;

    return (
      <div className="mt-2 rounded-lg border border-primary/30 bg-background px-3 py-2 text-xs space-y-2">
        <p className="font-semibold">{t('ai.draftPreview')}</p>
        <p>
          <span className="text-muted-foreground">{t('customers.name')}: </span>
          <span className="font-medium">{resolution.customerName || t('ai.noCustomer')}</span>
        </p>
        <div className="space-y-1">
          {resolution.items.map((x, i) => (
            <div key={i} className="flex justify-between gap-2">
              <span className="truncate">
                {x.item.quantity} × {x.name}
                {x.existing ? '' : ` ${t('ai.newProductTag')}`}
              </span>
              <span className="font-mono whitespace-nowrap">{formatCurrency(x.price * (x.item.quantity || 0), 'EGP', language)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between border-t pt-1">
          <span className="text-muted-foreground">{t('invoices.grandTotal')}</span>
          <span className="font-mono font-semibold">{formatCurrency(resolution.grandTotal, 'EGP', language)}</span>
        </div>

        {allPending.length > 0 && (
          <div className="space-y-1 border-t pt-1">
            <p className="text-muted-foreground">{t('ai.newRecordsNote')}</p>
            {pendingNew.map((name) => (
              <label key={name} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={approvedNew.has(name)}
                  onChange={() => toggleNew(name)}
                  className="h-3.5 w-3.5"
                />
                <span>{name}</span>
              </label>
            ))}
          </div>
        )}

        {applyError && <p className="text-red-500">{applyError}</p>}

        <Button size="sm" className="w-full" onClick={applyDraft}>
          {t('ai.applyToForm')}
        </Button>
      </div>
    );
  };

  return (
    <AIChat
      title={t('ai.invoiceTitle')}
      subtitle={t('ai.invoiceSubtitle')}
      messages={chat.messages}
      loading={chat.loading}
      onSend={handleSend}
      onClear={() => { chat.clearHistory(); setAppliedId(null); setApplyError(''); }}
      renderAssistant={renderDraftCard}
      suggestions={[t('ai.suggestionInvoice'), t('ai.suggestionInvoiceExample')]}
      compact={compact}
    />
  );
}
