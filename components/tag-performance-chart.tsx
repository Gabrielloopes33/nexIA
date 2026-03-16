/**
 * Tag Performance Chart Component - Estilo Barra de Progresso
 * Padrão: Ícone | Nome da Tag | Leads/Valor | Barra com %
 */

'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatPercentage, formatNumber } from '@/lib/formatters'
import { TAG_COLOR_MAP, type TagColor } from '@/lib/types/tag'
import { useContacts } from '@/hooks/use-contacts'
import { useTags } from '@/hooks/use-tags'
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
import { useOrganizationId } from '@/lib/contexts/organization-context'

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
  'bg-[#8B7DB8]',      // Roxo principal
  'bg-[#8B7DB8]',      // Roxo claro
  'bg-[#8B7DB8]',      // Roxo médio
  'bg-[#8B7DB8]',      // Roxo escuro
  'bg-[#8B7DB8]',      // Roxo pastel
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
  const organizationId = useOrganizationId() ?? ''
  const { contacts, isLoading: contactsLoading } = useContacts(organizationId)
  const { tags, isLoading: tagsLoading } = useTags(organizationId)

  // Calcula performance por tag a partir dos dados reais
  const tagPerformance: TagPerformance[] = useMemo(() => {
    if (!tags || tags.length === 0 || !contacts) {
      return []
    }

    // Para cada tag, conta contatos que possuem essa tag
    const performanceData = tags
      .map(tag => {
        // Conta contatos com esta tag
        const contactsWithTag = contacts.filter(contact => 
          contact.tags?.includes(tag.id)
        )

        const leadsCount = contactsWithTag.length
        
        // Conta conversões (contatos com dealValue ou converted flag)
        const conversionsCount = contactsWithTag.filter(contact => 
          contact.metadata?.converted === true || 
          (contact.metadata?.dealValue as number) > 0
        ).length

        const conversionRate = leadsCount > 0 ? (conversionsCount / leadsCount) * 100 : 0

        // Calcula ticket médio
        const dealValues = contactsWithTag
          .map(c => (c.metadata?.dealValue as number) || 0)
          .filter(v => v > 0)
        
        const averageDealValue = dealValues.length > 0
          ? dealValues.reduce((sum, val) => sum + val, 0) / dealValues.length
          : 0

        return {
          tagName: tag.name,
          tagColor: (tag.color as TagColor) || 'gray',
          leadsCount,
          conversionsCount,
          conversionRate,
          averageDealValue
        }
      })
      .filter(t => t.leadsCount > 0)
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, 10)

    return performanceData
  }, [contacts, tags])

  const maxConversionRate = Math.max(...tagPerformance.map(t => t.conversionRate), 1)
  const isLoading = contactsLoading || tagsLoading

  if (isLoading) {
    return (
      <Card className="rounded-sm shadow-sm">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-base font-semibold text-gray-900">Performance por Origem</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-muted-foreground text-sm">Carregando...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Card className="rounded-sm shadow-sm">
        <CardHeader className="p-3 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-900">Performance por Origem</CardTitle>
            <div className="flex items-center gap-1 rounded-sm bg-[#8B7DB8]/10 px-2 py-0.5">
              <TrendingUp className="h-4 w-4 text-[#8B7DB8]" />
              <span className="text-xs font-medium text-[#8B7DB8]">Top 10</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 pt-0">
          {tagPerformance.length > 0 ? (
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
                          <p><span className="text-gray-500">Taxa:</span> <span className="font-semibold text-[#8B7DB8]">{percentage}</span></p>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <Tag className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma tag encontrada</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                As estatísticas de tags serão exibidas quando houver contatos com tags atribuídas.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
