/**
 * Setup e Helpers para Testes de Integração
 */

import { prisma } from '@/lib/prisma'
import { createHash } from 'crypto'

/**
 * Cria um usuário de teste
 */
export async function createTestUser(email?: string, password?: string) {
  // Usar hash simples para testes
  const hashedPassword = createHash('sha256')
    .update(password || 'password123')
    .digest('hex')
  
  return prisma.user.create({
    data: {
      email: email || `test-${Date.now()}@example.com`,
      passwordHash: hashedPassword,
      name: 'Test User',
    },
  })
}

/**
 * Cria uma organização de teste
 */
export async function createTestOrganization(ownerId: string, name?: string) {
  return prisma.organization.create({
    data: {
      name: name || `Test Org ${Date.now()}`,
      slug: `test-org-${Date.now()}`,
      ownerId,
      status: 'ACTIVE',
    },
  })
}

/**
 * Cria um contato de teste
 */
export async function createTestContact(
  organizationId: string,
  data?: Partial<{
    name: string
    phone: string
    status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
    tags: string[]
  }>
) {
  return prisma.contact.create({
    data: {
      organizationId,
      name: data?.name || 'Test Contact',
      phone: data?.phone || `5511${Math.floor(Math.random() * 100000000)}`,
      status: data?.status || 'ACTIVE',
      tags: data?.tags || [],
    },
  })
}

/**
 * Cria uma lista de teste
 */
export async function createTestList(
  organizationId: string,
  createdBy: string,
  name?: string
) {
  return prisma.list.create({
    data: {
      organizationId,
      name: name || `Test List ${Date.now()}`,
      createdBy,
    },
  })
}

/**
 * Cria uma tag de teste
 */
export async function createTestTag(
  organizationId: string,
  name?: string,
  color?: string
) {
  return prisma.tag.create({
    data: {
      organizationId,
      name: name || `Test Tag ${Date.now()}`,
      color: color || '#6366f1',
    },
  })
}

/**
 * Cria um membro de organização
 */
export async function createTestOrganizationMember(
  organizationId: string,
  userId: string,
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' = 'MEMBER'
) {
  return prisma.organizationMember.create({
    data: {
      organizationId,
      userId,
      role,
      status: 'ACTIVE',
    },
  })
}

/**
 * Gera um token de autenticação para testes
 * Nota: Em ambiente de teste, isso pode ser simplificado
 */
export async function generateAuthToken(user: { id: string; email: string }): Promise<string> {
  // Em produção, isso usaria JWT ou similar
  // Para testes, podemos usar um token mock ou real
  const token = Buffer.from(JSON.stringify({
    userId: user.id,
    email: user.email,
    exp: Date.now() + 3600000, // 1 hora
  })).toString('base64')
  
  return token
}

/**
 * Limpa o banco de dados (use com cuidado!)
 */
export async function cleanupDatabase() {
  // Ordem importa devido às foreign keys
  const tables = [
    'contact_tags',
    'contact_custom_field_values',
    'list_contacts',
    'deal_activities',
    'pipeline_stage_history',
    'deals',
    'messages',
    'conversations',
    'schedules',
    'contacts',
    'lists',
    'tags',
    'custom_field_definitions',
    'segments',
    'monthly_goals',
    'dashboard_metric_cache',
    'ai_insights',
    'transcriptions',
    'integration_configs',
    'integration_activity_logs',
    'integrations',
    'pipeline_stages',
    'organization_units',
    'organization_members',
    'organizations',
    'users',
  ]

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM ${table}`)
    } catch (e) {
      // Ignora erros de tabela não existente
      console.warn(`Could not clean table ${table}:`, e)
    }
  }
}

/**
 * Setup global antes de todos os testes
 */
export async function setup() {
  // Verificar conexão com o banco
  try {
    await prisma.$connect()
    console.log('✅ Database connected for tests')
  } catch (error) {
    console.error('❌ Failed to connect to database:', error)
    throw error
  }
}

/**
 * Teardown global após todos os testes
 */
export async function teardown() {
  await prisma.$disconnect()
  console.log('✅ Database disconnected')
}

/**
 * Helper para fazer requests autenticados
 */
export async function authenticatedRequest(
  token: string,
  method: string,
  path: string,
  body?: object
): Promise<Response> {
  const url = `http://localhost:3000${path}`
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
  
  return fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * Verifica se um objeto é um contato válido
 */
export function isValidContact(obj: unknown): boolean {
  if (typeof obj !== 'object' || obj === null) return false
  
  const contact = obj as Record<string, unknown>
  
  return (
    typeof contact.id === 'string' &&
    typeof contact.organizationId === 'string' &&
    typeof contact.phone === 'string' &&
    (contact.name === null || typeof contact.name === 'string') &&
    ['ACTIVE', 'INACTIVE', 'BLOCKED'].includes(contact.status as string) &&
    Array.isArray(contact.tags)
  )
}

/**
 * Mock de sessão para testes
 */
export function createMockSession(userId: string, organizationId: string) {
  return {
    user: {
      id: userId,
      email: 'test@example.com',
    },
    organizationId,
  }
}
