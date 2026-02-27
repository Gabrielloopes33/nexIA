'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Layers, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type PipelineStage = 'todos' | 'qualificacao' | 'proposta' | 'negociacao' | 'ganho'

interface Deal {
  id: string
  title: string
  company: string
  value: number
  stage: 'qualificacao' | 'proposta' | 'negociacao' | 'ganho'
  daysInStage: number
}

// Mock data
const MOCK_DEALS: Deal[] = [
  { id: '1', title: 'Sistema de CRM', company: 'Tech Corp', value: 45000, stage: 'proposta', daysInStage: 3 },
  { id: '2', title: 'Consultoria TI', company: 'Startup Inc', value: 28000, stage: 'qualificacao', daysInStage: 5 },
  { id: '3', title: 'Plataforma SaaS', company: 'Enterprise LLC', value: 120000, stage: 'negociacao', daysInStage: 12 },
  { id: '4', title: 'Migração Cloud', company: 'Retail SA', value: 65000, stage: 'proposta', daysInStage: 8 },
  { id: '5', title: 'Suporte Premium', company: 'Services Co', value: 18000, stage: 'ganho', daysInStage: 2 },
  { id: '6', title: 'Integração API', company: 'Digital Ltd', value: 35000, stage: 'qualificacao', daysInStage: 1 },
  { id: '7', title: 'Treinamento', company: 'Education Hub', value: 12000, stage: 'negociacao', daysInStage: 6 },
]

export function PipelinePanel() {
  const [filter, setFilter] = useState<PipelineStage>('todos')

  const filteredDeals = filter === 'todos' 
    ? MOCK_DEALS 
    : MOCK_DEALS.filter(d => d.stage === filter)

  const qualificacaoCount = MOCK_DEALS.filter(d => d.stage === 'qualificacao').length
  const propostaCount = MOCK_DEALS.filter(d => d.stage === 'proposta').length
  const negociacaoCount = MOCK_DEALS.filter(d => d.stage === 'negociacao').length
  const ganhoCount = MOCK_DEALS.filter(d => d.stage === 'ganho').length

  const totalValue = filteredDeals.reduce((sum, d) => sum + d.value, 0)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filtros por Estágio */}
      <div className="flex flex-col gap-1.5 border-b-2 border-border p-2">
        <Button
          variant={filter === 'todos' ? 'default' : 'ghost'}
          onClick={() => setFilter('todos')}
          size="sm"
          className={cn(
            'justify-start h-8 text-xs',
            filter === 'todos' && 'bg-gradient-to-br from-[#9795e4] to-[#b3b3e5]'
          )}
        >
          <Layers className="mr-2 h-3.5 w-3.5" />
          Todos
          <Badge variant="secondary" className="ml-auto text-[9px]">
            {MOCK_DEALS.length}
          </Badge>
        </Button>
        <Button
          variant={filter === 'qualificacao' ? 'default' : 'ghost'}
          onClick={() => setFilter('qualificacao')}
          size="sm"
          className={cn(
            'justify-start h-8 text-xs',
            filter === 'qualificacao' && 'bg-gradient-to-br from-[#9795e4] to-[#b3b3e5]'
          )}
        >
          <TrendingUp className="mr-2 h-3.5 w-3.5" />
          Qualificação
          <Badge variant="secondary" className="ml-auto text-[9px]">
            {qualificacaoCount}
          </Badge>
        </Button>
        <Button
          variant={filter === 'proposta' ? 'default' : 'ghost'}
          onClick={() => setFilter('proposta')}
          size="sm"
          className={cn(
            'justify-start h-8 text-xs',
            filter === 'proposta' && 'bg-gradient-to-br from-[#9795e4] to-[#b3b3e5]'
          )}
        >
          <Clock className="mr-2 h-3.5 w-3.5" />
          Proposta
          <Badge variant="secondary" className="ml-auto text-[9px]">
            {propostaCount}
          </Badge>
        </Button>
        <Button
          variant={filter === 'negociacao' ? 'default' : 'ghost'}
          onClick={() => setFilter('negociacao')}
          size="sm"
          className={cn(
            'justify-start h-8 text-xs',
            filter === 'negociacao' && 'bg-gradient-to-br from-[#9795e4] to-[#b3b3e5]'
          )}
        >
          <Layers className="mr-2 h-3.5 w-3.5" />
          Negociação
          <Badge variant="secondary" className="ml-auto text-[9px]">
            {negociacaoCount}
          </Badge>
        </Button>
        <Button
          variant={filter === 'ganho' ? 'default' : 'ghost'}
          onClick={() => setFilter('ganho')}
          size="sm"
          className={cn(
            'justify-start h-8 text-xs',
            filter === 'ganho' && 'bg-gradient-to-br from-[#9795e4] to-[#b3b3e5]'
          )}
        >
          <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
          Ganho
          <Badge variant="secondary" className="ml-auto text-[9px]">
            {ganhoCount}
          </Badge>
        </Button>
      </div>

      {/* Lista de Deals */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {filteredDeals.map((deal) => (
            <button
              key={deal.id}
              className="w-full text-left rounded-sm border border-border p-2.5 hover:bg-muted transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-foreground truncate">
                    {deal.title}
                  </p>
                  <p className="text-[9px] text-muted-foreground truncate">
                    {deal.company}
                  </p>
                </div>
                <Badge className="bg-[#027E46] text-white text-[8px] h-4 px-1.5 shrink-0">
                  {formatCurrency(deal.value)}
                </Badge>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <Badge 
                  variant="outline" 
                  className="text-[8px] h-4 px-1.5"
                >
                  {deal.stage}
                </Badge>
                <span className="text-[8px] text-muted-foreground">
                  {deal.daysInStage} dia{deal.daysInStage !== 1 ? 's' : ''}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer com Totais */}
      <div className="border-t-2 border-border p-2">
        <div className="flex items-center justify-between text-[9px]">
          <span className="text-muted-foreground">
            {filteredDeals.length} deal{filteredDeals.length !== 1 ? 's' : ''}
          </span>
          <span className="font-semibold text-[#027E46]">
            {formatCurrency(totalValue)}
          </span>
        </div>
      </div>
    </div>
  )
}
