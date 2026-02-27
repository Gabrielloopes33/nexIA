/**
 * Tag Performance Chart Component - Estilo Barra de Progresso
 * Padrão: Ícone | Nome da Tag | Leads/Valor | Barra com %
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPercentage, formatCurrency, formatNumber } from '@/lib/formatters'
import { TAG_COLOR_MAP, type TagColor } from '@/lib/types/tag'
import { ENRICHED_LEADS } from '@/lib/mock-leads-enriched'
import { calculateTagPerformance, getTagColor, getPopularTags } from '@/lib/tag-utils'
import { 
  TrendingUp, 
  Tag, 
  Star, 
  Zap, 
  Crown, 
  Target,
  Award,
  Flame,
  Gem,
  Trophy,
  Medal
} from 'lucide-react'

// Mapeamento de ícones para tags
const TAG_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'VIP': Crown,
  'Hot': Flame,
  'Premium': Gem,
  'Enterprise': Trophy,
  'Qualified': Target,
  'Nurture': Medal,
  'Champion': Award,
  'New': Star,
  'Active': Zap,
}

// Cores para as barras (apenas tons de roxo)
const BAR_COLORS = [
  'bg-[#9795e4]',      // Roxo principal
  'bg-[#b3b3e5]',      // Roxo claro
  'bg-[#7c7ab8]',      // Roxo médio
  'bg-[#7573b8]',      // Roxo escuro
  'bg-[#a5a3d9]',      // Roxo pastel
]

interface TagPerformance {
  tagName: string
  tagColor: TagColor
  leadsCount: number
  conversionsCount: number
  conversionRate: number
  averageDealValue: number
}

export function TagPerformanceChart() {
  const popularTags = getPopularTags(15)
  
  const tagPerformanceData: TagPerformance[] = popularTags
    .map(tag => {
      const performance = calculateTagPerformance(ENRICHED_LEADS, tag.id)
      return {
        tagName: tag.name,
        tagColor: getTagColor(tag.id),
        leadsCount: performance.leadCount,
        conversionsCount: performance.conversionCount,
        conversionRate: performance.conversionRate,
        averageDealValue: performance.averageDealValue
      }
    })
    .filter(t => t.leadsCount > 0)
    .sort((a, b) => b.conversionRate - a.conversionRate)
    .slice(0, 10)

  const tagPerformance = tagPerformanceData
  const maxConversionRate = Math.max(...tagPerformance.map(t => t.conversionRate))

  return (
    <Card className="rounded-sm border-2">
      <CardHeader className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">Performance por Tag</CardTitle>
          <div className="flex items-center gap-1.5 rounded-sm bg-[#9795e4]/10 px-2 py-0.5">
            <TrendingUp className="h-3 w-3 text-[#9795e4]" />
            <span className="text-xs font-semibold text-[#9795e4]">Top 10</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <div className="space-y-4">
          {tagPerformance.map((tag, index) => {
            const barWidth = (tag.conversionRate / maxConversionRate) * 100
            const percentage = formatPercentage(tag.conversionRate, 1)
            const Icon = TAG_ICONS[tag.tagName] || Tag
            const barColor = BAR_COLORS[index % BAR_COLORS.length]

            return (
              <div key={tag.tagName} className="space-y-2">
                {/* Linha superior: Ícone + Nome + Contagem/Valor */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {tag.tagName}
                    </span>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-bold text-foreground">
                      {formatNumber(tag.leadsCount)} leads
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(tag.averageDealValue)}
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
