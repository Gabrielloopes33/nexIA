'use client'

import { HealthScoreStatus } from '@/hooks/dashboard/use-health-score'

interface HealthScoreGaugeProps {
  score: number
  status: HealthScoreStatus
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Gauge Circular para Health Score
 * 
 * Exibe um círculo de progresso animado com:
 * - Cor baseada no status
 * - Score numérico centralizado
 * - Status como subtítulo
 * - Animação CSS suave
 * - Tamanhos: sm (compacto), md (padrão), lg (grande)
 */
export function HealthScoreGauge({ score, status, size = 'md' }: HealthScoreGaugeProps) {
  const getColor = (): string => {
    switch (status) {
      case 'SAUDÁVEL':
        return '#10B981' // emerald-500
      case 'OK':
        return '#3B82F6' // blue-500
      case 'ATENÇÃO':
        return '#F59E0B' // amber-500
      case 'CRÍTICO':
        return '#EF4444' // red-500
      default:
        return '#6B7280'
    }
  }

  // Configurações de tamanho
  const sizeConfig = {
    sm: { 
      container: 'w-[80px] h-[80px]', 
      radius: 35, 
      strokeWidth: 6,
      fontSize: 'text-xl',
      statusSize: 'text-[8px]'
    },
    md: { 
      container: 'w-[120px] h-[120px]', 
      radius: 45, 
      strokeWidth: 8,
      fontSize: 'text-3xl',
      statusSize: 'text-[10px]'
    },
    lg: { 
      container: 'w-[160px] h-[160px]', 
      radius: 70, 
      strokeWidth: 10,
      fontSize: 'text-4xl',
      statusSize: 'text-xs'
    },
  }

  const config = sizeConfig[size]
  const circumference = 2 * Math.PI * config.radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div 
      className={`relative ${config.container} flex-shrink-0`} 
      data-testid="health-score-gauge"
    >
      {/* Background circle */}
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={config.radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={config.strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r={config.radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      
      {/* Score text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span 
          className={`${config.fontSize} font-bold transition-colors duration-500`} 
          style={{ color: getColor() }}
          data-testid="health-score-value"
        >
          {score}
        </span>
        {size !== 'sm' && (
          <span className={`${config.statusSize} text-muted-foreground uppercase`}>
            {status}
          </span>
        )}
      </div>
    </div>
  )
}

export default HealthScoreGauge
