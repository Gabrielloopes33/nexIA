import { Users, Building2, ShieldCheck, TrendingUp } from "lucide-react"
import { ENRICHED_LEADS } from '@/lib/mock-leads-enriched'
import { formatNumber, formatPercentage } from '@/lib/formatters'

export function KpiCards() {
  // Calcula KPIs reais dos leads enriquecidos
  const totalLeads = ENRICHED_LEADS.length
  const activeContacts = ENRICHED_LEADS.filter(l => l.status === 'ativo').length
  const conversions = ENRICHED_LEADS.filter(l => l.status === 'cliente' || l.negocios).length
  const conversionRate = totalLeads > 0 ? (conversions / totalLeads) * 100 : 0
  const closedDeals = ENRICHED_LEADS.filter(l => l.receita && l.receita > 0).length

  const kpis = [
    {
      label: "Total de Leads",
      value: formatNumber(totalLeads),
      change: "+11,4%",
      icon: Users,
      iconBg: "#DBEAFE",
      iconColor: "#2563EB",
    },
    {
      label: "Contatos Ativos",
      value: formatNumber(activeContacts),
      change: "+13,9%",
      icon: Building2,
      iconBg: "#DCFCE7",
      iconColor: "#16A34A",
    },
    {
      label: "Taxa de Conversão",
      value: formatPercentage(conversionRate, 1),
      change: "+9,2%",
      icon: ShieldCheck,
      iconBg: "#E9D5FF",
      iconColor: "#7C3AED",
    },
    {
      label: "Negócios Fechados",
      value: formatNumber(closedDeals),
      change: "+8,0%",
      icon: TrendingUp,
      iconBg: "#FED7AA",
      iconColor: "#D97706",
    },
  ]
  return (
    <div className="rounded-sm border-2 border-border bg-card p-4">
      <div className="grid grid-cols-2 gap-0">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon
          const isTop = index < 2
          const isLeft = index % 2 === 0
          return (
            <div
              key={kpi.label}
              className={`flex flex-col gap-3 p-4 ${isTop ? "" : "border-t border-border"} ${isLeft ? "" : "border-l border-border"}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-sm bg-gradient-to-br from-[#9795e4] to-[#b3b3e5]"
                >
                  <Icon className="h-5 w-5 text-white" strokeWidth={1.8} />
                </div>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {kpi.label}
                </span>
              </div>
              <div className="flex items-end gap-2">
                <span className="inline-flex items-center gap-1 rounded-sm bg-[#D1FAE5] px-2 py-0.5 text-[11px] font-medium text-[#027E46]">
                  <TrendingUp className="h-3 w-3" />
                  {kpi.change}
                </span>
              </div>
              <span className="text-[28px] font-bold leading-none text-foreground">{kpi.value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
