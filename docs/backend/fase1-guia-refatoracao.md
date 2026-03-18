# Fase 1 - Guia de Refatoração de Endpoints

> Guia prático para refatorar endpoints da API para usar o novo sistema de autenticação.

---

## 🎯 Objetivo

Migrar todos os endpoints para:
1. **Não aceitar** `organizationId` do cliente (query param ou body)
2. **Extrair** `organizationId` do token JWT do cookie `nexia_session`
3. **Validar** que o usuário pertence à organização
4. **Remover** fallbacks para `default_org_id`

---

## 📋 Checklist de Refatoração

Para cada endpoint, verifique:

- [ ] Remove `organizationId` dos parâmetros aceitos
- [ ] Usa `getOrganizationId()` para obter do JWT
- [ ] Usa `requireOrganizationMembership()` para validar acesso
- [ ] Remove lógica de fallback para `default_org_id`
- [ ] Troca `supabaseServer` por `prisma` (quando possível)
- [ ] Trata `AuthError` com `createAuthErrorResponse()`

---

## 🔄 Padrões de Refatoração

### 1. GET Endpoint (Lista)

#### Antes
```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let organizationId = searchParams.get('organizationId');
  
  if (!organizationId || organizationId === 'default_org_id') {
    const { data: org } = await supabaseServer
      .from('organizations')
      .select('id')
      .limit(1)
      .single();
    organizationId = org?.id;
  }
  
  const { data, error } = await supabaseServer
    .from('contacts')
    .select('*')
    .eq('organization_id', organizationId);
    
  // ...
}
```

#### Depois
```typescript
import { 
  getOrganizationId, 
  AuthError, 
  createAuthErrorResponse 
} from '@/lib/auth/helpers';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId();
    
    const data = await prisma.contact.findMany({
      where: { organizationId },
    });
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
```

---

### 2. POST Endpoint (Criação)

#### Antes
```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { organizationId, name, email } = body;
  
  const { data, error } = await supabaseServer
    .from('contacts')
    .insert({ organization_id: organizationId, name, email })
    .single();
  // ...
}
```

#### Depois
```typescript
export async function POST(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId();
    
    const body = await request.json();
    const { name, email } = body; // Sem organizationId!
    
    const data = await prisma.contact.create({
      data: { organizationId, name, email },
    });
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }
    // ...
  }
}
```

---

### 3. Com Validação de Membership

```typescript
import { 
  requireOrganizationMembership,
  requireRole,
  AuthError, 
  createAuthErrorResponse 
} from '@/lib/auth/helpers';

export async function DELETE(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId();
    
    // Valida membership e retorna dados do usuário com role
    const auth = await requireOrganizationMembership(organizationId);
    
    // Verifica se tem permissão de admin
    requireRole(auth.membership, ['OWNER', 'ADMIN']);
    
    // Executa ação restrita
    await prisma.organization.delete({
      where: { id: organizationId },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }
    // ...
  }
}
```

---

### 4. Usando Wrapper `withAuth`

```typescript
import { withAuth, withOrganizationAuth } from '@/lib/auth/helpers';

// Versão simples (apenas autenticação)
export const GET = withAuth(async (user, request) => {
  const data = await prisma.contact.findMany({
    where: { organizationId: user.organizationId },
  });
  return NextResponse.json({ success: true, data });
});

// Versão com validação de membership
export const POST = withOrganizationAuth(async (auth, request) => {
  const body = await request.json();
  const data = await prisma.contact.create({
    data: {
      organizationId: auth.organizationId,
      ...body,
    },
  });
  return NextResponse.json({ success: true, data });
});
```

---

## 🗂️ Prioridade de Refatoração

### 🔴 Prioridade 1 (Crítico - fazer primeiro)

Endpoints que manipulam dados sensíveis:

1. `app/api/contacts/route.ts`
2. `app/api/pipeline/deals/route.ts`
3. `app/api/pipeline/stages/route.ts`
4. `app/api/conversations/route.ts`
5. `app/api/webhooks/form-submission/route.ts`

### 🟡 Prioridade 2 (Alto)

Endpoints de gestão:

6. `app/api/lists/route.ts`
7. `app/api/tags/route.ts`
8. `app/api/segments/route.ts`
9. `app/api/integrations/route.ts`
10. `app/api/custom-fields/route.ts`

### 🟢 Prioridade 3 (Médio)

Endpoints de dashboard e relatórios:

11. `app/api/dashboard/*/route.ts`
12. `app/api/form-submissions/*/route.ts`
13. `app/api/whatsapp/*/route.ts`

---

## ⚠️ Cuidados Especiais

### 1. Webhooks Externos

Webhooks que recebem chamadas de sistemas externos (como WhatsApp Cloud API) **não devem** usar autenticação JWT, pois são chamadas server-to-server.

```typescript
// Webhook - mantém validação via token/signature
export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-hub-signature-256');
  // Valida signature...
  // Extrai organizationId do payload de forma segura
}
```

### 2. Endpoints Públicos

Endpoints como login, registro, etc. não devem exigir autenticação.

```typescript
// Auth endpoints - sem auth
export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  // ...
}
```

### 3. Migração Gradual

Durante a transição, mantenha compatibilidade temporária:

```typescript
export async function GET(request: NextRequest) {
  try {
    // Tenta novo método primeiro
    const organizationId = await getOrganizationId();
    // ...
  } catch (error) {
    if (error instanceof AuthError) {
      // Fallback temporário para compatibilidade
      const { searchParams } = new URL(request.url);
      const organizationId = searchParams.get('organizationId');
      // ... com aviso de depreciação
      console.warn('[DEPRECATED] Using organizationId from query param');
    }
  }
}
```

---

## ✅ Validação

Após refatorar, teste:

1. **Sem token**: Deve retornar 401
2. **Token inválido**: Deve retornar 401
3. **Token expirado**: Deve retornar 401
4. **Usuário sem organização**: Deve retornar 403
5. **Usuário de outra org**: Deve retornar 403
6. **Requisição válida**: Deve funcionar normalmente

---

## 📊 Métricas de Sucesso

- [ ] 0 endpoints aceitando `organizationId` do cliente
- [ ] 0 fallbacks para `default_org_id`
- [ ] 100% dos endpoints protegidos usando helpers
- [ ] 0 imports de `supabaseServer` em endpoints (onde possível)
