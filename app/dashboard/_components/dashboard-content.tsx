'use client'

import { DashboardGrid, DashboardRow } from '@/components/dashboard/dashboard-grid'
import { KpiVerticalItem, KpiVerticalList } from '@/components/dashboard/kpi-vertical-item'
import { FunilPorEtapaCard } from './cards/funil-por-etapa'
import { RecuperacaoPerdidosCard } from './cards/recuperacao-perdidos'
import { PerformanceCanalCard } from './cards/performance-canal'
import { MotivosPerdaCard } from './cards/motivos-perda'
import { ReceitaSemanalCard } from './cards/receita-semanal'
import { HealthScoreCard } from './cards/health-score'
import { TrendingUp, DollarSign, Target, Users } from 'lucide-react'
import { useKPIs } from '@/hooks/use-dashboard-metrics'
import { useOrganizationId } from '@/lib/contexts/organization-context'
/**
 * DashboardContent - Componente principal do dashboard
 * 
 * Estrutura:
 * - Sidebar com KPIs verticais (esquerda)
 * - Grid principal com 3 rows de cards
 * 
 * Layout:
 * - Row 1: Funil (2fr) + Recuperação (1fr)
 * - Row 2: Performance Canal (1fr) + Motivos Perda (1fr)
 * - Row 3: Receita Semanal (expandido) + Health Score (compacto)
 * 
 * Cada card é independente e carrega seus próprios dados
 * através do React Query.
 */
export function DashboardContent() {
  return (
    <>
      {/* Dashboard Grid com Sidebar */}
      <DashboardGrid
        sidebar={<KpiSidebar />}
      >
        {/* Row 1: Funil (2fr) + Recuperação (1fr) */}
        <DashboardRow columns={2}>
          <FunilPorEtapaCard />
          <RecuperacaoPerdidosCard />
        </DashboardRow>

        {/* Row 2: Performance Canal (1fr) + Motivos Perda (1fr) */}
        <DashboardRow columns={2}>
          <PerformanceCanalCard />
          <MotivosPerdaCard />
        </DashboardRow>

        {/* Row 3: Receita alinhado com sidebar + Health Score */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-5 h-[200px]">
          <div className="xl:-ml-[176px] h-[200px]"> {/* Puxa para alinhar com sidebar (160px + gap-5) */}
            <ReceitaSemanalCard />
          </div>
          <HealthScoreCard compact />
        </div>
      </DashboardGrid>
    </>
  )
}

function KpiSidebar() {
  const organizationId = useOrganizationId()
  const { kpis, isLoading } = useKPIs(organizationId ?? undefined)

  const fmt = (v: number | undefined | null) =>
    `R$ ${(Number(v) || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
  const fmtPct = (v: number | undefined | null) => {
    const n = Number(v) || 0
    return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`
  }

  return (
    <KpiVerticalList className="h-full">
      <KpiVerticalItem
        label="Receita em Aberto"
        value={kpis ? fmt(kpis.pipelineValue) : '—'}
        change={kpis ? fmtPct(kpis.pipelineChange) : undefined}
        icon={TrendingUp}
        loading={isLoading}
      />
      <KpiVerticalItem
        label="Receita Fechada"
        value={kpis ? fmt(kpis.closedRevenue) : '—'}
        change={kpis ? fmtPct(kpis.revenueGrowth) : undefined}
        icon={DollarSign}
        loading={isLoading}
      />
      <KpiVerticalItem
        label="Taxa de Conversão"
        value={kpis ? `${(Number(kpis.conversionRate) || 0).toFixed(1)}%` : '—'}
        change={kpis ? fmtPct(kpis.conversionChange) : undefined}
        icon={Target}
        loading={isLoading}
      />
      <KpiVerticalItem
        label="Leads Esta Semana"
        value={kpis ? (Number(kpis.leadsThisWeek) || 0).toString() : '—'}
        change={kpis ? fmtPct(kpis.leadsGrowth) : undefined}
        icon={Users}
        loading={isLoading}
      />
    </KpiVerticalList>
  )
}

export default DashboardContent
