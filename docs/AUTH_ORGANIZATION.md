# Autenticação e Organização

Este documento descreve como funciona a autenticação e o gerenciamento de organizações no sistema.

## 🏗️ Arquitetura

### 1. Fluxo de Autenticação

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Supabase Auth │────▶│  public.users    │────▶│  organizations  │
│   (auth.users)  │     │  (user data)     │     │  (org data)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                        │
        │                        │                        │
        ▼                        ▼                        ▼
   JWT Token              organization_id            name, plan,
   (user id)              (relation)                status, etc.
```

### 2. Contextos

#### OrganizationContext

Local: `lib/contexts/organization-context.tsx`

Fornece:
- `organization`: Dados da organização atual
- `isLoading`: Estado de carregamento
- `error`: Erros de autenticação/busca
- `refreshOrganization()`: Recarrega os dados

#### Uso nos Hooks

Os hooks (`useContacts`, `useTags`, `useLists`) automaticamente usam o `organizationId` do contexto quando não é passado explicitamente:

```typescript
// Com organizationId do contexto (recomendado)
const { contacts } = useContacts()

// Com organizationId explícito (quando necessário)
const { contacts } = useContacts(specificOrgId)
```

## 🚀 Como Implementar

### Passo 1: Adicionar Provider no Layout

```tsx
// app/layout.tsx ou app/(app)/layout.tsx
import { OrganizationProviderWrapper } from "@/components/providers/organization-provider-wrapper"

export default function RootLayout({ children }) {
  return (
    <OrganizationProviderWrapper>
      {children}
    </OrganizationProviderWrapper>
  )
}
```

### Passo 2: Usar nos Componentes

#### Opção A: Usar hook diretamente (sem organizationId)
```tsx
// O hook pega automaticamente do contexto
const { contacts, isLoading } = useContacts()
```

#### Opção B: Usar organization do contexto explicitamente
```tsx
import { useOrganization } from "@/lib/contexts/organization-context"

export default function MyComponent() {
  const { organization, isLoading, error } = useOrganization()
  
  if (isLoading) return <Loading />
  if (error) return <Error message={error.message} />
  if (!organization) return <NotFound />
  
  return (
    <div>
      <h1>{organization.name}</h1>
      <p>Plano: {organization.plan}</p>
    </div>
  )
}
```

#### Opção C: Pegar apenas o ID
```tsx
import { useOrganizationId } from "@/lib/contexts/organization-context"

export default function MyComponent() {
  const orgId = useOrganizationId()
  
  // orgId pode ser null enquanto carrega
  if (!orgId) return <Loading />
  
  return <div>Org ID: {orgId}</div>
}
```

## 🔄 Migração de TEMP_ORGANIZATION_ID

### Antes:
```tsx
const TEMP_ORGANIZATION_ID = "temp-org-id"

export default function Page() {
  const { contacts } = useContacts(TEMP_ORGANIZATION_ID)
  // ...
}
```

### Depois:
```tsx
import { useOrganization } from "@/lib/contexts/organization-context"

export default function Page() {
  const { organization, isLoading: isLoadingOrg } = useOrganization()
  
  // Opcional: passar explicitamente ou deixar o hook usar o contexto
  const { contacts, isLoading } = useContacts(organization?.id)
  
  if (isLoadingOrg || isLoading) return <Loading />
  if (!organization) return <Error message="Organização não encontrada" />
  
  // ...
}
```

Ou ainda mais simples (recomendado):
```tsx
export default function Page() {
  // Hook automaticamente usa organizationId do contexto
  const { contacts, isLoading } = useContacts()
  
  if (isLoading) return <Loading />
  
  // ...
}
```

## ⚠️ Estados de Erro

### Usuário Não Autenticado
```tsx
const { organization, error } = useOrganization()

if (error?.message === "Usuário não autenticado") {
  // Redirecionar para login
  router.push("/login")
}
```

### Organização Não Encontrada
```tsx
if (error?.message === "Organização não encontrada para o usuário") {
  // Redirecionar para onboarding/criar organização
  router.push("/onboarding")
}
```

## 📝 Notas Técnicas

1. **Multi-tenancy**: Todas as APIs filtram por `organization_id` automaticamente
2. **Soft Delete**: Contatos têm `deleted_at` para exclusão lógica
3. **Real-time**: O contexto atualiza quando o estado de auth muda
4. **Cache**: Considere adicionar SWR/React Query para cache avançado

## 🔐 Segurança

- O `organizationId` é sempre obtido do servidor (via JWT) para evitar spoofing
- APIs verificam se o usuário pertence à organização solicitada
- Dados de outras organizações nunca são retornados (RLS no Supabase)
