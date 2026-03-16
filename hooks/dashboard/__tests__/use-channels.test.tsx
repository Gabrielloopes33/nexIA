import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { useChannels } from '../use-channels'
import { ChannelPerformance } from '@/types/dashboard'

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

describe('useChannels', () => {
  const mockChannels: ChannelPerformance[] = [
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
    {
      channel: 'MANUAL',
      messagesSent: 40,
      messagesReceived: 35,
      responseRate: 87.5,
      avgFirstResponseSecs: 200,
      leadsGenerated: 20,
      dealsWon: 4,
      revenueWon: 2000,
      conversionRate: 20,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('deve buscar dados dos canais com sucesso', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { channels: mockChannels } }),
    })

    const { result } = renderHook(() => useChannels('30d'), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.channels).toEqual(mockChannels)
    expect(result.current.data?.channels).toHaveLength(3)
    expect(fetch).toHaveBeenCalledWith('/api/dashboard/channels?period=30d')
  })

  it('deve lidar com erro na requisição', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    })

    const { result } = renderHook(() => useChannels('30d'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error?.message).toBe('Failed to fetch channel data')
    expect(result.current.data).toBeUndefined()
  })

  it('deve lidar com erro de API (success: false)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, error: 'Erro no servidor' }),
    })

    const { result } = renderHook(() => useChannels('30d'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error?.message).toBe('Erro no servidor')
  })

  it('deve refetch quando refetch é chamado', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { channels: mockChannels } }),
    })

    const { result } = renderHook(() => useChannels('30d'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    vi.clearAllMocks()

    await result.current.refetch()

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/dashboard/channels?period=30d')
    })
  })

  it('deve buscar com diferentes períodos', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { channels: mockChannels } }),
    })

    const periods = ['today', '7d', '30d', '90d'] as const

    for (const period of periods) {
      const { result } = renderHook(() => useChannels(period), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(fetch).toHaveBeenCalledWith(`/api/dashboard/channels?period=${period}`)
      
      vi.clearAllMocks()
    }
  })

  it('deve retornar lista vazia quando não há canais', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { channels: [] } }),
    })

    const { result } = renderHook(() => useChannels('today'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.channels).toEqual([])
    expect(result.current.data?.channels).toHaveLength(0)
  })
})
