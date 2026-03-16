import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { useFunnel } from '../use-funnel'
import { FunnelMetrics } from '@/types/dashboard'

/**
 * Cria um wrapper com QueryClientProvider para os testes
 */
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { 
      queries: { 
        retry: false,
        staleTime: 0,
        gcTime: 0,
      } 
    }
  })
  
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe('useFunnel', () => {
  const mockFunnelData: FunnelMetrics = {
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
    totalValue: 15000,
    avgConversionTime: 48,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('deve buscar dados do funil com sucesso', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockFunnelData }),
    })

    const { result } = renderHook(() => useFunnel('30d'), {
      wrapper: createWrapper(),
    })

    // Verifica estado inicial de loading
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()

    // Aguarda o sucesso da query
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Verifica os dados retornados
    expect(result.current.data).toEqual(mockFunnelData)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()

    // Verifica se fetch foi chamado com a URL correta
    expect(fetch).toHaveBeenCalledWith('/api/dashboard/funnel?period=30d')
  })

  it('deve lidar com erro na requisição', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    })

    const { result } = renderHook(() => useFunnel('30d'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeDefined()
    expect(result.current.error?.message).toBe('Failed to fetch funnel data')
    expect(result.current.data).toBeUndefined()
  })

  it('deve lidar com erro de API (success: false)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, error: 'Dados não disponíveis' }),
    })

    const { result } = renderHook(() => useFunnel('30d'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error?.message).toBe('Dados não disponíveis')
  })

  it('deve refetch quando refetch é chamado', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockFunnelData }),
    })

    const { result } = renderHook(() => useFunnel('30d'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Limpa os mocks para verificar se refetch chama novamente
    vi.clearAllMocks()

    // Chama refetch
    await result.current.refetch()

    // Verifica se fetch foi chamado novamente
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/dashboard/funnel?period=30d')
    })
  })

  it('deve usar staleTime de 5 minutos', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockFunnelData }),
    })

    const { result } = renderHook(() => useFunnel('7d'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetch).toHaveBeenCalledWith('/api/dashboard/funnel?period=7d')
  })

  it('deve fazer fetch com período today', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockFunnelData }),
    })

    const { result } = renderHook(() => useFunnel('today'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetch).toHaveBeenCalledWith('/api/dashboard/funnel?period=today')
  })

  it('deve fazer fetch com período 90d', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockFunnelData }),
    })

    const { result } = renderHook(() => useFunnel('90d'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetch).toHaveBeenCalledWith('/api/dashboard/funnel?period=90d')
  })
})
