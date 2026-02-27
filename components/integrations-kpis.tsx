"use client"

import { Plug, MessageSquare, Activity, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatRelativeDate } from "@/lib/utils"
import type { IntegrationKPIs } from "@/lib/types/integration"

interface Props {
  kpis: IntegrationKPIs
}

export function IntegrationsKPIs({ kpis }: Props) {
  return (
    <div className="grid grid-cols-4 gap-6">
      {/* Connected Count */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7C3AED]/10">
              <Plug className="h-6 w-6 text-[#7C3AED]" />
            </div>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
              +2 este mês
            </span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-foreground">{kpis.connectedCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">Integrações Conectadas</p>
          </div>
        </CardContent>
      </Card>

      {/* Total Messages */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
              <MessageSquare className="h-6 w-6 text-blue-500" />
            </div>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
              +12%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-foreground">
              {kpis.totalMessages.toLocaleString('pt-BR')}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Mensagens (24h)</p>
          </div>
        </CardContent>
      </Card>

      {/* Health Score */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
              <Activity className="h-6 w-6 text-green-500" />
            </div>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
              Ótimo
            </span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-foreground">{kpis.avgHealthScore}%</p>
            <p className="mt-1 text-sm text-muted-foreground">Saúde Geral</p>
          </div>
        </CardContent>
      </Card>

      {/* Last Sync */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-foreground">
              {kpis.lastSync ? formatRelativeDate(kpis.lastSync.toISOString()).replace(' atrás', '') : 'N/A'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Última Sincronização</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
