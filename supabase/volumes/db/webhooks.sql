-- ============================================
-- Supabase Webhooks Configuration
-- ============================================

BEGIN;
  -- Create pg_net extension if available (for webhooks)
  DO $$
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'pg_net extension not available';
  END $$;

  -- Create http extension if available
  DO $$
  BEGIN
    CREATE EXTENSION IF NOT EXISTS http SCHEMA extensions;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'http extension not available';
  END $$;

  -- Create pg_cron extension for scheduled jobs
  DO $$
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA extensions;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'pg_cron extension not available';
  END $$;

COMMIT;
