'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/providers/language-provider';
import { useAppStore } from '@/stores/use-app-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, generateId } from '@/lib/utils';
import { Search, Plus, Minus, Trash2, ShoppingCart, X, Printer, Check, CreditCard, Wallet, Smartphone } from 'lucide-react';
import { PAYMENT_METHODS } from '@/lib/constants';
import type { Product, TreasuryAccount, InvoiceItem } from '@/lib/types';

type CartItem = {
  productId: string;
  productName: string;
  productNameAr: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export default function POSPage() {
  const { language, t } = useLanguage();
  const products = useAppStore((s) => s.products);
  const categories = useAppStore((s) => s.categories);
  const invoices = useAppStore((s) => s.invoices);
  const addInvoice = useAppStore((s) => s.addInvoice);
  const addTreasuryTransaction = useAppStore((s) => s.addTreasuryTransaction);
  const updateTreasuryAccount = useAppStore((s) => s.updateTreasuryAccount);
  const updateProduct = useAppStore((s) => s.updateProduct);
  const addStockMovement = useAppStore((s) => s.addStockMovement);
  const settings = useAppStore((s) => s.settings);
  const treasuryAccounts = useAppStore((s) => s.treasuryAccounts);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState('cash');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastPayment, setLastPayment] = useState<{
    items: CartItem[];
    subtotal: number;
    discount: number;
    grandTotal: number;
    paid: number;
    change: number;
    paymentMethod: string;
    invoiceNumber: string;
    date: string;
  } | null>(null);
  const [paidAmount, setPaidAmount] = useState(0);

  const productCats = useMemo(() => {
    return categories.filter((c) => c.type === 'product');
  }, [categories]);

  const displayProducts = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      const matchCat = catFilter === 'all' || p.categoryId === catFilter;
      return matchSearch && matchCat;
    });
  }, [products, search, catFilter]);

  const subtotal = useMemo(() => {
    return cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  }, [cart]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - discount);
  }, [subtotal, discount]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1, lineTotal: (i.quantity + 1) * i.unitPrice }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          productNameAr: product.nameAr,
          sku: product.sku,
          quantity: 1,
          unitPrice: product.sellingPrice,
          lineTotal: product.sellingPrice,
        },
      ];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.max(1, i.quantity + delta), lineTotal: Math.max(1, i.quantity + delta) * i.unitPrice }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setPaidAmount(0);
    setSelectedPayment('cash');
  };

  const getLowStock = (p: Product) => {
    if (!p.trackInventory) return false;
    return p.stock <= p.lowStockThreshold;
  };

  const getOutOfStock = (p: Product) => {
    return p.trackInventory && p.stock <= 0;
  };

  const getPaymentMethodName = (id: string) => {
    const pm = PAYMENT_METHODS.find((p) => p.id === id);
    return pm ? (language === 'ar' ? pm.nameAr : pm.name) : id;
  };

  const getDefaultAccount = (): string => {
    const defaultAcc = treasuryAccounts.find((a) => a.isDefault);
    return defaultAcc?.id || treasuryAccounts[0]?.id || '';
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const nextNum = settings.find((s: any) => s.key === 'invoiceNextNumber');
    const prefix = settings.find((s: any) => s.key === 'invoicePrefix');
    const num = nextNum ? parseInt(nextNum.value) || 1 : 1;
    const invPrefix = prefix?.value || 'INV';
    const invoiceNumber = `${invPrefix}-${String(num).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const invItems: InvoiceItem[] = cart.map((i) => ({
      id: generateId(),
      productId: i.productId,
      variantId: null,
      productName: i.productName,
      productNameAr: i.productNameAr,
      sku: i.sku,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      discountPercent: 0,
      taxPercent: 0,
      lineTotal: i.lineTotal,
    }));

    const invoice: any = {
      invoiceNumber,
      customerId: '',
      items: invItems,
      payments: [],
      subtotal,
      taxTotal: 0,
      discountTotal: discount,
      grandTotal,
      paidAmount: grandTotal,
      status: 'paid',
      issueDate: now,
      dueDate: now,
      notes: `Paid via ${getPaymentMethodName(selectedPayment)}`,
      terms: '',
      deliveryInfo: null,
      treasuryTransactionId: null,
    };

    const createdInvoice = addInvoice(invoice);

    cart.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product && product.trackInventory) {
        updateProduct(product.id, { stock: product.stock - item.quantity });
      }
      addStockMovement({
        productId: item.productId, variantId: null, type: 'out', quantity: item.quantity,
        reason: 'POS Sale', date: now.split('T')[0],
        referenceType: 'invoice', referenceId: createdInvoice.id, warehouseId: '',
      });
    });

    const accountId = getDefaultAccount();
    if (accountId) {
      addTreasuryTransaction({
        type: 'income',
        amount: grandTotal,
        date: now,
        accountId,
        fromAccountId: null,
        toAccountId: null,
        paymentMethod: selectedPayment,
        paymentMethodDetail: getPaymentMethodName(selectedPayment),
        categoryId: '',
        description: `POS Sale ${invoiceNumber}`,
        descriptionAr: `بيع نقطة بيع ${invoiceNumber}`,
        referenceNumber: invoiceNumber,
        receiptUrl: '',
        linkedInvoiceId: createdInvoice.id,
        linkedPOId: null,
        linkedReturnId: null,
        isRecurring: false,
        recurringPattern: null,
        nextOccurrence: null,
        isReconciled: false,
        reconciledAt: null,
      });
      const acc = treasuryAccounts.find((a) => a.id === accountId);
      if (acc) {
        updateTreasuryAccount(accountId, { balance: (acc.balance || 0) + grandTotal });
      }
    }

    const change = Math.max(0, paidAmount - grandTotal);

    setLastPayment({
      items: [...cart],
      subtotal,
      discount,
      grandTotal,
      paid: paidAmount > 0 ? paidAmount : grandTotal,
      change,
      paymentMethod: selectedPayment,
      invoiceNumber,
      date: new Date().toLocaleString(),
    });
    setShowReceipt(true);
    clearCart();
  };

  const handleQuickPay = (method: string, presetAmount?: number) => {
    setSelectedPayment(method);
    if (presetAmount) {
      setPaidAmount(presetAmount);
    } else {
      setPaidAmount(grandTotal);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const quickPayments = useMemo(() => {
    return PAYMENT_METHODS.filter((pm) =>
      ['cash', 'vodafone_cash', 'instapay', 'card'].includes(pm.type) && pm.isActive
    );
  }, []);

  const incomeCats = useMemo(() => {
    return categories.filter((c) => c.type === 'income');
  }, [categories]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col print:h-auto">
      <div className="flex-1 flex gap-4 overflow-hidden print:hidden">
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">POS</h1>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setCatFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                catFilter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              {t('app.all')}
            </button>
            {productCats.map((c) => (
              <button
                key={c.id}
                onClick={() => setCatFilter(c.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  catFilter === c.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                {language === 'ar' ? c.nameAr : c.name}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('app.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {displayProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => !getOutOfStock(p) && addToCart(p)}
                  disabled={getOutOfStock(p)}
                  className={`text-left rounded-lg border p-3 hover:border-primary hover:shadow-sm transition-all ${
                    getOutOfStock(p) ? 'opacity-40 cursor-not-allowed border-dashed' : 'cursor-pointer bg-card'
                  }`}
                >
                  <div className="font-medium text-sm leading-tight line-clamp-2 mb-1">
                    {language === 'ar' ? p.nameAr || p.name : p.name}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono mb-1">{p.sku}</div>
                  <div className="text-base font-bold text-primary">
                    {formatCurrency(p.sellingPrice, 'EGP', language)}
                  </div>
                  {p.trackInventory && (
                    <div className="mt-1">
                      {p.stock <= 0 ? (
                        <Badge variant="red">Out</Badge>
                      ) : p.stock <= p.lowStockThreshold ? (
                        <Badge variant="yellow">{t('products.lowStock')} ({p.stock})</Badge>
                      ) : (
                        <Badge variant="green">{p.stock} {t('products.unit')}</Badge>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="w-96 flex flex-col gap-3 border-l pl-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              {t('invoices.items')} ({cart.length})
            </h2>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart} className="text-red-500">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mb-2 opacity-20" />
                <p className="text-sm">Click products to add</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.productId} className="flex items-center gap-2 bg-muted/30 rounded-lg p-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.unitPrice, 'EGP', language)} × {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQty(item.productId, -1)}
                      className="btn-ghost btn-sm p-1 h-7 w-7 flex items-center justify-center rounded"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.productId, 1)}
                      className="btn-ghost btn-sm p-1 h-7 w-7 flex items-center justify-center rounded"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <p className="text-sm font-semibold">{formatCurrency(item.lineTotal, 'EGP', language)}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="btn-ghost btn-sm p-1 text-red-400 hover:text-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2 border-t pt-3">
            <div className="flex justify-between text-sm">
              <span>{t('invoices.subtotal')}</span>
              <span>{formatCurrency(subtotal, 'EGP', language)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm">{t('invoices.discount')}</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-28 text-right text-sm"
              />
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>{t('invoices.grandTotal')}</span>
              <span className="text-primary">{formatCurrency(grandTotal, 'EGP', language)}</span>
            </div>
          </div>

          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('treasury.paymentMethod')}</p>
            <div className="grid grid-cols-2 gap-2">
              {quickPayments.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => handleQuickPay(pm.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    selectedPayment === pm.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {pm.type === 'cash' && <Wallet className="h-4 w-4" />}
                  {pm.type === 'card' && <CreditCard className="h-4 w-4" />}
                  {pm.type === 'vodafone_cash' && <Smartphone className="h-4 w-4" />}
                  {pm.type === 'instapay' && <Smartphone className="h-4 w-4" />}
                  <span className="truncate">{language === 'ar' ? pm.nameAr : pm.name}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Paid:</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={paidAmount}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                className="text-right text-sm"
              />
            </div>
            {paidAmount > grandTotal && (
              <div className="flex justify-between text-sm text-green-600 font-semibold">
                <span>Change:</span>
                <span>{formatCurrency(paidAmount - grandTotal, 'EGP', language)}</span>
              </div>
            )}
          </div>

          <Button
            size="lg"
            className="w-full gap-2 text-base"
            disabled={cart.length === 0}
            onClick={handleCheckout}
          >
            <Check className="h-5 w-5" />
            {t('invoices.markAsPaid')} — {formatCurrency(grandTotal, 'EGP', language)}
          </Button>
        </div>
      </div>

      {showReceipt && lastPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:bg-white print:relative print:inset-auto">
          <div className="bg-white text-black rounded-lg shadow-xl w-full max-w-sm mx-4 p-6 print:shadow-none print:rounded-none print:max-w-none print:mx-0 print:p-4">
            <div className="text-center mb-4 print:mb-3">
              <h2 className="font-bold text-lg">{settings.find((s: any) => s.key === 'companyName')?.value || 'Mohasebeyad'}</h2>
              <p className="text-xs text-gray-500">
                {settings.find((s: any) => s.key === 'companyAddress')?.value || ''}
              </p>
              <p className="text-xs text-gray-500">{t('app.phone')}: {settings.find((s: any) => s.key === 'companyPhone')?.value || ''}</p>
            </div>

            <div className="font-mono text-xs space-y-1">
              <div className="text-center mb-2">
                <p className="font-bold text-sm">SALES RECEIPT</p>
              </div>

              <div className="border-t border-dashed border-gray-400 pt-1">
                <div className="flex justify-between">
                  <span>Invoice:</span>
                  <span className="font-semibold">{lastPayment.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{lastPayment.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment:</span>
                  <span>{getPaymentMethodName(lastPayment.paymentMethod)}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-400 pt-1">
                <div className="flex justify-between font-semibold text-xs">
                  <span className="flex-1">Item</span>
                  <span className="w-16 text-right">Qty</span>
                  <span className="w-20 text-right">Price</span>
                  <span className="w-20 text-right">Total</span>
                </div>
                {lastPayment.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-[11px]">
                    <span className="flex-1 truncate">{item.productName}</span>
                    <span className="w-16 text-right">{item.quantity}</span>
                    <span className="w-20 text-right">{item.unitPrice.toFixed(2)}</span>
                    <span className="w-20 text-right">{item.lineTotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-400 pt-1 space-y-0.5">
                <div className="flex justify-between">
                  <span>{t('invoices.subtotal')}</span>
                  <span>{lastPayment.subtotal.toFixed(2)}</span>
                </div>
                {lastPayment.discount > 0 && (
                  <div className="flex justify-between">
                    <span>{t('invoices.discount')}</span>
                    <span>-{lastPayment.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm border-t border-double border-gray-400 pt-1">
                  <span>{t('invoices.grandTotal')}</span>
                  <span>{lastPayment.grandTotal.toFixed(2)} EGP</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid</span>
                  <span>{lastPayment.paid.toFixed(2)}</span>
                </div>
                {lastPayment.change > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Change</span>
                    <span>{lastPayment.change.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="text-center mt-3 pt-2 border-t border-dashed border-gray-400">
                <p className="text-xs font-semibold">Thank you for your purchase!</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {settings.find((s: any) => s.key === 'companyTaxNumber')?.value
                    ? `Tax#: ${settings.find((s: any) => s.key === 'companyTaxNumber')?.value}`
                    : ''}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-4 print:hidden">
              <Button variant="outline" className="flex-1 gap-2" onClick={handlePrint}>
                <Printer className="h-4 w-4" /> {t('app.print')}
              </Button>
              <Button className="flex-1 gap-2" onClick={() => setShowReceipt(false)}>
                <Check className="h-4 w-4" /> {t('app.close')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
