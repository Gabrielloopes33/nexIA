import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HealthScoreCard } from '../index'
import { useDashboardFilters } from '@/hooks/dashboard/use-dashboard-filters-context'

// Mock do hook de filtros
vi.mock('@/hooks/dashboard/use-dashboard-filters-context', () => ({
  useDashboardFilters: vi.fn()
}))

// Mock global fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

import React from 'react'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
  
  return Wrapper
}

describe('HealthScoreCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useDashboardFilters).mockReturnValue({ period: '30d' } as any)
  })

  it('should render loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))

    render(<HealthScoreCard />, { wrapper: createWrapper() })

    expect(screen.getByTestId('health-score-skeleton')).toBeInTheDocument()
  })

  it('should render gauge with SAUDAVEL status', async () => {
    const mockData = {
      success: true,
      data: {
        score: 92,
        status: 'SAUDÁVEL' as const,
        factors: {
          conversionVsGoal: {
            score: 95,
            status: 'ACIMA' as const,
            actualRate: 25,
            targetRate: 20
          },
          funnelVelocity: {
            score: 88,
            status: 'OK' as const,
            avgHours: 55
          },
          stagnantLeads: {
            score: 90,
            status: 'OK' as const,
            count: 5,
            totalLeads: 100
          },
          followUpRate: {
            score: 98,
            percentage: 98
          }
        }
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData)
    })

    render(<HealthScoreCard />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('health-score-gauge')).toBeInTheDocument()
    })

    expect(screen.getByTestId('health-score-value')).toHaveTextContent('92')
    expect(screen.getByTestId('health-score-metrics')).toBeInTheDocument()
  })

  it('should render gauge with CRITICO status', async () => {
    const mockData = {
      success: true,
      data: {
        score: 25,
        status: 'CRÍTICO' as const,
        factors: {
          conversionVsGoal: {
            score: 20,
            status: 'ABAIXO' as const,
            actualRate: 10,
            targetRate: 20
          },
          funnelVelocity: {
            score: 30,
            status: 'CRÍTICO' as const,
            avgHours: 200
          },
          stagnantLeads: {
            score: 25,
            status: 'CRÍTICO' as const,
            count: 40,
            totalLeads: 100
          },
          followUpRate: {
            score: 30,
            percentage: 30
          }
        }
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData)
    })

    render(<HealthScoreCard />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('health-score-gauge')).toBeInTheDocument()
    })

    expect(screen.getByTestId('health-score-value')).toHaveTextContent('25')
  })

  it('should render gauge with ATENCAO status', async () => {
    const mockData = {
      success: true,
      data: {
        score: 50,
        status: 'ATENÇÃO' as const,
        factors: {
          conversionVsGoal: {
            score: 60,
            status: 'NA_META' as const,
            actualRate: 18,
            targetRate: 20
          },
          funnelVelocity: {
            score: 55,
            status: 'LENTO' as const,
            avgHours: 100
          },
          stagnantLeads: {
            score: 45,
            status: 'ATENÇÃO' as const,
            count: 18,
            totalLeads: 100
          },
          followUpRate: {
            score: 60,
            percentage: 60
          }
        }
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData)
    })

    render(<HealthScoreCard />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('health-score-gauge')).toBeInTheDocument()
    })

    expect(screen.getByTestId('health-score-value')).toHaveTextContent('50')
  })

  it('should render empty state when no data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: null })
    })

    render(<HealthScoreCard />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Nenhum dado disponível')).toBeInTheDocument()
    })
  })

  it('should render error state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    render(<HealthScoreCard />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar dados')).toBeInTheDocument()
    })
  })

  it('should show correct title and subtitle', async () => {
    const mockData = {
      success: true,
      data: {
        score: 85,
        status: 'SAUDÁVEL' as const,
        factors: {
          conversionVsGoal: { score: 90, status: 'ACIMA' as const, actualRate: 25, targetRate: 20 },
          funnelVelocity: { score: 80, status: 'OK' as const, avgHours: 60 },
          stagnantLeads: { score: 85, status: 'OK' as const, count: 5, totalLeads: 100 },
          followUpRate: { score: 95, percentage: 95 }
        }
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData)
    })

    render(<HealthScoreCard />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Health Score')).toBeInTheDocument()
      expect(screen.getByText('SAUDÁVEL')).toBeInTheDocument()
    })
  })

  it('should display all 4 metric labels', async () => {
    const mockData = {
      success: true,
      data: {
        score: 70,
        status: 'OK' as const,
        factors: {
          conversionVsGoal: { score: 75, status: 'NA_META' as const, actualRate: 20, targetRate: 20 },
          funnelVelocity: { score: 70, status: 'OK' as const, avgHours: 70 },
          stagnantLeads: { score: 70, status: 'OK' as const, count: 10, totalLeads: 100 },
          followUpRate: { score: 75, percentage: 75 }
        }
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData)
    })

    render(<HealthScoreCard />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Conversão vs Meta')).toBeInTheDocument()
      expect(screen.getByText('Velocidade Funil')).toBeInTheDocument()
      expect(screen.getByText('Leads Estagnados')).toBeInTheDocument()
      expect(screen.getByText('Follow-up em dia')).toBeInTheDocument()
    })
  })
})
