import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/subscriptions/route'

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    subscription: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    plan: {
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const createMockRequest = (url: string, options: RequestInit = {}) => {
  return new Request(url, options) as any
}

describe('GET /api/subscriptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return list of subscriptions for organization', async () => {
    const mockSubscriptions = [
      {
        id: 'sub-1',
        organizationId: 'org-123',
        planId: 'plan-1',
        status: 'active',
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        canceledAt: null,
        plan: {
          id: 'plan-1',
          name: 'Plano Básico',
          priceCents: 9900,
          interval: 'monthly',
        },
        invoices: [],
        _count: { invoices: 0 },
      },
    ]

    vi.mocked(prisma.subscription.findMany).mockResolvedValue(mockSubscriptions)
    vi.mocked(prisma.subscription.count).mockResolvedValue(1)

    const request = createMockRequest('http://localhost:3000/api/subscriptions?organizationId=org-123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(1)
    expect(data.data[0].organizationId).toBe('org-123')
    expect(data.data[0].plan.name).toBe('Plano Básico')
  })

  it('should return 400 when organizationId is missing', async () => {
    const request = createMockRequest('http://localhost:3000/api/subscriptions')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Organization ID is required')
  })

  it('should filter subscriptions by status', async () => {
    const mockSubscriptions = [
      {
        id: 'sub-2',
        organizationId: 'org-123',
        planId: 'plan-1',
        status: 'canceled',
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        canceledAt: new Date('2026-01-15'),
        plan: { id: 'plan-1', name: 'Plano Básico', priceCents: 9900, interval: 'monthly' },
        invoices: [],
        _count: { invoices: 0 },
      },
    ]

    vi.mocked(prisma.subscription.findMany).mockResolvedValue(mockSubscriptions)
    vi.mocked(prisma.subscription.count).mockResolvedValue(1)

    const request = createMockRequest('http://localhost:3000/api/subscriptions?organizationId=org-123&status=canceled')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data[0].status).toBe('canceled')
  })

  it('should handle pagination correctly', async () => {
    vi.mocked(prisma.subscription.findMany).mockResolvedValue([])
    vi.mocked(prisma.subscription.count).mockResolvedValue(100)

    const request = createMockRequest('http://localhost:3000/api/subscriptions?organizationId=org-123&limit=10&offset=20')
    const response = await GET(request)
    const data = await response.json()

    expect(data.pagination.limit).toBe(10)
    expect(data.pagination.offset).toBe(20)
    expect(data.pagination.hasMore).toBe(true)
  })

  it('should handle database errors', async () => {
    vi.mocked(prisma.subscription.findMany).mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('http://localhost:3000/api/subscriptions?organizationId=org-123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to fetch subscriptions')
  })
})

describe('POST /api/subscriptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a new subscription successfully', async () => {
    const mockPlan = {
      id: 'plan-1',
      name: 'Plano Básico',
      priceCents: 9900,
      interval: 'monthly',
      status: 'active',
    }

    const newSubscription = {
      id: 'sub-new',
      organizationId: 'org-123',
      planId: 'plan-1',
      status: 'active',
      currentPeriodStart: new Date('2026-03-01'),
      currentPeriodEnd: new Date('2026-04-01'),
      createdAt: new Date(),
      updatedAt: new Date(),
      canceledAt: null,
      plan: mockPlan,
    }

    vi.mocked(prisma.plan.findUnique).mockResolvedValue(mockPlan)
    vi.mocked(prisma.subscription.create).mockResolvedValue(newSubscription)

    const request = createMockRequest('http://localhost:3000/api/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-123',
        planId: 'plan-1',
        currentPeriodStart: '2026-03-01',
        currentPeriodEnd: '2026-04-01',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.organizationId).toBe('org-123')
    expect(data.data.planId).toBe('plan-1')
  })

  it('should return 400 when required fields are missing', async () => {
    const request = createMockRequest('http://localhost:3000/api/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Missing required fields')
  })

  it('should return 404 when plan does not exist', async () => {
    vi.mocked(prisma.plan.findUnique).mockResolvedValue(null)

    const request = createMockRequest('http://localhost:3000/api/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-123',
        planId: 'non-existent-plan',
        currentPeriodStart: '2026-03-01',
        currentPeriodEnd: '2026-04-01',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Plan not found')
  })

  it('should return 400 for invalid date format', async () => {
    // Mock plan exists
    const mockPlan = { id: 'plan-1', name: 'Plano Básico', status: 'active' }
    vi.mocked(prisma.plan.findUnique).mockResolvedValue(mockPlan)

    const request = createMockRequest('http://localhost:3000/api/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-123',
        planId: 'plan-1',
        currentPeriodStart: 'invalid-date',
        currentPeriodEnd: '2026-04-01',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Invalid date format')
  })

  it('should return 400 when end date is before start date', async () => {
    // Mock plan exists
    const mockPlan = { id: 'plan-1', name: 'Plano Básico', status: 'active' }
    vi.mocked(prisma.plan.findUnique).mockResolvedValue(mockPlan)

    const request = createMockRequest('http://localhost:3000/api/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-123',
        planId: 'plan-1',
        currentPeriodStart: '2026-04-01',
        currentPeriodEnd: '2026-03-01',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('currentPeriodEnd must be after currentPeriodStart')
  })

  it('should return 400 for invalid status', async () => {
    const mockPlan = { id: 'plan-1', name: 'Plano Básico', status: 'active' }
    vi.mocked(prisma.plan.findUnique).mockResolvedValue(mockPlan)

    const request = createMockRequest('http://localhost:3000/api/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-123',
        planId: 'plan-1',
        currentPeriodStart: '2026-03-01',
        currentPeriodEnd: '2026-04-01',
        status: 'invalid_status',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Invalid status')
  })

  it('should create subscription with default status active', async () => {
    const mockPlan = { id: 'plan-1', name: 'Plano Básico', status: 'active' }
    const newSubscription = {
      id: 'sub-new',
      organizationId: 'org-123',
      planId: 'plan-1',
      status: 'active',
      currentPeriodStart: new Date('2026-03-01'),
      currentPeriodEnd: new Date('2026-04-01'),
      createdAt: new Date(),
      updatedAt: new Date(),
      canceledAt: null,
      plan: mockPlan,
    }

    vi.mocked(prisma.plan.findUnique).mockResolvedValue(mockPlan)
    vi.mocked(prisma.subscription.create).mockResolvedValue(newSubscription)

    const request = createMockRequest('http://localhost:3000/api/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-123',
        planId: 'plan-1',
        currentPeriodStart: '2026-03-01',
        currentPeriodEnd: '2026-04-01',
      }),
    })

    await POST(request)

    expect(prisma.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'active',
        }),
      })
    )
  })

  it('should handle database errors during creation', async () => {
    vi.mocked(prisma.plan.findUnique).mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('http://localhost:3000/api/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-123',
        planId: 'plan-1',
        currentPeriodStart: '2026-03-01',
        currentPeriodEnd: '2026-04-01',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to create subscription')
  })
})
