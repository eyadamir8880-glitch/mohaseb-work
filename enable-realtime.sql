-- Check current Realtime publication status, then ensure it exists and includes all tables
-- First, create the publication if it doesn't exist
CREATE PUBLICATION IF NOT EXISTS supabase_realtime;

-- Then add all public tables
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    BEGIN
      EXECUTE format('alter publication supabase_realtime add table %I.%I', 'public', tbl);
    EXCEPTION WHEN duplicate_object THEN
      -- Already in publication
    END;
  END LOOP;
END;
$$;

-- Verify what's in the publication now
SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
