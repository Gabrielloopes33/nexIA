# Fase 1.B - Refatoração dos Endpoints Críticos

> **Data:** 18/03/2026  
> **Status:** 🚧 Em Execução  
> **Objetivo:** Refatorar apenas os 5 endpoints críticos identificados

---

## 📋 Checklist de Refatoração

### Endpoints a Refatorar

- [ ] `app/api/contacts/route.ts` (3 issues: 2x fallback org, 1x query param)
- [ ] `app/api/pipeline/stages/route.ts` (4 issues: 3x fallback org, 1x query param)
- [ ] `app/api/pipeline/deals/route.ts` (2 issues: 1x fallback org, 1x query param)
- [ ] `app/api/pipeline/templates/route.ts` (2 issues: 2x fallback org)
- [ ] `app/api/tags/route.ts` (2 issues: 1x fallback org, 1x query param)

---

## 📝 Padrão de Refatoração por Endpoint

Para cada endpoint, seguir este checklist:

### 1. Imports
```typescript
import { 
  getOrganizationId, 
  getAuthenticatedUser,
  requireOrganizationMembership,
  AuthError, 
  createAuthErrorResponse 
} from '@/lib/auth/helpers';
import { prisma } from '@/lib/prisma';
```

### 2. Wrapper try/catch
```typescript
export async function GET(request: NextRequest) {
  try {
    // ... lógica aqui
  } catch (error) {
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }
    console.error('[Endpoint] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
```

### 3. Extrair organizationId do JWT
```typescript
// ANTES (ruim):
const { searchParams } = new URL(request.url);
let organizationId = searchParams.get('organizationId');
if (!organizationId || organizationId === 'default_org_id') {
  // fallback inseguro...
}

// DEPOIS (bom):
const organizationId = await getOrganizationId();
```

### 4. Validar membership (se necessário)
```typescript
await requireOrganizationMembership(organizationId);
```

### 5. Substituir supabaseServer por Prisma
```typescript
// ANTES:
const { data, error } = await supabaseServer
  .from('contacts')
  .select('*')
  .eq('organization_id', organizationId);

// DEPOIS:
const data = await prisma.contact.findMany({
  where: { organizationId }
});
```

---

## 📁 Arquivos para Modificar

### 1. contacts/route.ts
**Issues:**
- Linha 17: `organizationId` via query param
- Linha 26: Fallback para `default_org_id` 
- Linha 130: Fallback para `default_org_id`

**Ações:**
- [ ] Remover leitura de query param
- [ ] Usar `getOrganizationId()`
- [ ] Remover lógica de fallback
- [ ] Substituir supabaseServer por Prisma
- [ ] Testar GET e POST

### 2. pipeline/stages/route.ts
**Issues:**
- Linha 40: `organizationId` via query param
- Linha 47: Fallback para `default_org_id`
- Linha 180: Fallback para `default_org_id`
- Linha 288: Fallback para `default_org_id`

**Ações:**
- [ ] Remover leitura de query param
- [ ] Usar `getOrganizationId()`
- [ ] Remover lógica de fallback (3 lugares)
- [ ] Substituir supabaseServer por Prisma
- [ ] Testar GET, POST, PUT, DELETE

### 3. pipeline/deals/route.ts
**Issues:**
- Linha 12: `organizationId` via query param
- Linha 22: Fallback para `default_org_id`

**Ações:**
- [ ] Remover leitura de query param
- [ ] Usar `getOrganizationId()`
- [ ] Remover lógica de fallback
- [ ] Substituir supabaseServer por Prisma
- [ ] Testar GET e POST

### 4. pipeline/templates/route.ts
**Issues:**
- Linha 370: `organizationId` via body
- Linha 400: Fallback para `default_org_id`

**Ações:**
- [ ] Remover `organizationId` do body schema
- [ ] Usar `getOrganizationId()`
- [ ] Remover lógica de fallback
- [ ] Substituir supabaseServer por Prisma
- [ ] Testar endpoints

### 5. tags/route.ts
**Issues:**
- Linha 136: `organizationId` via query param
- Linha 142: Fallback para `default_org_id`

**Ações:**
- [ ] Remover leitura de query param
- [ ] Usar `getOrganizationId()`
- [ ] Remover lógica de fallback
- [ ] Substituir supabaseServer por Prisma
- [ ] Testar GET e POST

---

## ⚠️ Cuidados Especiais

### 1. Compatibilidade com Frontend
Verificar se o frontend está enviando `organizationId` e remover:
- Hooks que passam `organizationId` explicitamente
- Chamadas de API com `organizationId` nos params

### 2. Webhooks
Webhooks externos (WhatsApp, Instagram) **NÃO** devem ser alterados nesta refatoração.

### 3. Testes
Após cada refatoração:
1. Testar sem token (deve retornar 401)
2. Testar com token válido (deve funcionar)
3. Testar com usuário de outra org (deve retornar 403)

---

## 📊 Métricas de Sucesso

- [ ] 5 endpoints críticos refatorados
- [ ] 0 fallbacks para `default_org_id` restantes
- [ ] 0 endpoints aceitando `organizationId` do cliente
- [ ] Build passando
- [ ] Testes manuais realizados

---

## 🚀 Após Concluir

1. Atualizar este documento marcando checkboxes
2. Criar resumo da refatoração
3. Avançar para **Fase 2 (RLS)**
4. Documentar débito técnico dos endpoints restantes (34 issues em ~100 endpoints)
