"use client"

import { MessageSquare, Clock, CheckCircle, Star } from "lucide-react"
import { Conversation } from "@/lib/types/conversation"

interface ConversationsKPIsProps {
  conversations: Conversation[]
}

export function ConversationsKPIs({ conversations }: ConversationsKPIsProps) {
  // Cálculo dos KPIs
  const openConversations = conversations.filter(c => c.status === "open").length
  
  // Tempo médio de primeira resposta (em minutos)
  const conversationsWithResponse = conversations.filter(c => c.firstResponseAt)
  const avgFirstResponseMinutes = conversationsWithResponse.length > 0
    ? conversationsWithResponse.reduce((sum, c) => {
        const created = new Date(c.createdAt).getTime()
        const firstResponse = new Date(c.firstResponseAt!).getTime()
        return sum + (firstResponse - created) / (1000 * 60)
      }, 0) / conversationsWithResponse.length
    : 0
  
  // Taxa de resolução (conversas resolvidas vs total)
  const solvedOrClosed = conversations.filter(c => 
    c.status === "solved" || c.status === "closed"
  ).length
  const resolutionRate = conversations.length > 0
    ? Math.round((solvedOrClosed / conversations.length) * 100)
    : 0
  
  // CSAT Score (mock - em produção viria de survey)
  const csatScore = 4.7

  // Variações (mock - em produção compararia com período anterior)
  const trends = {
    openConversations: "+8.5%",
    avgFirstResponseTime: "-12.3%", // negativo é bom (mais rápido)
    resolutionRate: "+5.7%",
    customerSatisfaction: "+2.1%",
  }

  const kpis = [
    {
      label: "Conversas Abertas",
      value: openConversations.toLocaleString("pt-BR"),
      change: trends.openConversations,
      trend: "up" as const,
      icon: MessageSquare,
      iconBg: "bg-blue-100 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Tempo Médio Resposta",
      value: avgFirstResponseMinutes < 60 
        ? `${Math.round(avgFirstResponseMinutes)}min`
        : `${Math.round(avgFirstResponseMinutes / 60)}h`,
      change: trends.avgFirstResponseTime,
      trend: "down" as const, // down é bom para tempo
      icon: Clock,
      iconBg: "bg-emerald-100 dark:bg-emerald-900/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Taxa de Resolução",
      value: `${resolutionRate}%`,
      change: trends.resolutionRate,
      trend: "up" as const,
      icon: CheckCircle,
      iconBg: "bg-purple-100 dark:bg-purple-900/20",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      label: "Satisfação Cliente",
      value: csatScore.toFixed(1),
      change: trends.customerSatisfaction,
      trend: "up" as const,
      icon: Star,
      iconBg: "bg-amber-100 dark:bg-amber-900/20",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        const changeIsPositive = kpi.change.startsWith("+")
        const changeIsNegative = kpi.change.startsWith("-")
        
        // Para tempo de resposta, negativo é bom (mais rápido)
        const isGoodChange = kpi.label === "Tempo Médio Resposta"
          ? changeIsNegative
          : changeIsPositive

        return (
          <div
            key={kpi.label}
            className="rounded-xl border border-border bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
          >
            {/* Icon + Badge */}
            <div className="flex items-center justify-between mb-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${kpi.iconBg}`}>
                <Icon className={`h-5 w-5 ${kpi.iconColor}`} strokeWidth={1.8} />
              </div>
              <span
                className={`text-xs font-semibold ${
                  isGoodChange
                    ? "text-emerald-600 dark:text-emerald-400"
                    : changeIsNegative
                    ? "text-red-600 dark:text-red-400"
                    : "text-muted-foreground"
                }`}
              >
                {kpi.change}
              </span>
            </div>

            {/* Value */}
            <div className="text-2xl font-bold text-foreground mb-1">{kpi.value}</div>

            {/* Label */}
            <div className="text-xs text-muted-foreground">{kpi.label}</div>
          </div>
        )
      })}
    </div>
  )
}
