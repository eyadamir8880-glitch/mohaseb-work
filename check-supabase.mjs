const headers = {apikey:'sb_publishable_z5X2_QdEK15oJWC9M77arg_wMT6nCpt',Authorization:'Bearer sb_publishable_z5X2_QdEK15oJWC9M77arg_wMT6nCpt'};
const tables = ['customers','suppliers','products','invoices','audit_logs','external_purchases','customer_statements'];
for (const t of tables) {
  const r = await fetch('https://kggmwviapfqtddxjmrwd.supabase.co/rest/v1/'+t+'?select=count', {headers, method:'GET'});
  const txt = await r.text();
  console.log(t+':', txt);
}
