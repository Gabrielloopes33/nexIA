import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/invoices/route'

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    invoice: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const createMockRequest = (url: string, options: RequestInit = {}) => {
  return new Request(url, options) as any
}

describe('GET /api/invoices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return list of invoices for organization', async () => {
    const mockInvoices = [
      {
        id: 'inv-1',
        subscriptionId: 'sub-1',
        organizationId: 'org-123',
        amountCents: 9900,
        status: 'pending',
        dueDate: new Date('2026-03-15'),
        paidAt: null,
        invoiceUrl: null,
        stripeInvoiceId: null,
        createdAt: new Date('2026-03-01'),
        updatedAt: new Date('2026-03-01'),
        subscription: {
          id: 'sub-1',
          plan: {
            id: 'plan-1',
            name: 'Plano Básico',
          },
        },
        charges: [],
        _count: { charges: 0 },
      },
      {
        id: 'inv-2',
        subscriptionId: 'sub-1',
        organizationId: 'org-123',
        amountCents: 9900,
        status: 'paid',
        dueDate: new Date('2026-02-15'),
        paidAt: new Date('2026-02-14'),
        invoiceUrl: 'https://invoice.url/2',
        stripeInvoiceId: 'in_stripe_2',
        createdAt: new Date('2026-02-01'),
        updatedAt: new Date('2026-02-14'),
        subscription: {
          id: 'sub-1',
          plan: {
            id: 'plan-1',
            name: 'Plano Básico',
          },
        },
        charges: [
          {
            id: 'charge-1',
            amountCents: 9900,
            status: 'paid',
            paidAt: new Date('2026-02-14'),
            paymentMethod: 'credit_card',
          },
        ],
        _count: { charges: 1 },
      },
    ]

    vi.mocked(prisma.invoice.findMany).mockResolvedValue(mockInvoices)
    vi.mocked(prisma.invoice.count).mockResolvedValue(2)

    const request = createMockRequest('http://localhost:3000/api/invoices?organizationId=org-123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(2)
    expect(data.data[0].organizationId).toBe('org-123')
    expect(data.data[0].subscription.plan.name).toBe('Plano Básico')
  })

  it('should return 400 when organizationId is missing', async () => {
    const request = createMockRequest('http://localhost:3000/api/invoices')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Organization ID is required')
  })

  it('should filter invoices by status', async () => {
    const mockInvoices = [
      {
        id: 'inv-1',
        subscriptionId: 'sub-1',
        organizationId: 'org-123',
        amountCents: 9900,
        status: 'pending',
        dueDate: new Date('2026-03-15'),
        paidAt: null,
        invoiceUrl: null,
        stripeInvoiceId: null,
        createdAt: new Date('2026-03-01'),
        updatedAt: new Date('2026-03-01'),
        subscription: {
          id: 'sub-1',
          plan: { id: 'plan-1', name: 'Plano Básico' },
        },
        charges: [],
        _count: { charges: 0 },
      },
    ]

    vi.mocked(prisma.invoice.findMany).mockResolvedValue(mockInvoices)
    vi.mocked(prisma.invoice.count).mockResolvedValue(1)

    const request = createMockRequest('http://localhost:3000/api/invoices?organizationId=org-123&status=pending')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toHaveLength(1)
    expect(data.data[0].status).toBe('pending')
  })

  it('should filter invoices by subscriptionId', async () => {
    const mockInvoices = [
      {
        id: 'inv-1',
        subscriptionId: 'sub-1',
        organizationId: 'org-123',
        amountCents: 9900,
        status: 'paid',
        dueDate: new Date('2026-03-15'),
        paidAt: new Date('2026-03-14'),
        invoiceUrl: null,
        stripeInvoiceId: null,
        createdAt: new Date('2026-03-01'),
        updatedAt: new Date('2026-03-14'),
        subscription: {
          id: 'sub-1',
          plan: { id: 'plan-1', name: 'Plano Básico' },
        },
        charges: [],
        _count: { charges: 0 },
      },
    ]

    vi.mocked(prisma.invoice.findMany).mockResolvedValue(mockInvoices)
    vi.mocked(prisma.invoice.count).mockResolvedValue(1)

    const request = createMockRequest('http://localhost:3000/api/invoices?organizationId=org-123&subscriptionId=sub-1')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data[0].subscriptionId).toBe('sub-1')
  })

  it('should handle pagination correctly', async () => {
    vi.mocked(prisma.invoice.findMany).mockResolvedValue([])
    vi.mocked(prisma.invoice.count).mockResolvedValue(50)

    const request = createMockRequest('http://localhost:3000/api/invoices?organizationId=org-123&limit=20&offset=40')
    const response = await GET(request)
    const data = await response.json()

    expect(data.pagination.limit).toBe(20)
    expect(data.pagination.offset).toBe(40)
    expect(data.pagination.hasMore).toBe(true)
  })

  it('should handle database errors', async () => {
    vi.mocked(prisma.invoice.findMany).mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('http://localhost:3000/api/invoices?organizationId=org-123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to fetch invoices')
  })

  it('should return invoices ordered by createdAt desc', async () => {
    const mockInvoices = [
      {
        id: 'inv-2',
        subscriptionId: 'sub-1',
        organizationId: 'org-123',
        amountCents: 9900,
        status: 'paid',
        dueDate: new Date('2026-03-15'),
        paidAt: new Date('2026-03-14'),
        invoiceUrl: null,
        stripeInvoiceId: null,
        createdAt: new Date('2026-03-01'),
        updatedAt: new Date('2026-03-14'),
        subscription: {
          id: 'sub-1',
          plan: { id: 'plan-1', name: 'Plano Básico' },
        },
        charges: [],
        _count: { charges: 0 },
      },
    ]

    vi.mocked(prisma.invoice.findMany).mockResolvedValue(mockInvoices)
    vi.mocked(prisma.invoice.count).mockResolvedValue(1)

    const request = createMockRequest('http://localhost:3000/api/invoices?organizationId=org-123')
    await GET(request)

    expect(prisma.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      })
    )
  })

  it('should return empty array when no invoices exist', async () => {
    vi.mocked(prisma.invoice.findMany).mockResolvedValue([])
    vi.mocked(prisma.invoice.count).mockResolvedValue(0)

    const request = createMockRequest('http://localhost:3000/api/invoices?organizationId=org-123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual([])
    expect(data.pagination.total).toBe(0)
    expect(data.pagination.hasMore).toBe(false)
  })
})
