-- ============================================
-- Inicialização do Banco de Dados - NexIA
-- Script executado automaticamente no primeiro setup
-- ============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Criar schema se não existir
CREATE SCHEMA IF NOT EXISTS public;

-- Configurar permissões
ALTER DATABASE nexia SET timezone TO 'America/Sao_Paulo';

-- ============================================
-- Funções auxiliares
-- ============================================

-- Função para atualizar updatedAt automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- Configurações padrão
-- ============================================

-- Comentários no banco
COMMENT ON DATABASE nexia IS 'NexIA - Sistema de CRM e Atendimento';

-- Configurar charset
SET client_encoding = 'UTF8';
