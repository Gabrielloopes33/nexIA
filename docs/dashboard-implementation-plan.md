# Plano de Implementação - Novo Dashboard

## 📋 Visão Geral

**Projeto:** Implementação de novo layout de dashboard com 6 cards específicos, sistema de skeleton loading e integração completa com Prisma/Supabase.

**Stack Tecnológica:**
- Next.js 16+ (App Router)
- React 18+
- TypeScript
- Prisma ORM
- Supabase
- Recharts (gráficos)
- SWR/React Query (data fetching)
- Tailwind CSS
- shadcn/ui

**Tecnologias já disponíveis:**
- ✅ Recharts instalado
- ✅ SWR instalado (usado em hooks existentes)
- ✅ Sistema de skeleton básico
- ✅ Componentes de chart existentes
- ✅ API routes de dashboard base
- ✅ Schema Prisma completo

---

## 📅 Cronograma Total

| Sprint | Duração | Período Estimado | Foco |
|--------|---------|------------------|------|
| Sprint 1 | 3 dias | Semana 1 (Seg-Qui) | Fundação |
| Sprint 2 | 3 dias | Semana 1 (Sex-Seg) | Dados e API |
| Sprint 3 | 4 dias | Semana 2 (Ter-Sex) | Cards Principais |
| Sprint 4 | 4 dias | Semana 3 (Seg-Qui) | Cards Finais |
| Sprint 5 | 2 dias | Semana 3 (Sex-Sab) | Polish |

**Total: 16 dias úteis (~3 semanas e 2 dias)**

---

## 🎯 SPRINT 1 - Fundação (3 dias)

### Objetivo
Estabelecer a base estrutural do novo dashboard com layout ajustado, componentes base e setup de data fetching.

### Tarefas

#### Dia 1: Estrutura e Sidebar
**Arquivos a criar/modificar:**
```
components/
├── dashboard/
│   ├── DashboardCard.tsx          # NOVO - Card container base
│   ├── DashboardGrid.tsx          # NOVO - Grid layout principal
│   ├── DashboardSkeleton.tsx      # NOVO - Skeleton loading system
│   └── index.ts                   # NOVO - Barrel export
```

**Modificações:**
```
components/sidebar.tsx             # MODIFICAR - Aumentar width 220→280px
app/dashboard/page.tsx             # MODIFICAR - Novo layout estrutural
```

**Critérios de aceitação:**
- [ ] Sidebar renderizando com 280px de largura
- [ ] Layout base com coluna de KPIs (100px) + grid principal
- [ ] Nenhum erro de compilação
- [ ] Responsividade básica mantida

**Dependências:** Nenhuma (base)

---

#### Dia 2: Componentes Base e KPIs
**Arquivos a criar/modificar:**
```
components/
├── dashboard/
│   ├── kpi/
│   │   ├── KpiColumn.tsx          # NOVO - Coluna vertical de KPIs
│   │   ├── KpiCard.tsx            # NOVO - Card individual de KPI
│   │   └── KpiSkeleton.tsx        # NOVO - Skeleton para KPI
├── hooks/
│   └── use-dashboard-new.ts       # NOVO - Hook unificado (preparação)
```

**Modificações:**
```
app/dashboard/page.tsx             # MODIFICAR - Integrar KPIs verticais
```

**Critérios de aceitação:**
- [ ] Coluna de KPIs verticais renderizando com dados mock
- [ ] 4 KPIs visíveis: Receita, Ticket Médio, Conversão, Conversas
- [ ] Animação de hover nos cards
- [ ] Valores formatados corretamente

**Dependências:** Tarefa do Dia 1

---

#### Dia 3: Setup React Query + Types
**Arquivos a criar/modificar:**
```
lib/
├── dashboard/
│   ├── types.ts                   # NOVO - Tipagens do dashboard
│   ├── constants.ts               # NOVO - Constantes (períodos, cores)
│   └── utils.ts                   # NOVO - Helpers de cálculo
├── hooks/
│   └── use-dashboard-metrics.ts   # NOVO - Hook base de métricas
```

**Modificações:**
```
lib/providers.tsx                 # MODIFICAR - Adicionar QueryProvider (se necessário)
```

**Critérios de aceitação:**
- [ ] Tipagens TypeScript completas definidas
- [ ] Hook base funcionando com dados mock
- [ ] Estados de loading/error implementados
- [ ] Cache configurado (staleTime de 30s)

**Dependências:** Tarefa do Dia 2

### Riscos Técnicos - Sprint 1
| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Conflitos com layout existente | Média | Alto | Manter página antiga como `/dashboard-old` até validação |
| Responsividade quebrada | Baixa | Médio | Testar breakpoints 320px, 768px, 1024px, 1440px |
| Hidratação incorreta | Média | Alto | Usar `mounted` checks como no Sidebar existente |

---

## 🎯 SPRINT 2 - Dados e API (3 dias)

### Objetivo
Criar endpoints de API robustos e hooks de data fetching para cada métrica do dashboard.

### Tarefas

#### Dia 1: Schema e Migrations
**Análise prévia:** O schema Prisma já possui:
- `Deal` com status (OPEN, WON, LOST), amount, source, stageId
- `PipelineStage` com probabilidade e posição
- `Contact` com source, tags, leadScore
- `Conversation` com type, status, createdAt
- `IntegrationActivityLog` com métricas de canal

**Arquivos a criar/modificar:**
```
prisma/
├── schema.prisma                  # VERIFICAR - Adicionar campos se necessário
├── migrations/                    # Criar se houver alterações
```

**Possíveis alterações no schema:**
```prisma
// Adicionar ao Deal se não existir:
model Deal {
  // ... campos existentes
  lostReason  String?  @map("lost_reason")  // Motivo da perda
  closedLostAt DateTime? @map("closed_lost_at")
}
```

**Critérios de aceitação:**
- [ ] Schema validado e compatível com queries necessárias
- [ ] Campos de lostReason e timestamps de fechamento disponíveis
- [ ] Índices otimizados para queries de agregação

**Dependências:** Sprint 1 completa

---

#### Dia 2: API Routes - Parte 1
**Arquivos a criar/modificar:**
```
app/api/dashboard/
├── funnel/route.ts                # NOVO - Dados do funil por etapa
├── lost-deals/route.ts            # NOVO - Deals perdidos para recuperação
└── channel-performance/route.ts   # NOVO - Performance por canal
```

**Estrutura das APIs:**
```typescript
// GET /api/dashboard/funnel?organizationId=xxx&period=30d
interface FunnelResponse {
  stages: Array<{
    id: string
    name: string
    count: number
    value: number
    conversionRate: number
    avgTimeInStage: number // em dias
  }>
  totalValue: number
  totalDeals: number
}

// GET /api/dashboard/lost-deals?organizationId=xxx&limit=10
interface LostDealsResponse {
  deals: Array<{
    id: string
    title: string
    contactName: string
    value: number
    lostReason: string
    lostAt: string
    recoverable: boolean // baseado em regras de negócio
  }>
  totalLost: number
  recoverableValue: number
}

// GET /api/dashboard/channel-performance?organizationId=xxx&period=30d
interface ChannelPerformanceResponse {
  channels: Array<{
    name: string
    leads: number
    conversions: number
    conversionRate: number
    revenue: number
  }>
}
```

**Critérios de aceitação:**
- [ ] APIs retornando dados reais do banco
- [ ] Query params validados (organizationId obrigatório)
- [ ] Tratamento de erros com mensagens claras
- [ ] Performance < 500ms para cada endpoint

**Dependências:** Schema validado

---

#### Dia 3: API Routes - Parte 2 + Hooks
**Arquivos a criar/modificar:**
```
app/api/dashboard/
├── loss-reasons/route.ts          # NOVO - Motivos de perda (groupBy)
├── weekly-revenue/route.ts        # NOVO - Receita semanal
└── health-score/route.ts          # NOVO - Cálculo complexo de health

hooks/
├── use-dashboard-funnel.ts        # NOVO
├── use-lost-deals.ts              # NOVO
├── use-channel-performance.ts     # NOVO
├── use-loss-reasons.ts            # NOVO
├── use-weekly-revenue.ts          # NOVO
└── use-health-score.ts            # NOVO
```

**Health Score - Algoritmo base:**
```typescript
interface HealthScoreParams {
  // Componentes do score (0-100 cada)
  pipelineVelocity: number      // Velocidade média no funil
  conversionRate: number        // Taxa de conversão geral
  responseTime: number          // Tempo médio de resposta
  engagementRate: number        // Taxa de engajamento
  revenueGrowth: number         // Crescimento de receita
}

// Fórmula: weighted average
// pipelineVelocity * 0.25 + conversionRate * 0.30 + 
// responseTime * 0.20 + engagementRate * 0.15 + revenueGrowth * 0.10
```

**Critérios de aceitação:**
- [ ] Todas as APIs testadas via curl/Postman
- [ ] Hooks retornando { data, isLoading, error }
- [ ] Cache SWR configurado com revalidateOnFocus: false
- [ ] Tipagens TypeScript exportadas

**Dependências:** APIs da Parte 1

### Riscos Técnicos - Sprint 2
| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Queries lentas no PostgreSQL | Média | Alto | Usar raw queries com índices, limitar a 90 dias |
| Cálculo de Health Score complexo | Alta | Médio | Implementar versão simplificada primeiro |
| Dados inconsistentes | Média | Médio | Seed de dados de teste robusto |

---

## 🎯 SPRINT 3 - Cards Principais (4 dias)

### Objetivo
Implementar os 3 primeiros cards com dados reais: Funil, Recuperação de Perdidos e Performance por Canal.

### Tarefas

#### Dia 1: Card Funil por Etapa
**Arquivos a criar/modificar:**
```
components/dashboard/cards/
├── FunnelChart.tsx                # NOVO - Gráfico de funil/etapas
├── FunnelStage.tsx                # NOVO - Componente de estágio individual
└── FunnelSkeleton.tsx             # NOVO - Skeleton do funil
```

**Funcionalidades:**
- Visualização de funil vertical
- Cada estágio mostra: nome, quantidade, valor total, taxa de conversão
- Drop-off entre estágios visível
- Cores progressivas (do mais claro ao mais escuro)
- Hover mostrando tempo médio no estágio

**Estrutura esperada:**
```typescript
interface FunnelStageData {
  id: string
  name: string
  count: number
  value: number
  conversionRate: number // % em relação ao estágio anterior
  dropOffRate: number    // % que saíram
  avgTimeInDays: number
  color: string
}
```

**Critérios de aceitação:**
- [ ] Funil renderizando com dados da API
- [ ] Drop-off calculado corretamente
- [ ] Tooltips informativos no hover
- [ ] Skeleton animado durante loading
- [ ] Estado vazio quando não há deals

---

#### Dia 2: Card Recuperação de Perdidos
**Arquivos a criar/modificar:**
```
components/dashboard/cards/
├── LostDealsRecovery.tsx          # NOVO - Lista de deals perdidos
├── LostDealItem.tsx               # NOVO - Item individual
├── LostDealsSkeleton.tsx          # NOVO - Skeleton da lista
└── RecoveryActionModal.tsx        # NOVO - Modal de ação de recuperação
```

**Funcionalidades:**
- Lista dos últimos 10 deals perdidos
- Colunas: Nome do lead, Valor, Motivo da perda, Data, Ação
- Badge "Recuperável" baseado em regras:
  - Perdido há menos de 30 dias
  - Valor > R$ 1000
  - Motivo diferente de "concorrente" (opcional)
- Botão "Recuperar" que abre modal com template de mensagem

**Critérios de aceitação:**
- [ ] Lista scrollável com máximo 5 itens visíveis
- [ ] Valor total recuperável destacado
- [ ] Filtro por motivo de perda
- [ ] Ação de recuperação funcional (simulada)

---

#### Dia 3: Card Performance por Canal
**Arquivos a criar/modificar:**
```
components/dashboard/cards/
├── ChannelPerformanceChart.tsx    # NOVO - Gráfico de barras
├── ChannelBar.tsx                 # NOVO - Barra individual
└── ChannelPerformanceSkeleton.tsx # NOVO - Skeleton
```

**Gráfico:** Barras verticais agrupadas por canal
- Eixo X: Canais (WhatsApp, Instagram, Orgânico, etc.)
- Eixo Y: Quantidade de leads
- Barras agrupadas: Leads / Conversões / Receita

**Canais a detectar:**
- WhatsApp (WPP)
- Instagram (IG)
- Organico
- Indicação
- Outros

**Critérios de aceitação:**
- [ ] Gráfico responsivo (altura ajustável)
- [ ] Legendas clicáveis para toggle
- [ ] Tooltip mostrando taxa de conversão
- [ ] Ordenação por volume de leads

---

#### Dia 4: Integração e Testes
**Arquivos a modificar:**
```
app/dashboard/page.tsx             # MODIFICAR - Integrar 3 cards
components/dashboard/
└── DashboardContent.tsx           # NOVO - Componente de conteúdo
```

**Testes a realizar:**
1. **Teste de carga:** Carregar dashboard com 1000+ deals
2. **Teste de responsividade:** Mobile, tablet, desktop
3. **Teste de erro:** Desconectar internet, verificar estados
4. **Teste de vazio:** Organização sem dados

**Critérios de aceitação:**
- [ ] 3 cards integrados no grid principal
- [ ] Filtro de período afetando todos os cards
- [ ] Atualização em tempo real (stale-while-revalidate)
- [ ] Testes passando (Vitest)

### Riscos Técnicos - Sprint 3
| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Performance do funil com muitos estágios | Média | Médio | Limitar a 7 estágios, scrollbar se necessário |
| Gráfico de canais poluído | Média | Baixo | Agrupar canais pequenos em "Outros" |
| Cálculos de drop-off imprecisos | Baixa | Alto | Revisar fórmula com stakeholder |

---

## 🎯 SPRINT 4 - Cards Finais e Health Score (4 dias)

### Objetivo
Implementar os 3 cards restantes: Motivos de Perda, Receita Semanal e Health Score.

### Tarefas

#### Dia 1: Card Motivos de Perda
**Arquivos a criar/modificar:**
```
components/dashboard/cards/
├── LossReasonsChart.tsx           # NOVO - Gráfico donut/pizza
├── LossReasonItem.tsx             # NOVO - Item da legenda
└── LossReasonsSkeleton.tsx        # NOVO - Skeleton
```

**Funcionalidades:**
- Gráfico donut mostrando distribuição de motivos
- Centro do donut: total de deals perdidos
- Legenda interativa (clicar para filtrar)
- Lista de motivos com percentual e valor perdido

**Motivos típicos:**
- Preço alto
- Foi com concorrente
- Não respondeu
- Timing inadequado
- Não tinha necessidade
- Outros

**Critérios de aceitação:**
- [ ] Gráfico donut responsivo
- [ ] Cores distintas para cada motivo
- [ ] Valor total perdido destacado
- [ ] Possibilidade de esconder/mostrar motivos

---

#### Dia 2: Card Receita Semanal
**Arquivos a criar/modificar:**
```
components/dashboard/cards/
├── WeeklyRevenueChart.tsx         # NOVO - Gráfico de linha
├── RevenueTrend.tsx               # NOVO - Indicador de tendência
└── WeeklyRevenueSkeleton.tsx      # NOVO - Skeleton
```

**Gráfico:** Linha temporal de 12 semanas
- Eixo X: Semanas (S1, S2, S3...)
- Eixo Y: Valor de receita
- Linha com área preenchida (gradiente)
- Pontos destacando valores máximos
- Meta/referência de comparação (linha tracejada)

**Cálculos:**
```typescript
interface WeeklyRevenue {
  week: string        // "2024-W01"
  weekLabel: string   // "Jan S1"
  revenue: number
  dealsCount: number
  target: number      // Meta semanal (pode ser média)
}
```

**Critérios de aceitação:**
- [ ] Linha suave (curva bezier)
- [ ] Animação de entrada
- [ ] Comparativo com semana anterior
- [ ] Tooltip detalhado por semana

---

#### Dia 3: Card Health Score (Parte 1)
**Arquivos a criar/modificar:**
```
lib/dashboard/
└── health-score-calculator.ts     # NOVO - Algoritmo de cálculo

components/dashboard/cards/
├── HealthScoreGauge.tsx           # NOVO - Gauge circular
├── HealthScoreMetrics.tsx         # NOVO - Sub-métricas
└── HealthScoreSkeleton.tsx        # NOVO - Skeleton
```

**Gauge Circular:**
- Range: 0-100
- Cores: Vermelho (0-40), Amarelo (40-70), Verde (70-100)
- Animação de preenchimento ao carregar
- Score central em destaque

**Sub-métricas (abaixo do gauge):**
- Pipeline Velocity (0-100)
- Conversion Rate (0-100)
- Response Time (0-100)
- Engagement Rate (0-100)
- Revenue Growth (0-100)

**Algoritmo de cálculo (simplificado):**
```typescript
function calculateHealthScore(metrics: RawMetrics): HealthScore {
  const velocity = calculatePipelineVelocity(metrics) // 0-100
  const conversion = calculateConversionRate(metrics) * 100
  const response = calculateResponseScore(metrics)    // inverso do tempo
  const engagement = calculateEngagement(metrics)
  const growth = calculateRevenueGrowth(metrics)
  
  return {
    overall: Math.round(
      velocity * 0.25 +
      conversion * 0.30 +
      response * 0.20 +
      engagement * 0.15 +
      growth * 0.10
    ),
    components: { velocity, conversion, response, engagement, growth }
  }
}
```

**Critérios de aceitação:**
- [ ] Gauge renderizando com valor correto
- [ ] Animação suave de 0 → valor final
- [ ] Cores dinâmicas baseadas no score
- [ ] Sub-métricas visíveis em grid

---

#### Dia 4: Health Score (Parte 2) + Integração
**Arquivos a criar/modificar:**
```
app/dashboard/page.tsx             # MODIFICAR - Layout final dos 6 cards
components/dashboard/
└── DashboardGrid.tsx              # MODIFICAR - Grid responsivo final
```

**Layout final do grid:**
```
┌─────────────────────────────────────────────────────────────┐
│  [KPIs Verticais 100px] │         GRID PRINCIPAL           │
│                         ├──────────────┬──────────────┤     │
│  • Receita              │   FUNIL      │  RECUPERAÇÃO │     │
│  • Ticket Médio         │   POR        │   PERDIDOS   │     │
│  • Conversão            │   ETAPA      │              │     │
│  • Conversas            ├──────────────┼──────────────┤     │
│                         │ PERFORMANCE  │  MOTIVOS DE  │     │
│                         │   POR CANAL  │    PERDA     │     │
│                         ├──────────────┼──────────────┤     │
│                         │  RECEITA     │ HEALTH SCORE │     │
│                         │   SEMANAL    │   (gauge)    │     │
│                         └──────────────┴──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

**Critérios de aceitação:**
- [ ] Todos os 6 cards integrados
- [ ] Layout responsivo (2 colunas em desktop, 1 em mobile)
- [ ] Cards com altura consistente
- [ ] Scroll apenas na coluna de KPIs se necessário

### Riscos Técnicos - Sprint 4
| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Algoritmo de Health Score impreciso | Alta | Médio | Validar fórmula com dados reais, ajustar pesos |
| Performance do gauge com SVG complexo | Baixa | Baixo | Usar biblioteca leve (recharts pie) ou CSS |
| Gráfico de receita com muitos pontos | Média | Médio | Limitar a 12 semanas, agrupar mensalmente se >6 meses |

---

## 🎯 SPRINT 5 - Polish (2 dias)

### Objetivo
Refinar UX, implementar estados de erro completos, responsividade final e testes.

### Tarefas

#### Dia 1: Skeletons e Estados
**Arquivos a criar/modificar:**
```
components/dashboard/
├── skeletons/
│   ├── DashboardSkeleton.tsx      # NOVO - Skeleton completo
│   ├── FunnelSkeleton.tsx         # NOVO
│   ├── LostDealsSkeleton.tsx      # NOVO
│   ├── ChannelSkeleton.tsx        # NOVO
│   ├── LossReasonsSkeleton.tsx    # NOVO
│   ├── RevenueSkeleton.tsx        # NOVO
│   └── HealthScoreSkeleton.tsx    # NOVO
├── error/
│   ├── DashboardError.tsx         # NOVO - Estado de erro geral
│   ├── CardError.tsx              # NOVO - Erro por card
│   └── EmptyState.tsx             # NOVO - Estado vazio
```

**Requisitos de Skeleton:**
- Cada card tem skeleton específico que simula seu conteúdo
- Animação pulse suave
- Altura correspondente ao conteúdo final
- Skeleton aparece apenas no primeiro load (não em refresh)

**Estados de erro:**
- Card individual pode falhar sem quebrar dashboard
- Botão "Tentar novamente" por card
- Mensagem amigável para usuário

**Critérios de aceitação:**
- [ ] Skeleton em todos os cards
- [ ] Transição suave skeleton → conteúdo
- [ ] Erro em um card não quebra os outros
- [ ] Retry funcional por card

---

#### Dia 2: Responsividade e Testes
**Arquivos a modificar:**
```
app/dashboard/page.tsx             # MODIFICAR - Breakpoints finais
components/dashboard/
└── DashboardGrid.tsx              # MODIFICAR - Grid responsivo
```

**Breakpoints:**
```css
/* Mobile: < 768px */
- Sidebar colapsa para ícones apenas (ou drawer)
- KPIs horizontais (scroll)
- Cards em 1 coluna

/* Tablet: 768px - 1024px */
- Sidebar compacta (ícones + texto curto)
- KPIs verticais
- Cards em 1-2 colunas

/* Desktop: 1024px - 1440px */
- Layout completo
- Cards em 2 colunas

/* Large: > 1440px */
- Sidebar 280px
- Grid com mais espaçamento
```

**Testes:**
```
__tests__/dashboard/
├── DashboardGrid.test.tsx         # NOVO
├── FunnelChart.test.tsx           # NOVO
├── HealthScore.test.tsx           # NOVO
└── hooks/
    ├── use-dashboard-funnel.test.ts
    ├── use-health-score.test.ts
    └── use-lost-deals.test.ts
```

**Critérios de aceitação:**
- [ ] Layout funciona em 320px, 768px, 1024px, 1440px
- [ ] Testes unitários > 80% coverage
- [ ] Navegação por teclado funcional
- [ ] Lighthouse score > 90 (Performance, A11y)

### Riscos Técnicos - Sprint 5
| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Responsividade complexa | Média | Médio | Usar CSS Grid com minmax(), testar em devices reais |
| Testes flaky | Média | Baixo | Mockar dados consistentes, usar MSW |
| Performance em mobile | Média | Alto | Lazy load de cards, virtualização se necessário |

---

## 📦 Entregáveis MVP

### O que está no MVP (16 dias):
1. ✅ Layout com sidebar 280px + KPIs verticais + grid 2x3
2. ✅ Card Funil por Etapa com dados reais
3. ✅ Card Recuperação de Perdidos com ações
4. ✅ Card Performance por Canal
5. ✅ Card Motivos de Perda (gráfico donut)
6. ✅ Card Receita Semanal (gráfico linha)
7. ✅ Card Health Score (gauge + métricas)
8. ✅ Skeleton loading em todos os cards
9. ✅ Estados de erro por card
10. ✅ Responsividade básica

### O que NÃO está no MVP (futuras versões):
- ⏸️ Filtros avançados (por usuário, por tag)
- ⏸️ Exportação de relatórios (PDF, CSV)
- ⏸️ Alertas em tempo real (WebSocket)
- ⏸️ Customização de cores do dashboard
- ⏸️ Comparativo período anterior visual
- ⏸️ Previsões com ML

---

## 📊 Estimativas e Métricas

### Velocidade Esperada
- **1 dev full-time** (8h/dia efetivas)
- **Velocidade:** ~13 pontos/sprint (considerando complexidade média)
- **Buffer:** 20% para imprevistos

### Pontos de Complexidade
| Componente | Pontos | Justificativa |
|------------|--------|---------------|
| Fundação (Sprint 1) | 8 | Layout, componentes base |
| APIs (Sprint 2) | 13 | 6 endpoints + hooks |
| Cards Principais | 21 | 3 cards com lógica complexa |
| Cards Finais | 21 | Health Score é complexo |
| Polish | 8 | Refinamentos diversos |
| **Total** | **71** | ~71 horas estimadas |

### Datas Estimadas (1 dev)
```
Início: Dia 1 (Segunda-feira)

Sprint 1: Dias 1-3    (Fundação)      → Entrega Dia 3
Sprint 2: Dias 4-6    (APIs)          → Entrega Dia 6
Sprint 3: Dias 7-10   (Cards 1-3)     → Entrega Dia 10
Sprint 4: Dias 11-14  (Cards 4-6)     → Entrega Dia 14
Sprint 5: Dias 15-16  (Polish)        → Entrega Final Dia 16

Fim estimado: 16 dias úteis (~3 semanas e 3 dias)
```

### Pontos de Decisão (Go/No-Go)

#### Checkpoint 1 - Após Sprint 1 (Dia 3)
**Critérios:**
- [ ] Layout renderiza sem erros
- [ ] Sidebar 280px funcional
- [ ] KPIs verticais visíveis

**Decisão:**
- 🟢 **GO:** Prosseguir para Sprint 2
- 🔴 **NO-GO:** Revisar arquitetura, considerar simplificar layout

#### Checkpoint 2 - Após Sprint 2 (Dia 6)
**Critérios:**
- [ ] Todas as APIs respondem < 500ms
- [ ] Hooks retornando dados corretos
- [ ] Health Score calculado (mesmo que simplificado)

**Decisão:**
- 🟢 **GO:** Prosseguir para implementação dos cards
- 🟡 **GO com ajustes:** Simplificar algoritmos lentos
- 🔴 **NO-GO:** Revisar queries de banco, considerar cache

#### Checkpoint 3 - Após Sprint 3 (Dia 10)
**Critérios:**
- [ ] 3 cards principais funcionando
- [ ] Dados reais exibidos
- [ ] Performance aceitável

**Decisão:**
- 🟢 **GO:** Prosseguir para cards finais
- 🟡 **GO com ajustes:** Reduzir escopo dos cards restantes
- 🔴 **NO-GO:** Estender sprint 3, adiar cards menos críticos

#### Checkpoint Final - Dia 16
**Critérios:**
- [ ] 6 cards implementados
- [ ] Responsividade funcional
- [ ] Testes passando

**Decisão:**
- 🟢 **Lançar:** Merge para main e deploy
- 🟡 **Lançar com débito:** Criar issues para melhorias pós-launch
- 🔴 **Extender:** Adicionar 2-3 dias para finalizar críticos

---

## 🔧 Dependências Técnicas

### Internas (já existem)
```
✅ @prisma/client
✅ next
✅ react
✅ recharts
✅ swr
✅ tailwindcss
✅ shadcn/ui components
```

### A verificar
```
? @tanstack/react-query (se quiser migrar do SWR)
? recharts (já instalado)
```

### Schema Requirements
Campos necessários no banco (verificar existência):
```prisma
// No model Deal
lostReason    String?   // Motivo da perda
closedLostAt  DateTime? // Quando foi perdido

// No model PipelineStage  
isClosed      Boolean   // Indica estágio de fechamento

// Índices para performance
@@index([organizationId, status, createdAt])
@@index([organizationId, source])
```

---

## 🐛 Riscos Técnicos - Visão Geral

| Risco | Prob | Impacto | Mitigação Principal |
|-------|------|---------|---------------------|
| Queries lentas em produção | Média | Alto | Limitar período, usar materialized views |
| Algoritmo Health Score impreciso | Alta | Médio | Validar com stakeholders, versão simplificada |
| Responsividade complexa | Média | Médio | Testar cedo, usar CSS Grid moderno |
| Conflitos com código legado | Baixa | Alto | Manter página antiga, feature flag |
| Dependência de 1 dev | Alta | Alto | Documentação detalhada, pair programming |

---

## 📝 Notas de Implementação

### Padrões a seguir
1. **Componentes:** Functional components com hooks
2. **Estilização:** Tailwind + shadcn/ui, nenhum CSS module
3. **Data fetching:** SWR (padrão do projeto) ou React Query
4. **Tipagem:** TypeScript strict, interfaces exportadas
5. **Testes:** Vitest + React Testing Library
6. **Commits:** Conventional commits (feat:, fix:, refactor:)

### Cores do Projeto
```typescript
const COLORS = {
  primary: '#46347F',      // Roxo principal
  secondary: '#8B7DB8',    // Roxo claro
  success: '#027E46',      // Verde
  warning: '#f3c845',      // Amarelo
  danger: '#dc2626',       // Vermelho
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  }
}
```

### Estrutura de Pastas Final
```
app/
├── dashboard/
│   └── page.tsx
├── api/dashboard/
│   ├── funnel/route.ts
│   ├── lost-deals/route.ts
│   ├── channel-performance/route.ts
│   ├── loss-reasons/route.ts
│   ├── weekly-revenue/route.ts
│   └── health-score/route.ts

components/
├── dashboard/
│   ├── DashboardCard.tsx
│   ├── DashboardGrid.tsx
│   ├── kpi/
│   │   ├── KpiColumn.tsx
│   │   └── KpiCard.tsx
│   ├── cards/
│   │   ├── FunnelChart.tsx
│   │   ├── LostDealsRecovery.tsx
│   │   ├── ChannelPerformanceChart.tsx
│   │   ├── LossReasonsChart.tsx
│   │   ├── WeeklyRevenueChart.tsx
│   │   └── HealthScoreGauge.tsx
│   ├── skeletons/
│   │   └── [Skeletons específicos]
│   └── error/
│       └── [Componentes de erro]
├── sidebar.tsx                    # Modificado (280px)
└── [componentes existentes]

hooks/
├── use-dashboard-funnel.ts
├── use-lost-deals.ts
├── use-channel-performance.ts
├── use-loss-reasons.ts
├── use-weekly-revenue.ts
└── use-health-score.ts

lib/
├── dashboard/
│   ├── types.ts
│   ├── constants.ts
│   ├── utils.ts
│   └── health-score-calculator.ts
└── [libs existentes]

__tests__/
└── dashboard/
    └── [testes]
```

---

## ✅ Checklist de Conclusão

### Antes de começar
- [ ] Validar schema Prisma com requisitos
- [ ] Confirmar cores e design com UI/UX
- [ ] Setup de ambiente de desenvolvimento
- [ ] Criar feature branch `feature/new-dashboard`

### Durante o desenvolvimento
- [ ] Commits diários
- [ ] Code review a cada sprint
- [ ] Testes manuais no ambiente de staging

### Antes do deploy
- [ ] Testes automatizados passando
- [ ] Lighthouse score > 90
- [ ] Teste de carga com dados reais
- [ ] Documentação atualizada
- [ ] Rollback plan definido

---

## 📞 Contatos e Suporte

**Stakeholders:**
- Product Owner: [Nome]
- Tech Lead: [Nome]
- Designer: [Nome]

**Recursos:**
- Documentação shadcn/ui: https://ui.shadcn.com
- Documentação Recharts: https://recharts.org
- Documentação Prisma: https://prisma.io/docs

---

*Documento criado em: 13/03/2026*
*Última atualização: 13/03/2026*
*Versão: 1.0*
