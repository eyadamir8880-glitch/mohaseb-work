-- Categories
CREATE TABLE categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  name_ar     text NOT NULL DEFAULT '',
  type        text NOT NULL CHECK (type IN ('product', 'income', 'expense')),
  parent_id   uuid REFERENCES categories(id) ON DELETE SET NULL,
  description text NOT NULL DEFAULT '',
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_categories_type ON categories(type);

-- Chart of Accounts
CREATE TABLE chart_of_accounts (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name      text NOT NULL,
  name_ar   text NOT NULL DEFAULT '',
  code      text NOT NULL DEFAULT '',
  type      text NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'income', 'expense')),
  parent_id uuid REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
  balance   numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_coa_type ON chart_of_accounts(type);
CREATE INDEX idx_coa_code ON chart_of_accounts(code);

-- Warehouses
CREATE TABLE warehouses (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  name_ar    text NOT NULL DEFAULT '',
  location   text NOT NULL DEFAULT '',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Treasury Accounts
CREATE TABLE treasury_accounts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  name_ar    text NOT NULL DEFAULT '',
  type       text NOT NULL CHECK (type IN ('cash', 'bank', 'vodafone_cash', 'instapay')),
  balance    numeric NOT NULL DEFAULT 0,
  currency   text NOT NULL DEFAULT 'EGP',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Customers
CREATE TABLE customers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  name_ar        text NOT NULL DEFAULT '',
  phone          text NOT NULL DEFAULT '',
  email          text NOT NULL DEFAULT '',
  address        text NOT NULL DEFAULT '',
  tax_number     text NOT NULL DEFAULT '',
  credit_limit   numeric NOT NULL DEFAULT 0,
  total_invoiced numeric NOT NULL DEFAULT 0,
  total_paid     numeric NOT NULL DEFAULT 0,
  total_due      numeric NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_created_at ON customers(created_at);

-- Suppliers
CREATE TABLE suppliers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  name_ar       text NOT NULL DEFAULT '',
  phone         text NOT NULL DEFAULT '',
  email         text NOT NULL DEFAULT '',
  address       text NOT NULL DEFAULT '',
  tax_number    text NOT NULL DEFAULT '',
  payment_terms integer NOT NULL DEFAULT 0,
  notes         text NOT NULL DEFAULT '',
  total_pos     numeric NOT NULL DEFAULT 0,
  total_paid    numeric NOT NULL DEFAULT 0,
  balance_due   numeric NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_suppliers_name ON suppliers(name);

-- Employees
CREATE TABLE employees (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  name_ar     text NOT NULL DEFAULT '',
  position    text NOT NULL DEFAULT '',
  position_ar text NOT NULL DEFAULT '',
  phone       text NOT NULL DEFAULT '',
  email       text NOT NULL DEFAULT '',
  address     text NOT NULL DEFAULT '',
  join_date   date NOT NULL DEFAULT CURRENT_DATE,
  base_salary numeric NOT NULL DEFAULT 0,
  allowances  numeric NOT NULL DEFAULT 0,
  deductions  numeric NOT NULL DEFAULT 0,
  net_salary  numeric NOT NULL DEFAULT 0,
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'terminated')),
  notes       text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_employees_status ON employees(status);

-- Payment Methods
CREATE TABLE payment_methods (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  name_ar        text NOT NULL DEFAULT '',
  type           text NOT NULL CHECK (type IN ('vodafone_cash', 'instapay', 'cash', 'bank', 'card', 'check')),
  account_holder text NOT NULL DEFAULT '',
  icon           text NOT NULL DEFAULT '',
  is_active      boolean NOT NULL DEFAULT true,
  is_protected   boolean NOT NULL DEFAULT false,
  sort_order     integer NOT NULL DEFAULT 0
);

-- Settings
CREATE TABLE settings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text NOT NULL UNIQUE,
  value      text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type       text NOT NULL CHECK (type IN ('low_stock', 'invoice_overdue', 'payment_received', 'po_expected', 'recurring_transaction', 'quote_expiring', 'system')),
  title      text NOT NULL DEFAULT '',
  title_ar   text NOT NULL DEFAULT '',
  message    text NOT NULL DEFAULT '',
  message_ar text NOT NULL DEFAULT '',
  module     text NOT NULL DEFAULT '',
  record_id  text NOT NULL DEFAULT '',
  is_read    boolean NOT NULL DEFAULT false,
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Audit Logs
CREATE TABLE audit_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp  timestamptz NOT NULL DEFAULT now(),
  "user"     text NOT NULL DEFAULT '',
  action     text NOT NULL CHECK (action IN ('created','updated','deleted','viewed','exported','imported','printed','paid','received','transferred','reconciled')),
  module     text NOT NULL DEFAULT '',
  record_id  text NOT NULL DEFAULT '',
  old_values jsonb,
  new_values jsonb,
  ip         text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_module ON audit_logs(module);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Import Sessions
CREATE TABLE import_sessions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename       text NOT NULL DEFAULT '',
  uploaded_at    timestamptz NOT NULL DEFAULT now(),
  total_rows     integer NOT NULL DEFAULT 0,
  imported_count integer NOT NULL DEFAULT 0,
  updated_count  integer NOT NULL DEFAULT 0,
  skipped_count  integer NOT NULL DEFAULT 0,
  error_count    integer NOT NULL DEFAULT 0,
  error_report   text
);

-- Discount Rules
CREATE TABLE discount_rules (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 text NOT NULL,
  name_ar              text NOT NULL DEFAULT '',
  type                 text NOT NULL CHECK (type IN ('global', 'customer', 'volume')),
  percentage           numeric NOT NULL DEFAULT 0,
  fixed_amount         numeric,
  min_quantity         numeric NOT NULL DEFAULT 0,
  applicable_products  text[] NOT NULL DEFAULT '{}',
  applicable_customers text[] NOT NULL DEFAULT '{}',
  start_date           timestamptz NOT NULL DEFAULT now(),
  end_date             timestamptz NOT NULL DEFAULT now(),
  is_active            boolean NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_discount_rules_type ON discount_rules(type);
CREATE INDEX idx_discount_rules_is_active ON discount_rules(is_active);

-- Journal Entries
CREATE TABLE journal_entries (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date             date NOT NULL DEFAULT CURRENT_DATE,
  reference_number text NOT NULL DEFAULT '',
  description      text NOT NULL DEFAULT '',
  description_ar   text NOT NULL DEFAULT '',
  total_debit      numeric NOT NULL DEFAULT 0,
  total_credit     numeric NOT NULL DEFAULT 0,
  attachments      text[] NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_journal_entries_date ON journal_entries(date);

-- Journal Lines
CREATE TABLE journal_lines (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id uuid NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id       uuid NOT NULL REFERENCES chart_of_accounts(id),
  debit            numeric NOT NULL DEFAULT 0,
  credit           numeric NOT NULL DEFAULT 0,
  description      text NOT NULL DEFAULT '',
  description_ar   text NOT NULL DEFAULT ''
);
CREATE INDEX idx_journal_lines_entry ON journal_lines(journal_entry_id);
CREATE INDEX idx_journal_lines_account ON journal_lines(account_id);

-- Assets
CREATE TABLE assets (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  name_ar             text NOT NULL DEFAULT '',
  category            text NOT NULL DEFAULT '',
  purchase_date       date NOT NULL DEFAULT CURRENT_DATE,
  purchase_cost       numeric NOT NULL DEFAULT 0,
  salvage_value       numeric NOT NULL DEFAULT 0,
  useful_life         numeric NOT NULL DEFAULT 0,
  depreciation_method text NOT NULL CHECK (depreciation_method IN ('straight_line', 'declining_balance')),
  current_book_value  numeric NOT NULL DEFAULT 0,
  status              text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disposed')),
  disposal_date       date,
  disposal_price      numeric,
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_category ON assets(category);

-- Depreciation Records
CREATE TABLE depreciation_records (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id                uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  date                    date NOT NULL DEFAULT CURRENT_DATE,
  amount                  numeric NOT NULL DEFAULT 0,
  accumulated_depreciation numeric NOT NULL DEFAULT 0,
  book_value              numeric NOT NULL DEFAULT 0
);
CREATE INDEX idx_depreciation_records_asset ON depreciation_records(asset_id);

-- Products
CREATE TABLE products (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  name_ar             text NOT NULL DEFAULT '',
  sku                 text NOT NULL DEFAULT '',
  alternate_skus      text[] NOT NULL DEFAULT '{}',
  barcode             text NOT NULL DEFAULT '',
  description         text NOT NULL DEFAULT '',
  description_ar      text NOT NULL DEFAULT '',
  category_id         uuid NOT NULL REFERENCES categories(id),
  unit_of_measure     text NOT NULL DEFAULT '',
  base_unit           text NOT NULL DEFAULT '',
  conversion_rate     numeric NOT NULL DEFAULT 1,
  purchase_price      numeric NOT NULL DEFAULT 0,
  selling_price       numeric NOT NULL DEFAULT 0,
  stock               numeric NOT NULL DEFAULT 0,
  track_inventory     boolean NOT NULL DEFAULT true,
  low_stock_threshold numeric NOT NULL DEFAULT 0,
  reorder_point       numeric NOT NULL DEFAULT 0,
  image_url           text NOT NULL DEFAULT '',
  has_variants        boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_created_at ON products(created_at);

-- Product Variants
CREATE TABLE product_variants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku             text NOT NULL DEFAULT '',
  barcode         text NOT NULL DEFAULT '',
  attribute_name  text NOT NULL DEFAULT '',
  attribute_value text NOT NULL DEFAULT '',
  price_override  numeric,
  stock           numeric NOT NULL DEFAULT 0,
  image_url       text NOT NULL DEFAULT '',
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(sku);

-- Pricing Rules
CREATE TABLE pricing_rules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id      uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  discount_percent numeric NOT NULL DEFAULT 0,
  fixed_price     numeric
);
CREATE INDEX idx_pricing_rules_customer ON pricing_rules(customer_id);
CREATE INDEX idx_pricing_rules_product ON pricing_rules(product_id);

-- Invoices
CREATE TABLE invoices (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number    text NOT NULL UNIQUE,
  customer_id       uuid NOT NULL REFERENCES customers(id),
  subtotal          numeric NOT NULL DEFAULT 0,
  tax_total         numeric NOT NULL DEFAULT 0,
  discount_total    numeric NOT NULL DEFAULT 0,
  grand_total       numeric NOT NULL DEFAULT 0,
  paid_amount       numeric NOT NULL DEFAULT 0,
  status            text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','partially_paid','paid','overdue','cancelled','partially_returned','fully_returned')),
  issue_date        date NOT NULL DEFAULT CURRENT_DATE,
  due_date          date NOT NULL DEFAULT CURRENT_DATE,
  notes             text NOT NULL DEFAULT '',
  terms             text NOT NULL DEFAULT '',
  delivery_info     jsonb,
  treasury_transaction_id uuid,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);

-- Invoice Items
CREATE TABLE invoice_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id      uuid NOT NULL REFERENCES products(id),
  variant_id      uuid REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name    text NOT NULL DEFAULT '',
  product_name_ar text NOT NULL DEFAULT '',
  sku             text NOT NULL DEFAULT '',
  quantity        numeric NOT NULL DEFAULT 0,
  unit_price      numeric NOT NULL DEFAULT 0,
  discount_percent numeric NOT NULL DEFAULT 0,
  tax_percent     numeric NOT NULL DEFAULT 0,
  line_total      numeric NOT NULL DEFAULT 0
);
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product ON invoice_items(product_id);

-- Invoice Payments
CREATE TABLE invoice_payments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id     uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount         numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT '',
  reference      text NOT NULL DEFAULT '',
  paid_at        timestamptz NOT NULL DEFAULT now(),
  notes          text NOT NULL DEFAULT '',
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_invoice ON invoice_payments(invoice_id);
CREATE INDEX idx_payments_paid_at ON invoice_payments(paid_at);

-- Quotations
CREATE TABLE quotations (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number   text NOT NULL UNIQUE,
  customer_id        uuid NOT NULL REFERENCES customers(id),
  subtotal           numeric NOT NULL DEFAULT 0,
  tax_total          numeric NOT NULL DEFAULT 0,
  discount_total     numeric NOT NULL DEFAULT 0,
  grand_total        numeric NOT NULL DEFAULT 0,
  status             text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','rejected','expired','converted')),
  issue_date         date NOT NULL DEFAULT CURRENT_DATE,
  expiry_date        date NOT NULL DEFAULT CURRENT_DATE,
  notes              text NOT NULL DEFAULT '',
  terms              text NOT NULL DEFAULT '',
  converted_invoice_id uuid,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_quotations_customer ON quotations(customer_id);
CREATE INDEX idx_quotations_status ON quotations(status);
CREATE INDEX idx_quotations_issue_date ON quotations(issue_date);
CREATE INDEX idx_quotations_created_at ON quotations(created_at);

-- Quotation Items
CREATE TABLE quotation_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id    uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  product_id      uuid NOT NULL REFERENCES products(id),
  variant_id      uuid REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name    text NOT NULL DEFAULT '',
  product_name_ar text NOT NULL DEFAULT '',
  sku             text NOT NULL DEFAULT '',
  quantity        numeric NOT NULL DEFAULT 0,
  unit_price      numeric NOT NULL DEFAULT 0,
  discount_percent numeric NOT NULL DEFAULT 0,
  tax_percent     numeric NOT NULL DEFAULT 0,
  line_total      numeric NOT NULL DEFAULT 0
);
CREATE INDEX idx_quotation_items_quotation ON quotation_items(quotation_id);
CREATE INDEX idx_quotation_items_product ON quotation_items(product_id);

-- Purchase Orders
CREATE TABLE purchase_orders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number         text NOT NULL UNIQUE,
  supplier_id       uuid NOT NULL REFERENCES suppliers(id),
  subtotal          numeric NOT NULL DEFAULT 0,
  tax_total         numeric NOT NULL DEFAULT 0,
  grand_total       numeric NOT NULL DEFAULT 0,
  paid_amount       numeric NOT NULL DEFAULT 0,
  status            text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','partially_received','received','paid','cancelled')),
  order_date        date NOT NULL DEFAULT CURRENT_DATE,
  expected_date     date NOT NULL DEFAULT CURRENT_DATE,
  received_date     date,
  notes             text NOT NULL DEFAULT '',
  treasury_transaction_id uuid,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_po_status ON purchase_orders(status);
CREATE INDEX idx_po_order_date ON purchase_orders(order_date);
CREATE INDEX idx_po_created_at ON purchase_orders(created_at);

-- Purchase Order Items
CREATE TABLE purchase_order_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id        uuid NOT NULL REFERENCES products(id),
  variant_id        uuid REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name      text NOT NULL DEFAULT '',
  product_name_ar   text NOT NULL DEFAULT '',
  sku               text NOT NULL DEFAULT '',
  ordered_quantity  numeric NOT NULL DEFAULT 0,
  received_quantity numeric NOT NULL DEFAULT 0,
  unit_price        numeric NOT NULL DEFAULT 0,
  line_total        numeric NOT NULL DEFAULT 0
);
CREATE INDEX idx_po_items_order ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_po_items_product ON purchase_order_items(product_id);

-- Returns
CREATE TABLE returns (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number       text NOT NULL UNIQUE,
  type                text NOT NULL CHECK (type IN ('customer', 'supplier')),
  original_invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  original_po_id      uuid REFERENCES purchase_orders(id) ON DELETE SET NULL,
  refund_amount       numeric NOT NULL DEFAULT 0,
  refund_method       text NOT NULL DEFAULT '',
  status              text NOT NULL DEFAULT '',
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_returns_type ON returns(type);
CREATE INDEX idx_returns_invoice ON returns(original_invoice_id);
CREATE INDEX idx_returns_po ON returns(original_po_id);
CREATE INDEX idx_returns_created_at ON returns(created_at);

-- Return Items
CREATE TABLE return_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id       uuid NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  product_id      uuid NOT NULL REFERENCES products(id),
  variant_id      uuid REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name    text NOT NULL DEFAULT '',
  product_name_ar text NOT NULL DEFAULT '',
  sku             text NOT NULL DEFAULT '',
  quantity        numeric NOT NULL DEFAULT 0,
  unit_price      numeric NOT NULL DEFAULT 0,
  refund_amount   numeric NOT NULL DEFAULT 0,
  condition       text NOT NULL CHECK (condition IN ('good', 'bad')),
  reason          text NOT NULL DEFAULT ''
);
CREATE INDEX idx_return_items_return ON return_items(return_id);
CREATE INDEX idx_return_items_product ON return_items(product_id);

-- Treasury Transactions
CREATE TABLE treasury_transactions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type                 text NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount               numeric NOT NULL DEFAULT 0,
  date                 date NOT NULL DEFAULT CURRENT_DATE,
  account_id           uuid NOT NULL REFERENCES treasury_accounts(id),
  from_account_id      uuid REFERENCES treasury_accounts(id) ON DELETE SET NULL,
  to_account_id        uuid REFERENCES treasury_accounts(id) ON DELETE SET NULL,
  payment_method       text NOT NULL DEFAULT '',
  payment_method_detail text NOT NULL DEFAULT '',
  category_id          uuid NOT NULL REFERENCES categories(id),
  description          text NOT NULL DEFAULT '',
  description_ar       text NOT NULL DEFAULT '',
  reference_number     text NOT NULL DEFAULT '',
  receipt_url          text NOT NULL DEFAULT '',
  linked_invoice_id    uuid,
  linked_po_id         uuid,
  linked_return_id     uuid,
  is_recurring         boolean NOT NULL DEFAULT false,
  recurring_pattern    text,
  next_occurrence      timestamptz,
  is_reconciled        boolean NOT NULL DEFAULT false,
  reconciled_at        timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tt_type ON treasury_transactions(type);
CREATE INDEX idx_tt_account ON treasury_transactions(account_id);
CREATE INDEX idx_tt_category ON treasury_transactions(category_id);
CREATE INDEX idx_tt_date ON treasury_transactions(date);
CREATE INDEX idx_tt_linked_invoice ON treasury_transactions(linked_invoice_id);
CREATE INDEX idx_tt_linked_po ON treasury_transactions(linked_po_id);
CREATE INDEX idx_tt_created_at ON treasury_transactions(created_at);

-- Stock Movements
CREATE TABLE stock_movements (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     uuid NOT NULL REFERENCES products(id),
  variant_id     uuid REFERENCES product_variants(id) ON DELETE SET NULL,
  type           text NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
  quantity       numeric NOT NULL DEFAULT 0,
  reason         text NOT NULL DEFAULT '',
  date           date NOT NULL DEFAULT CURRENT_DATE,
  reference_type text NOT NULL DEFAULT '',
  reference_id   text NOT NULL DEFAULT '',
  warehouse_id   uuid NOT NULL REFERENCES warehouses(id),
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sm_product ON stock_movements(product_id);
CREATE INDEX idx_sm_type ON stock_movements(type);
CREATE INDEX idx_sm_warehouse ON stock_movements(warehouse_id);
CREATE INDEX idx_sm_date ON stock_movements(date);

-- Payroll Records
CREATE TABLE payroll_records (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id             uuid NOT NULL REFERENCES employees(id),
  month                   integer NOT NULL,
  year                    integer NOT NULL,
  base_salary             numeric NOT NULL DEFAULT 0,
  allowances              numeric NOT NULL DEFAULT 0,
  deductions              numeric NOT NULL DEFAULT 0,
  net_salary              numeric NOT NULL DEFAULT 0,
  payment_date            date,
  treasury_transaction_id uuid,
  status                  text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  created_at              timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pr_employee ON payroll_records(employee_id);
CREATE INDEX idx_pr_status ON payroll_records(status);
CREATE INDEX idx_pr_month_year ON payroll_records(month, year);

-- Deliveries
CREATE TABLE deliveries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  type            text NOT NULL CHECK (type IN ('pickup', 'internal', 'third_party')),
  driver_id       uuid REFERENCES employees(id) ON DELETE SET NULL,
  cost            numeric NOT NULL DEFAULT 0,
  expected_date   timestamptz NOT NULL DEFAULT now(),
  tracking_number text NOT NULL DEFAULT '',
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'out_for_delivery', 'delivered', 'failed')),
  notes           text NOT NULL DEFAULT '',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_deliveries_invoice ON deliveries(invoice_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_expected_date ON deliveries(expected_date);

-- External Purchases
CREATE TABLE external_purchases (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  no                   integer NOT NULL DEFAULT 0,
  photo                text NOT NULL DEFAULT '',
  note                 text NOT NULL DEFAULT '',
  name_ar              text NOT NULL DEFAULT '',
  part_num             text NOT NULL DEFAULT '',
  description          text NOT NULL DEFAULT '',
  brand                text NOT NULL DEFAULT '',
  unit                 text NOT NULL DEFAULT '',
  quantity             numeric NOT NULL DEFAULT 0,
  cost_price           numeric NOT NULL DEFAULT 0,
  total_cost_price     numeric NOT NULL DEFAULT 0,
  item_no              text NOT NULL DEFAULT '',
  weight               numeric NOT NULL DEFAULT 0,
  total_weight         numeric NOT NULL DEFAULT 0,
  sell_price           numeric NOT NULL DEFAULT 0,
  total_sell_price     numeric NOT NULL DEFAULT 0,
  product_id           uuid REFERENCES products(id) ON DELETE SET NULL,
  import_session_id    uuid REFERENCES import_sessions(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ep_part_num ON external_purchases(part_num);
CREATE INDEX idx_ep_product ON external_purchases(product_id);
CREATE INDEX idx_ep_created_at ON external_purchases(created_at);

-- Customer Statements
CREATE TABLE customer_statements (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id       uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  date              date NOT NULL DEFAULT CURRENT_DATE,
  type              text NOT NULL CHECK (type IN ('invoice', 'payment', 'return', 'opening_balance')),
  reference_number  text NOT NULL DEFAULT '',
  description       text NOT NULL DEFAULT '',
  description_ar    text NOT NULL DEFAULT '',
  debit             numeric NOT NULL DEFAULT 0,
  credit            numeric NOT NULL DEFAULT 0,
  balance           numeric NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cs_customer ON customer_statements(customer_id);
CREATE INDEX idx_cs_date ON customer_statements(date);

-- Deferred circular foreign keys
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_treasury FOREIGN KEY (treasury_transaction_id) REFERENCES treasury_transactions(id);
ALTER TABLE quotations ADD CONSTRAINT fk_quotations_converted FOREIGN KEY (converted_invoice_id) REFERENCES invoices(id);
ALTER TABLE purchase_orders ADD CONSTRAINT fk_po_treasury FOREIGN KEY (treasury_transaction_id) REFERENCES treasury_transactions(id);
ALTER TABLE treasury_transactions ADD CONSTRAINT fk_tt_invoice FOREIGN KEY (linked_invoice_id) REFERENCES invoices(id);
ALTER TABLE treasury_transactions ADD CONSTRAINT fk_tt_po FOREIGN KEY (linked_po_id) REFERENCES purchase_orders(id);
ALTER TABLE treasury_transactions ADD CONSTRAINT fk_tt_return FOREIGN KEY (linked_return_id) REFERENCES returns(id);
ALTER TABLE payroll_records ADD CONSTRAINT fk_pr_treasury FOREIGN KEY (treasury_transaction_id) REFERENCES treasury_transactions(id);
