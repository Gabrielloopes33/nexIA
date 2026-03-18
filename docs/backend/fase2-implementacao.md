# Fase 2 - Guia de Implementação RLS

> **Passo a passo para implementar Row Level Security no projeto.**

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de:

- [ ] Fase 1 concluída (endpoints críticos refatorados)
- [ ] Acesso ao banco de dados PostgreSQL
- [ ] Backup do banco de dados (recomendado)

---

## 🚀 Passo 1: Executar a Migração SQL

### 1.1 Aplicar o Script

```bash
# Usando psql (se disponível)
psql $DATABASE_URL -f docs/backend/fase2-migracao.sql

# Ou usando uma ferramenta de administração (pgAdmin, DBeaver, etc.)
# Abrir fase2-migracao.sql e executar
```

### 1.2 Verificar a Aplicação

```sql
-- Verificar se o RLS está habilitado nas tabelas críticas
SELECT 
    relname as table_name,
    relrowsecurity as rls_enabled,
    relforcerowsecurity as rls_forced
FROM pg_class 
WHERE relname IN (
    'contacts', 'deals', 'conversations', 'messages',
    'schedules', 'tags', 'lists', 'segments'
)
AND relnamespace = 'public'::regnamespace;
```

Resultado esperado: todas as tabelas com `rls_enabled = true` e `rls_forced = true`.

### 1.3 Verificar as Políticas

```sql
-- Ver todas as políticas criadas
SELECT 
    tablename,
    policyname,
    cmd as operation,
    permissive
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Deve retornar ~100+ políticas (4 operações × ~25 tabelas).

---

## 🚀 Passo 2: Testar o RLS Manualmente

### 2.1 Teste Básico

```sql
-- Obter um organization_id válido
SELECT id FROM organizations LIMIT 1;

-- Setar o contexto
SET app.current_org_id = '<uuid-da-org>';

-- Testar SELECT - deve retornar apenas dados da org
SELECT COUNT(*) FROM contacts;

-- Resetar o contexto
RESET app.current_org_id;

-- Agora deve retornar 0 resultados (ou erro, dependendo do usuário)
SELECT COUNT(*) FROM contacts;
```

### 2.2 Teste de Isolamento

```sql
-- Pegar IDs de duas organizações diferentes
SELECT id, name FROM organizations LIMIT 2;

-- Testar com org 1
SET app.current_org_id = '<org-1-id>';
SELECT phone FROM contacts LIMIT 5;

-- Mudar para org 2
SET app.current_org_id = '<org-2-id>';
SELECT phone FROM contacts LIMIT 5;

-- Os resultados devem ser completamente diferentes
```

---

## 🚀 Passo 3: Atualizar Endpoints para Usar RLS

### 3.1 Padrão de Uso

```typescript
// Antes (apenas com filtro manual)
export const GET = withOrganizationAuth(async (req, user, orgId) => {
  const contacts = await prisma.contact.findMany({
    where: { organizationId: orgId }
  });
  return NextResponse.json({ data: contacts });
});

// Depois (com RLS - defesa em profundidade)
import { withRLS } from '@/lib/db/rls';

export const GET = withOrganizationAuth(async (req, user, orgId) => {
  const contacts = await withRLS(prisma, orgId, async (tx) => {
    return tx.contact.findMany({
      where: { organizationId: orgId }  // Ainda importante para performance!
    });
  });
  return NextResponse.json({ data: contacts });
});
```

**Nota:** Mesmo com RLS, continue usando `where: { organizationId: orgId }` nas queries. O RLS é uma camada de segurança adicional, não um substituto para filtros bem escritos.

### 3.2 Endpoints Prioritários para Atualização

Prioridade 1 (fazer primeiro):
- [ ] `app/api/contacts/route.ts`
- [ ] `app/api/contacts/[id]/route.ts`
- [ ] `app/api/pipeline/deals/route.ts`
- [ ] `app/api/pipeline/deals/[id]/route.ts`
- [ ] `app/api/conversations/route.ts`
- [ ] `app/api/messages/route.ts`

Prioridade 2 (depois):
- [ ] `app/api/schedules/route.ts`
- [ ] `app/api/tags/route.ts`
- [ ] `app/api/lists/route.ts`
- [ ] `app/api/segments/route.ts`

---

## 🚀 Passo 4: Exemplo Completo de Atualização

### Antes

```typescript
// app/api/contacts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withOrganizationAuth } from '@/lib/auth/helpers';

export const GET = withOrganizationAuth(async (req, user, orgId) => {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  
  const contacts = await prisma.contact.findMany({
    where: {
      organizationId: orgId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } }
        ]
      })
    },
    orderBy: { lastInteractionAt: 'desc' }
  });
  
  return NextResponse.json({ success: true, data: contacts });
});

export const POST = withOrganizationAuth(async (req, user, orgId) => {
  const body = await req.json();
  
  const contact = await prisma.contact.create({
    data: {
      ...body,
      organizationId: orgId
    }
  });
  
  return NextResponse.json({ success: true, data: contact }, { status: 201 });
});
```

### Depois (com RLS)

```typescript
// app/api/contacts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withOrganizationAuth } from '@/lib/auth/helpers';
import { withRLS } from '@/lib/db/rls';

export const GET = withOrganizationAuth(async (req, user, orgId) => {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  
  // RLS garante que só vemos dados da nossa org
  const contacts = await withRLS(prisma, orgId, async (tx) => {
    return tx.contact.findMany({
      where: {
        organizationId: orgId,  // Ainda filtramos para performance
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } }
          ]
        })
      },
      orderBy: { lastInteractionAt: 'desc' }
    });
  });
  
  return NextResponse.json({ success: true, data: contacts });
});

export const POST = withOrganizationAuth(async (req, user, orgId) => {
  const body = await req.json();
  
  const contact = await withRLS(prisma, orgId, async (tx) => {
    return tx.contact.create({
      data: {
        ...body,
        organizationId: orgId
      }
    });
  });
  
  return NextResponse.json({ success: true, data: contact }, { status: 201 });
});
```

---

## 🚀 Passo 5: Testes de Segurança

### 5.1 Teste de Acesso Cruzado

Crie um teste que tenta acessar dados de outra organização:

```typescript
// __tests__/security/rls-isolation.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';

describe('RLS Isolation', () => {
  it('should not allow cross-organization access', async () => {
    // Criar duas organizações
    const org1 = await prisma.organization.create({
      data: { name: 'Org 1', slug: 'org-1', ownerId: 'user-1' }
    });
    
    const org2 = await prisma.organization.create({
      data: { name: 'Org 2', slug: 'org-2', ownerId: 'user-2' }
    });
    
    // Criar contato na org 1
    await prisma.contact.create({
      data: {
        organizationId: org1.id,
        phone: '+5511999999999'
      }
    });
    
    // Tentar acessar via org 2 - deve retornar vazio
    const contacts = await withRLS(prisma, org2.id, async (tx) => {
      return tx.contact.findMany({
        where: { phone: '+5511999999999' }
      });
    });
    
    expect(contacts).toHaveLength(0);
    
    // Limpar
    await prisma.contact.deleteMany({});
    await prisma.organization.deleteMany({
      where: { id: { in: [org1.id, org2.id] } }
    });
  });
});
```

### 5.2 Teste de Integração Manual

```bash
# 1. Iniciar o servidor de desenvolvimento
npm run dev

# 2. Fazer login como usuário da org A
# 3. Acessar /api/contacts - deve retornar apenas contatos da org A

# 4. Modificar o localStorage/cookie para fingir ser da org B
# 5. Acessar /api/contacts novamente
# 6. Verificar que NÃO vê dados da org B
```

---

## ⚠️ Troubleshooting

### Problema: "permission denied for table"

**Causa:** O usuário do banco não tem permissão para acessar a tabela com RLS.

**Solução:**
```sql
-- Conceder permissões (executar como superusuário)
GRANT ALL ON contacts TO your_app_user;
GRANT ALL ON deals TO your_app_user;
-- ... para todas as tabelas
```

### Problema: Queries retornam vazio

**Causa:** O `app.current_org_id` não está configurado.

**Verificação:**
```sql
-- Verificar o setting atual
SHOW app.current_org_id;

-- Deve retornar o UUID da organização
```

**Solução:** Certifique-se de que o código está chamando `withRLS()` corretamente.

### Problema: Performance degradada

**Causa:** Falta de índice em `organization_id`.

**Verificação:**
```sql
-- Verificar índices existentes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'contacts';
```

**Solução:** Criar índices se necessário:
```sql
CREATE INDEX IF NOT EXISTS idx_contacts_org_id ON contacts(organization_id);
```

---

## 📝 Checklist de Conclusão

- [ ] Migração SQL aplicada no banco
- [ ] Políticas verificadas com `pg_policies`
- [ ] Testes manuais de isolamento passaram
- [ ] Endpoints críticos atualizados para usar `withRLS()`
- [ ] Testes de segurança automatizados criados
- [ ] Documentação de rollback preparada
- [ ] Performance validada em staging

---

## 🔄 Rollback (Emergência)

Se algo der errado, execute:

```sql
-- Desabilitar RLS em todas as tabelas
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE deals DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
-- ... para todas as tabelas

-- Remover todas as políticas (opcional)
DROP POLICY IF EXISTS contacts_select_own_org ON contacts;
DROP POLICY IF EXISTS contacts_insert_own_org ON contacts;
DROP POLICY IF EXISTS contacts_update_own_org ON contacts;
DROP POLICY IF EXISTS contacts_delete_own_org ON contacts;
-- ... para todas as políticas
```

---

## 🎯 Próximos Passos

Após completar a Fase 2:

1. **Monitoramento:** Adicionar métricas de query time para detectar degradação de performance
2. **Auditoria:** Considerar logar tentativas de acesso negadas
3. **Fase 3:** Implementar permissões granulares (OWNER/ADMIN/MANAGER/MEMBER)

---

## 🔗 Referências

- [Documento de Plano](fase2-plano-rls.md)
- [Script SQL](fase2-migracao.sql)
- [PostgreSQL RLS Docs](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
