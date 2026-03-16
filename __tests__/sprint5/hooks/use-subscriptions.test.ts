import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useSubscriptions } from '@/hooks/use-subscriptions'

describe('useSubscriptions', () => {
  const mockOrgId = 'org-123'

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  describe('Fetch', () => {
    it('should fetch subscriptions for organization on mount', async () => {
      const mockSubscriptions = [
        {
          id: 'sub-1',
          organizationId: mockOrgId,
          planId: 'plan-1',
          status: 'active',
          currentPeriodStart: '2026-03-01T00:00:00Z',
          currentPeriodEnd: '2026-04-01T00:00:00Z',
          createdAt: '2026-03-01T00:00:00Z',
          updatedAt: '2026-03-01T00:00:00Z',
          canceledAt: null,
          plan: {
            id: 'plan-1',
            name: 'Plano Básico',
            priceCents: 9900,
            interval: 'monthly',
            status: 'active',
          },
          invoices: [],
        },
      ]

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockSubscriptions }),
      } as Response)

      const { result } = renderHook(() => useSubscriptions(mockOrgId))

      await waitFor(() => {
        expect(result.current.subscriptions).toHaveLength(1)
      })

      expect(result.current.subscriptions[0].organizationId).toBe(mockOrgId)
      expect(result.current.subscriptions[0].plan.name).toBe('Plano Básico')
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle empty organizationId gracefully', async () => {
      // When no organizationId is provided, the hook uses the context which is mocked
      // This test verifies the hook works with the mocked context
      const mockSubscriptions = [
        {
          id: 'sub-1',
          organizationId: 'test-org-123',
          planId: 'plan-1',
          status: 'active',
          currentPeriodStart: '2026-03-01T00:00:00Z',
          currentPeriodEnd: '2026-04-01T00:00:00Z',
          createdAt: '2026-03-01T00:00:00Z',
          updatedAt: '2026-03-01T00:00:00Z',
          canceledAt: null,
          plan: { id: 'plan-1', name: 'Plano Básico', priceCents: 9900, interval: 'monthly', status: 'active' },
          invoices: [],
        },
      ]

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockSubscriptions }),
      } as Response)

      // No organizationId passed - should use context
      const { result } = renderHook(() => useSubscriptions())

      await waitFor(() => {
        expect(result.current.subscriptions).toHaveLength(1)
      })

      // Should fetch using context organizationId
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('organizationId=test-org-123')
      )
    })

    it('should handle fetch error', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: 'Erro ao carregar assinaturas' }),
      } as Response)

      const { result } = renderHook(() => useSubscriptions(mockOrgId))

      await waitFor(() => {
        expect(result.current.error).toBe('Erro ao carregar assinaturas')
      })

      expect(result.current.subscriptions).toEqual([])
    })

    it('should filter by status when provided', async () => {
      const mockSubscriptions = [
        {
          id: 'sub-1',
          organizationId: mockOrgId,
          planId: 'plan-1',
          status: 'canceled',
          currentPeriodStart: '2026-01-01T00:00:00Z',
          currentPeriodEnd: '2026-02-01T00:00:00Z',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
          canceledAt: '2026-01-15T00:00:00Z',
          plan: {
            id: 'plan-1',
            name: 'Plano Básico',
            priceCents: 9900,
            interval: 'monthly',
            status: 'active',
          },
          invoices: [],
        },
      ]

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockSubscriptions }),
      } as Response)

      renderHook(() => useSubscriptions(mockOrgId, { status: 'canceled' }))

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=canceled')
      )
    })

    it('should refetch subscriptions when called', async () => {
      const mockSubscriptions = [
        {
          id: 'sub-1',
          organizationId: mockOrgId,
          planId: 'plan-1',
          status: 'active',
          currentPeriodStart: '2026-03-01T00:00:00Z',
          currentPeriodEnd: '2026-04-01T00:00:00Z',
          createdAt: '2026-03-01T00:00:00Z',
          updatedAt: '2026-03-01T00:00:00Z',
          plan: {
            id: 'plan-1',
            name: 'Plano Básico',
            priceCents: 9900,
            interval: 'monthly',
          },
          invoices: [],
        },
      ]

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockSubscriptions }),
        } as Response)

      const { result } = renderHook(() => useSubscriptions(mockOrgId))

      await waitFor(() => {
        expect(result.current.subscriptions).toEqual([])
      })

      await result.current.refetch()

      await waitFor(() => {
        expect(result.current.subscriptions).toHaveLength(1)
      })
    })
  })

  describe('Create', () => {
    it('should create a new subscription successfully', async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              id: 'sub-new',
              organizationId: mockOrgId,
              planId: 'plan-1',
              status: 'active',
              currentPeriodStart: '2026-04-01T00:00:00Z',
              currentPeriodEnd: '2026-05-01T00:00:00Z',
              createdAt: '2026-04-01T00:00:00Z',
              updatedAt: '2026-04-01T00:00:00Z',
              plan: { id: 'plan-1', name: 'Plano Básico' },
            },
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [
              {
                id: 'sub-new',
                organizationId: mockOrgId,
                planId: 'plan-1',
                status: 'active',
                currentPeriodStart: '2026-04-01T00:00:00Z',
                currentPeriodEnd: '2026-05-01T00:00:00Z',
                plan: { id: 'plan-1', name: 'Plano Básico' },
              },
            ],
          }),
        } as Response)

      const { result } = renderHook(() => useSubscriptions(mockOrgId))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const created = await result.current.createSubscription({
        planId: 'plan-1',
        currentPeriodStart: '2026-04-01T00:00:00Z',
        currentPeriodEnd: '2026-05-01T00:00:00Z',
      })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/subscriptions',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: 'plan-1',
            currentPeriodStart: '2026-04-01T00:00:00Z',
            currentPeriodEnd: '2026-05-01T00:00:00Z',
            organizationId: mockOrgId,
          }),
        })
      )

      expect(created).not.toBeNull()
      expect(created?.planId).toBe('plan-1')
    })

    it('should not create subscription when organizationId is not provided', async () => {
      // Mock useOrganizationId to return null for this test
      vi.doMock('@/lib/contexts/organization-context', () => ({
        useOrganization: () => ({ organization: null, isLoading: false }),
        useOrganizationId: () => null,
        OrganizationProvider: ({ children }: { children: React.ReactNode }) => children,
      }))

      const { result } = renderHook(() => useSubscriptions())

      const created = await result.current.createSubscription({
        planId: 'plan-1',
        currentPeriodStart: '2026-04-01T00:00:00Z',
        currentPeriodEnd: '2026-05-01T00:00:00Z',
      })

      expect(created).toBeNull()
    })

    it('should handle create subscription error', async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ success: false, error: 'Plano não encontrado' }),
        } as Response)

      const { result } = renderHook(() => useSubscriptions(mockOrgId))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const created = await result.current.createSubscription({
        planId: 'invalid-plan',
        currentPeriodStart: '2026-04-01T00:00:00Z',
        currentPeriodEnd: '2026-05-01T00:00:00Z',
      })

      expect(created).toBeNull()
      await waitFor(() => {
        expect(result.current.error).toBe('Plano não encontrado')
      })
    })
  })

  describe('Update', () => {
    it('should update a subscription successfully', async () => {
      const mockSubscription = {
        id: 'sub-1',
        organizationId: mockOrgId,
        planId: 'plan-1',
        status: 'active',
        currentPeriodStart: '2026-03-01T00:00:00Z',
        currentPeriodEnd: '2026-04-01T00:00:00Z',
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
        plan: { id: 'plan-1', name: 'Plano Básico' },
        invoices: [],
      }

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [mockSubscription] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { ...mockSubscription, status: 'past_due' },
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [{ ...mockSubscription, status: 'past_due' }],
          }),
        } as Response)

      const { result } = renderHook(() => useSubscriptions(mockOrgId))

      await waitFor(() => {
        expect(result.current.subscriptions).toHaveLength(1)
      })

      const updated = await result.current.updateSubscription('sub-1', { status: 'past_due' })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/subscriptions/id'),
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'past_due' }),
        })
      )

      expect(updated?.status).toBe('past_due')
    })

    it('should handle update error', async () => {
      const mockSubscription = {
        id: 'sub-1',
        organizationId: mockOrgId,
        planId: 'plan-1',
        status: 'active',
        currentPeriodStart: '2026-03-01T00:00:00Z',
        currentPeriodEnd: '2026-04-01T00:00:00Z',
        plan: { id: 'plan-1', name: 'Plano Básico' },
        invoices: [],
      }

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [mockSubscription] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ success: false, error: 'Assinatura não encontrada' }),
        } as Response)

      const { result } = renderHook(() => useSubscriptions(mockOrgId))

      await waitFor(() => {
        expect(result.current.subscriptions).toHaveLength(1)
      })

      const updated = await result.current.updateSubscription('sub-1', { status: 'canceled' })

      expect(updated).toBeNull()
      await waitFor(() => {
        expect(result.current.error).toBe('Assinatura não encontrada')
      })
    })
  })

  describe('Cancel', () => {
    it('should cancel a subscription successfully', async () => {
      const mockSubscription = {
        id: 'sub-1',
        organizationId: mockOrgId,
        planId: 'plan-1',
        status: 'active',
        currentPeriodStart: '2026-03-01T00:00:00Z',
        currentPeriodEnd: '2026-04-01T00:00:00Z',
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
        plan: { id: 'plan-1', name: 'Plano Básico' },
        invoices: [],
      }

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [mockSubscription] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { ...mockSubscription, status: 'canceled', canceledAt: '2026-03-15T00:00:00Z' },
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [{ ...mockSubscription, status: 'canceled', canceledAt: '2026-03-15T00:00:00Z' }],
          }),
        } as Response)

      const { result } = renderHook(() => useSubscriptions(mockOrgId))

      await waitFor(() => {
        expect(result.current.subscriptions).toHaveLength(1)
      })

      const canceled = await result.current.cancelSubscription('sub-1')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/subscriptions/id'),
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('canceled'),
        })
      )

      expect(canceled).toBe(true)
    })

    it('should handle cancel error', async () => {
      const mockSubscription = {
        id: 'sub-1',
        organizationId: mockOrgId,
        planId: 'plan-1',
        status: 'active',
        currentPeriodStart: '2026-03-01T00:00:00Z',
        currentPeriodEnd: '2026-04-01T00:00:00Z',
        plan: { id: 'plan-1', name: 'Plano Básico' },
        invoices: [],
      }

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [mockSubscription] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ success: false, error: 'Erro ao cancelar assinatura' }),
        } as Response)

      const { result } = renderHook(() => useSubscriptions(mockOrgId))

      await waitFor(() => {
        expect(result.current.subscriptions).toHaveLength(1)
      })

      const canceled = await result.current.cancelSubscription('sub-1')

      expect(canceled).toBe(false)
      await waitFor(() => {
        expect(result.current.error).toBe('Erro ao cancelar assinatura')
      })
    })
  })
})
