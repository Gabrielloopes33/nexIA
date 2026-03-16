-- ============================================
-- Supabase JWT Configuration
-- ============================================

-- Create extensions schema if not exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- Install required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;

-- Create auth schema
CREATE SCHEMA IF NOT EXISTS auth;

-- Create auth.users table
CREATE TABLE IF NOT EXISTS auth.users (
    instance_id UUID,
    id UUID NOT NULL UNIQUE DEFAULT extensions.uuid_generate_v4(),
    aud VARCHAR(255),
    role VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    encrypted_password VARCHAR(255),
    email_confirmed_at TIMESTAMPTZ,
    invited_at TIMESTAMPTZ,
    confirmation_token VARCHAR(255),
    confirmation_sent_at TIMESTAMPTZ,
    recovery_token VARCHAR(255),
    recovery_sent_at TIMESTAMPTZ,
    email_change_token_new VARCHAR(255),
    email_change VARCHAR(255),
    email_change_sent_at TIMESTAMPTZ,
    new_email VARCHAR(255),
    raw_app_meta_data JSONB,
    raw_user_meta_data JSONB,
    is_super_admin BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    phone VARCHAR(15) UNIQUE DEFAULT NULL,
    phone_confirmed_at TIMESTAMPTZ,
    phone_change VARCHAR(15) DEFAULT '',
    phone_change_token VARCHAR(255) DEFAULT '',
    phone_change_sent_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ DEFAULT extensions.uuid_generate_v4(),
    email_change_token_current VARCHAR(255) DEFAULT '',
    email_change_confirm_status INT2 DEFAULT 0,
    banned_until TIMESTAMPTZ,
    reauthentication_token VARCHAR(255) DEFAULT '',
    reauthentication_sent_at TIMESTAMPTZ,
    is_sso_user BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    is_anonymous BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (id)
);

-- Create auth.refresh_tokens table
CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
    instance_id UUID,
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255),
    user_id VARCHAR(255),
    revoked BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    parent VARCHAR(255),
    session_id VARCHAR(255)
);

-- Create auth.instances table
CREATE TABLE IF NOT EXISTS auth.instances (
    id UUID NOT NULL,
    uuid UUID,
    raw_base_config TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    PRIMARY KEY (id)
);

-- Create auth.audit_log_entries table
CREATE TABLE IF NOT EXISTS auth.audit_log_entries (
    instance_id UUID,
    id UUID NOT NULL,
    payload JSON,
    created_at TIMESTAMPTZ,
    ip_address VARCHAR(64) DEFAULT '',
    PRIMARY KEY (id)
);

-- Create auth.schema_migrations table
CREATE TABLE IF NOT EXISTS auth.schema_migrations (
    version VARCHAR(255) NOT NULL PRIMARY KEY
);

-- Create auth.identities table
CREATE TABLE IF NOT EXISTS auth.identities (
    provider_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    identity_data JSONB NOT NULL,
    provider TEXT NOT NULL,
    last_sign_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    email TEXT GENERATED ALWAYS AS (lower(identity_data->>'email')) STORED,
    PRIMARY KEY (provider, provider_id)
);

-- Create auth.mfa_factors table
CREATE TABLE IF NOT EXISTS auth.mfa_factors (
    id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    friendly_name TEXT,
    factor_type TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    secret TEXT,
    PRIMARY KEY (id)
);

-- Create auth.mfa_challenges table
CREATE TABLE IF NOT EXISTS auth.mfa_challenges (
    id UUID NOT NULL,
    factor_id UUID NOT NULL REFERENCES auth.mfa_factors(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    ip_address INET NOT NULL,
    otp_code TEXT,
    web_authn_session_data JSONB,
    PRIMARY KEY (id)
);

-- Create auth.mfa_amr_claims table
CREATE TABLE IF NOT EXISTS auth.mfa_amr_claims (
    session_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    authentication_method TEXT NOT NULL,
    id UUID NOT NULL,
    PRIMARY KEY (id)
);

-- Create auth.sso_providers table
CREATE TABLE IF NOT EXISTS auth.sso_providers (
    id UUID NOT NULL,
    resource_id TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    PRIMARY KEY (id)
);

-- Create auth.sso_domains table
CREATE TABLE IF NOT EXISTS auth.sso_domains (
    id UUID NOT NULL,
    sso_provider_id UUID NOT NULL REFERENCES auth.sso_providers(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    PRIMARY KEY (id)
);

-- Create auth.saml_providers table
CREATE TABLE IF NOT EXISTS auth.saml_providers (
    id UUID NOT NULL,
    sso_provider_id UUID NOT NULL REFERENCES auth.sso_providers(id) ON DELETE CASCADE,
    entity_id TEXT NOT NULL UNIQUE,
    metadata_xml TEXT NOT NULL,
    metadata_url TEXT,
    attribute_mapping JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    name_id_format TEXT,
    PRIMARY KEY (id)
);

-- Create auth.saml_relay_states table
CREATE TABLE IF NOT EXISTS auth.saml_relay_states (
    id UUID NOT NULL,
    sso_provider_id UUID NOT NULL REFERENCES auth.sso_providers(id) ON DELETE CASCADE,
    request_id TEXT NOT NULL,
    for_email TEXT,
    redirect_to TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    flow_state_id UUID,
    PRIMARY KEY (id)
);

-- Create auth.flow_state table
CREATE TABLE IF NOT EXISTS auth.flow_state (
    id UUID NOT NULL,
    user_id UUID,
    auth_code TEXT NOT NULL,
    code_challenge_method TEXT NOT NULL,
    code_challenge TEXT NOT NULL,
    provider_type TEXT NOT NULL,
    provider_access_token TEXT,
    provider_refresh_token TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    authentication_method TEXT NOT NULL,
    auth_code_issued_at TIMESTAMPTZ,
    PRIMARY KEY (id)
);

-- Create auth.sessions table
CREATE TABLE IF NOT EXISTS auth.sessions (
    id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    factor_id UUID,
    aal TEXT,
    not_after TIMESTAMPTZ,
    refreshed_at TIMESTAMPTZ,
    user_agent TEXT,
    ip INET,
    tag TEXT,
    PRIMARY KEY (id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS users_instance_id_email_idx ON auth.users(instance_id, email);
CREATE INDEX IF NOT EXISTS users_instance_id_idx ON auth.users(instance_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_instance_id_idx ON auth.refresh_tokens(instance_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_token_idx ON auth.refresh_tokens(token);
CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON auth.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_parent_idx ON auth.refresh_tokens(parent);
CREATE INDEX IF NOT EXISTS refresh_tokens_session_id_idx ON auth.refresh_tokens(session_id);
CREATE INDEX IF NOT EXISTS audit_logs_instance_id_idx ON auth.audit_log_entries(instance_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON auth.audit_log_entries(created_at);
CREATE INDEX IF NOT EXISTS identities_user_id_idx ON auth.identities(user_id);
CREATE INDEX IF NOT EXISTS identities_email_idx ON auth.identities(email);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_not_after ON auth.sessions(not_after);
CREATE INDEX IF NOT EXISTS idx_mfa_factors_user_id ON auth.mfa_factors(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_challenges_created_at ON auth.mfa_challenges(created_at);
CREATE INDEX IF NOT EXISTS idx_flow_state_created_at ON auth.flow_state(created_at);
CREATE INDEX IF NOT EXISTS idx_saml_relay_states_created_at ON auth.saml_relay_states(created_at);
CREATE INDEX IF NOT EXISTS idx_saml_relay_states_for_email ON auth.saml_relay_states(for_email);

-- Create storage schema
CREATE SCHEMA IF NOT EXISTS storage;

-- Create storage.buckets table
CREATE TABLE IF NOT EXISTS storage.buckets (
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    owner UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    public BOOLEAN DEFAULT FALSE,
    avif_autodetection BOOLEAN DEFAULT FALSE,
    file_size_limit BIGINT,
    allowed_mime_types TEXT[],
    owner_id TEXT,
    PRIMARY KEY (id)
);

-- Create storage.objects table
CREATE TABLE IF NOT EXISTS storage.objects (
    id UUID DEFAULT extensions.uuid_generate_v4() NOT NULL,
    bucket_id TEXT REFERENCES storage.buckets(id),
    name TEXT,
    owner UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    last_accessed_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB,
    path_tokens TEXT[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
    version TEXT,
    owner_id TEXT,
    PRIMARY KEY (id)
);

-- Create storage.migrations table
CREATE TABLE IF NOT EXISTS storage.migrations (
    id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    hash VARCHAR(40) NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (id)
);

-- Create storage.s3_multipart_uploads table
CREATE TABLE IF NOT EXISTS storage.s3_multipart_uploads (
    id TEXT NOT NULL,
    in_progress_size BIGINT DEFAULT 0 NOT NULL,
    upload_signature TEXT NOT NULL,
    bucket_id TEXT NOT NULL REFERENCES storage.buckets(id),
    key TEXT NOT NULL COLLATE pg_catalog."C",
    version TEXT NOT NULL,
    owner_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (id)
);

-- Create storage.s3_multipart_uploads_parts table
CREATE TABLE IF NOT EXISTS storage.s3_multipart_uploads_parts (
    id UUID DEFAULT extensions.uuid_generate_v4() NOT NULL,
    upload_id TEXT NOT NULL REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE,
    size BIGINT DEFAULT 0,
    part_number INTEGER NOT NULL,
    bucket_id TEXT NOT NULL REFERENCES storage.buckets(id),
    key TEXT NOT NULL COLLATE pg_catalog."C",
    etag TEXT NOT NULL,
    owner_id TEXT,
    version TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (id)
);

-- Create storage indexes
CREATE UNIQUE INDEX IF NOT EXISTS bucketid_objname ON storage.objects(bucket_id, name);
CREATE INDEX IF NOT EXISTS idx_objects_bucket_id_name ON storage.objects(bucket_id, name);
CREATE INDEX IF NOT EXISTS idx_multipart_uploads_list ON storage.s3_multipart_uploads(bucket_id, key, created_at);
CREATE INDEX IF NOT EXISTS idx_multipart_uploads_parts_list ON storage.s3_multipart_uploads_parts(upload_id, part_number);
