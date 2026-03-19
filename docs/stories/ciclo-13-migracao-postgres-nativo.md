# CICLO 13 — Migração Supabase Auth → PostgreSQL Nativo

## Branch
`feat/ciclo-13-migracao-postgres-nativo`

## Agentes Responsáveis

| Agente | Papel |
|--------|-------|
| `@architect` | Decisões de arquitetura, validação do padrão de auth |
| `@dev` | Implementação das substituições nos routes de dashboard |
| `@qa` | Validação de build, typecheck, lint e teste de autenticação após cada fase |

## Objetivo

Eliminar a dependência do Supabase Auth do sistema. O Supabase é atualmente usado **apenas como camada de autenticação** em 8 routes de dashboard, enquanto o restante do sistema já opera com autenticação custom via JWT cookie (`nexia_session`). A migração tornará o sistema 100% independente do Supabase, reduzindo latência nas chamadas de dashboard.

## Motivação de Performance

Cada request de dashboard hoje faz uma chamada de rede externa para validar o usuário:

```
Request do browser
  → API Route /api/dashboard/kpis
    → supabase.auth.getUser()  ← chamada HTTP para supa.nexiachat.com.br  [LENTO]
      → supabase.from('users').select('organization_id')  ← 2ª chamada HTTP [LENTO]
        → getKPIs(organizationId)  ← query Prisma no Postgres local [RÁPIDO]
```

Após a migração:

```
Request do browser
  → API Route /api/dashboard/kpis
    → getAuthenticatedUser()  ← verifica cookie JWT local, zero rede [RÁPIDO]
      → getKPIs(organizationId)  ← query Prisma no Postgres local [RÁPIDO]
```

---

## Diagnóstico Arquitetural (@architect)

### Estado Atual: Dois sistemas de auth coexistindo

```
┌─────────────────────────────────────────────────────────────────┐
│                        SISTEMA ATUAL                            │
├─────────────────────────┬───────────────────────────────────────┤
│  Auth Custom (NOVO)     │  Supabase Auth (LEGADO - a remover)   │
│  lib/auth/helpers.ts    │  lib/supabase/server.ts               │
│  lib/auth/session.ts    │  lib/supabase/client.ts               │
│                         │  @supabase/ssr                        │
│  Usado em:              │  @supabase/supabase-js                │
│  - middleware.ts        │                                       │
│  - /api/auth/login      │  Usado em:                            │
│  - /api/auth/me         │  - /api/dashboard/kpis                │
│  - /api/contatos        │  - /api/dashboard/revenue             │
│  - /api/deals           │  - /api/dashboard/funnel              │
│  - etc.                 │  - /api/dashboard/channels            │
│                         │  - /api/dashboard/health-score        │
│                         │  - /api/dashboard/lost-deals          │
│                         │  - /api/dashboard/lost-reasons        │
│                         │  - /api/dashboard/funil-por-etapa     │
└─────────────────────────┴───────────────────────────────────────┘
```

### Estado Desejado: Auth unificada

```
┌─────────────────────────────────────────────────────────────────┐
│                     SISTEMA APÓS MIGRAÇÃO                       │
├─────────────────────────────────────────────────────────────────┤
│  Auth Custom (ÚNICO)                                            │
│  lib/auth/helpers.ts  →  getAuthenticatedUser()                 │
│  lib/auth/session.ts  →  createSession() / verifyToken()        │
│                                                                 │
│  Usado em TODOS os routes protegidos                            │
│  Zero dependência do Supabase no código de aplicação            │
└─────────────────────────────────────────────────────────────────┘
```

### Padrão de Substituição

**DE (padrão legado com Supabase):**
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const cookieStore = await cookies()
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
)

const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

const { data: userData } = await supabase
  .from('users')
  .select('organization_id')
  .eq('id', user.id)
  .single()

const organizationId = userData?.organization_id
```

**PARA (padrão unificado com auth custom):**
```typescript
import { getAuthenticatedUser, AuthError } from '@/lib/auth/helpers'

const user = await getAuthenticatedUser()
// user.organizationId já está disponível no JWT — sem chamada extra ao banco
const organizationId = user.organizationId
```

---

## Escopo da Migração

### Fase 1 — Routes de Dashboard (core)
8 routes com padrão idêntico de substituição:

| Route | Arquivo |
|-------|---------|
| KPIs | `app/api/dashboard/kpis/route.ts` |
| Revenue | `app/api/dashboard/revenue/route.ts` |
| Funnel | `app/api/dashboard/funnel/route.ts` |
| Channels | `app/api/dashboard/channels/route.ts` |
| Health Score | `app/api/dashboard/health-score/route.ts` |
| Lost Deals | `app/api/dashboard/lost-deals/route.ts` |
| Lost Reasons | `app/api/dashboard/lost-reasons/route.ts` |
| Funil por Etapa | `app/api/dashboard/funil-por-etapa/route.ts` |

### Fase 2 — Limpeza de arquivos Supabase
| Ação | Arquivo |
|------|---------|
| Deletar | `lib/supabase/server.ts` |
| Deletar | `lib/supabase/client.ts` |
| Verificar e deletar | `lib/supabase-server.ts` |
| Verificar usos restantes | `app/api/auth/test-supabase/route.ts` (pode ser deletado) |

### Fase 3 — Limpeza de dependências
| Ação | Item |
|------|------|
| Remover de `package.json` | `@supabase/ssr` |
| Remover de `package.json` | `@supabase/supabase-js` |
| Remover de `.env.local` | `NEXT_PUBLIC_SUPABASE_URL` |
| Remover de `.env.local` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Remover de `.env.local` | `SUPABASE_SERVICE_ROLE_KEY` |
| Remover de `.env.local` | `SUPABASE_URL` |
| Remover de `.env.local` | `VITE_SUPABASE_URL` |
| Remover de `.env.local` | `VITE_SUPABASE_ANON_KEY` |

> **Atenção:** Verificar se `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` ainda são referenciados em algum arquivo de cliente antes de remover.

---

## Tasks de Implementação

### Fase 1 — Migrar Routes de Dashboard

- [x] **1.1** Migrar `app/api/dashboard/kpis/route.ts`
  - Remover imports do Supabase
  - Substituir `supabase.auth.getUser()` por `getAuthenticatedUser()`
  - Remover query `supabase.from('users').select('organization_id')`
  - Usar `user.organizationId` diretamente
  - Validar: `organization_id` não nulo antes de chamar `getKPIs()`

- [x] **1.2** Migrar `app/api/dashboard/revenue/route.ts`
  - Mesmo padrão do 1.1

- [x] **1.3** Migrar `app/api/dashboard/funnel/route.ts`
  - Mesmo padrão do 1.1

- [x] **1.4** Migrar `app/api/dashboard/channels/route.ts`
  - Mesmo padrão do 1.1

- [x] **1.5** Migrar `app/api/dashboard/health-score/route.ts`
  - Mesmo padrão do 1.1

- [x] **1.6** Migrar `app/api/dashboard/lost-deals/route.ts`
  - Mesmo padrão do 1.1

- [x] **1.7** Migrar `app/api/dashboard/lost-reasons/route.ts`
  - Mesmo padrão do 1.1

- [x] **1.8** Migrar `app/api/dashboard/funil-por-etapa/route.ts`
  - Este usa `createClient()` de `lib/supabase/server.ts`
  - Substituir pelo padrão unificado

- [x] **1.9** Validacao da Fase 1
  - `npm run typecheck` sem erros relacionados ao Supabase (erros pré-existentes em billing/ai-insights são irrelevantes)

### Fase 2 — Limpeza de Arquivos Supabase

- [x] **2.1** Deletar `lib/supabase/server.ts` (zero consumidores após migração)
- [x] **2.2** Deletar `lib/supabase/client.ts` (zero consumidores após migração)
- [x] **2.3** Deletar `lib/supabase-server.ts` (zero consumidores após migração)
- [x] **2.4** Deletar `app/api/auth/test-supabase/route.ts` (route de debug)
- [x] **2.5** Atualizar 7 testes de dashboard: remover mocks de `@supabase/ssr`, adicionar mock de `getAuthenticatedUser` de `@/lib/auth/helpers`
- [x] **2.6** Remover `/api/auth/test-supabase` da lista PUBLIC_PATHS do `middleware.ts`

### Fase 3 — Limpeza de Dependências

- [x] **3.1** Remover `@supabase/ssr` e `@supabase/supabase-js` do `package.json` e `pnpm-lock.yaml`
- [x] **3.2** Limpar variáveis de ambiente Supabase do `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- [x] **3.3** Atualizar `.env.production.example` removendo variáveis Supabase
- [ ] **3.4** Validacao Final
  - `npm run build` completo sem erros
  - Testar login e carregamento do dashboard localmente

---

## Criterios de Aceite

- [x] Nenhum import de `@supabase/ssr` ou `@supabase/supabase-js` no codebase de aplicação (apenas `scripts/validate-implementation.ts`, fora de escopo)
- [x] Todos os routes de dashboard autenticam via `getAuthenticatedUser()` do `lib/auth/helpers.ts`
- [x] `organizationId` é lido do JWT — sem consulta extra ao banco para obtê-lo
- [x] Variáveis `NEXT_PUBLIC_SUPABASE_*` removidas do ambiente
- [ ] Build de produção passa sem erros
- [ ] Login e sessão funcionam corretamente (validação manual)

---

## Riscos e Mitigacoes

| Risco | Probabilidade | Mitigacao |
|-------|---------------|-----------|
| Algum componente de frontend usa `supabase.auth` diretamente | Baixa | Grep por `@supabase` antes de remover os pacotes |
| `organizationId` nulo no JWT de sessões antigas | Média | Forcar re-login: ao migrar, invalidar sessões existentes ou tratar `null` graciosamente |
| Algum route fora do dashboard ainda usa Supabase | Baixa | Verificar `lib/supabase-server.ts` e demais arquivos listados |

---

## Lista de Arquivos

### Modificados
- `app/api/dashboard/kpis/route.ts`
- `app/api/dashboard/revenue/route.ts`
- `app/api/dashboard/funnel/route.ts`
- `app/api/dashboard/channels/route.ts`
- `app/api/dashboard/health-score/route.ts`
- `app/api/dashboard/lost-deals/route.ts`
- `app/api/dashboard/lost-reasons/route.ts`
- `app/api/dashboard/funil-por-etapa/route.ts`
- `package.json`
- `pnpm-lock.yaml`
- `.env.local`
- `.env.local.example`
- `.env.production.example`

### Deletados
- `lib/supabase/server.ts`
- `lib/supabase/client.ts`
- `lib/supabase-server.ts` (verificar antes)
- `app/api/auth/test-supabase/route.ts` (verificar antes)

---

*Plano criado por @architect (Aria) — 2026-03-19*
*— Aria, arquitetando o futuro*
