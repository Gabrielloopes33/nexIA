# Fase 1 - Fundação Auth + Organization

> **Data:** 18/03/2026  
> **Status:** ✅ CONCLUÍDA (com documentação e exemplos)

---

## Resumo Executivo

A Fase 1 estabeleceu a base para o sistema de autenticação e organização multi-tenant. Foram criados helpers robustos para extração de dados do usuário a partir do JWT, atualizado o OrganizationContext para usar o cookie localmente, e mapeado todos os endpoints que precisam de refatoração.

---

## ✅ Entregáveis Concluídos

### 1.1 - Helpers de Autenticação

**Arquivo:** `lib/auth/helpers.ts`

Funções criadas:

| Função | Descrição |
|--------|-----------|
| `getAuthenticatedUser()` | Retorna userId, email, name, organizationId do JWT |
| `getOrganizationId()` | Retorna organizationId ou lança AuthError |
| `requireOrganizationMembership()` | Valida se usuário é membro ativo da org |
| `requireRole()` | Verifica se usuário tem role permitida |
| `withAuth()` | Wrapper HOF para API routes |
| `withOrganizationAuth()` | Wrapper com validação de membership |
| `createAuthErrorResponse()` | Cria resposta padronizada de erro |

**Classes:**
- `AuthError` - Erro customizado com statusCode (401/403)

### 1.2 - Client-Side Auth Utilities

**Arquivo:** `lib/auth/client.ts`

Funções para uso no browser (decode JWT sem verificar assinatura):

| Função | Descrição |
|--------|-----------|
| `decodeJwtUnsafe()` | Decodifica JWT para leitura |
| `getSessionToken()` | Lê cookie 'nexia_session' |
| `getSessionPayload()` | Retorna payload completo |
| `getOrganizationIdFromSession()` | Extrai organizationId |
| `isAuthenticated()` | Verifica se há sessão válida |

### 1.3 - OrganizationContext Atualizado

**Arquivo:** `lib/contexts/organization-context.tsx`

Mudanças:
- ✅ Decodifica JWT localmente (sem fetch inicial)
- ✅ Extrai organizationId do cookie
- ✅ Busca detalhes via API apenas quando necessário
- ✅ Atualiza quando cookie muda (outras abas)
- ✅ Novo hook `useHasOrganization()`

### 1.4 - API de Organização

**Arquivo:** `app/api/organization/me/route.ts`

Mudanças:
- ✅ Usa `getAuthenticatedUser()` para validar JWT
- ✅ Remove dependência do Supabase Auth
- ✅ Usa Prisma para buscar dados da organização
- ✅ Tratamento de erros com `AuthError`

### 1.5 - Mapeamento de Endpoints

**Script:** `scripts/fase1-mapear-endpoints.ts`

**Resultados:**
- 108 endpoints analisados
- 39 issues encontradas
- 30 issues do tipo QUERY_PARAM
- 9 issues do tipo FALLBACK_ORG

**Endpoints críticos identificados:**
1. `app/api/contacts/route.ts` (3 issues)
2. `app/api/pipeline/stages/route.ts` (4 issues)
3. `app/api/pipeline/deals/route.ts` (2 issues)
4. `app/api/pipeline/templates/route.ts` (2 issues)
5. `app/api/tags/route.ts` (2 issues)

### 1.6 - Guia de Refatoração

**Arquivo:** `docs/backend/fase1-guia-refatoracao.md`

Documentação completa com:
- Checklist de refatoração
- Padrões ANTES/DEPOIS
- Exemplos de código
- Prioridade de refatoração
- Cuidados especiais (webhooks, endpoints públicos)

### 1.7 - Exemplo de Refatoração

**Arquivo:** `app/api/contacts/route.refactored.ts`

Exemplo completo de como ficará o endpoint após refatoração:
- Usa `getOrganizationId()`
- Valida membership
- Troca supabaseServer por Prisma
- Trata AuthError

---

## 📁 Arquivos Criados/Modificados

### Novos Arquivos
| Arquivo | Descrição |
|---------|-----------|
| `lib/auth/helpers.ts` | Helpers server-side de autenticação |
| `lib/auth/client.ts` | Helpers client-side de autenticação |
| `scripts/fase1-mapear-endpoints.ts` | Script de mapeamento |
| `docs/backend/fase1-plano.md` | Plano da fase |
| `docs/backend/fase1-guia-refatoracao.md` | Guia de refatoração |
| `docs/backend/fase1-resumo.md` | Este documento |
| `app/api/contacts/route.refactored.ts` | Exemplo de refatoração |

### Arquivos Modificados
| Arquivo | Mudança |
|---------|---------|
| `lib/contexts/organization-context.tsx` | Usa decode JWT local |
| `app/api/organization/me/route.ts` | Usa novos helpers |

---

## 🎯 Próximos Passos (Fase 1.6 em diante)

A Fase 1 estabeleceu a **fundação**. A execução da refatoração dos 108 endpoints pode ser:

### Opção A: Continuar na Fase 1 (Refatoração Completa)
- Refatorar todos os 108 endpoints
- Testar cada endpoint refatorado
- Remover código legado

### Opção B: Avançar para Fase 2 (RLS)
- Deixar refatoração como débito técnico documentado
- Avançar para implementar RLS nas tabelas críticas
- Voltar à refatoração gradualmente

### Opção C: Abordagem Híbrida (Recomendado)
1. Refatorar apenas os **5 endpoints críticos** agora
2. Avançar para Fase 2 (RLS)
3. Refatorar endpoints restantes gradualmente durante as próximas fases

---

## 🏗️ Arquitetura Resultante

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE                              │
├─────────────────────────────────────────────────────────────┤
│  Cookie: nexia_session (JWT)                                │
│  ├── userId                                                 │
│  ├── email                                                  │
│  ├── name                                                   │
│  └── organizationId                                         │
├─────────────────────────────────────────────────────────────┤
│  OrganizationContext                                        │
│  ├── decode JWT local (useSessionPayload)                   │
│  ├── getOrganizationIdFromSession()                         │
│  └── fetch /api/organization/me (detalhes)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        API ROUTES                           │
├─────────────────────────────────────────────────────────────┤
│  lib/auth/helpers.ts                                        │
│  ├── getAuthenticatedUser() → valida JWT                    │
│  ├── getOrganizationId() → do JWT                           │
│  ├── requireOrganizationMembership() → valida acesso        │
│  └── withAuth() / withOrganizationAuth() → wrappers         │
├─────────────────────────────────────────────────────────────┤
│  Endpoints refatorados:                                     │
│  ├── Não aceitam organizationId do cliente                  │
│  ├── Extraem do JWT via helpers                             │
│  └── Validam membership antes de executar                   │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Aceite

- [x] Helpers de autenticação criados e funcionando
- [x] OrganizationContext usa decode JWT local
- [x] API /organization/me usa novos helpers
- [x] Mapeamento de endpoints completo (108 endpoints, 39 issues)
- [x] Guia de refatoração documentado
- [x] Exemplo de refatoração criado

---

## 📊 Métricas

| Métrica | Valor |
|---------|-------|
| Endpoints analisados | 108 |
| Issues mapeadas | 39 |
| Arquivos criados | 7 |
| Arquivos modificados | 2 |
| Linhas de código (helpers) | ~400 |
| Tempo estimado para refatoração total | 16-20 horas |
| Tempo estimado para 5 endpoints críticos | 3-4 horas |
