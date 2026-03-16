import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'

// Helper to make API requests
async function makeRequest(
  method: string,
  url: string,
  body?: object,
  headers?: Record<string, string>
) {
  const response = await fetch(`http://localhost:3000${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return response
}

describe('Conversations API Integration', () => {
  let testOrgId: string
  let testContactId: string
  let testInstanceId: string

  beforeAll(async () => {
    // Create test organization
    const org = await prisma.organization.create({
      data: {
        name: 'Test Organization Conversations',
        slug: 'test-org-conversations',
        status: 'ACTIVE',
      },
    })
    testOrgId = org.id

    // Create test contact
    const contact = await prisma.contact.create({
      data: {
        organizationId: testOrgId,
        name: 'Test Contact',
        phone: '+5511999999999',
        status: 'ACTIVE',
      },
    })
    testContactId = contact.id

    // Create test WhatsApp instance
    const instance = await prisma.whatsappInstance.create({
      data: {
        organizationId: testOrgId,
        name: 'Test Instance',
        phoneNumber: '+5511888888888',
        status: 'CONNECTED',
      },
    })
    testInstanceId = instance.id
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.message.deleteMany({
      where: { conversation: { organizationId: testOrgId } },
    })
    await prisma.conversation.deleteMany({
      where: { organizationId: testOrgId },
    })
    await prisma.whatsappInstance.deleteMany({
      where: { organizationId: testOrgId },
    })
    await prisma.contact.deleteMany({
      where: { organizationId: testOrgId },
    })
    await prisma.organization.delete({
      where: { id: testOrgId },
    })
  })

  beforeEach(async () => {
    // Clean conversations before each test
    await prisma.message.deleteMany({
      where: { conversation: { organizationId: testOrgId } },
    })
    await prisma.conversation.deleteMany({
      where: { organizationId: testOrgId },
    })
  })

  describe('GET /api/conversations', () => {
    it('returns 400 when organizationId is missing', async () => {
      const response = await makeRequest('GET', '/api/conversations')
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('organizationId')
    })

    it('returns empty array when no conversations exist', async () => {
      const response = await makeRequest(
        'GET',
        `/api/conversations?organizationId=${testOrgId}`
      )
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
    })

    it('returns conversations for organization', async () => {
      // Create test conversations
      const now = new Date()
      const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      await prisma.conversation.create({
        data: {
          organizationId: testOrgId,
          contactId: testContactId,
          instanceId: testInstanceId,
          type: 'USER_INITIATED',
          status: 'ACTIVE',
          windowStart: now,
          windowEnd: windowEnd,
          messageCount: 0,
        },
      })

      const response = await makeRequest(
        'GET',
        `/api/conversations?organizationId=${testOrgId}`
      )
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].type).toBe('USER_INITIATED')
      expect(data.data[0].status).toBe('ACTIVE')
    })

    it('filters by status', async () => {
      const now = new Date()
      const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const pastWindowEnd = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      await prisma.conversation.create({
        data: {
          organizationId: testOrgId,
          contactId: testContactId,
          instanceId: testInstanceId,
          type: 'USER_INITIATED',
          status: 'ACTIVE',
          windowStart: now,
          windowEnd: windowEnd,
          messageCount: 0,
        },
      })

      await prisma.conversation.create({
        data: {
          organizationId: testOrgId,
          contactId: testContactId,
          instanceId: testInstanceId,
          type: 'BUSINESS_INITIATED',
          status: 'EXPIRED',
          windowStart: new Date(now.getTime() - 48 * 60 * 60 * 1000),
          windowEnd: pastWindowEnd,
          messageCount: 1,
          lastMessageAt: new Date(now.getTime() - 25 * 60 * 60 * 1000),
        },
      })

      const response = await makeRequest(
        'GET',
        `/api/conversations?organizationId=${testOrgId}&status=ACTIVE`
      )
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).toHaveLength(1)
      expect(data.data[0].status).toBe('ACTIVE')
    })

    it('filters by type', async () => {
      const now = new Date()
      const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      await prisma.conversation.create({
        data: {
          organizationId: testOrgId,
          contactId: testContactId,
          instanceId: testInstanceId,
          type: 'USER_INITIATED',
          status: 'ACTIVE',
          windowStart: now,
          windowEnd: windowEnd,
          messageCount: 0,
        },
      })

      await prisma.conversation.create({
        data: {
          organizationId: testOrgId,
          contactId: testContactId,
          instanceId: testInstanceId,
          type: 'BUSINESS_INITIATED',
          status: 'ACTIVE',
          windowStart: now,
          windowEnd: windowEnd,
          messageCount: 0,
        },
      })

      const response = await makeRequest(
        'GET',
        `/api/conversations?organizationId=${testOrgId}&type=USER_INITIATED`
      )
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).toHaveLength(1)
      expect(data.data[0].type).toBe('USER_INITIATED')
    })

    it('applies limit and offset', async () => {
      const now = new Date()
      const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      // Create 5 conversations
      for (let i = 0; i < 5; i++) {
        await prisma.conversation.create({
          data: {
            organizationId: testOrgId,
            contactId: testContactId,
            instanceId: testInstanceId,
            type: 'USER_INITIATED',
            status: 'ACTIVE',
            windowStart: now,
            windowEnd: windowEnd,
            messageCount: 0,
          },
        })
      }

      const response = await makeRequest(
        'GET',
        `/api/conversations?organizationId=${testOrgId}&limit=2&offset=0`
      )
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).toHaveLength(2)
      expect(data.meta.pagination.limit).toBe(2)
    })

    it('includes contact and instance data', async () => {
      const now = new Date()
      const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      await prisma.conversation.create({
        data: {
          organizationId: testOrgId,
          contactId: testContactId,
          instanceId: testInstanceId,
          type: 'USER_INITIATED',
          status: 'ACTIVE',
          windowStart: now,
          windowEnd: windowEnd,
          messageCount: 0,
        },
      })

      const response = await makeRequest(
        'GET',
        `/api/conversations?organizationId=${testOrgId}`
      )
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data[0].contact).toBeDefined()
      expect(data.data[0].contact.id).toBe(testContactId)
      expect(data.data[0].instance).toBeDefined()
      expect(data.data[0].instance.id).toBe(testInstanceId)
    })

    it('calculates isWindowActive correctly', async () => {
      const now = new Date()
      const futureWindowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const pastWindowEnd = new Date(now.getTime() - 1 * 60 * 60 * 1000)

      await prisma.conversation.create({
        data: {
          organizationId: testOrgId,
          contactId: testContactId,
          instanceId: testInstanceId,
          type: 'USER_INITIATED',
          status: 'ACTIVE',
          windowStart: now,
          windowEnd: futureWindowEnd,
          messageCount: 0,
        },
      })

      await prisma.conversation.create({
        data: {
          organizationId: testOrgId,
          contactId: testContactId,
          instanceId: testInstanceId,
          type: 'USER_INITIATED',
          status: 'EXPIRED',
          windowStart: new Date(now.getTime() - 48 * 60 * 60 * 1000),
          windowEnd: pastWindowEnd,
          messageCount: 1,
          lastMessageAt: new Date(now.getTime() - 25 * 60 * 60 * 1000),
        },
      })

      const response = await makeRequest(
        'GET',
        `/api/conversations?organizationId=${testOrgId}`
      )
      expect(response.status).toBe(200)
      const data = await response.json()
      
      const activeConv = data.data.find((c: any) => c.status === 'ACTIVE')
      const expiredConv = data.data.find((c: any) => c.status === 'EXPIRED')
      
      expect(activeConv.isWindowActive).toBe(true)
      expect(expiredConv.isWindowActive).toBe(false)
    })
  })

  describe('POST /api/conversations', () => {
    it('creates a new conversation', async () => {
      const now = new Date()
      const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      const conversationData = {
        organizationId: testOrgId,
        contactId: testContactId,
        instanceId: testInstanceId,
        type: 'USER_INITIATED',
        windowStart: now.toISOString(),
        windowEnd: windowEnd.toISOString(),
      }

      const response = await makeRequest('POST', '/api/conversations', conversationData)
      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.type).toBe('USER_INITIATED')
      expect(data.data.status).toBe('ACTIVE')
      expect(data.data.messageCount).toBe(0)
    })

    it('returns 400 when required fields are missing', async () => {
      const conversationData = {
        organizationId: testOrgId,
        // Missing contactId, instanceId, type
      }

      const response = await makeRequest('POST', '/api/conversations', conversationData)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    it('returns 400 for invalid conversation type', async () => {
      const now = new Date()
      const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      const conversationData = {
        organizationId: testOrgId,
        contactId: testContactId,
        instanceId: testInstanceId,
        type: 'INVALID_TYPE',
        windowStart: now.toISOString(),
        windowEnd: windowEnd.toISOString(),
      }

      const response = await makeRequest('POST', '/api/conversations', conversationData)
      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/conversations/[id]', () => {
    it('returns a specific conversation with messages', async () => {
      const now = new Date()
      const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      const conversation = await prisma.conversation.create({
        data: {
          organizationId: testOrgId,
          contactId: testContactId,
          instanceId: testInstanceId,
          type: 'USER_INITIATED',
          status: 'ACTIVE',
          windowStart: now,
          windowEnd: windowEnd,
          messageCount: 2,
          lastMessageAt: now,
        },
      })

      // Add messages
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          contactId: testContactId,
          direction: 'INBOUND',
          type: 'TEXT',
          content: 'Hello!',
          status: 'READ',
        },
      })

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          contactId: testContactId,
          direction: 'OUTBOUND',
          type: 'TEXT',
          content: 'Hi there!',
          status: 'DELIVERED',
        },
      })

      const response = await makeRequest(
        'GET',
        `/api/conversations/${conversation.id}?organizationId=${testOrgId}`
      )
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(conversation.id)
      expect(data.data.messages).toHaveLength(2)
      expect(data.data.messages[0].content).toBe('Hello!')
    })

    it('returns 404 for non-existent conversation', async () => {
      const response = await makeRequest(
        'GET',
        `/api/conversations/non-existent-id?organizationId=${testOrgId}`
      )
      expect(response.status).toBe(404)
    })
  })

  describe('PATCH /api/conversations/[id]', () => {
    it('updates a conversation', async () => {
      const now = new Date()
      const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      const conversation = await prisma.conversation.create({
        data: {
          organizationId: testOrgId,
          contactId: testContactId,
          instanceId: testInstanceId,
          type: 'USER_INITIATED',
          status: 'ACTIVE',
          windowStart: now,
          windowEnd: windowEnd,
          messageCount: 0,
        },
      })

      const updateData = {
        status: 'CLOSED',
      }

      const response = await makeRequest(
        'PATCH',
        `/api/conversations/${conversation.id}`,
        updateData
      )
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.status).toBe('CLOSED')
    })

    it('returns 404 for non-existent conversation', async () => {
      const response = await makeRequest(
        'PATCH',
        '/api/conversations/non-existent-id',
        { status: 'CLOSED' }
      )
      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/conversations/[id]', () => {
    it('deletes a conversation and its messages', async () => {
      const now = new Date()
      const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      const conversation = await prisma.conversation.create({
        data: {
          organizationId: testOrgId,
          contactId: testContactId,
          instanceId: testInstanceId,
          type: 'USER_INITIATED',
          status: 'ACTIVE',
          windowStart: now,
          windowEnd: windowEnd,
          messageCount: 1,
        },
      })

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          contactId: testContactId,
          direction: 'INBOUND',
          type: 'TEXT',
          content: 'To be deleted',
          status: 'READ',
        },
      })

      const response = await makeRequest(
        'DELETE',
        `/api/conversations/${conversation.id}`
      )
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)

      // Verify deletion
      const deleted = await prisma.conversation.findUnique({
        where: { id: conversation.id },
      })
      expect(deleted).toBeNull()
    })
  })

  describe('GET /api/conversations/[id]/messages', () => {
    it('returns messages for a conversation', async () => {
      const now = new Date()
      const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      const conversation = await prisma.conversation.create({
        data: {
          organizationId: testOrgId,
          contactId: testContactId,
          instanceId: testInstanceId,
          type: 'USER_INITIATED',
          status: 'ACTIVE',
          windowStart: now,
          windowEnd: windowEnd,
          messageCount: 3,
          lastMessageAt: now,
        },
      })

      // Add messages
      for (let i = 0; i < 3; i++) {
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            contactId: testContactId,
            direction: i % 2 === 0 ? 'INBOUND' : 'OUTBOUND',
            type: 'TEXT',
            content: `Message ${i + 1}`,
            status: 'READ',
          },
        })
      }

      const response = await makeRequest(
        'GET',
        `/api/conversations/${conversation.id}/messages`
      )
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(3)
    })

    it('supports pagination with limit and before', async () => {
      const now = new Date()
      const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      const conversation = await prisma.conversation.create({
        data: {
          organizationId: testOrgId,
          contactId: testContactId,
          instanceId: testInstanceId,
          type: 'USER_INITIATED',
          status: 'ACTIVE',
          windowStart: now,
          windowEnd: windowEnd,
          messageCount: 5,
          lastMessageAt: now,
        },
      })

      const messages = []
      for (let i = 0; i < 5; i++) {
        const msg = await prisma.message.create({
          data: {
            conversationId: conversation.id,
            contactId: testContactId,
            direction: 'INBOUND',
            type: 'TEXT',
            content: `Message ${i + 1}`,
            status: 'READ',
          },
        })
        messages.push(msg)
      }

      const response = await makeRequest(
        'GET',
        `/api/conversations/${conversation.id}/messages?limit=2`
      )
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).toHaveLength(2)
      expect(data.meta.pagination.limit).toBe(2)
    })
  })

  describe('POST /api/conversations/[id]/messages', () => {
    it('sends a message to a conversation', async () => {
      const now = new Date()
      const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      const conversation = await prisma.conversation.create({
        data: {
          organizationId: testOrgId,
          contactId: testContactId,
          instanceId: testInstanceId,
          type: 'USER_INITIATED',
          status: 'ACTIVE',
          windowStart: now,
          windowEnd: windowEnd,
          messageCount: 0,
        },
      })

      const messageData = {
        content: 'Test message',
        type: 'TEXT',
      }

      const response = await makeRequest(
        'POST',
        `/api/conversations/${conversation.id}/messages`,
        messageData
      )
      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.content).toBe('Test message')
      expect(data.data.direction).toBe('OUTBOUND')
    })

    it('returns 404 for non-existent conversation', async () => {
      const response = await makeRequest(
        'POST',
        '/api/conversations/non-existent-id/messages',
        { content: 'Test', type: 'TEXT' }
      )
      expect(response.status).toBe(404)
    })

    it('returns 400 when message window is closed', async () => {
      const now = new Date()
      const pastWindowEnd = new Date(now.getTime() - 1 * 60 * 60 * 1000)

      const conversation = await prisma.conversation.create({
        data: {
          organizationId: testOrgId,
          contactId: testContactId,
          instanceId: testInstanceId,
          type: 'USER_INITIATED',
          status: 'EXPIRED',
          windowStart: new Date(now.getTime() - 48 * 60 * 60 * 1000),
          windowEnd: pastWindowEnd,
          messageCount: 1,
          lastMessageAt: new Date(now.getTime() - 25 * 60 * 60 * 1000),
        },
      })

      const response = await makeRequest(
        'POST',
        `/api/conversations/${conversation.id}/messages`,
        { content: 'Test', type: 'TEXT' }
      )
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('janela de 24 horas')
    })
  })

  describe('GET /api/conversations/stats', () => {
    it('returns conversation statistics', async () => {
      const now = new Date()
      const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      // Create conversations with different statuses
      await prisma.conversation.create({
        data: {
          organizationId: testOrgId,
          contactId: testContactId,
          instanceId: testInstanceId,
          type: 'USER_INITIATED',
          status: 'ACTIVE',
          windowStart: now,
          windowEnd: windowEnd,
          messageCount: 5,
          lastMessageAt: now,
        },
      })

      await prisma.conversation.create({
        data: {
          organizationId: testOrgId,
          contactId: testContactId,
          instanceId: testInstanceId,
          type: 'USER_INITIATED',
          status: 'ACTIVE',
          windowStart: now,
          windowEnd: windowEnd,
          messageCount: 3,
          lastMessageAt: now,
        },
      })

      await prisma.conversation.create({
        data: {
          organizationId: testOrgId,
          contactId: testContactId,
          instanceId: testInstanceId,
          type: 'BUSINESS_INITIATED',
          status: 'EXPIRED',
          windowStart: new Date(now.getTime() - 48 * 60 * 60 * 1000),
          windowEnd: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          messageCount: 2,
          lastMessageAt: new Date(now.getTime() - 25 * 60 * 60 * 1000),
        },
      })

      const response = await makeRequest(
        'GET',
        `/api/conversations/stats?organizationId=${testOrgId}&period=7d`
      )
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.totalCount).toBe(3)
      expect(data.data.activeCount).toBe(2)
      expect(data.data.expiredCount).toBe(1)
      expect(data.data.totalMessages).toBe(10)
    })

    it('returns 400 when organizationId is missing', async () => {
      const response = await makeRequest('GET', '/api/conversations/stats')
      expect(response.status).toBe(400)
    })
  })
})
