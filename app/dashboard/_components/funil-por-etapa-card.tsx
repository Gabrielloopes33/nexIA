'use client'

import { DashboardCard } from '@/components/dashboard/dashboard-card'
import { useFunilPorEtapa } from '../_hooks/use-funil-por-etapa'
import { FunilPorEtapaChart } from './funil-por-etapa-chart'
import { FunilPorEtapaSkeleton } from './funil-por-etapa-skeleton'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency } from '@/lib/formatters'

/**
 * FunilPorEtapaCard - Card completo do funil por etapa
 * 
 * Integração de:
 * - Hook useFunilPorEtapa para data fetching
 * - DashboardCard para container com estados
 * - FunilPorEtapaChart para visualização
 * 
 * Estados:
 * - Loading: Mostra skeleton
 * - Error: Mostra erro com retry
 * - Empty: Mostra mensagem quando não há dados
 * - Success: Mostra gráfico
 */
export function FunilPorEtapaCard() {
  const { 
    data, 
    isLoading, 
    error, 
    refetch,
    isFetching 
  } = useFunilPorEtapa()

  // Determina se está vazio
  const isEmpty = !isLoading && !error && data?.etapas.length === 0

  // Action do header (menu)
  const headerAction = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Opções</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => refetch()}>
          Atualizar dados
        </DropdownMenuItem>
        <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
        <DropdownMenuItem>Exportar</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <DashboardCard
      title="Funil por Etapa"
      description={
        data 
          ? `${data.totalLeads} leads • ${formatCurrency(data.valorTotal)}`
          : "Distribuição de leads por etapa do funil"
      }
      action={headerAction}
      loading={isLoading}
      error={error}
      onRetry={refetch}
      empty={isEmpty}
      emptyMessage="Nenhum lead no funil para o período selecionado"
      minHeight={280}
    >
      {data && (
        <>
          <FunilPorEtapaChart data={data} />
          
          {/* Footer com resumo */}
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span>Taxa de conversão geral:</span>
            <span className="font-medium text-slate-900">
              {(Number(data.taxaConversaoGeral) || 0).toFixed(1)}%
            </span>
          </div>
          
          {/* Indicador de atualização */}
          {isFetching && (
            <div className="absolute right-2 top-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            </div>
          )}
        </>
      )}
    </DashboardCard>
  )
}

/**
 * Versão compacta do card (para dashboards densos)
 */
export function FunilPorEtapaCardCompact() {
  const { data, isLoading, error, refetch } = useFunilPorEtapa()

  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <FunilPorEtapaSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-600">Erro ao carregar funil</p>
        <button 
          onClick={() => refetch()}
          className="mt-2 text-sm text-red-700 underline"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (!data || data.etapas.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">Nenhum dado disponível</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-medium text-slate-900">Funil</h3>
      <div className="mt-2 space-y-1">
        {data.etapas.slice(0, 3).map((etapa) => (
          <div key={etapa.id} className="flex items-center justify-between text-xs">
            <span className="text-slate-600">{etapa.nome}</span>
            <span className="font-medium">{etapa.quantidade}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FunilPorEtapaCard
