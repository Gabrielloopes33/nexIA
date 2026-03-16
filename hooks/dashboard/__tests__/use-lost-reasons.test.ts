import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLostReasons } from '../use-lost-reasons'

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

describe('useLostReasons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch lost reasons successfully', async () => {
    const mockData = {
      success: true,
      data: {
        reasons: [
          { reason: 'NO_BUDGET', count: 10, value: 50000, change: 5, trend: 'up' },
          { reason: 'COMPETITOR', count: 8, value: 40000, change: -2, trend: 'down' },
        ]
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData)
    })

    const { result } = renderHook(() => useLostReasons('30d'), {
      wrapper: createWrapper()
    })

    // Initially loading
    expect(result.current.isLoading).toBe(true)

    // Wait for data
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockData.data)
    expect(mockFetch).toHaveBeenCalledWith('/api/dashboard/lost-reasons?period=30d')
  })

  it('should handle error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    const { result } = renderHook(() => useLostReasons('30d'), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeDefined()
  })

  it('should handle API error with message', async () => {
    const mockError = {
      success: false,
      error: 'Database connection failed'
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockError)
    })

    const { result } = renderHook(() => useLostReasons('30d'), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error?.message).toBe('Database connection failed')
  })

  it('should handle empty reasons array', async () => {
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

    const { result } = renderHook(() => useLostReasons('7d'), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.reasons).toHaveLength(0)
  })

  it('should refetch data when called', async () => {
    const mockData = {
      success: true,
      data: {
        reasons: [{ reason: 'NO_BUDGET', count: 5, value: 25000, change: 0, trend: 'stable' }]
      }
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData)
    })

    const { result } = renderHook(() => useLostReasons('7d'), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Call refetch
    await result.current.refetch()

    // Should have been called twice
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('should use correct query key for different periods', async () => {
    const mockData = {
      success: true,
      data: { reasons: [] }
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData)
    })

    const { result: result7d } = renderHook(() => useLostReasons('7d'), {
      wrapper: createWrapper()
    })

    const { result: result30d } = renderHook(() => useLostReasons('30d'), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result7d.current.isSuccess).toBe(true)
      expect(result30d.current.isSuccess).toBe(true)
    })

    expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/dashboard/lost-reasons?period=7d')
    expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/dashboard/lost-reasons?period=30d')
  })
})
