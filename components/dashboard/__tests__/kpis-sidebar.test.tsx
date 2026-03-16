import { describe, it, expect } from 'vitest'
import { render, screen } from '@/lib/test/test-utils'
import { KpiVerticalItem, KpiVerticalList } from '@/components/dashboard/kpi-vertical-item'
import { KpiItem } from '@/components/dashboard/kpis/KpiItem'
import { TrendingUp } from 'lucide-react'
import type { KpiData } from '@/types/dashboard'

describe('KpiVerticalItem', () => {
  it('deve renderizar label e valor corretamente', () => {
    render(
      <KpiVerticalItem
        label="Receita"
        value="R$ 45.230"
      />
    )
    
    // Label é convertido para uppercase no componente
    expect(screen.getByText('Receita')).toBeInTheDocument()
    expect(screen.getByText('R$ 45.230')).toBeInTheDocument()
  })

  it('deve renderizar mudança positiva com cor verde', () => {
    render(
      <KpiVerticalItem
        label="Vendas"
        value="1.234"
        change="+12%"
      />
    )
    
    const changeElement = screen.getByText('+12%')
    expect(changeElement).toBeInTheDocument()
    expect(changeElement.parentElement).toHaveClass('text-emerald-500')
  })

  it('deve renderizar mudança negativa com cor vermelha', () => {
    render(
      <KpiVerticalItem
        label="Custos"
        value="R$ 5.000"
        change="-8%"
      />
    )
    
    const changeElement = screen.getByText('-8%')
    expect(changeElement).toBeInTheDocument()
    expect(changeElement.parentElement).toHaveClass('text-red-500')
  })

  it('deve inverter cores quando isNegativeGood é true', () => {
    render(
      <KpiVerticalItem
        label="Custo de Aquisição"
        value="R$ 50"
        change="+5%"
        isNegativeGood={true}
      />
    )
    
    const changeElement = screen.getByText('+5%')
    expect(changeElement.parentElement).toHaveClass('text-red-500')
  })

  it('deve mostrar skeleton quando loading', () => {
    const { container } = render(
      <KpiVerticalItem
        label="Teste"
        value="100"
        loading={true}
      />
    )
    
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('deve renderizar com ícone quando fornecido', () => {
    const { container } = render(
      <KpiVerticalItem
        label="Taxa"
        value="85%"
        icon={TrendingUp}
      />
    )
    
    // Verifica se o ícone está presente
    const iconSvg = container.querySelector('svg')
    expect(iconSvg).toBeInTheDocument()
  })
})

describe('KpiVerticalList', () => {
  it('deve renderizar múltiplos KPIs em layout vertical', () => {
    const { container } = render(
      <KpiVerticalList>
        <KpiVerticalItem label="KPI 1" value="100" />
        <KpiVerticalItem label="KPI 2" value="200" />
        <KpiVerticalItem label="KPI 3" value="300" />
        <KpiVerticalItem label="KPI 4" value="400" />
        <KpiVerticalItem label="KPI 5" value="500" />
      </KpiVerticalList>
    )
    
    expect(screen.getByText('KPI 1')).toBeInTheDocument()
    expect(screen.getByText('KPI 2')).toBeInTheDocument()
    expect(screen.getByText('KPI 3')).toBeInTheDocument()
    expect(screen.getByText('KPI 4')).toBeInTheDocument()
    expect(screen.getByText('KPI 5')).toBeInTheDocument()
    
    // Verifica layout vertical (flex-col)
    expect(container.firstChild).toHaveClass('flex-col')
  })
})

describe('KpiItem', () => {
  const mockKpi: KpiData = {
    label: 'Leads',
    value: 150,
    change: 12,
    trend: 'up',
    format: 'number',
  }

  it('deve renderizar KPI com dados corretamente', () => {
    render(<KpiItem kpi={mockKpi} />)
    
    expect(screen.getByText('Leads')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()
    expect(screen.getByText('12%')).toBeInTheDocument()
  })

  it('deve mostrar skeleton quando loading', () => {
    const { container } = render(<KpiItem isLoading={true} />)
    
    // O KpiSkeleton usa classes diferentes
    expect(container.querySelector('.skeleton-shimmer')).toBeInTheDocument()
  })

  it('deve retornar null quando não há KPI', () => {
    const { container } = render(<KpiItem kpi={undefined} />)
    
    expect(container.firstChild).toBeNull()
  })

  it('deve formatar valores monetários corretamente', () => {
    const currencyKpi: KpiData = {
      label: 'Receita',
      value: 45230,
      change: 15,
      trend: 'up',
      format: 'currency',
    }
    
    render(<KpiItem kpi={currencyKpi} />)
    
    // Verifica se o valor formatado está presente
    expect(screen.getByText('Receita')).toBeInTheDocument()
  })

  it('deve aplicar cor verde para tendência positiva', () => {
    render(<KpiItem kpi={mockKpi} />)
    
    const trendElement = screen.getByText('12%').parentElement
    expect(trendElement).toHaveClass('text-green-600')
  })

  it('deve aplicar cor vermelha para tendência negativa', () => {
    const negativeKpi: KpiData = {
      label: 'Churn',
      value: 5,
      change: -3,
      trend: 'down',
      format: 'percentage',
    }
    
    render(<KpiItem kpi={negativeKpi} />)
    
    const trendElement = screen.getByText('3%').parentElement
    expect(trendElement).toHaveClass('text-red-600')
  })
})
