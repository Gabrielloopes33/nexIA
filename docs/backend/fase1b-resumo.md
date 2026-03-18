# Fase 1.B - Refatoração dos Endpoints Críticos

> **Data:** 18/03/2026  
> **Status:** ✅ CONCLUÍDA

---

## Resumo Executivo

Foram refatorados os **5 endpoints críticos** identificados na Fase 1. Todos agora usam o novo sistema de autenticação baseado em JWT do cookie `nexia_session` e não aceitam mais `organizationId` do cliente.

---

## ✅ Endpoints Refatorados

| Endpoint | Issues Resolvidas | Status |
|----------|-------------------|--------|
| `app/api/contacts/route.ts` | 3 | ✅ Refatorado |
| `app/api/pipeline/stages/route.ts` | 4 | ✅ Refatorado |
| `app/api/pipeline/deals/route.ts` | 2 | ✅ Refatorado |
| `app/api/pipeline/templates/route.ts` | 2 | ✅ Refatorado |
| `app/api/tags/route.ts` | 2 | ✅ Refatorado |

**Total:** 13 issues resolvidas de 39 (33%)

---

## 🔧 Mudanças Aplicadas

### 1. Sistema de Autenticação

**Antes:**
```typescript
// Aceitava organizationId do query param ou body
const organizationId = searchParams.get('organizationId');
// ou
const { organizationId } = await request.json();

// Fallback inseguro
if (!organizationId || organizationId === 'default_org_id') {
  const { data: org } = await supabaseServer.from('organizations').select('id').limit(1).single();
  organizationId = org?.id;
}
```

**Depois:**
```typescript
// Extrai do JWT no cookie
import { getOrganizationId, AuthError, createAuthErrorResponse } from '@/lib/auth/helpers';

export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId();
    // ...
  } catch (error) {
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }
    // ...
  }
}
```

### 2. Troca Supabase → Prisma

**Antes:**
```typescript
const { data, error } = await supabaseServer
  .from('contacts')
  .select('*')
  .eq('organization_id', organizationId);
```

**Depois:**
```typescript
const data = await prisma.contact.findMany({
  where: { organizationId }
});
```

### 3. Validação de Membership (opcional)

```typescript
import { requireOrganizationMembership } from '@/lib/auth/helpers';

// Em endpoints sensíveis (delete, admin, etc.)
await requireOrganizationMembership(organizationId);
```

---

## 📊 Métricas

| Métrica | Antes | Depois |
|---------|-------|--------|
| Endpoints com query param orgId | 30 | 25 (-5) |
| Endpoints com fallback default_org_id | 9 | 4 (-5) |
| Uso de supabaseServer (endpoints críticos) | 100% | 0% |
| Validação JWT | 0% | 100% |

---

## 🧪 Testes Recomendados

Antes de prosseguir para Fase 2, testar:

```bash
# 1. Teste sem token (deve retornar 401)
curl http://localhost:3000/api/contacts

# 2. Teste com token inválido (deve retornar 401) 
curl -H "Cookie: nexia_session=invalid" http://localhost:3000/api/contacts

# 3. Teste com token válido (deve funcionar)
# (fazer login primeiro e usar o cookie)

# 4. Teste POST sem organizationId no body (deve funcionar)
curl -X POST http://localhost:3000/api/contacts \
  -H "Content-Type: application/json" \
  -H "Cookie: nexia_session=xxx" \
  -d '{"name":"Test","phone":"11999999999"}'
```

---

## 🚀 Próximos Passos

### Fase 2 - RLS (Row Level Security)

Agora que os endpoints críticos estão refatorados, podemos avançar para implementar RLS no banco de dados.

**Tabelas críticas sem RLS:**
- `contacts` 🔴
- `deals` 🔴
- `messages` 🔴
- `conversations` 🔴

**Documento:** `docs/backend/fase2-plano-rls.md`

---

## 📝 Débito Técnico Documentado

### Endpoints Restantes (34 issues)

Ver arquivo: `docs/backend/fase1-debito-tecnico.md`

**Resumo:**
- 25 endpoints aceitando `organizationId` via query param
- 4 endpoints com fallback `default_org_id`
- Prioridade média/baixa

**Quando voltar:**
1. Após Fase 2 (RLS) estar completa
2. Ou durante manutenção gradual
3. Ou antes de adicionar novos tenants

---

## 📁 Arquivos Modificados

| Arquivo | Mudanças |
|---------|----------|
| `app/api/contacts/route.ts` | Refatorado completo (GET/POST) |
| `app/api/pipeline/stages/route.ts` | Refatorado completo (GET/POST/DELETE) |
| `app/api/pipeline/deals/route.ts` | Refatorado completo (GET/POST) |
| `app/api/pipeline/templates/route.ts` | Refatorado completo (GET/POST) |
| `app/api/tags/route.ts` | Refatorado completo (GET/POST) |

---

## ✅ Checklist de Aceite

- [x] 5 endpoints críticos refatorados
- [x] 0 fallbacks `default_org_id` nos endpoints críticos
- [x] 0 aceitação de `organizationId` do cliente nos endpoints críticos
- [x] 100% dos endpoints críticos usando helpers de auth
- [x] Build passando
- [x] Débito técnico documentado

---

## 🎯 Resultado

**Status:** Pronto para avançar para Fase 2 (RLS)

Os endpoints mais críticos do sistema agora estão seguros e usando autenticação JWT. A Fase 2 pode prosseguir sem impedimentos.
