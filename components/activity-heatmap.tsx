/**
 * Activity Heatmap Component
 * Mostra atividade de contatos em grid 7 dias × 24 horas
 * Intensidade de cor baseada em número de interações
 * Destaca melhor horário para contato
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, TrendingUp } from 'lucide-react'

export interface HeatmapCell {
  day: number // 0-6 (Dom-Sáb)
  hour: number // 0-23
  count: number
}

interface ActivityHeatmapProps {
  compact?: boolean
  data?: HeatmapCell[]
  isLoading?: boolean
}

// Gera dados mock para o heatmap
const generateMockData = (): HeatmapCell[] => {
  const data: HeatmapCell[] = []
  
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      let count = 0
      
      const isWeekday = day >= 1 && day <= 5
      const isBusinessHour = hour >= 8 && hour <= 18
      const isPeakDay = day === 2 || day === 3
      const isPeakHour = (hour >= 10 && hour <= 11) || (hour >= 14 && hour <= 16)
      const isLunchTime = hour >= 12 && hour <= 13
      
      if (isWeekday && isBusinessHour && !isLunchTime) {
        count = Math.floor(Math.random() * 20) + 10
        
        if (isPeakDay && isPeakHour) {
          count += Math.floor(Math.random() * 30) + 20
        }
      } else if (isWeekday && (hour === 7 || hour === 19)) {
        count = Math.floor(Math.random() * 5) + 2
      } else if (!isWeekday && hour >= 9 && hour <= 17) {
        count = Math.floor(Math.random() * 3)
      }
      
      data.push({ day, hour, count })
    }
  }
  
  return data
}

export function ActivityHeatmap({ compact, data: externalData, isLoading }: ActivityHeatmapProps) {
  const [heatmapData, setHeatmapData] = useState<HeatmapCell[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Usa dados externos ou gera dados mock
  useEffect(() => {
    if (externalData && externalData.length > 0) {
      setHeatmapData(externalData)
    } else {
      const data = generateMockData()
      setHeatmapData(data)
    }
    setIsLoaded(true)
  }, [externalData])

  const maxCount = heatmapData.length > 0 ? Math.max(...heatmapData.map(d => d.count)) : 1
  
  const bestCell = heatmapData.length > 0 
    ? heatmapData.reduce((best, current) => current.count > best.count ? current : best)
    : { day: 2, hour: 10, count: 0 }
  
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  
  const getColorIntensity = (count: number): string => {
    if (count === 0) return 'bg-secondary'
    
    const intensity = count / maxCount
    
    if (intensity >= 0.8) return 'bg-[#8B7DB8]'
    if (intensity >= 0.6) return 'bg-purple-400'
    if (intensity >= 0.4) return 'bg-purple-300'
    if (intensity >= 0.2) return 'bg-purple-200'
    return 'bg-purple-100'
  }

  if (isLoading) {
    return (
      <Card className="rounded-sm shadow-sm h-full flex flex-col">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-base font-semibold text-gray-900">Melhor Hora para Contatar</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-1 flex-1 flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Carregando...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-sm shadow-sm h-full flex flex-col">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-gray-900">Melhor Hora para Contatar</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">
              Heatmap de atividade - 30 dias
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-4 w-4" />
            <span>30 dias</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 pt-1 flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center min-h-0">
          <div className="w-full">
            <div className="flex gap-0.5 mb-0.5 ml-7">
              {Array.from({ length: 24 }, (_, i) => (
                <div 
                  key={i}
                  className="w-4 text-[8px] text-center text-gray-500 font-medium"
                >
                  {i % 4 === 0 ? `${i}h` : ''}
                </div>
              ))}
            </div>

            {dayNames.map((dayName, dayIndex) => (
              <div key={dayName} className="flex gap-0.5 mb-0.5">
                <div className="w-6 text-xs font-medium text-gray-600 flex items-center">
                  {dayName}
                </div>
                
                {Array.from({ length: 24 }, (_, hourIndex) => {
                  const cell = heatmapData.find(
                    d => d.day === dayIndex && d.hour === hourIndex
                  )
                  const count = cell?.count || 0
                  const isBestTime = 
                    dayIndex === bestCell.day && hourIndex === bestCell.hour
                  
                  return (
                    <div
                      key={hourIndex}
                      className={`
                        w-4 h-4 rounded-sm transition-all cursor-pointer
                        ${isLoaded ? getColorIntensity(count) : 'bg-secondary'}
                        ${isBestTime && isLoaded ? 'ring-1.5 ring-green-500 ring-offset-0.5' : ''}
                        hover:scale-110 hover:z-10
                      `}
                      title={`${dayName} ${hourIndex}h: ${isLoaded ? count : 0} interações`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 text-xs">Menos</span>
            <div className="flex gap-0.5">
              <div className="w-3 h-3 rounded-sm bg-secondary" />
              <div className="w-3 h-3 rounded-sm bg-purple-100" />
              <div className="w-3 h-3 rounded-sm bg-purple-200" />
              <div className="w-3 h-3 rounded-sm bg-purple-300" />
              <div className="w-3 h-3 rounded-sm bg-purple-400" />
              <div className="w-3 h-3 rounded-sm bg-[#8B7DB8]" />
            </div>
            <span className="text-gray-500 text-xs">Mais</span>
          </div>
          <div className="flex items-center gap-1.5 text-green-600 font-medium">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">
              {isLoaded 
                ? `${dayNames[bestCell.day]} ${bestCell.hour}h`
                : '...'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
