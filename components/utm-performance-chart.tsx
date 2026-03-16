/**
 * UTM Performance Chart Component
 * Displays UTM source performance with horizontal bars using Recharts
 */

'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useContacts } from '@/hooks/use-contacts'
import { Target } from 'lucide-react'
import { useOrganizationId } from '@/lib/contexts/organization-context'

// Cores para as fontes UTM
const UTM_COLORS: Record<string, string> = {
  'Google Ads': '#0070D2',
  'Facebook': '#1877F2',
  'LinkedIn': '#0A66C2',
  'Instagram': '#E4405F',
  'Email': '#8B7DB8',
  'Orgânico': '#027E46',
  'Direto': '#706E6B',
  'Referência': '#F5A623',
  'WhatsApp': '#25D366',
  'Outros': '#B0B0B0',
}

interface UTMData {
  source: string
  leads: number
  conversions: number
  roi: number
  color: string
}

export function UTMPerformanceChart() {
  const organizationId = useOrganizationId() ?? ''
  const { contacts, isLoading } = useContacts(organizationId)

  // Calcula performance por fonte UTM a partir dos contatos reais
  const utmData: UTMData[] = useMemo(() => {
    if (!contacts || contacts.length === 0) {
      return []
    }

    // Agrupa contatos por fonte UTM
    const sourceMap = new Map<string, { leads: number; conversions: number }>()

    contacts.forEach(contact => {
      // Tenta obter a fonte UTM do metadata ou firstTouch
      const utmSource = 
        (contact.metadata?.utm_source as string) ||
        (contact.metadata?.source as string) ||
        contact.metadata?.firstTouch?.utm_source ||
        'Direto'

      // Normaliza o nome da fonte
      const normalizedSource = normalizeSource(utmSource)

      if (!sourceMap.has(normalizedSource)) {
        sourceMap.set(normalizedSource, { leads: 0, conversions: 0 })
      }

      const data = sourceMap.get(normalizedSource)!
      data.leads++

      // Conta como conversão se tiver dealValue ou converted flag
      if (contact.metadata?.converted === true || (contact.metadata?.dealValue as number) > 0) {
        data.conversions++
      }
    })

    // Converte para array e calcula ROI
    const result: UTMData[] = Array.from(sourceMap.entries()).map(([source, data]) => ({
      source,
      leads: data.leads,
      conversions: data.conversions,
      roi: data.leads > 0 ? parseFloat((data.conversions / data.leads * 5).toFixed(1)) : 0,
      color: UTM_COLORS[source] || UTM_COLORS['Outros'],
    }))

    // Ordena por número de leads (decrescente)
    return result.sort((a, b) => b.leads - a.leads)
  }, [contacts])

  // Normaliza nomes de fonte
  function normalizeSource(source: string): string {
    const sourceLower = source.toLowerCase()
    
    if (sourceLower.includes('google') || sourceLower.includes('ads') || sourceLower.includes('adwords')) return 'Google Ads'
    if (sourceLower.includes('facebook') || sourceLower.includes('fb')) return 'Facebook'
    if (sourceLower.includes('linkedin')) return 'LinkedIn'
    if (sourceLower.includes('instagram') || sourceLower.includes('ig')) return 'Instagram'
    if (sourceLower.includes('email') || sourceLower.includes('e-mail') || sourceLower.includes('mail')) return 'Email'
    if (sourceLower.includes('organic') || sourceLower.includes('orgânico') || sourceLower.includes('seo')) return 'Orgânico'
    if (sourceLower.includes('whatsapp') || sourceLower.includes('whats') || sourceLower.includes('wp')) return 'WhatsApp'
    if (sourceLower.includes('direct') || sourceLower.includes('direto')) return 'Direto'
    if (sourceLower.includes('referral') || sourceLower.includes('referência') || sourceLower.includes('ref')) return 'Referência'
    
    return 'Outros'
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="rounded-sm shadow-sm bg-background p-3">
          <p className="mb-2 text-sm font-semibold text-foreground">{data.source}</p>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Leads: <span className="font-semibold text-foreground">{data.leads}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Conversões:{' '}
              <span className="font-semibold text-foreground">{data.conversions}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              ROI: <span className="font-semibold text-foreground">{data.roi}x</span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  // Calculate best performer
  const bestPerformer = utmData.length > 0 
    ? utmData.reduce((prev, current) => current.roi > prev.roi ? current : prev)
    : { source: 'N/A', roi: 0 }

  // Dados para fallback quando não há dados
  const hasData = utmData.length > 0

  if (isLoading) {
    return (
      <Card className="rounded-sm shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-lg font-bold">Performance por Canal (UTM)</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="h-[280px] flex items-center justify-center">
            <div className="text-muted-foreground text-sm">Carregando...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-sm shadow-sm">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">
            Performance por Canal (UTM)
          </CardTitle>
          <div className="flex items-center gap-2 rounded-sm bg-[#0070D2]/10 px-2 py-1">
            <Target className="h-3 w-3 text-[#0070D2]" />
            <span className="text-xs font-semibold text-[#0070D2]">
              {bestPerformer.source}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {hasData ? (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={utmData}
                layout="vertical"
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#DDDBDA" opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#706E6B' }} />
                <YAxis
                  type="category"
                  dataKey="source"
                  tick={{ fontSize: 12, fill: '#706E6B' }}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(151, 149, 228, 0.1)' }} />
                <Bar dataKey="leads" radius={[0, 4, 4, 0]}>
                  {utmData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Summary Stats */}
            <div className="mt-4 grid grid-cols-3 gap-3 pt-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total Leads</p>
                <p className="text-lg font-bold text-foreground">
                  {utmData.reduce((sum, s) => sum + s.leads, 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Conversões</p>
                <p className="text-lg font-bold text-foreground">
                  {utmData.reduce((sum, s) => sum + s.conversions, 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">ROI Médio</p>
                <p className="text-lg font-bold text-[#027E46]">
                  {(
                    utmData.reduce((sum, s) => sum + s.roi, 0) / utmData.length
                  ).toFixed(1)}
                  x
                </p>
              </div>
            </div>

            {/* Best Performer Highlight */}
            <div className="mt-3 rounded-sm bg-gradient-to-r from-[#46347F]/10 to-transparent p-3">
              <p className="text-xs text-muted-foreground">
                🏆 <span className="font-semibold text-foreground">{bestPerformer.source}</span>{' '}
                é o melhor canal com ROI de{' '}
                <span className="font-semibold text-[#027E46]">{bestPerformer.roi}x</span>
              </p>
            </div>
          </>
        ) : (
          <div className="h-[280px] flex flex-col items-center justify-center text-center">
            <Target className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum dado UTM disponível</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Dados de UTM serão exibidos quando contatos com informações de origem forem cadastrados.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
