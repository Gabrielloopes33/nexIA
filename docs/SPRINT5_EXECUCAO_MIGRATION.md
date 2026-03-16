# Sprint 5 - Execução da Migration

## 📋 Resumo
A migration SQL para tabelas de Cobranças e Assinaturas foi criada e está pronta para execução.

## 🗄️ Arquivo
- **Path:** `migrations/sprint5_billing.sql`
- **Tamanho:** 411 linhas
- **Tabelas:** 6 (plans, subscriptions, invoices, charges, coupons, subscription_coupons)

## 🚀 Como Executar

### Opção 1: SQL Editor do Supabase (Recomendado)

1. Acesse o Dashboard do Supabase: https://wqbppfngjolnxbwqngfo.supabase.co
2. Vá em "SQL Editor"
3. Cole o conteúdo do arquivo `migrations/sprint5_billing.sql`
4. Clique em "Run"

### Opção 2: Prisma (se tiver acesso ao banco)

```bash
# Configurar DATABASE_URL no .env.local com as credenciais corretas
# Depois executar:
npx prisma db execute --file migrations/sprint5_billing.sql
```

### Opção 3: psql

```bash
psql -h 49.13.228.89 -p 6543 -U postgres -d postgres -f migrations/sprint5_billing.sql
```

## ✅ Verificação Pós-Execução

Após executar, verifique:

```sql
-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('plans', 'subscriptions', 'invoices', 'charges', 'coupons', 'subscription_coupons');

-- Verificar seed de planos
SELECT id, name, price_cents, interval, status 
FROM plans;

-- Verificar seed de cupons
SELECT id, code, discount_percent, status 
FROM coupons;
```

## 📊 Resultado Esperado

- 3 planos criados: Básico (R$97), Pro (R$197), Enterprise (R$497)
- 2 cupons criados: BEMVINDO20, PRO50OFF
- Todas as tabelas com triggers updated_at
- Todos os indexes criados
- Foreign keys configuradas corretamente

## ⚠️ Pré-requisitos

- Tabela `organizations` deve existir (já existe)
- Função `gen_random_uuid()` disponível (extensão pgcrypto)
- Permissões de DDL no banco
