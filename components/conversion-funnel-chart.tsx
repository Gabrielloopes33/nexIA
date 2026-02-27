/**
 * Conversion Funnel Chart Component
 * Funil de conversão com 6 estágios: Visitante → Lead → Qualificado → Oportunidade → Proposta → Cliente
 * Mostra contagem, percentual e drop-off entre estágios
 * Design corporativo com gradiente purple
 */

'use client'

import { Card } from '@/components/ui/card'
import { formatNumber, formatPercentage } from '@/lib/formatters'
import { ArrowDown, TrendingDown } from 'lucide-react'

interface FunnelStage {
  name: string
  count: number
  percentage: number
  color: string
  dropOff?: number // Percentual de drop-off até o próximo estágio
}

export function ConversionFunnelChart() {
  const stages: FunnelStage[] = [
    { 
      name: 'Visitante', 
      count: 5420, 
      percentage: 100, 
      color: 'bg-purple-100 border-purple-300 text-purple-700',
      dropOff: 76.3
    },
    { 
      name: 'Lead', 
      count: 1284, 
      percentage: 23.7, 
      color: 'bg-purple-200 border-purple-400 text-purple-800',
      dropOff: 13.7
    },
    { 
      name: 'Qualificado', 
      count: 542, 
      percentage: 10, 
      color: 'bg-purple-300 border-purple-500 text-purple-900',
      dropOff: 5.7
    },
    { 
      name: 'Oportunidade', 
      count: 234, 
      percentage: 4.3, 
      color: 'bg-purple-400 border-purple-600 text-white',
      dropOff: 2.7
    },
    { 
      name: 'Proposta', 
      count: 89, 
      percentage: 1.6, 
      color: 'bg-purple-500 border-purple-700 text-white',
      dropOff: 1.0
    },
    { 
      name: 'Cliente', 
      count: 34, 
      percentage: 0.6, 
      color: 'bg-gradient-to-br from-[#9795e4] to-[#b3b3e5] border-[#9795e4] text-white'
    }
  ]

  return (
    <Card className="p-6 rounded-sm border-2">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-1">Funil de Conversão</h3>
        <p className="text-sm text-muted-foreground">
          Jornada completa do visitante até cliente
        </p>
      </div>

      <div className="space-y-3">
        {stages.map((stage, index) => {
          const isLast = index === stages.length - 1
          const maxWidth = 100 // Primeiro estágio = 100% largura
          const width = stage.percentage // Proporcional ao percentual
          
          return (
            <div key={stage.name} className="space-y-2">
              {/* Barra do estágio */}
              <div 
                className={`${stage.color} border-2 rounded-sm px-4 py-3 transition-all hover:scale-[1.02] cursor-pointer`}
                style={{ 
                  width: `${Math.max(width, 15)}%`, // Mínimo 15% para não ficar pequeno demais
                  marginLeft: `${(maxWidth - Math.max(width, 15)) / 2}%` // Centralizar
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm">
                      {stage.name}
                    </span>
                    <span className="text-xs opacity-80">
                      {formatNumber(stage.count)} leads
                    </span>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold text-lg">
                      {formatPercentage(stage.percentage, 1)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Indicador de drop-off */}
              {!isLast && stage.dropOff && (
                <div className="flex items-center justify-center gap-2 py-1">
                  <div className="h-6 w-px bg-border" />
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-red-50 border border-red-200">
                    <TrendingDown className="h-3 w-3 text-red-600" />
                    <span className="text-xs font-medium text-red-700">
                      -{formatPercentage(stage.dropOff, 1)} drop-off
                    </span>
                  </div>
                  <div className="h-6 w-px bg-border" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer com insights */}
      <div className="mt-6 pt-4 border-t-2 border-border">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Taxa Global</p>
            <p className="text-lg font-bold text-green-600">
              {formatPercentage(0.6, 1)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Maior Drop-off</p>
            <p className="text-lg font-bold text-red-600">
              -{formatPercentage(76.3, 1)}
            </p>
            <p className="text-xs text-muted-foreground">Visitante → Lead</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Melhor Estágio</p>
            <p className="text-lg font-bold text-purple-600">
              {formatPercentage(62.5, 1)}
            </p>
            <p className="text-xs text-muted-foreground">Proposta → Cliente</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
