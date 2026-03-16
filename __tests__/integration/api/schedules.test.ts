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

describe('Schedules API Integration', () => {
  let testOrgId: string
  let testContactId: string
  let testUserId: string

  beforeAll(async () => {
    // Create test organization
    const org = await prisma.organization.create({
      data: {
        name: 'Test Organization Schedules',
        slug: 'test-org-schedules',
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

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test-schedules@nexia.com',
        name: 'Test User Schedules',
        password: 'hashedpassword',
      },
    })
    testUserId = user.id
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.schedule.deleteMany({
      where: { organizationId: testOrgId },
    })
    await prisma.contact.deleteMany({
      where: { organizationId: testOrgId },
    })
    await prisma.user.deleteMany({
      where: { email: 'test-schedules@nexia.com' },
    })
    await prisma.organization.delete({
      where: { id: testOrgId },
    })
  })

  beforeEach(async () => {
    // Clean schedules before each test
    await prisma.schedule.deleteMany({
      where: { organizationId: testOrgId },
    })
  })

  describe('GET /api/schedules', () => {
    it('returns 400 when organizationId is missing', async () => {
      const response = await makeRequest('GET', '/api/schedules')
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Organization ID')
    })

    it('returns empty array when no schedules exist', async () => {
      const response = await makeRequest(
        'GET',
        `/api/schedules?organizationId=${testOrgId}`
      )
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
    })

    it('returns schedules for organization', async () => {
      // Create test schedules
      await prisma.schedule.create({
        data: {
          organizationId: testOrgId,
          type: 'meeting',
          title: 'Test Meeting',
          startTime: new Date('2026-03-20T10:00:00Z'),
          endTime: new Date('2026-03-20T11:00:00Z'),
          status: 'pending',
        },
      })

      await prisma.schedule.create({
        data: {
          organizationId: testOrgId,
          type: 'call',
          title: 'Test Call',
          startTime: new Date('2026-03-21T14:00:00Z'),
          endTime: new Date('2026-03-21T14:30:00Z'),
          status: 'completed',
          completedAt: new Date(),
        },
      })

      const response = await makeRequest(
        'GET',
        `/api/schedules?organizationId=${testOrgId}`
      )
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.data[0].title).toBe('Test Meeting')
      expect(data.data[1].title).toBe('Test Call')
    })

    it('filters by type', async () => {
      await prisma.schedule.create({
        data: {
          organizationId: testOrgId,
          type: 'meeting',
          title: 'Meeting 1',
          startTime: new Date('2026-03-20T10:00:00Z'),
          endTime: new Date('2026-03-20T11:00:00Z'),
          status: 'pending',
        },
      })

      await prisma.schedule.create({
        data: {
          organizationId: testOrgId,
          type: 'task',
          title: 'Task 1',
          startTime: new Date('2026-03-21T10:00:00Z'),
          endTime: new Date('2026-03-21T18:00:00Z'),
          status: 'pending',
        },
      })

      const response = await makeRequest(
        'GET',
        `/api/schedules?organizationId=${testOrgId}&type=meeting`
      )
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).toHaveLength(1)
      expect(data.data[0].type).toBe('meeting')
    })

    it('filters by status', async () => {
      await prisma.schedule.create({
        data: {
          organizationId: testOrgId,
          type: 'meeting',
          title: 'Pending Meeting',
          startTime: new Date('2026-03-20T10:00:00Z'),
          endTime: new Date('2026-03-20T11:00:00Z'),
          status: 'pending',
        },
      })

      await prisma.schedule.create({
        data: {
          organizationId: testOrgId,
          type: 'call',
          title: 'Completed Call',
          startTime: new Date('2026-03-21T14:00:00Z'),
          endTime: new Date('2026-03-21T14:30:00Z'),
          status: 'completed',
          completedAt: new Date(),
        },
      })

      const response = await makeRequest(
        'GET',
        `/api/schedules?organizationId=${testOrgId}&status=pending`
      )
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).toHaveLength(1)
      expect(data.data[0].status).toBe('pending')
    })

    it('includes related contact and assignee data', async () => {
      await prisma.schedule.create({
        data: {
          organizationId: testOrgId,
          type: 'meeting',
          title: 'Meeting with Contact',
          startTime: new Date('2026-03-20T10:00:00Z'),
          endTime: new Date('2026-03-20T11:00:00Z'),
          status: 'pending',
          contactId: testContactId,
          assignedTo: testUserId,
        },
      })

      const response = await makeRequest(
        'GET',
        `/api/schedules?organizationId=${testOrgId}`
      )
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data[0].contact).toBeDefined()
      expect(data.data[0].contact.id).toBe(testContactId)
      expect(data.data[0].assignee).toBeDefined()
      expect(data.data[0].assignee.id).toBe(testUserId)
    })
  })

  describe('POST /api/schedules', () => {
    it('creates a new schedule', async () => {
      const scheduleData = {
        organizationId: testOrgId,
        type: 'meeting',
        title: 'New Meeting',
        description: 'Test description',
        startTime: '2026-03-20T10:00:00Z',
        endTime: '2026-03-20T11:00:00Z',
        location: 'Conference Room',
        contactId: testContactId,
        assignedTo: testUserId,
      }

      const response = await makeRequest('POST', '/api/schedules', scheduleData)
      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.title).toBe('New Meeting')
      expect(data.data.type).toBe('meeting')
      expect(data.data.status).toBe('pending')
    })

    it('returns 400 when required fields are missing', async () => {
      const scheduleData = {
        organizationId: testOrgId,
        // Missing type, title, startTime, endTime
      }

      const response = await makeRequest('POST', '/api/schedules', scheduleData)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    it('returns 400 for invalid schedule type', async () => {
      const scheduleData = {
        organizationId: testOrgId,
        type: 'invalid_type',
        title: 'Test',
        startTime: '2026-03-20T10:00:00Z',
        endTime: '2026-03-20T11:00:00Z',
      }

      const response = await makeRequest('POST', '/api/schedules', scheduleData)
      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/schedules/[id]', () => {
    it('returns a specific schedule', async () => {
      const schedule = await prisma.schedule.create({
        data: {
          organizationId: testOrgId,
          type: 'meeting',
          title: 'Specific Meeting',
          startTime: new Date('2026-03-20T10:00:00Z'),
          endTime: new Date('2026-03-20T11:00:00Z'),
          status: 'pending',
        },
      })

      const response = await makeRequest(
        'GET',
        `/api/schedules/${schedule.id}?organizationId=${testOrgId}`
      )
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(schedule.id)
      expect(data.data.title).toBe('Specific Meeting')
    })

    it('returns 404 for non-existent schedule', async () => {
      const response = await makeRequest(
        'GET',
        `/api/schedules/non-existent-id?organizationId=${testOrgId}`
      )
      expect(response.status).toBe(404)
    })
  })

  describe('PATCH /api/schedules/[id]', () => {
    it('updates a schedule', async () => {
      const schedule = await prisma.schedule.create({
        data: {
          organizationId: testOrgId,
          type: 'meeting',
          title: 'Original Title',
          startTime: new Date('2026-03-20T10:00:00Z'),
          endTime: new Date('2026-03-20T11:00:00Z'),
          status: 'pending',
        },
      })

      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
      }

      const response = await makeRequest(
        'PATCH',
        `/api/schedules/${schedule.id}`,
        updateData
      )
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.title).toBe('Updated Title')
      expect(data.data.description).toBe('Updated description')
    })

    it('returns 404 for non-existent schedule', async () => {
      const response = await makeRequest(
        'PATCH',
        '/api/schedules/non-existent-id',
        { title: 'New Title' }
      )
      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/schedules/[id]', () => {
    it('deletes a schedule', async () => {
      const schedule = await prisma.schedule.create({
        data: {
          organizationId: testOrgId,
          type: 'meeting',
          title: 'To Delete',
          startTime: new Date('2026-03-20T10:00:00Z'),
          endTime: new Date('2026-03-20T11:00:00Z'),
          status: 'pending',
        },
      })

      const response = await makeRequest(
        'DELETE',
        `/api/schedules/${schedule.id}`
      )
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)

      // Verify deletion
      const deleted = await prisma.schedule.findUnique({
        where: { id: schedule.id },
      })
      expect(deleted).toBeNull()
    })

    it('returns 404 for non-existent schedule', async () => {
      const response = await makeRequest(
        'DELETE',
        '/api/schedules/non-existent-id'
      )
      expect(response.status).toBe(404)
    })
  })

  describe('PATCH /api/schedules/[id]/complete', () => {
    it('marks schedule as completed', async () => {
      const schedule = await prisma.schedule.create({
        data: {
          organizationId: testOrgId,
          type: 'meeting',
          title: 'To Complete',
          startTime: new Date('2026-03-20T10:00:00Z'),
          endTime: new Date('2026-03-20T11:00:00Z'),
          status: 'pending',
        },
      })

      const response = await makeRequest(
        'PATCH',
        `/api/schedules/${schedule.id}/complete`
      )
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.status).toBe('completed')
      expect(data.data.completedAt).toBeDefined()
    })

    it('returns error for already completed schedule', async () => {
      const schedule = await prisma.schedule.create({
        data: {
          organizationId: testOrgId,
          type: 'call',
          title: 'Already Completed',
          startTime: new Date('2026-03-20T10:00:00Z'),
          endTime: new Date('2026-03-20T10:30:00Z'),
          status: 'completed',
          completedAt: new Date(),
        },
      })

      const response = await makeRequest(
        'PATCH',
        `/api/schedules/${schedule.id}/complete`
      )
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('já está concluído')
    })
  })
})
