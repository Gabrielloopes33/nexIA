import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/lib/test/test-utils'
import { FunilPorEtapaCard } from '../index'
import { useFunnel } from '@/hooks/dashboard/use-funnel'
import { useDashboardFilters } from '@/hooks/dashboard/use-dashboard-filters-context'

// Mock dos hooks
vi.mock('@/hooks/dashboard/use-funnel')
vi.mock('@/hooks/dashboard/use-dashboard-filters-context')

describe('FunilPorEtapaCard', () => {
  const mockRefetch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve renderizar skeleton quando está carregando', () => {
    vi.mocked(useDashboardFilters).mockReturnValue({
      period: '30d',
      setPeriod: vi.fn(),
      dateRange: { start: new Date(), end: new Date() },
    })
    
    vi.mocked(useFunnel).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    } as any)

    render(<FunilPorEtapaCard />)
    
    expect(screen.getByTestId('funil-skeleton')).toBeInTheDocument()
  })

  it('deve renderizar gráfico com dados', () => {
    vi.mocked(useDashboardFilters).mockReturnValue({
      period: '30d',
      setPeriod: vi.fn(),
      dateRange: { start: new Date(), end: new Date() },
    })
    
    vi.mocked(useFunnel).mockReturnValue({
      data: {
        stages: [
          { 
            stageId: '1', 
            stageName: 'Novo', 
            position: 1,
            color: '#46347F',
            count: 100, 
            value: 10000, 
            conversionRate: 100, 
            avgTimeHours: 0,
            avgLeadScore: 50,
          },
          { 
            stageId: '2', 
            stageName: 'Qualificado', 
            position: 2,
            color: '#6366F1',
            count: 50, 
            value: 5000, 
            conversionRate: 50, 
            avgTimeHours: 24,
            avgLeadScore: 65,
          },
        ],
        totalLeads: 100,
        totalValue: 10000,
        avgConversionTime: 48,
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any)

    render(<FunilPorEtapaCard />)
    
    expect(screen.getByText('Funil por Etapa')).toBeInTheDocument()
    expect(screen.getByText('Total: 100 leads')).toBeInTheDocument()
    expect(screen.getByTestId('funil-chart')).toBeInTheDocument()
  })

  it('deve renderizar estado de erro', () => {
    vi.mocked(useDashboardFilters).mockReturnValue({
      period: '30d',
      setPeriod: vi.fn(),
      dateRange: { start: new Date(), end: new Date() },
    })
    
    vi.mocked(useFunnel).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
      refetch: mockRefetch,
    } as any)

    render(<FunilPorEtapaCard />)
    
    expect(screen.getByText('Erro ao carregar dados')).toBeInTheDocument()
    expect(screen.getByText('Tentar novamente')).toBeInTheDocument()
  })

  it('deve renderizar estado vazio quando não há dados', () => {
    vi.mocked(useDashboardFilters).mockReturnValue({
      period: '30d',
      setPeriod: vi.fn(),
      dateRange: { start: new Date(), end: new Date() },
    })
    
    vi.mocked(useFunnel).mockReturnValue({
      data: {
        stages: [],
        totalLeads: 0,
        totalValue: 0,
        avgConversionTime: 0,
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any)

    render(<FunilPorEtapaCard />)
    
    expect(screen.getByText('Nenhum dado disponível')).toBeInTheDocument()
  })

  it('deve chamar refetch ao clicar em tentar novamente', async () => {
    vi.mocked(useDashboardFilters).mockReturnValue({
      period: '30d',
      setPeriod: vi.fn(),
      dateRange: { start: new Date(), end: new Date() },
    })
    
    vi.mocked(useFunnel).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
      refetch: mockRefetch,
    } as any)

    render(<FunilPorEtapaCard />)
    
    const retryButton = screen.getByText('Tentar novamente')
    retryButton.click()
    
    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled()
    })
  })
})
