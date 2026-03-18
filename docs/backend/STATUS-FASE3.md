# Status Fase 3: RBAC - Permissões Granulares

## ✅ CONCLUÍDO

---

## Resumo

A Fase 3 implementa **Role-Based Access Control (RBAC)** com 4 níveis hierárquicos de permissões, adicionando uma camada de segurança em cima do RLS da Fase 2.

---

## Hierarquia de Roles

```
┌─────────────────────────────────────────┐
│  OWNER  (nível 4)                       │
│  └── Acesso total + faturamento         │
├─────────────────────────────────────────┤
│  ADMIN  (nível 3)                       │
│  └── Gerencia configurações e membros   │
├─────────────────────────────────────────┤
│  MANAGER (nível 2)                      │
│  └── Gerencia pipeline e equipe         │
├─────────────────────────────────────────┤
│  MEMBER (nível 1)                       │
│  └── Operações básicas do dia a dia     │
└─────────────────────────────────────────┘
```

---

## Endpoints Protegidos com RBAC

| Endpoint | Método | Permissão Requerida | Quem Acessa |
|----------|--------|---------------------|-------------|
| `/api/contacts/[id]` | DELETE | `contacts:delete` | ADMIN, OWNER |
| `/api/pipeline/deals/[id]` | DELETE | `deals:delete` | ADMIN, OWNER |
| `/api/tags` | POST | `tags:manage` | MANAGER, ADMIN, OWNER |
| `/api/tags/[id]` | PATCH | `tags:manage` | MANAGER, ADMIN, OWNER |
| `/api/tags/[id]` | DELETE | `tags:manage` | MANAGER, ADMIN, OWNER |

---

## Arquitetura de Segurança

```
┌─────────────────────────────────────────┐
│           API Request                   │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│      JWT Auth (getCurrentMember)        │
│  ├── Extrai user_id do cookie           │
│  ├── Busca membership na org            │
│  └── Retorna role (OWNER/ADMIN/etc)     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│     RBAC Check (permissions.ts)         │
│  ├── Verifica se role tem permissão     │
│  └── Permite ou nega acesso             │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│      RLS (banco de dados)               │
│  ├── Verifica organization_id           │
│  └── Garante isolamento de tenants      │
└─────────────────────────────────────────┘
```

**Defense in Depth**: Duas camadas de proteção atuando juntas.

---

## Arquivos Criados/Atualizados

### Novos

| Arquivo | Tamanho | Descrição |
|---------|---------|-----------|
| `lib/auth/permissions.ts` | ~14KB | Sistema RBAC completo |
| `docs/backend/fase3-plano-rbac.md` | ~5KB | Plano com matriz de permissões |
| `docs/backend/fase3-implementacao.md` | ~8KB | Guia de implementação |
| `docs/backend/STATUS-FASE3.md` | Este arquivo | Status atual |

### Atualizados (RBAC Aplicado)

| Arquivo | Alteração |
|---------|-----------|
| `lib/auth/helpers.ts` | + `getCurrentMember()` e tipos |
| `app/api/contacts/[id]/route.ts` | DELETE protegido com `contacts:delete` |
| `app/api/pipeline/deals/[id]/route.ts` | DELETE protegido com `deals:delete` |
| `app/api/tags/route.ts` | POST protegido com `tags:manage` |
| `app/api/tags/[id]/route.ts` | PATCH e DELETE protegidos com `tags:manage` |

---

## API de Permissões

### Funções de Verificação

```typescript
// Verificação simples
const canDelete = checkPermission(role, 'contacts:delete')

// Verificação assíncrona (endpoints)
const member = await requirePermission(request, 'contacts:delete')

// Wrapper para handlers
export const DELETE = withPermission('contacts:delete', async (request, member) => {
  // ...
})

// Verificação por nível
export const POST = withMinRole(OrganizationRole.ADMIN, async (request, member) => {
  // ...
})
```

### Permissões Definidas

| Categoria | Permissões |
|-----------|------------|
| Contatos | `read`, `create`, `update`, `update_own`, `delete`, `import`, `export` |
| Deals | `read`, `read_all`, `create`, `update`, `update_own`, `delete`, `change_stage` |
| Mensagens | `read`, `send`, `use_templates`, `read_all` |
| Configurações | `read`, `update`, `billing:read`, `billing:manage` |
| Membros | `read`, `invite`, `update`, `remove`, `change_role` |
| Instâncias | `read`, `connect`, `manage`, `delete` |
| Tags/Listas | `read`, `manage` |
| Pipeline | `read`, `manage` |
| Dashboard | `read`, `reports:read`, `reports:export` |
| Agendamentos | `read`, `create`, `update`, `delete` |
| Metas | `read`, `manage` |
| Integrações | `read`, `manage`, `webhooks:manage` |

---

## Exemplos de Uso

### Endpoint Protegido (DELETE contato)

```typescript
// Antes (apenas RLS)
export async function DELETE(request: NextRequest) {
  await prisma.contact.delete({ where: { id } })
}

// Depois (RLS + RBAC)
export const DELETE = withPermission('contacts:delete', async (request, member) => {
  // RLS garante que é da mesma org
  // RBAC garante que tem permissão de deletar
  await prisma.contact.delete({ where: { id } })
})
```

### Resposta de Acesso Negado

```json
{
  "success": false,
  "error": "Permissão negada: contacts:delete. Role atual: MEMBER"
}
```

---

## Matriz de Permissões Simplificada

| Recurso | OWNER | ADMIN | MANAGER | MEMBER |
|---------|-------|-------|---------|--------|
| **Contatos** |||||
| Visualizar | ✅ | ✅ | ✅ | ✅ |
| Criar | ✅ | ✅ | ✅ | ✅ |
| Editar | ✅ | ✅ | ✅ | Próprios |
| **Excluir** | ✅ | ✅ | ❌ | ❌ |
| Importar | ✅ | ✅ | ✅ | ❌ |
| **Deals** |||||
| Visualizar | ✅ | ✅ | ✅ | Atribuídos |
| Criar | ✅ | ✅ | ✅ | ✅ |
| **Excluir** | ✅ | ✅ | ❌ | ❌ |
| **Tags** |||||
| Visualizar | ✅ | ✅ | ✅ | ✅ |
| **Criar/Editar/Excluir** | ✅ | ✅ | ✅ | ❌ |
| **Configurações** |||||
| Editar | ✅ | ✅ | ❌ | ❌ |
| Faturamento | ✅ | ❌ | ❌ | ❌ |
| Membros | ✅ | ✅ | ❌ | ❌ |
| **Instâncias** |||||
| Conectar | ✅ | ✅ | ❌ | ❌ |

---

## Build

```
✓ Compiled successfully in 42.0s
✓ Generating static pages (170/170)
```

**Status: Build OK** ✅

---

## Testando as Permissões

### Teste 1: MEMBER tentando deletar contato
```bash
curl -X DELETE /api/contacts/123 \
  -H "Cookie: nexia_session=<token_member>"

# Resposta esperada:
# 403 Forbidden
# { "success": false, "error": "Permissão negada: contacts:delete. Role atual: MEMBER" }
```

### Teste 2: ADMIN deletando contato
```bash
curl -X DELETE /api/contacts/123 \
  -H "Cookie: nexia_session=<token_admin>"

# Resposta esperada:
# 200 OK
# { "success": true, "message": "Contact moved to trash successfully" }
```

### Teste 3: MANAGER criando tag
```bash
curl -X POST /api/tags \
  -H "Cookie: nexia_session=<token_manager>" \
  -d '{"name": "Novo Tag", "color": "#ff0000"}'

# Resposta esperada:
# 201 Created
# { "success": true, "data": { ... } }
```

---

## Próximos Passos Recomendados (Opcional)

### 1. Aplicar em Mais Endpoints

```
/api/settings/*                       → ADMIN+
/api/billing/*                        → OWNER
/api/organizations/members/*          → ADMIN+
/api/whatsapp/instances/connect       → ADMIN+
/api/pipeline/stages                  → MANAGER+
```

### 2. Frontend - UI Condicional

```typescript
// hooks/usePermission.ts
export function usePermission(permission: Permission): boolean {
  const { member } = useAuth()
  return checkPermission(member?.role, permission)
}

// Uso no componente
const canDelete = usePermission('contacts:delete')
{canDelete && <Button onClick={handleDelete}>Excluir</Button>}
```

### 3. Auditoria

```typescript
// Log ações administrativas
await auditLog({
  userId: member.userId,
  action: 'CONTACT_DELETE',
  resourceId: contactId,
  timestamp: new Date()
})
```

---

## Checklist de Implementação

- [x] Criar helper `permissions.ts`
- [x] Definir matriz de permissões
- [x] Criar funções de verificação (`checkPermission`, `requirePermission`)
- [x] Criar wrappers (`withPermission`, `withMinRole`, `withAnyPermission`)
- [x] Atualizar `helpers.ts` com `getCurrentMember()`
- [x] Documentar uso
- [x] Aplicar em endpoints críticos:
  - [x] DELETE /api/contacts/[id] - ADMIN+
  - [x] DELETE /api/pipeline/deals/[id] - ADMIN+
  - [x] POST /api/tags - MANAGER+
  - [x] PATCH/DELETE /api/tags/[id] - MANAGER+
- [x] Validar build
- [ ] Adicionar testes unitários
- [ ] Implementar auditoria

---

## Referências

- **Fase 1**: JWT Auth implementado em 5 endpoints
- **Fase 2**: RLS em 18 tabelas, 69 policies
- **Fase 3**: RBAC aplicado em 4 endpoints críticos
- **Arquivo Principal**: `lib/auth/permissions.ts`
- **Plano**: `docs/backend/fase3-plano-rbac.md`
- **Implementação**: `docs/backend/fase3-implementacao.md`

---

**Status: Pronto para uso em produção** ✅

Última atualização: 2026-03-18
