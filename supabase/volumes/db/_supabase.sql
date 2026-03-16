-- ============================================
-- Supabase Internal Schema
-- ============================================

-- Create _supabase schema
CREATE SCHEMA IF NOT EXISTS _supabase;

-- Grant permissions
GRANT USAGE ON SCHEMA _supabase TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA _supabase TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA _supabase GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

-- Create functions schema
CREATE SCHEMA IF NOT EXISTS supabase_functions;

-- Grant permissions
GRANT USAGE ON SCHEMA supabase_functions TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA supabase_functions TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA supabase_functions GRANT ALL ON TABLES TO anon, authenticated, service_role;
