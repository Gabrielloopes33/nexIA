import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@/lib/test/test-utils'
import { PeriodFilters } from '../index'
import { useDashboardFilters } from '@/hooks/dashboard/use-dashboard-filters-context'

// Mock do hook
vi.mock('@/hooks/dashboard/use-dashboard-filters-context')

describe('PeriodFilters', () => {
  const mockSetPeriod = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve renderizar todos os botões de período', () => {
    vi.mocked(useDashboardFilters).mockReturnValue({
      period: '30d',
      setPeriod: mockSetPeriod,
      dateRange: { start: new Date(), end: new Date() },
    })

    render(<PeriodFilters />)
    
    expect(screen.getByText('Período:')).toBeInTheDocument()
    expect(screen.getByText('Hoje')).toBeInTheDocument()
    expect(screen.getByText('7 dias')).toBeInTheDocument()
    expect(screen.getByText('30 dias')).toBeInTheDocument()
    expect(screen.getByText('90 dias')).toBeInTheDocument()
  })

  it('deve destacar o período selecionado', () => {
    vi.mocked(useDashboardFilters).mockReturnValue({
      period: '7d',
      setPeriod: mockSetPeriod,
      dateRange: { start: new Date(), end: new Date() },
    })

    render(<PeriodFilters />)
    
    const button7d = screen.getByTestId('period-button-7d')
    expect(button7d).toHaveAttribute('aria-pressed', 'true')
  })

  it('deve chamar setPeriod ao clicar em um botão', () => {
    vi.mocked(useDashboardFilters).mockReturnValue({
      period: '30d',
      setPeriod: mockSetPeriod,
      dateRange: { start: new Date(), end: new Date() },
    })

    render(<PeriodFilters />)
    
    const button7d = screen.getByText('7 dias')
    fireEvent.click(button7d)
    
    expect(mockSetPeriod).toHaveBeenCalledWith('7d')
  })

  it('deve chamar setPeriod com today ao clicar em Hoje', () => {
    vi.mocked(useDashboardFilters).mockReturnValue({
      period: '30d',
      setPeriod: mockSetPeriod,
      dateRange: { start: new Date(), end: new Date() },
    })

    render(<PeriodFilters />)
    
    const buttonToday = screen.getByText('Hoje')
    fireEvent.click(buttonToday)
    
    expect(mockSetPeriod).toHaveBeenCalledWith('today')
  })

  it('deve ter data-testid no container', () => {
    vi.mocked(useDashboardFilters).mockReturnValue({
      period: '30d',
      setPeriod: mockSetPeriod,
      dateRange: { start: new Date(), end: new Date() },
    })

    render(<PeriodFilters />)
    
    expect(screen.getByTestId('period-filters')).toBeInTheDocument()
  })

  it('deve ter data-testid em cada botão de período', () => {
    vi.mocked(useDashboardFilters).mockReturnValue({
      period: '30d',
      setPeriod: mockSetPeriod,
      dateRange: { start: new Date(), end: new Date() },
    })

    render(<PeriodFilters />)
    
    expect(screen.getByTestId('period-button-today')).toBeInTheDocument()
    expect(screen.getByTestId('period-button-7d')).toBeInTheDocument()
    expect(screen.getByTestId('period-button-30d')).toBeInTheDocument()
    expect(screen.getByTestId('period-button-90d')).toBeInTheDocument()
  })
})
