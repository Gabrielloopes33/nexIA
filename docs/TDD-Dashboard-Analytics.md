# TDD - Dashboard Analytics com Renderização Instantânea

| Field           | Value                                           |
| --------------- | ----------------------------------------------- |
| Tech Lead       | @DevTeam                                        |
| Product Manager | @Product                                        |
| Team            | Frontend Team                                   |
| Status          | Draft                                           |
| Created         | 2026-03-13                                      |
| Last Updated    | 2026-03-13                                      |

---

## Contexto

### Background

O dashboard de analytics é uma interface crítica para visualização de métricas de vendas, funil de conversão e performance de canais de comunicação. Atualmente, os usuários enfrentam tempos de carregamento elevados e experiência de usuário inconsistente durante o fetch de dados.

### Domain

Este projeto pertence ao domínio de **Sales Analytics** e **Business Intelligence**, focado em:
- Visualização de métricas de vendas em tempo real
- Análise de funil de conversão
- Performance de canais de aquisição (WhatsApp, Instagram, etc.)
- Recuperação de leads perdidos

### Stakeholders

- **Usuários finais**: Times de vendas e marketing que precisam monitorar métricas diariamente
- **Business**: Gestores que precisam de insights rápidos para tomada de decisão
- **Produto**: Equipe que precisa de dados para priorização de features

---

## Problema & Motivação

### Problemas que Estamos Resolvendo

1. **Loading states inconsistentes**: Cards carregam em momentos diferentes, criando layout shift e experiência ruim
   - *Impacto*: Usuários perdem contexto durante o carregamento; métricas parecem "piscar" na tela

2. **Tempo de percepção de carregamento alto**: Sem skeleton loading, usuários não sabem se a página está respondendo
   - *Impacto*: Aumento de bounce rate; usuários acham que a página travou

3. **Layout instável durante fetch**: Cards aparecem de forma desorganizada conforme dados chegam
   - *Impacto*: Alto CLS (Cumulative Layout Shift), prejudicando SEO e UX

### Por Que Agora?

- **Driver de negócio**: Novo quarter começando, times precisam de métricas confiáveis para planning
- **Driver técnico**: Atual arquitetura não suporta streaming de dados; necessidade de modernização
- **Driver de usuário**: Feedback consistente sobre lentidão percebida no dashboard atual

### Impacto de NÃO Resolver

- **Business**: Perda de produtividade do time comercial (estimado 15 min/dia por usuário esperando)
- **Técnico**: Acúmulo de dívida técnica; cada novo card repete os problemas de loading
- **Usuários**: Frustração crescente; possível migração para ferramentas externas de analytics

---

## Escopo

### ✅ In Scope (V1 - MVP)

- Layout responsivo com Sidebar (280px), KPIs Verticais (100px), Grid Principal e Contact Panel slide
- 6 tipos de cards com renderização instantânea + skeleton:
  1. Funil por Etapa (2fr)
  2. Recuperação de Perdidos (1fr)
  3. Performance por Canal (1fr)
  4. Motivos de Perda (1fr)
  5. Receita Semanal - Gráfico de linha (3fr)
  6. Health Score - Círculo 0-100 (1fr)
- 5 KPIs Verticais com loading states independentes
- Sistema de skeleton loading reutilizável
- Estado global com React Query para caching
- Animações suaves de entrada (CSS transitions)

### ❌ Out of Scope (V1)

- Real-time updates via WebSocket (dados estáticos com refresh manual)
- Filtros dinâmicos por período (usar período fixo: "últimos 30 dias")
- Exportação de relatórios (PDF/Excel)
- Dark mode (apenas tema claro por enquanto)
- Responsividade mobile completa (desktop-first)
- Internacionalização (apenas pt-BR)

### 🔮 Future Considerations (V2+)

- Real-time updates com Server-Sent Events
- Filtros avançados por data, time, região
- Drill-down em gráficos (clicar para detalhes)
- Customização de dashboard (reordenar cards)
- PWA com offline support

---

## Solução Técnica

### Visão Geral da Arquitetura

O dashboard utiliza uma arquitetura **component-based** com separação clara entre:

1. **Data Layer**: React Query para fetching, caching e estado de loading
2. **Presentation Layer**: Componentes puros com props de dados + estado de loading
3. **Skeleton Layer**: Componentes de placeholder que espelham o layout final
4. **Layout Layer**: Grid system com CSS Grid para estrutura fixa

**Princípios**:
- **Instant Render**: Todos os cards aparecem imediatamente em estado skeleton
- **Independent Loading**: Cada card gerencia seu próprio estado de carregamento
- **Zero Layout Shift**: Dimensões fixas garantem estabilidade visual

### Estrutura de Pastas

```
app/
├── (dashboard)/
│   ├── layout.tsx                 # Layout principal com Sidebar + KPIs + Grid
│   ├── page.tsx                   # Página do dashboard
│   ├── loading.tsx                # Loading global (fallback)
│   └── error.tsx                  # Error boundary
├── api/
│   └── dashboard/
│       ├── funnel/route.ts        # API: Dados do funil
│       ├── recovery/route.ts      # API: Recuperação de perdidos
│       ├── channels/route.ts      # API: Performance por canal
│       ├── loss-reasons/route.ts  # API: Motivos de perda
│       ├── revenue/route.ts       # API: Receita semanal
│       ├── health-score/route.ts  # API: Health score
│       └── kpis/route.ts          # API: KPIs verticais
components/
├── dashboard/
│   ├── layout/
│   │   ├── Sidebar.tsx            # Sidebar 280px
│   │   ├── KpiColumn.tsx          # Coluna vertical de KPIs
│   │   ├── DashboardGrid.tsx      # Grid principal dos cards
│   │   └── ContactPanel.tsx       # Painel lateral deslizante
│   ├── cards/
│   │   ├── FunnelCard.tsx         # Card: Funil por Etapa
│   │   ├── RecoveryCard.tsx       # Card: Recuperação de Perdidos
│   │   ├── ChannelsCard.tsx       # Card: Performance por Canal
│   │   ├── LossReasonsCard.tsx    # Card: Motivos de Perda
│   │   ├── RevenueCard.tsx        # Card: Receita Semanal
│   │   └── HealthScoreCard.tsx    # Card: Health Score
│   ├── kpis/
│   │   ├── KpiItem.tsx            # Item individual de KPI
│   │   └── KpiSkeleton.tsx        # Skeleton para KPI
│   └── skeletons/
│       ├── CardSkeleton.tsx       # Skeleton base reutilizável
│       ├── FunnelSkeleton.tsx     # Skeleton específico: Funil
│       ├── ChartSkeleton.tsx      # Skeleton específico: Gráficos
│       ├── CircleSkeleton.tsx     # Skeleton específico: Círculo
│       └── ListSkeleton.tsx       # Skeleton específico: Listas
hooks/
├── dashboard/
│   ├── useFunnelData.ts           # Hook: Dados do funil
│   ├── useRecoveryData.ts         # Hook: Recuperação
│   ├── useChannelsData.ts         # Hook: Canais
│   ├── useLossReasonsData.ts      # Hook: Motivos de perda
│   ├── useRevenueData.ts          # Hook: Receita
│   ├── useHealthScoreData.ts      # Hook: Health score
│   └── useKpisData.ts             # Hook: KPIs
lib/
├── dashboard/
│   ├── queries.ts                 # Configurações React Query
│   └── prefetch.ts                # Funções de prefetch
types/
├── dashboard.ts                   # Interfaces TypeScript do dashboard
└── api.ts                         # Tipos de resposta da API
```

### Layout & Grid System

```
┌─────────────────────────────────────────────────────────────────────┐
│                           APP HEADER                                │
├───────────┬───────────┬───────────────────────────────┬─────────────┤
│           │           │                               │             │
│  SIDEBAR  │   KPIs    │      MAIN CONTENT GRID        │   CONTACT   │
│   280px   │  100px    │                               │   PANEL     │
│           │  (fixed)  │  ┌─────────────────────┐      │  (slide)    │
│  [Logo]   │  [Lead]   │  │   FUNIL (2fr)       │      │             │
│  [Nav]    │  [Rev]    │  ├──────────┬──────────┤      │  [Contatos] │
│  [Nav]    │  [Conv]   │  │ RECOVERY │ CHANNELS │      │  [Chat]     │
│  [Nav]    │  [Pipe]   │  │   (1fr)  │   (1fr)  │      │             │
│  [Nav]    │  [Time]   │  ├──────────┴──────────┤      │             │
│           │           │  │   REVENUE (3fr)     │      │             │
│           │           │  ├──────────┬──────────┤      │             │
│           │           │  │  LOSS    │  HEALTH  │      │             │
│           │           │  │ REASONS  │  SCORE   │      │             │
│           │           │  │   (1fr)  │   (1fr)  │      │             │
│           │           │  └──────────┴──────────┘      │             │
└───────────┴───────────┴───────────────────────────────┴─────────────┘
```

**Grid Configuration**:
- Main Grid: CSS Grid com `grid-template-columns: 280px 100px 1fr 320px`
- Cards Grid: `grid-template-columns: repeat(3, 1fr)` com spans para tamanhos diferentes
- Gap consistente: 24px entre cards

---

## Interfaces TypeScript

### Core Types

```typescript
// types/dashboard.ts

// ============================================
// BASE TYPES
// ============================================

export interface LoadingState {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export interface CardBaseProps {
  className?: string;
}

export interface CardWithLoadingProps extends CardBaseProps {
  isLoading?: boolean;
}

// ============================================
// FUNNEL TYPES
// ============================================

export interface FunnelStage {
  id: string;
  name: string;
  count: number;
  percentage: number;  // % em relação ao estágio anterior
  conversionRate: number;  // % em relação ao primeiro estágio
  color: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: number;
}

export interface FunnelData {
  stages: FunnelStage[];
  totalLeads: number;
  totalConversions: number;
  globalConversionRate: number;
  period: string;
}

// ============================================
// RECOVERY TYPES
// ============================================

export interface RecoverableLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  lostStage: string;
  lostDate: string;
  potentialValue: number;
  recoveryProbability: number;  // 0-100
  lastContactDate: string;
  reason: string;
}

export interface RecoveryData {
  leads: RecoverableLead[];
  totalCount: number;
  totalPotentialValue: number;
  avgRecoveryProbability: number;
  period: string;
}

// ============================================
// CHANNELS TYPES
// ============================================

export type ChannelType = 'whatsapp' | 'instagram' | 'email' | 'phone' | 'website' | 'referral';

export interface ChannelPerformance {
  channel: ChannelType;
  leadsGenerated: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  avgResponseTime: number;  // em minutos
  trend: 'up' | 'down' | 'neutral';
  trendValue: number;
  color: string;
}

export interface ChannelsData {
  channels: ChannelPerformance[];
  topChannel: ChannelType;
  totalLeads: number;
  totalRevenue: number;
  period: string;
}

// ============================================
// LOSS REASONS TYPES
// ============================================

export interface LossReason {
  id: string;
  reason: string;
  count: number;
  percentage: number;
  estimatedRevenueLost: number;
  trend: 'up' | 'down' | 'neutral';
  color: string;
}

export interface LossReasonsData {
  reasons: LossReason[];
  totalLost: number;
  totalRevenueLost: number;
  topReason: string;
  period: string;
}

// ============================================
// REVENUE TYPES
// ============================================

export interface WeeklyRevenue {
  week: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  revenue: number;
  target: number;
  dealsClosed: number;
}

export interface RevenueData {
  weeks: WeeklyRevenue[];
  totalRevenue: number;
  totalTarget: number;
  achievementRate: number;
  avgDealValue: number;
  growthRate: number;  // % vs período anterior
  period: string;
}

// ============================================
// HEALTH SCORE TYPES
// ============================================

export interface HealthScoreBreakdown {
  category: string;
  score: number;
  weight: number;
  description: string;
}

export interface HealthScoreData {
  overallScore: number;  // 0-100
  previousScore: number;
  rating: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
  breakdown: HealthScoreBreakdown[];
  lastUpdated: string;
}

// ============================================
// KPI TYPES
// ============================================

export type KpiId = 'weekly-leads' | 'closed-revenue' | 'conversion-rate' | 'pipeline-value' | 'avg-conversion-time';

export interface KpiData {
  id: KpiId;
  label: string;
  value: number;
  previousValue: number;
  change: number;  // % change
  changeType: 'positive' | 'negative' | 'neutral';
  format: 'number' | 'currency' | 'percentage' | 'duration';
  prefix?: string;
  suffix?: string;
  trend: 'up' | 'down' | 'neutral';
}

export interface KpisData {
  kpis: KpiData[];
  lastUpdated: string;
}
```

### API Response Types

```typescript
// types/api.ts

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    timestamp: string;
    version: string;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Specific API response types
export type FunnelApiResponse = ApiResponse<FunnelData>;
export type RecoveryApiResponse = ApiResponse<RecoveryData>;
export type ChannelsApiResponse = ApiResponse<ChannelsData>;
export type LossReasonsApiResponse = ApiResponse<LossReasonsData>;
export type RevenueApiResponse = ApiResponse<RevenueData>;
export type HealthScoreApiResponse = ApiResponse<HealthScoreData>;
export type KpisApiResponse = ApiResponse<KpisData>;
```

---

## Estratégia de Skeleton Loading

### Bibliotecas Recomendadas

| Biblioteca | Propósito | Versão |
|------------|-----------|--------|
| **@radix-ui/react-slot** | Composição de componentes | Latest |
| **class-variance-authority** | Variantes de estilo type-safe | Latest |
| **tailwind-merge** | Merge de classes Tailwind | Latest |
| **framer-motion** | Animações de entrada/saída | Latest |

### Abordagem: CSS Skeleton com Shimmer

Em vez de usar bibliotecas pesadas, usaremos **CSS puro com Tailwind** para criar skeletons leves e customizáveis:

```css
/* styles/skeleton.css */
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.skeleton-shimmer {
  position: relative;
  overflow: hidden;
}

.skeleton-shimmer::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
  animation: shimmer 1.5s infinite;
}
```

### Componente Base CardSkeleton

```typescript
// components/dashboard/skeletons/CardSkeleton.tsx

import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const cardSkeletonVariants = cva(
  // Base styles
  'bg-gray-100 rounded-lg skeleton-shimmer',
  {
    variants: {
      size: {
        default: 'p-6',
        compact: 'p-4',
        large: 'p-8',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

interface CardSkeletonProps extends VariantProps<typeof cardSkeletonVariants> {
  className?: string;
  header?: boolean;
  rows?: number;
}

export function CardSkeleton({ 
  className, 
  size, 
  header = true, 
  rows = 3 
}: CardSkeletonProps) {
  return (
    <div className={cn(cardSkeletonVariants({ size }), className)}>
      {/* Header */}
      {header && (
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-1/3 bg-gray-200 rounded" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
      )}
      
      {/* Content rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div 
            key={i} 
            className={cn(
              'h-4 bg-gray-200 rounded',
              i === rows - 1 ? 'w-2/3' : 'w-full'
            )} 
          />
        ))}
      </div>
    </div>
  );
}
```

### Skeletons Específicos por Card

```typescript
// components/dashboard/skeletons/FunnelSkeleton.tsx

export function FunnelSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-40 bg-gray-100 rounded skeleton-shimmer" />
        <div className="h-4 w-24 bg-gray-100 rounded skeleton-shimmer" />
      </div>
      
      {/* Funnel visualization */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div 
            key={i}
            className="flex items-center gap-3"
            style={{ paddingLeft: `${i * 12}px` }}
          >
            <div 
              className="h-10 bg-gray-100 rounded skeleton-shimmer"
              style={{ width: `${100 - i * 15}%` }}
            />
            <div className="h-4 w-12 bg-gray-100 rounded skeleton-shimmer flex-shrink-0" />
          </div>
        ))}
      </div>
      
      {/* Footer stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 w-16 bg-gray-100 rounded skeleton-shimmer mb-2" />
            <div className="h-6 w-20 bg-gray-100 rounded skeleton-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

```typescript
// components/dashboard/skeletons/ChartSkeleton.tsx

export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-48 bg-gray-100 rounded skeleton-shimmer" />
        <div className="flex gap-2">
          <div className="h-8 w-20 bg-gray-100 rounded skeleton-shimmer" />
          <div className="h-8 w-20 bg-gray-100 rounded skeleton-shimmer" />
        </div>
      </div>
      
      {/* Chart area */}
      <div className="h-64 bg-gray-50 rounded-lg skeleton-shimmer relative overflow-hidden">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between py-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-px bg-gray-200 w-full" />
          ))}
        </div>
        {/* Placeholder bars/lines */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div 
              key={i}
              className="w-full bg-gray-200 rounded-t skeleton-shimmer"
              style={{ height: `${Math.random() * 60 + 20}%` }}
            />
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-100 skeleton-shimmer" />
            <div className="h-4 w-20 bg-gray-100 rounded skeleton-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

```typescript
// components/dashboard/skeletons/CircleSkeleton.tsx

export function CircleSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 h-full flex flex-col">
      {/* Header */}
      <div className="h-6 w-32 bg-gray-100 rounded skeleton-shimmer mb-6" />
      
      {/* Circle */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          {/* Outer circle */}
          <div className="w-32 h-32 rounded-full bg-gray-100 skeleton-shimmer" />
          {/* Inner content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="h-8 w-16 bg-gray-200 rounded skeleton-shimmer mx-auto mb-2" />
              <div className="h-4 w-10 bg-gray-200 rounded skeleton-shimmer mx-auto" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-4 text-center">
        <div className="h-4 w-24 bg-gray-100 rounded skeleton-shimmer mx-auto" />
      </div>
    </div>
  );
}
```

---

## Estrutura de Estado

### React Query Configuration

```typescript
// lib/dashboard/queries.ts

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 minutos
      gcTime: 1000 * 60 * 30,         // 30 minutos (antigo cacheTime)
      retry: 2,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

// Query keys para organização
export const dashboardKeys = {
  all: ['dashboard'] as const,
  funnel: () => [...dashboardKeys.all, 'funnel'] as const,
  recovery: () => [...dashboardKeys.all, 'recovery'] as const,
  channels: () => [...dashboardKeys.all, 'channels'] as const,
  lossReasons: () => [...dashboardKeys.all, 'loss-reasons'] as const,
  revenue: () => [...dashboardKeys.all, 'revenue'] as const,
  healthScore: () => [...dashboardKeys.all, 'health-score'] as const,
  kpis: () => [...dashboardKeys.all, 'kpis'] as const,
};
```

### Custom Hooks

```typescript
// hooks/dashboard/useFunnelData.ts

import { useQuery } from '@tanstack/react-query';
import { dashboardKeys } from '@/lib/dashboard/queries';
import { FunnelData } from '@/types/dashboard';

async function fetchFunnelData(): Promise<FunnelData> {
  const response = await fetch('/api/dashboard/funnel');
  if (!response.ok) {
    throw new Error('Failed to fetch funnel data');
  }
  const data = await response.json();
  return data.data;
}

export function useFunnelData() {
  return useQuery({
    queryKey: dashboardKeys.funnel(),
    queryFn: fetchFunnelData,
  });
}
```

```typescript
// hooks/dashboard/useRevenueData.ts

import { useQuery } from '@tanstack/react-query';
import { dashboardKeys } from '@/lib/dashboard/queries';
import { RevenueData } from '@/types/dashboard';

async function fetchRevenueData(): Promise<RevenueData> {
  const response = await fetch('/api/dashboard/revenue');
  if (!response.ok) {
    throw new Error('Failed to fetch revenue data');
  }
  const data = await response.json();
  return data.data;
}

export function useRevenueData() {
  return useQuery({
    queryKey: dashboardKeys.revenue(),
    queryFn: fetchRevenueData,
  });
}
```

### Prefetch Strategy (Server-Side)

```typescript
// lib/dashboard/prefetch.ts

import { queryClient, dashboardKeys } from './queries';

export async function prefetchDashboardData() {
  // Prefetch all dashboard data on server
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: dashboardKeys.funnel(),
      queryFn: () => fetch(`${process.env.API_URL}/dashboard/funnel`).then(r => r.json()),
    }),
    queryClient.prefetchQuery({
      queryKey: dashboardKeys.kpis(),
      queryFn: () => fetch(`${process.env.API_URL}/dashboard/kpis`).then(r => r.json()),
    }),
    // ... prefetch outros dados críticos
  ]);
}
```

---

## Exemplo de Implementação Completa

### Card: Funil por Etapa

```typescript
// components/dashboard/cards/FunnelCard.tsx

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FunnelData } from '@/types/dashboard';
import { useFunnelData } from '@/hooks/dashboard/useFunnelData';
import { FunnelSkeleton } from '@/components/dashboard/skeletons/FunnelSkeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn, formatNumber, formatPercentage } from '@/lib/utils';

interface FunnelCardProps {
  className?: string;
}

export function FunnelCard({ className }: FunnelCardProps) {
  const { data, isLoading, isError } = useFunnelData();

  // Render skeleton durante loading
  if (isLoading) {
    return (
      <div className={cn('h-full', className)}>
        <FunnelSkeleton />
      </div>
    );
  }

  // Render error state
  if (isError || !data) {
    return (
      <Card className={cn('h-full', className)}>
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-red-500">Erro ao carregar dados do funil</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Funil por Etapa</CardTitle>
        <span className="text-sm text-muted-foreground">{data.period}</span>
      </CardHeader>
      
      <CardContent>
        {/* Funnel Visualization */}
        <div className="space-y-2">
          {data.stages.map((stage, index) => (
            <FunnelStageRow 
              key={stage.id} 
              stage={stage} 
              index={index}
              totalStages={data.stages.length}
            />
          ))}
        </div>

        {/* Footer Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <StatBox 
            label="Total Leads" 
            value={formatNumber(data.totalLeads)} 
          />
          <StatBox 
            label="Conversões" 
            value={formatNumber(data.totalConversions)} 
          />
          <StatBox 
            label="Taxa Global" 
            value={formatPercentage(data.globalConversionRate)}
            highlight
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Sub-component: Funnel Stage Row
function FunnelStageRow({ 
  stage, 
  index,
  totalStages 
}: { 
  stage: FunnelData['stages'][0]; 
  index: number;
  totalStages: number;
}) {
  const widthPercent = 100 - (index * (60 / totalStages));
  
  return (
    <div className="flex items-center gap-3">
      <div 
        className="flex items-center gap-2 transition-all duration-500"
        style={{ width: `${widthPercent}%` }}
      >
        <div 
          className="h-10 rounded-md flex items-center px-3 text-sm font-medium text-white"
          style={{ 
            backgroundColor: stage.color,
            width: '100%'
          }}
        >
          <span className="truncate">{stage.name}</span>
          <span className="ml-auto">{formatNumber(stage.count)}</span>
        </div>
      </div>
      
      {/* Conversion rate */}
      <div className="flex items-center gap-1 text-sm">
        <span className="font-semibold">{formatPercentage(stage.conversionRate)}</span>
        <TrendIndicator trend={stage.trend} value={stage.trendValue} />
      </div>
    </div>
  );
}

// Sub-component: Trend Indicator
function TrendIndicator({ 
  trend, 
  value 
}: { 
  trend: 'up' | 'down' | 'neutral'; 
  value: number;
}) {
  if (trend === 'neutral') {
    return <Minus className="w-4 h-4 text-gray-400" />;
  }
  
  const isPositive = trend === 'up';
  const Icon = isPositive ? TrendingUp : TrendingDown;
  
  return (
    <div className={cn(
      'flex items-center gap-0.5 text-xs',
      isPositive ? 'text-green-600' : 'text-red-600'
    )}>
      <Icon className="w-3 h-3" />
      <span>{value}%</span>
    </div>
  );
}

// Sub-component: Stat Box
function StatBox({ 
  label, 
  value, 
  highlight = false 
}: { 
  label: string; 
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={cn(
        'text-lg font-bold',
        highlight && 'text-primary'
      )}>
        {value}
      </p>
    </div>
  );
}
```

### KPI Vertical Item

```typescript
// components/dashboard/kpis/KpiItem.tsx

'use client';

import { KpiData } from '@/types/dashboard';
import { cn, formatCurrency, formatNumber, formatPercentage, formatDuration } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { KpiSkeleton } from './KpiSkeleton';

interface KpiItemProps {
  kpi?: KpiData;
  isLoading?: boolean;
}

export function KpiItem({ kpi, isLoading = false }: KpiItemProps) {
  if (isLoading) {
    return <KpiSkeleton />;
  }

  if (!kpi) {
    return null;
  }

  const formattedValue = formatKpiValue(kpi);
  const TrendIcon = getTrendIcon(kpi.trend);
  const trendColor = getTrendColor(kpi.trend, kpi.changeType);

  return (
    <div className="flex flex-col items-center justify-center p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors">
      <span className="text-xs text-muted-foreground text-center mb-1">
        {kpi.label}
      </span>
      
      <span className="text-lg font-bold text-foreground">
        {formattedValue}
      </span>
      
      <div className={cn('flex items-center gap-1 text-xs mt-1', trendColor)}>
        <TrendIcon className="w-3 h-3" />
        <span>{Math.abs(kpi.change)}%</span>
      </div>
    </div>
  );
}

function formatKpiValue(kpi: KpiData): string {
  const { value, format, prefix, suffix } = kpi;
  
  switch (format) {
    case 'currency':
      return formatCurrency(value);
    case 'percentage':
      return formatPercentage(value);
    case 'duration':
      return formatDuration(value);
    case 'number':
    default:
      return `${prefix || ''}${formatNumber(value)}${suffix || ''}`;
  }
}

function getTrendIcon(trend: KpiData['trend']) {
  switch (trend) {
    case 'up':
      return TrendingUp;
    case 'down':
      return TrendingDown;
    default:
      return Minus;
  }
}

function getTrendColor(trend: KpiData['trend'], changeType: KpiData['changeType']) {
  // Se o changeType é 'positive', verde independente da direção
  // Se é 'negative', vermelho independente da direção
  if (changeType === 'positive') return 'text-green-600';
  if (changeType === 'negative') return 'text-red-600';
  
  // Caso neutro, usar direção do trend
  switch (trend) {
    case 'up':
      return 'text-green-600';
    case 'down':
      return 'text-red-600';
    default:
      return 'text-gray-400';
  }
}
```

```typescript
// components/dashboard/kpis/KpiSkeleton.tsx

export function KpiSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center p-4 border-b">
      <div className="h-3 w-20 bg-gray-100 rounded skeleton-shimmer mb-2" />
      <div className="h-6 w-16 bg-gray-100 rounded skeleton-shimmer mb-1" />
      <div className="h-3 w-10 bg-gray-100 rounded skeleton-shimmer" />
    </div>
  );
}
```

### Layout Principal

```typescript
// app/(dashboard)/layout.tsx

import { Sidebar } from '@/components/dashboard/layout/Sidebar';
import { KpiColumn } from '@/components/dashboard/layout/KpiColumn';
import { ContactPanel } from '@/components/dashboard/layout/ContactPanel';
import { DashboardGrid } from '@/components/dashboard/layout/DashboardGrid';
import { prefetchDashboardData } from '@/lib/dashboard/prefetch';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

export default async function DashboardLayout() {
  // Prefetch dados críticos no servidor
  await prefetchDashboardData();
  
  return (
    <HydrationBoundary state={dehydrate(prefetchDashboardData)}>
      <div className="min-h-screen bg-gray-50">
        {/* App Header */}
        <header className="h-16 bg-white border-b px-6 flex items-center">
          <h1 className="text-xl font-semibold">Dashboard Analytics</h1>
        </header>
        
        {/* Main Layout */}
        <div className="flex">
          {/* Sidebar - 280px */}
          <aside className="w-[280px] flex-shrink-0">
            <Sidebar />
          </aside>
          
          {/* KPI Column - 100px */}
          <div className="w-[100px] flex-shrink-0 bg-white border-r">
            <KpiColumn />
          </div>
          
          {/* Main Content */}
          <main className="flex-1 p-6">
            <DashboardGrid />
          </main>
          
          {/* Contact Panel - Slide */}
          <ContactPanel />
        </div>
      </div>
    </HydrationBoundary>
  );
}
```

```typescript
// components/dashboard/layout/DashboardGrid.tsx

'use client';

import { FunnelCard } from '@/components/dashboard/cards/FunnelCard';
import { RecoveryCard } from '@/components/dashboard/cards/RecoveryCard';
import { ChannelsCard } from '@/components/dashboard/cards/ChannelsCard';
import { LossReasonsCard } from '@/components/dashboard/cards/LossReasonsCard';
import { RevenueCard } from '@/components/dashboard/cards/RevenueCard';
import { HealthScoreCard } from '@/components/dashboard/cards/HealthScoreCard';

export function DashboardGrid() {
  return (
    <div className="grid grid-cols-3 gap-6 auto-rows-min">
      {/* Row 1: Funnel (2fr) + Recovery (1fr) */}
      <div className="col-span-2 row-span-1">
        <FunnelCard className="h-[320px]" />
      </div>
      <div className="col-span-1 row-span-1">
        <RecoveryCard className="h-[320px]" />
      </div>
      
      {/* Row 2: Channels (1fr) - span 1 */}
      <div className="col-span-1">
        <ChannelsCard className="h-[280px]" />
      </div>
      
      {/* Row 3: Revenue (3fr) - full width */}
      <div className="col-span-3">
        <RevenueCard className="h-[360px]" />
      </div>
      
      {/* Row 4: Loss Reasons (1fr) + Health Score (1fr) */}
      <div className="col-span-1">
        <LossReasonsCard className="h-[280px]" />
      </div>
      <div className="col-span-1 col-start-3">
        <HealthScoreCard className="h-[280px]" />
      </div>
    </div>
  );
}
```

---

## Utility Functions

```typescript
// lib/utils.ts (extensões para dashboard)

/**
 * Formata número com separadores de milhar
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

/**
 * Formata valor como moeda (BRL)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata valor como percentual
 */
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

/**
 * Formata duração em dias
 */
export function formatDuration(days: number): string {
  if (days < 1) {
    const hours = Math.round(days * 24);
    return `${hours}h`;
  }
  return `${Math.round(days)} dias`;
}
```

---

## Riscos

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Layout shift em telas pequenas | Médio | Alta | Definir alturas mínimas fixas para todos os cards; testar em múltiplas resoluções |
| Sobrecarga de requisições paralelas | Médio | Média | Implementar Request Deduplication do React Query; considerar DataLoader pattern |
| Skeleton não corresponder ao layout real | Baixo | Média | Manter skeletons atualizados junto com os cards; usar screenshot testing |
| Performance degradada com muitos dados | Alto | Baixa | Implementar virtualização para listas longas; paginação server-side |
| Inconsistência de cache entre cards | Médio | Média | Usar queryKey consistentes; invalidação seletiva por feature |

---

## Plano de Implementação

| Fase | Tarefa | Descrição | Estimativa |
|------|--------|-----------|------------|
| **Fase 1 - Setup** | Configurar React Query | Setup do QueryClient, provider, devtools | 2h |
| | Criar tipos TypeScript | Interfaces para todos os dados do dashboard | 2h |
| | Setup Tailwind skeleton | CSS animations, base classes | 1h |
| **Fase 2 - Core** | CardSkeleton component | Componente base reutilizável | 2h |
| | Skeletons específicos | Funnel, Chart, Circle, List | 3h |
| | Utility functions | formatNumber, formatCurrency, etc. | 1h |
| **Fase 3 - Layout** | Sidebar component | 280px fixed sidebar | 2h |
| | KpiColumn component | Coluna vertical de KPIs | 2h |
| | DashboardGrid | Grid system principal | 2h |
| | ContactPanel | Slide panel | 2h |
| **Fase 4 - Cards** | FunnelCard + hook | Card de funil com dados | 3h |
| | RecoveryCard + hook | Recuperação de perdidos | 2h |
| | ChannelsCard + hook | Performance por canal | 2h |
| | LossReasonsCard + hook | Motivos de perda | 2h |
| | RevenueCard + hook | Gráfico de receita | 3h |
| | HealthScoreCard + hook | Health score | 2h |
| **Fase 5 - API** | Mock endpoints | Criar APIs com dados mockados | 3h |
| **Fase 6 - Polish** | Animações | Framer Motion transitions | 2h |
| | Error states | Estados de erro para todos os cards | 2h |
| | Testes | Testes dos hooks e componentes | 4h |

**Estimativa Total**: ~40 horas (1 semana)

---

## Dependências

| Pacote | Versão | Propósito |
|--------|--------|-----------|
| @tanstack/react-query | ^5.x | Data fetching, caching, estado de loading |
| @tanstack/react-query-devtools | ^5.x | Devtools para debug |
| framer-motion | ^11.x | Animações de entrada/saída |
| class-variance-authority | ^0.7.x | Variantes de componentes type-safe |
| clsx | ^2.x | Condicional de classes |
| tailwind-merge | ^2.x | Merge de classes Tailwind |
| lucide-react | ^0.x | Ícones |
| recharts | ^2.x | Gráficos (Receita Semanal) |

---

## Checklist de Validação

- [ ] Todos os cards renderizam imediatamente com skeleton
- [ ] Cada card tem loading state independente
- [ ] Sem layout shift durante carregamento
- [ ] Animações suaves de entrada
- [ ] Estados de erro implementados
- [ ] Alturas fixas garantem estabilidade
- [ ] TypeScript strict mode passa
- [ ] Testes dos hooks passam
- [ ] Lighthouse CLS < 0.1

---

## Open Questions

| # | Questão | Status |
|---|---------|--------|
| 1 | Usar SWR ao invés de React Query? | 🔴 Open |
| 2 | Biblioteca de gráficos: Recharts vs Chart.js? | 🔴 Open |
| 3 | Necessário virtualização para listas? | 🟡 V2 |
| 4 | Real-time updates na V1? | 🟡 V2 |

---

## Referências

- [React Query Best Practices](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Tailwind CSS Skeleton Patterns](https://tailwindcss.com/docs/animation#pulse)
- [CSS Grid Layout Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [Core Web Vitals - CLS](https://web.dev/cls/)
