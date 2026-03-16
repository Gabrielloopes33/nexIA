/**
 * Testes Unitários - Hook useContacts
 * 
 * Cobertura:
 * - Estados iniciais
 * - Criação de contato
 * - Tratamento de erros
 * - Atualização de lista após criação
 * - Verificação de organizationId
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useContacts } from '@/hooks/use-contacts'
import { OrganizationProvider } from '@/lib/contexts/organization-context'

// Mock do fetch global
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock do contexto de organização
vi.mock('@/lib/contexts/organization-context', () => ({
  useOrganizationId: vi.fn(),
  OrganizationProvider: ({ children }: { children: React.ReactNode }) => children,
}))

import { useOrganizationId } from '@/lib/contexts/organization-context'

describe('useContacts - Testes Unitários', () => {
  const mockOrgId = 'org-123'
  
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  describe('Estados Iniciais', () => {
    it('✅ deve iniciar com estado de loading', () => {
      vi.mocked(useOrganizationId).mockReturnValue(mockOrgId)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [], pagination: { total: 0 } }),
      })

      const { result } = renderHook(() => useContacts())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.contacts).toEqual([])
      expect(result.current.error).toBeNull()
    })

    it('✅ deve retornar lista vazia quando não há organizationId', () => {
      vi.mocked(useOrganizationId).mockReturnValue(null)

      const { result } = renderHook(() => useContacts())

      expect(result.current.contacts).toEqual([])
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('createContact', () => {
    beforeEach(() => {
      vi.mocked(useOrganizationId).mockReturnValue(mockOrgId)
    })

    it('✅ deve criar contato com sucesso', async () => {
      const newContact = {
        id: 'contact-123',
        organizationId: mockOrgId,
        name: 'João Silva',
        phone: '5511999999999',
        status: 'ACTIVE',
        tags: [],
        leadScore: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Primeiro: fetch inicial (useEffect)
      // Segundo: POST /api/contacts
      // Terceiro: GET /api/contacts (refresh)
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [], pagination: { total: 0 } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: newContact }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [newContact], pagination: { total: 1 } }),
        })

      const { result } = renderHook(() => useContacts())
      
      // Esperar carregamento inicial
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        const created = await result.current.createContact({
          name: 'João Silva',
          phone: '5511999999999',
        })
        expect(created).toEqual(newContact)
      })

      // Verificar que o fetch foi chamado corretamente
      expect(mockFetch).toHaveBeenCalledWith('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'João Silva',
          phone: '5511999999999',
          organizationId: mockOrgId,
        }),
      })
    })

    it('❌ deve lançar erro quando API retorna 400', async () => {
      // Primeiro: fetch inicial
      // Segundo: POST que falha
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [], pagination: { total: 0 } }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ success: false, error: 'Missing required fields: phone' }),
        })

      const { result } = renderHook(() => useContacts())
      
      // Esperar carregamento inicial
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await expect(
          result.current.createContact({
            name: 'João Silva',
            // phone faltando
          })
        ).rejects.toThrow('Missing required fields: phone')
      })

      expect(result.current.error).toBe('Missing required fields: phone')
    })

    it('❌ deve lançar erro quando API retorna 409 (duplicado)', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [], pagination: { total: 0 } }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: async () => ({ success: false, error: 'Contact with this phone number already exists' }),
        })

      const { result } = renderHook(() => useContacts())
      
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await expect(
          result.current.createContact({
            name: 'João Silva',
            phone: '5511999999999',
          })
        ).rejects.toThrow('already exists')
      })

      expect(result.current.error).toContain('already exists')
    })

    it('❌ deve retornar null quando organizationId é vazio', async () => {
      vi.mocked(useOrganizationId).mockReturnValue('')  // String vazia

      const { result } = renderHook(() => useContacts())

      await act(async () => {
        const created = await result.current.createContact({
          name: 'João Silva',
          phone: '5511999999999',
        })
        expect(created).toBeNull()
      })

      expect(mockFetch).not.toHaveBeenCalled()  // Não deve chamar a API
    })

    it('❌ deve retornar null quando organizationId é null', async () => {
      vi.mocked(useOrganizationId).mockReturnValue(null)

      const { result } = renderHook(() => useContacts())

      await act(async () => {
        const created = await result.current.createContact({
          name: 'João Silva',
          phone: '5511999999999',
        })
        expect(created).toBeNull()
      })

      // Não deve ter erro pois retorna null silenciosamente quando não há orgId
      expect(result.current.error).toBeNull()
    })

    it('✅ deve atualizar lista após criação bem-sucedida', async () => {
      const newContact = {
        id: 'contact-123',
        organizationId: mockOrgId,
        name: 'João Silva',
        phone: '5511999999999',
        status: 'ACTIVE',
        tags: [],
        leadScore: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [], pagination: { total: 0 } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: newContact }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [newContact], pagination: { total: 1 } }),
        })

      const { result } = renderHook(() => useContacts())

      // Esperar carregamento inicial
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      // Criar contato
      await act(async () => {
        await result.current.createContact({
          name: 'João Silva',
          phone: '5511999999999',
        })
      })

      // Verificar que a lista foi atualizada
      await waitFor(() => {
        expect(result.current.contacts.length).toBe(1)
        expect(result.current.total).toBe(1)
      })
    })
  })

  describe('updateContact', () => {
    beforeEach(() => {
      vi.mocked(useOrganizationId).mockReturnValue(mockOrgId)
    })

    it('✅ deve atualizar contato com sucesso', async () => {
      const updatedContact = {
        id: 'contact-123',
        organizationId: mockOrgId,
        name: 'João Atualizado',
        phone: '5511999999999',
        status: 'ACTIVE',
        tags: [],
        leadScore: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [], pagination: { total: 0 } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: updatedContact }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [updatedContact], pagination: { total: 1 } }),
        })

      const { result } = renderHook(() => useContacts())
      
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        const updated = await result.current.updateContact('contact-123', {
          name: 'João Atualizado',
        })
        expect(updated?.name).toBe('João Atualizado')
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/contacts/contact-123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'João Atualizado' }),
      })
    })

    it('❌ deve lançar erro quando contato não existe (404)', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [], pagination: { total: 0 } }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({ success: false, error: 'Contact not found' }),
        })

      const { result } = renderHook(() => useContacts())
      
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await expect(
          result.current.updateContact('inexistente', {
            name: 'Novo Nome',
          })
        ).rejects.toThrow('Contact not found')
      })

      expect(result.current.error).toBe('Contact not found')
    })
  })

  describe('deleteContact', () => {
    beforeEach(() => {
      vi.mocked(useOrganizationId).mockReturnValue(mockOrgId)
    })

    it('✅ deve deletar contato com sucesso (soft delete)', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [], pagination: { total: 0 } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, message: 'Contact moved to trash' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [], pagination: { total: 0 } }),
        })

      const { result } = renderHook(() => useContacts())
      
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        const success = await result.current.deleteContact('contact-123')
        expect(success).toBe(true)
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/contacts/contact-123', {
        method: 'DELETE',
      })
    })

    it('❌ deve lançar erro quando deleção falha', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [], pagination: { total: 0 } }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ success: false, error: 'Internal server error' }),
        })

      const { result } = renderHook(() => useContacts())
      
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await expect(
          result.current.deleteContact('contact-123')
        ).rejects.toThrow('Internal server error')
      })

      expect(result.current.error).toBe('Internal server error')
    })
  })

  describe('Busca e Filtros', () => {
    beforeEach(() => {
      vi.mocked(useOrganizationId).mockReturnValue(mockOrgId)
    })

    it('✅ deve construir query string corretamente', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [], pagination: { total: 0 } }),
      })

      renderHook(() => useContacts(undefined, {
        search: 'João',
        status: 'ACTIVE',
        tags: ['vip', 'lead'],
        limit: 10,
        offset: 20,
      }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('organizationId=org-123')
        )
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('search=Jo%C3%A3o')
        )
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('status=ACTIVE')
        )
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('tags=vip%2Clead')
        )
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('limit=10')
        )
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('offset=20')
        )
      })
    })

    it('✅ deve usar organizationId do parâmetro quando fornecido', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [], pagination: { total: 0 } }),
      })

      renderHook(() => useContacts('org-custom'))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('organizationId=org-custom')
        )
      })
    })
  })
})
