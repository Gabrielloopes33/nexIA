import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import useSWR from 'swr'
import { useIntegrationLogs, useIntegrationLogsStats, IntegrationType, IntegrationActivityStatus, IntegrationActivityType } from '@/hooks/use-integration-logs'
import { mockIntegrationLogs, mockOrganizationId } from '../../mocks/data'

vi.mock('swr')

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('useIntegrationLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(mockOrganizationId)
  })

  describe('Fetch', () => {
    it('fetches logs with organization_id', async () => {
      const mockData = {
        success: true,
        data: mockIntegrationLogs,
        meta: {
          pagination: {
            total: 3,
            limit: 20,
            offset: 0,
            hasMore: false,
          },
        },
      }
      vi.mocked(useSWR).mockReturnValue({
        data: mockData,
        error: undefined,
        isLoading: false,
        mutate: vi.fn(),
        isValidating: false,
      } as any)

      const { result } = renderHook(() => useIntegrationLogs())

      await waitFor(() => {
        expect(result.current.logs).toEqual(mockIntegrationLogs)
      })
    })

    it('filters by integration type', () => {
      vi.mocked(useSWR).mockReturnValue({
        data: { success: true, data: [], meta: { pagination: { total: 0, limit: 20, offset: 0, hasMore: false } } },
        error: undefined,
        isLoading: false,
        mutate: vi.fn(),
        isValidating: false,
      } as any)

      renderHook(() => useIntegrationLogs({ type: 'WHATSAPP' as IntegrationType }))

      const callArgs = vi.mocked(useSWR).mock.calls[0]
      expect(callArgs[0]).toContain('type=WHATSAPP')
    })

    it('filters by status', () => {
      vi.mocked(useSWR).mockReturnValue({
        data: { success: true, data: [], meta: { pagination: { total: 0, limit: 20, offset: 0, hasMore: false } } },
        error: undefined,
        isLoading: false,
        mutate: vi.fn(),
        isValidating: false,
      } as any)

      renderHook(() => useIntegrationLogs({ status: 'FAILED' as IntegrationActivityStatus }))

      const callArgs = vi.mocked(useSWR).mock.calls[0]
      expect(callArgs[0]).toContain('status=FAILED')
    })

    it('filters by activity type', () => {
      vi.mocked(useSWR).mockReturnValue({
        data: { success: true, data: [], meta: { pagination: { total: 0, limit: 20, offset: 0, hasMore: false } } },
        error: undefined,
        isLoading: false,
        mutate: vi.fn(),
        isValidating: false,
      } as any)

      renderHook(() => useIntegrationLogs({ activityType: 'MESSAGE_SENT' as IntegrationActivityType }))

      const callArgs = vi.mocked(useSWR).mock.calls[0]
      expect(callArgs[0]).toContain('activityType=MESSAGE_SENT')
    })

    it('applies limit', () => {
      vi.mocked(useSWR).mockReturnValue({
        data: { success: true, data: [], meta: { pagination: { total: 0, limit: 50, offset: 0, hasMore: false } } },
        error: undefined,
        isLoading: false,
        mutate: vi.fn(),
        isValidating: false,
      } as any)

      renderHook(() => useIntegrationLogs({ limit: 50 }))

      const callArgs = vi.mocked(useSWR).mock.calls[0]
      expect(callArgs[0]).toContain('limit=50')
    })
  })

  describe('Mutations', () => {
    it('creates log entry', async () => {
      const mockMutate = vi.fn()
      vi.mocked(useSWR).mockReturnValue({
        data: { success: true, data: [], meta: { pagination: { total: 0, limit: 20, offset: 0, hasMore: false } } },
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
        isValidating: false,
      } as any)

      const { result } = renderHook(() => useIntegrationLogs())

      const newLog = {
        integrationType: 'STRIPE' as IntegrationType,
        activityType: 'MESSAGE_SENT' as IntegrationActivityType,
        title: 'Pagamento realizado',
        status: 'SUCCESS' as IntegrationActivityStatus,
        requestPayload: { amount: 100 },
        responsePayload: { id: 'pi_123' },
      }

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: 'new-log', ...newLog } }),
      } as Response)

      await result.current.createLog(newLog)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/integrations/logs',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLog),
        })
      )
    })

    it('clears old logs and returns deletedCount', async () => {
      const mockMutate = vi.fn()
      vi.mocked(useSWR).mockReturnValue({
        data: { success: true, data: mockIntegrationLogs, meta: { pagination: { total: 3, limit: 20, offset: 0, hasMore: false } } },
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
        isValidating: false,
      } as any)

      const { result } = renderHook(() => useIntegrationLogs())

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, deletedCount: 10 }),
      } as Response)

      const result_data = await result.current.clearLogs(7)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/integrations/logs?days=7'),
        expect.objectContaining({ method: 'DELETE' })
      )
      expect(result_data.deletedCount).toBe(10)
    })

    it('refreshes data after clearing logs', async () => {
      const mockMutate = vi.fn()
      vi.mocked(useSWR).mockReturnValue({
        data: { success: true, data: mockIntegrationLogs, meta: { pagination: { total: 3, limit: 20, offset: 0, hasMore: false } } },
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
        isValidating: false,
      } as any)

      const { result } = renderHook(() => useIntegrationLogs())

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, deletedCount: 10 }),
      } as Response)

      await result.current.clearLogs(7)

      expect(mockMutate).toHaveBeenCalled()
    })
  })

  describe('Stats', () => {
    it('fetches stats correctly', async () => {
      const mockStats = {
        period: '24h',
        totalCount: 100,
        byIntegrationType: { WHATSAPP: 50, INSTAGRAM: 30, STRIPE: 20 },
        byActivityType: { MESSAGE_SENT: 50, WEBHOOK_RECEIVED: 30, SYNC_COMPLETED: 20 },
        byStatus: { SUCCESS: 90, FAILED: 10 },
        successRate: 0.9,
        avgDurationMs: 150,
        recentErrors: [],
      }

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockStats }),
      } as Response)

      const mockMutate = vi.fn()
      vi.mocked(useSWR).mockReturnValue({
        data: { success: true, data: [], meta: { pagination: { total: 0, limit: 20, offset: 0, hasMore: false } } },
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
        isValidating: false,
      } as any)

      const { result } = renderHook(() => useIntegrationLogs())
      const stats = await result.current.getStats('24h')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/integrations/logs/stats')
      )
      expect(stats).toEqual(mockStats)
    })
  })
})

describe('useIntegrationLogsStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(mockOrganizationId)
  })

  it('fetches stats with period', async () => {
    const mockStats = {
      period: '7d',
      totalCount: 100,
      byIntegrationType: {},
      byActivityType: {},
      byStatus: { SUCCESS: 95, FAILED: 5, PENDING: 0, WARNING: 0 },
      successRate: 0.95,
      avgDurationMs: 120,
      recentErrors: [],
    }

    vi.mocked(useSWR).mockReturnValue({
      data: { success: true, data: mockStats },
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
      isValidating: false,
    } as any)

    const { result } = renderHook(() => useIntegrationLogsStats('7d'))

    await waitFor(() => {
      expect(result.current.stats).toEqual(mockStats)
      expect(result.current.isLoading).toBe(false)
    })

    const callArgs = vi.mocked(useSWR).mock.calls[0]
    expect(callArgs[0]).toContain('period=7d')
  })
})
