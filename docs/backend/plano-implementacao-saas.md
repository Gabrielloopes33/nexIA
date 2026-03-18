# Plano de Implementação Backend — Synkra CRM SaaS

> **Data:** 2026-03-18
> **Contexto:** Migração concluída de Supabase Cloud → Supabase self-hosted (VPS `49.13.228.89:8000`).
> **Objetivo:** Estabilizar a base multi-tenant, resolver inconsistências da migração e escalar o CRM para múltiplos clientes (empresas).

---

## Diagnóstico Atual

### Problemas identificados na migração Cloud → VPS

| Problema | Causa-raiz | Impacto |
|---|---|---|
| `users.organization_id` existe fisicamente no DB mas não no schema Prisma | Coluna legada do Cloud não foi modelada no Prisma | API `/api/organization/me` não consegue ler via ORM |
| RLS não configurado no self-hosted | Supabase Cloud tinha RLS; no VPS não foi reconfigurado | Qualquer cliente `supabaseClient` (anon key) pode ler qualquer linha |
| Dois sistemas de auth coexistindo | `nexia_session` (HMAC cookie) + Supabase Auth JWT | Organization context não sabe qual auth está ativo |
| Soft-delete bloqueia re-criação de contato | Unique constraint `(organization_id, phone)` retém registros com `deleted_at` | 409 Conflict ao tentar criar contato "novo" |
| `organizationId` null no frontend | Context carregava via Supabase client-side (RLS bloqueava 406) | Formulários ficavam desabilitados ou usavam org errada |

---

## Arquitetura Alvo (Multi-tenant SaaS)

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                   │
│   OrganizationContext ─→ /api/organization/me           │
│   Auth: Supabase Auth JWT (único sistema alvo)          │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│              API Routes (Next.js App Router)             │
│   Toda rota lê organizationId do JWT (não do body)      │
│   supabaseServer (service role) para todas as queries   │
└────────────┬───────────────────────┬────────────────────┘
             │                       │
┌────────────▼────────┐   ┌──────────▼──────────────────┐
│  Supabase VPS       │   │  Prisma ORM                  │
│  Auth + Storage     │   │  (schema fonte da verdade)   │
│  RLS para isolação  │   │  migrations versionadas      │
└─────────────────────┘   └──────────────────────────────┘
```

### Modelo de dados multi-tenant

```
Organization (1) ──→ (N) OrganizationMember ←── User (1)
Organization (1) ──→ (N) Contact
Organization (1) ──→ (N) Lead / Deal
Organization (1) ──→ (N) Pipeline / Stage
Organization (1) ──→ (1) Subscription (Stripe)
```

---

## Fases de Implementação

---

## Fase 0 — Diagnóstico e Reconciliação da Migração

**Agente responsável:** `@analyst` + `@dev`
**Prioridade:** CRÍTICA — deve ser feita antes de qualquer nova feature

### Tarefas

#### 0.1 — Mapear divergências entre Prisma schema e DB real

```bash
# Listar todas as tabelas no banco VPS
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

# Comparar com o prisma schema
npx prisma db pull --schema=prisma/schema-snapshot.prisma
```

**Arquivo de saída:** `docs/backend/divergencias-schema.md`
Listar: colunas no DB que não estão no Prisma, tabelas órfãs, constraints.

#### 0.2 — Verificar coluna `users.organization_id`

```sql
-- No Supabase VPS (SQL Editor)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'organization_id';
```

Se existir → adicionar ao `prisma/schema.prisma`:
```prisma
model User {
  // ...
  organizationId String? @map("organization_id")
  organization   Organization? @relation(fields: [organizationId], references: [id])
}
```

#### 0.3 — Auditar usuários sem OrganizationMember

```sql
SELECT u.id, u.email, u.organization_id
FROM auth.users u
LEFT JOIN public."OrganizationMember" om ON om."userId" = u.id
WHERE om.id IS NULL;
```

Para cada usuário órfão: criar `OrganizationMember` com a org do `organization_id` legado.

**Script:** `scripts/migrate-org-members.ts`

#### 0.4 — Verificar RLS atual

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

Documentar quais tabelas têm RLS ativo e quais não têm.

### Critério de aceite (`@po`)
- [ ] Documento `divergencias-schema.md` gerado com todas as discrepâncias
- [ ] Todos os usuários têm pelo menos um `OrganizationMember`
- [ ] Prisma schema sincronizado com o estado real do banco VPS

### Ciclo de testes (`@qa`)
```bash
# Verificar que migrations aplicam sem erro
npx prisma migrate deploy

# Verificar que todos os usuários têm org
npx tsx scripts/validate-org-members.ts

# Typecheck
npm run typecheck
```

---

## Fase 1 — Fundação Auth + Organization

**Agente responsável:** `@dev` + `@architect`
**Depende de:** Fase 0 concluída

### Objetivo
Unificar auth em Supabase Auth JWT. Remover sistema `nexia_session` (HMAC cookie). Garantir que `organizationId` sempre vem do JWT, nunca do body da request.

### Tarefas

#### 1.1 — Unificar sistema de autenticação

**Problema:** Dois sistemas coexistem — `nexia_session` (HMAC) e Supabase Auth JWT.
**Decisão:** Usar **Supabase Auth JWT** como único sistema.

**Arquivos afetados:**
- `lib/auth.ts` — remover lógica HMAC, usar `supabaseServer.auth.getUser()`
- `middleware.ts` — verificar JWT Supabase, não cookie customizado
- `app/api/auth/login/route.ts` — usar `supabase.auth.signInWithPassword()`
- `app/api/auth/logout/route.ts` — usar `supabase.auth.signOut()`

**Padrão de autenticação em todas as APIs:**
```typescript
// lib/auth-helpers.ts
export async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
    ?? request.cookies.get('sb-access-token')?.value

  if (!token) throw new AuthError('Não autenticado', 401)

  const { data: { user }, error } = await supabaseServer.auth.getUser(token)
  if (error || !user) throw new AuthError('Token inválido', 401)

  return user
}
```

#### 1.2 — organizationId sempre vem do JWT, nunca do body

**Regra:** Nenhuma API deve aceitar `organizationId` do request body. Deve ser lido do usuário autenticado.

```typescript
// lib/org-helpers.ts
export async function getOrganizationId(userId: string): Promise<string> {
  const { data: member } = await supabaseServer
    .from('OrganizationMember')
    .select('organizationId')
    .eq('userId', userId)
    .single()

  if (!member?.organizationId) {
    throw new Error('Usuário não pertence a nenhuma organização')
  }

  return member.organizationId
}
```

**Arquivos a refatorar:**
- `app/api/contacts/route.ts` — remover `organizationId` do body
- `app/api/leads/route.ts`
- `app/api/dashboard/kpis/route.ts`
- Todos os outros endpoints que recebem `organizationId` externamente

#### 1.3 — OrganizationContext usa o JWT

```typescript
// lib/contexts/organization-context.tsx
// Já foi corrigido para usar /api/organization/me
// Garantir que refetch acontece quando auth state muda
```

#### 1.4 — API de registro (`/api/auth/register`)

**Arquivo:** `app/api/auth/register/route.ts`

```typescript
// Fluxo:
// 1. Criar usuário no Supabase Auth
// 2. Criar Organization com nome da empresa
// 3. Criar OrganizationMember com role OWNER
// 4. Criar Subscription (trial 14 dias)
// 5. Retornar usuário + token
```

**Schema Prisma adicional:**
```prisma
model Subscription {
  id             String   @id @default(cuid())
  organizationId String   @unique
  organization   Organization @relation(fields: [organizationId], references: [id])
  plan           Plan     @default(TRIAL)
  status         SubscriptionStatus @default(ACTIVE)
  trialEndsAt    DateTime?
  stripeCustomerId String?
  stripePriceId   String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

enum Plan {
  TRIAL
  STARTER
  PRO
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELLED
  EXPIRED
}
```

### Critério de aceite (`@po`)
- [ ] Login/logout funcionam exclusivamente via Supabase Auth
- [ ] Nenhum endpoint aceita `organizationId` do body (auditoria completa)
- [ ] Novo usuário registrado automaticamente recebe org + subscription trial
- [ ] `OrganizationContext` sempre reflete o estado atual do auth

### Ciclo de testes (`@qa`)
```bash
# Lint + typecheck
npm run lint && npm run typecheck

# Testes de API (via curl ou Playwright)
# 1. Login com credenciais inválidas → 401
# 2. Login com credenciais válidas → token JWT
# 3. Acessar /api/contacts sem token → 401
# 4. Acessar /api/contacts com token → 200 com dados da org correta
# 5. Registrar novo usuário → org criada, member criado, trial criado

# Build de validação
npm run build
```

---

## Fase 2 — Segurança Multi-tenant (RLS)

**Agente responsável:** `@dev` + `@architect`
**Depende de:** Fase 1 concluída

### Objetivo
Configurar Row Level Security no Supabase VPS para garantir isolação de dados entre organizações mesmo se uma API não filtrar por `organization_id`.

### Tarefas

#### 2.1 — Habilitar RLS em todas as tabelas de dados

```sql
-- migrations/20260318_enable_rls.sql

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pipeline" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Stage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Deal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Activity" ENABLE ROW LEVEL SECURITY;

-- Organizations: cada user só vê a própria org
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON organizations
  FOR ALL USING (
    id IN (
      SELECT "organizationId" FROM "OrganizationMember"
      WHERE "userId" = auth.uid()
    )
  );

-- Contacts: só da própria org
CREATE POLICY "contacts_org_isolation" ON contacts
  FOR ALL USING (
    organization_id IN (
      SELECT "organizationId" FROM "OrganizationMember"
      WHERE "userId" = auth.uid()
    )
  );
```

**Nota importante:** `supabaseServer` (service role) bypass RLS — usar para operações administrativas. `supabaseClient` (anon/user token) respeita RLS.

#### 2.2 — Remover fallback de "primeira organização"

Os endpoints que tinham lógica de buscar "qualquer org existente" como fallback devem ser removidos. A Fase 1 garante que todo request autenticado tem `organizationId`.

```typescript
// REMOVER este padrão:
if (!organizationId || organizationId === 'default_org_id') {
  const { data: existingOrg } = await supabaseServer
    .from('organizations')
    .select('id')
    .limit(1)
    .single()
}
```

#### 2.3 — Middleware de autorização

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  // Rotas de API protegidas
  if (request.nextUrl.pathname.startsWith('/api/') &&
      !isPublicRoute(request.nextUrl.pathname)) {
    const token = extractToken(request)
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    // Verificar token no Supabase
    const { data: { user } } = await supabaseServer.auth.getUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }
  }
}

const PUBLIC_ROUTES = ['/api/auth/login', '/api/auth/register', '/api/webhooks']
```

### Critério de aceite (`@po`)
- [ ] RLS ativo em todas as tabelas com dados de clientes
- [ ] Usuário A não consegue acessar dados da Org B via API (teste de isolação)
- [ ] service role (backend) ainda funciona normalmente
- [ ] Zero falhas de `406 Not Acceptable` no console do browser

### Ciclo de testes (`@qa`)
```bash
# Teste de isolação (script)
# 1. Criar usuário User_A na Org_A
# 2. Criar usuário User_B na Org_B
# 3. Criar contato na Org_A
# 4. Autenticar como User_B e tentar listar contatos
# 5. Verificar que resposta é [] (lista vazia, não erro)

npm run lint && npm run typecheck && npm run build
```

---

## Fase 3 — Onboarding e Criação de Organização

**Agente responsável:** `@dev` + `@ux-design-expert`
**Depende de:** Fase 1 concluída

### Objetivo
Fluxo completo de auto-cadastro: empresa se registra, recebe organização, inicia trial.

### Tarefas

#### 3.1 — Tela de registro

**Arquivo:** `app/(auth)/register/page.tsx`

Campos:
- Nome completo
- Email
- Senha
- Nome da empresa
- Telefone (opcional)

**Fluxo:**
```
Register page → POST /api/auth/register
  → supabase.auth.signUp()
  → prisma.organization.create()
  → prisma.organizationMember.create({ role: 'OWNER' })
  → prisma.subscription.create({ plan: 'TRIAL', trialEndsAt: +14d })
  → redirect /dashboard
```

#### 3.2 — Convite de membros

**Arquivo:** `app/api/organizations/[id]/invites/route.ts`

```typescript
// POST /api/organizations/:id/invites
// Body: { email, role }
// 1. Verificar que caller é OWNER ou ADMIN
// 2. Enviar email via Supabase Auth invite
// 3. Registrar convite pendente em InviteToken table
```

**Schema:**
```prisma
model InviteToken {
  id             String   @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  email          String
  role           MemberRole
  token          String   @unique @default(cuid())
  expiresAt      DateTime
  acceptedAt     DateTime?
  createdAt      DateTime @default(now())
}
```

#### 3.3 — Aceitar convite

**Arquivo:** `app/(auth)/invite/[token]/page.tsx`

```
/invite/[token]
  → GET /api/invites/[token] (valida token, retorna org info)
  → Usuário cria conta ou loga
  → POST /api/invites/[token]/accept
  → OrganizationMember criado com role do convite
```

#### 3.4 — Troca de organização (multi-org)

Para usuários que pertencem a múltiplas organizações:

```typescript
// lib/contexts/organization-context.tsx
// Adicionar: switchOrganization(orgId: string)
// Salvar orgId ativa no localStorage ou cookie
// Todos os hooks usam a org ativa
```

### Critério de aceite (`@po`)
- [ ] Novo usuário consegue se registrar sem intervenção manual
- [ ] Trial de 14 dias criado automaticamente
- [ ] Admin pode convidar membros via email
- [ ] Membro convidado consegue aceitar e acessar a org

### Ciclo de testes (`@qa`)
```bash
# E2E (Playwright)
# 1. Acessar /register, preencher form, submeter
# 2. Verificar redirecionamento para /dashboard
# 3. Verificar que org existe no banco
# 4. Verificar que subscription trial foi criada
# 5. Convidar membro via /settings/team
# 6. Aceitar convite via email link
# 7. Verificar acesso do novo membro

npm run lint && npm run typecheck && npm run build
```

---

## Fase 4 — Billing com Stripe

**Agente responsável:** `@dev`
**Depende de:** Fase 3 concluída

### Objetivo
Integração completa com Stripe para upgrades de plano, cobrança recorrente e limites por plano.

### Tarefas

#### 4.1 — Produtos e preços no Stripe

Criar no Stripe Dashboard:
- **STARTER:** R$ 97/mês — até 1.000 contatos, 3 usuários
- **PRO:** R$ 297/mês — até 10.000 contatos, 10 usuários
- **ENTERPRISE:** R$ 997/mês — ilimitado, SSO, API dedicada

#### 4.2 — Checkout Stripe

**Arquivo:** `app/api/billing/checkout/route.ts`

```typescript
// POST /api/billing/checkout
// Body: { priceId }
// 1. Verificar auth + organizationId
// 2. Criar/recuperar Stripe Customer
// 3. Criar Checkout Session
// 4. Retornar URL do checkout
const session = await stripe.checkout.sessions.create({
  customer: stripeCustomerId,
  line_items: [{ price: priceId, quantity: 1 }],
  mode: 'subscription',
  success_url: `${baseUrl}/settings/billing?success=true`,
  cancel_url: `${baseUrl}/settings/billing`,
  metadata: { organizationId },
})
```

#### 4.3 — Webhook Stripe

**Arquivo:** `app/api/webhooks/stripe/route.ts`

Eventos a tratar:
- `checkout.session.completed` → atualizar Subscription para plano escolhido
- `invoice.payment_succeeded` → marcar como ACTIVE
- `invoice.payment_failed` → marcar como PAST_DUE, notificar admin
- `customer.subscription.deleted` → marcar como CANCELLED

```typescript
// Persistir no banco:
await prisma.subscription.update({
  where: { organizationId },
  data: {
    plan: mapStripePriceToPlan(priceId),
    status: 'ACTIVE',
    stripeCustomerId,
    stripePriceId: priceId,
    trialEndsAt: null,
  }
})
```

#### 4.4 — Limites por plano

**Arquivo:** `lib/plan-limits.ts`

```typescript
export const PLAN_LIMITS = {
  TRIAL:      { contacts: 100,    users: 2,  pipelines: 1 },
  STARTER:    { contacts: 1000,   users: 3,  pipelines: 3 },
  PRO:        { contacts: 10000,  users: 10, pipelines: 10 },
  ENTERPRISE: { contacts: -1,     users: -1, pipelines: -1 }, // -1 = ilimitado
}

export async function checkLimit(
  organizationId: string,
  resource: 'contacts' | 'users' | 'pipelines'
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId }
  })
  const limit = PLAN_LIMITS[subscription?.plan ?? 'TRIAL'][resource]
  // contar recurso atual...
}
```

Aplicar em:
- `POST /api/contacts` → verificar limite de contatos
- `POST /api/organizations/:id/invites` → verificar limite de usuários

### Critério de aceite (`@po`)
- [ ] Trial expira após 14 dias (acesso bloqueado graciosamente)
- [ ] Upgrade via Stripe funciona end-to-end
- [ ] Webhook processa eventos e atualiza banco corretamente
- [ ] Limite de contatos bloqueia inserção com mensagem clara

### Ciclo de testes (`@qa`)
```bash
# Testar webhook com Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Simular eventos
stripe trigger checkout.session.completed
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.deleted

# Verificar que banco foi atualizado corretamente
# Verificar que limite de contatos funciona (TRIAL: 100 max)

npm run lint && npm run typecheck && npm run build
```

---

## Fase 5 — Painel Administrativo (Super Admin)

**Agente responsável:** `@dev` + `@pm`
**Depende de:** Fases 1-4 concluídas

### Objetivo
Interface para o administrador do SaaS (você) gerenciar todas as organizações clientes.

### Tarefas

#### 5.1 — Schema de Super Admin

```prisma
model AdminUser {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
}
```

#### 5.2 — Rota protegida por super admin

**Arquivo:** `app/admin/layout.tsx`

```typescript
// Verificar que user tem AdminUser record
// Redirecionar para /dashboard se não for admin
```

#### 5.3 — Dashboard admin

**Arquivo:** `app/admin/page.tsx`

Métricas globais:
- Total de organizações (ativas, trial, canceladas)
- MRR (Monthly Recurring Revenue) — dados do Stripe
- Total de contatos no sistema
- Organizações criadas nos últimos 30 dias

#### 5.4 — Lista de organizações

**Arquivo:** `app/admin/organizations/page.tsx`

Tabela com:
- Nome, plano atual, status, data de criação
- Número de usuários, contatos
- Ações: ver detalhes, suspender, alterar plano manualmente

#### 5.5 — APIs admin

**Arquivos:**
- `app/api/admin/organizations/route.ts` — listar todas as orgs
- `app/api/admin/organizations/[id]/route.ts` — detalhes + ações
- `app/api/admin/metrics/route.ts` — métricas globais

```typescript
// Verificar super admin em todas as rotas admin
async function requireSuperAdmin(request: NextRequest) {
  const user = await getAuthenticatedUser(request)
  const adminRecord = await prisma.adminUser.findUnique({
    where: { userId: user.id }
  })
  if (!adminRecord) throw new AuthError('Acesso negado', 403)
  return user
}
```

### Critério de aceite (`@po`)
- [ ] Super admin consegue ver todas as organizações
- [ ] MRR calculado e exibido corretamente
- [ ] Admin consegue suspender uma organização
- [ ] Acesso à rota /admin bloqueado para usuários comuns

### Ciclo de testes (`@qa`)
```bash
# 1. Acessar /admin sem ser super admin → redirect
# 2. Acessar /admin como super admin → lista de orgs
# 3. Verificar que métricas batem com dados do banco
# 4. Suspender org → usuários da org não conseguem logar

npm run lint && npm run typecheck && npm run build
```

---

## Roadmap de Execução

| Fase | Duração estimada | Agentes | Prioridade |
|------|-----------------|---------|-----------|
| 0 — Diagnóstico | 1 sprint | @analyst, @dev | CRÍTICA |
| 1 — Auth + Org | 2 sprints | @dev, @architect | ALTA |
| 2 — RLS/Segurança | 1 sprint | @dev, @architect | ALTA |
| 3 — Onboarding | 2 sprints | @dev, @ux-design-expert | MÉDIA |
| 4 — Billing | 2 sprints | @dev | MÉDIA |
| 5 — Admin Panel | 1 sprint | @dev, @pm | BAIXA |

---

## Comandos de Build e Validação

### Validação contínua (rodar após cada fase)

```bash
# 1. Typecheck
npm run typecheck

# 2. Linting
npm run lint

# 3. Build de produção
npm run build

# 4. Verificar schema Prisma
npx prisma validate
npx prisma generate

# 5. Aplicar migrations
npx prisma migrate deploy
```

### Checklist de validação por fase

```bash
# Fase 0
npx prisma db pull && npx prisma validate
npx tsx scripts/validate-org-members.ts

# Fase 1
curl -X POST /api/auth/register -d '{"email":"test@test.com","password":"123456","companyName":"Test Corp"}'
curl -X GET /api/contacts -H "Authorization: Bearer TOKEN"
# Sem token → 401
# Com token → 200 com dados da org do usuário

# Fase 2
# Login como User_A, criar contato
# Login como User_B, listar contatos → lista vazia

# Fase 3
# E2E completo de registro + convite

# Fase 4
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed

# Fase 5
# Acessar /admin como super admin
# Verificar métricas globais
```

---

## Decisões Técnicas e Padrões

### 1. Service role vs anon key
- **`supabaseServer` (service role):** Usar em todas as APIs Next.js. Bypass RLS. Operações administrativas.
- **`supabaseClient` (anon/user key):** Usar apenas no frontend para auth state (onAuthStateChange). NÃO para queries de dados.

### 2. organizationId nunca vem do body
- Qualquer API que receba organizationId do request body é uma vulnerabilidade de elevação de privilégio.
- O organizationId deve sempre vir do JWT do usuário autenticado via `getOrganizationId(userId)`.

### 3. Prisma como fonte da verdade do schema
- Toda mudança de schema → migration Prisma → executar `prisma migrate deploy`.
- Nunca alterar o banco diretamente sem criar a migration correspondente.

### 4. Soft-delete com unique constraint
- Ao criar um recurso com unique constraint, sempre verificar `deleted_at` antes de inserir.
- Se existir com `deleted_at`, restaurar em vez de criar novo.

### 5. Number() para coerção segura de números
- Dados vindos do banco via JSON podem ser strings. Usar sempre `Number(v) || 0` em vez de `v ?? 0` antes de `.toFixed()`.

---

## Referências

- `docs/PLANO_MIGRACAO_SUPABASE_SELFHOSTED.md` — contexto da migração Cloud→VPS
- `docs/architecture/` — diagramas de arquitetura
- `prisma/schema.prisma` — schema atual do banco
- `lib/supabase-server.ts` — cliente com service role
- `lib/contexts/organization-context.tsx` — contexto de organização frontend
- `app/api/organization/me/route.ts` — endpoint de organização do usuário logado
