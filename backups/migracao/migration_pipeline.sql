-- ============================================================
-- MIGRATION: Pipeline Templates
-- Execute no SQL Editor do Supabase (https://app.supabase.com/project/wqbppfngjolnxbwqngfo/sql)
-- ============================================================

-- ============================================================
-- 1. CRIAR TABELAS
-- ============================================================

-- Tabela de Templates de Pipeline
CREATE TABLE IF NOT EXISTS "pipeline_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pipeline_templates_pkey" PRIMARY KEY ("id")
);

-- Índice único para categoria
CREATE UNIQUE INDEX IF NOT EXISTS "pipeline_templates_category_key" ON "pipeline_templates"("category");

-- Tabela de Estágios dos Templates
CREATE TABLE IF NOT EXISTS "pipeline_template_stages" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "color" TEXT,
    "probability" INTEGER NOT NULL DEFAULT 0,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pipeline_template_stages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "pipeline_template_stages_template_id_fkey" 
        FOREIGN KEY ("template_id") REFERENCES "pipeline_templates"("id") ON DELETE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS "pipeline_template_stages_template_id_idx" ON "pipeline_template_stages"("template_id");
CREATE INDEX IF NOT EXISTS "pipeline_template_stages_position_idx" ON "pipeline_template_stages"("position");

-- ============================================================
-- 2. FUNÇÃO PARA ATUALIZAR updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_pipeline_templates_updated_at ON "pipeline_templates";
CREATE TRIGGER update_pipeline_templates_updated_at
    BEFORE UPDATE ON "pipeline_templates"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pipeline_template_stages_updated_at ON "pipeline_template_stages";
CREATE TRIGGER update_pipeline_template_stages_updated_at
    BEFORE UPDATE ON "pipeline_template_stages"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 3. INSERIR TEMPLATES (Só executa se não existir)
-- ============================================================

-- Template 1: Infoprodutos
INSERT INTO "pipeline_templates" ("id", "name", "category", "description", "is_default")
VALUES (
    'tpl_infoprodutos_v1',
    'Pipeline de Infoprodutos',
    'infoprodutos',
    'Pipeline completo para vendas de cursos, mentorias e produtos digitais. Inclui etapas de captação, qualificação, conversão e pós-venda.',
    true
)
ON CONFLICT ("category") DO NOTHING;

-- Estágios do template Infoprodutos
INSERT INTO "pipeline_template_stages" ("id", "template_id", "name", "position", "color", "probability", "is_closed", "description")
VALUES
    ('tpl_stage_info_01', 'tpl_infoprodutos_v1', 'Lead Capturado', 0, '#3b82f6', 10, false, 'Entrou no radar. Baixou isca digital, se inscreveu em evento gratuito'),
    ('tpl_stage_info_02', 'tpl_infoprodutos_v1', 'Lead Engajado', 1, '#6366f1', 25, false, 'Abriu email, assistiu aula, respondeu mensagem'),
    ('tpl_stage_info_03', 'tpl_infoprodutos_v1', 'Lead Qualificado', 2, '#8b5cf6', 40, false, 'Demonstrou perfil E interesse real'),
    ('tpl_stage_info_04', 'tpl_infoprodutos_v1', 'Oportunidade (Mão Levantada)', 3, '#a855f7', 60, false, 'Acessou página de vendas, iniciou checkout'),
    ('tpl_stage_info_05', 'tpl_infoprodutos_v1', 'Negociação / Objeção', 4, '#d946ef', 75, false, 'Quer mas tem impedimento'),
    ('tpl_stage_info_06', 'tpl_infoprodutos_v1', 'Convertido (Novo Cliente)', 5, '#22c55e', 100, true, 'Pagou'),
    ('tpl_stage_info_07', 'tpl_infoprodutos_v1', 'Perdido', 6, '#ef4444', 0, true, 'Não comprou'),
    ('tpl_stage_info_08', 'tpl_infoprodutos_v1', 'Cliente Ativo (pós-venda)', 7, '#10b981', 100, false, 'Está consumindo o produto'),
    ('tpl_stage_info_09', 'tpl_infoprodutos_v1', 'Upsell / Ascensão', 8, '#f59e0b', 80, false, 'Cliente satisfeito pronto pra subir de nível'),
    ('tpl_stage_info_10', 'tpl_infoprodutos_v1', 'Inativo / Churn', 9, '#6b7280', 0, false, 'Parou de engajar')
ON CONFLICT DO NOTHING;

-- Template 2: Negócios Físicos
INSERT INTO "pipeline_templates" ("id", "name", "category", "description", "is_default")
VALUES (
    'tpl_negocios_v1',
    'Pipeline de Negócios Físicos',
    'negocios-fisicos',
    'Pipeline para lojas, restaurantes, clínicas e comércios físicos. Focado em visita presencial e experiência do cliente.',
    false
)
ON CONFLICT ("category") DO NOTHING;

-- Estágios do template Negócios Físicos
INSERT INTO "pipeline_template_stages" ("id", "template_id", "name", "position", "color", "probability", "is_closed", "description")
VALUES
    ('tpl_stage_neg_01', 'tpl_negocios_v1', 'Lead Capturado', 0, '#3b82f6', 10, false, 'Passou na frente da loja, Google Maps, Instagram local'),
    ('tpl_stage_neg_02', 'tpl_negocios_v1', 'Primeiro Contato', 1, '#6366f1', 25, false, 'Perguntou preço, mandou mensagem'),
    ('tpl_stage_neg_03', 'tpl_negocios_v1', 'Orçamento / Proposta', 2, '#8b5cf6', 40, false, 'Pediu orçamento formal'),
    ('tpl_stage_neg_04', 'tpl_negocios_v1', 'Visita / Experiência', 3, '#a855f7', 55, false, 'Veio até o local, fez test-drive'),
    ('tpl_stage_neg_05', 'tpl_negocios_v1', 'Negociação', 4, '#d946ef', 70, false, 'Quer fechar mas está negociando'),
    ('tpl_stage_neg_06', 'tpl_negocios_v1', 'Convertido (Cliente)', 5, '#22c55e', 100, true, 'Comprou'),
    ('tpl_stage_neg_07', 'tpl_negocios_v1', 'Perdido', 6, '#ef4444', 0, true, 'Não fechou'),
    ('tpl_stage_neg_08', 'tpl_negocios_v1', 'Cliente Recorrente', 7, '#10b981', 100, false, 'Voltou, comprou de novo'),
    ('tpl_stage_neg_09', 'tpl_negocios_v1', 'Promotor / Indicador', 8, '#f59e0b', 100, false, 'Cliente que indica outros'),
    ('tpl_stage_neg_10', 'tpl_negocios_v1', 'Inativo / Sumiu', 9, '#6b7280', 0, false, 'Não volta há X dias')
ON CONFLICT DO NOTHING;

-- Template 3: Saúde
INSERT INTO "pipeline_templates" ("id", "name", "category", "description", "is_default")
VALUES (
    'tpl_saude_v1',
    'Pipeline de Saúde',
    'saude',
    'Pipeline para clínicas, consultórios e serviços de saúde. Inclui triagem, agendamento e acompanhamento do paciente.',
    false
)
ON CONFLICT ("category") DO NOTHING;

-- Estágios do template Saúde
INSERT INTO "pipeline_template_stages" ("id", "template_id", "name", "position", "color", "probability", "is_closed", "description")
VALUES
    ('tpl_stage_sau_01', 'tpl_saude_v1', 'Lead Capturado', 0, '#3b82f6', 10, false, 'Google, Instagram, indicação, Doctoralia'),
    ('tpl_stage_sau_02', 'tpl_saude_v1', 'Triagem / Pré-qualificação', 1, '#6366f1', 30, false, 'Entender queixa, urgência'),
    ('tpl_stage_sau_03', 'tpl_saude_v1', 'Agendamento', 2, '#8b5cf6', 50, false, 'Marcou consulta'),
    ('tpl_stage_sau_04', 'tpl_saude_v1', 'Avaliação / Consulta', 3, '#a855f7', 65, false, 'Compareceu. Profissional avalia'),
    ('tpl_stage_sau_05', 'tpl_saude_v1', 'Negociação / Decisão', 4, '#d946ef', 75, false, 'Paciente analisando orçamento'),
    ('tpl_stage_sau_06', 'tpl_saude_v1', 'Convertido (Tratamento Iniciado)', 5, '#22c55e', 100, true, 'Aprovou e pagou'),
    ('tpl_stage_sau_07', 'tpl_saude_v1', 'Em Tratamento / Acompanhamento', 6, '#10b981', 100, false, 'Tratamento contínuo'),
    ('tpl_stage_sau_08', 'tpl_saude_v1', 'Concluído / Pós-Alta', 7, '#06b6d4', 100, true, 'Finalizou tratamento'),
    ('tpl_stage_sau_09', 'tpl_saude_v1', 'Recorrente / Indicador', 8, '#f59e0b', 100, false, 'Volta pra manutenção + indica'),
    ('tpl_stage_sau_10', 'tpl_saude_v1', 'Perdido / Inativo', 9, '#ef4444', 0, true, 'Não agendou, não aprovou')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. VERIFICAR SE TUDO FOI CRIADO (Query de teste)
-- ============================================================

-- Descomente a linha abaixo para verificar se os templates foram inseridos:
-- SELECT t.name, t.category, COUNT(s.id) as stages_count 
-- FROM pipeline_templates t 
-- LEFT JOIN pipeline_template_stages s ON t.id = s.template_id 
-- GROUP BY t.id, t.name, t.category;

-- ============================================================
-- FIM DA MIGRATION
-- ============================================================
