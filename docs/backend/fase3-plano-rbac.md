# Fase 3: RBAC - Permissões Granulares (OWNER/ADMIN/MANAGER/MEMBER)

## Visão Geral

Implementar controle de acesso baseado em roles (RBAC) com 4 níveis hierárquicos:

| Role | Nível | Descrição |
|------|-------|-----------|
| **OWNER** | 4 | Dono da organização - acesso total |
| **ADMIN** | 3 | Administrador - gerencia configurações e membros |
| **MANAGER** | 2 | Gerente - gerencia pipeline e equipe |
| **MEMBER** | 1 | Membro - operações básicas no dia a dia |

---

## Matriz de Permissões

### Contatos (`contacts`)

| Ação | OWNER | ADMIN | MANAGER | MEMBER |
|------|-------|-------|---------|--------|
| Visualizar | ✅ | ✅ | ✅ | ✅ |
| Criar | ✅ | ✅ | ✅ | ✅ |
| Editar | ✅ | ✅ | ✅ | ✅ (próprios) |
| Excluir | ✅ | ✅ | ❌ | ❌ |
| Importar/Exportar | ✅ | ✅ | ✅ | ❌ |

### Deals/Pipeline (`deals`)

| Ação | OWNER | ADMIN | MANAGER | MEMBER |
|------|-------|-------|---------|--------|
| Visualizar | ✅ | ✅ | ✅ | ✅ |
| Criar | ✅ | ✅ | ✅ | ✅ |
| Editar | ✅ | ✅ | ✅ | ✅ (atribuídos) |
| Excluir | ✅ | ✅ | ❌ | ❌ |
| Mudar estágio | ✅ | ✅ | ✅ | ✅ |
| Ver todos | ✅ | ✅ | ✅ | ❌ (só atribuídos) |

### Mensagens (`messages`, `conversations`)

| Ação | OWNER | ADMIN | MANAGER | MEMBER |
|------|-------|-------|---------|--------|
| Visualizar | ✅ | ✅ | ✅ | ✅ |
| Enviar mensagem | ✅ | ✅ | ✅ | ✅ |
| Usar templates | ✅ | ✅ | ✅ | ✅ |
| Ver todas conversas | ✅ | ✅ | ✅ | ❌ (só atribuídas) |

### Configurações da Organização

| Ação | OWNER | ADMIN | MANAGER | MEMBER |
|------|-------|-------|---------|--------|
| Editar configurações | ✅ | ✅ | ❌ | ❌ |
| Gerenciar plano/faturamento | ✅ | ❌ | ❌ | ❌ |
| Gerenciar membros | ✅ | ✅ | ❌ | ❌ |
| Ver logs/auditoria | ✅ | ✅ | ❌ | ❌ |

### WhatsApp/Instagram (`whatsapp_cloud_instances`)

| Ação | OWNER | ADMIN | MANAGER | MEMBER |
|------|-------|-------|---------|--------|
| Conectar instância | ✅ | ✅ | ❌ | ❌ |
| Editar instância | ✅ | ✅ | ❌ | ❌ |
| Ver templates | ✅ | ✅ | ✅ | ✅ |
| Enviar mensagens | ✅ | ✅ | ✅ | ✅ |

### Tags, Listas, Segmentos

| Ação | OWNER | ADMIN | MANAGER | MEMBER |
|------|-------|-------|---------|--------|
| Visualizar | ✅ | ✅ | ✅ | ✅ |
| Criar | ✅ | ✅ | ✅ | ❌ |
| Editar | ✅ | ✅ | ✅ | ❌ |
| Excluir | ✅ | ✅ | ❌ | ❌ |

---

## Arquitetura de Implementação

### 1. Banco de Dados (RLS)

As políticas RLS da Fase 2 continuam ativas (isolação por organização).
A verificação de roles será feita na aplicação via middleware/helpers.

### 2. Helpers TypeScript

```typescript
// lib/auth/permissions.ts
export function checkPermission(
  userRole: OrganizationRole,
  requiredPermission: Permission
): boolean

export function requirePermission(
  permission: Permission
): Promise<void> // throw se não tem permissão

export function getRoleLevel(role: OrganizationRole): number
```

### 3. Middleware

```typescript
// middleware/permissions.ts
export function withPermission(permission: Permission) {
  return async (handler: Handler) => { ... }
}
```

### 4. Uso nos Endpoints

```typescript
// app/api/contacts/route.ts
export async function DELETE(request: NextRequest) {
  await requirePermission('contacts:delete');
  // ...
}
```

---

## Permissões Definidas

```typescript
type Permission = 
  // Contatos
  | 'contacts:read'
  | 'contacts:create'
  | 'contacts:update'
  | 'contacts:delete'
  | 'contacts:import'
  | 'contacts:export'
  
  // Deals
  | 'deals:read'
  | 'deals:create'
  | 'deals:update'
  | 'deals:delete'
  | 'deals:read_all'
  
  // Mensagens
  | 'messages:read'
  | 'messages:send'
  | 'messages:use_templates'
  
  // Configurações
  | 'settings:read'
  | 'settings:update'
  | 'billing:manage'
  
  // Membros
  | 'members:read'
  | 'members:invite'
  | 'members:update'
  | 'members:remove'
  
  // Instâncias WhatsApp
  | 'instances:connect'
  | 'instances:manage'
  
  // Tags/Listas
  | 'tags:manage'
  | 'lists:manage';
```

---

## Fluxo de Autorização

```
Request → JWT Auth → Extrair org_id + user_id 
  → Buscar role do membro 
    → Verificar permissão 
      → Executar ou Rejeitar (403)
```

---

## Considerações de Segurança

1. **Defense in depth**: RLS (banco) + RBAC (aplicação)
2. **Princípio do menor privilégio**: MEMBER tem acesso mínimo
3. **Verificação em duplicata**: Sempre verificar no backend, nunca confiar no frontend
4. **Auditoria**: Logar ações sensíveis com user_id e timestamp

---

## Próximos Passos

1. Criar helper de permissões (`lib/auth/permissions.ts`)
2. Criar middleware de permissões
3. Atualizar endpoints críticos
4. Testar matriz de permissões
5. Documentar API de permissões
