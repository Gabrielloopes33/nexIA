# Guia de Migração - Dashboard Modular

Este guia descreve como migrar o dashboard atual para a nova arquitetura modular.

## 📋 Resumo da Migração

### Antes (Monolítico)
```
useDashboard() → carrega TODOS os dados
     ↓
Todos os cards recebem dados via props
     ↓
Um erro quebra todo o dashboard
```

### Depois (Modular)
```
Card 1: useFunilPorEtapa()    → Dados independentes
Card 2: useMetricasKPI()      → Dados independentes  
Card 3: useLeadsRecentes()    → Dados independentes
     ↓
Cada card gerencia seu próprio estado
     ↓
Um erro afeta apenas um card
```

---

## 🚀 Passo a Passo

### Passo 1: Instalar Dependências

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
# ou
yarn add @tanstack/react-query @tanstack/react-query-devtools
# ou
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

### Passo 2: Configurar QueryProvider

O arquivo `components/providers/query-provider.tsx` já foi criado.

**Atualize o layout raiz** (`app/layout.tsx`):

```typescript
import { QueryProvider } from '@/components/providers/query-provider'

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <QueryProvider>
          {/* outros providers */}
          {children}
        </QueryProvider>
      </body>
    </html>
  )
}
```

### Passo 3: Refatorar use-dashboard-context.tsx

**Mudança principal**: Remover dados do contexto, manter apenas filtros.

**ANTES:**
```typescript
// hooks/use-dashboard-context.tsx (ANTES)
interface DashboardContextType {
  // Filtros
  dateRange: DateRange
  setDateRange: (range: DateRange) => void
  
  // Dados (❌ remover)
  metrics: DashboardMetrics | null
  charts: DashboardCharts | null
  insights: DashboardInsight[]
  isLoading: boolean
  error: string | null
  refresh: () => void
}
```

**DEPOIS:**
```typescript
// hooks/use-dashboard-context.tsx (DEPOIS)
interface DashboardContextType {
  // Filtros (✅ manter)
  period: DashboardPeriod
  dateRange: DateRange
  setPeriod: (period: DashboardPeriod) => void
  selectedUsers: string[]
  toggleUser: (id: string) => void
  
  // Trigger de refresh global (✅ manter)
  refreshTrigger: number
  refresh: () => void
}
```

### Passo 4: Criar Hooks Especializados

Para cada card existente, crie um hook especializado:

**Exemplo: Migrando leads-trends-chart**

1. **Criar hook** (`app/dashboard/_hooks/use-leads-trends.ts`):
```typescript
'use client'

import { useDashboardQuery } from '@/hooks/dashboard/use-dashboard-query'
import { dashboardKeys } from '@/lib/queries/query-keys'
import { useDashboardFilters } from '@/hooks/dashboard/use-dashboard-filters'
import type { LeadsTendenciasData } from '@/types/dashboard'

export function useLeadsTrends() {
  const { period } = useDashboardFilters()
  
  return useDashboardQuery<LeadsTendenciasData>({
    queryKey: dashboardKeys.leadsTendencias(period),
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/leads-trends?period=${period}`)
      if (!response.ok) throw new Error('Erro ao carregar tendências')
      return response.json()
    },
    dataType: 'charts',
  })
}
```

2. **Criar API route** (`app/api/dashboard/leads-trends/route.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Extrair lógica do use-dashboard.ts para cá
  // ...
}
```

3. **Refatorar componente**:
```typescript
// components/lead-trends-chart.tsx (DEPOIS)
'use client'

import { DashboardCard } from '@/components/dashboard/dashboard-card'
import { useLeadsTrends } from '@/app/dashboard/_hooks/use-leads-trends'

export function LeadTrendsChart() {
  const { data, isLoading, error, refetch } = useLeadsTrends()
  
  return (
    <DashboardCard
      title="Tendências de Leads"
      loading={isLoading}
      error={error}
      onRetry={refetch}
      empty={data?.tendencias.length === 0}
    >
      {data && <Chart data={data} />}
    </DashboardCard>
  )
}
```

### Passo 5: Migrar Cards em Ordem de Prioridade

**Ordem recomendada:**

1. **KPIs Verticais** (mais simples)
   - Hook: `useMetricasKPI`
   - Componente: Refatorar `vertical-kpi-card.tsx`

2. **Funil** (média complexidade)
   - Já criado como exemplo: `FunilPorEtapaCard`

3. **Gráficos** (média complexidade)
   - `LeadTrendsChart`
   - `ConversationVolumeChart`
   - `TagPerformanceChart`

4. **Listas** (alta complexidade)
   - `RecentLeads`
   - `ActivityHeatmap`

5. **Objections/Insights** (específicos)
   - `ObjectionsChart`
   - `AiInsightsPanel`

### Passo 6: Atualizar Dashboard Page

**ANTES** (`app/dashboard/page.tsx`):
```typescript
'use client'

import { useDashboard } from '@/hooks/use-dashboard'

function DashboardContent() {
  const { metrics, charts, isLoading, error } = useDashboard()
  
  if (isLoading) return <Loading />
  if (error) return <Error />
  
  return (
    <>
      <LeadTrendsChart data={charts.leadTrends} />
      <ConversationVolumeChart data={charts.conversationVolume} />
      {/* ... */}
    </>
  )
}
```

**DEPOIS** (`app/dashboard/page.tsx`):
```typescript
// Server Component (sem 'use client')

import { DashboardContent } from './_components/dashboard-content'

// Opcional: Prefetch dados críticos
export default async function DashboardPage() {
  // ...
  
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  )
}
```

### Passo 7: Remover use-dashboard.ts

Após migrar todos os cards:

1. Remover `hooks/use-dashboard.ts`
2. Atualizar imports em outros arquivos
3. Verificar se não há referências antigas

---

## 🔄 Checklist de Migração

### Configuração Inicial
- [ ] Instalar `@tanstack/react-query`
- [ ] Configurar `QueryProvider` no layout
- [ ] Criar estrutura de pastas
- [ ] Criar `query-keys.ts`

### Hooks Base
- [ ] Criar `use-dashboard-query.ts`
- [ ] Criar `use-dashboard-filters.ts`
- [ ] Refatorar `use-dashboard-context.tsx`

### Componentes Base
- [ ] Criar `DashboardCard`
- [ ] Criar `DashboardGrid`
- [ ] Criar `KpiVerticalItem`
- [ ] Criar `ChartContainer`

### Cards (um por um)
- [ ] KPIs Verticais
- [ ] Funil por Etapa
- [ ] Tendências de Leads
- [ ] Volume de Conversas
- [ ] Performance por Tag
- [ ] Mapa de Atividade
- [ ] Objections
- [ ] Leads Recentes

### API Routes
- [ ] `/api/dashboard/kpis`
- [ ] `/api/dashboard/funil-por-etapa`
- [ ] `/api/dashboard/leads-trends`
- [ ] `/api/dashboard/conversations-volume`
- [ ] `/api/dashboard/tags-performance`
- [ ] `/api/dashboard/activity-heatmap`
- [ ] `/api/dashboard/objections`
- [ ] `/api/dashboard/recent-leads`

### Limpeza
- [ ] Remover `use-dashboard.ts`
- [ ] Remover `use-dashboard-old.ts` (backup)
- [ ] Atualizar imports
- [ ] Testar todos os cards

---

## ⚠️ Pontos de Atenção

### 1. Compartilhamento de Dados

Se dois cards precisam dos mesmos dados:

**Opção A**: Cada um faz sua própria query (React Query deduplica)
```typescript
// Card A
const { data } = useDashboardQuery({ queryKey: ['shared-data'] })

// Card B
const { data } = useDashboardQuery({ queryKey: ['shared-data'] }) // Mesma key = cache compartilhado
```

**Opção B**: Hook compartilhado
```typescript
// hooks/dashboard/use-shared-metric.ts
export function useSharedMetric() {
  return useDashboardQuery({ queryKey: ['shared-data'] })
}
```

### 2. Dependências entre Cards

Se Card B precisa dos dados do Card A:

```typescript
// Card B espera Card A ter dados
function CardB() {
  const { data: cardAData } = useCardA()
  
  const { data } = useDashboardQuery({
    queryKey: ['card-b', cardAData?.id],
    queryFn: () => fetchCardB(cardAData!.id),
    enabled: !!cardAData, // Só executa quando Card A tem dados
  })
}
```

### 3. Atualização Global

Para atualizar todos os cards:

```typescript
// No contexto ou componente pai
import { useQueryClient } from '@tanstack/react-query'

function useGlobalRefresh() {
  const queryClient = useQueryClient()
  
  const refreshAll = () => {
    // Invalida todas as queries do dashboard
    queryClient.invalidateQueries({ 
      queryKey: dashboardKeys.all 
    })
  }
  
  return { refreshAll }
}
```

### 4. Período Padrão

Ao mudar o período, todos os cards devem atualizar:

```typescript
// use-dashboard-context.tsx
const refresh = useCallback(() => {
  // Invalida queries do período atual
  queryClient.invalidateQueries({
    queryKey: dashboardKeys.byPeriod(period)
  })
}, [period, queryClient])
```

---

## 🧪 Testes Durante a Migração

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
  it('deve carregar dados do funil', async () => {
    const { result } = renderHook(() => useFunilPorEtapa(), {
      wrapper: createWrapper()
    })
    
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
  })
})
```

### Teste de Componente
```typescript
// __tests__/components/funil-por-etapa-card.test.tsx
import { render, screen } from '@testing-library/react'
import { FunilPorEtapaCard } from '@/app/dashboard/_components/funil-por-etapa-card'

describe('FunilPorEtapaCard', () => {
  it('deve mostrar loading inicial', () => {
    render(<FunilPorEtapaCard />)
    expect(screen.getByTestId('card-skeleton')).toBeInTheDocument()
  })
})
```

---

## 📊 Métricas de Sucesso

Após a migração, você deve observar:

| Métrica | Antes | Depois |
|---------|-------|--------|
| Tempo de carregamento inicial | Alto | Baixo (cards independentes) |
| Erros globais | Dashboard quebra | Apenas card afetado |
| Re-renderizações | Todas juntas | Granulares |
| Cache | Nenhum | Inteligente (React Query) |
| Adicionar novo card | Complexo | Simples (copiar padrão) |

---

## 🆘 Troubleshooting

### Problema: Card não atualiza ao mudar período

**Solução**: Verifique se o hook usa `useDashboardFilters`:
```typescript
const { period } = useDashboardFilters()
const { data } = useDashboardQuery({
  queryKey: ['key', period], // period deve estar na key!
})
```

### Problema: Múltiplas requisições idênticas

**Solução**: Verifique se a query key é estável:
```typescript
// ❌ Errado
queryKey: ['data', new Date()]

// ✅ Correto
queryKey: ['data', period]
```

### Problema: Dados desatualizados após mutação

**Solução**: Invalidar queries após mutation:
```typescript
const mutation = useMutation({
  mutationFn: updateData,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['data'] })
  },
})
```

---

## 📚 Referências

- [React Query - Migrating from SWR](https://tanstack.com/query/latest/docs/framework/react/guides/migrating-from-swr)
- [Next.js - Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Patterns for Data Fetching](https://kentcdodds.com/blog/replace-axios-with-react-query)
