'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Mock data - 6 estágios com percentual won/lost
const stages = [
  { name: 'Primeiro Email', won: 72, lost: 28, abbr: 'PE' },
  { name: 'Contato Feito', won: 65, lost: 35, abbr: 'CF' },
  { name: 'Necessidade', won: 58, lost: 42, abbr: 'NEC' },
  { name: 'Proposta', won: 48, lost: 52, abbr: 'PROP' },
  { name: 'Negociação', won: 62, lost: 38, abbr: 'NEG' },
  { name: 'Fechamento', won: 78, lost: 22, abbr: 'FEC' },
]

export function DealConversionChart() {
  return (
    <Card className="rounded-sm border-2">
      <CardHeader className="p-4 pb-2">
        <div>
          <CardTitle className="text-lg font-bold">Conversão de Negócios</CardTitle>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Taxa de sucesso por estágio do pipeline
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="flex items-end justify-between gap-2 h-[280px]">
          {stages.map((stage, index) => (
            <div key={index} className="flex flex-col items-center flex-1 gap-2">
              {/* Bar Container */}
              <div className="relative w-full h-56 bg-secondary rounded-sm overflow-hidden flex flex-col">
                {/* Won Segment (top) */}
                <div
                  className="bg-[#027E46] w-full transition-all"
                  style={{ height: `${stage.won}%` }}
                />
                {/* Lost Segment (bottom) */}
                <div
                  className="bg-[#C23934] w-full transition-all"
                  style={{ height: `${stage.lost}%` }}
                />
                {/* 100% Badge in center */}
                <Badge
                  variant="secondary"
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] h-5 px-2 font-bold"
                >
                  100%
                </Badge>
              </div>
              {/* Stage Label */}
              <div className="text-center">
                <p className="text-[9px] font-semibold text-foreground">{stage.abbr}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#027E46]" />
            <span className="text-[10px] text-muted-foreground">Ganho</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#C23934]" />
            <span className="text-[10px] text-muted-foreground">Perdido</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
