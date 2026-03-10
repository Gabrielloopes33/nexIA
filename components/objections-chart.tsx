/**
 * Objections Chart Component - Estilo Barra de Progresso
 * Padrão: Ícone | Nome | Contagem/Valor | Barra com %
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatPercentage } from '@/lib/formatters'
import { calculateObjectionStats } from '@/lib/ai/objection-detector'
import { MOCK_TRANSCRIPTIONS } from '@/lib/mock-transcriptions'
import { 
  AlertTriangle, 
  DollarSign, 
  Clock, 
  Users, 
  ShieldAlert,
  XCircle,
  HelpCircle,
  MessageSquare
} from 'lucide-react'

// Mapeamento de ícones por categoria de objeção
const OBJECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Preço': DollarSign,
  'Tempo': Clock,
  'Autoridade': Users,
  'Concorrência': ShieldAlert,
  'Necessidade': HelpCircle,
  'Confiança': AlertTriangle,
  'Prazo': Clock,
  'Qualidade': ShieldAlert,
  'Suporte': MessageSquare,
  'Integração': XCircle,
}

// Cores para as barras (apenas tons de roxo)
const BAR_COLORS = [
  'bg-[#8B7DB8]',      // Roxo principal
  'bg-[#8B7DB8]',      // Roxo claro
  'bg-[#8B7DB8]',      // Roxo médio
  'bg-[#8B7DB8]',      // Roxo escuro
  'bg-[#8B7DB8]',      // Roxo pastel
]

export function ObjectionsChart() {
  const objectionStats = calculateObjectionStats(
    MOCK_TRANSCRIPTIONS.map(t => ({
      objections: t.objections,
      converted: t.converted,
      resolutionDays: t.resolutionDays
    }))
  ).slice(0, 5)

  const maxCount = Math.max(...objectionStats.map(s => s.count))

  return (
    <TooltipProvider delayDuration={100}>
      <Card className="rounded-sm shadow-sm">
        <CardHeader className="p-3 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-900">Objeções Detectadas</CardTitle>
            <div className="flex items-center gap-1 rounded-sm bg-[#8B7DB8]/10 px-2 py-0.5">
              <AlertTriangle className="h-4 w-4 text-[#8B7DB8]" />
              <span className="text-xs font-medium text-[#8B7DB8]">Top 5</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 pt-0">
          <div className="space-y-2">
            {objectionStats.map((stat, index) => {
              const barWidth = (stat.count / maxCount) * 100
              const percentage = formatPercentage(stat.conversionRate, 1)
              const Icon = OBJECTION_ICONS[stat.category] || AlertTriangle
              const barColor = BAR_COLORS[index % BAR_COLORS.length]

              return (
                <Tooltip key={stat.category}>
                  <TooltipTrigger asChild>
                    <div className="cursor-pointer hover:opacity-80 transition-opacity">
                      {/* Linha: Nome | Contagem alinhados */}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <Icon className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-700 truncate">
                            {stat.category}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                          {stat.count}
                        </span>
                      </div>

                      {/* Barra de progresso */}
                      <div className="h-2 bg-gray-100 rounded-sm overflow-hidden relative">
                        <div 
                          className={`h-full ${barColor} transition-all duration-500`}
                          style={{ width: `${Math.max(barWidth, 10)}%` }}
                        />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-white border shadow-lg p-2">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-sm text-gray-900">{stat.category}</p>
                      <div className="text-xs space-y-0.5">
                        <p><span className="text-gray-500">Menções:</span> <span className="font-semibold">{stat.count}</span></p>
                        <p><span className="text-gray-500">Convertidos:</span> <span className="font-semibold">{stat.converted}</span></p>
                        <p><span className="text-gray-500">Taxa:</span> <span className="font-semibold text-[#8B7DB8]">{percentage}</span></p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
