# Fase 2 - Row Level Security (RLS)

> **Objetivo:** Implementar políticas RLS em todas as tabelas críticas para garantir isolamento multi-tenant no nível do banco de dados.

---

## 📋 Visão Geral

A Fase 2 implementa **Row Level Security (RLS)** no PostgreSQL para garantir que, mesmo que um endpoint tenha um bug ou uma query seja mal construída, os dados nunca vazem entre organizações.

### Por que RLS?

- **Segurança defesa em profundidade:** Proteção no nível do banco, não apenas na aplicação
- **Proteção contra bugs:** Query sem WHERE organization_id = ? → bloqueada pelo RLS
- **Conformidade:** Requisito para multi-tenant seguro
- **Auditoria:** Rastreabilidade de quem acessou o quê

---

## 🎯 Escopo

### Tabelas com RLS (✅ Já implementado)

| Tabela | Status | Notas |
|--------|--------|-------|
| `organizations` | ✅ | Via migrações anteriores |
| `organization_members` | ✅ | Via migrações anteriores |
| `pipeline_stages` | ✅ | Via migrações anteriores |
| `users` | ✅ | Via migrações anteriores |

### Tabelas sem RLS (🔴 Prioridade)

#### 🔴 Críticas (Dados do Tenant)

| Tabela | organization_id | Tipo de Política |
|--------|-----------------|------------------|
| `contacts` | ✅ | SELECT/INSERT/UPDATE/DELETE por org |
| `deals` | ✅ | SELECT/INSERT/UPDATE/DELETE por org |
| `messages` | ✅ via `conversation` | SELECT/INSERT/UPDATE por conversation |
| `conversations` | ✅ | SELECT/INSERT/UPDATE por org |

#### 🟡 Importantes (Configuração/Operação)

| Tabela | organization_id | Notas |
|--------|-----------------|-------|
| `schedules` | ✅ | Compromissos e tarefas |
| `tags` | ✅ | Categorização de contatos |
| `lists` | ✅ | Listas de contatos |
| `segments` | ✅ | Segmentos dinâmicos |
| `transcriptions` | ✅ | Transcrições de áudio |
| `ai_insights` | ✅ | Insights de IA |
| `whatsapp_cloud_instances` | ✅ | Instâncias WhatsApp |
| `instagram_instances` | ✅ | Instâncias Instagram |
| `integrations` | ✅ | Integrações de terceiros |
| `integration_activity_logs` | ✅ | Logs de integração |
| `meta_webhook_logs` | ✅ | Logs de webhooks Meta |
| `subscriptions` | ✅ | Assinaturas |
| `invoices` | ✅ | Faturas |
| `charges` | ✅ | Cobranças |
| `monthly_goals` | ✅ | Metas mensais |
| `dashboard_metric_cache` | ✅ | Cache de métricas |

#### 🟢 Tabelas de Join (Cascata)

| Tabela | Via | Estratégia |
|--------|-----|------------|
| `contact_tags` | `contact` | CASCADE via contact |
| `list_contacts` | `list` | CASCADE via list |
| `contact_custom_field_values` | `contact` | CASCADE via contact |
| `deal_activities` | `deal` | CASCADE via deal |
| `pipeline_stage_history` | `deal` | CASCADE via deal |

---

## 🔧 Estratégia de Implementação

### 1. Configuração do RLS

```sql
-- Habilitar RLS na tabela
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Forçar RLS até para o dono da tabela (importante!)
ALTER TABLE contacts FORCE ROW LEVEL SECURITY;
```

### 2. Políticas Base

#### Pattern 1: Tabela direta com organization_id

```sql
-- SELECT: Usuário só vê dados da sua organização
CREATE POLICY "select_own_org" ON contacts
    FOR SELECT
    USING (organization_id = current_setting('app.current_org_id')::uuid);

-- INSERT: Só pode inserir na sua organização
CREATE POLICY "insert_own_org" ON contacts
    FOR INSERT
    WITH CHECK (organization_id = current_setting('app.current_org_id')::uuid);

-- UPDATE: Só pode atualizar da sua organização
CREATE POLICY "update_own_org" ON contacts
    FOR UPDATE
    USING (organization_id = current_setting('app.current_org_id')::uuid);

-- DELETE: Só pode deletar da sua organização
CREATE POLICY "delete_own_org" ON contacts
    FOR DELETE
    USING (organization_id = current_setting('app.current_org_id')::uuid);
```

#### Pattern 2: Tabela via relacionamento (ex: messages → conversations)

```sql
-- messages não tem organization_id direto, mas tem conversation_id
-- que referencia conversations que TEM organization_id
CREATE POLICY "select_via_conversation" ON messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND conversations.organization_id = current_setting('app.current_org_id')::uuid
        )
    );
```

#### Pattern 3: Tabelas de Join

```sql
-- contact_tags: acesso via contact
CREATE POLICY "select_via_contact" ON contact_tags
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM contacts
            WHERE contacts.id = contact_tags.contact_id
            AND contacts.organization_id = current_setting('app.current_org_id')::uuid
        )
    );
```

### 3. Configuração do Prisma

O Prisma precisa configurar o `current_setting` antes de cada query:

```typescript
// lib/db/rls.ts
import { PrismaClient } from '@prisma/client';

export async function withRLS<T>(
  prisma: PrismaClient,
  organizationId: string,
  operation: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  // Usar transaction para garantir que o setting é limpo
  return prisma.$transaction(async (tx) => {
    // Setar o organization_id na sessão
    await tx.$executeRawUnsafe(
      `SET LOCAL app.current_org_id = '${organizationId}'`
    );
    
    // Executar a operação
    const result = await operation(tx as unknown as PrismaClient);
    
    // Limpar o setting (opcional, pois SET LOCAL é por transação)
    return result;
  });
}
```

---

## 📁 Arquivos a Criar

```
docs/backend/
├── fase2-plano-rls.md           # Este documento
├── fase2-migracao.sql           # Script SQL completo de RLS
└── fase2-implementacao.md       # Guia passo a passo de implementação

lib/db/
└── rls.ts                       # Helper TypeScript para RLS
```

---

## 🚀 Fases de Implementação

### Fase 2.A - Migração SQL
- [ ] Criar script SQL com todas as políticas RLS
- [ ] Testar em ambiente de desenvolvimento
- [ ] Documentar rollback

### Fase 2.B - Helper TypeScript
- [ ] Criar `withRLS()` helper
- [ ] Atualizar endpoints críticos para usar RLS
- [ ] Testar integração

### Fase 2.C - Validação
- [ ] Testes de segurança (tentar acessar dados de outra org)
- [ ] Testes de performance
- [ ] Documentação de troubleshooting

---

## ⚠️ Considerações Importantes

### 1. Superusuários
RLS não se aplica a superusuários (postgres). Isso é esperado.

### 2. Migrations
O script SQL deve ser executado como uma migration do Prisma:

```bash
npx prisma migrate dev --name add_rls_policies
```

Ou usar `prisma migrate resolve` para marcar como aplicada se executar manualmente.

### 3. Performance
- RLS adiciona overhead em cada query
- Índices em `organization_id` são ESSENCIAIS
- Testar performance em produção antes do rollout completo

### 4. Debugging
```sql
-- Verificar políticas ativas
SELECT * FROM pg_policies WHERE tablename = 'contacts';

-- Testar RLS manualmente
SET app.current_org_id = 'uuid-da-org';
SELECT * FROM contacts; -- Só deve retornar da org
RESET app.current_org_id;
```

---

## 📝 Checklist de Aceite

- [ ] Todas as tabelas críticas têm RLS habilitado
- [ ] Políticas testadas manualmente no banco
- [ ] Helper TypeScript funcionando
- [ ] Endpoints críticos usando RLS
- [ ] Testes de segurança passando (não acessa dados de outra org)
- [ ] Documentação de rollback pronta

---

## 🔗 Links

- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Prisma RLS Best Practices](https://www.prisma.io/docs/guides/database/row-level-security)
