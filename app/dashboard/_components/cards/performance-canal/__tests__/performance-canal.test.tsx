import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/lib/test/test-utils'
import { PerformanceCanalCard } from '../index'
import { useChannels } from '@/hooks/dashboard/use-channels'
import { useDashboardFilters } from '@/hooks/dashboard/use-dashboard-filters-context'

// Mock dos hooks
vi.mock('@/hooks/dashboard/use-channels')
vi.mock('@/hooks/dashboard/use-dashboard-filters-context')

describe('PerformanceCanalCard', () => {
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
    
    vi.mocked(useChannels).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    } as any)

    render(<PerformanceCanalCard />)
    
    expect(screen.getByTestId('canais-skeleton')).toBeInTheDocument()
  })

  it('deve renderizar gráfico com dados', () => {
    vi.mocked(useDashboardFilters).mockReturnValue({
      period: '30d',
      setPeriod: vi.fn(),
      dateRange: { start: new Date(), end: new Date() },
    })
    
    vi.mocked(useChannels).mockReturnValue({
      data: {
        channels: [
          {
            channel: 'WHATSAPP_OFFICIAL',
            messagesSent: 100,
            messagesReceived: 80,
            responseRate: 80,
            avgFirstResponseSecs: 300,
            leadsGenerated: 50,
            dealsWon: 10,
            revenueWon: 5000,
            conversionRate: 20,
          },
          {
            channel: 'INSTAGRAM',
            messagesSent: 60,
            messagesReceived: 45,
            responseRate: 75,
            avgFirstResponseSecs: 450,
            leadsGenerated: 30,
            dealsWon: 5,
            revenueWon: 2500,
            conversionRate: 16.7,
          },
        ],
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any)

    render(<PerformanceCanalCard />)
    
    expect(screen.getByText('Performance por Canal')).toBeInTheDocument()
    // O gráfico é renderizado com Recharts - verificamos a presença do container
    expect(document.querySelector('.recharts-responsive-container')).toBeInTheDocument()
  })

  it('deve renderizar estado de erro', () => {
    vi.mocked(useDashboardFilters).mockReturnValue({
      period: '30d',
      setPeriod: vi.fn(),
      dateRange: { start: new Date(), end: new Date() },
    })
    
    vi.mocked(useChannels).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
      refetch: mockRefetch,
    } as any)

    render(<PerformanceCanalCard />)
    
    expect(screen.getByText('Erro ao carregar dados')).toBeInTheDocument()
    expect(screen.getByText('Tentar novamente')).toBeInTheDocument()
  })

  it('deve renderizar estado vazio quando não há canais', () => {
    vi.mocked(useDashboardFilters).mockReturnValue({
      period: '30d',
      setPeriod: vi.fn(),
      dateRange: { start: new Date(), end: new Date() },
    })
    
    vi.mocked(useChannels).mockReturnValue({
      data: { channels: [] },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any)

    render(<PerformanceCanalCard />)
    
    expect(screen.getByText('Nenhum dado de canais no período')).toBeInTheDocument()
  })

  it('deve chamar refetch ao clicar em tentar novamente', async () => {
    vi.mocked(useDashboardFilters).mockReturnValue({
      period: '30d',
      setPeriod: vi.fn(),
      dateRange: { start: new Date(), end: new Date() },
    })
    
    vi.mocked(useChannels).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
      refetch: mockRefetch,
    } as any)

    render(<PerformanceCanalCard />)
    
    const retryButton = screen.getByText('Tentar novamente')
    retryButton.click()
    
    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled()
    })
  })
})
