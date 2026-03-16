import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST, PATCH } from '@/app/api/dashboard/ai-insights/route'

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    aiInsight: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    deal: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    contact: { count: vi.fn() },
    conversation: { count: vi.fn() },
    subscription: { count: vi.fn() },
  },
}))

import { prisma } from '@/lib/prisma'

const createMockRequest = (url: string, options: RequestInit = {}) => {
  return new Request(url, options) as any
}

describe('GET /api/dashboard/ai-insights', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return AI insights for organization', async () => {
    const mockAiInsights = [
      {
        id: 'insight-1',
        type: 'PREDICTION',
        category: 'conversion',
        title: 'Previsão de Conversão',
        description: 'Lead tem alta probabilidade de conversão',
        value: '85%',
        confidence: 0.92,
        action: 'Entrar em contato',
        actionUrl: '/contacts/123',
        relatedContactIds: ['contact-1'],
        relatedDealIds: [],
        status: 'ACTIVE',
        createdAt: new Date('2026-03-01'),
        expiresAt: null,
      },
      {
        id: 'insight-2',
        type: 'ALERT',
        category: 'pipeline',
        title: 'Deal parado',
        description: 'Deal não tem atividade há 30 dias',
        value: null,
        confidence: 0.85,
        action: 'Ver deal',
        actionUrl: '/deals/456',
        relatedContactIds: [],
        relatedDealIds: ['deal-1'],
        status: 'ACTIVE',
        createdAt: new Date('2026-03-05'),
        expiresAt: null,
      },
    ]

    vi.mocked(prisma.aiInsight.findMany).mockResolvedValue(mockAiInsights)
    vi.mocked(prisma.deal.findMany).mockResolvedValue([])
    vi.mocked(prisma.contact.count).mockResolvedValue(0)
    vi.mocked(prisma.conversation.count).mockResolvedValue(0)
    vi.mocked(prisma.deal.count).mockResolvedValue(0)
    vi.mocked(prisma.subscription.count).mockResolvedValue(0)

    const request = createMockRequest('http://localhost:3000/api/dashboard/ai-insights?organizationId=org-123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.insights).toBeInstanceOf(Array)
    expect(data.data.insights.length).toBeGreaterThanOrEqual(0)
  })

  it('should require organizationId', async () => {
    const request = createMockRequest('http://localhost:3000/api/dashboard/ai-insights')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('organizationId')
  })

  it('should apply limit parameter', async () => {
    vi.mocked(prisma.aiInsight.findMany).mockResolvedValue([])
    vi.mocked(prisma.deal.findMany).mockResolvedValue([])
    vi.mocked(prisma.contact.count).mockResolvedValue(0)
    vi.mocked(prisma.conversation.count).mockResolvedValue(0)
    vi.mocked(prisma.deal.count).mockResolvedValue(0)
    vi.mocked(prisma.subscription.count).mockResolvedValue(0)

    const request = createMockRequest('http://localhost:3000/api/dashboard/ai-insights?organizationId=org-123&limit=5')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(prisma.aiInsight.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 })
    )
  })

  it('should filter only active insights', async () => {
    vi.mocked(prisma.aiInsight.findMany).mockResolvedValue([])
    vi.mocked(prisma.deal.findMany).mockResolvedValue([])
    vi.mocked(prisma.contact.count).mockResolvedValue(0)
    vi.mocked(prisma.conversation.count).mockResolvedValue(0)
    vi.mocked(prisma.deal.count).mockResolvedValue(0)
    vi.mocked(prisma.subscription.count).mockResolvedValue(0)

    const request = createMockRequest('http://localhost:3000/api/dashboard/ai-insights?organizationId=org-123')
    await GET(request)

    expect(prisma.aiInsight.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'ACTIVE',
        }),
      })
    )
  })

  it('should generate stale deals insight when deals are inactive', async () => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 35)

    vi.mocked(prisma.deal.findMany).mockResolvedValue([
      { id: 'deal-1', contact: { name: 'Client A' }, stage: { name: 'Proposal' } },
      { id: 'deal-2', contact: { name: 'Client B' }, stage: { name: 'Negotiation' } },
      { id: 'deal-3', contact: { name: 'Client C' }, stage: { name: 'Proposal' } },
    ])

    vi.mocked(prisma.aiInsight.findMany).mockResolvedValue([])
    vi.mocked(prisma.contact.count).mockResolvedValue(0)
    vi.mocked(prisma.conversation.count).mockResolvedValue(0)
    vi.mocked(prisma.deal.count).mockResolvedValue(0)
    vi.mocked(prisma.subscription.count).mockResolvedValue(0)

    const request = createMockRequest('http://localhost:3000/api/dashboard/ai-insights?organizationId=org-123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    const staleInsight = data.data.insights.find((i: any) => i.type === 'alert' && i.title.includes('inativos'))
    expect(staleInsight).toBeDefined()
    expect(staleInsight.priority).toBe('high') // > 5 deals = high priority
  })

  it('should generate revenue growth insight when revenue increases', async () => {
    vi.mocked(prisma.aiInsight.findMany).mockResolvedValue([])
    vi.mocked(prisma.deal.findMany)
      .mockResolvedValueOnce([]) // stale deals
      .mockResolvedValueOnce([   // current month deals
        { amount: 50000 },
        { amount: 40000 },
      ])
      .mockResolvedValueOnce([   // last month deals
        { amount: 20000 },
      ])
    vi.mocked(prisma.contact.count).mockResolvedValue(0)
    vi.mocked(prisma.conversation.count).mockResolvedValue(0)
    vi.mocked(prisma.deal.count).mockResolvedValue(0)
    vi.mocked(prisma.subscription.count).mockResolvedValue(0)

    const request = createMockRequest('http://localhost:3000/api/dashboard/ai-insights?organizationId=org-123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    // Growth > 20% should trigger insight
  })

  it('should generate new contacts insight when many contacts added', async () => {
    vi.mocked(prisma.aiInsight.findMany).mockResolvedValue([])
    vi.mocked(prisma.deal.findMany).mockResolvedValue([])
    vi.mocked(prisma.contact.count).mockResolvedValue(15) // > 10 new contacts
    vi.mocked(prisma.conversation.count).mockResolvedValue(0)
    vi.mocked(prisma.deal.count).mockResolvedValue(0)
    vi.mocked(prisma.subscription.count).mockResolvedValue(0)

    const request = createMockRequest('http://localhost:3000/api/dashboard/ai-insights?organizationId=org-123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    const contactsInsight = data.data.insights.find((i: any) => i.title.includes('contatos'))
    expect(contactsInsight).toBeDefined()
  })

  it('should handle database errors gracefully', async () => {
    vi.mocked(prisma.aiInsight.findMany).mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('http://localhost:3000/api/dashboard/ai-insights?organizationId=org-123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Erro interno')
  })
})

describe('POST /api/dashboard/ai-insights', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a new AI insight', async () => {
    const newInsight = {
      id: 'insight-new',
      organizationId: 'org-123',
      type: 'PREDICTION',
      category: 'conversion',
      title: 'Nova Previsão',
      description: 'Descrição da previsão',
      value: '75%',
      confidence: 0.85,
      action: 'Ação recomendada',
      actionUrl: '/contacts/123',
      metadata: { key: 'value' },
      status: 'ACTIVE',
      createdAt: new Date(),
    }

    vi.mocked(prisma.aiInsight.create).mockResolvedValue(newInsight)

    const request = createMockRequest('http://localhost:3000/api/dashboard/ai-insights', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-123',
        type: 'PREDICTION',
        category: 'conversion',
        title: 'Nova Previsão',
        description: 'Descrição da previsão',
        value: '75%',
        confidence: 0.85,
        action: 'Ação recomendada',
        actionUrl: '/contacts/123',
        metadata: { key: 'value' },
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.title).toBe('Nova Previsão')
  })

  it('should require organizationId, type, title and description', async () => {
    const request = createMockRequest('http://localhost:3000/api/dashboard/ai-insights', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-123',
        // Missing type, title, description
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('obrigatórios')
  })

  it('should use default confidence when not provided', async () => {
    const newInsight = {
      id: 'insight-new',
      organizationId: 'org-123',
      type: 'RECOMMENDATION',
      category: 'pipeline',
      title: 'Recomendação',
      description: 'Descrição',
      confidence: 0.85, // Default value
      status: 'ACTIVE',
      createdAt: new Date(),
    }

    vi.mocked(prisma.aiInsight.create).mockResolvedValue(newInsight)

    const request = createMockRequest('http://localhost:3000/api/dashboard/ai-insights', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-123',
        type: 'RECOMMENDATION',
        category: 'pipeline',
        title: 'Recomendação',
        description: 'Descrição',
        // No confidence provided
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(prisma.aiInsight.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          confidence: 0.85,
        }),
      })
    )
  })

  it('should handle database errors during creation', async () => {
    vi.mocked(prisma.aiInsight.create).mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('http://localhost:3000/api/dashboard/ai-insights', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-123',
        type: 'ALERT',
        title: 'Alerta',
        description: 'Descrição do alerta',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
  })
})

describe('PATCH /api/dashboard/ai-insights', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update insight status to DISMISSED', async () => {
    const updatedInsight = {
      id: 'insight-1',
      status: 'DISMISSED',
      dismissedAt: new Date(),
    }

    vi.mocked(prisma.aiInsight.update).mockResolvedValue(updatedInsight)

    const request = createMockRequest('http://localhost:3000/api/dashboard/ai-insights', {
      method: 'PATCH',
      body: JSON.stringify({
        id: 'insight-1',
        status: 'DISMISSED',
      }),
    })

    const response = await PATCH(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(prisma.aiInsight.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'insight-1' },
        data: expect.objectContaining({
          status: 'DISMISSED',
          dismissedAt: expect.any(Date),
        }),
      })
    )
  })

  it('should update insight status to ARCHIVED', async () => {
    const updatedInsight = {
      id: 'insight-1',
      status: 'ARCHIVED',
    }

    vi.mocked(prisma.aiInsight.update).mockResolvedValue(updatedInsight)

    const request = createMockRequest('http://localhost:3000/api/dashboard/ai-insights', {
      method: 'PATCH',
      body: JSON.stringify({
        id: 'insight-1',
        status: 'ARCHIVED',
      }),
    })

    const response = await PATCH(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.status).toBe('ARCHIVED')
  })

  it('should require id and status', async () => {
    const request = createMockRequest('http://localhost:3000/api/dashboard/ai-insights', {
      method: 'PATCH',
      body: JSON.stringify({
        id: 'insight-1',
        // Missing status
      }),
    })

    const response = await PATCH(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('id e status')
  })

  it('should handle database errors during update', async () => {
    vi.mocked(prisma.aiInsight.update).mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('http://localhost:3000/api/dashboard/ai-insights', {
      method: 'PATCH',
      body: JSON.stringify({
        id: 'insight-1',
        status: 'DISMISSED',
      }),
    })

    const response = await PATCH(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
  })

  it('should handle not found error during update', async () => {
    vi.mocked(prisma.aiInsight.update).mockRejectedValue({ code: 'P2025' }) // Prisma not found error

    const request = createMockRequest('http://localhost:3000/api/dashboard/ai-insights', {
      method: 'PATCH',
      body: JSON.stringify({
        id: 'non-existent',
        status: 'DISMISSED',
      }),
    })

    const response = await PATCH(request)
    expect(response.status).toBe(500)
  })
})
