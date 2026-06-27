const headers = {
  'Content-Type': 'application/json',
  'apikey': 'sb_publishable_z5X2_QdEK15oJWC9M77arg_wMT6nCpt',
  'Authorization': 'Bearer sb_publishable_z5X2_QdEK15oJWC9M77arg_wMT6nCpt',
};

const sql = `
CREATE TABLE IF NOT EXISTS external_purchases (
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
  product_id           uuid,
  import_session_id    uuid,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_statements (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id       uuid NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_ep_part_num ON external_purchases(part_num);
CREATE INDEX IF NOT EXISTS idx_ep_product ON external_purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_ep_created_at ON external_purchases(created_at);
CREATE INDEX IF NOT EXISTS idx_cs_customer ON customer_statements(customer_id);
CREATE INDEX IF NOT EXISTS idx_cs_date ON customer_statements(date);
`;

async function run() {
  // Try using the management API (requires service_role key - won't work with anon)
  // Instead, we'll output the SQL for the user to run manually
  console.log('SQL to run in Supabase Dashboard:');
  console.log(sql);
}

run();
