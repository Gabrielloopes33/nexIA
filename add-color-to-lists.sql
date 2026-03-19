-- Migração segura: Adiciona coluna color à tabela lists
-- Esta alteração não causa perda de dados

-- Adiciona a coluna color com valor padrão
ALTER TABLE lists ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#46347F';

-- Atualiza registros existentes para ter a cor padrão
UPDATE lists SET color = '#46347F' WHERE color IS NULL;

-- Comentário da coluna
COMMENT ON COLUMN lists.color IS 'Cor da lista em formato hexadecimal (ex: #46347F)';
