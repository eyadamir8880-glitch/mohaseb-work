'use client';

import { useEffect, useState, useCallback } from 'react';

const SUPABASE_REF = 'kggmwviapfqtddxjmrwd';
const SUPABASE_SQL_EDITOR = `https://supabase.com/dashboard/project/${SUPABASE_REF}/sql/new`;

const MIGRATION_SQL = `-- ============================================================
-- Mohasebeyad Schema Migration
-- Run this in the Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/kggmwviapfqtddxjmrwd/sql/new
-- ============================================================

-- invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS customer_id uuid;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS tax_total numeric DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS discount_total numeric DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS paid_amount numeric DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS issue_date timestamptz;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS due_date timestamptz;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS notes text DEFAULT '';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS terms text DEFAULT '';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS delivery_info jsonb;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS treasury_transaction_id uuid;

-- invoice_items
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS invoice_id uuid;
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS product_id uuid;
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS variant_id uuid;
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS product_name text DEFAULT '';
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS product_name_ar text DEFAULT '';
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS sku text DEFAULT '';
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS quantity numeric DEFAULT 0;
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS unit_price numeric DEFAULT 0;
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS discount_percent numeric DEFAULT 0;
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS tax_percent numeric DEFAULT 0;
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS line_total numeric DEFAULT 0;

-- customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS name_ar text DEFAULT '';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS email text DEFAULT '';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS address text DEFAULT '';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS tax_number text DEFAULT '';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS total_invoiced numeric DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS total_paid numeric DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS total_due numeric DEFAULT 0;

-- products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name_ar text DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS barcode text DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description text DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description_ar text DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id uuid;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit_of_measure text DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS base_unit text DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS conversion_rate numeric DEFAULT 1;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS purchase_price numeric DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS selling_price numeric DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock numeric DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS track_inventory boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS low_stock_threshold numeric DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS reorder_point numeric DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS has_variants boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS alternate_skus jsonb DEFAULT '[]';

-- quotations
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS customer_id uuid;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS tax_total numeric DEFAULT 0;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS discount_total numeric DEFAULT 0;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS issue_date timestamptz;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS expiry_date timestamptz;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS notes text DEFAULT '';
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS terms text DEFAULT '';
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS converted_invoice_id uuid;

-- quotation_items
ALTER TABLE public.quotation_items ADD COLUMN IF NOT EXISTS quotation_id uuid;
ALTER TABLE public.quotation_items ADD COLUMN IF NOT EXISTS product_id uuid;
ALTER TABLE public.quotation_items ADD COLUMN IF NOT EXISTS variant_id uuid;
ALTER TABLE public.quotation_items ADD COLUMN IF NOT EXISTS product_name text DEFAULT '';
ALTER TABLE public.quotation_items ADD COLUMN IF NOT EXISTS product_name_ar text DEFAULT '';
ALTER TABLE public.quotation_items ADD COLUMN IF NOT EXISTS sku text DEFAULT '';
ALTER TABLE public.quotation_items ADD COLUMN IF NOT EXISTS quantity numeric DEFAULT 0;
ALTER TABLE public.quotation_items ADD COLUMN IF NOT EXISTS unit_price numeric DEFAULT 0;
ALTER TABLE public.quotation_items ADD COLUMN IF NOT EXISTS discount_percent numeric DEFAULT 0;
ALTER TABLE public.quotation_items ADD COLUMN IF NOT EXISTS tax_percent numeric DEFAULT 0;
ALTER TABLE public.quotation_items ADD COLUMN IF NOT EXISTS line_total numeric DEFAULT 0;

-- purchase_orders
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS supplier_id uuid;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS tax_total numeric DEFAULT 0;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS grand_total numeric DEFAULT 0;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS paid_amount numeric DEFAULT 0;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS order_date timestamptz;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS expected_date timestamptz;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS received_date timestamptz;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS notes text DEFAULT '';
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS treasury_transaction_id uuid;

-- purchase_order_items
ALTER TABLE public.purchase_order_items ADD COLUMN IF NOT EXISTS purchase_order_id uuid;
ALTER TABLE public.purchase_order_items ADD COLUMN IF NOT EXISTS product_id uuid;
ALTER TABLE public.purchase_order_items ADD COLUMN IF NOT EXISTS variant_id uuid;
ALTER TABLE public.purchase_order_items ADD COLUMN IF NOT EXISTS product_name text DEFAULT '';
ALTER TABLE public.purchase_order_items ADD COLUMN IF NOT EXISTS product_name_ar text DEFAULT '';
ALTER TABLE public.purchase_order_items ADD COLUMN IF NOT EXISTS sku text DEFAULT '';
ALTER TABLE public.purchase_order_items ADD COLUMN IF NOT EXISTS ordered_quantity numeric DEFAULT 0;
ALTER TABLE public.purchase_order_items ADD COLUMN IF NOT EXISTS received_quantity numeric DEFAULT 0;
ALTER TABLE public.purchase_order_items ADD COLUMN IF NOT EXISTS unit_price numeric DEFAULT 0;
ALTER TABLE public.purchase_order_items ADD COLUMN IF NOT EXISTS line_total numeric DEFAULT 0;

-- invoice_payments
ALTER TABLE public.invoice_payments ADD COLUMN IF NOT EXISTS invoice_id uuid;
ALTER TABLE public.invoice_payments ADD COLUMN IF NOT EXISTS amount numeric DEFAULT 0;
ALTER TABLE public.invoice_payments ADD COLUMN IF NOT EXISTS payment_method text DEFAULT '';
ALTER TABLE public.invoice_payments ADD COLUMN IF NOT EXISTS reference text DEFAULT '';
ALTER TABLE public.invoice_payments ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE public.invoice_payments ADD COLUMN IF NOT EXISTS notes text DEFAULT '';

-- payment_methods
ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS type text DEFAULT '';
ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS account_holder text DEFAULT '';
ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS icon text DEFAULT '';
ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS is_protected boolean DEFAULT false;
ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS sort_order numeric DEFAULT 0;

-- suppliers
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS name_ar text DEFAULT '';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS phone text DEFAULT '';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS email text DEFAULT '';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS address text DEFAULT '';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS tax_number text DEFAULT '';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS payment_terms numeric DEFAULT 0;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS notes text DEFAULT '';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS total_pos numeric DEFAULT 0;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS total_paid numeric DEFAULT 0;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS balance_due numeric DEFAULT 0;

-- returns
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS return_number text;
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS type text DEFAULT 'customer';
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS original_invoice_id uuid;
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS original_po_id uuid;
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS refund_amount numeric DEFAULT 0;
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS refund_method text DEFAULT '';
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- treasury_accounts
ALTER TABLE public.treasury_accounts ADD COLUMN IF NOT EXISTS name_ar text DEFAULT '';
ALTER TABLE public.treasury_accounts ADD COLUMN IF NOT EXISTS type text DEFAULT 'cash';
ALTER TABLE public.treasury_accounts ADD COLUMN IF NOT EXISTS balance numeric DEFAULT 0;
ALTER TABLE public.treasury_accounts ADD COLUMN IF NOT EXISTS currency text DEFAULT 'EGP';
ALTER TABLE public.treasury_accounts ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;

-- treasury_transactions
ALTER TABLE public.treasury_transactions ADD COLUMN IF NOT EXISTS type text DEFAULT 'income';
ALTER TABLE public.treasury_transactions ADD COLUMN IF NOT EXISTS amount numeric DEFAULT 0;
ALTER TABLE public.treasury_transactions ADD COLUMN IF NOT EXISTS date date;
ALTER TABLE public.treasury_transactions ADD COLUMN IF NOT EXISTS account_id uuid;
ALTER TABLE public.treasury_transactions ADD COLUMN IF NOT EXISTS from_account_id uuid;
ALTER TABLE public.treasury_transactions ADD COLUMN IF NOT EXISTS to_account_id uuid;
ALTER TABLE public.treasury_transactions ADD COLUMN IF NOT EXISTS payment_method text DEFAULT '';
ALTER TABLE public.treasury_transactions ADD COLUMN IF NOT EXISTS payment_method_detail text DEFAULT '';
ALTER TABLE public.treasury_transactions ADD COLUMN IF NOT EXISTS category_id uuid;
ALTER TABLE public.treasury_transactions ADD COLUMN IF NOT EXISTS description text DEFAULT '';
ALTER TABLE public.treasury_transactions ADD COLUMN IF NOT EXISTS description_ar text DEFAULT '';
ALTER TABLE public.treasury_transactions ADD COLUMN IF NOT EXISTS reference_number text DEFAULT '';
ALTER TABLE public.treasury_transactions ADD COLUMN IF NOT EXISTS receipt_url text DEFAULT '';
ALTER TABLE public.treasury_transactions ADD COLUMN IF NOT EXISTS linked_invoice_id uuid;
ALTER TABLE public.treasury_transactions ADD COLUMN IF NOT EXISTS linked_po_id uuid;
ALTER TABLE public.treasury_transactions ADD COLUMN IF NOT EXISTS linked_return_id uuid;
ALTER TABLE public.treasury_transactions ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false;
ALTER TABLE public.treasury_transactions ADD COLUMN IF NOT EXISTS recurring_pattern text;
ALTER TABLE public.treasury_transactions ADD COLUMN IF NOT EXISTS next_occurrence date;
ALTER TABLE public.treasury_transactions ADD COLUMN IF NOT EXISTS is_reconciled boolean DEFAULT false;
ALTER TABLE public.treasury_transactions ADD COLUMN IF NOT EXISTS reconciled_at timestamptz;

-- warehouses
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS name_ar text DEFAULT '';
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS location text DEFAULT '';
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;

-- stock_movements
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS product_id uuid;
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS variant_id uuid;
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS type text DEFAULT 'in';
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS quantity numeric DEFAULT 0;
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS reason text DEFAULT '';
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS date date;
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS reference_type text DEFAULT '';
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS reference_id text DEFAULT '';
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS warehouse_id uuid;

-- employees
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS name_ar text DEFAULT '';
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS position text DEFAULT '';
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS position_ar text DEFAULT '';
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS phone text DEFAULT '';
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS email text DEFAULT '';
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS address text DEFAULT '';
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS join_date date;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS base_salary numeric DEFAULT 0;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS allowances numeric DEFAULT 0;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS deductions numeric DEFAULT 0;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS net_salary numeric DEFAULT 0;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS notes text DEFAULT '';

-- payroll_records
ALTER TABLE public.payroll_records ADD COLUMN IF NOT EXISTS employee_id uuid;
ALTER TABLE public.payroll_records ADD COLUMN IF NOT EXISTS month numeric DEFAULT 1;
ALTER TABLE public.payroll_records ADD COLUMN IF NOT EXISTS year numeric DEFAULT 2024;
ALTER TABLE public.payroll_records ADD COLUMN IF NOT EXISTS base_salary numeric DEFAULT 0;
ALTER TABLE public.payroll_records ADD COLUMN IF NOT EXISTS allowances numeric DEFAULT 0;
ALTER TABLE public.payroll_records ADD COLUMN IF NOT EXISTS deductions numeric DEFAULT 0;
ALTER TABLE public.payroll_records ADD COLUMN IF NOT EXISTS net_salary numeric DEFAULT 0;
ALTER TABLE public.payroll_records ADD COLUMN IF NOT EXISTS payment_date date;
ALTER TABLE public.payroll_records ADD COLUMN IF NOT EXISTS treasury_transaction_id uuid;
ALTER TABLE public.payroll_records ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- assets
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS name_ar text DEFAULT '';
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS category text DEFAULT '';
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS purchase_date date;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS purchase_cost numeric DEFAULT 0;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS salvage_value numeric DEFAULT 0;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS useful_life numeric DEFAULT 0;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS depreciation_method text DEFAULT 'straight_line';
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS current_book_value numeric DEFAULT 0;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS disposal_date date;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS disposal_price numeric;

-- journal_entries
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS date date;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS reference_number text DEFAULT '';
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS description text DEFAULT '';
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS description_ar text DEFAULT '';
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS total_debit numeric DEFAULT 0;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS total_credit numeric DEFAULT 0;

-- chart_of_accounts
ALTER TABLE public.chart_of_accounts ADD COLUMN IF NOT EXISTS name_ar text DEFAULT '';
ALTER TABLE public.chart_of_accounts ADD COLUMN IF NOT EXISTS code text DEFAULT '';
ALTER TABLE public.chart_of_accounts ADD COLUMN IF NOT EXISTS type text DEFAULT 'asset';
ALTER TABLE public.chart_of_accounts ADD COLUMN IF NOT EXISTS parent_id uuid;
ALTER TABLE public.chart_of_accounts ADD COLUMN IF NOT EXISTS balance numeric DEFAULT 0;

-- notifications
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type text DEFAULT '';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title text DEFAULT '';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title_ar text DEFAULT '';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message text DEFAULT '';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message_ar text DEFAULT '';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS module text DEFAULT '';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS record_id text DEFAULT '';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- audit_logs
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS "user" text DEFAULT '';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS action text DEFAULT '';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS module text DEFAULT '';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS record_id text DEFAULT '';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS old_values jsonb;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS new_values jsonb;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS ip text DEFAULT '';

-- settings
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS key text;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS value text DEFAULT '';

-- import_sessions
ALTER TABLE public.import_sessions ADD COLUMN IF NOT EXISTS filename text DEFAULT '';
ALTER TABLE public.import_sessions ADD COLUMN IF NOT EXISTS uploaded_at timestamptz;
ALTER TABLE public.import_sessions ADD COLUMN IF NOT EXISTS total_rows numeric DEFAULT 0;
ALTER TABLE public.import_sessions ADD COLUMN IF NOT EXISTS imported_count numeric DEFAULT 0;
ALTER TABLE public.import_sessions ADD COLUMN IF NOT EXISTS updated_count numeric DEFAULT 0;
ALTER TABLE public.import_sessions ADD COLUMN IF NOT EXISTS skipped_count numeric DEFAULT 0;
ALTER TABLE public.import_sessions ADD COLUMN IF NOT EXISTS error_count numeric DEFAULT 0;
ALTER TABLE public.import_sessions ADD COLUMN IF NOT EXISTS error_report text;

-- discount_rules
ALTER TABLE public.discount_rules ADD COLUMN IF NOT EXISTS name_ar text DEFAULT '';
ALTER TABLE public.discount_rules ADD COLUMN IF NOT EXISTS type text DEFAULT 'global';
ALTER TABLE public.discount_rules ADD COLUMN IF NOT EXISTS percentage numeric DEFAULT 0;
ALTER TABLE public.discount_rules ADD COLUMN IF NOT EXISTS fixed_amount numeric;
ALTER TABLE public.discount_rules ADD COLUMN IF NOT EXISTS min_quantity numeric DEFAULT 0;
ALTER TABLE public.discount_rules ADD COLUMN IF NOT EXISTS applicable_products jsonb DEFAULT '[]';
ALTER TABLE public.discount_rules ADD COLUMN IF NOT EXISTS applicable_customers jsonb DEFAULT '[]';
ALTER TABLE public.discount_rules ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE public.discount_rules ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE public.discount_rules ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- external_purchases
ALTER TABLE public.external_purchases ADD COLUMN IF NOT EXISTS no numeric DEFAULT 0;
ALTER TABLE public.external_purchases ADD COLUMN IF NOT EXISTS photo text DEFAULT '';
ALTER TABLE public.external_purchases ADD COLUMN IF NOT EXISTS note text DEFAULT '';
ALTER TABLE public.external_purchases ADD COLUMN IF NOT EXISTS name_ar text DEFAULT '';
ALTER TABLE public.external_purchases ADD COLUMN IF NOT EXISTS part_num text DEFAULT '';
ALTER TABLE public.external_purchases ADD COLUMN IF NOT EXISTS description text DEFAULT '';
ALTER TABLE public.external_purchases ADD COLUMN IF NOT EXISTS brand text DEFAULT '';
ALTER TABLE public.external_purchases ADD COLUMN IF NOT EXISTS unit text DEFAULT '';
ALTER TABLE public.external_purchases ADD COLUMN IF NOT EXISTS quantity numeric DEFAULT 0;
ALTER TABLE public.external_purchases ADD COLUMN IF NOT EXISTS cost_price numeric DEFAULT 0;
ALTER TABLE public.external_purchases ADD COLUMN IF NOT EXISTS total_cost_price numeric DEFAULT 0;
ALTER TABLE public.external_purchases ADD COLUMN IF NOT EXISTS item_no text DEFAULT '';
ALTER TABLE public.external_purchases ADD COLUMN IF NOT EXISTS weight numeric DEFAULT 0;
ALTER TABLE public.external_purchases ADD COLUMN IF NOT EXISTS total_weight numeric DEFAULT 0;
ALTER TABLE public.external_purchases ADD COLUMN IF NOT EXISTS sell_price numeric DEFAULT 0;
ALTER TABLE public.external_purchases ADD COLUMN IF NOT EXISTS total_sell_price numeric DEFAULT 0;
ALTER TABLE public.external_purchases ADD COLUMN IF NOT EXISTS product_id uuid;
ALTER TABLE public.external_purchases ADD COLUMN IF NOT EXISTS import_session_id uuid;

-- customer_statements
ALTER TABLE public.customer_statements ADD COLUMN IF NOT EXISTS customer_id uuid;
ALTER TABLE public.customer_statements ADD COLUMN IF NOT EXISTS date date;
ALTER TABLE public.customer_statements ADD COLUMN IF NOT EXISTS type text DEFAULT '';
ALTER TABLE public.customer_statements ADD COLUMN IF NOT EXISTS reference_number text DEFAULT '';
ALTER TABLE public.customer_statements ADD COLUMN IF NOT EXISTS description text DEFAULT '';
ALTER TABLE public.customer_statements ADD COLUMN IF NOT EXISTS description_ar text DEFAULT '';
ALTER TABLE public.customer_statements ADD COLUMN IF NOT EXISTS debit numeric DEFAULT 0;
ALTER TABLE public.customer_statements ADD COLUMN IF NOT EXISTS credit numeric DEFAULT 0;
ALTER TABLE public.customer_statements ADD COLUMN IF NOT EXISTS balance numeric DEFAULT 0;

-- pricing_rules
ALTER TABLE public.pricing_rules ADD COLUMN IF NOT EXISTS product_id uuid;
ALTER TABLE public.pricing_rules ADD COLUMN IF NOT EXISTS discount_percent numeric DEFAULT 0;
ALTER TABLE public.pricing_rules ADD COLUMN IF NOT EXISTS fixed_price numeric;

-- deliveries
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS invoice_id uuid;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS type text DEFAULT 'internal';
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS driver_id uuid;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS cost numeric DEFAULT 0;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS expected_date date;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS tracking_number text DEFAULT '';
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS notes text DEFAULT '';

-- Enable Realtime for all tables (skip if already added)
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END LOOP;
END $$;`;

export default function MigratePage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(MIGRATION_SQL);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = MIGRATION_SQL;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }, []);

  const handleCopyAndOpen = useCallback(async () => {
    await handleCopy();
    window.open(SUPABASE_SQL_EDITOR, '_blank');
  }, [handleCopy]);

  useEffect(() => {
    handleCopy();
  }, [handleCopy]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-2xl font-bold">Database Migration</h1>
        <p className="mb-6 text-gray-600">
          Adds missing columns to all Supabase tables. SQL auto-copied to clipboard.
        </p>

        <div className="mb-6 overflow-hidden rounded-lg border bg-white shadow-sm">
          <div className="border-b bg-gray-50 px-4 py-3">
            <h2 className="font-semibold">Quick Run</h2>
            <p className="text-xs text-gray-500">One click &rarr; paste in SQL Editor &rarr; click Run</p>
          </div>
          <div className="p-4">
            <button
              onClick={handleCopyAndOpen}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              {copied ? 'Copied! Opening SQL Editor...' : 'Copy SQL & Open Supabase Editor'}
            </button>
            <p className="mt-2 text-center text-xs text-gray-400">
              In SQL Editor: Ctrl+V, then click <strong>Run</strong>
            </p>
          </div>
        </div>

        <div className="mb-6 overflow-hidden rounded-lg border bg-white shadow-sm">
          <div className="border-b bg-gray-50 px-4 py-3">
            <h2 className="font-semibold">Migration SQL</h2>
            <p className="text-xs text-gray-500">Full schema migration (auto-copied on page load)</p>
          </div>
          <pre className="overflow-auto bg-gray-900 p-4 text-xs text-green-400 max-h-96">
            <code>{MIGRATION_SQL}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
