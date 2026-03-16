# Diagrama da Arquitetura

## Visão Geral

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DASHBOARD PAGE                                  │
│                         (Next.js Server Component)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  HydrationBoundary (dehydrate/hydrate)                              │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  DashboardProvider (Context - Apenas Filtros)               │   │   │
│  │  │  • period: '7d' | '30d' | '90d'                              │   │   │
│  │  │  • dateRange: { startDate, endDate }                         │   │   │
│  │  │  • selectedUsers: string[]                                   │   │   │
│  │  │  • refreshTrigger: number                                    │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                              │                                      │   │
│  │                              ▼                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  DashboardContent                                           │   │   │
│  │  │                                                             │   │   │
│  │  │   ┌───────────────────────────────────────────────────┐    │   │   │
│  │  │   │  DashboardGrid                                    │    │   │   │
│  │  │   │  ┌──────────┬────────────────────────────────┐   │    │   │   │
│  │  │   │  │          │                                │   │    │   │   │
│  │  │   │  │  KPIDock │    DashboardRow (grid-cols-2)  │   │    │   │   │
│  │  │   │  │          │   ┌──────────┬──────────┐      │   │    │   │   │
│  │  │   │  │ ┌──────┐ │   │          │          │      │   │    │   │   │
│  │  │   │  │ │ KPI1 │ │   │  Card 1  │  Card 2  │      │   │    │   │   │
│  │  │   │  │ ├──────┤ │   │ useQuery │ useQuery │      │   │    │   │   │
│  │  │   │  │ │ KPI2 │ │   │          │          │      │   │    │   │   │
│  │  │   │  │ ├──────┤ │   ├──────────┼──────────┤      │   │    │   │   │
│  │  │   │  │ │ KPI3 │ │   │          │          │      │   │    │   │   │
│  │  │   │  │ ├──────┤ │   │  Card 3  │  Card 4  │      │   │    │   │   │
│  │  │   │  │ │ KPI4 │ │   │ useQuery │ useQuery │      │   │    │   │   │
│  │  │   │  │ └──────┘ │   │          │          │      │   │    │   │   │
│  │  │   │  │          │   └──────────┴──────────┘      │   │    │   │   │
│  │  │   │  └──────────┴────────────────────────────────┘   │    │   │   │
│  │  │   └───────────────────────────────────────────────────┘    │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

                                    │
                                    │ (Cada card independente)
                                    ▼

┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW POR CARD                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Card: FunilPorEtapa                                                   │ │
│  │                                                                        │ │
│  │   ┌──────────────┐         ┌──────────────────┐         ┌──────────┐  │ │
│  │   │              │  key    │                  │  fetch  │          │  │ │
│  │   │ useDashboard │───────▶│  React Query     │───────▶ │   API    │  │ │
│  │   │   Query      │         │  Cache           │         │  Route   │  │ │
│  │   │              │◀────────│                  │◀────────│          │  │ │
│  │   └──────────────┘  data   └──────────────────┘  json   └──────────┘  │ │
│  │          │                                                             │ │
│  │          ▼                                                             │ │
│  │   ┌──────────────┐                                                     │ │
│  │   │ DashboardCard│  ◄── Container com Skeleton/Error/Empty states      │ │
│  │   │   Container  │                                                     │ │
│  │   └──────────────┘                                                     │ │
│  │          │                                                             │ │
│  │          ▼                                                             │ │
│  │   ┌──────────────┐                                                     │ │
│  │   │FunilPorEtapa │  ◄── Componente de apresentação (puro)              │ │
│  │   │    Chart     │                                                     │ │
│  │   └──────────────┘                                                     │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Card: LeadsTrends (Mesmo padrão, diferentes dados)                    │ │
│  │                                                                        │ │
│  │   ┌──────────────┐         ┌──────────────────┐         ┌──────────┐  │ │
│  │   │ useDashboard │         │                  │         │ /api/... │  │ │
│  │   │   Query      │◀───────▶│  React Query     │◀───────▶│          │  │ │
│  │   │ (DIFF key)   │         │  Cache           │         │          │  │ │
│  │   └──────────────┘         └──────────────────┘         └──────────┘  │ │
│  │                                                                             │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

                                    │
                                    │ (Invalidação)
                                    ▼

┌─────────────────────────────────────────────────────────────────────────────┐
│                      QUANDO PERÍODO MUDA                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   1. Usuário clica em "90 dias"                                             │
│              │                                                              │
│              ▼                                                              │
│   2. setPeriod('90d') no Context                                            │
│              │                                                              │
│              ▼                                                              │
│   3. Todos os hooks com dependência de 'period' são notificados             │
│              │                                                              │
│              ▼                                                              │
│   4. React Query detecta mudança na query key                               │
│      ['dashboard', 'funil', '90d'] ≠ ['dashboard', 'funil', '30d']          │
│              │                                                              │
│              ▼                                                              │
│   5. Cada card:                                                             │
│      • Se dados em cache para '90d': mostra imediatamente                   │
│      • Se não: mostra skeleton e faz fetch                                  │
│              │                                                              │
│              ▼                                                              │
│   6. UI atualiza independentemente por card                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Comparação de Arquiteturas

### Monolítica (Antes)

```
┌─────────────────────────────────────────────────────────────┐
│                      PAGE COMPONENT                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 useDashboard()                        │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  • fetchContacts()                             │  │  │
│  │  │  • fetchConversations()                        │  │  │
│  │  │  • fetchAIInsights()                           │  │  │
│  │  │  • fetchTags()                                 │  │  │
│  │  │  • calculateMetrics()                          │  │  │
│  │  │  • calculateCharts()                           │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                        │                             │  │
│  │                        ▼                             │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  metrics, charts, isLoading, error              │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                  │
│              ┌───────────┼───────────┐                      │
│              ▼           ▼           ▼                      │
│         ┌────────┐ ┌────────┐ ┌────────┐                   │
│         │ Card 1 │ │ Card 2 │ │ Card 3 │                   │
│         │ Props  │ │ Props  │ │ Props  │                   │
│         └────────┘ └────────┘ └────────┘                   │
│                                                             │
│  PROBLEMAS:                                                 │
│  ❌ Todos os dados carregados de uma vez                    │
│  ❌ Um erro quebra todo o dashboard                         │
│  ❌ Loading global bloqueia UI                              │
│  ❌ Difícil adicionar novos cards                           │
│  ❌ Re-renderização em cascata                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Modular (Depois)

```
┌─────────────────────────────────────────────────────────────┐
│                      PAGE COMPONENT                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           DashboardProvider (Context)                 │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  • period                                       │  │  │
│  │  │  • dateRange                                    │  │  │
│  │  │  • selectedUsers                                │  │  │
│  │  │  • refreshTrigger                               │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                  │
│              ┌───────────┼───────────┐                      │
│              ▼           ▼           ▼                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │   Card 1     │ │   Card 2     │ │   Card 3     │        │
│  ├──────────────┤ ├──────────────┤ ├──────────────┤        │
│  │useDashboard  │ │useDashboard  │ │useDashboard  │        │
│  │  Query       │ │  Query       │ │  Query       │        │
│  │ (DIFFERENT)  │ │ (DIFFERENT)  │ │ (DIFFERENT)  │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│       │               │               │                     │
│       ▼               ▼               ▼                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │   API    │    │   API    │    │   API    │              │
│  │  Route   │    │  Route   │    │  Route   │              │
│  └──────────┘    └──────────┘    └──────────┘              │
│                                                             │
│  BENEFÍCIOS:                                                │
│  ✅ Cada card independente                                  │
│  ✅ Erro em um não afeta outros                             │
│  ✅ Loading granular (skeleton por card)                    │
│  ✅ Fácil adicionar novos cards (copiar padrão)            │
│  ✅ Cache inteligente (React Query)                         │
│  ✅ Refetch independente                                    │
│  ✅ Prefetch no servidor                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Fluxo de Cache

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REACT QUERY CACHE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Query Key                          Data              State        Time     │
│  ────────────────────────────────────────────────────────────────────────   │
│                                                                             │
│  ['dashboard', 'funil', '30d']      { etapas: [] }   ✓ fresh      2m ago   │
│                                                                             │
│  ['dashboard', 'kpis', '30d']       { receita:... }  ✓ fresh      1m ago   │
│                                                                             │
│  ['dashboard', 'leads', '30d']      { leads: [] }    ✓ fresh      4m ago   │
│                                                                             │
│  ['dashboard', 'funil', '7d']       { etapas: [] }   ✓ fresh      5s ago   │
│                                                                             │
│  ['dashboard', 'kpis', '7d']        undefined        ⟳ fetching   now       │
│                                                                             │
│  ────────────────────────────────────────────────────────────────────────   │
│                                                                             │
│  Legenda:  ✓ fresh (não precisa refetch)                                    │
│            ⚠ stale (pode refetch em background)                             │
│            ⟳ fetching (requisição em andamento)                             │
│                                                                             │
│  Quando período muda de '30d' para '7d':                                    │
│  • ['dashboard', 'funil', '7d'] já existe em cache → mostra instantâneo    │
│  • ['dashboard', 'kpis', '7d'] não existe → mostra skeleton + fetch        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Estrutura de Pastas Final

```
📁 my-project/
├── 📁 app/
│   ├── 📁 dashboard/
│   │   ├── 📄 page.tsx                    ← Server Component com prefetch
│   │   ├── 📄 layout.tsx                  ← Layout específico
│   │   ├── 📁 _components/
│   │   │   ├── 📄 dashboard-content.tsx   ← Layout do dashboard
│   │   │   ├── 📄 funil-por-etapa-card.tsx
│   │   │   ├── 📄 funil-por-etapa-chart.tsx
│   │   │   ├── 📄 funil-por-etapa-skeleton.tsx
│   │   │   └── 📄 index.ts
│   │   ├── 📁 _hooks/
│   │   │   ├── 📄 use-funil-por-etapa.ts
│   │   │   └── 📄 index.ts
│   │   └── 📁 _lib/
│   │       └── 📄 query-client.ts         ← Query client para SSR
│   └── 📁 api/
│       └── 📁 dashboard/
│           └── 📁 funil-por-etapa/
│               └── 📄 route.ts            ← API Route
│
├── 📁 components/
│   ├── 📁 dashboard/                      ← Componentes base REUTILIZÁVEIS
│   │   ├── 📄 dashboard-card.tsx
│   │   ├── 📄 dashboard-grid.tsx
│   │   ├── 📄 dashboard-error.tsx
│   │   ├── 📄 dashboard-empty.tsx
│   │   ├── 📄 kpi-vertical-item.tsx
│   │   ├── 📄 chart-container.tsx
│   │   └── 📄 index.ts
│   └── 📁 providers/
│       └── 📄 query-provider.tsx          ← Provider do React Query
│
├── 📁 hooks/
│   ├── 📁 dashboard/                      ← Hooks especializados
│   │   ├── 📄 use-dashboard-query.ts      ← Wrapper React Query
│   │   ├── 📄 use-dashboard-filters.ts    ← Hook de filtros
│   │   └── 📄 index.ts
│   └── 📄 use-dashboard-context.tsx       ← Contexto (apenas filtros)
│
├── 📁 lib/
│   └── 📁 queries/
│       ├── 📄 query-keys.ts               ← Central de query keys
│       └── 📄 index.ts
│
├── 📁 types/
│   └── 📁 dashboard/
│       └── 📄 index.ts                    ← Tipagens do dashboard
│
└── 📁 docs/
    └── 📁 architecture/
        ├── 📄 dashboard-architecture.md   ← Este documento
        └── 📄 migration-guide.md          ← Guia de migração
```

## Padrão de Componente

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PADRÃO DASHBOARDCARD                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        DashboardCard                                  │  │
│  │  ┌────────────────────────────────────────────────────────────────┐  │  │
│  │  │  Header                                                        │  │  │
│  │  │  • Título (obrigatório)                                        │  │  │
│  │  │  • Descrição (opcional)                                        │  │  │
│  │  │  • Action (botão/menu - opcional)                              │  │  │
│  │  └────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                       │  │
│  │  ┌────────────────────────────────────────────────────────────────┐  │  │
│  │  │  Content                                                      │  │  │
│  │  │                                                                │  │  │
│  │  │  ┌──────────────────────────────────────────────────────────┐ │  │  │
│  │  │  │  STATE: LOADING                                         │ │  │  │
│  │  │  │  • Skeleton específico do card                          │ │  │  │
│  │  │  └──────────────────────────────────────────────────────────┘ │  │  │
│  │  │                                                                │  │  │
│  │  │  ┌──────────────────────────────────────────────────────────┐ │  │  │
│  │  │  │  STATE: ERROR                                           │ │  │  │
│  │  │  │  • Mensagem de erro                                     │ │  │  │
│  │  │  │  • Botão de retry                                       │ │  │  │
│  │  │  └──────────────────────────────────────────────────────────┘ │  │  │
│  │  │                                                                │  │  │
│  │  │  ┌──────────────────────────────────────────────────────────┐ │  │  │
│  │  │  │  STATE: EMPTY                                           │ │  │  │
│  │  │  │  • Ícone                                                │ │  │  │
│  │  │  │  • Mensagem informativa                                 │ │  │  │
│  │  │  │  • Action opcional (ex: "Criar primeiro")              │ │  │  │
│  │  │  └──────────────────────────────────────────────────────────┘ │  │  │
│  │  │                                                                │  │  │
│  │  │  ┌──────────────────────────────────────────────────────────┐ │  │  │
│  │  │  │  STATE: SUCCESS                                         │ │  │  │
│  │  │  │  • Componente de visualização (chart/table/list)       │ │  │  │
│  │  │  └──────────────────────────────────────────────────────────┘ │  │  │
│  │  │                                                                │  │  │
│  │  └────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```
