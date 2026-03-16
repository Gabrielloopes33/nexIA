'use client'

import { LostDeal } from '@/types/dashboard'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { User, DollarSign } from 'lucide-react'

/**
 * Props do componente RecuperacaoPerdidosList
 */
interface RecuperacaoPerdidosListProps {
  /** Lista de leads perdidos */
  deals: LostDeal[]
}

/**
 * Retorna as classes CSS para o badge de score
 * @param score - Score de recuperação (0-100)
 */
function getRecoveryColor(score: number | null): string {
  if (!score) return 'text-slate-600 bg-slate-50'
  if (score >= 70) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
  if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-200'
  return 'text-slate-600 bg-slate-50 border-slate-200'
}

/**
 * Componente de lista de leads perdidos
 * 
 * Renderiza uma lista scrollável com os leads perdidos ordenados
 * por potencial de recuperação.
 * 
 * @param deals - Lista de leads perdidos
 */
export function RecuperacaoPerdidosList({ deals }: RecuperacaoPerdidosListProps) {
  return (
    <div 
      className="space-y-3 overflow-y-auto max-h-[240px] pr-1"
      data-testid="recuperacao-list"
    >
      {deals.map((deal) => (
        <div
          key={deal.id}
          className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors bg-white"
        >
          {/* Header: Título e Score */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate text-slate-900">
                {deal.title}
              </h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <User className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{deal.contactName || 'Sem contato'}</span>
              </div>
            </div>
            
            {/* Score Badge */}
            <div 
              className={`px-2 py-1 rounded text-xs font-medium border flex-shrink-0 ${getRecoveryColor(deal.recoveryScore)}`}
              title="Score de recuperação"
            >
              {deal.recoveryScore ?? 0}%
            </div>
          </div>
          
          {/* Footer: Valor e Data */}
          <div className="flex items-center justify-between mt-2 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              <span>R$ {(deal.amount ?? 0).toLocaleString('pt-BR')}</span>
            </div>
            
            <div className="text-muted-foreground">
              {formatDistanceToNow(new Date(deal.lostAt), { 
                addSuffix: true,
                locale: ptBR 
              })}
            </div>
          </div>
          
          {/* Motivo da perda */}
          {deal.lostReason && (
            <div className="mt-2 text-xs text-slate-500 truncate">
              Motivo: {deal.lostReason}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default RecuperacaoPerdidosList
