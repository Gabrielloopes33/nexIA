# Plano Técnico: Métricas do Dashboard CRM

## Visão Geral

Este documento descreve a implementação técnica completa das métricas do dashboard de CRM de vendas, incluindo schema de banco de dados, queries otimizadas, API routes, estratégia de caching e tipos TypeScript.

## Sumário

1. [Schema do Banco de Dados](#1-schema-do-banco-de-dados)
2. [Queries Otimizadas](#2-queries-otimizadas)
3. [API Routes](#3-api-routes)
4. [Estratégia de Caching](#4-estratégia-de-caching)
5. [Tipos TypeScript](#5-tipos-typescript)
6. [Seeding de Dados](#6-seeding-de-dados)
7. [Execução](#7-execução)

---

## 1. Schema do Banco de Dados

### 1.1 Novos Enums

```prisma
enum LostReason {
  PRICE
  COMPETITOR
  TIMING
  NO_BUDGET
  NO_INTEREST
  UNREACHABLE
  OTHER
}

enum ChannelType {
  WHATSAPP_OFFICIAL
  WHATSAPP_UNOFFICIAL
  INSTAGRAM
  MANUAL
  API
}

enum RecoveryPotential {
  HIGH
  MEDIUM
  LOW
  NONE
}
```

### 1.2 Campos Adicionados ao Model `Deal`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `lostReason` | `LostReason?` | Motivo da perda |
| `lostReasonDetail` | `String?` | Detalhes do motivo |
| `lostAt` | `DateTime?` | Data da perda |
| `recoveryPotential` | `RecoveryPotential?` | Potencial de recuperação |
| `recoveryScore` | `Float?` | Score de recuperação (0-100) |
| `channel` | `ChannelType?` | Canal de origem |
| `channelInstanceId` | `String?` | ID da instância |
| `enteredStageAt` | `DateTime?` | Entrada na etapa atual |
| `firstContactAt` | `DateTime?` | Primeiro contato |
| `qualifiedAt` | `DateTime?` | Qualificação |
| `proposalAt` | `DateTime?` | Proposta enviada |
| `negotiationAt` | `DateTime?` | Negociação |
| `lastFollowUpAt` | `DateTime?` | Último follow-up |
| `nextFollowUpAt` | `DateTime?` | Próximo follow-up |
| `followUpCount` | `Int` | Contador de follow-ups |

### 1.3 Novas Tabelas

#### `PipelineStageHistory`
Tracking de tempo em cada etapa do funil.

```prisma
model PipelineStageHistory {
  id              String    @id @default(uuid())
  dealId          String
  stageId         String
  organizationId  String
  enteredAt       DateTime
  exitedAt        DateTime?
  durationHours   Int?
  amount          Decimal?
  leadScore       Int?
  createdAt       DateTime  @default(now())
}
```

#### `MonthlyGoal`
Metas mensais por organização.

```prisma
model MonthlyGoal {
  id              String    @id @default(uuid())
  organizationId  String
  year            Int
  month           Int
  revenueGoal     Decimal   @db.Decimal(15, 2)
  dealsGoal       Int
  leadsGoal       Int
  conversionGoal  Float
  revenueAchieved Decimal?  @db.Decimal(15, 2)
  dealsAchieved   Int       @default(0)
  leadsAchieved   Int       @default(0)
  active          Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@unique([organizationId, year, month])
}
```

#### `DashboardMetricCache`
Cache de métricas calculadas.

```prisma
model DashboardMetricCache {
  id              String    @id @default(uuid())
  organizationId  String
  metricType      String    // 'funnel', 'revenue', 'health_score'
  period          String    // '7d', '30d', '90d'
  data            Json
  expiresAt       DateTime
  createdAt       DateTime  @default(now())
  
  @@unique([organizationId, metricType, period])
}
```

#### `ChannelMetric`
Métricas diárias por canal.

```prisma
model ChannelMetric {
  id                    String        @id @default(uuid())
  organizationId        String
  date                  DateTime      @db.Date
  channel               ChannelType
  messagesSent          Int           @default(0)
  messagesReceived      Int           @default(0)
  messagesRead          Int           @default(0)
  firstResponseCount    Int           @default(0)
  avgFirstResponseSecs  Int           @default(0)
  leadsGenerated        Int           @default(0)
  dealsCreated          Int           @default(0)
  dealsWon              Int           @default(0)
  revenueWon            Decimal       @default(0) @db.Decimal(15, 2)
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt
  
  @@unique([organizationId, date, channel])
}
```

### 1.4 View Materializada (Opcional)

```sql
CREATE MATERIALIZED VIEW mv_funnel_by_stage AS
SELECT 
  organization_id,
  stage_id,
  DATE_TRUNC('week', created_at) as week,
  COUNT(*) as deal_count,
  SUM(amount) as total_value,
  AVG(lead_score) as avg_lead_score
FROM deals
WHERE status = 'OPEN'
GROUP BY organization_id, stage_id, DATE_TRUNC('week', created_at);
```

---

## 2. Queries Otimizadas

Todas as queries estão em `lib/db/dashboard-queries.ts`:

### 2.1 Funil por Etapa
```typescript
export async function getFunnelMetrics(
  organizationId: string,
  period: '7d' | '30d' | '90d' = '30d'
): Promise<FunnelMetrics>
```

### 2.2 Recuperação de Perdidos
```typescript
export async function getLostDealsMetrics(
  organizationId: string,
  days: number = 30
): Promise<LostDealsMetrics>
```

### 2.3 Performance por Canal
```typescript
export async function getChannelPerformance(
  organizationId: string,
  days: number = 30
): Promise<ChannelPerformance[]>
```

### 2.4 Motivos de Perda
```typescript
export async function getLostReasonsTrend(
  organizationId: string,
  currentDays: number = 30,
  compareDays: number = 60
)
```

### 2.5 Receita Semanal
```typescript
export async function getWeeklyRevenue(
  organizationId: string,
  weeks: number = 8
): Promise<WeeklyRevenue[]>
```

### 2.6 Health Score
```typescript
export async function calculateHealthScore(
  organizationId: string
): Promise<HealthScore>
```

Cálculo:
- **Conversão vs Meta**: peso 30%
- **Velocidade do Funil**: peso 25%
- **Leads Estagnados (>7 dias)**: peso 25%
- **Follow-up em dia**: peso 20%

### 2.7 KPIs Verticais
```typescript
export async function getKPIs(organizationId: string): Promise<KPIs>
```

---

## 3. API Routes

### Endpoints Disponíveis

| Endpoint | Descrição | Parâmetros |
|----------|-----------|------------|
| `GET /api/dashboard/funnel` | Funil por etapa | `organizationId`, `period` |
| `GET /api/dashboard/lost-deals` | Deals perdidos | `organizationId`, `days` |
| `GET /api/dashboard/channels` | Performance por canal | `organizationId`, `days` |
| `GET /api/dashboard/lost-reasons` | Motivos de perda | `organizationId`, `currentDays` |
| `GET /api/dashboard/revenue` | Receita semanal | `organizationId`, `weeks` |
| `GET /api/dashboard/health-score` | Health score | `organizationId` |
| `GET /api/dashboard/kpis` | KPIs verticais | `organizationId` |
| `GET /api/dashboard/all` | Todas as métricas | `organizationId` |

### Exemplo de Resposta

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-03-13T10:00:00.000Z",
    "cached": false
  }
}
```

---

## 4. Estratégia de Caching

### 4.1 SWR (Frontend)

```typescript
// Configuração padrão
const defaultConfig: SWRConfiguration = {
  refreshInterval: 5 * 60 * 1000,  // 5 minutos
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  errorRetryCount: 3,
  dedupingInterval: 2000,
}

// Hooks disponíveis
const { funnel, isLoading, error, refresh } = useFunnelMetrics(organizationId, '30d')
const { kpis, isLoading } = useKPIs(organizationId)
const { metrics } = useAllDashboardMetrics(organizationId)
```

### 4.2 Cache no Banco de Dados

A tabela `DashboardMetricCache` armazena resultados calculados com TTL:

```typescript
// Salvar no cache
await prisma.dashboardMetricCache.upsert({
  where: { organizationId_metricType_period: { ... } },
  update: { data, expiresAt },
  create: { organizationId, metricType, period, data, expiresAt },
})
```

### 4.3 Recomendações de Cache

| Métrica | TTL | Local |
|---------|-----|-------|
| Funil | 5 min | SWR + DB |
| KPIs | 2 min | SWR |
| Health Score | 10 min | SWR + DB |
| Receita | 1 hora | SWR + DB |
| Canais | 15 min | SWR |

---

## 5. Tipos TypeScript

Local: `types/dashboard.ts`

### Tipos Principais

```typescript
interface FunnelMetrics {
  stages: FunnelStage[]
  totalLeads: number
  totalValue: number
  avgConversionTime: number
}

interface HealthScore {
  total: number
  factors: HealthScoreFactors
  status: 'excellent' | 'good' | 'average' | 'poor' | 'critical'
  recommendations: string[]
}

interface KPIs {
  leadsThisWeek: number
  leadsGrowth: number
  closedRevenue: number
  revenueGrowth: number
  conversionRate: number
  conversionChange: number
  pipelineValue: number
  pipelineChange: number
  avgDealTime: number
  avgDealTimeChange: number
}
```

---

## 6. Seeding de Dados

Script: `scripts/seed-dashboard-metrics.ts`

### Uso

```bash
npx tsx scripts/seed-dashboard-metrics.ts <organizationId>
```

### Dados Gerados

- **200 deals** com distribuição realista entre status (OPEN, WON, LOST)
- **150 contatos** com scores variados
- **300 conversas** com mensagens
- **5 etapas do pipeline** (Novo, Qualificado, Proposta, Negociação, Fechado)
- **Histórico de estágios** para tracking de tempo
- **Metas mensais** para os últimos 3 meses

---

## 7. Execução

### 7.1 Aplicar Migration

```bash
# Opção 1: Via Prisma Migrate
npx prisma migrate dev --name add_dashboard_metrics

# Opção 2: SQL direto (PostgreSQL)
psql -d sua_database -f migrations/20250313_add_dashboard_metrics.sql
```

### 7.2 Gerar Prisma Client

```bash
npx prisma generate
```

### 7.3 Seed de Dados (Desenvolvimento)

```bash
# Criar dados de teste
npx tsx scripts/seed-dashboard-metrics.ts <organizationId>
```

### 7.4 Atualizar View Materializada (Produção)

```sql
-- Configurar job periódico (ex: a cada 15 minutos)
SELECT cron.schedule('refresh-funnel-view', '*/15 * * * *', 
  'SELECT refresh_funnel_view()'
);
```

---

## Checklist de Implementação

- [ ] Executar migration SQL
- [ ] Gerar Prisma Client
- [ ] Verificar se todas as tabelas foram criadas
- [ ] Testar endpoints da API
- [ ] Validar queries de performance
- [ ] Configurar jobs de cache/refresh
- [ ] Documentar para equipe

---

## Performance Considerações

1. **Índices**: Todas as queries usam índices apropriados
2. **Agregações**: Uso de `GROUP BY` no PostgreSQL
3. **Raw Queries**: Para cálculos complexos de tempo
4. **Cache**: 2 camadas (SWR + DB)
5. **View Materializada**: Para funil (atualização periódica)

---

## Arquivos Criados

```
prisma/
  └── schema-extensions.prisma    # Extensões do schema

lib/db/
  └── dashboard-queries.ts        # Queries otimizadas

app/api/dashboard/
  ├── funnel/route.ts             # GET /api/dashboard/funnel
  ├── lost-deals/route.ts         # GET /api/dashboard/lost-deals
  ├── channels/route.ts           # GET /api/dashboard/channels
  ├── lost-reasons/route.ts       # GET /api/dashboard/lost-reasons
  ├── revenue/route.ts            # GET /api/dashboard/revenue
  ├── health-score/route.ts       # GET /api/dashboard/health-score
  ├── kpis/route.ts               # GET /api/dashboard/kpis
  └── all/route.ts                # GET /api/dashboard/all

types/
  └── dashboard.ts                # Tipos TypeScript

hooks/
  └── use-dashboard-metrics.ts    # Hooks SWR

scripts/
  └── seed-dashboard-metrics.ts   # Seeding de dados

migrations/
  └── 20250313_add_dashboard_metrics.sql  # Migration SQL

docs/
  └── DASHBOARD-METRICS-TECHNICAL-PLAN.md # Este documento
```

---

**Autor:** Especialista Backend CRM  
**Data:** 13/03/2025  
**Versão:** 1.0
