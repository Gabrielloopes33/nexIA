import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReceitaSemanalCard } from '../index'

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

describe('ReceitaSemanalCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))

    render(<ReceitaSemanalCard />, { wrapper: createWrapper() })

    expect(screen.getByTestId('receita-semanal-skeleton')).toBeInTheDocument()
  })

  it('should render chart with data', async () => {
    const mockData = {
      success: true,
      data: {
        weeks: [
          { week: '2024-W01', weekStart: '2024-01-01', weekEnd: '2024-01-07', revenue: 50000, dealsWon: 5, goal: 60000, ticketAvg: 10000 },
          { week: '2024-W02', weekStart: '2024-01-08', weekEnd: '2024-01-14', revenue: 75000, dealsWon: 7, goal: 60000, ticketAvg: 10714 },
          { week: '2024-W03', weekStart: '2024-01-15', weekEnd: '2024-01-21', revenue: 60000, dealsWon: 6, goal: 60000, ticketAvg: 10000 },
        ]
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData)
    })

    render(<ReceitaSemanalCard />, { wrapper: createWrapper() })

    await waitFor(() => {
      // O Recharts renderiza um container vazio no jsdom, então verificamos se o card foi renderizado
      expect(screen.getByText('Receita Semanal')).toBeInTheDocument()
      // Verificar se o container do recharts está presente
      expect(document.querySelector('.recharts-responsive-container')).toBeInTheDocument()
    })
  })

  it('should render empty state when no data', async () => {
    const mockData = {
      success: true,
      data: {
        weeks: []
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData)
    })

    render(<ReceitaSemanalCard />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Nenhum dado de receita')).toBeInTheDocument()
    })
  })

  it('should render error state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    render(<ReceitaSemanalCard />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar dados')).toBeInTheDocument()
    })
  })

  it('should show correct title', async () => {
    const mockData = {
      success: true,
      data: { weeks: [] }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData)
    })

    render(<ReceitaSemanalCard />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Receita Semanal')).toBeInTheDocument()
    })
  })
})
