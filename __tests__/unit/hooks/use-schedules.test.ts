import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useSchedules, ScheduleType, ScheduleStatus } from '@/hooks/use-schedules'
import { mockSchedules } from '../../mocks/data'

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('useSchedules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue('test-org-123')
    global.fetch = vi.fn()
  })

  describe('Fetch', () => {
    it('fetches schedules with organization_id', async () => {
      const mockResponse = {
        success: true,
        data: mockSchedules,
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const { result } = renderHook(() => useSchedules())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/schedules?organizationId=test-org-123')
      )
      expect(result.current.schedules).toEqual(mockSchedules)
    })

    it('shows loading state while fetching', async () => {
      vi.mocked(global.fetch).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      const { result } = renderHook(() => useSchedules())

      expect(result.current.isLoading).toBe(true)
    })

    it('handles fetch error', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Erro ao carregar agendamentos' }),
      } as Response)

      const { result } = renderHook(() => useSchedules())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe('Erro ao carregar agendamentos')
    })

    it('filters by type', async () => {
      const mockResponse = {
        success: true,
        data: mockSchedules.filter(s => s.type === 'meeting'),
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      renderHook(() => useSchedules('test-org-123', { type: 'meeting' as ScheduleType }))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('type=meeting')
        )
      })
    })

    it('filters by status', async () => {
      const mockResponse = {
        success: true,
        data: mockSchedules.filter(s => s.status === 'pending'),
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      renderHook(() => useSchedules('test-org-123', { status: 'pending' as ScheduleStatus }))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('status=pending')
        )
      })
    })

    it('filters by date range', async () => {
      const mockResponse = {
        success: true,
        data: mockSchedules,
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      renderHook(() => useSchedules('test-org-123', { 
        startDate: '2026-03-01',
        endDate: '2026-03-31'
      }))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('startDate=2026-03-01')
        )
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('endDate=2026-03-31')
        )
      })
    })
  })

  describe('Create', () => {
    it('creates schedule with organizationId', async () => {
      const newSchedule = {
        id: 'schedule-new',
        type: 'meeting',
        title: 'Nova Reunião',
        startTime: '2026-03-20T10:00:00Z',
        endTime: '2026-03-20T11:00:00Z',
        organizationId: 'test-org-123',
        description: null,
        contactId: null,
        contact: null,
        dealId: null,
        deal: null,
        assignedTo: null,
        assignee: null,
        completedAt: null,
        status: 'pending',
        location: null,
        createdAt: '2026-03-12T10:00:00Z',
        updatedAt: '2026-03-12T10:00:00Z',
      }

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockSchedules }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: newSchedule }),
        } as Response)

      const { result } = renderHook(() => useSchedules())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const createData = {
        type: 'meeting' as ScheduleType,
        title: 'Nova Reunião',
        startTime: '2026-03-20T10:00:00Z',
        endTime: '2026-03-20T11:00:00Z',
      }

      await result.current.createSchedule(createData)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/schedules',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"organizationId"'),
        })
      )

      const callBody = JSON.parse((global.fetch as any).mock.calls[1][1].body)
      expect(callBody.organizationId).toBe('test-org-123')
      expect(callBody.title).toBe('Nova Reunião')
    })

    it('refreshes schedules after create', async () => {
      const newSchedule = {
        id: 'schedule-new',
        type: 'task',
        title: 'Nova Tarefa',
        startTime: '2026-03-20T09:00:00Z',
        endTime: '2026-03-20T18:00:00Z',
        organizationId: 'test-org-123',
        description: null,
        contactId: null,
        contact: null,
        dealId: null,
        deal: null,
        assignedTo: null,
        assignee: null,
        completedAt: null,
        status: 'pending',
        location: null,
        createdAt: '2026-03-12T10:00:00Z',
        updatedAt: '2026-03-12T10:00:00Z',
      }

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockSchedules }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: newSchedule }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [...mockSchedules, newSchedule] }),
        } as Response)

      const { result } = renderHook(() => useSchedules())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.createSchedule({
        type: 'task',
        title: 'Nova Tarefa',
        startTime: '2026-03-20T09:00:00Z',
        endTime: '2026-03-20T18:00:00Z',
      })

      // Should refresh after create
      expect(global.fetch).toHaveBeenCalledTimes(3)
    })

    it('returns null and sets error when create fails', async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockSchedules }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Erro ao criar agendamento' }),
        } as Response)

      const { result } = renderHook(() => useSchedules())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const response = await result.current.createSchedule({
        type: 'call',
        title: 'Ligação',
        startTime: '2026-03-20T10:00:00Z',
        endTime: '2026-03-20T10:30:00Z',
      })

      expect(response).toBeNull()
      await waitFor(() => {
        expect(result.current.error).toBe('Erro ao criar agendamento')
      })
    })
  })

  describe('Update', () => {
    it('updates schedule', async () => {
      const updatedSchedule = { ...mockSchedules[0], title: 'Reunião Atualizada' }

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockSchedules }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: updatedSchedule }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [updatedSchedule, ...mockSchedules.slice(1)] }),
        } as Response)

      const { result } = renderHook(() => useSchedules())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.updateSchedule('schedule-1', { title: 'Reunião Atualizada' })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/schedules/schedule-1',
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Reunião Atualizada' }),
        })
      )
    })

    it('returns null when update fails', async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockSchedules }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Agendamento não encontrado' }),
        } as Response)

      const { result } = renderHook(() => useSchedules())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const response = await result.current.updateSchedule('schedule-invalid', { title: 'Novo Título' })

      expect(response).toBeNull()
      await waitFor(() => {
        expect(result.current.error).toBe('Agendamento não encontrado')
      })
    })
  })

  describe('Delete', () => {
    it('deletes schedule', async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockSchedules }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockSchedules.slice(1) }),
        } as Response)

      const { result } = renderHook(() => useSchedules())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const success = await result.current.deleteSchedule('schedule-1')

      expect(success).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/schedules/schedule-1',
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('returns false when delete fails', async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockSchedules }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Não autorizado' }),
        } as Response)

      const { result } = renderHook(() => useSchedules())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const success = await result.current.deleteSchedule('schedule-1')

      expect(success).toBe(false)
      await waitFor(() => {
        expect(result.current.error).toBe('Não autorizado')
      })
    })
  })

  describe('Complete', () => {
    it('completes schedule', async () => {
      const completedSchedule = { 
        ...mockSchedules[0], 
        status: 'completed',
        completedAt: '2026-03-15T11:00:00Z'
      }

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockSchedules }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: completedSchedule }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [completedSchedule, ...mockSchedules.slice(1)] }),
        } as Response)

      const { result } = renderHook(() => useSchedules())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const response = await result.current.completeSchedule('schedule-1')

      expect(response).toEqual(completedSchedule)
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/schedules/schedule-1/complete',
        expect.objectContaining({ 
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })

    it('returns null when complete fails', async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockSchedules }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Agendamento já concluído' }),
        } as Response)

      const { result } = renderHook(() => useSchedules())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const response = await result.current.completeSchedule('schedule-2')

      expect(response).toBeNull()
      await waitFor(() => {
        expect(result.current.error).toBe('Agendamento já concluído')
      })
    })
  })

  describe('Refresh', () => {
    it('refreshes schedules manually', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockSchedules }),
      } as Response)

      const { result } = renderHook(() => useSchedules())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Clear mock to track new calls
      vi.mocked(global.fetch).mockClear()

      await result.current.refreshSchedules()

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/schedules')
      )
    })
  })
})
