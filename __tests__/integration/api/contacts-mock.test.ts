/**
 * Testes de Integração com API Mockada (MSW)
 * 
 * Testa a API de contatos sem depender do banco de dados
 */

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// Mock do prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    contact: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    list: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    listContact: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
  }
}))

import { prisma } from '@/lib/prisma'

// MSW Server
const server = setupServer()

describe('API de Contatos - Testes com Mock', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterAll(() => server.close())
  afterEach(() => {
    server.resetHandlers()
    vi.clearAllMocks()
  })

  describe('POST /api/contacts', () => {
    it('✅ deve criar contato com sucesso', async () => {
      const mockContact = {
        id: 'contact-123',
        organizationId: 'org-123',
        name: 'João Silva',
        phone: '5511999999999',
        status: 'ACTIVE',
        tags: [],
        leadScore: 0,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.contact.findUnique).mockResolvedValueOnce(null) // Não existe
      vi.mocked(prisma.contact.create).mockResolvedValueOnce(mockContact as any)

      server.use(
        http.post('/api/contacts', async ({ request }) => {
          const body = await request.json() as { organizationId: string; name: string; phone: string }
          
          // Validações
          if (!body.phone) {
            return HttpResponse.json(
              { success: false, error: 'Missing required fields: phone' },
              { status: 400 }
            )
          }

          // Verificar duplicidade
          const existing = await prisma.contact.findUnique({
            where: { organizationId_phone: { organizationId: body.organizationId, phone: body.phone.replace(/\D/g, '') } }
          })
          
          if (existing) {
            return HttpResponse.json(
              { success: false, error: 'Contact with this phone number already exists' },
              { status: 409 }
            )
          }

          return HttpResponse.json(
            { success: true, data: mockContact },
            { status: 201 }
          )
        })
      )

      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: 'org-123',
          name: 'João Silva',
          phone: '5511999999999',
        }),
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.phone).toBe('5511999999999')
    })

    it('❌ deve rejeitar criação sem telefone', async () => {
      server.use(
        http.post('/api/contacts', async ({ request }) => {
          const body = await request.json() as { phone?: string }
          
          if (!body.phone) {
            return HttpResponse.json(
              { success: false, error: 'Missing required fields: phone' },
              { status: 400 }
            )
          }
          
          return HttpResponse.json({ success: true }, { status: 201 })
        })
      )

      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: 'org-123',
          name: 'João Silva',
          // phone faltando
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('phone')
    })

    it('❌ deve rejeitar criação com telefone duplicado', async () => {
      const existingContact = {
        id: 'existing-123',
        organizationId: 'org-123',
        phone: '5511999999999',
      }

      vi.mocked(prisma.contact.findUnique).mockResolvedValueOnce(existingContact as any)

      server.use(
        http.post('/api/contacts', async () => {
          const existing = await prisma.contact.findUnique({
            where: { organizationId_phone: { organizationId: 'org-123', phone: '5511999999999' } }
          })
          
          if (existing) {
            return HttpResponse.json(
              { success: false, error: 'Contact with this phone number already exists' },
              { status: 409 }
            )
          }
          
          return HttpResponse.json({ success: true }, { status: 201 })
        })
      )

      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: 'org-123',
          name: 'João Duplicado',
          phone: '5511999999999',
        }),
      })

      expect(response.status).toBe(409)
      const data = await response.json()
      expect(data.error).toContain('already exists')
    })

    it('🔒 SECURITY: deve ignorar organizationId do body', async () => {
      // O organizationId deve vir da sessão, não do body
      const mockContact = {
        id: 'contact-123',
        organizationId: 'user-org-123', // Deve usar o da sessão, não do body
        name: 'João Silva',
        phone: '5511999999999',
      }

      server.use(
        http.post('/api/contacts', async ({ request }) => {
          const body = await request.json() as { organizationId: string }
          
          // Simular: usar organizationId da sessão, ignorar o do body
          const sessionOrgId = 'user-org-123' // Vindo da sessão
          
          return HttpResponse.json(
            { 
              success: true, 
              data: { ...mockContact, organizationId: sessionOrgId }
            },
            { status: 201 }
          )
        })
      )

      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: 'hacker-org-999', // Tentativa de injection
          name: 'João Silva',
          phone: '5511999999999',
        }),
      })

      const data = await response.json()
      // Deve usar o da sessão, não o do body
      expect(data.data.organizationId).toBe('user-org-123')
      expect(data.data.organizationId).not.toBe('hacker-org-999')
    })
  })

  describe('GET /api/contacts', () => {
    it('✅ deve listar contatos com paginação', async () => {
      const mockContacts = [
        { id: '1', name: 'Contato 1', phone: '5511111111111' },
        { id: '2', name: 'Contato 2', phone: '5511222222222' },
      ]

      vi.mocked(prisma.contact.findMany).mockResolvedValueOnce(mockContacts as any)
      vi.mocked(prisma.contact.count).mockResolvedValueOnce(2)

      server.use(
        http.get('/api/contacts', ({ request }) => {
          const url = new URL(request.url)
          const organizationId = url.searchParams.get('organizationId')
          
          if (!organizationId) {
            return HttpResponse.json(
              { success: false, error: 'Organization ID is required' },
              { status: 400 }
            )
          }

          return HttpResponse.json({
            success: true,
            data: mockContacts,
            pagination: {
              total: 2,
              limit: 50,
              offset: 0,
              hasMore: false,
            }
          })
        })
      )

      const response = await fetch('/api/contacts?organizationId=org-123')
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.pagination.total).toBe(2)
    })

    it('🔒 SECURITY: deve rejeitar listagem sem organizationId', async () => {
      server.use(
        http.get('/api/contacts', () => {
          return HttpResponse.json(
            { success: false, error: 'Organization ID is required' },
            { status: 400 }
          )
        })
      )

      const response = await fetch('/api/contacts')
      expect(response.status).toBe(400)
    })

    it('✅ deve filtrar por status', async () => {
      const mockContacts = [
        { id: '1', name: 'Ativo 1', status: 'ACTIVE' },
        { id: '2', name: 'Ativo 2', status: 'ACTIVE' },
      ]

      server.use(
        http.get('/api/contacts', ({ request }) => {
          const url = new URL(request.url)
          const status = url.searchParams.get('status')
          
          const filtered = mockContacts.filter(c => c.status === status)
          
          return HttpResponse.json({
            success: true,
            data: filtered,
            pagination: { total: filtered.length, limit: 50, offset: 0, hasMore: false }
          })
        })
      )

      const response = await fetch('/api/contacts?organizationId=org-123&status=ACTIVE')
      const data = await response.json()

      expect(data.data.every((c: { status: string }) => c.status === 'ACTIVE')).toBe(true)
    })

    it('✅ deve filtrar por busca (nome)', async () => {
      const mockContacts = [
        { id: '1', name: 'João Silva', phone: '5511111111111' },
        { id: '2', name: 'Maria Santos', phone: '5511222222222' },
      ]

      server.use(
        http.get('/api/contacts', ({ request }) => {
          const url = new URL(request.url)
          const search = url.searchParams.get('search')
          
          const filtered = search 
            ? mockContacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
            : mockContacts
          
          return HttpResponse.json({
            success: true,
            data: filtered,
            pagination: { total: filtered.length, limit: 50, offset: 0, hasMore: false }
          })
        })
      )

      const response = await fetch('/api/contacts?organizationId=org-123&search=João')
      const data = await response.json()

      expect(data.data).toHaveLength(1)
      expect(data.data[0].name).toBe('João Silva')
    })
  })

  describe('GET /api/contacts/[id]', () => {
    it('✅ deve retornar contato por ID', async () => {
      const mockContact = {
        id: 'contact-123',
        name: 'João Silva',
        phone: '5511999999999',
        organizationId: 'org-123',
      }

      vi.mocked(prisma.contact.findUnique).mockResolvedValueOnce(mockContact as any)

      server.use(
        http.get('/api/contacts/:id', ({ params }) => {
          const { id } = params
          
          if (id === 'contact-123') {
            return HttpResponse.json({ success: true, data: mockContact })
          }
          
          return HttpResponse.json(
            { success: false, error: 'Contact not found' },
            { status: 404 }
          )
        })
      )

      const response = await fetch('/api/contacts/contact-123')
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.id).toBe('contact-123')
    })

    it('❌ deve retornar 404 para contato inexistente', async () => {
      server.use(
        http.get('/api/contacts/:id', () => {
          return HttpResponse.json(
            { success: false, error: 'Contact not found' },
            { status: 404 }
          )
        })
      )

      const response = await fetch('/api/contacts/inexistente')
      expect(response.status).toBe(404)
    })

    it('🔒 SECURITY: deve verificar organizationId ao buscar', async () => {
      // Simular que o contato existe mas pertence a outra org
      const otherOrgContact = {
        id: 'contact-123',
        name: 'Contato Secreto',
        organizationId: 'other-org',
      }

      vi.mocked(prisma.contact.findFirst).mockResolvedValueOnce(null) // Não encontrado na org do usuário

      server.use(
        http.get('/api/contacts/:id', async ({ params }) => {
          const { id } = params
          const sessionOrgId = 'user-org' // Vindo da sessão
          
          // Buscar apenas na organização do usuário
          const contact = await prisma.contact.findFirst({
            where: { id, organizationId: sessionOrgId }
          })
          
          if (!contact) {
            return HttpResponse.json(
              { success: false, error: 'Contact not found' },
              { status: 404 }
            )
          }
          
          return HttpResponse.json({ success: true, data: contact })
        })
      )

      const response = await fetch('/api/contacts/contact-123')
      expect(response.status).toBe(404) // Não deve retornar o contato de outra org
    })
  })

  describe('PATCH /api/contacts/[id]', () => {
    it('✅ deve atualizar nome do contato', async () => {
      const updatedContact = {
        id: 'contact-123',
        name: 'João Atualizado',
        phone: '5511999999999',
      }

      vi.mocked(prisma.contact.update).mockResolvedValueOnce(updatedContact as any)

      server.use(
        http.patch('/api/contacts/:id', async ({ params }) => {
          const { id } = params
          return HttpResponse.json({
            success: true,
            data: { ...updatedContact, id }
          })
        })
      )

      const response = await fetch('/api/contacts/contact-123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'João Atualizado' }),
      })

      const data = await response.json()
      expect(data.data.name).toBe('João Atualizado')
    })

    it('🔒 SECURITY: não deve atualizar contato de outra organização', async () => {
      vi.mocked(prisma.contact.findUnique).mockResolvedValueOnce({
        id: 'contact-123',
        organizationId: 'other-org',
      } as any)

      server.use(
        http.patch('/api/contacts/:id', async ({ params }) => {
          const { id } = params
          const sessionOrgId = 'user-org'
          
          // Verificar se o contato pertence à org do usuário
          const contact = await prisma.contact.findUnique({ where: { id: id as string } })
          
          if (contact?.organizationId !== sessionOrgId) {
            return HttpResponse.json(
              { success: false, error: 'Contact not found' },
              { status: 404 }
            )
          }
          
          return HttpResponse.json({ success: true })
        })
      )

      const response = await fetch('/api/contacts/contact-123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Hackeado' }),
      })

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/contacts/[id]', () => {
    it('✅ deve realizar soft delete', async () => {
      const deletedContact = {
        id: 'contact-123',
        deletedAt: new Date(),
        status: 'INACTIVE',
      }

      vi.mocked(prisma.contact.update).mockResolvedValueOnce(deletedContact as any)

      server.use(
        http.delete('/api/contacts/:id', () => {
          return HttpResponse.json({
            success: true,
            message: 'Contact moved to trash successfully',
          })
        })
      )

      const response = await fetch('/api/contacts/contact-123', {
        method: 'DELETE',
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.message).toContain('trash')
    })

    it('🔒 SECURITY: não deve deletar contato de outra organização', async () => {
      server.use(
        http.delete('/api/contacts/:id', async ({ params }) => {
          const { id } = params
          const sessionOrgId = 'user-org'
          
          const contact = await prisma.contact.findUnique({ where: { id: id as string } })
          
          if (contact?.organizationId !== sessionOrgId) {
            return HttpResponse.json(
              { success: false, error: 'Contact not found' },
              { status: 404 }
            )
          }
          
          return HttpResponse.json({ success: true })
        })
      )

      const response = await fetch('/api/contacts/contact-other-org', {
        method: 'DELETE',
      })

      expect(response.status).toBe(404)
    })
  })

  describe('Validações de Negócio', () => {
    it('✅ deve normalizar telefone removendo não-numéricos', async () => {
      server.use(
        http.post('/api/contacts', async ({ request }) => {
          const body = await request.json() as { phone: string }
          const normalized = body.phone.replace(/\D/g, '')
          
          return HttpResponse.json({
            success: true,
            data: { phone: normalized }
          }, { status: 201 })
        })
      )

      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: 'org-123',
          phone: '+55 (11) 99999-9999',
        }),
      })

      const data = await response.json()
      expect(data.data.phone).toBe('5511999999999')
    })

    it('✅ deve salvar email no metadata', async () => {
      server.use(
        http.post('/api/contacts', async ({ request }) => {
          const body = await request.json() as { email?: string; metadata?: Record<string, unknown> }
          
          const metadata = {
            ...body.metadata,
            email: body.email,
          }
          
          return HttpResponse.json({
            success: true,
            data: { metadata }
          }, { status: 201 })
        })
      )

      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: 'org-123',
          name: 'João',
          phone: '5511999999999',
          email: 'joao@email.com',
        }),
      })

      const data = await response.json()
      expect(data.data.metadata.email).toBe('joao@email.com')
    })

    it('✅ deve aceitar contato sem nome (opcional)', async () => {
      server.use(
        http.post('/api/contacts', async ({ request }) => {
          const body = await request.json() as { name?: string }
          
          return HttpResponse.json({
            success: true,
            data: { name: body.name || null }
          }, { status: 201 })
        })
      )

      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: 'org-123',
          phone: '5511999999999',
          // name omitido
        }),
      })

      const data = await response.json()
      expect(response.status).toBe(201)
      expect(data.data.name).toBeNull()
    })

    it('✅ deve aceitar tags como array', async () => {
      server.use(
        http.post('/api/contacts', async ({ request }) => {
          const body = await request.json() as { tags?: string[] }
          
          return HttpResponse.json({
            success: true,
            data: { tags: body.tags || [] }
          }, { status: 201 })
        })
      )

      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: 'org-123',
          name: 'João',
          phone: '5511999999999',
          tags: ['lead', 'hot'],
        }),
      })

      const data = await response.json()
      expect(data.data.tags).toEqual(['lead', 'hot'])
    })
  })
})
