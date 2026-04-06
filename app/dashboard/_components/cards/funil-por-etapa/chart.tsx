'use client'

import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'
import { FunnelMetrics } from '@/types/dashboard'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

/**
 * Props do componente FunilPorEtapaChart
 */
interface FunilPorEtapaChartProps {
  /** Dados do funil */
  data: FunnelMetrics
}

/**
 * Dados formatados para o gráfico
 */
interface ChartDataItem {
  name: string
  count: number
  value: number
  conversionRate: number
  avgTime: number
  fill: string
  percentage: number // Porcentagem em relação ao total
}

/**
 * Cores padrão para as barras (fallback)
 */
const DEFAULT_COLORS = ['#46347F', '#6366F1', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#8B7DB8', '#A5B4FC']

/**
 * Componente de gráfico de funil por etapa
 * 
 * Renderiza um gráfico de barras horizontais mostrando a distribuição
 * de leads por etapa do funil.
 * 
 * Features:
 * - Escala logarítmica opcional para lidar com grandes diferenças
 * - Visualização em porcentagem
 * - Cores dinâmicas das etapas do pipeline
 * 
 * @param data - Dados do funil de vendas
 */
export function FunilPorEtapaChart({ data }: FunilPorEtapaChartProps) {
  const [mounted, setMounted] = useState(false)
  const [useLogScale, setUseLogScale] = useState(false)
  const [showPercentage, setShowPercentage] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    // Auto-ativar escala logarítmica se a primeira etapa tiver mais de 10x leads que a segunda
    if (data.stages.length >= 2) {
      const firstStage = data.stages[0]?.count || 0
      const secondStage = data.stages[1]?.count || 0
      if (firstStage > 0 && secondStage > 0 && firstStage / secondStage > 10) {
        setUseLogScale(true)
      }
    }
  }, [data])

  // Calcular total para porcentagens
  const totalCount = data.stages.reduce((sum, stage) => sum + stage.count, 0)
  const maxCount = Math.max(...data.stages.map(s => s.count), 1)
  
  // Formatar dados para o Recharts
  const chartData: ChartDataItem[] = data.stages.map((stage, index) => ({
    name: stage.stageName || (stage as { name?: string }).name || `Etapa ${index + 1}`,
    count: stage.count,
    value: stage.value,
    conversionRate: stage.conversionRate,
    avgTime: stage.avgTimeHours || (stage as { avgTime?: number }).avgTime || 0,
    fill: stage.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    percentage: totalCount > 0 ? (stage.count / totalCount) * 100 : 0,
  }))

  // Função para escala logarítmica
  const logScale = (value: number) => {
    if (value <= 0) return 0
    const result = Math.log10(value)
    return isFinite(result) ? result : 0
  }

  // Transformar dados para escala log se necessário
  const displayData = useLogScale 
    ? chartData.map(d => ({ ...d, displayCount: logScale(d.count) }))
    : chartData.map(d => ({ ...d, displayCount: d.count }))

  // Calcular domínio do eixo X
  const xDomain = useLogScale 
    ? [0, Math.ceil(logScale(maxCount))]
    : [0, 'auto']

  if (!mounted) return <div className="h-full" data-testid="funil-chart" />

  // Verificar se há dados válidos
  if (!data.stages || data.stages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground" data-testid="funil-chart">
        <p>Nenhuma etapa configurada no pipeline</p>
      </div>
    )
  }

  return (
    <div data-testid="funil-chart">
      {/* Header com totais e controles */}
      <div className="flex flex-col gap-2 mb-3">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Total: {data.totalLeads} leads</span>
          <span>Valor: R$ {data.totalValue.toLocaleString('pt-BR')}</span>
        </div>
        
        {/* Controles de visualização */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Switch
              id="log-scale"
              checked={useLogScale}
              onCheckedChange={setUseLogScale}
              className="scale-90"
            />
            <Label htmlFor="log-scale" className="text-xs cursor-pointer">
              Escala log
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="show-percentage"
              checked={showPercentage}
              onCheckedChange={setShowPercentage}
              className="scale-90"
            />
            <Label htmlFor="show-percentage" className="text-xs cursor-pointer">
              Mostrar %
            </Label>
          </div>
        </div>
      </div>
      
      {/* Gráfico */}
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={displayData} 
            layout="vertical" 
            margin={{ left: 0, right: 30, top: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
            <XAxis 
              type="number" 
              domain={xDomain as [number | string, number | string | 'auto']}
              tick={{ fontSize: 10 }}
              tickLine={false}
              tickFormatter={(value) => useLogScale ? `10^${value}` : value}
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={110}
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: '#F1F5F9' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as ChartDataItem & { displayCount?: number }
                  return (
                    <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <div className="mt-2 space-y-1 text-sm">
                        <p className="text-slate-600">
                          <span className="font-medium">Leads:</span> {item.count.toLocaleString('pt-BR')}
                          {showPercentage && (
                            <span className="text-muted-foreground ml-1">
                              ({item.percentage.toFixed(1)}%)
                            </span>
                          )}
                        </p>
                        <p className="text-slate-600">
                          <span className="font-medium">Valor:</span> R$ {item.value.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-slate-600">
                          <span className="font-medium">Conversão:</span> {(Number(item.conversionRate) || 0).toFixed(1)}%
                        </p>
                        {item.avgTime > 0 && (
                          <p className="text-slate-600">
                            <span className="font-medium">Tempo médio:</span> {Math.round(item.avgTime)}h
                          </p>
                        )}
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar
              dataKey="displayCount"
              radius={[0, 4, 4, 0]}
              maxBarSize={35}
              isAnimationActive={false}
              minPointSize={2}
            >
              {displayData.map((entry, index) => (
                <Cell key={`cell-${entry.name}-${index}-${entry.count}`} fill={entry.fill} />
              ))}
            </Bar>
            
            {/* Linha de referência para mostrar média */}
            {showPercentage && (
              <ReferenceLine 
                x={useLogScale ? logScale(totalCount / data.stages.length) : totalCount / data.stages.length} 
                stroke="#EF4444" 
                strokeDasharray="5 5"
                label={{ value: "Média", position: "top", fontSize: 10, fill: "#EF4444" }}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legenda com porcentagens */}
      {showPercentage && (
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {chartData.map((stage, idx) => (
            <div key={stage.name} className="flex items-center gap-1.5">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: stage.fill }}
              />
              <span className="truncate text-muted-foreground">
                {stage.name}: {stage.percentage.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FunilPorEtapaChart
