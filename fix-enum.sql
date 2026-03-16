-- Fix ActivityType enum
DO $$
BEGIN
    -- Renomear enum antigo
    ALTER TYPE activity_type RENAME TO activity_type_old;
    
    -- Criar novo enum com valores corretos
    CREATE TYPE activity_type AS ENUM (
        'NOTE', 'CALL', 'EMAIL', 'MEETING', 'WHATSAPP', 
        'INSTAGRAM', 'STAGE_CHANGE', 'TASK_CREATED', 'TASK_COMPLETED', 
        'DOCUMENT', 'AUTOMATION', 'SYSTEM'
    );
    
    -- Atualizar tabela para usar novo enum
    ALTER TABLE deal_activities 
        ALTER COLUMN type TYPE activity_type 
        USING type::text::activity_type;
    
    -- Dropar enum antigo
    DROP TYPE activity_type_old;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro: %', SQLERRM;
END $$;

-- Grant permissions
GRANT ALL ON SCHEMA public TO supabase_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_admin;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO supabase_admin;

SELECT 'Enum atualizado!' AS status;
