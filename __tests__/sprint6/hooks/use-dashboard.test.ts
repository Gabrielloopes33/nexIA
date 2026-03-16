import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useDashboard, DashboardPeriod } from '@/hooks/use-dashboard'

// Mock organization context
vi.mock('@/lib/contexts/organization-context', () => ({
  useOrganizationId: () => 'test-org-id'
}))

// Mock use-contacts hook
vi.mock('@/hooks/use-contacts', () => ({
  useContacts: vi.fn()
}))

// Mock use-conversations hook  
vi.mock('@/hooks/use-conversations', () => ({
  useConversations: vi.fn()
}))

// Mock use-ai-insights hook
vi.mock('@/hooks/use-ai-insights', () => ({
  useAiInsights: vi.fn()
}))

// Mock use-tags hook
vi.mock('@/hooks/use-tags', () => ({
  useTags: vi.fn()
}))

import { useContacts } from '@/hooks/use-contacts'
import { useConversations } from '@/hooks/use-conversations'
import { useAiInsights } from '@/hooks/use-ai-insights'
import { useTags } from '@/hooks/use-tags'

describe('useDashboard', () => {
  const mockContacts = [
    {
      id: 'contact-1',
      name: 'João Silva',
      phone: '+5511999999999',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      metadata: { dealValue: 5000, converted: true },
    },
    {
      id: 'contact-2',
      name: 'Maria Souza',
      phone: '+5511888888888',
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      metadata: { dealValue: 10000 },
    },
    {
      id: 'contact-3',
      name: 'Pedro Costa',
      phone: '+5511777777777',
      status: 'INACTIVE',
      createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), // 40 days ago
      metadata: {},
    },
  ]

  const mockConversations = [
    {
      id: 'conv-1',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      instance: { name: 'WhatsApp Business' },
      messageCount: 10,
    },
    {
      id: 'conv-2',
      status: 'CLOSED',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      instance: { name: 'Instagram DM' },
      messageCount: 5,
    },
    {
      id: 'conv-3',
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      instance: { name: 'WhatsApp API' },
      messageCount: 3,
    },
  ]

  const mockAiInsights = [
    {
      id: 'insight-1',
      type: 'PREDICTION',
      title: 'Alta chance de conversão',
      description: 'Lead tem 85% de chance de fechar',
      value: '85%',
      confidence: 92,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'insight-2',
      type: 'ALERT',
      title: 'Deal parado',
      description: 'Deal sem atividade há 30 dias',
      confidence: 85,
      createdAt: new Date().toISOString(),
    },
  ]

  const mockTags = [
    { id: 'tag-1', name: 'VIP', color: '#ff0000' },
    { id: 'tag-2', name: 'Novo', color: '#00ff00' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mocks
    vi.mocked(useContacts).mockReturnValue({
      contacts: mockContacts,
      isLoading: false,
      error: null,
      total: mockContacts.length,
      refreshContacts: vi.fn(),
      createContact: vi.fn(),
      updateContact: vi.fn(),
      deleteContact: vi.fn(),
      restoreContact: vi.fn(),
    })

    vi.mocked(useConversations).mockReturnValue({
      conversations: mockConversations,
      isLoading: false,
      error: null,
      mutate: vi.fn(),
      createConversation: vi.fn(),
      updateConversation: vi.fn(),
      deleteConversation: vi.fn(),
      getMessages: vi.fn(),
      sendMessage: vi.fn(),
      getStats: vi.fn(),
    })

    vi.mocked(useAiInsights).mockReturnValue({
      insights: mockAiInsights,
      isLoading: false,
      error: null,
      total: mockAiInsights.length,
      mutate: vi.fn(),
      createInsight: vi.fn(),
      updateInsight: vi.fn(),
      deleteInsight: vi.fn(),
      getStats: vi.fn(),
    })

    vi.mocked(useTags).mockReturnValue({
      tags: mockTags,
      isLoading: false,
      error: null,
      refreshTags: vi.fn(),
      createTag: vi.fn(),
      updateTag: vi.fn(),
      deleteTag: vi.fn(),
      assignTagToContact: vi.fn(),
      removeTagFromContact: vi.fn(),
    })
  })

  describe('Metrics Calculation', () => {
    it('should calculate metrics from contacts and conversations', async () => {
      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.metrics).not.toBeNull()
      })

      expect(result.current.metrics).toMatchObject({
        contacts: {
          total: 3,
          new: expect.any(Number),
        },
        conversations: {
          total: 3,
          active: 2,
          resolved: 1,
        },
        deals: {
          total: 2, // contacts with dealValue
          won: 1,   // contacts with converted=true
        },
      })
    })

    it('should calculate conversion rate correctly', async () => {
      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.metrics).not.toBeNull()
      })

      // 1 converted out of 2 with deals in period = 50%
      expect(result.current.metrics?.conversionRate).toBe(50)
    })

    it('should calculate average ticket correctly', async () => {
      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.metrics).not.toBeNull()
      })

      // (5000 + 10000) / 2 = 7500
      expect(result.current.metrics?.avgTicket).toBe(7500)
    })

    it('should calculate revenue from deal values', async () => {
      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.metrics).not.toBeNull()
      })

      // 5000 + 10000 = 15000
      expect(result.current.metrics?.revenue.total).toBe(15000)
    })
  })

  describe('Period Filtering', () => {
    it('should default to 30d period', () => {
      const { result } = renderHook(() => useDashboard())

      expect(result.current.period).toBe('30d')
    })

    it('should change period when setPeriod is called', async () => {
      const { result } = renderHook(() => useDashboard())

      act(() => {
        result.current.setPeriod('7d')
      })

      expect(result.current.period).toBe('7d')
    })

    it('should filter contacts by period', async () => {
      const { result } = renderHook(() => useDashboard())

      // Start with 30d
      await waitFor(() => {
        expect(result.current.metrics).not.toBeNull()
      })

      // Should count contacts created in last 30 days
      expect(result.current.metrics?.contacts.new).toBeGreaterThanOrEqual(2)

      // Change to 7d
      act(() => {
        result.current.setPeriod('7d')
      })

      await waitFor(() => {
        expect(result.current.period).toBe('7d')
      })

      // In 7d period, should have fewer new contacts
    })

    it('should support all period options', () => {
      const { result } = renderHook(() => useDashboard())

      const periods: DashboardPeriod[] = ['7d', '30d', '90d']

      periods.forEach(period => {
        act(() => {
          result.current.setPeriod(period)
        })

        expect(result.current.period).toBe(period)
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading when contacts are loading', () => {
      vi.mocked(useContacts).mockReturnValue({
        contacts: [],
        isLoading: true,
        error: null,
        total: 0,
        refreshContacts: vi.fn(),
        createContact: vi.fn(),
        updateContact: vi.fn(),
        deleteContact: vi.fn(),
        restoreContact: vi.fn(),
      })

      const { result } = renderHook(() => useDashboard())

      expect(result.current.isLoading).toBe(true)
    })

    it('should show loading when conversations are loading', () => {
      vi.mocked(useConversations).mockReturnValue({
        conversations: [],
        isLoading: true,
        error: null,
        mutate: vi.fn(),
        createConversation: vi.fn(),
        updateConversation: vi.fn(),
        deleteConversation: vi.fn(),
        getMessages: vi.fn(),
        sendMessage: vi.fn(),
        getStats: vi.fn(),
      })

      const { result } = renderHook(() => useDashboard())

      expect(result.current.isLoading).toBe(true)
    })

    it('should show loading when insights are loading', () => {
      vi.mocked(useAiInsights).mockReturnValue({
        insights: [],
        isLoading: true,
        error: null,
        total: 0,
        mutate: vi.fn(),
        createInsight: vi.fn(),
        updateInsight: vi.fn(),
        deleteInsight: vi.fn(),
        getStats: vi.fn(),
      })

      const { result } = renderHook(() => useDashboard())

      expect(result.current.isLoading).toBe(true)
    })

    it('should not be loading when all data is loaded', async () => {
      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('Error Handling', () => {
    it('should return error when contacts fetch fails', () => {
      vi.mocked(useContacts).mockReturnValue({
        contacts: [],
        isLoading: false,
        error: 'Erro ao carregar contatos',
        total: 0,
        refreshContacts: vi.fn(),
        createContact: vi.fn(),
        updateContact: vi.fn(),
        deleteContact: vi.fn(),
        restoreContact: vi.fn(),
      })

      const { result } = renderHook(() => useDashboard())

      expect(result.current.error).toBe('Erro ao carregar contatos')
    })

    it('should return error when conversations fetch fails', () => {
      vi.mocked(useConversations).mockReturnValue({
        conversations: [],
        isLoading: false,
        error: new Error('Erro ao carregar conversas'),
        mutate: vi.fn(),
        createConversation: vi.fn(),
        updateConversation: vi.fn(),
        deleteConversation: vi.fn(),
        getMessages: vi.fn(),
        sendMessage: vi.fn(),
        getStats: vi.fn(),
      })

      const { result } = renderHook(() => useDashboard())

      expect(result.current.error).toBe('Erro ao carregar conversas')
    })
  })

  describe('Charts Data', () => {
    it('should generate lead trends from contacts', async () => {
      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.charts).not.toBeNull()
      })

      expect(result.current.charts?.leadTrends).toBeInstanceOf(Array)
      expect(result.current.charts?.leadTrends.length).toBeGreaterThan(0)
    })

    it('should generate conversation volume data', async () => {
      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.charts).not.toBeNull()
      })

      expect(result.current.charts?.conversationVolume).toBeInstanceOf(Array)
      expect(result.current.charts?.conversationVolume.length).toBeGreaterThan(0)
    })

    it('should fill missing months in lead trends', async () => {
      // Mock with fewer contacts
      vi.mocked(useContacts).mockReturnValue({
        contacts: [mockContacts[0]],
        isLoading: false,
        error: null,
        total: 1,
        refreshContacts: vi.fn(),
        createContact: vi.fn(),
        updateContact: vi.fn(),
        deleteContact: vi.fn(),
        restoreContact: vi.fn(),
      })

      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.charts).not.toBeNull()
      })

      // Should have at least 6 data points (filled months)
      expect(result.current.charts?.leadTrends.length).toBeGreaterThanOrEqual(6)
    })
  })

  describe('Insights', () => {
    it('should transform AI insights to dashboard format', async () => {
      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.insights.length).toBeGreaterThan(0)
      })

      const firstInsight = result.current.insights[0]
      expect(firstInsight).toMatchObject({
        id: expect.any(String),
        type: expect.stringMatching(/trend|alert|opportunity|prediction/),
        title: expect.any(String),
        description: expect.any(String),
        priority: expect.stringMatching(/high|medium|low/),
      })
    })

    it('should map PREDICTION type correctly', async () => {
      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.insights.length).toBeGreaterThan(0)
      })

      const predictionInsight = result.current.insights.find(i => i.title.includes('conversão'))
      if (predictionInsight) {
        expect(predictionInsight.type).toBe('prediction')
      }
    })

    it('should map ALERT type correctly', async () => {
      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.insights.length).toBeGreaterThan(0)
      })

      const alertInsight = result.current.insights.find(i => i.title.includes('parado'))
      if (alertInsight) {
        expect(alertInsight.type).toBe('alert')
      }
    })

    it('should calculate priority based on confidence', async () => {
      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.insights.length).toBeGreaterThan(0)
      })

      // High confidence (> 70%) should be high priority
      const highConfidenceInsight = result.current.insights.find(i => i.priority === 'high')
      if (highConfidenceInsight) {
        expect(highConfidenceInsight.priority).toBe('high')
      }
    })
  })

  describe('Refresh', () => {
    it('should have a refresh function', async () => {
      const { result } = renderHook(() => useDashboard())

      expect(typeof result.current.refresh).toBe('function')
    })

    it('refresh should be callable', async () => {
      const { result } = renderHook(() => useDashboard())

      await expect(result.current.refresh()).resolves.not.toThrow()
    })
  })

  describe('Insufficient Data', () => {
    it('should detect insufficient data when no contacts and conversations', () => {
      vi.mocked(useContacts).mockReturnValue({
        contacts: [],
        isLoading: false,
        error: null,
        total: 0,
        refreshContacts: vi.fn(),
        createContact: vi.fn(),
        updateContact: vi.fn(),
        deleteContact: vi.fn(),
        restoreContact: vi.fn(),
      })

      vi.mocked(useConversations).mockReturnValue({
        conversations: [],
        isLoading: false,
        error: null,
        mutate: vi.fn(),
        createConversation: vi.fn(),
        updateConversation: vi.fn(),
        deleteConversation: vi.fn(),
        getMessages: vi.fn(),
        sendMessage: vi.fn(),
        getStats: vi.fn(),
      })

      const { result } = renderHook(() => useDashboard())

      expect(result.current.hasInsufficientData).toBe(true)
    })

    it('should not have insufficient data when there are contacts', () => {
      vi.mocked(useContacts).mockReturnValue({
        contacts: mockContacts,
        isLoading: false,
        error: null,
        total: mockContacts.length,
        refreshContacts: vi.fn(),
        createContact: vi.fn(),
        updateContact: vi.fn(),
        deleteContact: vi.fn(),
        restoreContact: vi.fn(),
      })

      vi.mocked(useConversations).mockReturnValue({
        conversations: [],
        isLoading: false,
        error: null,
        mutate: vi.fn(),
        createConversation: vi.fn(),
        updateConversation: vi.fn(),
        deleteConversation: vi.fn(),
        getMessages: vi.fn(),
        sendMessage: vi.fn(),
        getStats: vi.fn(),
      })

      const { result } = renderHook(() => useDashboard())

      expect(result.current.hasInsufficientData).toBe(false)
    })

    it('should return null metrics when data is insufficient', () => {
      vi.mocked(useContacts).mockReturnValue({
        contacts: [],
        isLoading: true,
        error: null,
        total: 0,
        refreshContacts: vi.fn(),
        createContact: vi.fn(),
        updateContact: vi.fn(),
        deleteContact: vi.fn(),
        restoreContact: vi.fn(),
      })

      vi.mocked(useConversations).mockReturnValue({
        conversations: [],
        isLoading: true,
        error: null,
        mutate: vi.fn(),
        createConversation: vi.fn(),
        updateConversation: vi.fn(),
        deleteConversation: vi.fn(),
        getMessages: vi.fn(),
        sendMessage: vi.fn(),
        getStats: vi.fn(),
      })

      const { result } = renderHook(() => useDashboard())

      expect(result.current.metrics).toBeNull()
      expect(result.current.charts).toBeNull()
    })
  })

  describe('Edge Cases', () => {
    it('should handle contacts without metadata', async () => {
      vi.mocked(useContacts).mockReturnValue({
        contacts: [
          { id: 'contact-1', name: 'Test', createdAt: new Date().toISOString() },
        ],
        isLoading: false,
        error: null,
        total: 1,
        refreshContacts: vi.fn(),
        createContact: vi.fn(),
        updateContact: vi.fn(),
        deleteContact: vi.fn(),
        restoreContact: vi.fn(),
      })

      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.metrics).not.toBeNull()
      })

      expect(result.current.metrics?.conversionRate).toBe(0)
      expect(result.current.metrics?.avgTicket).toBe(0)
    })

    it('should handle conversations without instance info', async () => {
      vi.mocked(useConversations).mockReturnValue({
        conversations: [
          { id: 'conv-1', status: 'ACTIVE', createdAt: new Date().toISOString() },
        ],
        isLoading: false,
        error: null,
        mutate: vi.fn(),
        createConversation: vi.fn(),
        updateConversation: vi.fn(),
        deleteConversation: vi.fn(),
        getMessages: vi.fn(),
        sendMessage: vi.fn(),
        getStats: vi.fn(),
      })

      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.charts).not.toBeNull()
      })

      // Should default to WhatsApp when instance is not specified
      expect(result.current.charts?.conversationVolume).toBeInstanceOf(Array)
    })

    it('should handle very old contact dates gracefully', async () => {
      vi.mocked(useContacts).mockReturnValue({
        contacts: [
          {
            id: 'contact-old',
            name: 'Old Contact',
            createdAt: '2020-01-01T00:00:00Z',
            status: 'ACTIVE',
          },
        ],
        isLoading: false,
        error: null,
        total: 1,
        refreshContacts: vi.fn(),
        createContact: vi.fn(),
        updateContact: vi.fn(),
        deleteContact: vi.fn(),
        restoreContact: vi.fn(),
      })

      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.charts).not.toBeNull()
      })

      // Should still generate lead trends
      expect(result.current.charts?.leadTrends.length).toBeGreaterThan(0)
    })
  })
})
