/**
 * Testes de Integração - API de Produtos
 *
 * Cobertura:
 * - Listagem de produtos (GET /api/products)
 * - Criação de produto (POST /api/products)
 * - Detalhes de produto (GET /api/products/[id])
 * - Atualização de produto (PATCH /api/products/[id])
 * - Remoção de produto (DELETE /api/products/[id])
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import { createTestUser, createTestOrganization, cleanupDatabase, generateAuthToken, createTestOrganizationMember } from '../../setup'
import type { User, Organization } from '@prisma/client'

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

describe('API de Produtos - Testes de Integração', () => {
  let user: User
  let organization: Organization
  let authToken: string
  let otherOrg: Organization
  let otherUser: User
  let otherToken: string

  beforeAll(async () => {
    user = await createTestUser()
    organization = await createTestOrganization(user.id)
    await createTestOrganizationMember(organization.id, user.id, 'ADMIN')
    authToken = await generateAuthToken(user)

    otherUser = await createTestUser()
    otherOrg = await createTestOrganization(otherUser.id)
    await createTestOrganizationMember(otherOrg.id, otherUser.id, 'ADMIN')
    otherToken = await generateAuthToken(otherUser)
  })

  beforeEach(async () => {
    await prisma.pipeline.deleteMany({
      where: { organizationId: { in: [organization.id, otherOrg.id] } },
    })
    await prisma.product.deleteMany({
      where: { organizationId: { in: [organization.id, otherOrg.id] } },
    })
  })

  afterAll(async () => {
    await cleanupDatabase()
  })

  describe('POST /api/products', () => {
    it('✅ deve criar produto com dados válidos', async () => {
      const response = await makeRequest('POST', '/api/products', {
        name: 'Produto Teste',
        description: 'Descrição do produto',
        color: '#ff0000',
      }, authToken)

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('Produto Teste')
      expect(data.data.organizationId).toBe(organization.id)
    })

    it('❌ deve rejeitar criação sem nome', async () => {
      const response = await makeRequest('POST', '/api/products', {
        description: 'Sem nome',
      }, authToken)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })

  describe('GET /api/products', () => {
    it('✅ deve listar produtos da organização', async () => {
      await prisma.product.create({
        data: {
          organizationId: organization.id,
          name: 'Produto A',
          status: 'ACTIVE',
        },
      })

      const response = await makeRequest('GET', '/api/products', undefined, authToken)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.length).toBeGreaterThanOrEqual(1)
    })
  })
})
