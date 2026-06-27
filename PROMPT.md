# Mohasebeyad — Full Application Specification

## Overview

Mohasebeyad is a bilingual (English/Arabic) accounting & ERP web application for automotive spare parts businesses. It is fully built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand, and Supabase (optional). The app works entirely offline with mock data and optionally syncs to Supabase when configured.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router), all pages `'use client'` |
| Language | TypeScript |
| Styling | Tailwind CSS + custom CSS in `globals.css` |
| State | Zustand with `persist` middleware (localStorage, key: `mohasebeyad-storage`) |
| Backend | Optional Supabase (Postgres + Realtime). Falls back to in-memory mock data. |
| Charts | Recharts (BarChart, PieChart, LineChart, ResponsiveContainer) |
| Icons | Lucide React + inline SVGs |
| i18n | Custom React Context with nested proxy translator |
| Forms | Raw controlled components |
| File handling | xlsx, file-saver, jszip |
| UI | Custom-built (Card, Button, Input, Badge, Modal, Select, Tabs, DataTable, Skeleton) |

---

## Project Structure

```
src/
├── app/
│   ├── globals.css              # Tailwind + custom component classes
│   ├── layout.tsx               # Root layout (html/body, no providers)
│   ├── page.tsx                 # Home → redirects to /dashboard
│   ├── not-found.tsx            # Custom 404
│   └── (dashboard)/
│       ├── layout.tsx           # Dashboard layout: Sidebar + Header + main content
│       └── {module}/page.tsx    # Each module page (20 total)
│
├── components/
│   ├── layout/   (sidebar.tsx, header.tsx, toast-container.tsx)
│   ├── ui/       (card.tsx, button.tsx, input.tsx, badge.tsx, skeleton.tsx, modal.tsx, select.tsx, tabs.tsx, data-table.tsx)
│   ├── charts/   (reserved)
│   ├── forms/    (reserved)
│   ├── modals/   (reserved)
│   └── tables/   (reserved)
│
├── providers/
│   ├── providers.tsx            # Combined provider wrapper
│   ├── theme-provider.tsx       # Light/dark context + toggle
│   ├── language-provider.tsx    # en/ar context + proxy translator `t`
│   ├── toast-provider.tsx       # Toast stack with auto-dismiss
│   └── api-provider.tsx         # Initializes store, sets mock DB
│
├── stores/
│   └── use-app-store.ts         # Zustand store — central state management (~2500 lines)
│
├── hooks/
│   ├── use-query.ts             # Generic async query hook
│   ├── use-toast.ts             # Imperative toast API
│   ├── use-toast-provider.tsx   # React context wrapper for toast
│   └── use-supabase-realtime.ts # Subscribes to Postgres changes
│
├── i18n/
│   ├── en.ts                    # English translations object
│   └── ar.ts                    # Arabic translations object
│
├── lib/
│   ├── types.ts                 # ALL TypeScript interfaces (30+ entity types)
│   ├── constants.ts             # Payment methods, default settings, nav items, units
│   ├── utils.ts                 # cn(), formatCurrency(), formatDate(), generateId(), status colors
│   ├── supabase.ts              # Supabase client singleton
│   ├── mock-data.ts             # Generates demo data (auto parts focused)
│   └── api-client.ts            # CRUD client with Supabase + mock fallback
│
└── types/
    └── index.ts                 # Older shorter type definitions
```

---

## Data Model (defined in `src/lib/types.ts`)

| Entity | Key Fields |
|--------|-----------|
| **Customer** | id, name, nameAr, phone, email, address, taxNumber, creditLimit, totalInvoiced, totalPaid, totalDue, customPricingRules[] |
| **Supplier** | id, name, nameAr, phone, email, address, taxNumber, paymentTerms, notes, totalPOs, totalPaid, balanceDue |
| **Product** | id, name, nameAr, sku, alternateSkus[], barcode, description, descriptionAr, categoryId, unitOfMeasure, baseUnit, conversionRate, purchasePrice, sellingPrice, stock, trackInventory, lowStockThreshold, reorderPoint, imageUrl, hasVariants |
| **ProductVariant** | id, productId, sku, barcode, attributeName, attributeValue, priceOverride, stock, imageUrl |
| **Category** | id, name, nameAr, type: 'product' \| 'income' \| 'expense', parentId, description, sortOrder |
| **ChartOfAccount** | id, name, nameAr, code, type: 'asset' \| 'liability' \| 'equity' \| 'income' \| 'expense', parentId, balance |
| **Invoice** | id, invoiceNumber, customerId, items[], subtotal, taxTotal, discountTotal, grandTotal, paidAmount, status (draft/sent/partially_paid/paid/overdue/cancelled/partially_returned/fully_returned), issueDate, dueDate, notes, terms, deliveryInfo, treasuryTransactionId, payments[] |
| **InvoiceItem** | id, productId, variantId, productName, productNameAr, sku, quantity, unitPrice, discountPercent, taxPercent, lineTotal |
| **InvoicePayment** | id, invoiceId, amount, paymentMethod, reference, paidAt, notes |
| **Quotation** | id, quotationNumber, customerId, items[], subtotal, taxTotal, discountTotal, grandTotal, status (draft/sent/accepted/rejected/expired/converted), issueDate, expiryDate, notes, terms, convertedInvoiceId |
| **PurchaseOrder** | id, poNumber, supplierId, items[], subtotal, taxTotal, grandTotal, paidAmount, status (draft/sent/partially_received/received/paid/cancelled), orderDate, expectedDate, receivedDate, notes, treasuryTransactionId |
| **PurchaseOrderItem** | id, productId, variantId, productName, productNameAr, sku, orderedQuantity, receivedQuantity, unitPrice, lineTotal |
| **Return** | id, returnNumber, type: 'customer' \| 'supplier', originalInvoiceId, originalPOId, items[], refundAmount, refundMethod, status |
| **ReturnItem** | id, productId, variantId, productName, productNameAr, sku, quantity, unitPrice, refundAmount, condition: 'good' \| 'bad', reason |
| **TreasuryAccount** | id, name, nameAr, type: 'cash' \| 'bank' \| 'vodafone_cash' \| 'instapay', balance, currency, isDefault |
| **TreasuryTransaction** | id, type: 'income' \| 'expense' \| 'transfer', amount, date, accountId, fromAccountId, toAccountId, paymentMethod, paymentMethodDetail, categoryId, description, descriptionAr, referenceNumber, receiptUrl, linkedInvoiceId, linkedPOId, linkedReturnId, isRecurring, recurringPattern, nextOccurrence, isReconciled, reconciledAt |
| **StockMovement** | id, productId, variantId, type: 'in' \| 'out' \| 'adjustment', quantity, reason, date, referenceType, referenceId, warehouseId |
| **Warehouse** | id, name, nameAr, location, isDefault |
| **Employee** | id, name, nameAr, position, positionAr, phone, email, address, joinDate, baseSalary, allowances, deductions, netSalary, status (active/on_leave/terminated), notes |
| **PayrollRecord** | id, employeeId, month, year, baseSalary, allowances, deductions, netSalary, paymentDate, treasuryTransactionId, status (pending/paid) |
| **Asset** | id, name, nameAr, category, purchaseDate, purchaseCost, salvageValue, usefulLife, depreciationMethod (straight_line/declining_balance), currentBookValue, status (active/disposed), disposalDate, disposalPrice, depreciationRecords[] |
| **JournalEntry** | id, date, referenceNumber, description, descriptionAr, lines[], totalDebit, totalCredit, attachments[] |
| **JournalLine** | id, journalEntryId, accountId, debit, credit, description, descriptionAr |
| **Delivery** | id, invoiceId, type, driverId, cost, expectedDate, trackingNumber, status, notes |
| **Notification** | id, type, title, titleAr, message, messageAr, module, recordId, isRead, readAt |
| **AuditLog** | id, timestamp, user, action, module, recordId, oldValues, newValues, ip |
| **DiscountRule** | id, name, nameAr, type, percentage, fixedAmount, minQuantity, applicableProducts[], applicableCustomers[], startDate, endDate, isActive |
| **PaymentMethod** | id, name, nameAr, type, accountHolder, icon, isActive, isProtected, sortOrder |
| **ExternalPurchase** | id, no, photo, note, nameAr, partNum, description, brand, unit, quantity, costPrice, totalCostPrice, itemNo, weight, totalWeight, sellPrice, totalSellPrice, productId, importSessionId |
| **CustomerStatement** | id, customerId, date, type, referenceNumber, description, descriptionAr, debit, credit, balance |

---

## Modules / Pages (20 total)

### 1. Dashboard `/dashboard`
- KPI cards: Total Revenue, Total Expenses, Net Profit, Outstanding Invoices, Current Balance
- Charts: Revenue vs Expenses (BarChart), Sales by Category (PieChart), Monthly Trends (LineChart) via Recharts
- Recent Activity: Last 10 invoices + transactions with status badges
- Quick Actions: New Invoice, New Customer, New Product, New Transaction

### 2. POS `/pos`
- Full Point of Sale interface
- Left: Product grid with category filters + search (name, SKU, price, stock badge)
- Right: Cart with +/- quantity, line total, remove. Subtotal + discount + grand total.
- Payment: Quick buttons (Cash, Vodafone Cash, InstaPay, Card), paid amount with change calculation
- Checkout: Creates paid invoice, deducts stock, creates treasury income, shows printable thermal receipt (80mm)

### 3. Invoices `/invoices`
- List: Search by invoice# / customer, filter by status. Shows invoice#, customer, dates, total, paid amount (progress bar), status badge
- Actions: Record Payment (modal), View Payments (table), Delete
- Create: Modal with customer select, dates, dynamic items (product → auto-fill price), discounts, tax
- Tracks payment history, auto-updates status, auto-creates treasury transactions

### 4. Quotations `/quotations`
- Similar to Invoices. Has expiry date and status flow: draft → sent → accepted → converted
- Convert to Invoice button copies quotation data to a new invoice

### 5. Customers `/customers`
- List: Bilingual name, phone, email, total invoiced/paid/due, credit limit
- CRUD: Bilingual fields, phone, email, address, tax number, credit limit
- Customer Account Statement (`/customer-account`): Select customer → running balance from invoices/transactions

### 6. Suppliers `/suppliers`
- Same pattern as Customers. Shows total POs, total paid, balance due

### 7. Products `/products`
- List: Name, SKU, category, purchase/selling price, stock (color-coded), status badge
- CRUD: Bilingual names, SKU, barcode, description, category, unit, prices, track inventory, stock thresholds
- Bulk Import: Excel (.xlsx/.xls/.csv) drag-drop, preview, validate, import
- Delete All

### 8. Variants `/variants`
- Product variants CRUD: SKU, barcode, attribute name/value, price override, stock, image

### 9. Categories `/categories`
- Tabs: Product / Income / Expense
- CRUD: Bilingual name, parent, type. Delete All.

### 10. Warehouse `/warehouse`
- KPIs: Total SKUs, Stock Value (purchase price), Low Stock count, Out of Stock count
- Tabs: Stock Levels (products table), Stock Movements (IN/OUT/ADJ table)
- Delete All movements

### 11. Purchase Orders `/purchase-orders`
- List: PO#, supplier, dates, total, status badge
- CRUD: Supplier, dates, status, items (product → auto-fill purchase price)
- Receive Stock: Modal → updates stock (+), creates movements
- Mark Paid: Payment modal → creates treasury expense
- Status flow: draft → sent → partially_received → received → paid

### 12. External Purchases `/external-purchases`
- Import Excel from suppliers (maps multiple column name variations)
- Matches products by SKU → updates stock + creates records
- Stats: Total imports, items imported, total cost, stock added
- Export filtered data to Excel
- Filter by brand, multi-field search

### 13. Customer Account Statement `/customer-account`
- Select customer → running balance statement
- Lines from invoices (debit), payments (credit), returns, opening balance

### 14. Returns `/returns`
- Customer or supplier returns
- Select original invoice/PO → load items → specify quantities + condition (good/bad)
- Good items restocked, bad items don't
- Updates invoice/PO status, creates stock movements

### 15. Treasury `/treasury`
- Account cards: Balance per account + total
- Transactions table: Date, type badge, amount (+/-), payment method, description, account
- Add Transaction: Type (income/expense/transfer), amount, date, accounts, payment method, bilingual description
- Transfers: Dual account balance update (from - / to +)

### 16. Employees `/employees`
- List: Name, position, phone, salary, join date, status
- CRUD: Bilingual name/position, phone, email, address, join date, base salary, allowances, deductions (auto nets salary)
- Payroll: Select month/year → creates payroll records for active employees + treasury expense transactions

### 17. Assets `/assets`
- Fixed assets: Bilingual name, category, purchase date/cost, salvage value, useful life, depreciation method
- Shows current book value, status (active/disposed)
- CRUD

### 18. Journal Entries `/journal-entries`
- Double-entry accounting
- List: Date, reference#, description, total debit, total credit
- CRUD: Date, reference#, bilingual description, dynamic lines with account select + debit/credit
- Enforces debit = credit (Save disabled if unbalanced)
- Chart of Accounts management: Add/delete accounts with code, bilingual name, type

### 19. Audit Log `/audit-log`
- Read-only table: timestamp, user, action, module, record ID, old/new values, IP
- Every CRUD operation auto-logs to audit log

### 20. Reports `/reports`
- Date range filter
- Tabs: Financial (P&L, Trial Balance), Sales (by product), Treasury (payment method chart), Inventory (SKUs, values)
- Export CSV

### 21. Settings `/settings`
- Tabs: Company, Invoice, Payment Methods, Data Management, Import History
- Company: Bilingual name, phone, email, address, tax number, currency (EGP/SAR/USD)
- Invoice: Prefixes (INV/QT/PO), default tax rate, bilingual terms
- Payment Methods: List with active/inactive toggle, add custom
- Data Management: Save/Load session (JSON), Export All, Reset to demo data. Shows theme & language.
- Import History: Past imports table

---

## Core Features & Logic

### State Management (`use-app-store.ts`)
- Full CRUD for every entity: `addX`, `updateX`, `deleteX`
- `initializeStore()`: Checks localStorage → Supabase → mock data fallback
- `resetToDemo()`: Regenerates demo data
- `getStateSnapshot()` / `loadState()`: JSON backup/restore
- Supabase sync on every write operation
- Auto audit logging on every create/update/delete
- Auto notifications on key events
- Zustand persist middleware → localStorage

### API Client (`api-client.ts`)
- Dual-mode: Supabase direct or in-memory mock DB
- GET, POST, PUT, DELETE with snake_case ↔ camelCase conversion
- Dashboard aggregation query
- Audit log auto-insertion
- 5% random failure simulation (mock mode)

### i18n System
- Proxy-based translator: `t.dashboard.title` or `t('dashboard.title')` with params
- RTL/LTR via `dir` attribute on `<html>`
- Arabic: Cairo + Tajawal fonts, English: Inter font
- Translation objects in `src/i18n/{en,ar}.ts`

### Theme
- Light/dark toggle, persisted in Zustand store
- CSS variables (HSL), applied via `<html>` class + color-scheme

### UI Components
- **Button**: Variants (primary/secondary/outline/danger/success/ghost), sizes (sm/md/lg/icon), loading spinner
- **Card**: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- **Input**: Label, error, all HTML input types
- **Badge**: Color variants (green/red/yellow/blue/gray)
- **Modal**: Overlay + panel, title, close, sizes (default/wide/full)
- **Select**: Native select with label
- **Tabs**: Controlled tab list + content panels
- **DataTable**: Sortable columns, custom render functions, empty state
- **Skeleton**: Loading placeholder

### Custom CSS (`globals.css`)
- Sidebar, card, button, input, badge, table, page header styles
- KPI card styles
- Print styles (A4, hide `.no-print`, show `.print-only`)
- POS receipt styles (80mm thermal)
- Animations: slideIn, shrink, fadeIn, slideUp
- Custom scrollbar

---

## Key Business Logic

1. **Invoice Payment**: Records payment → auto-updates status → creates treasury income → audit log
2. **POS Checkout**: Creates paid invoice → deducts stock → creates treasury income → prints receipt
3. **PO Receive**: Updates status → adds stock → creates IN movements
4. **PO Payment**: Creates treasury expense transaction
5. **Returns**: Customer return restocks good items, updates invoice; supplier return deducts stock
6. **External Purchase Import**: Parses Excel → matches SKU → updates stock + creates records
7. **Payroll**: Creates records + expense transactions for active employees
8. **Journal Entries**: Double-entry with debit = credit enforcement

---

## Navigation (Sidebar)

20 items: Dashboard, POS, Invoices, Quotations, Customers, Suppliers, Products, Variants, Warehouse, Purchase Orders, External Purchases, Account Statement, Returns, Treasury, Employees, Journal Entries, Assets, Categories, Reports, Settings

Collapsible (70px ↔ 260px), logo, unread notification badge, RTL support.

---

## Header

App name, language (EN/AR), theme toggle, save/load session, notification bell with unread count.

---

## Demo Data

Automotive spare parts focus: radiators, brakes, filters, spark plugs, belts, etc. Realistic names with Arabic translations, SKUs, barcodes, EGP prices. Brands: Toyota, Hyundai, Nissan, BMW, Mercedes, Kia, Chevrolet, Honda, Mitsubishi, VW, Ford. 15 product categories, 25 income/expense categories, ~80+ products.

---

## Requirements Summary

Build this app from scratch with the following properties:

1. Fully offline with mock data (no backend dependency)
2. Optional Supabase sync when configured
3. Full bilingual English/Arabic with RTL support
4. Light/dark theme
5. All data persisted to localStorage
6. All 20 modules with full CRUD
7. POS with receipt printing (80mm thermal)
8. Excel import/export for products and external purchases
9. Audit logging for every action
10. Data backup/restore via JSON files
