-- ============================================
-- Supabase Logs Schema
-- ============================================

-- Create _analytics schema for Logflare
CREATE SCHEMA IF NOT EXISTS _analytics;

-- Grant permissions
GRANT USAGE ON SCHEMA _analytics TO supabase_admin;
GRANT ALL ON ALL TABLES IN SCHEMA _analytics TO supabase_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA _analytics GRANT ALL ON TABLES TO supabase_admin;
