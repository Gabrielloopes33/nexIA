import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useHealthScore } from '../use-health-score'

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

describe('useHealthScore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch health score successfully', async () => {
    const mockData = {
      success: true,
      data: {
        score: 85,
        status: 'SAUDÁVEL' as const,
        factors: {
          conversionVsGoal: {
            score: 90,
            status: 'ACIMA' as const,
            actualRate: 25,
            targetRate: 20
          },
          funnelVelocity: {
            score: 80,
            status: 'OK' as const,
            avgHours: 60
          },
          stagnantLeads: {
            score: 85,
            status: 'OK' as const,
            count: 5,
            totalLeads: 100
          },
          followUpRate: {
            score: 95,
            percentage: 95
          }
        }
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData)
    })

    const { result } = renderHook(() => useHealthScore('30d'), {
      wrapper: createWrapper()
    })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockData.data)
    expect(result.current.data?.score).toBe(85)
    expect(result.current.data?.status).toBe('SAUDÁVEL')
    expect(mockFetch).toHaveBeenCalledWith('/api/dashboard/health-score?period=30d')
  })

  it('should handle error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    const { result } = renderHook(() => useHealthScore('30d'), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeDefined()
  })

  it('should handle API error with message', async () => {
    const mockError = {
      success: false,
      error: 'Failed to calculate health score'
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockError)
    })

    const { result } = renderHook(() => useHealthScore('30d'), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error?.message).toBe('Failed to calculate health score')
  })

  it('should handle CRITICO status', async () => {
    const mockData = {
      success: true,
      data: {
        score: 25,
        status: 'CRÍTICO' as const,
        factors: {
          conversionVsGoal: { score: 20, status: 'ABAIXO' as const, actualRate: 10, targetRate: 20 },
          funnelVelocity: { score: 30, status: 'CRÍTICO' as const, avgHours: 200 },
          stagnantLeads: { score: 25, status: 'CRÍTICO' as const, count: 40, totalLeads: 100 },
          followUpRate: { score: 30, percentage: 30 }
        }
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData)
    })

    const { result } = renderHook(() => useHealthScore('7d'), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.status).toBe('CRÍTICO')
    expect(result.current.data?.score).toBe(25)
  })

  it('should handle ATENCAO status', async () => {
    const mockData = {
      success: true,
      data: {
        score: 50,
        status: 'ATENÇÃO' as const,
        factors: {
          conversionVsGoal: { score: 60, status: 'NA_META' as const, actualRate: 18, targetRate: 20 },
          funnelVelocity: { score: 55, status: 'LENTO' as const, avgHours: 100 },
          stagnantLeads: { score: 45, status: 'ATENÇÃO' as const, count: 18, totalLeads: 100 },
          followUpRate: { score: 60, percentage: 60 }
        }
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData)
    })

    const { result } = renderHook(() => useHealthScore('7d'), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.status).toBe('ATENÇÃO')
    expect(result.current.data?.score).toBe(50)
  })

  it('should handle OK status', async () => {
    const mockData = {
      success: true,
      data: {
        score: 70,
        status: 'OK' as const,
        factors: {
          conversionVsGoal: { score: 75, status: 'NA_META' as const, actualRate: 19, targetRate: 20 },
          funnelVelocity: { score: 70, status: 'LENTO' as const, avgHours: 90 },
          stagnantLeads: { score: 70, status: 'ATENÇÃO' as const, count: 15, totalLeads: 100 },
          followUpRate: { score: 80, percentage: 80 }
        }
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData)
    })

    const { result } = renderHook(() => useHealthScore('7d'), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.status).toBe('OK')
    expect(result.current.data?.score).toBe(70)
  })

  it('should refetch data when called', async () => {
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

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData)
    })

    const { result } = renderHook(() => useHealthScore('7d'), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    await result.current.refetch()

    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('should use correct query key for different periods', async () => {
    const mockData = {
      success: true,
      data: {
        score: 75,
        status: 'OK' as const,
        factors: {
          conversionVsGoal: { score: 80, status: 'NA_META' as const, actualRate: 20, targetRate: 20 },
          funnelVelocity: { score: 75, status: 'OK' as const, avgHours: 70 },
          stagnantLeads: { score: 75, status: 'OK' as const, count: 10, totalLeads: 100 },
          followUpRate: { score: 75, percentage: 75 }
        }
      }
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData)
    })

    renderHook(() => useHealthScore('7d'), { wrapper: createWrapper() })
    renderHook(() => useHealthScore('30d'), { wrapper: createWrapper() })

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))

    expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/dashboard/health-score?period=7d')
    expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/dashboard/health-score?period=30d')
  })
})
