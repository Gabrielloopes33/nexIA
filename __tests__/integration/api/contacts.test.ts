/**
 * Testes de Integração - API de Contatos
 * 
 * Cobertura:
 * - Criação de contato (POST /api/contacts)
 * - Listagem de contatos (GET /api/contacts)
 * - Busca de contato (GET /api/contacts/[id])
 * - Atualização de contato (PATCH /api/contacts/[id])
 * - Remoção de contato (DELETE /api/contacts/[id])
 * - Segurança: verificação de organizationId
 * - Validações de modelo de negócio
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import { createTestUser, createTestOrganization, cleanupDatabase, generateAuthToken } from '../setup'
import type { User, Organization } from '@prisma/client'

// Helpers para fazer requests autenticados
async function makeRequest(
  method: string,
  path: string,
  body?: object,
  token?: string
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return fetch(`http://localhost:3000${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('API de Contatos - Testes de Integração', () => {
  let user: User
  let organization: Organization
  let authToken: string
  let otherOrg: Organization
  let otherUser: User
  let otherToken: string

  beforeAll(async () => {
    // Setup inicial - criar dados de teste
    user = await createTestUser()
    organization = await createTestOrganization(user.id)
    authToken = await generateAuthToken(user)
    
    // Criar segunda org para testes de segurança
    otherUser = await createTestUser()
    otherOrg = await createTestOrganization(otherUser.id)
    otherToken = await generateAuthToken(otherUser)
  })

  beforeEach(async () => {
    // Limpar contatos antes de cada teste
    await prisma.contact.deleteMany({
      where: { organizationId: { in: [organization.id, otherOrg.id] } }
    })
  })

  afterAll(async () => {
    await cleanupDatabase()
  })

  describe('POST /api/contacts - Criação de Contato', () => {
    it('✅ deve criar contato com dados válidos', async () => {
      const response = await makeRequest('POST', '/api/contacts', {
        organizationId: organization.id,
        name: 'João Silva',
        phone: '5511999999999',
        status: 'ACTIVE',
      }, authToken)

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.phone).toBe('5511999999999')
      expect(data.data.name).toBe('João Silva')
      expect(data.data.organizationId).toBe(organization.id)
    })

    it('❌ deve rejeitar criação sem telefone', async () => {
      const response = await makeRequest('POST', '/api/contacts', {
        organizationId: organization.id,
        name: 'João Silva',
      }, authToken)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('phone')
    })

    it('❌ deve rejeitar criação com telefone duplicado na mesma org', async () => {
      // Primeiro contato
      await makeRequest('POST', '/api/contacts', {
        organizationId: organization.id,
        name: 'João Silva',
        phone: '5511999999999',
      }, authToken)

      // Tentativa de duplicar
      const response = await makeRequest('POST', '/api/contacts', {
        organizationId: organization.id,
        name: 'João Segundo',
        phone: '5511999999999',
      }, authToken)

      expect(response.status).toBe(409)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('already exists')
    })

    it('✅ deve permitir mesmo telefone em organizações diferentes', async () => {
      // Criar na primeira org
      await makeRequest('POST', '/api/contacts', {
        organizationId: organization.id,
        name: 'João Org1',
        phone: '5511999999999',
      }, authToken)

      // Criar na segunda org
      const response = await makeRequest('POST', '/api/contacts', {
        organizationId: otherOrg.id,
        name: 'João Org2',
        phone: '5511999999999',
      }, otherToken)

      expect(response.status).toBe(201)
    })

    it('🔒 SECURITY: deve rejeitar organizationId de outra organização no body', async () => {
      const response = await makeRequest('POST', '/api/contacts', {
        organizationId: otherOrg.id,  // Tentando criar na outra org
        name: 'Hacker',
        phone: '5511999999999',
      }, authToken)

      // Deve criar na org do usuário logado, não na do body
      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.data.organizationId).toBe(organization.id)  // Ignora body
      expect(data.data.organizationId).not.toBe(otherOrg.id)
    })

    it('✅ deve normalizar telefone removendo não-numéricos', async () => {
      const response = await makeRequest('POST', '/api/contacts', {
        organizationId: organization.id,
        name: 'João Silva',
        phone: '+55 (11) 99999-9999',
      }, authToken)

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.data.phone).toBe('5511999999999')  // Normalizado
    })

    it('✅ deve salvar email no metadata', async () => {
      const response = await makeRequest('POST', '/api/contacts', {
        organizationId: organization.id,
        name: 'João Silva',
        phone: '5511999999999',
        email: 'joao@email.com',
      }, authToken)

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.data.metadata.email).toBe('joao@email.com')
    })

    it('❌ deve rejeitar telefone muito curto', async () => {
      const response = await makeRequest('POST', '/api/contacts', {
        organizationId: organization.id,
        name: 'João Silva',
        phone: '123',
      }, authToken)

      expect(response.status).toBe(400)
    })

    it('✅ deve aceitar contato sem nome (opcional)', async () => {
      const response = await makeRequest('POST', '/api/contacts', {
        organizationId: organization.id,
        phone: '5511999999999',
      }, authToken)

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.data.name).toBeNull()
    })

    it('✅ deve aceitar tags como array', async () => {
      const response = await makeRequest('POST', '/api/contacts', {
        organizationId: organization.id,
        name: 'João Silva',
        phone: '5511999999999',
        tags: ['lead', 'hot'],
      }, authToken)

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.data.tags).toEqual(['lead', 'hot'])
    })

    it('❌ deve rejeitar requisição não autenticada', async () => {
      const response = await makeRequest('POST', '/api/contacts', {
        organizationId: organization.id,
        name: 'João Silva',
        phone: '5511999999999',
      })  // Sem token

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/contacts - Listagem', () => {
    beforeEach(async () => {
      // Criar contatos de teste
      await prisma.contact.createMany({
        data: [
          { organizationId: organization.id, name: 'Contato 1', phone: '5511111111111', status: 'ACTIVE' },
          { organizationId: organization.id, name: 'Contato 2', phone: '5511222222222', status: 'INACTIVE' },
          { organizationId: organization.id, name: 'João Especial', phone: '5511333333333', status: 'ACTIVE', tags: ['vip'] },
          { organizationId: otherOrg.id, name: 'Contato Outra Org', phone: '5511444444444', status: 'ACTIVE' },
        ]
      })
    })

    it('✅ deve listar apenas contatos da organização do usuário', async () => {
      const response = await makeRequest('GET', `/api/contacts?organizationId=${organization.id}`, undefined, authToken)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.length).toBe(3)  // Apenas da org do usuário
      expect(data.data.every((c: { organizationId: string }) => c.organizationId === organization.id)).toBe(true)
    })

    it('🔒 SECURITY: deve ignorar organizationId da query e usar da sessão', async () => {
      const response = await makeRequest('GET', `/api/contacts?organizationId=${otherOrg.id}`, undefined, authToken)

      // Deve retornar contatos da org do usuário logado, não da query
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.every((c: { organizationId: string }) => c.organizationId === organization.id)).toBe(true)
    })

    it('✅ deve filtrar por status', async () => {
      const response = await makeRequest('GET', `/api/contacts?organizationId=${organization.id}&status=ACTIVE`, undefined, authToken)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.every((c: { status: string }) => c.status === 'ACTIVE')).toBe(true)
    })

    it('✅ deve filtrar por busca (nome)', async () => {
      const response = await makeRequest('GET', `/api/contacts?organizationId=${organization.id}&search=João`, undefined, authToken)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.length).toBe(1)
      expect(data.data[0].name).toBe('João Especial')
    })

    it('✅ deve filtrar por tags', async () => {
      const response = await makeRequest('GET', `/api/contacts?organizationId=${organization.id}&tags=vip`, undefined, authToken)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.length).toBe(1)
      expect(data.data[0].tags).toContain('vip')
    })

    it('✅ deve retornar paginação correta', async () => {
      const response = await makeRequest('GET', `/api/contacts?organizationId=${organization.id}&limit=2`, undefined, authToken)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.length).toBe(2)
      expect(data.pagination.total).toBe(3)
      expect(data.pagination.hasMore).toBe(true)
    })
  })

  describe('GET /api/contacts/[id] - Busca Específica', () => {
    let contactId: string

    beforeEach(async () => {
      const contact = await prisma.contact.create({
        data: {
          organizationId: organization.id,
          name: 'Contato Teste',
          phone: '5511999999999',
        }
      })
      contactId = contact.id
    })

    it('✅ deve retornar contato por ID', async () => {
      const response = await makeRequest('GET', `/api/contacts/${contactId}`, undefined, authToken)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(contactId)
      expect(data.data.name).toBe('Contato Teste')
    })

    it('❌ deve retornar 404 para contato inexistente', async () => {
      const response = await makeRequest('GET', '/api/contacts/contato-inexistente', undefined, authToken)

      expect(response.status).toBe(404)
    })

    it('🔒 SECURITY: não deve retornar contato de outra organização', async () => {
      const otherContact = await prisma.contact.create({
        data: {
          organizationId: otherOrg.id,
          name: 'Contato Secreto',
          phone: '5511888888888',
        }
      })

      const response = await makeRequest('GET', `/api/contacts/${otherContact.id}`, undefined, authToken)

      expect(response.status).toBe(404)  // Não 403, para não revelar existência
    })
  })

  describe('PATCH /api/contacts/[id] - Atualização', () => {
    let contactId: string

    beforeEach(async () => {
      const contact = await prisma.contact.create({
        data: {
          organizationId: organization.id,
          name: 'Nome Original',
          phone: '5511999999999',
        }
      })
      contactId = contact.id
    })

    it('✅ deve atualizar nome do contato', async () => {
      const response = await makeRequest('PATCH', `/api/contacts/${contactId}`, {
        name: 'Nome Atualizado',
      }, authToken)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.name).toBe('Nome Atualizado')
    })

    it('✅ deve atualizar telefone normalizando', async () => {
      const response = await makeRequest('PATCH', `/api/contacts/${contactId}`, {
        phone: '+55 (11) 98888-8888',
      }, authToken)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.phone).toBe('5511988888888')
    })

    it('❌ deve rejeitar telefone duplicado', async () => {
      await prisma.contact.create({
        data: {
          organizationId: organization.id,
          name: 'Outro Contato',
          phone: '5511888888888',
        }
      })

      const response = await makeRequest('PATCH', `/api/contacts/${contactId}`, {
        phone: '5511888888888',  // Já existe
      }, authToken)

      expect(response.status).toBe(409)
    })

    it('🔒 SECURITY: não deve atualizar contato de outra organização', async () => {
      const otherContact = await prisma.contact.create({
        data: {
          organizationId: otherOrg.id,
          name: 'Contato Outro',
          phone: '5511777777777',
        }
      })

      const response = await makeRequest('PATCH', `/api/contacts/${otherContact.id}`, {
        name: 'Hackeado',
      }, authToken)

      expect(response.status).toBe(404)
      
      // Verificar que não foi alterado
      const unchanged = await prisma.contact.findUnique({
        where: { id: otherContact.id }
      })
      expect(unchanged?.name).toBe('Contato Outro')
    })
  })

  describe('DELETE /api/contacts/[id] - Remoção (Soft Delete)', () => {
    let contactId: string

    beforeEach(async () => {
      const contact = await prisma.contact.create({
        data: {
          organizationId: organization.id,
          name: 'Contato para Deletar',
          phone: '5511999999999',
        }
      })
      contactId = contact.id
    })

    it('✅ deve realizar soft delete', async () => {
      const response = await makeRequest('DELETE', `/api/contacts/${contactId}`, undefined, authToken)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)

      // Verificar que foi soft deleted
      const contact = await prisma.contact.findUnique({
        where: { id: contactId }
      })
      expect(contact?.deletedAt).not.toBeNull()
      expect(contact?.status).toBe('INACTIVE')
    })

    it('🔒 SECURITY: não deve deletar contato de outra organização', async () => {
      const otherContact = await prisma.contact.create({
        data: {
          organizationId: otherOrg.id,
          name: 'Contato Protegido',
          phone: '5511666666666',
        }
      })

      const response = await makeRequest('DELETE', `/api/contacts/${otherContact.id}`, undefined, authToken)

      expect(response.status).toBe(404)
      
      // Verificar que não foi deletado
      const unchanged = await prisma.contact.findUnique({
        where: { id: otherContact.id }
      })
      expect(unchanged?.deletedAt).toBeNull()
    })
  })

  describe('Performance e Rate Limiting', () => {
    it('✅ deve responder em menos de 500ms para criação', async () => {
      const start = Date.now()
      await makeRequest('POST', '/api/contacts', {
        organizationId: organization.id,
        name: 'Performance Test',
        phone: '5511999999999',
      }, authToken)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(500)
    })

    it('🔒 deve limitar requisições excessivas (rate limiting)', async () => {
      // Fazer 100 requisições rápidas
      const requests = Array(100).fill(null).map(() => 
        makeRequest('POST', '/api/contacts', {
          organizationId: organization.id,
          name: 'Spam',
          phone: `55119${Math.random().toString().slice(2, 11)}`,
        }, authToken)
      )

      const responses = await Promise.all(requests)
      const tooManyRequests = responses.filter(r => r.status === 429)
      
      // Pelo menos algumas devem ser limitadas
      expect(tooManyRequests.length).toBeGreaterThan(0)
    })
  })
})
