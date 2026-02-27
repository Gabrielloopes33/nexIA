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
import { UTMPerformanceChart } from "@/components/utm-performance-chart"
import { RecentLeads } from "@/components/recent-leads"
import { DealProgressChart } from "@/components/charts/deal-progress-chart"
import { DealConversionChart } from "@/components/charts/deal-conversion-chart"
import { ActivitiesCompleteChart } from "@/components/charts/activities-complete-chart"
import { ContactDetailPanel } from "@/components/contact-detail-panel"
import { ENRICHED_LEADS } from "@/lib/mock-leads-enriched"
import { calculateAllKPIs } from "@/lib/calculations/kpi-calculator"
import { formatCurrency, formatDuration, formatChange } from "@/lib/formatters"
import { TrendingUp, DollarSign, Clock, Target } from "lucide-react"

export default function DashboardPage() {
  const kpis = calculateAllKPIs(ENRICHED_LEADS)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Main Sidebar */}
      <Sidebar />

      {/* Contextual Sub-Sidebar - aparece apenas quando ativa */}
      <ContextualSubSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
        <DashboardHeader />

        {/* 3-Column Grid Layout - Enterprise Style */}
        <div className="dashboard-grid mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)]">
          
          {/* COLUNA 1: KPIs Verticais (SEMPRE FIXOS - NUNCA SOBEM) */}
          <div className="kpi-sidebar flex flex-col gap-3 md:col-span-2 xl:col-span-1">
            {/* Grid dos 4 KPIs */}
            <div className="kpi-grid grid grid-cols-2 gap-3 xl:grid-cols-1">
              <VerticalKpiCard
                label="Pipeline Total"
                value={formatCurrency(kpis.pipeline.value)}
                change={formatChange(kpis.pipeline.change || 0).value}
                icon={TrendingUp}
              />
              <VerticalKpiCard
                label="Ticket Médio"
                value={formatCurrency(kpis.ticket.value)}
                change={formatChange(kpis.ticket.change || 0).value}
                icon={DollarSign}
              />
              <VerticalKpiCard
                label="Tempo de Conversão"
                value={formatDuration(kpis.conversion.value, 'days')}
                change={formatChange(kpis.conversion.change || 0).value}
                icon={Clock}
                isNegativeGood={true}
              />
              <VerticalKpiCard
                label="Lead Score Médio"
                value={kpis.score.value.toString()}
                change={formatChange(kpis.score.change || 0).value}
                icon={Target}
                suffix=" / 100"
              />
            </div>
            
            {/* Cards menores */}
            <ObjectionsChart />
            <TagPerformanceChart />
          </div>

          {/* COLUNA 2: Conteúdo Principal */}
          <div className="main-content flex flex-col gap-4">
            {/* HERO 1: Leads Recentes (Primeira fileira) */}
            <RecentLeads />
            
            {/* Secundários */}
            <ActivitiesCompleteChart />
            <LeadTrendsChart />
            <DealProgressChart />
          </div>

          {/* COLUNA 3: Conteúdo Principal */}
          <div className="main-content flex flex-col gap-4">
            {/* HERO 2: Mapa de Atividade (Primeira fileira) */}
            <ActivityHeatmap />
            
            {/* Total de conversas do período */}
            <ConversationVolumeChart />
            
            {/* Secundários */}
            <ConversionDonutChart />
            <UTMPerformanceChart />
            <DealConversionChart />
          </div>
          
        </div>
      </main>

      {/* Contact Detail Panel - Right Sidebar */}
      <ContactDetailPanel />
    </div>
  )
}
