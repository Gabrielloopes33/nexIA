import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRevenue } from '../use-revenue'

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

describe('useRevenue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch revenue data successfully', async () => {
    const mockData = {
      success: true,
      data: {
        weeks: [
          { week: '2024-W01', weekStart: '2024-01-01', weekEnd: '2024-01-07', revenue: 50000, dealsWon: 5, goal: 60000, ticketAvg: 10000 },
          { week: '2024-W02', weekStart: '2024-01-08', weekEnd: '2024-01-14', revenue: 75000, dealsWon: 7, goal: 60000, ticketAvg: 10714 },
        ]
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData)
    })

    const { result } = renderHook(() => useRevenue(8), {
      wrapper: createWrapper()
    })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockData.data)
    expect(mockFetch).toHaveBeenCalledWith('/api/dashboard/revenue?weeks=8')
  })

  it('should use default value of 8 weeks', async () => {
    const mockData = {
      success: true,
      data: { weeks: [] }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData)
    })

    renderHook(() => useRevenue(), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith('/api/dashboard/revenue?weeks=8'))
  })

  it('should accept custom weeks parameter', async () => {
    const mockData = {
      success: true,
      data: { weeks: [] }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData)
    })

    renderHook(() => useRevenue(12), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith('/api/dashboard/revenue?weeks=12'))
  })

  it('should handle error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    const { result } = renderHook(() => useRevenue(8), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeDefined()
  })

  it('should handle API error with message', async () => {
    const mockError = {
      success: false,
      error: 'Service unavailable'
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockError)
    })

    const { result } = renderHook(() => useRevenue(8), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error?.message).toBe('Service unavailable')
  })

  it('should handle empty weeks array', async () => {
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

    const { result } = renderHook(() => useRevenue(8), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.weeks).toHaveLength(0)
  })

  it('should refetch data when called', async () => {
    const mockData = {
      success: true,
      data: {
        weeks: [{ week: '2024-W01', weekStart: '2024-01-01', weekEnd: '2024-01-07', revenue: 50000, dealsWon: 5, goal: 60000, ticketAvg: 10000 }]
      }
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData)
    })

    const { result } = renderHook(() => useRevenue(4), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    await result.current.refetch()

    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('should use correct query key for different weeks', async () => {
    const mockData = {
      success: true,
      data: { weeks: [] }
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData)
    })

    renderHook(() => useRevenue(4), { wrapper: createWrapper() })
    renderHook(() => useRevenue(8), { wrapper: createWrapper() })

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))

    expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/dashboard/revenue?weeks=4')
    expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/dashboard/revenue?weeks=8')
  })
})
