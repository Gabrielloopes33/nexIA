# Checklist de Tarefas - Implementação do Dashboard

> Use este documento para acompanhar o progresso durante o desenvolvimento.
> Marque cada item com [x] quando concluído.

---

## 🏁 SPRINT 1 - Fundação (3 dias)

### Dia 1: Estrutura e Sidebar

#### Componentes Base
- [ ] Criar `components/dashboard/DashboardCard.tsx`
  - [ ] Props: title, children, className, onRefresh?
  - [ ] Header com título e ícones de ação
  - [ ] Container com shadow e border-radius consistentes
  - [ ] Variantes: default, compact, featured

- [ ] Criar `components/dashboard/DashboardGrid.tsx`
  - [ ] Layout grid responsivo
  - [ ] Coluna de KPIs (100px fixo)
  - [ ] Área principal para cards
  - [ ] Gap e padding consistentes

- [ ] Criar `components/dashboard/index.ts` (barrel export)

#### Modificações
- [ ] Alterar `components/sidebar.tsx`
  - [ ] Width de 220px para 280px
  - [ ] Verificar quebras de layout
  - [ ] Testar em diferentes resoluções

- [ ] Atualizar `app/dashboard/page.tsx`
  - [ ] Novo layout estrutural
  - [ ] Wrapper para KPIs + Grid
  - [ ] Manter compatibilidade com dados existentes

#### Testes do Dia 1
- [ ] Sidebar renderiza em 280px
- [ ] Layout sem erros de console
- [ ] Nenhum overflow horizontal
- [ ] Transições suaves

**Status Sprint 1 / Dia 1:** [ ] Em andamento / [ ] Concluído

---

### Dia 2: Componentes Base e KPIs

#### Componentes KPI
- [ ] Criar `components/dashboard/kpi/KpiColumn.tsx`
  - [ ] Container vertical flexível
  - [ ] Scroll se necessário
  - [ ] Gap consistente entre cards

- [ ] Criar `components/dashboard/kpi/KpiCard.tsx`
  - [ ] Props: label, value, change, icon, isNegativeGood
  - [ ] Formatação de valores (moeda, percentual)
  - [ ] Indicador de tendência (up/down)
  - [ ] Hover effect

- [ ] Criar `components/dashboard/kpi/KpiSkeleton.tsx`
  - [ ] Animação pulse
  - [ ] Mesma altura do card real

#### Hooks
- [ ] Criar `hooks/use-dashboard-new.ts` (estrutura base)
  - [ ] Interface de retorno definida
  - [ ] Estados: data, isLoading, error
  - [ ] Período selecionável

#### Testes do Dia 2
- [ ] 4 KPIs mock renderizando
- [ ] Formatação correta (R$ 1.234,56, 12,5%)
- [ ] Skeleton funcionando
- [ ] Responsividade OK

**Status Sprint 1 / Dia 2:** [ ] Em andamento / [ ] Concluído

---

### Dia 3: Setup React Query + Types

#### Tipagens
- [ ] Criar `lib/dashboard/types.ts`
  ```typescript
  // Definir interfaces:
  - DashboardPeriod
  - DashboardMetrics
  - FunnelStage
  - LostDeal
  - ChannelPerformance
  - LossReason
  - WeeklyRevenue
  - HealthScore
  ```

#### Constantes
- [ ] Criar `lib/dashboard/constants.ts`
  - [ ] PERIODS: ['7d', '30d', '90d']
  - [ ] COLORS: mapeamento de cores por categoria
  - [ ] DEFAULTS: valores padrão

#### Utils
- [ ] Criar `lib/dashboard/utils.ts`
  - [ ] formatCurrency()
  - [ ] formatPercentage()
  - [ ] calculateGrowth()
  - [ ] formatCompactNumber() (1.2K, 1.5M)

#### Hook Base
- [ ] Criar `hooks/use-dashboard-metrics.ts`
  - [ ] Integração com API existente
  - [ ] Cache configurado (staleTime: 30000)
  - [ ] Refetch interval opcional
  - [ ] Error boundary

#### Testes do Dia 3
- [ ] Types compilando sem erros
- [ ] Hook retornando dados mock
- [ ] Cache funcionando
- [ ] Retry em caso de erro

**Status Sprint 1 / Dia 3:** [ ] Em andamento / [ ] Concluído

**CHECKPOINT 1 - GO/NO-GO:** [ ] APROVADO / [ ] REPROVADO

---

## 🏁 SPRINT 2 - Dados e API (3 dias)

### Dia 1: Schema e Migrations

#### Análise do Schema
- [ ] Verificar campos existentes em `Deal`:
  - [ ] lostReason (String?)
  - [ ] closedLostAt (DateTime?)
  - [ ] createdAt, updatedAt

- [ ] Verificar índices:
  - [ ] @@index([organizationId, status, createdAt])
  - [ ] @@index([organizationId, source])

#### Se necessário, criar migration
- [ ] `prisma migrate dev --name add_dashboard_fields`
- [ ] Gerar cliente: `prisma generate`

#### Seed de Dados
- [ ] Criar `scripts/seed-dashboard-data.ts`
  - [ ] Criar 50+ deals de teste
  - [ ] Distribuir em diferentes estágios
  - [ ] Adicionar lostReason em alguns
  - [ ] Dados de diferentes períodos

#### Testes do Dia 1
- [ ] Migration aplicada sem erros
- [ ] Seed executando
- [ ] Queries básicas funcionando

**Status Sprint 2 / Dia 1:** [ ] Em andamento / [ ] Concluído

---

### Dia 2: API Routes - Parte 1

#### API: Funnel
- [ ] Criar `app/api/dashboard/funnel/route.ts`
  - [ ] GET handler
  - [ ] Query params: organizationId, period
  - [ ] Query Prisma: groupBy stageId
  - [ ] Cálculo de conversionRate entre estágios
  - [ ] Cálculo de dropOffRate

- [ ] Testar:
  ```bash
  curl "/api/dashboard/funnel?organizationId=xxx&period=30d"
  ```

#### API: Lost Deals
- [ ] Criar `app/api/dashboard/lost-deals/route.ts`
  - [ ] Query: deals com status='LOST'
  - [ ] Ordenar por lostAt desc
  - [ ] Limit: 20
  - [ ] Calcular recoverable (regras de negócio)

- [ ] Testar via curl/Postman

#### API: Channel Performance
- [ ] Criar `app/api/dashboard/channel-performance/route.ts`
  - [ ] Query: groupBy source
  - [ ] Calcular leads, conversions, revenue por canal
  - [ ] Normalizar nomes de canais (wpp→WhatsApp)

- [ ] Testar via curl/Postman

#### Testes do Dia 2
- [ ] 3 APIs respondendo < 500ms
- [ ] Dados corretos e formatados
- [ ] Tratamento de erro implementado
- [ ] Autenticação verificando organizationId

**Status Sprint 2 / Dia 2:** [ ] Em andamento / [ ] Concluído

---

### Dia 3: API Routes - Parte 2 + Hooks

#### API: Loss Reasons
- [ ] Criar `app/api/dashboard/loss-reasons/route.ts`
  - [ ] groupBy lostReason
  - [ ] Count e sum(value) por motivo

#### API: Weekly Revenue
- [ ] Criar `app/api/dashboard/weekly-revenue/route.ts`
  - [ ] Agrupar deals won por semana
  - [ ] Últimas 12 semanas
  - [ ] Calcular target (média móvel)

#### API: Health Score
- [ ] Criar `app/api/dashboard/health-score/route.ts`
  - [ ] Implementar algoritmo simplificado
  - [ ] Retornar score e componentes

#### Hooks Correspondentes
- [ ] `hooks/use-dashboard-funnel.ts`
- [ ] `hooks/use-lost-deals.ts`
- [ ] `hooks/use-channel-performance.ts`
- [ ] `hooks/use-loss-reasons.ts`
- [ ] `hooks/use-weekly-revenue.ts`
- [ ] `hooks/use-health-score.ts`

Padrão para cada hook:
```typescript
const { data, isLoading, error, mutate } = useSWR(
  organizationId ? ['/api/dashboard/funnel', organizationId, period] : null,
  fetcher,
  { revalidateOnFocus: false, staleTime: 30000 }
)
```

#### Testes do Dia 3
- [ ] Todas as APIs testadas
- [ ] Hooks funcionando com dados reais
- [ ] Estados de loading/error corretos
- [ ] Tipagens exportadas

**Status Sprint 2 / Dia 3:** [ ] Em andamento / [ ] Concluído

**CHECKPOINT 2 - GO/NO-GO:** [ ] APROVADO / [ ] REPROVADO

---

## 🏁 SPRINT 3 - Cards Principais (4 dias)

### Dia 1: Card Funil por Etapa

#### Componentes
- [ ] `components/dashboard/cards/FunnelChart.tsx`
  - [ ] Visualização em barras progressivas
  - [ ] Cores gradientes por estágio
  - [ ] Tooltips com detalhes

- [ ] `components/dashboard/cards/FunnelStage.tsx`
  - [ ] Barra individual do estágio
  - [ ] Label com nome e contagem
  - [ ] Porcentagem do total

- [ ] `components/dashboard/cards/FunnelSkeleton.tsx`

#### Funcionalidades
- [ ] Drop-off rate entre estágios
- [ ] Valor total por estágio
- [ ] Tempo médio no estágio
- [ ] Animação de entrada

#### Testes
- [ ] Dados reais renderizando
- [ ] Cálculos corretos
- [ ] Responsivo
- [ ] Estado vazio tratado

**Status Sprint 3 / Dia 1:** [ ] Em andamento / [ ] Concluído

---

### Dia 2: Card Recuperação de Perdidos

#### Componentes
- [ ] `components/dashboard/cards/LostDealsRecovery.tsx`
  - [ ] Lista de deals perdidos
  - [ ] Scroll com max-height

- [ ] `components/dashboard/cards/LostDealItem.tsx`
  - [ ] Nome do lead
  - [ ] Valor formatado
  - [ ] Motivo da perda
  - [ ] Badge "Recuperável"
  - [ ] Botão de ação

- [ ] `components/dashboard/cards/RecoveryActionModal.tsx`
  - [ ] Template de mensagem
  - [ ] Preview
  - [ ] Confirmação

#### Funcionalidades
- [ ] Filtro por motivo de perda
- [ ] Ordenação por valor/recuperabilidade
- [ ] Ação de recuperação (mock inicial)
- [ ] Contador de valor recuperável

#### Testes
- [ ] Lista renderizando
- [ ] Ações funcionando
- [ ] Modal abrindo/fechando

**Status Sprint 3 / Dia 2:** [ ] Em andamento / [ ] Concluído

---

### Dia 3: Card Performance por Canal

#### Componentes
- [ ] `components/dashboard/cards/ChannelPerformanceChart.tsx`
  - [ ] Gráfico de barras (recharts)
  - [ ] Barras agrupadas
  - [ ] Eixos formatados

- [ ] `components/dashboard/cards/ChannelBar.tsx` (se necessário)

#### Funcionalidades
- [ ] Toggle de métricas (legendas clicáveis)
- [ ] Tooltip detalhado
- [ ] Ordenação por volume
- [ ] Cores consistentes por canal

#### Testes
- [ ] Gráfico responsivo
- [ ] Toggle funcionando
- [ ] Tooltip informativo

**Status Sprint 3 / Dia 3:** [ ] Em andamento / [ ] Concluído

---

### Dia 4: Integração e Testes

#### Integração
- [ ] Atualizar `app/dashboard/page.tsx`
  - [ ] Incluir 3 novos cards
  - [ ] Grid layout correto

- [ ] Criar `components/dashboard/DashboardContent.tsx`
  - [ ] Container principal
  - [ ] Gerenciamento de estado

#### Testes
- [ ] **Carga:** 1000+ deals
- [ ] **Responsivo:** Mobile, tablet, desktop
- [ ] **Erro:** Desconectar internet
- [ ] **Vazio:** Organização sem dados
- [ ] **Unit:** Componentes individuais

#### Documentação
- [ ] Atualizar README do dashboard
- [ ] Documentar props dos componentes

**Status Sprint 3 / Dia 4:** [ ] Em andamento / [ ] Concluído

**CHECKPOINT 3 - GO/NO-GO:** [ ] APROVADO / [ ] REPROVADO

---

## 🏁 SPRINT 4 - Cards Finais e Health Score (4 dias)

### Dia 1: Card Motivos de Perda

#### Componentes
- [ ] `components/dashboard/cards/LossReasonsChart.tsx`
  - [ ] Gráfico donut (recharts PieChart)
  - [ ] Centro com total

- [ ] `components/dashboard/cards/LossReasonItem.tsx`
  - [ ] Item da legenda
  - [ ] Cor, nome, percentual
  - [ ] Valor perdido

#### Funcionalidades
- [ ] Interação: clicar para filtrar
- [ ] Cores distintas
- [ ] Lista ordenada por valor

#### Testes
- [ ] Donut renderizando
- [ ] Cores corretas
- [ ] Interação funcionando

**Status Sprint 4 / Dia 1:** [ ] Em andamento / [ ] Concluído

---

### Dia 2: Card Receita Semanal

#### Componentes
- [ ] `components/dashboard/cards/WeeklyRevenueChart.tsx`
  - [ ] Gráfico de linha
  - [ ] Área preenchida com gradiente
  - [ ] Linha de meta

- [ ] `components/dashboard/cards/RevenueTrend.tsx`
  - [ ] Indicador de tendência
  - [ ] Comparativo semana anterior

#### Funcionalidades
- [ ] Animação de entrada
- [ ] Tooltip detalhado
- [ ] Destaque para máximos
- [ ] Calculo de tendência

#### Testes
- [ ] Linha suave
- [ ] Tooltip funcionando
- [ ] Valores corretos

**Status Sprint 4 / Dia 2:** [ ] Em andamento / [ ] Concluído

---

### Dia 3: Health Score (Parte 1)

#### Algoritmo
- [ ] `lib/dashboard/health-score-calculator.ts`
  - [ ] Implementar cálculos de cada componente
  - [ ] Fórmula ponderada
  - [ ] Normalização 0-100

#### Componentes
- [ ] `components/dashboard/cards/HealthScoreGauge.tsx`
  - [ ] Gauge circular (SVG ou recharts)
  - [ ] Animação de preenchimento
  - [ ] Cores dinâmicas

- [ ] `components/dashboard/cards/HealthScoreMetrics.tsx`
  - [ ] Grid de sub-métricas
  - [ ] Progress bars
  - [ ] Labels explicativas

#### Testes
- [ ] Cálculos corretos
- [ ] Gauge animando
- [ ] Cores mudando conforme score

**Status Sprint 4 / Dia 3:** [ ] Em andamento / [ ] Concluído

---

### Dia 4: Health Score (Parte 2) + Integração

#### Integração
- [ ] Atualizar `app/dashboard/page.tsx`
  - [ ] Layout final 2x3
  - [ ] Todos os 6 cards

- [ ] `components/dashboard/DashboardGrid.tsx`
  - [ ] Grid responsivo
  - [ ] Alturas consistentes

#### Polish
- [ ] Revisar espaçamentos
- [ ] Verificar alinhamentos
- [ ] Consistência de tipografia
- [ ] Cores do tema

#### Testes
- [ ] Layout em diferentes tamanhos
- [ ] Scroll funcionando corretamente
- [ ] Cards não quebram

**Status Sprint 4 / Dia 4:** [ ] Em andamento / [ ] Concluído

**CHECKPOINT 4 - GO/NO-GO:** [ ] APROVADO / [ ] REPROVADO

---

## 🏁 SPRINT 5 - Polish (2 dias)

### Dia 1: Skeletons e Estados

#### Skeletons
- [ ] `components/dashboard/skeletons/DashboardSkeleton.tsx`
- [ ] `components/dashboard/skeletons/FunnelSkeleton.tsx`
- [ ] `components/dashboard/skeletons/LostDealsSkeleton.tsx`
- [ ] `components/dashboard/skeletons/ChannelSkeleton.tsx`
- [ ] `components/dashboard/skeletons/LossReasonsSkeleton.tsx`
- [ ] `components/dashboard/skeletons/RevenueSkeleton.tsx`
- [ ] `components/dashboard/skeletons/HealthScoreSkeleton.tsx`

#### Estados de Erro
- [ ] `components/dashboard/error/DashboardError.tsx`
- [ ] `components/dashboard/error/CardError.tsx`
- [ ] `components/dashboard/error/EmptyState.tsx`

#### Funcionalidades
- [ ] Transição suave skeleton → conteúdo
- [ ] Erro em um card não quebra dashboard
- [ ] Retry por card
- [ ] Empty state informativo

#### Testes
- [ ] Skeletons em todos os cards
- [ ] Erro simulado
- [ ] Retry funcionando

**Status Sprint 5 / Dia 1:** [ ] Em andamento / [ ] Concluído

---

### Dia 2: Responsividade e Testes

#### Responsividade
- [ ] Mobile (< 768px)
  - [ ] Sidebar colapsa
  - [ ] KPIs horizontais
  - [ ] Cards em 1 coluna

- [ ] Tablet (768px - 1024px)
  - [ ] Sidebar compacta
  - [ ] Grid ajustado

- [ ] Desktop (> 1024px)
  - [ ] Layout completo
  - [ ] Sidebar 280px

#### Testes
- [ ] **Unit:** Componentes
- [ ] **Integration:** Fluxos
- [ ] **E2E:** Cenários críticos
- [ ] **Acessibilidade:** Lighthouse A11y
- [ ] **Performance:** Lighthouse Perf

#### Checklist Final
- [ ] Build sem erros
- [ ] TypeScript sem warnings
- [ ] Lint passando
- [ ] Testes passando (>80% coverage)
- [ ] Documentação atualizada

**Status Sprint 5 / Dia 2:** [ ] Em andamento / [ ] Concluído

**CHECKPOINT FINAL - GO/NO-GO:** [ ] APROVADO PARA LANÇAMENTO / [ ] REPROVADO

---

## ✅ Checklist Pré-Lançamento

### Técnico
- [ ] Código revisado (PR aprovado)
- [ ] Testes passando
- [ ] Build de produção OK
- [ ] Variáveis de ambiente configuradas
- [ ] Feature flag pronta (se necessário)

### Qualidade
- [ ] Lighthouse Performance > 90
- [ ] Lighthouse Acessibilidade > 90
- [ ] Teste em múltiplos navegadores
- [ ] Teste em múltiplos dispositivos
- [ ] Dados de teste vs produção verificados

### Documentação
- [ ] README atualizado
- [ ] Changelog documentado
- [ ] Handover document (se necessário)

### Rollback
- [ ] Plano de rollback definido
- [ ] Backup do estado anterior
- [ ] Comando de rollback testado

---

## 📊 Métricas de Conclusão

### Cobertura de Código
| Componente | Coverage | Status |
|------------|----------|--------|
| DashboardCard | ___% | [ ] |
| FunnelChart | ___% | [ ] |
| LostDealsRecovery | ___% | [ ] |
| ChannelPerformanceChart | ___% | [ ] |
| LossReasonsChart | ___% | [ ] |
| WeeklyRevenueChart | ___% | [ ] |
| HealthScoreGauge | ___% | [ ] |
| **Média** | **___%** | [ ] |

### Performance
| Métrica | Target | Real | Status |
|---------|--------|------|--------|
| First Contentful Paint | < 1.5s | ___s | [ ] |
| Time to Interactive | < 3s | ___s | [ ] |
| Lighthouse Performance | > 90 | ___ | [ ] |
| API Response Time | < 500ms | ___ms | [ ] |

---

**Data de início:** ___/___/______  
**Data de término:** ___/___/______  
**Desenvolvedor:** _________________  
**Revisor:** ______________________

---

## 📝 Notas

<!-- Use este espaço para anotações durante o desenvolvimento -->

