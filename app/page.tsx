'use client'

import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { ContextualSubSidebar } from "@/components/contextual-sub-sidebar"
import { VerticalKpiCard } from "@/components/vertical-kpi-card"
import { LeadTrendsChart } from "@/components/lead-trends-chart"
import { ActivityHeatmap } from "@/components/activity-heatmap"
import { ConversationVolumeChart } from "@/components/conversation-volume-chart"
import { TagPerformanceChart } from "@/components/tag-performance-chart"
import { ObjectionsChart } from "@/components/objections-chart"
import { ConversionDonutChart } from "@/components/conversion-donut-chart"

import { RecentLeads } from "@/components/recent-leads"

import { ContactDetailPanel } from "@/components/contact-detail-panel"
import { ENRICHED_LEADS } from "@/lib/mock-leads-enriched"
import { calculateAllKPIs } from "@/lib/calculations/kpi-calculator"
import { formatCurrency, formatDuration, formatChange } from "@/lib/formatters"
import { TrendingUp, DollarSign, Clock, Target } from "lucide-react"

export default function DashboardPage() {
  const kpis = calculateAllKPIs(ENRICHED_LEADS)

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Main Sidebar */}
      <Sidebar />

      {/* Contextual Sub-Sidebar - aparece apenas quando ativa */}
      <ContextualSubSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        <DashboardHeader />

        {/* 2-Column Grid Layout - Enterprise Style */}
        <div className="dashboard-grid mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[160px_1fr]">
          
          {/* COLUNA 1 (ESQUERDA): KPIs Verticais */}
          <div className="kpi-sidebar flex flex-col gap-2">
            <VerticalKpiCard
              label="Receita em Aberto"
              value={formatCurrency(kpis.pipeline.value)}
              change={formatChange(kpis.pipeline.change || 0).value}
              icon={TrendingUp}
            />
            <VerticalKpiCard
              label="Valor Médio por Venda"
              value={formatCurrency(kpis.ticket.value)}
              change={formatChange(kpis.ticket.change || 0).value}
              icon={DollarSign}
            />
            <VerticalKpiCard
              label="Tempo de Fechamento"
              value={formatDuration(kpis.conversion.value, 'days')}
              change={formatChange(kpis.conversion.change || 0).value}
              icon={Clock}
              isNegativeGood={true}
            />
            <VerticalKpiCard
              label="Qualidade dos Leads"
              value={kpis.score.value.toString()}
              change={formatChange(kpis.score.change || 0).value}
              icon={Target}
              suffix=" / 100"
            />
          </div>

          {/* COLUNA 2 (MEIO): Conteúdo Principal */}
          <div className="main-content flex flex-col gap-3">
            {/* Linha 1: Objeções + Novos Leads */}
            <div className="grid grid-cols-2 gap-3">
              <ObjectionsChart />
              <RecentLeads />
            </div>
            
            {/* Linha 2: Crescimento + Conversas */}
            <div className="grid grid-cols-2 gap-3">
              <LeadTrendsChart />
              <ConversationVolumeChart />
            </div>
            
            {/* Linha 3: Mapa de Atividade + Performance por Origem */}
            <div className="grid grid-cols-2 gap-3">
              <ActivityHeatmap />
              <TagPerformanceChart />
            </div>
          </div>
          
        </div>
      </main>

      {/* Contact Detail Panel - Right Sidebar */}
      <ContactDetailPanel />
    </div>
  )
}
