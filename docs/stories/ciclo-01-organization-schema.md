# CICLO 1 — Multi-tenancy Foundation

**Branch:** `feat/ciclo-01-organization-schema`
**Entregável:** Modelos `Organization`, `OrganizationMember`, `OrganizationUnit` e `User` no banco, sem quebrar nada existente

---

## Resumo

Este ciclo estabelece a fundação de multi-tenancy do sistema, permitindo que um usuário pertença a múltiplas organizações com diferentes roles em cada uma.

## Schema Adicionado

### Organization
- `id`: String @id @default(uuid())
- `name`: String
- `slug`: String @unique
- `ownerId`: String → User.id
- `logoUrl`: String?
- `featureFlags`: Json? (JSON flexível para habilitar features)
- `settings`: Json? (configurações da org)
- `status`: OrganizationStatus @default(ACTIVE)
- Timestamps: `createdAt`, `updatedAt`

### OrganizationMember
- `id`: String @id @default(uuid())
- `organizationId` → Organization.id
- `userId` → User.id
- `role`: OrganizationRole @default(MEMBER)
- `status`: MemberStatus @default(ACTIVE)
- `joinedAt`: DateTime
- Timestamps: `createdAt`, `updatedAt`
- @@unique([organizationId, userId])

### OrganizationUnit (Unidades/Filiais)
- `id`: String @id @default(uuid())
- `organizationId` → Organization.id
- `name`: String
- `slug`: String
- `isDefault`: Boolean @default(false)
- `settings`: Json?
- Timestamps: `createdAt`, `updatedAt`
- @@unique([organizationId, slug])

### User (Atualizado)
- Mantém: `id`, `email` @unique, `name`, `avatarUrl`
- Adiciona relações:
  - `ownedOrganizations`: Organization[]
  - `memberships`: OrganizationMember[]
- Remove temporariamente: relação `whatsappAccounts` (migrado para organization_id no CICLO 2)

## Enums Adicionados

```prisma
enum OrganizationStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

enum OrganizationRole {
  OWNER
  ADMIN
  MANAGER
  MEMBER
}

enum MemberStatus {
  ACTIVE
  INACTIVE
  PENDING
}
```

## Relacionamentos

```
User 1:N Organization (como owner)
User 1:N OrganizationMember
Organization 1:N OrganizationMember
Organization 1:N OrganizationUnit
Organization N:N User (via OrganizationMember)
```

## Critérios de Aceite

- [x] Migration roda sem erro
- [x] `npx prisma generate` sem erros
- [x] Build do Next.js passa
- [x] Nenhuma página existente quebra
- [x] Usuário pode pertencer a múltiplas orgs com roles diferentes

## Validação PO

✅ **Aprovado**: O schema permite que um usuário tenha roles diferentes em diferentes organizações (ex: OWNER na Org A, MEMBER na Org B).

## Decisões Arquiteturais

1. **Soft delete via status**: Organizações e memberships usam status em vez de delete físico
2. **Feature flags em JSON**: Permite flexibilidade sem migrations frequentes
3. **OrganizationUnit separado**: Permite múltiplas filiais/unidades por organização
4. **Slug único por org**: Permite URLs organizadas tipo `/org/slug/...`

## Próximos Passos

- CICLO 2: Adicionar `organization_id` aos models WhatsApp
- Implementar middleware de contexto de organização nas API routes
- Criar UI de switch entre organizações
