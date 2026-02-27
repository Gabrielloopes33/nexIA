/**
 * Activity Heatmap Component
 * Mostra atividade de contatos em grid 7 dias × 24 horas
 * Intensidade de cor baseada em número de interações
 * Destaca melhor horário para contato
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, TrendingUp } from 'lucide-react'

interface HeatmapCell {
  day: number // 0-6 (Dom-Sáb)
  hour: number // 0-23
  count: number
}

export function ActivityHeatmap() {
  const [heatmapData, setHeatmapData] = useState<HeatmapCell[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Gera dados apenas no cliente para evitar hydration mismatch
  useEffect(() => {
    const data = generateMockData()
    setHeatmapData(data)
    setIsLoaded(true)
  }, [])

  // Mock data - Gera padrão realista de atividade B2B
  const generateMockData = (): HeatmapCell[] => {
    const data: HeatmapCell[] = []
    
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        let count = 0
        
        // Lógica de padrão B2B brasileiro:
        // - Segunda a Sexta: 8h-18h (horário comercial)
        // - Pico: Terça/Quarta 10h-12h e 14h-16h
        // - Baixo: Finais de semana, madrugada, almoço (12h-14h)
        
        const isWeekday = day >= 1 && day <= 5 // Seg-Sex
        const isBusinessHour = hour >= 8 && hour <= 18
        const isPeakDay = day === 2 || day === 3 // Ter-Qua
        const isPeakHour = (hour >= 10 && hour <= 11) || (hour >= 14 && hour <= 16)
        const isLunchTime = hour >= 12 && hour <= 13
        
        if (isWeekday && isBusinessHour && !isLunchTime) {
          count = Math.floor(Math.random() * 20) + 10 // 10-30 interações
          
          if (isPeakDay && isPeakHour) {
            count += Math.floor(Math.random() * 30) + 20 // +20-50 no pico
          }
        } else if (isWeekday && (hour === 7 || hour === 19)) {
          count = Math.floor(Math.random() * 5) + 2 // Leve atividade antes/depois
        } else if (!isWeekday && hour >= 9 && hour <= 17) {
          count = Math.floor(Math.random() * 3) // Mínimo fim de semana
        }
        
        data.push({ day, hour, count })
      }
    }
    
    return data
  }

  const maxCount = heatmapData.length > 0 ? Math.max(...heatmapData.map(d => d.count)) : 1
  
  // Encontra melhor horário (maior count)
  const bestCell = heatmapData.length > 0 
    ? heatmapData.reduce((best, current) => current.count > best.count ? current : best)
    : { day: 2, hour: 10, count: 0 } // Fallback: Terça 10h
  
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  
  const getColorIntensity = (count: number): string => {
    if (count === 0) return 'bg-secondary'
    
    const intensity = count / maxCount
    
    if (intensity >= 0.8) return 'bg-[#9795e4]' // Primary purple
    if (intensity >= 0.6) return 'bg-purple-400'
    if (intensity >= 0.4) return 'bg-purple-300'
    if (intensity >= 0.2) return 'bg-purple-200'
    return 'bg-purple-100'
  }

  return (
    <Card className="rounded-sm shadow-sm">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">Mapa de Atividade</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Melhor horário para contatar leads
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>30 dias</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2">
        {/* Grid do heatmap */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Header com horas */}
          <div className="flex gap-0.5 mb-1 ml-8">
            {Array.from({ length: 24 }, (_, i) => (
              <div 
                key={i}
                className="w-4 text-[8px] text-center text-muted-foreground"
              >
                {i % 6 === 0 ? `${i}h` : ''}
              </div>
            ))}
          </div>

          {/* Grid com dias */}
          {dayNames.map((dayName, dayIndex) => (
            <div key={dayName} className="flex gap-0.5 mb-0.5">
              {/* Label do dia */}
              <div className="w-7 text-[9px] font-medium text-muted-foreground flex items-center">
                {dayName}
              </div>
              
              {/* Células de horas */}
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
                      ${isBestTime && isLoaded ? 'ring-2 ring-green-500 ring-offset-1' : ''}
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

        {/* Legenda de intensidade */}
        <div className="mt-2 flex items-center justify-between text-[9px]">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Menos</span>
            <div className="flex gap-0.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-secondary" />
              <div className="w-2.5 h-2.5 rounded-sm bg-purple-100" />
              <div className="w-2.5 h-2.5 rounded-sm bg-purple-200" />
              <div className="w-2.5 h-2.5 rounded-sm bg-purple-300" />
              <div className="w-2.5 h-2.5 rounded-sm bg-purple-400" />
              <div className="w-2.5 h-2.5 rounded-sm bg-[#9795e4]" />
            </div>
            <span className="text-muted-foreground">Mais</span>
          </div>
          <div className="flex items-center gap-1 text-green-600 font-semibold">
            <TrendingUp className="h-3 w-3" />
            <span>
              {isLoaded 
                ? `${dayNames[bestCell.day]} ${bestCell.hour}h (45%)`
                : 'Carregando...'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
