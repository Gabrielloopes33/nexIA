/**
 * Objections Chart Component - Estilo Barra de Progresso
 * Padrão: Ícone | Nome | Contagem/Valor | Barra com %
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  'bg-[#9795e4]',      // Roxo principal
  'bg-[#b3b3e5]',      // Roxo claro
  'bg-[#7c7ab8]',      // Roxo médio
  'bg-[#7573b8]',      // Roxo escuro
  'bg-[#a5a3d9]',      // Roxo pastel
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
    <Card className="rounded-sm shadow-sm">
      <CardHeader className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">Objeções Detectadas</CardTitle>
          <div className="flex items-center gap-1.5 rounded-sm bg-[#9795e4]/10 px-2 py-0.5">
            <AlertTriangle className="h-3 w-3 text-[#9795e4]" />
            <span className="text-xs font-semibold text-[#9795e4]">Top 5</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <div className="space-y-4">
          {objectionStats.map((stat, index) => {
            const barWidth = (stat.count / maxCount) * 100
            const percentage = formatPercentage(stat.conversionRate, 1)
            const Icon = OBJECTION_ICONS[stat.category] || AlertTriangle
            const barColor = BAR_COLORS[index % BAR_COLORS.length]

            return (
              <div key={stat.category} className="space-y-2">
                {/* Linha superior: Ícone + Nome + Contagem/Valor */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {stat.category}
                    </span>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-bold text-foreground">
                      {stat.count} menções
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {percentage} conversão
                    </div>
                  </div>
                </div>

                {/* Barra de progresso com porcentagem */}
                <div className="h-6 bg-secondary rounded-sm overflow-hidden relative">
                  <div 
                    className={`h-full ${barColor} transition-all duration-500 flex items-center justify-end pr-2`}
                    style={{ width: `${Math.max(barWidth, 15)}%` }}
                  >
                    <span className="text-xs font-bold text-white drop-shadow">
                      {percentage}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
