# Plano de Arquitetura - Dashboard Modular

## 📋 Resumo Executivo

Este documento define a arquitetura para um dashboard complexo com múltiplos cards independentes, utilizando React Query (TanStack Query) como solução de data fetching.

## 🎯 Objetivos da Arquitetura

1. **Independência**: Cada card carrega seus próprios dados
2. **Performance**: Renderização instantânea, dados em background
3. **Reutilização**: Componentes genéricos reutilizáveis
4. **Manutenibilidade**: Fácil adicionar novos cards

---

## 📁 Estrutura de Pastas

```
app/
├── dashboard/
│   ├── page.tsx                 # Page component (Server Component)
│   ├── layout.tsx               # Dashboard layout com providers
│   ├── _components/             # Componentes específicos do dashboard
│   │   ├── dashboard-grid.tsx
│   │   ├── dashboard-card.tsx
│   │   ├── funil-por-etapa-card.tsx
│   │   └── kpi-vertical-item.tsx
│   ├── _hooks/                  # Hooks específicos do dashboard
│   │   ├── use-dashboard-query.ts
│   │   └── use-funil-por-etapa.ts
│   ├── _lib/                    # Utilitários do dashboard
│   │   └── query-client.ts
│   └── _types/                  # Tipagens do dashboard
│       └── index.ts
├── api/
│   └── dashboard/
│       ├── route.ts             # Rotas genéricas (se necessário)
│       ├── funil-por-etapa/
│       │   └── route.ts         # API específica
│       └── metrikpis/
│           └── route.ts

components/
├── dashboard/                   # Componentes base reutilizáveis
│   ├── dashboard-grid.tsx       # Layout grid responsivo
│   ├── dashboard-card.tsx       # Container de card com skeleton
│   ├── dashboard-error.tsx      # Estado de erro
│   ├── dashboard-empty.tsx      # Estado vazio
│   ├── kpi-vertical-item.tsx    # Item KPI para sidebar
│   └── chart-container.tsx      # Wrapper para gráficos
└── providers/
    └── query-provider.tsx       # Provider do React Query

hooks/
├── dashboard/                   # Hooks especializados
│   ├── use-dashboard-query.ts   # Wrapper React Query
│   ├── use-dashboard-filters.ts # Filtros globais
│   └── index.ts
└── use-dashboard-context.tsx    # Contexto (apenas filtros globais)

lib/
├── queries/                     # Configurações de queries
│   ├── dashboard-queries.ts     # Query factories
│   └── query-keys.ts            # Central de query keys
├── utils.ts
└── formatters.ts

types/
└── dashboard/
    ├── index.ts                 # Tipos principais
    ├── api.ts                   # Tipos de API
    └── components.ts            # Props dos componentes
```

---

## 🏗️ Decisões Arquiteturais

### 1. Contexto ou Não?

**Decisão**: Usar **Contexto apenas para filtros globais**, não para dados.

**Justificativa**:
- ✅ Cada card é independente e carrega seus próprios dados
- ✅ Filtros (período, usuários) são compartilhados entre cards
- ✅ React Query gerencia cache e estado dos dados
- ❌ Contexto para dados causaria re-renderizações desnecessárias

```typescript
// Contexto: APENAS filtros globais
interface DashboardFiltersContext {
  period: DashboardPeriod;      // '7d' | '30d' | '90d'
  dateRange: DateRange;         // { startDate, endDate }
  selectedUsers: string[];      // Filtro de usuários
  setPeriod: (p: DashboardPeriod) => void;
  toggleUser: (id: string) => void;
}
```

### 2. Estratégia de Data Fetching

**React Query (TanStack Query)** escolhido por:

| Recurso | Benefício |
|---------|-----------|
| `staleTime` | Dados considerados frescos por tempo configurável |
| `cacheTime` | Cache persistente entre navegações |
| `refetchOnWindowFocus` | Atualização automática ao retornar |
| `retry` | Retry automático com exponential backoff |
| `suspense` | Integração com React Suspense |
| DevTools | Ferramentas de debug excelentes |

### 3. Organização dos Hooks

Cada card terá seu próprio hook especializado:

```typescript
// Padrão: use[NomeDoCard]
useFunilPorEtapa()      // Hook específico
useMetricasKPI()        // Hook específico
useLeadsRecentes()      // Hook específico
```

Todos os hooks usam `useDashboardQuery` como base.

---

## 🧩 Componentes Base

### 1. DashboardGrid

Layout responsivo para organizar os cards.

```typescript
interface DashboardGridProps {
  children: React.ReactNode;
  className?: string;
  sidebar?: React.ReactNode;      // KPIs verticais (opcional)
}
```

**Features**:
- Layout de 2 colunas: sidebar (160px) + conteúdo principal
- Responsivo: empilha em mobile
- Gap consistente entre cards

### 2. DashboardCard

Container padronizado para todos os cards.

```typescript
interface DashboardCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;       // Botão/ação no header
  loading?: boolean;              // Controla skeleton
  error?: Error | null;           // Estado de erro
  onRetry?: () => void;           // Callback retry
  empty?: boolean;                // Estado vazio
  emptyMessage?: string;          // Mensagem estado vazio
}
```

**Features**:
- Skeleton automático durante loading
- Estado de erro com retry
- Estado vazio customizável
- Header padronizado

### 3. KpiVerticalItem

Item de KPI para a sidebar (coluna de 160px).

```typescript
interface KpiVerticalItemProps {
  label: string;
  value: string | number;
  change?: string;                // Ex: "+12%"
  isNegativeGood?: boolean;       // Inverte cor do change
  icon?: LucideIcon;
  loading?: boolean;
}
```

### 4. ChartContainer

Wrapper para gráficos Recharts.

```typescript
interface ChartContainerProps {
  children: React.ReactNode;
  height?: number;                // Altura padrão: 300
  config?: ChartConfig;           // Configurações de cores/labels
}
```

---

## 🪝 Padrão de Hook: useDashboardQuery

Wrapper tipado em torno do React Query.

```typescript
// hooks/dashboard/use-dashboard-query.ts
function useDashboardQuery<TData, TError = Error>(
  options: UseDashboardQueryOptions<TData, TError>
): UseQueryResult<TData, TError>

interface UseDashboardQueryOptions<TData, TError> {
  queryKey: QueryKey;
  queryFn: () => Promise<TData>;
  staleTime?: number;             // Default: 5 minutos
  retry?: number | boolean;       // Default: 3 tentativas
  enabled?: boolean;              // Default: true
  refetchInterval?: number;       // Polling (opcional)
}
```

**Configurações Padrão**:
```typescript
const defaultOptions = {
  staleTime: 5 * 60 * 1000,       // 5 minutos
  retry: 3,
  retryDelay: (attemptIndex: number) => 
    Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  refetchOnWindowFocus: false,
}
```

---

## 🔑 Query Keys

Centralização para invalidação consistente.

```typescript
// lib/queries/query-keys.ts
export const dashboardKeys = {
  all: ['dashboard'] as const,
  filters: () => [...dashboardKeys.all, 'filters'] as const,
  
  // Cards específicos
  funilPorEtapa: (period: string) => 
    [...dashboardKeys.all, 'funil', period] as const,
  metricasKPI: (period: string) => 
    [...dashboardKeys.all, 'kpis', period] as const,
  leadsRecentes: (limit: number) => 
    [...dashboardKeys.all, 'leads', limit] as const,
  
  // Invalidação em grupo
  byPeriod: (period: string) => 
    [...dashboardKeys.all, { period }] as const,
}
```

---

## 🚀 Estratégia de Prefetching (Next.js)

### Server Component Pattern

```typescript
// app/dashboard/page.tsx
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from './_lib/query-client'
import { dashboardKeys } from '@/lib/queries/query-keys'
import { DashboardContent } from './_components/dashboard-content'

export default async function DashboardPage() {
  const queryClient = getQueryClient()
  
  // Prefetch dados críticos no servidor
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: dashboardKeys.funilPorEtapa('30d'),
      queryFn: () => fetchFunilPorEtapa('30d'),
    }),
    queryClient.prefetchQuery({
      queryKey: dashboardKeys.metricasKPI('30d'),
      queryFn: () => fetchMetricasKPI('30d'),
    }),
  ])
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardContent />
    </HydrationBoundary>
  )
}
```

### Prioridade de Prefetch

| Prioridade | Dados | Motivo |
|------------|-------|--------|
| Alta | KPIs principais | Visíveis imediatamente |
| Alta | Primeiros 2 cards | Acima da dobra |
| Média | Cards abaixo da dobra | Carregam durante scroll |
| Baixa | Dados de detalhe | On-demand ao expandir |

---

## 📦 Exemplo End-to-End: FunilPorEtapaCard

### 1. Tipo

```typescript
// types/dashboard/index.ts
export interface FunilPorEtapaData {
  etapas: Array<{
    id: string;
    nome: string;
    quantidade: number;
    valor: number;
    cor: string;
  }>;
  total: number;
  taxaConversao: number;
}
```

### 2. Hook

```typescript
// app/dashboard/_hooks/use-funil-por-etapa.ts
'use client'

import { useDashboardQuery } from '@/hooks/dashboard/use-dashboard-query'
import { dashboardKeys } from '@/lib/queries/query-keys'
import { FunilPorEtapaData } from '@/types/dashboard'
import { useDashboardFilters } from '@/hooks/dashboard/use-dashboard-filters'

export function useFunilPorEtapa() {
  const { period } = useDashboardFilters()
  
  return useDashboardQuery<FunilPorEtapaData>({
    queryKey: dashboardKeys.funilPorEtapa(period),
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/funil-por-etapa?period=${period}`)
      if (!response.ok) throw new Error('Falha ao carregar funil')
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}
```

### 3. Componente de Apresentação

```typescript
// app/dashboard/_components/funil-por-etapa-chart.tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartContainer } from '@/components/dashboard/chart-container'
import { FunilPorEtapaData } from '@/types/dashboard'

interface FunilPorEtapaChartProps {
  data: FunilPorEtapaData
}

export function FunilPorEtapaChart({ data }: FunilPorEtapaChartProps) {
  return (
    <ChartContainer height={250}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.etapas} layout="vertical">
          <XAxis type="number" hide />
          <YAxis dataKey="nome" type="category" width={100} />
          <Tooltip />
          <Bar dataKey="quantidade" fill="#8B7DB8" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
```

### 4. Card Completo

```typescript
// app/dashboard/_components/funil-por-etapa-card.tsx
'use client'

import { DashboardCard } from '@/components/dashboard/dashboard-card'
import { useFunilPorEtapa } from '../_hooks/use-funil-por-etapa'
import { FunilPorEtapaChart } from './funil-por-etapa-chart'
import { FunilPorEtapaSkeleton } from './funil-por-etapa-skeleton'

export function FunilPorEtapaCard() {
  const { data, isLoading, error, refetch } = useFunilPorEtapa()
  
  return (
    <DashboardCard
      title="Funil por Etapa"
      description="Distribuição de leads por etapa do funil"
      loading={isLoading}
      error={error}
      onRetry={refetch}
      empty={!isLoading && !error && data?.etapas.length === 0}
      emptyMessage="Nenhum dado disponível para o período selecionado"
    >
      {data && <FunilPorEtapaChart data={data} />}
    </DashboardCard>
  )
}
```

### 5. Skeleton

```typescript
// app/dashboard/_components/funil-por-etapa-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton'

export function FunilPorEtapaSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-[90%]" />
      <Skeleton className="h-4 w-[75%]" />
      <Skeleton className="h-4 w-[60%]" />
      <Skeleton className="h-4 w-[45%]" />
    </div>
  )
}
```

### 6. API Route

```typescript
// app/api/dashboard/funil-por-etapa/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'
    
    // Calcular date range
    const endDate = new Date()
    const startDate = new Date()
    const days = parseInt(period)
    startDate.setDate(endDate.getDate() - days)
    
    // Buscar dados
    const etapas = await prisma.pipelineStage.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        _count: {
          select: { 
            contacts: {
              where: {
                createdAt: { gte: startDate, lte: endDate }
              }
            }
          }
        }
      }
    })
    
    const data = {
      etapas: etapas.map(e => ({
        id: e.id,
        nome: e.name,
        quantidade: e._count.contacts,
        valor: 0, // Calcular se houver dealValue
        cor: e.color || '#8B7DB8'
      })),
      total: etapas.reduce((sum, e) => sum + e._count.contacts, 0),
      taxaConversao: 0 // Calcular
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching funil:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────────┐
│                     DASHBOARD FLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────┐   │
│  │   Server    │────▶│   Prefetch  │────▶│  Hydration      │   │
│  │   (Next.js) │     │   (RSC)     │     │  Boundary       │   │
│  └─────────────┘     └─────────────┘     └─────────────────┘   │
│                                                   │             │
│                                                   ▼             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   CLIENT RENDER                          │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │  │
│  │  │   Card 1    │  │   Card 2    │  │     Card 3      │  │  │
│  │  │  useQuery   │  │  useQuery   │  │    useQuery     │  │  │
│  │  │  ┌───────┐  │  │  ┌───────┐  │  │    ┌───────┐    │  │  │
│  │  │  │Cached?│──┼──┼──▶│Cached?│──┼──┼───▶│Cached?│    │  │  │
│  │  │  └───┬───┘  │  │  └───┬───┘  │  │    └───┬───┘    │  │  │
│  │  │      │Sim   │  │      │Sim   │  │        │Não     │  │  │
│  │  │      ▼      │  │      ▼      │  │        ▼        │  │  │
│  │  │  ┌───────┐  │  │  ┌───────┐  │  │   ┌──────────┐  │  │  │
│  │  │  │Render │  │  │  │Render │  │  │   │  Fetch   │  │  │  │
│  │  │  │Instant│  │  │  │Instant│  │  │   │  API     │  │  │  │
│  │  │  └───┬───┘  │  │  └───┬───┘  │  │   └────┬─────┘  │  │  │
│  │  │      │      │  │      │      │  │        │        │  │  │
│  │  │      ▼      │  │      ▼      │  │        ▼        │  │  │
│  │  │  ┌───────┐  │  │  ┌───────┐  │  │   ┌──────────┐  │  │  │
│  │  │  │Display│  │  │  │Display│  │  │   │ Skeleton │  │  │  │
│  │  │  │  Data │  │  │  │  Data │  │  │   │   then   │  │  │  │
│  │  │  └───────┘  │  │  └───────┘  │  │   │ Display  │  │  │  │
│  │  └─────────────┘  └─────────────┘  │   └──────────┘  │  │  │
│  │                                    │                 │  │  │
│  └──────────────────────────────────────────────────────┘  │  │
│                                                            │  │
└────────────────────────────────────────────────────────────┘  │
                                                                 │
┌────────────────────────────────────────────────────────────┐  │
│              FILTERS CONTEXT (Shared State)                │  │
│  ┌──────────────────────────────────────────────────────┐  │  │
│  │  period: '30d' │ dateRange │ selectedUsers: []        │  │  │
│  └──────────────────────────────────────────────────────┘  │  │
│                                                            │  │
│  Quando filtros mudam:                                     │  │
│  1. Invalida queries com queryClient.invalidateQueries()   │  │
│  2. Cada hook refetch automaticamente                    │  │
│  3. UI atualiza independentemente por card                 │  │
└────────────────────────────────────────────────────────────┘  │
```

---

## 🎨 Padrões de Implementação

### Adicionando um Novo Card

**Passo 1**: Criar tipos
```typescript
// types/dashboard/index.ts
export interface NovoCardData {
  // ...
}
```

**Passo 2**: Criar query key
```typescript
// lib/queries/query-keys.ts
novoCard: (period: string) => 
  [...dashboardKeys.all, 'novo-card', period] as const,
```

**Passo 3**: Criar hook
```typescript
// app/dashboard/_hooks/use-novo-card.ts
export function useNovoCard() {
  const { period } = useDashboardFilters()
  return useDashboardQuery<NovoCardData>({
    queryKey: dashboardKeys.novoCard(period),
    queryFn: () => fetchNovoCard(period),
  })
}
```

**Passo 4**: Criar componente
```typescript
// app/dashboard/_components/novo-card.tsx
export function NovoCard() {
  const { data, isLoading, error, refetch } = useNovoCard()
  return (
    <DashboardCard title="Novo Card" loading={isLoading} error={error} onRetry={refetch}>
      {/* Conteúdo */}
    </DashboardCard>
  )
}
```

**Passo 5**: Adicionar à página
```typescript
// app/dashboard/page.tsx
<div className="grid grid-cols-2 gap-3">
  <FunilPorEtapaCard />
  <NovoCard /> {/* Novo card aqui */}
</div>
```

---

## ⚡ Otimizações de Performance

### 1. Stale Time por Tipo de Dado

```typescript
const staleTimeConfig = {
  kpis: 2 * 60 * 1000,        // 2 minutos (mudam mais)
  charts: 5 * 60 * 1000,      // 5 minutos
  lists: 3 * 60 * 1000,       // 3 minutos
  static: 10 * 60 * 1000,     // 10 minutos
}
```

### 2. Window Focus Refetch

Desabilitado por padrão, habilitar apenas para dados críticos:

```typescript
useDashboardQuery({
  queryKey: dashboardKeys.metricasKPI(period),
  queryFn: fetchMetricasKPI,
  refetchOnWindowFocus: true, // Apenas KPIs
})
```

### 3. Lazy Loading de Cards

Para cards abaixo da dobra:

```typescript
import { useInView } from 'react-intersection-observer'

export function LazyCard() {
  const { ref, inView } = useInView({ triggerOnce: true })
  
  return (
    <div ref={ref}>
      {inView ? <CardContent /> : <CardSkeleton />}
    </div>
  )
}
```

---

## 🧪 Testes

### Teste de Hook

```typescript
// __tests__/hooks/use-funil-por-etapa.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useFunilPorEtapa } from '@/app/dashboard/_hooks/use-funil-por-etapa'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useFunilPorEtapa', () => {
  it('should fetch funil data', async () => {
    const { result } = renderHook(() => useFunilPorEtapa(), {
      wrapper: createWrapper()
    })
    
    expect(result.current.isLoading).toBe(true)
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    
    expect(result.current.data).toBeDefined()
  })
})
```

---

## 📚 Referências

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [React Query + Next.js App Router](https://tanstack.com/query/latest/docs/framework/react/guides/ssr)

---

## ✅ Checklist de Implementação

- [ ] Instalar `@tanstack/react-query` e `@tanstack/react-query-devtools`
- [ ] Configurar QueryProvider no layout raiz
- [ ] Criar estrutura de pastas
- [ ] Implementar componentes base (DashboardCard, DashboardGrid)
- [ ] Implementar useDashboardQuery
- [ ] Criar query-keys.ts
- [ ] Refatorar use-dashboard-context.tsx (remover dados, manter filtros)
- [ ] Migrar cards existentes para novo padrão
- [ ] Implementar prefetching no server
- [ ] Adicionar React Query DevTools
- [ ] Escrever testes
