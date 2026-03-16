-- ============================================
-- Supabase Realtime Configuration
-- ============================================
BEGIN;
  -- Drop publication if exists
  DROP PUBLICATION IF EXISTS supabase_realtime;
  
  -- Create publication for realtime
  CREATE PUBLICATION supabase_realtime;
  
  -- Add all tables to publication (can be customized)
  -- ALTER PUBLICATION supabase_realtime ADD TABLE public.your_table;
COMMIT;
