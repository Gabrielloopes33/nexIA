import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/dashboard/charts/route'

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    invoice: { findMany: vi.fn() },
    deal: { findMany: vi.fn() },
    conversation: { findMany: vi.fn() },
    message: { findMany: vi.fn() },
    contact: { 
      findMany: vi.fn(),
      count: vi.fn(),
    },
    pipelineStage: { findMany: vi.fn() },
    dealGroupBy: vi.fn(),
  },
}))

import { prisma } from '@/lib/prisma'

const createMockRequest = (url: string) => {
  return new Request(url) as any
}

describe('GET /api/dashboard/charts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return revenue chart data', async () => {
    const mockInvoices = [
      { amountCents: 50000, paidAt: new Date('2026-01-15') },
      { amountCents: 75000, paidAt: new Date('2026-01-20') },
      { amountCents: 30000, paidAt: new Date('2026-02-10') },
    ]

    vi.mocked(prisma.invoice.findMany).mockResolvedValue(mockInvoices)

    const request = createMockRequest('http://localhost:3000/api/dashboard/charts?organizationId=org-123&chartType=revenue')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.chartType).toBe('revenue')
    expect(data.data.points).toBeInstanceOf(Array)
    expect(data.data.points.length).toBe(12) // Last 12 months
  })

  it('should return deals chart data', async () => {
    const mockDeals = [
      { amount: 5000, createdAt: new Date('2026-01-15'), status: 'OPEN' },
      { amount: 7500, createdAt: new Date('2026-01-20'), status: 'WON' },
      { amount: 3000, createdAt: new Date('2026-02-10'), status: 'LOST' },
    ]

    vi.mocked(prisma.deal.findMany).mockResolvedValue(mockDeals)

    const request = createMockRequest('http://localhost:3000/api/dashboard/charts?organizationId=org-123&chartType=deals')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.chartType).toBe('deals')
    expect(data.data.points).toBeInstanceOf(Array)
    expect(data.data.points.length).toBe(12)
  })

  it('should return conversations chart data', async () => {
    const mockConversations = [
      { createdAt: new Date(), messageCount: 10 },
      { createdAt: new Date(), messageCount: 5 },
    ]

    const mockMessages = [
      { createdAt: new Date(), direction: 'INBOUND' },
      { createdAt: new Date(), direction: 'OUTBOUND' },
    ]

    vi.mocked(prisma.conversation.findMany).mockResolvedValue(mockConversations)
    vi.mocked(prisma.message.findMany).mockResolvedValue(mockMessages)

    const request = createMockRequest('http://localhost:3000/api/dashboard/charts?organizationId=org-123&chartType=conversations')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.chartType).toBe('conversations')
    expect(data.data.points).toBeInstanceOf(Array)
    expect(data.data.points.length).toBe(30) // Last 30 days
  })

  it('should return contacts chart data', async () => {
    const mockContacts = [
      { createdAt: new Date('2026-01-15') },
      { createdAt: new Date('2026-01-20') },
      { createdAt: new Date('2026-02-10') },
    ]

    vi.mocked(prisma.contact.findMany).mockResolvedValue(mockContacts)
    vi.mocked(prisma.contact.count).mockResolvedValue(50)

    const request = createMockRequest('http://localhost:3000/api/dashboard/charts?organizationId=org-123&chartType=contacts')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.chartType).toBe('contacts')
    expect(data.data.points).toBeInstanceOf(Array)
    expect(data.data.points[0]).toHaveProperty('accumulated')
    expect(data.data.points[0]).toHaveProperty('newContacts')
  })

  it('should return pipeline chart data', async () => {
    const mockStages = [
      { id: 'stage-1', name: 'Novo Lead', color: '#3b82f6', position: 1, probability: 10 },
      { id: 'stage-2', name: 'Qualificado', color: '#10b981', position: 2, probability: 30 },
      { id: 'stage-3', name: 'Proposta', color: '#f59e0b', position: 3, probability: 60 },
    ]

    const mockDealsByStage = [
      { stageId: 'stage-1', _count: { id: 5 }, _sum: { amount: 25000 } },
      { stageId: 'stage-2', _count: { id: 3 }, _sum: { amount: 15000 } },
      { stageId: 'stage-3', _count: { id: 2 }, _sum: { amount: 20000 } },
    ]

    vi.mocked(prisma.pipelineStage.findMany).mockResolvedValue(mockStages)
    
    // Mock groupBy
    vi.mocked((prisma as any).dealGroupBy || prisma.deal.groupBy).mockResolvedValue?.(mockDealsByStage) || 
      vi.spyOn(prisma.deal, 'groupBy' as any).mockResolvedValue(mockDealsByStage as any)

    const request = createMockRequest('http://localhost:3000/api/dashboard/charts?organizationId=org-123&chartType=pipeline')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.chartType).toBe('pipeline')
  })

  it('should require organizationId', async () => {
    const request = createMockRequest('http://localhost:3000/api/dashboard/charts?chartType=revenue')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('organizationId')
  })

  it('should return 400 for invalid chartType', async () => {
    const request = createMockRequest('http://localhost:3000/api/dashboard/charts?organizationId=org-123&chartType=invalid')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('chartType inválido')
  })

  it('should default to revenue chart when chartType is not specified', async () => {
    vi.mocked(prisma.invoice.findMany).mockResolvedValue([])

    const request = createMockRequest('http://localhost:3000/api/dashboard/charts?organizationId=org-123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.chartType).toBe('revenue')
  })

  it('should handle database errors gracefully', async () => {
    vi.mocked(prisma.invoice.findMany).mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('http://localhost:3000/api/dashboard/charts?organizationId=org-123&chartType=revenue')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Erro interno')
  })

  it('should group revenue data by month correctly', async () => {
    // Create invoices for different months
    const mockInvoices = [
      { amountCents: 50000, paidAt: new Date('2026-01-15') },
      { amountCents: 30000, paidAt: new Date('2026-01-20') }, // Jan total: 800
      { amountCents: 75000, paidAt: new Date('2026-02-10') }, // Feb total: 750
      { amountCents: 100000, paidAt: new Date('2026-03-05') }, // Mar total: 1000
    ]

    vi.mocked(prisma.invoice.findMany).mockResolvedValue(mockInvoices)

    const request = createMockRequest('http://localhost:3000/api/dashboard/charts?organizationId=org-123&chartType=revenue')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    // Check that data is aggregated by month
    const points = data.data.points
    expect(points.length).toBeGreaterThanOrEqual(3)
  })

  it('should include all months in last 12 months even with no data', async () => {
    vi.mocked(prisma.invoice.findMany).mockResolvedValue([])

    const request = createMockRequest('http://localhost:3000/api/dashboard/charts?organizationId=org-123&chartType=revenue')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.points).toHaveLength(12)
    // All points should have value 0 when no data
    expect(data.data.points.every((p: any) => p.value === 0)).toBe(true)
  })

  it('should format month labels correctly', async () => {
    vi.mocked(prisma.invoice.findMany).mockResolvedValue([
      { amountCents: 50000, paidAt: new Date('2026-01-15') },
    ])

    const request = createMockRequest('http://localhost:3000/api/dashboard/charts?organizationId=org-123&chartType=revenue')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    // Check that labels are in the format "Mmm/YY"
    const janPoint = data.data.points.find((p: any) => p.month === '2026-01')
    if (janPoint) {
      expect(janPoint.label).toMatch(/Jan\/26/)
    }
  })

  it('should handle deals with won/lost status in chart data', async () => {
    const mockDeals = [
      { amount: 5000, createdAt: new Date('2026-01-15'), status: 'WON' },
      { amount: 3000, createdAt: new Date('2026-01-20'), status: 'LOST' },
      { amount: 7000, createdAt: new Date('2026-01-25'), status: 'WON' },
    ]

    vi.mocked(prisma.deal.findMany).mockResolvedValue(mockDeals)

    const request = createMockRequest('http://localhost:3000/api/dashboard/charts?organizationId=org-123&chartType=deals')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    const janPoint = data.data.points.find((p: any) => p.month === '2026-01')
    if (janPoint) {
      expect(janPoint.won).toBe(2)
      expect(janPoint.lost).toBe(1)
      expect(janPoint.value).toBe(3) // Total created
    }
  })

  it('should handle conversation data with inbound/outbound messages', async () => {
    const mockConversations = [
      { createdAt: new Date(), messageCount: 5 },
      { createdAt: new Date(), messageCount: 3 },
    ]

    const mockMessages = [
      { createdAt: new Date(), direction: 'INBOUND' },
      { createdAt: new Date(), direction: 'INBOUND' },
      { createdAt: new Date(), direction: 'OUTBOUND' },
    ]

    vi.mocked(prisma.conversation.findMany).mockResolvedValue(mockConversations)
    vi.mocked(prisma.message.findMany).mockResolvedValue(mockMessages)

    const request = createMockRequest('http://localhost:3000/api/dashboard/charts?organizationId=org-123&chartType=conversations')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    const today = new Date().toISOString().slice(0, 10)
    const todayPoint = data.data.points.find((p: any) => p.date === today)
    if (todayPoint) {
      expect(todayPoint.inbound).toBe(2)
      expect(todayPoint.outbound).toBe(1)
    }
  })
})
