import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/dashboard/metrics/route'

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    contact: { count: vi.fn() },
    conversation: { count: vi.fn() },
    message: { count: vi.fn() },
    deal: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    invoice: { findMany: vi.fn() },
    subscription: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const createMockRequest = (url: string) => {
  return new Request(url) as any
}

describe('GET /api/dashboard/metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return dashboard metrics for organization', async () => {
    // Mock contact counts
    vi.mocked(prisma.contact.count)
      .mockResolvedValueOnce(150) // totalContacts
      .mockResolvedValueOnce(25)  // newThisMonth
      .mockResolvedValueOnce(20)  // lastMonthContacts
      .mockResolvedValueOnce(10)  // periodContacts

    // Mock conversation counts
    vi.mocked(prisma.conversation.count)
      .mockResolvedValueOnce(80)  // totalConversations
      .mockResolvedValueOnce(15)  // activeConversations
      .mockResolvedValueOnce(10)  // periodConversations

    // Mock message count
    vi.mocked(prisma.message.count).mockResolvedValueOnce(5)

    // Mock deal counts and data
    vi.mocked(prisma.deal.count)
      .mockResolvedValueOnce(50)  // totalDeals
      .mockResolvedValueOnce(10)  // lostDeals
      .mockResolvedValueOnce(5)   // periodDeals

    vi.mocked(prisma.deal.findMany)
      .mockResolvedValueOnce([    // openDeals
        { amount: 5000 },
        { amount: 7500 },
        { amount: 3000 },
      ])
      .mockResolvedValueOnce([    // wonDeals
        { amount: 10000 },
        { amount: 15000 },
      ])
      .mockResolvedValueOnce([    // periodWonDeals
        { amount: 5000 },
      ])

    // Mock invoices
    vi.mocked(prisma.invoice.findMany)
      .mockResolvedValueOnce([    // monthlyInvoices
        { amountCents: 50000 },
        { amountCents: 75000 },
      ])
      .mockResolvedValueOnce([    // lastMonthInvoices
        { amountCents: 40000 },
      ])

    // Mock subscriptions
    vi.mocked(prisma.subscription.findMany).mockResolvedValueOnce([
      { plan: { priceCents: 9900 } },
      { plan: { priceCents: 19900 } },
    ])

    vi.mocked(prisma.subscription.count)
      .mockResolvedValueOnce(2)   // activeSubsCount
      .mockResolvedValueOnce(1)   // canceledInPeriod
      .mockResolvedValueOnce(10)  // totalSubsInPeriod

    const request = createMockRequest('http://localhost:3000/api/dashboard/metrics?organizationId=org-123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('contacts')
    expect(data.data).toHaveProperty('conversations')
    expect(data.data).toHaveProperty('pipeline')
    expect(data.data).toHaveProperty('revenue')
    expect(data.data).toHaveProperty('subscriptions')
    expect(data.data.contacts.total).toBe(150)
    expect(data.data.contacts.newThisMonth).toBe(25)
    expect(data.data.conversations.total).toBe(80)
    expect(data.data.pipeline.totalDeals).toBe(50)
  })

  it('should handle different periods (7d, 30d, 90d)', async () => {
    // Setup mocks
    vi.mocked(prisma.contact.count)
      .mockResolvedValue(100)
    vi.mocked(prisma.conversation.count)
      .mockResolvedValue(50)
    vi.mocked(prisma.message.count)
      .mockResolvedValue(5)
    vi.mocked(prisma.deal.count)
      .mockResolvedValue(20)
    vi.mocked(prisma.deal.findMany)
      .mockResolvedValue([])
    vi.mocked(prisma.invoice.findMany)
      .mockResolvedValue([])
    vi.mocked(prisma.subscription.findMany)
      .mockResolvedValue([])
    vi.mocked(prisma.subscription.count)
      .mockResolvedValue(0)

    // Test 7d period
    const request7d = createMockRequest('http://localhost:3000/api/dashboard/metrics?organizationId=org-123&period=7d')
    const response7d = await GET(request7d)
    const data7d = await response7d.json()

    expect(response7d.status).toBe(200)
    expect(data7d.data.period).toBe('7d')

    // Test 30d period
    const request30d = createMockRequest('http://localhost:3000/api/dashboard/metrics?organizationId=org-123&period=30d')
    const response30d = await GET(request30d)
    const data30d = await response30d.json()

    expect(response30d.status).toBe(200)
    expect(data30d.data.period).toBe('30d')

    // Test 90d period
    const request90d = createMockRequest('http://localhost:3000/api/dashboard/metrics?organizationId=org-123&period=90d')
    const response90d = await GET(request90d)
    const data90d = await response90d.json()

    expect(response90d.status).toBe(200)
    expect(data90d.data.period).toBe('90d')
  })

  it('should return 400 when organizationId is missing', async () => {
    const request = createMockRequest('http://localhost:3000/api/dashboard/metrics')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('organizationId')
  })

  it('should return 400 for invalid period', async () => {
    const request = createMockRequest('http://localhost:3000/api/dashboard/metrics?organizationId=org-123&period=invalid')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Período inválido')
  })

  it('should calculate revenue growth correctly', async () => {
    // Setup minimal mocks
    vi.mocked(prisma.contact.count).mockResolvedValue(0)
    vi.mocked(prisma.conversation.count).mockResolvedValue(0)
    vi.mocked(prisma.message.count).mockResolvedValue(0)
    vi.mocked(prisma.deal.count).mockResolvedValue(0)
    vi.mocked(prisma.deal.findMany).mockResolvedValue([])
    vi.mocked(prisma.subscription.findMany).mockResolvedValue([])
    vi.mocked(prisma.subscription.count).mockResolvedValue(0)

    // Current month: 15000 cents = 150 reais
    // Last month: 10000 cents = 100 reais
    // Growth: (150 - 100) / 100 = 50%
    vi.mocked(prisma.invoice.findMany)
      .mockResolvedValueOnce([
        { amountCents: 10000 },
        { amountCents: 5000 },
      ])
      .mockResolvedValueOnce([
        { amountCents: 10000 },
      ])

    const request = createMockRequest('http://localhost:3000/api/dashboard/metrics?organizationId=org-123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.revenue.monthly).toBe(150)
    expect(data.data.revenue.lastMonth).toBe(100)
    expect(data.data.revenue.growth).toBe(50)
  })

  it('should calculate win rate correctly', async () => {
    vi.mocked(prisma.contact.count).mockResolvedValue(0)
    vi.mocked(prisma.conversation.count).mockResolvedValue(0)
    vi.mocked(prisma.message.count).mockResolvedValue(0)
    vi.mocked(prisma.deal.count)
      .mockResolvedValueOnce(10)  // totalDeals
      .mockResolvedValueOnce(3)   // lostDeals
      .mockResolvedValueOnce(0)   // periodDeals
    vi.mocked(prisma.deal.findMany)
      .mockResolvedValueOnce([])  // openDeals
      .mockResolvedValueOnce([    // wonDeals (7)
        { amount: 1000 }, { amount: 2000 }, { amount: 3000 },
        { amount: 4000 }, { amount: 5000 }, { amount: 6000 }, { amount: 7000 },
      ])
      .mockResolvedValueOnce([])  // periodWonDeals
    vi.mocked(prisma.invoice.findMany).mockResolvedValue([])
    vi.mocked(prisma.subscription.findMany).mockResolvedValue([])
    vi.mocked(prisma.subscription.count).mockResolvedValue(0)

    const request = createMockRequest('http://localhost:3000/api/dashboard/metrics?organizationId=org-123')
    const response = await GET(request)
    const data = await response.json()

    // 7 won / (7 won + 3 lost) = 70% win rate
    expect(data.data.pipeline.winRate).toBe(70)
  })

  it('should handle database errors gracefully', async () => {
    vi.mocked(prisma.contact.count).mockRejectedValue(new Error('Database connection failed'))

    const request = createMockRequest('http://localhost:3000/api/dashboard/metrics?organizationId=org-123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Erro interno')
  })

  it('should calculate average deal value correctly', async () => {
    vi.mocked(prisma.contact.count).mockResolvedValue(0)
    vi.mocked(prisma.conversation.count).mockResolvedValue(0)
    vi.mocked(prisma.message.count).mockResolvedValue(0)
    vi.mocked(prisma.deal.count).mockResolvedValue(5)
    vi.mocked(prisma.deal.findMany)
      .mockResolvedValueOnce([    // openDeals
        { amount: 10000 },
        { amount: 20000 },
        { amount: 30000 },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
    vi.mocked(prisma.invoice.findMany).mockResolvedValue([])
    vi.mocked(prisma.subscription.findMany).mockResolvedValue([])
    vi.mocked(prisma.subscription.count).mockResolvedValue(0)

    const request = createMockRequest('http://localhost:3000/api/dashboard/metrics?organizationId=org-123')
    const response = await GET(request)
    const data = await response.json()

    // (10000 + 20000 + 30000) / 3 = 20000
    expect(data.data.pipeline.avgDealValue).toBe(20000)
  })

  it('should calculate contacts growth correctly', async () => {
    vi.mocked(prisma.contact.count)
      .mockResolvedValueOnce(100)  // totalContacts
      .mockResolvedValueOnce(30)   // newThisMonth
      .mockResolvedValueOnce(20)   // lastMonthContacts (30-20)/20 = 50%
      .mockResolvedValueOnce(0)
    vi.mocked(prisma.conversation.count).mockResolvedValue(0)
    vi.mocked(prisma.message.count).mockResolvedValue(0)
    vi.mocked(prisma.deal.count).mockResolvedValue(0)
    vi.mocked(prisma.deal.findMany).mockResolvedValue([])
    vi.mocked(prisma.invoice.findMany).mockResolvedValue([])
    vi.mocked(prisma.subscription.findMany).mockResolvedValue([])
    vi.mocked(prisma.subscription.count).mockResolvedValue(0)

    const request = createMockRequest('http://localhost:3000/api/dashboard/metrics?organizationId=org-123')
    const response = await GET(request)
    const data = await response.json()

    expect(data.data.contacts.growth).toBe(50)
  })

  it('should handle zero values gracefully', async () => {
    vi.mocked(prisma.contact.count).mockResolvedValue(0)
    vi.mocked(prisma.conversation.count).mockResolvedValue(0)
    vi.mocked(prisma.message.count).mockResolvedValue(0)
    vi.mocked(prisma.deal.count).mockResolvedValue(0)
    vi.mocked(prisma.deal.findMany).mockResolvedValue([])
    vi.mocked(prisma.invoice.findMany).mockResolvedValue([])
    vi.mocked(prisma.subscription.findMany).mockResolvedValue([])
    vi.mocked(prisma.subscription.count).mockResolvedValue(0)

    const request = createMockRequest('http://localhost:3000/api/dashboard/metrics?organizationId=org-123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.contacts.total).toBe(0)
    expect(data.data.contacts.growth).toBe(0)
    expect(data.data.pipeline.winRate).toBe(0)
    expect(data.data.pipeline.avgDealValue).toBe(0)
  })
})
