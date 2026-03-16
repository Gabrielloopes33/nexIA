import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MotivosPerdaCard } from '../index'
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

describe('MotivosPerdaCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useDashboardFilters).mockReturnValue({ period: '30d' } as any)
  })

  it('should render loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))

    render(<MotivosPerdaCard />, { wrapper: createWrapper() })

    expect(screen.getByTestId('motivos-perda-skeleton')).toBeInTheDocument()
  })

  it('should render chart with data', async () => {
    const mockData = {
      success: true,
      data: {
        reasons: [
          { reason: 'NO_BUDGET', count: 10, value: 50000, change: 5, trend: 'up' },
          { reason: 'COMPETITOR', count: 8, value: 40000, change: -2, trend: 'down' },
          { reason: 'NO_INTEREST', count: 6, value: 30000, change: 0, trend: 'stable' },
          { reason: 'OTHER', count: 4, value: 20000, change: 1, trend: 'up' },
        ]
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData)
    })

    render(<MotivosPerdaCard />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('motivos-perda-chart')).toBeInTheDocument()
    })

    // Should show legend items
    const legendItems = screen.getAllByTestId('motivo-legend-item')
    expect(legendItems.length).toBeGreaterThan(0)
  })

  it('should render empty state when no data', async () => {
    const mockData = {
      success: true,
      data: {
        reasons: []
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData)
    })

    render(<MotivosPerdaCard />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Nenhum dado de perdas no período')).toBeInTheDocument()
    })
  })

  it('should render error state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    render(<MotivosPerdaCard />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar dados')).toBeInTheDocument()
    })
  })

  it('should show correct title', async () => {
    const mockData = {
      success: true,
      data: { reasons: [] }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData)
    })

    render(<MotivosPerdaCard />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Motivos de Perda')).toBeInTheDocument()
    })
  })
})
