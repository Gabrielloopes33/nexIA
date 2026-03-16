import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { useLostDeals } from '../use-lost-deals'
import { LostDeal } from '@/types/dashboard'

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

describe('useLostDeals', () => {
  const mockLostDeals: LostDeal[] = [
    {
      id: '1',
      title: 'Deal 1',
      contactName: 'João Silva',
      amount: 5000,
      lostReason: 'Preço',
      lostReasonDetail: null,
      lostAt: new Date().toISOString(),
      recoveryPotential: 'high',
      recoveryScore: 80,
      daysSinceLost: 5,
    },
    {
      id: '2',
      title: 'Deal 2',
      contactName: 'Maria Santos',
      amount: 3000,
      lostReason: 'Timing',
      lostReasonDetail: null,
      lostAt: new Date().toISOString(),
      recoveryPotential: 'medium',
      recoveryScore: 50,
      daysSinceLost: 10,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('deve buscar leads perdidos com sucesso', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { deals: mockLostDeals } }),
    })

    const { result } = renderHook(() => useLostDeals('30d', 10), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.deals).toEqual(mockLostDeals)
    expect(result.current.data?.deals).toHaveLength(2)
    expect(fetch).toHaveBeenCalledWith('/api/dashboard/lost-deals?period=30d&limit=10')
  })

  it('deve usar o limite padrão de 10 quando não especificado', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { deals: mockLostDeals } }),
    })

    const { result } = renderHook(() => useLostDeals('30d'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetch).toHaveBeenCalledWith('/api/dashboard/lost-deals?period=30d&limit=10')
  })

  it('deve aceitar limite personalizado', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { deals: mockLostDeals.slice(0, 1) } }),
    })

    const { result } = renderHook(() => useLostDeals('7d', 5), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetch).toHaveBeenCalledWith('/api/dashboard/lost-deals?period=7d&limit=5')
  })

  it('deve lidar com erro na requisição', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    })

    const { result } = renderHook(() => useLostDeals('30d'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error?.message).toBe('Failed to fetch lost deals')
  })

  it('deve lidar com erro de API (success: false)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, error: 'Erro ao buscar dados' }),
    })

    const { result } = renderHook(() => useLostDeals('30d'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error?.message).toBe('Erro ao buscar dados')
  })

  it('deve refetch quando refetch é chamado', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { deals: mockLostDeals } }),
    })

    const { result } = renderHook(() => useLostDeals('30d', 5), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    vi.clearAllMocks()

    await result.current.refetch()

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/dashboard/lost-deals?period=30d&limit=5')
    })
  })

  it('deve retornar lista vazia quando não há deals', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { deals: [] } }),
    })

    const { result } = renderHook(() => useLostDeals('today'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.deals).toEqual([])
    expect(result.current.data?.deals).toHaveLength(0)
  })
})
