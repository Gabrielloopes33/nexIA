# 🤖 ORQUESTRAÇÃO DE AGENTS - Dashboard Implementation

> **Este documento define QUEM (qual agent) faz O QUÊ e QUANDO**

---

## 🎯 VISÃO GERAL DA EQUIPE DE AGENTS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EQUIPE DE AGENTS                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │  AGENT 1    │───▶│  AGENT 2    │───▶│  AGENT 3    │───▶│  AGENT 4    │  │
│  │  Frontend   │    │  Frontend   │    │  Backend    │    │  Backend    │  │
│  │  UI/UX      │    │  Tests      │    │  APIs       │    │  DB         │  │
│  │             │    │             │    │             │    │             │  │
│  │ Sprint 1    │    │ Sprint 1    │    │ Sprint 2    │    │ Sprint 2    │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                      │
│  │  AGENT 5    │───▶│  AGENT 6    │───▶│  AGENT 7    │                      │
│  │  Cards      │    │  Cards      │    │  Polish     │                      │
│  │  Parte 1    │    │  Parte 2    │    │  QA         │                      │
│  │             │    │             │    │             │                      │
│  │ Sprint 3    │    │ Sprint 4    │    │ Sprint 5    │                      │
│  └─────────────┘    └─────────────┘    └─────────────┘                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 MATRIX DE RESPONSABILIDADES

| Agent | Especialidade | Sprints | Entregáveis Principais |
|-------|--------------|---------|----------------------|
| **Agent 1** | Frontend UI/UX | 1 | Sidebar 280px, KPIs Column, Layout Grid |
| **Agent 2** | Frontend Tests | 1 | Testes componentes base, Setup Vitest |
| **Agent 3** | Backend APIs | 2 | API Routes, Controllers, Validações |
| **Agent 4** | Backend DB | 2 | Schema Prisma, Queries SQL, Migrations |
| **Agent 5** | Fullstack Cards 1 | 3 | Funil, Recuperação, Performance |
| **Agent 6** | Fullstack Cards 2 | 4 | Motivos, Receita, Health Score |
| **Agent 7** | QA/Testing | 5 | Testes integração, Build validation |

---

## 🗓️ CRONOGRAMA DE EXECUÇÃO DOS AGENTS

### 🔷 SPRINT 1: Fundação (Dias 1-4)

#### AGENT 1 - Frontend UI/UX (Paralelo com Agent 2)
**Prompt:**
```
Você é um especialista em React/Next.js e Tailwind CSS.

Implemente os componentes de layout do dashboard:

1. Atualizar sidebar.tsx de 220px para 280px
2. Criar KpiSidebar component (coluna vertical 100px com 5 KPIs)
3. Criar DashboardGrid component (layout 2fr/1fr)
4. Criar DashboardCard component base

Requisitos:
- TypeScript estrito
- Tailwind CSS
- Props bem tipadas
- Layout responsivo
- Zero dependências externas além do projeto

Arquivos a criar:
- components/sidebar.tsx (modificar)
- components/dashboard/kpis-sidebar.tsx
- components/dashboard/dashboard-grid.tsx
- components/dashboard/dashboard-card.tsx

NÃO criar testes (Agent 2 faz isso).
NÃO commitar no git.
Validar build local antes de entregar.
```

#### AGENT 2 - Frontend Testing (Paralelo com Agent 1)
**Prompt:**
```
Você é um especialista em testes com Vitest e React Testing Library.

Configure o ambiente de testes e crie testes para os componentes base:

1. Setup Vitest + React Testing Library
2. Configurar test-utils.tsx com providers
3. Criar mocks para next/navigation, react-query
4. Escrever testes para:
   - sidebar.test.tsx (testar 280px, navegação)
   - kpis-sidebar.test.tsx (testar 5 KPIs verticais)
   - dashboard-grid.test.tsx (testar layout 2fr/1fr)
   - dashboard-card.test.tsx (testar skeleton, children)

Requisitos:
- Cobertura mínima 90%
- Testes de renderização, props, eventos
- Mocks isolados

Arquivos:
- vitest.config.ts
- lib/test/setup.ts
- lib/test/test-utils.tsx
- lib/test/mocks/*
- components/**/__tests__/*.test.tsx

NÃO commitar no git.
Garantir todos os testes passando.
```

**Dependência:** Agent 1 e Agent 2 trabalham em paralelo, mas Agent 2 precisa dos arquivos do Agent 1 para testar.

---

### 🔷 SPRINT 2: Backend (Dias 5-8)

#### AGENT 4 - Database/Schema (Primeiro a iniciar)
**Prompt:**
```
Você é um especialista em PostgreSQL e Prisma ORM.

Implemente o schema e queries para o dashboard:

1. Atualizar schema.prisma com:
   - Enum LostReason (NO_BUDGET, NO_INTEREST, etc)
   - Enum ChannelType (WHATSAPP_OFFICIAL, INSTAGRAM, etc)
   - Campos novos no Deal: lostReason, channel, closedLostAt, etc
   - Model PipelineStageHistory
   - Model DashboardMetricCache
   - Índices otimizados

2. Criar migration SQL

3. Criar queries SQL otimizadas em lib/db/dashboard-queries.ts:
   - getFunnelMetrics(organizationId, period)
   - getLostDealsMetrics(organizationId, period)
   - getChannelPerformance(organizationId, period)
   - getLostReasonsTrend(organizationId, period)
   - getWeeklyRevenue(organizationId, weeks)
   - calculateHealthScore(organizationId)
   - getKPIs(organizationId, period)

4. Criar seed script para dados de teste

Requisitos:
- Queries otimizadas (< 500ms)
- Raw SQL para complexas
- Índices documentados
- Seed com dados realistas

Arquivos:
- prisma/schema.prisma (modificar)
- migrations/20250313_add_dashboard_metrics.sql
- lib/db/dashboard-queries.ts
- scripts/seed-dashboard.ts

NÃO rodar migrate dev ainda (só gerar migration).
NÃO commitar no git.
```

#### AGENT 3 - Backend APIs (Depende do Agent 4)
**Prompt:**
```
Você é um especialista em Next.js API Routes e testes de API.

Implemente as APIs do dashboard e seus testes:

1. Criar API Routes em app/api/dashboard/*:
   - /funnel/route.ts + teste
   - /lost-deals/route.ts + teste
   - /channels/route.ts + teste
   - /lost-reasons/route.ts + teste
   - /revenue/route.ts + teste
   - /health-score/route.ts + teste
   - /kpis/route.ts + teste

2. Cada API deve:
   - Validar query params (zod)
   - Autenticação (getServerSession)
   - Chamar função de lib/db/dashboard-queries.ts
   - Retornar JSON tipado
   - Tratar erros

3. Criar testes para cada API:
   - Teste de sucesso (200)
   - Teste de erro (500)
   - Teste de autenticação (401)
   - Mock do Prisma

Requisitos:
- Testes passando
- Cobertura > 90%
- Resposta < 500ms

Arquivos:
- app/api/dashboard/*/route.ts
- app/api/dashboard/*/__tests__/route.test.ts

Dependência: Precisa dos tipos do schema.prisma do Agent 4.
NÃO commitar no git.
Validar build local antes de entregar.
```

**Ordem de execução:**
1. Agent 4 gera schema (Dia 5)
2. Agent 3 aguarda e depois implementa APIs (Dias 6-8)
3. Agent 4 faz seed de dados (Dia 8)

---

### 🔷 SPRINT 3: Cards Parte 1 (Dias 9-13)

#### AGENT 5 - Fullstack Cards 1
**Prompt:**
```
Você é um fullstack developer especialista em React + Next.js.

Implemente 3 cards completos (frontend + integração + testes):

### Card 1: Funil por Etapa
- Hook: hooks/dashboard/use-funnel.ts + teste
- Componente: app/dashboard/_components/cards/funil-por-etapa/
  - index.tsx (card container)
  - chart.tsx (visualização Recharts)
  - skeleton.tsx
  - __tests__/ (testes)
- Integração com /api/dashboard/funnel

### Card 2: Recuperação de Perdidos
- Hook: hooks/dashboard/use-lost-deals.ts + teste
- Componente: app/dashboard/_components/cards/recuperacao-perdidos/
- Lista de leads perdidos com potencial de recuperação

### Card 3: Performance por Canal
- Hook: hooks/dashboard/use-channels.ts + teste
- Componente: app/dashboard/_components/cards/performance-canal/
- Gráfico de barras (WhatsApp, Instagram, etc)

### Filtros de Período
- Componente: app/dashboard/_components/period-filters.tsx
- Contexto: hooks/dashboard/use-dashboard-filters.ts
- Botões: Hoje, Semana, Mês, Trimestre

Requisitos:
- TypeScript estrito
- Testes > 90% cobertura
- Skeleton loading
- Error states
- Responsivo

Arquivos:
- hooks/dashboard/use-*.ts + __tests__/
- app/dashboard/_components/cards/*/
- app/dashboard/_components/period-filters.tsx

NÃO commitar no git.
Validar build e testes antes de entregar.
```

---

### 🔷 SPRINT 4: Cards Parte 2 (Dias 14-17)

#### AGENT 6 - Fullstack Cards 2 + Health Score
**Prompt:**
```
Você é um fullstack developer especialista em React + algoritmos.

Implemente os 3 cards finais com cálculo complexo:

### Card 4: Motivos de Perda
- Hook: hooks/dashboard/use-lost-reasons.ts + teste
- Componente: app/dashboard/_components/cards/motivos-perda/
- Gráfico donut com motivos

### Card 5: Receita Semanal
- Hook: hooks/dashboard/use-revenue.ts + teste
- Componente: app/dashboard/_components/cards/receita-semanal/
- Gráfico de linha (últimas 8 semanas)

### Card 6: Health Score (MAIS COMPLEXO)
- Algoritmo: lib/calculations/health-score.ts + teste unitário
  - Cálculo ponderado: Conversão 30%, Velocidade 25%, Estagnados 25%, Follow-up 20%
  - Retornar score 0-100 + status + breakdown
- Hook: hooks/dashboard/use-health-score.ts + teste
- Componente: app/dashboard/_components/cards/health-score/
  - index.tsx
  - gauge.tsx (círculo animado)
  - metrics.tsx (4 métricas detalhadas)
  - __tests__/

### Integração Final
- Atualizar app/dashboard/page.tsx com prefetch SSR
- Atualizar app/dashboard/_components/dashboard-content.tsx

Requisitos:
- Testes unitários para cálculo do Health Score (100% cobertura)
- Testes de integração
- Gauge animado suave
- Cálculo preciso validado

Arquivos:
- lib/calculations/health-score.ts + __tests__/
- hooks/dashboard/use-health-score.ts
- app/dashboard/_components/cards/health-score/*
- app/dashboard/page.tsx (atualizar)

NÃO commitar no git.
Build + testes passando antes de entregar.
```

---

### 🔷 SPRINT 5: QA e Polish (Dias 18-20)

#### AGENT 7 - QA/Testing Specialist
**Prompt:**
```
Você é um especialista em QA, testes de integração e performance.

Finalize o dashboard com testes completos e validação:

1. **Testes de Integração**
   - __tests__/integration/dashboard-flow.test.tsx
   - Teste E2E: renderização completa da página
   - Teste de interação: filtros, cliques, navegação
   - Teste de dados: mock de APIs, verificar conteúdo

2. **Testes de Skeleton Loading**
   - Verificar todos os cards mostram skeleton inicial
   - Verificar transição suave skeleton → dados
   - Verificar skeletons específicos (funnel, circle, chart)

3. **Testes de Erro**
   - Simular erro de API em cada card
   - Verificar mensagens de erro
   - Verificar botão de retry funciona

4. **Testes de Responsividade**
   - Simular viewports: desktop (1440px), tablet (1024px), mobile (768px)
   - Verificar layout não quebra

5. **Validação de Build**
   - Executar: npm run test (todos passando)
   - Executar: npm run test:coverage (> 90%)
   - Executar: next build (sem erros)
   - Executar: npx tsc --noEmit
   - Executar: npm run lint

6. **Lighthouse Audit**
   - Performance > 90
   - Accessibility > 95
   - Best Practices > 95
   - SEO > 90

7. **Documentação de Issues**
   - Listar quaisquer bugs encontrados
   - Sugerir correções
   - Validar fixes

Entregáveis:
- __tests__/integration/*.test.tsx
- Relatório de cobertura de testes
- Relatório Lighthouse
- Lista de bugs (se houver)

NÃO commitar no git.
Dashboard deve estar 100% pronto após este agent.
```

---

## 🔄 FLUXO DE TRABALHO DOS AGENTS

### Para Cada Agent:

```
1. RECEBER PROMPT
      ↓
2. ANALISAR DEPENDÊNCIAS
   └─► Verificar se precisa de código de outro agent
      ↓
3. DESENVOLVER
   └─► Criar código + testes
      ↓
4. VALIDAR LOCALMENTE
   └─► npm run test
   └─► npm run test:coverage (> 90%)
   └─► next build
      ↓
5. ENTREGAR
   └─► Arquivos criados listados
   └─► Evidência de testes passando
   └─► Evidência de build passando
      ↓
6. AGUARDAR PRÓXIMO AGENT (se houver dependência)
```

---

## ⚠️ REGRAS PARA AGENTS

### Antes de Começar:
- [ ] Verificar se há dependências pendentes de outros agents
- [ ] Confirmar arquivos base existem
- [ ] Validar que está na branch correta (local)

### Durante Desenvolvimento:
- [ ] Seguir padrão de código do projeto existente
- [ ] Criar testes junto com o código (TDD preferencial)
- [ ] Nunca deixar testes quebrando
- [ ] Usar TypeScript estrito (any = proibido)

### Antes de Entregar:
- [ ] Executar: `npm run test` (deve passar 100%)
- [ ] Executar: `npm run test:coverage` (> 90%)
- [ ] Executar: `next build` (deve passar)
- [ ] Listar todos os arquivos criados/modificados
- [ ] Descrever como validar a entrega

### ❌ PROIBÍDO:
- Commitar no git
- Ignorar testes falhando
- Deixar código com `any`
- Quebrar build existente

---

## 📋 CHECKLIST DE HANDOFF ENTRE AGENTS

### Agent 1 → Agent 2 (Sprint 1)
```
Agent 1 entrega:
✅ sidebar.tsx (280px)
✅ kpis-sidebar.tsx
✅ dashboard-grid.tsx
✅ dashboard-card.tsx

Agent 2 valida:
□ Arquivos existem
□ Componentes renderizam
□ Props estão tipadas
□ Build passa
```

### Agent 4 → Agent 3 (Sprint 2)
```
Agent 4 entrega:
✅ schema.prisma atualizado
✅ migration.sql gerado
✅ dashboard-queries.ts

Agent 3 valida:
□ Tipos do Prisma disponíveis
□ Queries funcionam (testar local)
□ Seed gera dados
```

### Agents 1-4 → Agent 5 (Sprint 3)
```
Agentes anteriores entregam:
✅ Componentes base
✅ APIs funcionando
✅ Setup de testes

Agent 5 valida:
□ Pode importar componentes base
□ Pode chamar APIs
□ Testes rodam
```

### Agent 5 → Agent 6 (Sprint 4)
```
Agent 5 entrega:
✅ 3 cards funcionando
✅ Hooks testados
✅ Filtros de período

Agent 6 valida:
□ Padrão de card estabelecido
□ Hooks como referência
□ Filtros integráveis
```

### Agents 1-6 → Agent 7 (Sprint 5)
```
Agentes anteriores entregam:
✅ Todos os 6 cards
✅ Todas as APIs
✅ Schema migrado

Agent 7 valida:
□ Dashboard renderiza completamente
□ Testes unitários passam
□ Build passa
□ Lighthouse scores aceitáveis
```

---

## 🎯 RESUMO EXECUTIVO

| Sprint | Agents | Entrega Chave | Validação Build |
|--------|--------|---------------|-----------------|
| 1 | 1, 2 | Layout base + Testes setup | ✅ |
| 2 | 3, 4 | APIs + DB | ✅ |
| 3 | 5 | 3 Cards + Filtros | ✅ |
| 4 | 6 | 3 Cards + Health Score | ✅ |
| 5 | 7 | QA + Integração | ✅ |

**Total: 7 Agents sequenciais/paralelos**  
**Duração: 20 dias**  
**Regra: NENHUM commit no git até aprovação final**

---

## 🚀 COMO INICIAR

1. **Criar branch local** (não pushar):
   ```bash
   git checkout -b feature/new-dashboard-local
   ```

2. **Iniciar Agent 1 + Agent 2 em paralelo** (Sprint 1)

3. **Aguardar entrega** e validar

4. **Prosseguir** para próximos agents seguindo dependências

5. **Ao final** (Dia 20): Validar tudo e só então abrir PR

---

*Documento de orquestração criado em: 13/03/2026*  
*Versão: 1.0*
