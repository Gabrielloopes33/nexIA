# Fase 3: Implementação do RBAC

## Status: ✅ CONCLUÍDO

---

## Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `lib/auth/permissions.ts` | Helper completo de permissões RBAC |
| `docs/backend/fase3-plano-rbac.md` | Plano detalhado com matriz de permissões |
| `docs/backend/fase3-implementacao.md` | Este documento |

---

## Atualizações no Código Existente

| Arquivo | Alteração |
|---------|-----------|
| `lib/auth/helpers.ts` | Adicionado `getCurrentMember()` e tipos para RBAC |

---

## Hierarquia de Roles

```
OWNER (4)
  └── ADMIN (3)
        └── MANAGER (2)
              └── MEMBER (1)
```

Cada role herda permissões dos níveis inferiores.

---

## Uso nos Endpoints

### 1. Verificação Simples de Permissão

```typescript
import { requirePermission, permissionDeniedResponse } from '@/lib/auth/permissions'

export async function DELETE(request: NextRequest) {
  try {
    const member = await requirePermission(request, 'contacts:delete')
    // ... executar delete
  } catch (error) {
    return permissionDeniedResponse('Você não tem permissão para excluir contatos')
  }
}
```

### 2. Usando Wrapper (Mais Limpo)

```typescript
import { withPermission } from '@/lib/auth/permissions'

export const DELETE = withPermission('contacts:delete', async (request, member) => {
  // member contém id, organizationId, userId, role, status
  // ... executar delete
  return NextResponse.json({ success: true })
})
```

### 3. Verificação de Qualquer Permissão

```typescript
import { withAnyPermission } from '@/lib/auth/permissions'

export const POST = withAnyPermission(
  ['contacts:create', 'contacts:import'],
  async (request, member) => {
    // ... executar
  }
)
```

### 4. Verificação por Nível de Role

```typescript
import { withMinRole } from '@/lib/auth/permissions'
import { OrganizationRole } from '@prisma/client'

export const POST = withMinRole(OrganizationRole.MANAGER, async (request, member) => {
  // Apenas MANAGER, ADMIN ou OWNER podem executar
})
```

### 5. Verificação Programática

```typescript
import { checkPermission, getCurrentMemberWithRole } from '@/lib/auth/permissions'

export async function PATCH(request: NextRequest) {
  const member = await getCurrentMemberWithRole(request)
  
  if (!member) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  
  // Verifica permissão específica
  if (!checkPermission(member.role, 'contacts:update')) {
    // Verifica se é o próprio recurso
    const isOwner = await checkResourceOwner(request, member.userId)
    if (!isOwner) {
      return permissionDeniedResponse()
    }
  }
  
  // ... executar update
}
```

---

## Permissões Disponíveis

### Contatos
- `contacts:read` - Visualizar contatos
- `contacts:create` - Criar contatos
- `contacts:update` - Editar qualquer contato
- `contacts:update_own` - Editar próprios contatos
- `contacts:delete` - Excluir contatos
- `contacts:import` - Importar contatos
- `contacts:export` - Exportar contatos

### Deals
- `deals:read` - Visualizar deals
- `deals:read_all` - Visualizar todos os deals
- `deals:create` - Criar deals
- `deals:update` - Editar qualquer deal
- `deals:update_own` - Editar deals atribuídos
- `deals:delete` - Excluir deals
- `deals:change_stage` - Mudar estágio do pipeline

### Mensagens
- `messages:read` - Ler mensagens
- `messages:send` - Enviar mensagens
- `messages:use_templates` - Usar templates
- `messages:read_all` - Ler todas as conversas

### Configurações
- `settings:read` - Ler configurações
- `settings:update` - Atualizar configurações
- `billing:read` - Ver informações de faturamento
- `billing:manage` - Gerenciar faturamento

### Membros
- `members:read` - Ver membros
- `members:invite` - Convidar membros
- `members:update` - Atualizar membros
- `members:remove` - Remover membros
- `members:change_role` - Alterar roles

### Instâncias
- `instances:read` - Ver instâncias
- `instances:connect` - Conectar instâncias
- `instances:manage` - Gerenciar instâncias
- `instances:delete` - Excluir instâncias

### Tags/Listas/Segmentos
- `tags:read` | `tags:manage`
- `lists:read` | `lists:manage`
- `segments:read` | `segments:manage`

### Pipeline
- `pipeline:read` - Visualizar pipeline
- `pipeline:manage` - Gerenciar estágios

### Dashboard/Relatórios
- `dashboard:read` - Ver dashboard
- `reports:read` - Ver relatórios
- `reports:export` - Exportar relatórios

### Agendamentos
- `schedules:read`, `schedules:create`, `schedules:update`, `schedules:delete`

### Metas
- `goals:read`, `goals:manage`

### Integrações
- `integrations:read`, `integrations:manage`, `webhooks:manage`

---

## Exemplos de Proteção por Recurso

### Excluir Contato (apenas ADMIN+)

```typescript
// app/api/contacts/[id]/route.ts
export const DELETE = withPermission('contacts:delete', async (request, member) => {
  const { id } = request.params
  
  // RLS já garante que só exclui da própria org
  await prisma.contact.delete({
    where: { id }
  })
  
  return NextResponse.json({ success: true })
})
```

### Atualizar Deal (MANAGER+ ou próprio)

```typescript
// app/api/pipeline/deals/[id]/route.ts
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const member = await getCurrentMemberWithRole(request)
  if (!member) return permissionDeniedResponse()
  
  const deal = await prisma.deal.findUnique({
    where: { id: params.id }
  })
  
  // Verifica se pode editar
  const canEdit = checkPermission(member.role, 'deals:update') ||
                  (checkPermission(member.role, 'deals:update_own') && 
                   deal.assignedTo === member.userId)
  
  if (!canEdit) {
    return permissionDeniedResponse()
  }
  
  // ... executar update
}
```

### Gerenciar Membros (ADMIN+)

```typescript
// app/api/organizations/members/route.ts
export const POST = withMinRole(OrganizationRole.ADMIN, async (request, member) => {
  // Apenas ADMIN ou OWNER podem convidar
  const data = await request.json()
  // ... criar convite
})
```

---

## Testando Permissões

```typescript
// __tests__/unit/permissions.test.ts
import { checkPermission, getRoleLevel } from '@/lib/auth/permissions'
import { OrganizationRole } from '@prisma/client'

describe('RBAC', () => {
  it('OWNER deve ter todas as permissões', () => {
    expect(checkPermission(OrganizationRole.OWNER, 'contacts:delete')).toBe(true)
    expect(checkPermission(OrganizationRole.OWNER, 'billing:manage')).toBe(true)
  })
  
  it('MEMBER não deve poder excluir contatos', () => {
    expect(checkPermission(OrganizationRole.MEMBER, 'contacts:delete')).toBe(false)
  })
  
  it('hierarquia deve funcionar corretamente', () => {
    expect(getRoleLevel(OrganizationRole.OWNER)).toBe(4)
    expect(getRoleLevel(OrganizationRole.ADMIN)).toBe(3)
    expect(getRoleLevel(OrganizationRole.MANAGER)).toBe(2)
    expect(getRoleLevel(OrganizationRole.MEMBER)).toBe(1)
  })
})
```

---

## Próximos Passos

1. **Aplicar permissões nos endpoints críticos:**
   - `/api/contacts/*` - DELETE apenas ADMIN+
   - `/api/pipeline/deals/*` - UPDATE próprio ou MANAGER+
   - `/api/settings/*` - ADMIN+
   - `/api/billing/*` - OWNER apenas
   - `/api/organizations/members/*` - ADMIN+

2. **Adicionar verificações no frontend:**
   - Desabilitar botões quando não tiver permissão
   - Esconder menus não autorizados

3. **Auditoria:**
   - Logar ações administrativas
   - Registrar quem fez o quê e quando

---

## Segurança

- ✅ RLS protege no nível do banco (Fase 2)
- ✅ RBAC protege no nível da aplicação (Fase 3)
- ✅ Defense in depth: ambas as camadas ativas
- ✅ Sempre verificar no backend, nunca confiar no frontend
