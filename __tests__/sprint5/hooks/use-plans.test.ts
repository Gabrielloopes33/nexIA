import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { usePlans } from '@/hooks/use-plans'

describe('usePlans', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  describe('Fetch', () => {
    it('should fetch plans on mount', async () => {
      const mockPlans = [
        {
          id: 'plan-1',
          name: 'Plano Básico',
          description: 'Plano básico mensal',
          priceCents: 9900,
          interval: 'monthly',
          features: { contacts: 100 },
          limits: { users: 1 },
          status: 'active',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
        {
          id: 'plan-2',
          name: 'Plano Pro',
          description: 'Plano profissional',
          priceCents: 19900,
          interval: 'monthly',
          features: { contacts: 1000 },
          limits: { users: 5 },
          status: 'active',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ]

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockPlans }),
      } as Response)

      const { result } = renderHook(() => usePlans())

      await waitFor(() => {
        expect(result.current.plans).toHaveLength(2)
      })

      expect(result.current.plans[0].name).toBe('Plano Básico')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle fetch error', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: 'Erro ao carregar planos' }),
      } as Response)

      const { result } = renderHook(() => usePlans())

      await waitFor(() => {
        expect(result.current.error).toBe('Erro ao carregar planos')
      })

      expect(result.current.plans).toEqual([])
      expect(result.current.isLoading).toBe(false)
    })

    it('should show loading state while fetching', async () => {
      vi.mocked(global.fetch).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      )

      const { result } = renderHook(() => usePlans())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.plans).toEqual([])
    })

    it('should apply status filter correctly', async () => {
      const mockPlans = [
        {
          id: 'plan-1',
          name: 'Plano Básico',
          priceCents: 9900,
          interval: 'monthly',
          status: 'active',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ]

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockPlans }),
      } as Response)

      renderHook(() => usePlans({ status: 'active' }))

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/plans?status=active')
      )
    })

    it('should refetch plans when called', async () => {
      const mockPlans = [
        {
          id: 'plan-1',
          name: 'Plano Básico',
          priceCents: 9900,
          interval: 'monthly',
          status: 'active',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ]

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPlans }),
        } as Response)

      const { result } = renderHook(() => usePlans())

      await waitFor(() => {
        expect(result.current.plans).toEqual([])
      })

      await result.current.refetch()

      await waitFor(() => {
        expect(result.current.plans).toHaveLength(1)
      })
    })
  })

  describe('Create', () => {
    it('should create a new plan successfully', async () => {
      const mockPlans = []
      const newPlan = {
        id: 'plan-new',
        name: 'Novo Plano',
        priceCents: 29900,
        interval: 'monthly',
        status: 'active',
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
      }

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPlans }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: newPlan }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [newPlan] }),
        } as Response)

      const { result } = renderHook(() => usePlans())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const created = await result.current.createPlan({
        name: 'Novo Plano',
        priceCents: 29900,
        interval: 'monthly',
      })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/plans',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Novo Plano',
            priceCents: 29900,
            interval: 'monthly',
          }),
        })
      )

      expect(created).not.toBeNull()
      expect(created?.name).toBe('Novo Plano')
    })

    it('should handle create plan error', async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ success: false, error: 'Nome já existe' }),
        } as Response)

      const { result } = renderHook(() => usePlans())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const created = await result.current.createPlan({
        name: 'Plano Existente',
        priceCents: 9900,
        interval: 'monthly',
      })

      expect(created).toBeNull()
      await waitFor(() => {
        expect(result.current.error).toBe('Nome já existe')
      })
    })

    it('should create plan with optional fields', async () => {
      const newPlan = {
        id: 'plan-new',
        name: 'Plano Completo',
        description: 'Descrição do plano',
        priceCents: 49900,
        interval: 'yearly',
        features: { contacts: 10000 },
        limits: { users: 20 },
        status: 'active',
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
      }

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: newPlan }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [newPlan] }),
        } as Response)

      const { result } = renderHook(() => usePlans())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.createPlan({
        name: 'Plano Completo',
        description: 'Descrição do plano',
        priceCents: 49900,
        interval: 'yearly',
        features: { contacts: 10000 },
        limits: { users: 20 },
      })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/plans',
        expect.objectContaining({
          body: JSON.stringify({
            name: 'Plano Completo',
            description: 'Descrição do plano',
            priceCents: 49900,
            interval: 'yearly',
            features: { contacts: 10000 },
            limits: { users: 20 },
          }),
        })
      )
    })
  })

  describe('Update', () => {
    it('should update a plan successfully', async () => {
      const mockPlan = {
        id: 'plan-1',
        name: 'Plano Básico',
        priceCents: 9900,
        interval: 'monthly',
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }

      const updatedPlan = { ...mockPlan, name: 'Plano Básico Atualizado' }

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [mockPlan] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: updatedPlan }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [updatedPlan] }),
        } as Response)

      const { result } = renderHook(() => usePlans())

      await waitFor(() => {
        expect(result.current.plans).toHaveLength(1)
      })

      const updated = await result.current.updatePlan('plan-1', { name: 'Plano Básico Atualizado' })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/plans/id'),
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Plano Básico Atualizado' }),
        })
      )

      expect(updated?.name).toBe('Plano Básico Atualizado')
    })

    it('should handle update error', async () => {
      const mockPlan = {
        id: 'plan-1',
        name: 'Plano Básico',
        priceCents: 9900,
        interval: 'monthly',
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [mockPlan] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ success: false, error: 'Plano não encontrado' }),
        } as Response)

      const { result } = renderHook(() => usePlans())

      await waitFor(() => {
        expect(result.current.plans).toHaveLength(1)
      })

      const updated = await result.current.updatePlan('plan-1', { name: 'Novo Nome' })

      expect(updated).toBeNull()
      await waitFor(() => {
        expect(result.current.error).toBe('Plano não encontrado')
      })
    })
  })

  describe('Delete', () => {
    it('should delete a plan successfully', async () => {
      const mockPlan = {
        id: 'plan-1',
        name: 'Plano Básico',
        priceCents: 9900,
        interval: 'monthly',
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [mockPlan] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        } as Response)

      const { result } = renderHook(() => usePlans())

      await waitFor(() => {
        expect(result.current.plans).toHaveLength(1)
      })

      const deleted = await result.current.deletePlan('plan-1')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/plans/id'),
        expect.objectContaining({
          method: 'DELETE',
        })
      )

      expect(deleted).toBe(true)
    })

    it('should handle delete error', async () => {
      const mockPlan = {
        id: 'plan-1',
        name: 'Plano Básico',
        priceCents: 9900,
        interval: 'monthly',
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [mockPlan] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ success: false, error: 'Não é possível excluir plano em uso' }),
        } as Response)

      const { result } = renderHook(() => usePlans())

      await waitFor(() => {
        expect(result.current.plans).toHaveLength(1)
      })

      const deleted = await result.current.deletePlan('plan-1')

      expect(deleted).toBe(false)
      await waitFor(() => {
        expect(result.current.error).toBe('Não é possível excluir plano em uso')
      })
    })
  })
})
