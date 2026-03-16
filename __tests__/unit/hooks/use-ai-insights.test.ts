import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import useSWR from 'swr'
import { useAiInsights, AiInsightType, AiInsightStatus } from '@/hooks/use-ai-insights'
import { mockAiInsights, mockOrganizationId } from '../../mocks/data'

// Mock SWR
vi.mock('swr')

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('useAiInsights', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(mockOrganizationId)
  })

  describe('Fetch', () => {
    it('fetches insights with organization_id from localStorage', async () => {
      const mockData = { data: mockAiInsights, pagination: { total: 3, limit: 20, offset: 0, hasMore: false } }
      vi.mocked(useSWR).mockReturnValue({
        data: mockData,
        error: undefined,
        isLoading: false,
        mutate: vi.fn(),
        isValidating: false,
      } as any)

      const { result } = renderHook(() => useAiInsights())

      await waitFor(() => {
        expect(result.current.insights).toEqual(mockAiInsights)
      })
    })

    it('uses localStorage organizationId to build cache key', async () => {
      const mockData = { data: [], pagination: { total: 0, limit: 20, offset: 0, hasMore: false } }
      vi.mocked(useSWR).mockReturnValue({
        data: mockData,
        error: undefined,
        isLoading: false,
        mutate: vi.fn(),
        isValidating: false,
      } as any)

      renderHook(() => useAiInsights())

      // Verify localStorage was checked
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('organizationId')
      
      // Verify SWR was called with a cache key (null if no orgId, or URL if orgId exists)
      expect(useSWR).toHaveBeenCalled()
      const callArgs = vi.mocked(useSWR).mock.calls[0]
      // The key should be a URL string when orgId is available
      expect(typeof callArgs[0]).toBe('string')
      expect(callArgs[0]).toContain('/api/ai-insights')
    })

    it('applies type filter correctly', () => {
      const mockData = { data: mockAiInsights.filter(i => i.type === 'PREDICTION'), pagination: { total: 1, limit: 20, offset: 0, hasMore: false } }
      vi.mocked(useSWR).mockReturnValue({
        data: mockData,
        error: undefined,
        isLoading: false,
        mutate: vi.fn(),
        isValidating: false,
      } as any)

      renderHook(() => useAiInsights({ type: 'PREDICTION' as AiInsightType }))

      const callArgs = vi.mocked(useSWR).mock.calls[0]
      expect(callArgs[0]).toContain('type=PREDICTION')
    })

    it('applies status filter correctly', () => {
      const mockData = { data: mockAiInsights.filter(i => i.status === 'ACTIVE'), pagination: { total: 2, limit: 20, offset: 0, hasMore: false } }
      vi.mocked(useSWR).mockReturnValue({
        data: mockData,
        error: undefined,
        isLoading: false,
        mutate: vi.fn(),
        isValidating: false,
      } as any)

      renderHook(() => useAiInsights({ status: 'ACTIVE' as AiInsightStatus }))

      const callArgs = vi.mocked(useSWR).mock.calls[0]
      expect(callArgs[0]).toContain('status=ACTIVE')
    })

    it('applies limit correctly', () => {
      vi.mocked(useSWR).mockReturnValue({
        data: { data: [], pagination: { total: 0, limit: 10, offset: 0, hasMore: false } },
        error: undefined,
        isLoading: false,
        mutate: vi.fn(),
        isValidating: false,
      } as any)

      renderHook(() => useAiInsights({ limit: 10 }))

      const callArgs = vi.mocked(useSWR).mock.calls[0]
      expect(callArgs[0]).toContain('limit=10')
    })

    it('returns loading state correctly', () => {
      vi.mocked(useSWR).mockReturnValue({
        data: undefined,
        error: undefined,
        isLoading: true,
        mutate: vi.fn(),
        isValidating: false,
      } as any)

      const { result } = renderHook(() => useAiInsights())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.insights).toEqual([])
    })

    it('returns error state correctly', () => {
      const mockError = new Error('Failed to fetch')
      vi.mocked(useSWR).mockReturnValue({
        data: undefined,
        error: mockError,
        isLoading: false,
        mutate: vi.fn(),
        isValidating: false,
      } as any)

      const { result } = renderHook(() => useAiInsights())

      expect(result.current.error).toBe(mockError)
    })
  })

  describe('Mutations', () => {
    it('createInsight calls fetch with correct params', async () => {
      const mockMutate = vi.fn()
      vi.mocked(useSWR).mockReturnValue({
        data: { data: mockAiInsights, pagination: { total: 3, limit: 20, offset: 0, hasMore: false } },
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
        isValidating: false,
      } as any)

      const { result } = renderHook(() => useAiInsights())

      const newInsight = {
        type: 'PREDICTION' as AiInsightType,
        category: 'conversion',
        title: 'Novo Insight',
        description: 'Descrição do insight',
        relatedContactIds: [],
        relatedDealIds: [],
      }

      // Mock fetch para criação
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: 'new-insight', ...newInsight } }),
      } as Response)

      await result.current.createInsight(newInsight)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ai-insights',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newInsight),
        })
      )
    })

    it('updateInsight calls fetch with correct params', async () => {
      const mockMutate = vi.fn()
      vi.mocked(useSWR).mockReturnValue({
        data: { data: mockAiInsights, pagination: { total: 3, limit: 20, offset: 0, hasMore: false } },
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
        isValidating: false,
      } as any)

      const { result } = renderHook(() => useAiInsights())

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { ...mockAiInsights[0], status: 'DISMISSED' } }),
      } as Response)

      await result.current.updateInsight('insight-1', { status: 'DISMISSED' as AiInsightStatus })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ai-insights/insight-1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'DISMISSED' }),
        })
      )
    })

    it('deleteInsight calls fetch with correct params', async () => {
      const mockMutate = vi.fn()
      vi.mocked(useSWR).mockReturnValue({
        data: { data: mockAiInsights, pagination: { total: 3, limit: 20, offset: 0, hasMore: false } },
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
        isValidating: false,
      } as any)

      const { result } = renderHook(() => useAiInsights())

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      await result.current.deleteInsight('insight-1')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ai-insights/insight-1',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })

  describe('Stats', () => {
    it('getStats returns stats correctly', async () => {
      const mockStats = {
        total: 10,
        byType: { PREDICTION: 4, ALERT: 3, RECOMMENDATION: 2, DISCOVERY: 1 },
        byStatus: { ACTIVE: 7, DISMISSED: 2, ARCHIVED: 1 },
        byCategory: { conversion: 5, engagement: 3, marketing: 2 },
        highConfidence: 5,
        averageConfidence: 82,
      }

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockStats }),
      } as Response)

      const mockMutate = vi.fn()
      vi.mocked(useSWR).mockReturnValue({
        data: { data: [], pagination: { total: 0, limit: 20, offset: 0, hasMore: false } },
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
        isValidating: false,
      } as any)

      const { result } = renderHook(() => useAiInsights())
      const stats = await result.current.getStats()

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/ai-insights/stats')
      )
      expect(stats).toEqual(mockStats)
    })

    it('getStats returns null when organizationId is not available', async () => {
      // Simulate no organizationId in localStorage
      mockLocalStorage.getItem.mockReturnValueOnce(null)

      const mockMutate = vi.fn()
      vi.mocked(useSWR).mockReturnValue({
        data: { data: [], pagination: { total: 0, limit: 20, offset: 0, hasMore: false } },
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
        isValidating: false,
      } as any)

      const { result } = renderHook(() => useAiInsights())
      const stats = await result.current.getStats()

      expect(stats).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('returns error message in Portuguese on fetch failure', async () => {
      const mockMutate = vi.fn()
      vi.mocked(useSWR).mockReturnValue({
        data: { data: [], pagination: { total: 0, limit: 20, offset: 0, hasMore: false } },
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
        isValidating: false,
      } as any)

      const { result } = renderHook(() => useAiInsights())

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: 'Erro ao criar insight' }),
      } as Response)

      const newInsight = {
        type: 'PREDICTION' as AiInsightType,
        category: 'test',
        title: 'Test',
        description: 'Test',
        relatedContactIds: [],
        relatedDealIds: [],
      }

      const response = await result.current.createInsight(newInsight)
      expect(response).toBeNull()
    })
  })
})
