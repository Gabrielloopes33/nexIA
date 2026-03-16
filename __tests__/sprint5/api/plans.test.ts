import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/plans/route'

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    plan: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const createMockRequest = (url: string, options: RequestInit = {}) => {
  return new Request(url, options) as any
}

describe('GET /api/plans', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return list of active plans', async () => {
    const mockPlans = [
      {
        id: 'plan-1',
        name: 'Plano Básico',
        description: 'Plano básico mensal',
        priceCents: 9900,
        interval: 'monthly',
        features: { contacts: 100, messages: 1000 },
        limits: { users: 1 },
        status: 'active',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      },
      {
        id: 'plan-2',
        name: 'Plano Pro',
        description: 'Plano profissional mensal',
        priceCents: 19900,
        interval: 'monthly',
        features: { contacts: 1000, messages: 10000 },
        limits: { users: 5 },
        status: 'active',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      },
    ]

    vi.mocked(prisma.plan.findMany).mockResolvedValue(mockPlans)
    vi.mocked(prisma.plan.count).mockResolvedValue(2)

    const request = createMockRequest('http://localhost:3000/api/plans')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(2)
    expect(data.data[0].name).toBe('Plano Básico')
    expect(data.pagination.total).toBe(2)
    expect(data.pagination.hasMore).toBe(false)
  })

  it('should filter plans by interval', async () => {
    const mockPlans = [
      {
        id: 'plan-3',
        name: 'Plano Anual',
        description: 'Plano anual com desconto',
        priceCents: 99900,
        interval: 'yearly',
        features: { contacts: 1000, messages: 10000 },
        limits: { users: 5 },
        status: 'active',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      },
    ]

    vi.mocked(prisma.plan.findMany).mockResolvedValue(mockPlans)
    vi.mocked(prisma.plan.count).mockResolvedValue(1)

    const request = createMockRequest('http://localhost:3000/api/plans?interval=yearly')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(1)
    expect(data.data[0].interval).toBe('yearly')
  })

  it('should handle pagination correctly', async () => {
    const mockPlans = [
      {
        id: 'plan-1',
        name: 'Plano Básico',
        description: null,
        priceCents: 9900,
        interval: 'monthly',
        features: {},
        limits: {},
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    vi.mocked(prisma.plan.findMany).mockResolvedValue(mockPlans)
    vi.mocked(prisma.plan.count).mockResolvedValue(10)

    const request = createMockRequest('http://localhost:3000/api/plans?limit=1&offset=0')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.pagination.limit).toBe(1)
    expect(data.pagination.offset).toBe(0)
    expect(data.pagination.hasMore).toBe(true)
  })

  it('should handle database errors', async () => {
    vi.mocked(prisma.plan.findMany).mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('http://localhost:3000/api/plans')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to fetch plans')
  })

  it('should return empty array when no plans exist', async () => {
    vi.mocked(prisma.plan.findMany).mockResolvedValue([])
    vi.mocked(prisma.plan.count).mockResolvedValue(0)

    const request = createMockRequest('http://localhost:3000/api/plans')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual([])
    expect(data.pagination.total).toBe(0)
  })
})

describe('POST /api/plans', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a new plan successfully', async () => {
    const newPlan = {
      id: 'plan-new',
      name: 'Novo Plano',
      description: 'Descrição do novo plano',
      priceCents: 29900,
      interval: 'monthly',
      features: { contacts: 5000, messages: 50000 },
      limits: { users: 10 },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    vi.mocked(prisma.plan.create).mockResolvedValue(newPlan)

    const request = createMockRequest('http://localhost:3000/api/plans', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Novo Plano',
        description: 'Descrição do novo plano',
        priceCents: 29900,
        interval: 'monthly',
        features: { contacts: 5000, messages: 50000 },
        limits: { users: 10 },
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.name).toBe('Novo Plano')
    expect(data.data.priceCents).toBe(29900)
  })

  it('should return 400 when required fields are missing', async () => {
    const request = createMockRequest('http://localhost:3000/api/plans', {
      method: 'POST',
      body: JSON.stringify({
        description: 'Plano sem nome',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Missing required fields')
  })

  it('should return 400 for invalid interval', async () => {
    const request = createMockRequest('http://localhost:3000/api/plans', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Plano Inválido',
        priceCents: 9900,
        interval: 'weekly',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Invalid interval')
  })

  it('should return 400 for negative price', async () => {
    const request = createMockRequest('http://localhost:3000/api/plans', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Plano Inválido',
        priceCents: -100,
        interval: 'monthly',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Invalid priceCents')
  })

  it('should handle database errors during creation', async () => {
    vi.mocked(prisma.plan.create).mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('http://localhost:3000/api/plans', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Plano Teste',
        priceCents: 9900,
        interval: 'monthly',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to create plan')
  })

  it('should create plan with default features and limits when not provided', async () => {
    const newPlan = {
      id: 'plan-default',
      name: 'Plano Simples',
      description: null,
      priceCents: 9900,
      interval: 'monthly',
      features: {},
      limits: {},
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    vi.mocked(prisma.plan.create).mockResolvedValue(newPlan)

    const request = createMockRequest('http://localhost:3000/api/plans', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Plano Simples',
        priceCents: 9900,
        interval: 'monthly',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(prisma.plan.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          features: {},
          limits: {},
        }),
      })
    )
  })
})
