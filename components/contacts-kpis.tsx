"use client"

import { Users, UserCheck, TrendingUp, Clock } from "lucide-react"
import { Contact } from "@/lib/types/contact"

interface ContactsKPIsProps {
  contacts: Contact[]
}

export function ContactsKPIs({ contacts }: ContactsKPIsProps) {
  // Cálculo dos KPIs
  const totalContatos = contacts.length
  const contatosAtivos = contacts.filter(c => c.status === "ativo").length
  
  // Novos este mês (últimos 30 dias)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const novosEsteMes = contacts.filter(c => 
    new Date(c.criadoEm) > thirtyDaysAgo
  ).length
  
  // Precisam follow-up (sem contato há mais de 30 dias)
  const precisamFollowUp = contacts.filter(c => {
    if (!c.ultimoContato) return true
    const lastContact = new Date(c.ultimoContato)
    return new Date().getTime() - lastContact.getTime() > 30 * 24 * 60 * 60 * 1000
  }).length

  // Cálculo de variações (mock - em produção viria do backend)
  const variacaoTotal = "+12.5%"
  const variacaoAtivos = "+8.3%"
  const variacaoNovos = "+15.2%"
  const variacaoFollowUp = "-5.7%"

  const kpis = [
    {
      label: "Total de Contatos",
      value: totalContatos.toLocaleString("pt-BR"),
      change: variacaoTotal,
      trend: "up" as const,
      icon: Users,
      iconBg: "bg-blue-100 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Contatos Ativos",
      value: contatosAtivos.toLocaleString("pt-BR"),
      change: variacaoAtivos,
      trend: "up" as const,
      icon: UserCheck,
      iconBg: "bg-emerald-100 dark:bg-emerald-900/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Novos Este Mês",
      value: novosEsteMes.toLocaleString("pt-BR"),
      change: variacaoNovos,
      trend: "up" as const,
      icon: TrendingUp,
      iconBg: "bg-purple-100 dark:bg-purple-900/20",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      label: "Precisam Follow-up",
      value: precisamFollowUp.toLocaleString("pt-BR"),
      change: variacaoFollowUp,
      trend: "down" as const,
      icon: Clock,
      iconBg: "bg-amber-100 dark:bg-amber-900/20",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        const isPositive = kpi.change.startsWith("+")
        const isNegative = kpi.change.startsWith("-")

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
                  isPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : isNegative
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
