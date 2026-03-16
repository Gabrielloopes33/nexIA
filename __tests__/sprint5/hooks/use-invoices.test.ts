import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useInvoices } from '@/hooks/use-invoices'

describe('useInvoices', () => {
  const mockOrgId = 'org-123'

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  describe('Fetch', () => {
    it('should fetch invoices for organization on mount', async () => {
      const mockInvoices = [
        {
          id: 'inv-1',
          subscriptionId: 'sub-1',
          organizationId: mockOrgId,
          amountCents: 9900,
          status: 'pending',
          dueDate: '2026-03-15T00:00:00Z',
          paidAt: null,
          invoiceUrl: null,
          stripeInvoiceId: null,
          createdAt: '2026-03-01T00:00:00Z',
          updatedAt: '2026-03-01T00:00:00Z',
          subscription: {
            id: 'sub-1',
            plan: {
              id: 'plan-1',
              name: 'Plano Básico',
            },
          },
          charges: [],
        },
        {
          id: 'inv-2',
          subscriptionId: 'sub-1',
          organizationId: mockOrgId,
          amountCents: 9900,
          status: 'paid',
          dueDate: '2026-02-15T00:00:00Z',
          paidAt: '2026-02-14T00:00:00Z',
          invoiceUrl: 'https://invoice.url/2',
          stripeInvoiceId: 'in_stripe_2',
          createdAt: '2026-02-01T00:00:00Z',
          updatedAt: '2026-02-14T00:00:00Z',
          subscription: {
            id: 'sub-1',
            plan: {
              id: 'plan-1',
              name: 'Plano Básico',
            },
          },
          charges: [
            {
              id: 'charge-1',
              amountCents: 9900,
              status: 'paid',
              paidAt: '2026-02-14T00:00:00Z',
              paymentMethod: 'credit_card',
            },
          ],
        },
      ]

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockInvoices }),
      } as Response)

      const { result } = renderHook(() => useInvoices(mockOrgId))

      await waitFor(() => {
        expect(result.current.invoices).toHaveLength(2)
      })

      expect(result.current.invoices[0].organizationId).toBe(mockOrgId)
      expect(result.current.invoices[0].subscription.plan.name).toBe('Plano Básico')
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle empty organizationId gracefully', async () => {
      // When no organizationId is provided, the hook uses the context which is mocked
      // This test verifies the hook works with the mocked context
      const mockInvoices = [
        {
          id: 'inv-1',
          subscriptionId: 'sub-1',
          organizationId: 'test-org-123',
          amountCents: 9900,
          status: 'pending',
          dueDate: '2026-03-15T00:00:00Z',
          paidAt: null,
          subscription: {
            id: 'sub-1',
            plan: { id: 'plan-1', name: 'Plano Básico' },
          },
          charges: [],
        },
      ]

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockInvoices }),
      } as Response)

      // No organizationId passed - should use context
      const { result } = renderHook(() => useInvoices())

      await waitFor(() => {
        expect(result.current.invoices).toHaveLength(1)
      })

      // Should fetch using context organizationId
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('organizationId=test-org-123')
      )
    })

    it('should handle fetch error', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: 'Erro ao carregar faturas' }),
      } as Response)

      const { result } = renderHook(() => useInvoices(mockOrgId))

      await waitFor(() => {
        expect(result.current.error).toBe('Erro ao carregar faturas')
      })

      expect(result.current.invoices).toEqual([])
    })

    it('should filter by status when provided', async () => {
      const mockInvoices = [
        {
          id: 'inv-1',
          subscriptionId: 'sub-1',
          organizationId: mockOrgId,
          amountCents: 9900,
          status: 'pending',
          dueDate: '2026-03-15T00:00:00Z',
          paidAt: null,
          invoiceUrl: null,
          stripeInvoiceId: null,
          createdAt: '2026-03-01T00:00:00Z',
          updatedAt: '2026-03-01T00:00:00Z',
          subscription: {
            id: 'sub-1',
            plan: { id: 'plan-1', name: 'Plano Básico' },
          },
          charges: [],
        },
      ]

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockInvoices }),
      } as Response)

      renderHook(() => useInvoices(mockOrgId, { status: 'pending' }))

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=pending')
      )
    })

    it('should refetch invoices when called', async () => {
      const mockInvoices = [
        {
          id: 'inv-1',
          subscriptionId: 'sub-1',
          organizationId: mockOrgId,
          amountCents: 9900,
          status: 'pending',
          dueDate: '2026-03-15T00:00:00Z',
          paidAt: null,
          subscription: {
            id: 'sub-1',
            plan: { id: 'plan-1', name: 'Plano Básico' },
          },
          charges: [],
        },
      ]

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockInvoices }),
        } as Response)

      const { result } = renderHook(() => useInvoices(mockOrgId))

      await waitFor(() => {
        expect(result.current.invoices).toEqual([])
      })

      await result.current.refetch()

      await waitFor(() => {
        expect(result.current.invoices).toHaveLength(1)
      })
    })
  })

  describe('Create', () => {
    it('should create a new invoice successfully', async () => {
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
              id: 'inv-new',
              subscriptionId: 'sub-1',
              organizationId: mockOrgId,
              amountCents: 9900,
              status: 'pending',
              dueDate: '2026-04-15T00:00:00Z',
              paidAt: null,
              createdAt: '2026-04-01T00:00:00Z',
              updatedAt: '2026-04-01T00:00:00Z',
              subscription: {
                id: 'sub-1',
                plan: { id: 'plan-1', name: 'Plano Básico' },
              },
              charges: [],
            },
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [
              {
                id: 'inv-new',
                subscriptionId: 'sub-1',
                organizationId: mockOrgId,
                amountCents: 9900,
                status: 'pending',
                dueDate: '2026-04-15T00:00:00Z',
                subscription: {
                  id: 'sub-1',
                  plan: { id: 'plan-1', name: 'Plano Básico' },
                },
                charges: [],
              },
            ],
          }),
        } as Response)

      const { result } = renderHook(() => useInvoices(mockOrgId))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const created = await result.current.createInvoice({
        subscriptionId: 'sub-1',
        amountCents: 9900,
        dueDate: '2026-04-15T00:00:00Z',
      })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/invoices',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscriptionId: 'sub-1',
            amountCents: 9900,
            dueDate: '2026-04-15T00:00:00Z',
            organizationId: mockOrgId,
          }),
        })
      )

      expect(created).not.toBeNull()
      expect(created?.subscriptionId).toBe('sub-1')
    })

    it('should not create invoice when organizationId is not provided', async () => {
      // Mock useOrganizationId to return null for this test
      vi.doMock('@/lib/contexts/organization-context', () => ({
        useOrganization: () => ({ organization: null, isLoading: false }),
        useOrganizationId: () => null,
        OrganizationProvider: ({ children }: { children: React.ReactNode }) => children,
      }))

      const { result } = renderHook(() => useInvoices())

      const created = await result.current.createInvoice({
        subscriptionId: 'sub-1',
        amountCents: 9900,
        dueDate: '2026-04-15T00:00:00Z',
      })

      expect(created).toBeNull()
    })

    it('should handle create invoice error', async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ success: false, error: 'Assinatura não encontrada' }),
        } as Response)

      const { result } = renderHook(() => useInvoices(mockOrgId))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const created = await result.current.createInvoice({
        subscriptionId: 'invalid-sub',
        amountCents: 9900,
        dueDate: '2026-04-15T00:00:00Z',
      })

      expect(created).toBeNull()
      await waitFor(() => {
        expect(result.current.error).toBe('Assinatura não encontrada')
      })
    })
  })

  describe('Update', () => {
    it('should update an invoice successfully', async () => {
      const mockInvoice = {
        id: 'inv-1',
        subscriptionId: 'sub-1',
        organizationId: mockOrgId,
        amountCents: 9900,
        status: 'pending',
        dueDate: '2026-03-15T00:00:00Z',
        paidAt: null,
        subscription: {
          id: 'sub-1',
          plan: { id: 'plan-1', name: 'Plano Básico' },
        },
        charges: [],
      }

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [mockInvoice] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { ...mockInvoice, dueDate: '2026-03-20T00:00:00Z' },
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [{ ...mockInvoice, dueDate: '2026-03-20T00:00:00Z' }],
          }),
        } as Response)

      const { result } = renderHook(() => useInvoices(mockOrgId))

      await waitFor(() => {
        expect(result.current.invoices).toHaveLength(1)
      })

      const updated = await result.current.updateInvoice('inv-1', { dueDate: '2026-03-20T00:00:00Z' })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/invoices/id'),
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dueDate: '2026-03-20T00:00:00Z' }),
        })
      )

      expect(updated?.dueDate).toBe('2026-03-20T00:00:00Z')
    })

    it('should handle update error', async () => {
      const mockInvoice = {
        id: 'inv-1',
        subscriptionId: 'sub-1',
        organizationId: mockOrgId,
        amountCents: 9900,
        status: 'pending',
        dueDate: '2026-03-15T00:00:00Z',
        paidAt: null,
        subscription: {
          id: 'sub-1',
          plan: { id: 'plan-1', name: 'Plano Básico' },
        },
        charges: [],
      }

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [mockInvoice] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ success: false, error: 'Fatura não encontrada' }),
        } as Response)

      const { result } = renderHook(() => useInvoices(mockOrgId))

      await waitFor(() => {
        expect(result.current.invoices).toHaveLength(1)
      })

      const updated = await result.current.updateInvoice('inv-1', { amountCents: 19900 })

      expect(updated).toBeNull()
      await waitFor(() => {
        expect(result.current.error).toBe('Fatura não encontrada')
      })
    })
  })

  describe('Mark as Paid', () => {
    it('should mark invoice as paid successfully', async () => {
      const mockInvoice = {
        id: 'inv-1',
        subscriptionId: 'sub-1',
        organizationId: mockOrgId,
        amountCents: 9900,
        status: 'pending',
        dueDate: '2026-03-15T00:00:00Z',
        paidAt: null,
        subscription: {
          id: 'sub-1',
          plan: { id: 'plan-1', name: 'Plano Básico' },
        },
        charges: [],
      }

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [mockInvoice] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { ...mockInvoice, status: 'paid', paidAt: '2026-03-10T00:00:00Z' },
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [{ ...mockInvoice, status: 'paid', paidAt: '2026-03-10T00:00:00Z' }],
          }),
        } as Response)

      const { result } = renderHook(() => useInvoices(mockOrgId))

      await waitFor(() => {
        expect(result.current.invoices).toHaveLength(1)
      })

      const marked = await result.current.markAsPaid('inv-1', '2026-03-10T00:00:00Z')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/invoices/id'),
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('paid'),
        })
      )

      expect(marked).toBe(true)
    })

    it('should mark as paid with current date when not provided', async () => {
      const mockInvoice = {
        id: 'inv-1',
        subscriptionId: 'sub-1',
        organizationId: mockOrgId,
        amountCents: 9900,
        status: 'pending',
        dueDate: '2026-03-15T00:00:00Z',
        paidAt: null,
        subscription: {
          id: 'sub-1',
          plan: { id: 'plan-1', name: 'Plano Básico' },
        },
        charges: [],
      }

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [mockInvoice] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { ...mockInvoice, status: 'paid', paidAt: new Date().toISOString() },
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [{ ...mockInvoice, status: 'paid', paidAt: new Date().toISOString() }],
          }),
        } as Response)

      const { result } = renderHook(() => useInvoices(mockOrgId))

      await waitFor(() => {
        expect(result.current.invoices).toHaveLength(1)
      })

      await result.current.markAsPaid('inv-1')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/invoices/id'),
        expect.objectContaining({
          body: expect.stringContaining('paid'),
        })
      )
    })

    it('should handle mark as paid error', async () => {
      const mockInvoice = {
        id: 'inv-1',
        subscriptionId: 'sub-1',
        organizationId: mockOrgId,
        amountCents: 9900,
        status: 'pending',
        dueDate: '2026-03-15T00:00:00Z',
        paidAt: null,
        subscription: {
          id: 'sub-1',
          plan: { id: 'plan-1', name: 'Plano Básico' },
        },
        charges: [],
      }

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [mockInvoice] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ success: false, error: 'Erro ao marcar fatura como paga' }),
        } as Response)

      const { result } = renderHook(() => useInvoices(mockOrgId))

      await waitFor(() => {
        expect(result.current.invoices).toHaveLength(1)
      })

      const marked = await result.current.markAsPaid('inv-1')

      expect(marked).toBe(false)
      await waitFor(() => {
        expect(result.current.error).toBe('Erro ao marcar fatura como paga')
      })
    })
  })
})
