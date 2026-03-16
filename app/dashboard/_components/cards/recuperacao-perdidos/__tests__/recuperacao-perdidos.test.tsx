import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/lib/test/test-utils'
import { RecuperacaoPerdidosCard } from '../index'
import { useLostDeals } from '@/hooks/dashboard/use-lost-deals'
import { useDashboardFilters } from '@/hooks/dashboard/use-dashboard-filters-context'

// Mock dos hooks
vi.mock('@/hooks/dashboard/use-lost-deals')
vi.mock('@/hooks/dashboard/use-dashboard-filters-context')

describe('RecuperacaoPerdidosCard', () => {
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
    
    vi.mocked(useLostDeals).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    } as any)

    render(<RecuperacaoPerdidosCard />)
    
    expect(screen.getByTestId('recuperacao-skeleton')).toBeInTheDocument()
  })

  it('deve renderizar lista com dados', () => {
    vi.mocked(useDashboardFilters).mockReturnValue({
      period: '30d',
      setPeriod: vi.fn(),
      dateRange: { start: new Date(), end: new Date() },
    })
    
    vi.mocked(useLostDeals).mockReturnValue({
      data: {
        deals: [
          {
            id: '1',
            title: 'Deal Teste',
            contactName: 'João Silva',
            amount: 5000,
            lostReason: 'Preço',
            lostReasonDetail: null,
            lostAt: new Date().toISOString(),
            recoveryPotential: 'high',
            recoveryScore: 80,
            daysSinceLost: 5,
          },
        ],
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any)

    render(<RecuperacaoPerdidosCard />)
    
    expect(screen.getByText('Recuperação')).toBeInTheDocument()
    expect(screen.getByText('Deal Teste')).toBeInTheDocument()
    expect(screen.getByText('João Silva')).toBeInTheDocument()
    expect(screen.getByTestId('recuperacao-list')).toBeInTheDocument()
  })

  it('deve renderizar estado de erro', () => {
    vi.mocked(useDashboardFilters).mockReturnValue({
      period: '30d',
      setPeriod: vi.fn(),
      dateRange: { start: new Date(), end: new Date() },
    })
    
    vi.mocked(useLostDeals).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
      refetch: mockRefetch,
    } as any)

    render(<RecuperacaoPerdidosCard />)
    
    expect(screen.getByText('Erro ao carregar dados')).toBeInTheDocument()
    expect(screen.getByText('Tentar novamente')).toBeInTheDocument()
  })

  it('deve renderizar estado vazio quando não há deals', () => {
    vi.mocked(useDashboardFilters).mockReturnValue({
      period: '30d',
      setPeriod: vi.fn(),
      dateRange: { start: new Date(), end: new Date() },
    })
    
    vi.mocked(useLostDeals).mockReturnValue({
      data: { deals: [] },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any)

    render(<RecuperacaoPerdidosCard />)
    
    expect(screen.getByText('Nenhum lead perdido no período')).toBeInTheDocument()
  })

  it('deve usar limit de 5 por padrão', () => {
    vi.mocked(useDashboardFilters).mockReturnValue({
      period: '30d',
      setPeriod: vi.fn(),
      dateRange: { start: new Date(), end: new Date() },
    })
    
    vi.mocked(useLostDeals).mockReturnValue({
      data: { deals: [] },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any)

    render(<RecuperacaoPerdidosCard />)
    
    // Verifica se o hook foi chamado com limit 5
    expect(useLostDeals).toHaveBeenCalledWith('30d', 5)
  })

  it('deve chamar refetch ao clicar em tentar novamente', async () => {
    vi.mocked(useDashboardFilters).mockReturnValue({
      period: '30d',
      setPeriod: vi.fn(),
      dateRange: { start: new Date(), end: new Date() },
    })
    
    vi.mocked(useLostDeals).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
      refetch: mockRefetch,
    } as any)

    render(<RecuperacaoPerdidosCard />)
    
    const retryButton = screen.getByText('Tentar novamente')
    retryButton.click()
    
    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled()
    })
  })
})
