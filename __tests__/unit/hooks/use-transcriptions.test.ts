import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import useSWR from 'swr'
import { useTranscriptions, useTranscription, TranscriptionStatus, TranscriptionSource } from '@/hooks/use-transcriptions'
import { mockTranscriptions, mockOrganizationId } from '../../mocks/data'

vi.mock('swr')

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('useTranscriptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(mockOrganizationId)
  })

  describe('Fetch', () => {
    it('fetches transcriptions with organization_id', async () => {
      // The hook's fetcher expects data.data to be an array
      vi.mocked(useSWR).mockReturnValue({
        data: mockTranscriptions,
        error: undefined,
        isLoading: false,
        mutate: vi.fn(),
        isValidating: false,
      } as any)

      const { result } = renderHook(() => useTranscriptions())

      await waitFor(() => {
        expect(result.current.transcriptions).toEqual(mockTranscriptions)
      })
    })

    it('filters by contactId', () => {
      vi.mocked(useSWR).mockReturnValue({
        data: [],
        error: undefined,
        isLoading: false,
        mutate: vi.fn(),
        isValidating: false,
      } as any)

      renderHook(() => useTranscriptions({ contactId: 'contact-1' }))

      const callArgs = vi.mocked(useSWR).mock.calls[0]
      expect(callArgs[0]).toContain('contactId=contact-1')
    })

    it('filters by status', () => {
      vi.mocked(useSWR).mockReturnValue({
        data: [],
        error: undefined,
        isLoading: false,
        mutate: vi.fn(),
        isValidating: false,
      } as any)

      renderHook(() => useTranscriptions({ status: 'COMPLETED' as TranscriptionStatus }))

      const callArgs = vi.mocked(useSWR).mock.calls[0]
      expect(callArgs[0]).toContain('status=COMPLETED')
    })

    it('filters by source', () => {
      vi.mocked(useSWR).mockReturnValue({
        data: [],
        error: undefined,
        isLoading: false,
        mutate: vi.fn(),
        isValidating: false,
      } as any)

      renderHook(() => useTranscriptions({ source: 'UPLOAD' as TranscriptionSource }))

      const callArgs = vi.mocked(useSWR).mock.calls[0]
      expect(callArgs[0]).toContain('source=UPLOAD')
    })
  })

  describe('Mutations', () => {
    it('creates transcription with correct data including organizationId', async () => {
      const mockMutate = vi.fn()
      vi.mocked(useSWR).mockReturnValue({
        data: [],
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
        isValidating: false,
      } as any)

      const { result } = renderHook(() => useTranscriptions())

      const newTranscription = {
        contactId: 'contact-1',
        source: 'UPLOAD' as TranscriptionSource,
        audioUrl: 'https://example.com/audio.mp3',
        language: 'pt-BR',
      }

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: 'new-trans', ...newTranscription, status: 'PENDING' } }),
      } as Response)

      await result.current.createTranscription(newTranscription)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/transcriptions',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
      
      // Verify organizationId is included in the body
      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body)
      expect(callBody.organizationId).toBeDefined()
      expect(callBody.organizationId).toBe('test-org-123')
      expect(callBody.source).toBe('UPLOAD')
    })

    it('updates transcription', async () => {
      const mockMutate = vi.fn()
      vi.mocked(useSWR).mockReturnValue({
        data: mockTranscriptions,
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
        isValidating: false,
      } as any)

      const { result } = renderHook(() => useTranscriptions())

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { ...mockTranscriptions[0], sentiment: 'POSITIVE' } }),
      } as Response)

      await result.current.updateTranscription('trans-1', { sentiment: 'POSITIVE' })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/transcriptions/trans-1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ sentiment: 'POSITIVE' }),
        })
      )
    })

    it('deletes transcription', async () => {
      const mockMutate = vi.fn()
      vi.mocked(useSWR).mockReturnValue({
        data: mockTranscriptions,
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
        isValidating: false,
      } as any)

      const { result } = renderHook(() => useTranscriptions())

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      await result.current.deleteTranscription('trans-1')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/transcriptions/trans-1',
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  describe('Analytics', () => {
    it('fetches analytics correctly', async () => {
      const mockAnalytics = {
        totalTranscriptions: 45,
        totalDuration: 3600,
        averageDuration: 120,
        completedCount: 40,
        pendingCount: 2,
        failedCount: 3,
        conversionRate: 0.32,
        averageResolutionDays: 5,
        bySource: { WHATSAPP_CALL: 20, PHONE_CALL: 15, UPLOAD: 10 },
        byStatus: { COMPLETED: 40, PROCESSING: 3, PENDING: 2, FAILED: 0 },
        dailyStats: [],
      }

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockAnalytics }),
      } as Response)

      const mockMutate = vi.fn()
      vi.mocked(useSWR).mockReturnValue({
        data: [],
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
        isValidating: false,
      } as any)

      const { result } = renderHook(() => useTranscriptions())
      const analytics = await result.current.getAnalytics()

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/transcriptions/analytics')
      )
      expect(analytics).toEqual(mockAnalytics)
    })
  })
})

describe('useTranscription', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches single transcription by id', async () => {
    vi.mocked(useSWR).mockReturnValue({
      data: mockTranscriptions[0],
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
      isValidating: false,
    } as any)

    const { result } = renderHook(() => useTranscription('trans-1'))

    await waitFor(() => {
      expect(result.current.transcription).toEqual(mockTranscriptions[0])
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('returns null when id is not provided', () => {
    vi.mocked(useSWR).mockReturnValue({
      data: null,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
      isValidating: false,
    } as any)

    const { result } = renderHook(() => useTranscription(''))

    expect(result.current.transcription).toBeNull()
  })
})
