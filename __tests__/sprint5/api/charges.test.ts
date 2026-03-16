import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/charges/route'

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    charge: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    invoice: {
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const createMockRequest = (url: string, options: RequestInit = {}) => {
  return new Request(url, options) as any
}

describe('GET /api/charges', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return list of charges for organization', async () => {
    const mockCharges = [
      {
        id: 'charge-1',
        organizationId: 'org-123',
        invoiceId: 'inv-1',
        amountCents: 9900,
        description: 'Pagamento mensal',
        status: 'paid',
        paymentMethod: 'credit_card',
        paidAt: new Date('2026-03-01'),
        createdAt: new Date('2026-03-01'),
        updatedAt: new Date('2026-03-01'),
        invoice: {
          id: 'inv-1',
          amountCents: 9900,
          status: 'paid',
          dueDate: new Date('2026-03-15'),
        },
      },
      {
        id: 'charge-2',
        organizationId: 'org-123',
        invoiceId: null,
        amountCents: 5000,
        description: 'Cobrança avulsa',
        status: 'pending',
        paymentMethod: null,
        paidAt: null,
        createdAt: new Date('2026-03-10'),
        updatedAt: new Date('2026-03-10'),
        invoice: null,
      },
    ]

    vi.mocked(prisma.charge.findMany).mockResolvedValue(mockCharges)
    vi.mocked(prisma.charge.count).mockResolvedValue(2)

    const request = createMockRequest('http://localhost:3000/api/charges?organizationId=org-123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(2)
    expect(data.data[0].organizationId).toBe('org-123')
    expect(data.data[0].invoice).toBeDefined()
  })

  it('should return 400 when organizationId is missing', async () => {
    const request = createMockRequest('http://localhost:3000/api/charges')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Organization ID is required')
  })

  it('should filter charges by status', async () => {
    const mockCharges = [
      {
        id: 'charge-1',
        organizationId: 'org-123',
        invoiceId: 'inv-1',
        amountCents: 9900,
        description: null,
        status: 'paid',
        paymentMethod: 'credit_card',
        paidAt: new Date('2026-03-01'),
        createdAt: new Date('2026-03-01'),
        updatedAt: new Date('2026-03-01'),
        invoice: {
          id: 'inv-1',
          amountCents: 9900,
          status: 'paid',
          dueDate: new Date('2026-03-15'),
        },
      },
    ]

    vi.mocked(prisma.charge.findMany).mockResolvedValue(mockCharges)
    vi.mocked(prisma.charge.count).mockResolvedValue(1)

    const request = createMockRequest('http://localhost:3000/api/charges?organizationId=org-123&status=paid')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toHaveLength(1)
    expect(data.data[0].status).toBe('paid')
  })

  it('should filter charges by invoiceId', async () => {
    const mockCharges = [
      {
        id: 'charge-1',
        organizationId: 'org-123',
        invoiceId: 'inv-1',
        amountCents: 9900,
        description: null,
        status: 'paid',
        paymentMethod: 'credit_card',
        paidAt: new Date('2026-03-01'),
        createdAt: new Date('2026-03-01'),
        updatedAt: new Date('2026-03-01'),
        invoice: {
          id: 'inv-1',
          amountCents: 9900,
          status: 'paid',
          dueDate: new Date('2026-03-15'),
        },
      },
    ]

    vi.mocked(prisma.charge.findMany).mockResolvedValue(mockCharges)
    vi.mocked(prisma.charge.count).mockResolvedValue(1)

    const request = createMockRequest('http://localhost:3000/api/charges?organizationId=org-123&invoiceId=inv-1')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data[0].invoiceId).toBe('inv-1')
  })

  it('should handle pagination correctly', async () => {
    vi.mocked(prisma.charge.findMany).mockResolvedValue([])
    vi.mocked(prisma.charge.count).mockResolvedValue(100)

    const request = createMockRequest('http://localhost:3000/api/charges?organizationId=org-123&limit=25&offset=50')
    const response = await GET(request)
    const data = await response.json()

    expect(data.pagination.limit).toBe(25)
    expect(data.pagination.offset).toBe(50)
    expect(data.pagination.hasMore).toBe(true)
  })

  it('should handle database errors', async () => {
    vi.mocked(prisma.charge.findMany).mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('http://localhost:3000/api/charges?organizationId=org-123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to fetch charges')
  })
})

describe('POST /api/charges', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a new charge successfully', async () => {
    const newCharge = {
      id: 'charge-new',
      organizationId: 'org-123',
      invoiceId: null,
      amountCents: 5000,
      description: 'Cobrança avulsa',
      status: 'pending',
      paymentMethod: null,
      paidAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      invoice: null,
    }

    vi.mocked(prisma.charge.create).mockResolvedValue(newCharge)

    const request = createMockRequest('http://localhost:3000/api/charges', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-123',
        amountCents: 5000,
        description: 'Cobrança avulsa',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.organizationId).toBe('org-123')
    expect(data.data.amountCents).toBe(5000)
    expect(data.data.status).toBe('pending')
  })

  it('should create charge linked to invoice', async () => {
    const mockInvoice = {
      id: 'inv-1',
      organizationId: 'org-123',
      amountCents: 9900,
      status: 'pending',
    }

    const newCharge = {
      id: 'charge-new',
      organizationId: 'org-123',
      invoiceId: 'inv-1',
      amountCents: 9900,
      description: 'Pagamento da fatura',
      status: 'pending',
      paymentMethod: null,
      paidAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      invoice: {
        id: 'inv-1',
        amountCents: 9900,
        status: 'pending',
        dueDate: new Date('2026-03-15'),
      },
    }

    vi.mocked(prisma.invoice.findUnique).mockResolvedValue(mockInvoice)
    vi.mocked(prisma.charge.create).mockResolvedValue(newCharge)

    const request = createMockRequest('http://localhost:3000/api/charges', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-123',
        invoiceId: 'inv-1',
        amountCents: 9900,
        description: 'Pagamento da fatura',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.data.invoiceId).toBe('inv-1')
  })

  it('should return 400 when required fields are missing', async () => {
    const request = createMockRequest('http://localhost:3000/api/charges', {
      method: 'POST',
      body: JSON.stringify({
        description: 'Cobrança sem valor',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Missing required fields')
  })

  it('should return 400 for invalid amount', async () => {
    const request = createMockRequest('http://localhost:3000/api/charges', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-123',
        amountCents: -100,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Invalid amountCents')
  })

  it('should return 400 for zero amount', async () => {
    const request = createMockRequest('http://localhost:3000/api/charges', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-123',
        amountCents: 0,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Invalid amountCents')
  })

  it('should return 400 for invalid status', async () => {
    const request = createMockRequest('http://localhost:3000/api/charges', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-123',
        amountCents: 5000,
        status: 'invalid_status',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Invalid status')
  })

  it('should return 404 when invoice does not exist', async () => {
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue(null)

    const request = createMockRequest('http://localhost:3000/api/charges', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-123',
        invoiceId: 'non-existent-invoice',
        amountCents: 5000,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invoice not found')
  })

  it('should return 400 when invoice belongs to different organization', async () => {
    const mockInvoice = {
      id: 'inv-1',
      organizationId: 'org-different',
      amountCents: 9900,
      status: 'pending',
    }

    vi.mocked(prisma.invoice.findUnique).mockResolvedValue(mockInvoice)

    const request = createMockRequest('http://localhost:3000/api/charges', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-123',
        invoiceId: 'inv-1',
        amountCents: 5000,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Invoice does not belong to this organization')
  })

  it('should set paidAt when status is paid', async () => {
    const newCharge = {
      id: 'charge-paid',
      organizationId: 'org-123',
      invoiceId: null,
      amountCents: 5000,
      description: 'Cobrança paga',
      status: 'paid',
      paymentMethod: 'credit_card',
      paidAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      invoice: null,
    }

    vi.mocked(prisma.charge.create).mockResolvedValue(newCharge)

    const request = createMockRequest('http://localhost:3000/api/charges', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-123',
        amountCents: 5000,
        description: 'Cobrança paga',
        status: 'paid',
        paymentMethod: 'credit_card',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.data.status).toBe('paid')
    expect(data.data.paidAt).toBeDefined()
  })

  it('should handle database errors during creation', async () => {
    vi.mocked(prisma.charge.create).mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('http://localhost:3000/api/charges', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-123',
        amountCents: 5000,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to create charge')
  })
})
