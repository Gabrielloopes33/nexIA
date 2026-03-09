'use client'

import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"

import { VerticalKpiCard } from "@/components/vertical-kpi-card"
import { LeadTrendsChart } from "@/components/lead-trends-chart"
import { ActivityHeatmap } from "@/components/activity-heatmap"
import { ConversationVolumeChart } from "@/components/conversation-volume-chart"
import { TagPerformanceChart } from "@/components/tag-performance-chart"
import { ObjectionsChart } from "@/components/objections-chart"
import { ConversionDonutChart } from "@/components/conversion-donut-chart"
import { RecentLeads } from "@/components/recent-leads"
import { ContactDetailPanel } from "@/components/contact-detail-panel"
import { DashboardProvider } from "@/hooks/use-dashboard-context"
import { useFilteredData } from "@/hooks/use-filtered-data"
import { calculateAllKPIs } from "@/lib/calculations/kpi-calculator"
import { formatCurrency, formatDuration, formatChange } from "@/lib/formatters"
import { TrendingUp, DollarSign, Clock, Target } from "lucide-react"

function DashboardContent() {
  const { filteredLeads, isLoading, stats } = useFilteredData()
  const kpis = calculateAllKPIs(filteredLeads)

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
          <p className="text-sm text-slate-500">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <>
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
            label="Taxa de Conversão"
            value={`${((stats?.conversionRate || 0) * 100).toFixed(1)}%`}
            change={formatChange(5.2).value}
            icon={Target}
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
    </>
  )
}

export default function DashboardPage() {
  return (
    <DashboardProvider>
      <div className="flex h-screen overflow-hidden bg-white">
        {/* Main Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-4 py-4">
          <DashboardHeader />
          <DashboardContent />
        </main>

        {/* Contact Detail Panel - Right Sidebar */}
        <ContactDetailPanel />
      </div>
    </DashboardProvider>
  )
}
