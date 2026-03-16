import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import useSWR from 'swr'
import { useConversations, useConversation, ConversationStatus, ConversationType } from '@/hooks/use-conversations'
import { mockConversations, mockMessages, mockOrganizationId } from '../../mocks/data'

vi.mock('swr')

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('useConversations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(mockOrganizationId)
  })

  describe('Fetch', () => {
    it('fetches conversations with organization_id', async () => {
      const mockData = { success: true, data: mockConversations, meta: { pagination: { total: 2, limit: 20, offset: 0, hasMore: false } } }
      vi.mocked(useSWR).mockReturnValue({
        data: mockData,
        error: undefined,
        isLoading: false,
        mutate: vi.fn(),
        isValidating: false,
      } as any)

      const { result } = renderHook(() => useConversations())

      await waitFor(() => {
        expect(result.current.conversations).toEqual(mockConversations)
      })
    })

    it('filters by status', () => {
      vi.mocked(useSWR).mockReturnValue({
        data: { success: true, data: [], meta: { pagination: { total: 0, limit: 20, offset: 0, hasMore: false } } },
        error: undefined,
        isLoading: false,
        mutate: vi.fn(),
        isValidating: false,
      } as any)

      renderHook(() => useConversations({ status: 'ACTIVE' as ConversationStatus }))

      const callArgs = vi.mocked(useSWR).mock.calls[0]
      expect(callArgs[0]).toContain('status=ACTIVE')
    })

    it('filters by type', () => {
      vi.mocked(useSWR).mockReturnValue({
        data: { success: true, data: [], meta: { pagination: { total: 0, limit: 20, offset: 0, hasMore: false } } },
        error: undefined,
        isLoading: false,
        mutate: vi.fn(),
        isValidating: false,
      } as any)

      renderHook(() => useConversations({ type: 'USER_INITIATED' as ConversationType }))

      const callArgs = vi.mocked(useSWR).mock.calls[0]
      expect(callArgs[0]).toContain('type=USER_INITIATED')
    })

    it('applies limit', () => {
      vi.mocked(useSWR).mockReturnValue({
        data: { success: true, data: [], meta: { pagination: { total: 0, limit: 50, offset: 0, hasMore: false } } },
        error: undefined,
        isLoading: false,
        mutate: vi.fn(),
        isValidating: false,
      } as any)

      renderHook(() => useConversations({ limit: 50 }))

      const callArgs = vi.mocked(useSWR).mock.calls[0]
      expect(callArgs[0]).toContain('limit=50')
    })
  })

  describe('Mutations', () => {
    it('creates conversation with organizationId in body', async () => {
      const mockMutate = vi.fn()
      vi.mocked(useSWR).mockReturnValue({
        data: { success: true, data: [], meta: { pagination: { total: 0, limit: 20, offset: 0, hasMore: false } } },
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
        isValidating: false,
      } as any)

      const { result } = renderHook(() => useConversations())

      const newConversation = {
        contactId: 'contact-3',
        instanceId: 'instance-1',
        type: 'USER_INITIATED' as ConversationType,
      }

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: 'conv-3', ...newConversation, status: 'ACTIVE', messageCount: 0, isWindowActive: true, timeUntilWindowExpires: 86400000 } }),
      } as Response)

      await result.current.createConversation(newConversation)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/conversations',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"organizationId"'),
        })
      )
      
      // Verify organizationId is in the body
      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body)
      expect(callBody.organizationId).toBeDefined()
      expect(callBody.organizationId).toBe('test-org-123')
    })

    it('updates conversation', async () => {
      const mockMutate = vi.fn()
      vi.mocked(useSWR).mockReturnValue({
        data: { success: true, data: mockConversations, meta: { pagination: { total: 2, limit: 20, offset: 0, hasMore: false } } },
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
        isValidating: false,
      } as any)

      const { result } = renderHook(() => useConversations())

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { ...mockConversations[0], status: 'CLOSED' } }),
      } as Response)

      await result.current.updateConversation('conv-1', { status: 'CLOSED' as ConversationStatus })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/conversations/conv-1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'CLOSED' }),
        })
      )
    })

    it('deletes conversation', async () => {
      const mockMutate = vi.fn()
      vi.mocked(useSWR).mockReturnValue({
        data: { success: true, data: mockConversations, meta: { pagination: { total: 2, limit: 20, offset: 0, hasMore: false } } },
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
        isValidating: false,
      } as any)

      const { result } = renderHook(() => useConversations())

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      await result.current.deleteConversation('conv-1')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/conversations/conv-1',
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('sends message', async () => {
      const mockMutate = vi.fn()
      vi.mocked(useSWR).mockReturnValue({
        data: { success: true, data: mockConversations, meta: { pagination: { total: 2, limit: 20, offset: 0, hasMore: false } } },
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
        isValidating: false,
      } as any)

      const { result } = renderHook(() => useConversations())

      const messageData = {
        content: 'Nova mensagem',
        type: 'TEXT' as const,
      }

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: 'msg-new', ...messageData, direction: 'OUTBOUND', status: 'SENT' } }),
      } as Response)

      await result.current.sendMessage('conv-1', messageData)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/conversations/conv-1/messages',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(messageData),
        })
      )
    })

    it('returns null when sendMessage fails', async () => {
      const mockMutate = vi.fn()
      vi.mocked(useSWR).mockReturnValue({
        data: { success: true, data: mockConversations, meta: { pagination: { total: 2, limit: 20, offset: 0, hasMore: false } } },
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
        isValidating: false,
      } as any)

      const { result } = renderHook(() => useConversations())

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Erro ao enviar mensagem' }),
      } as Response)

      const messageData = {
        content: 'Tentativa',
        type: 'TEXT' as const,
      }

      const response = await result.current.sendMessage('conv-1', messageData)
      expect(response).toBeNull()
    })
  })

  describe('Stats', () => {
    it('fetches stats correctly', async () => {
      const mockStats = {
        period: '7d',
        totalCount: 50,
        activeCount: 45,
        expiredCount: 5,
        byStatus: { ACTIVE: 45, EXPIRED: 5, CLOSED: 0 },
        byType: { USER_INITIATED: 40, BUSINESS_INITIATED: 10 },
        withMessages: 48,
        totalMessages: 500,
        avgMessagesPerConversation: 10,
        engagementRate: 0.96,
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

      const { result } = renderHook(() => useConversations())
      const stats = await result.current.getStats('7d')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/conversations/stats')
      )
      expect(stats).toEqual(mockStats)
    })
  })
})

describe('useConversation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(mockOrganizationId)
  })

  it('fetches single conversation with messages', async () => {
    const mockData = {
      success: true,
      data: {
        ...mockConversations[0],
        messages: mockMessages,
      },
      meta: { pagination: { hasMore: false } },
    }

    vi.mocked(useSWR).mockReturnValue({
      data: mockData,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
      isValidating: false,
    } as any)

    const { result } = renderHook(() => useConversation('conv-1'))

    await waitFor(() => {
      expect(result.current.conversation).toEqual(mockData.data)
      expect(result.current.messages).toEqual(mockMessages)
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('returns null when id is empty', () => {
    vi.mocked(useSWR).mockReturnValue({
      data: null,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
      isValidating: false,
    } as any)

    const { result } = renderHook(() => useConversation(''))

    expect(result.current.conversation).toBeNull()
    expect(result.current.messages).toEqual([])
  })

  describe('sendMessage', () => {
    it('sends message with optimistic update', async () => {
      const mockMutate = vi.fn()
      const mockData = {
        success: true,
        data: {
          ...mockConversations[0],
          messages: mockMessages,
        },
        meta: { pagination: { hasMore: false } },
      }

      vi.mocked(useSWR).mockReturnValue({
        data: mockData,
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
        isValidating: false,
      } as any)

      const { result } = renderHook(() => useConversation('conv-1'))

      const messageData = {
        content: 'Mensagem otimista',
        type: 'TEXT' as const,
      }

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: 'msg-new', ...messageData, direction: 'OUTBOUND', status: 'SENT', createdAt: new Date().toISOString() } }),
      } as Response)

      await result.current.sendMessage(messageData)

      // Verificar optimistic update
      expect(mockMutate).toHaveBeenCalled()
    })

    it('returns null when send fails', async () => {
      const mockMutate = vi.fn()
      const mockData = {
        success: true,
        data: {
          ...mockConversations[0],
          messages: [],
        },
        meta: { pagination: { hasMore: false } },
      }

      vi.mocked(useSWR).mockReturnValue({
        data: mockData,
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
        isValidating: false,
      } as any)

      const { result } = renderHook(() => useConversation('conv-1'))

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Erro ao enviar mensagem' }),
      } as Response)

      const messageData = {
        content: 'Tentativa',
        type: 'TEXT' as const,
      }

      const response = await result.current.sendMessage(messageData)
      expect(response).toBeNull()
    })
  })

  describe('loadMoreMessages', () => {
    it('loads more messages', async () => {
      const mockMutate = vi.fn()
      const mockData = {
        success: true,
        data: {
          ...mockConversations[0],
          messages: mockMessages,
        },
        meta: { pagination: { hasMore: true } },
      }

      vi.mocked(useSWR).mockReturnValue({
        data: mockData,
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
        isValidating: false,
      } as any)

      const { result } = renderHook(() => useConversation('conv-1'))

      const moreMessages = [
        { id: 'msg-0', content: 'Mensagem anterior', direction: 'INBOUND', type: 'TEXT', status: 'READ', contactId: 'contact-1', conversationId: 'conv-1', createdAt: '2026-03-12T09:00:00Z' },
      ]

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: moreMessages, meta: { pagination: { hasMore: false } } }),
      } as Response)

      await result.current.loadMoreMessages(mockMessages[0].id)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/conversations/conv-1/messages')
      )
    })
  })
})
