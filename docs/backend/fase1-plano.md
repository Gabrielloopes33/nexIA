# Fase 1 - Fundação Auth + Organization

> **Status:** 🚧 Em Execução  
> **Data de Início:** 18/03/2026

---

## Objetivo

Unificar o sistema de autenticação (remover duplicidade Supabase/custom) e criar uma base sólida para o gerenciamento de organizações multi-tenant.

---

## Tarefas

### ✅ 1.1 - Criar helpers `getAuthenticatedUser()` e `getOrganizationId()`

**Descrição:** Criar funções utilitárias para uso em API routes que extraem e validam o usuário autenticado e sua organização.

**Arquivos:**
- `lib/auth/helpers.ts` (novo)

**Critérios de Aceite:**
- [ ] Função `getAuthenticatedUser()` retorna userId + email + name
- [ ] Função `getOrganizationId()` retorna organizationId ou lança erro
- [ ] Ambas leem do cookie `nexia_session` (JWT)
- [ ] Retornam erro 401 se não autenticado

---

### ⏳ 1.2 - Atualizar `OrganizationContext` para usar JWT

**Descrição:** Modificar o contexto de organização para usar o token JWT do cookie `nexia_session` em vez de fazer fetch para `/api/organization/me`.

**Arquivos:**
- `lib/contexts/organization-context.tsx`

**Critérios de Aceite:**
- [ ] Decodifica JWT localmente (sem fetch)
- [ ] Extrai organizationId do payload
- [ ] Busca detalhes da organização via API apenas uma vez
- [ ] Fallback para API se organizationId não estiver no JWT

---

### ⏳ 1.3 - Revisar endpoints que aceitam `organizationId` no body

**Descrição:** Identificar e refatorar todos os endpoints de API que aceitam `organizationId` via body/params, para extrair do usuário autenticado.

**Mapeamento realizado:** 39 issues em 108 endpoints

| Tipo de Issue | Quantidade | Descrição |
|---------------|------------|-----------|
| QUERY_PARAM | 30 | organizationId via query string |
| FALLBACK_ORG | 9 | Fallback para 'default_org_id' ou busca aleatória |

**Endpoints críticos (prioridade alta):**
- `app/api/contacts/route.ts` - 3 issues
- `app/api/pipeline/stages/route.ts` - 4 issues  
- `app/api/pipeline/deals/route.ts` - 2 issues
- `app/api/pipeline/templates/route.ts` - 2 issues
- `app/api/tags/route.ts` - 2 issues

**Padrão de Refatoração:**
```typescript
// ANTES (problemático)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let organizationId = searchParams.get('organizationId');
  
  if (!organizationId || organizationId === 'default_org_id') {
    // Busca org aleatória (inseguro!)
    const { data: org } = await supabaseServer.from('organizations').select('id').limit(1).single();
    organizationId = org?.id;
  }
  // ...
}

// DEPOIS (seguro)
export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId(); // Do JWT
    // ...
  } catch (error) {
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }
    throw error;
  }
}
```

**Critérios de Aceite:**
- [ ] Nenhum endpoint aceita organizationId do cliente
- [ ] Todos extraem do token JWT via `getOrganizationId()`
- [ ] Removidos todos os fallbacks para 'default_org_id'
- [ ] Validação de pertencimento à organização via `requireOrganizationMembership()`

---

### ⏳ 1.4 - Criar middleware de validação de organização

**Descrição:** Criar um middleware ou HOF (Higher-Order Function) para validar se o usuário pertence à organização antes de processar a request.

**Arquivos:**
- `lib/auth/organization-guard.ts` (novo)

**Critérios de Aceite:**
- [ ] Valida membership do usuário na organização
- [ ] Retorna 403 se não pertencer
- [ ] Cache de membership para múltiplas requests

---

### ⏳ 1.5 - Testar e validar integração

**Descrição:** Testar todo o fluxo de autenticação e organização.

**Critérios de Aceite:**
- [ ] Login funciona corretamente
- [ ] OrganizationContext carrega organização
- [ ] Hooks usam organizationId automaticamente
- [ ] APIs rejeitam organizationId do body
- [ ] APIs validam pertencimento à org

---

## Arquitetura Alvo

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │  OrganizationContext (JWT decode local)             │    │
│  │  - Lê cookie 'nexia_session'                       │    │
│  │  - Decodifica JWT (sem verificação de sig)         │    │
│  │  - Extrai organizationId                           │    │
│  │  - Busca detalhes via /api/organization/me uma vez │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        API ROUTES                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │  getAuthenticatedUser()                            │    │
│  │  getOrganizationId()                               │    │
│  │  - Lê cookie 'nexia_session'                       │    │
│  │  - Verifica JWT (com HMAC)                         │    │
│  │  - Retorna dados do usuário                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  requireOrganizationMembership()                    │    │
│  │  - Valida se user pertence à org                   │    │
│  │  - Retorna 403 se não pertencer                    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Progresso

| Tarefa | Status | Progresso |
|--------|--------|-----------|
| 1.1 - Helpers auth | ✅ Concluído | 100% |
| 1.2 - OrganizationContext JWT | ✅ Concluído | 100% |
| 1.3 - Revisar endpoints | ✅ Mapeado | 100% |
| 1.4 - Guia de refatoração | ✅ Concluído | 100% |
| 1.5 - Exemplo de refatoração | ✅ Concluído | 100% |
| 1.6 - Testes | ⏳ Pendente | 0% |
