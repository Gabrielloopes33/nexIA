/**
 * Tag Performance Chart Component - Estilo Barra de Progresso
 * Padrão: Ícone | Nome da Tag | Leads/Valor | Barra com %
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
  'bg-[#46347F]',      // Roxo principal
  'bg-[#46347F]',      // Roxo claro
  'bg-[#46347F]',      // Roxo médio
  'bg-[#46347F]',      // Roxo escuro
  'bg-[#46347F]',      // Roxo pastel
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
    <TooltipProvider delayDuration={100}>
      <Card className="rounded-sm shadow-sm">
        <CardHeader className="p-3 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-900">Performance por Origem</CardTitle>
            <div className="flex items-center gap-1 rounded-sm bg-[#46347F]/10 px-2 py-0.5">
              <TrendingUp className="h-4 w-4 text-[#46347F]" />
              <span className="text-xs font-medium text-[#46347F]">Top 10</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 pt-0">
          <div className="space-y-2">
            {tagPerformance.map((tag, index) => {
              const barWidth = (tag.conversionRate / maxConversionRate) * 100
              const percentage = formatPercentage(tag.conversionRate, 1)
              const Icon = TAG_ICONS[tag.tagName] || Tag
              const barColor = BAR_COLORS[index % BAR_COLORS.length]

              return (
                <Tooltip key={tag.tagName}>
                  <TooltipTrigger asChild>
                    <div className="cursor-pointer hover:opacity-80 transition-opacity">
                      {/* Linha: Ícone + Nome | Contagem */}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <Icon className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-700 truncate">
                            {tag.tagName}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                          {formatNumber(tag.leadsCount)}
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
                      <p className="font-semibold text-sm text-gray-900">{tag.tagName}</p>
                      <div className="text-xs space-y-0.5">
                        <p><span className="text-gray-500">Leads:</span> <span className="font-semibold">{formatNumber(tag.leadsCount)}</span></p>
                        <p><span className="text-gray-500">Conversões:</span> <span className="font-semibold">{formatNumber(tag.conversionsCount)}</span></p>
                        <p><span className="text-gray-500">Taxa:</span> <span className="font-semibold text-[#46347F]">{percentage}</span></p>
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
