import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/coupons/route'

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    coupon: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const createMockRequest = (url: string, options: RequestInit = {}) => {
  return new Request(url, options) as any
}

describe('GET /api/coupons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return list of active coupons', async () => {
    const now = new Date()
    const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago

    const mockCoupons = [
      {
        id: 'coupon-1',
        code: 'DESCONTO10',
        name: 'Desconto 10%',
        description: '10% de desconto na primeira assinatura',
        discountPercent: 10,
        discountCents: null,
        validFrom: past,
        validUntil: future,
        maxUses: 100,
        usesCount: 50,
        status: 'active',
        createdAt: past,
        updatedAt: past,
      },
      {
        id: 'coupon-2',
        code: 'BEMVINDO',
        name: 'Cupom de Boas-vindas',
        description: 'R$ 50 de desconto',
        discountPercent: null,
        discountCents: 5000,
        validFrom: past,
        validUntil: future,
        maxUses: null,
        usesCount: 25,
        status: 'active',
        createdAt: past,
        updatedAt: past,
      },
    ]

    vi.mocked(prisma.coupon.findMany).mockResolvedValue(mockCoupons)
    vi.mocked(prisma.coupon.count).mockResolvedValue(2)

    const request = createMockRequest('http://localhost:3000/api/coupons')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(2)
    expect(data.data[0].code).toBe('DESCONTO10')
    expect(data.data[1].code).toBe('BEMVINDO')
  })

  it('should filter coupons by validity period', async () => {
    const now = new Date()
    const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const mockCoupons = [
      {
        id: 'coupon-1',
        code: 'DESCONTO10',
        name: 'Desconto 10%',
        description: null,
        discountPercent: 10,
        discountCents: null,
        validFrom: past,
        validUntil: future,
        maxUses: 100,
        usesCount: 50,
        status: 'active',
        createdAt: past,
        updatedAt: past,
      },
    ]

    vi.mocked(prisma.coupon.findMany).mockResolvedValue(mockCoupons)
    vi.mocked(prisma.coupon.count).mockResolvedValue(1)

    const request = createMockRequest('http://localhost:3000/api/coupons')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(prisma.coupon.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'active',
          validFrom: expect.objectContaining({ lte: expect.any(Date) }),
          validUntil: expect.objectContaining({ gte: expect.any(Date) }),
        }),
      })
    )
  })

  it('should handle pagination correctly', async () => {
    vi.mocked(prisma.coupon.findMany).mockResolvedValue([])
    vi.mocked(prisma.coupon.count).mockResolvedValue(20)

    const request = createMockRequest('http://localhost:3000/api/coupons?limit=10&offset=10')
    const response = await GET(request)
    const data = await response.json()

    expect(data.pagination.limit).toBe(10)
    expect(data.pagination.offset).toBe(10)
    expect(data.pagination.hasMore).toBe(true)
  })

  it('should handle database errors', async () => {
    vi.mocked(prisma.coupon.findMany).mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('http://localhost:3000/api/coupons')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to fetch coupons')
  })

  it('should return empty array when no coupons exist', async () => {
    vi.mocked(prisma.coupon.findMany).mockResolvedValue([])
    vi.mocked(prisma.coupon.count).mockResolvedValue(0)

    const request = createMockRequest('http://localhost:3000/api/coupons')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual([])
    expect(data.pagination.total).toBe(0)
  })
})

describe('POST /api/coupons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should validate a valid coupon successfully', async () => {
    const now = new Date()
    const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const mockCoupon = {
      id: 'coupon-1',
      code: 'DESCONTO10',
      name: 'Desconto 10%',
      description: '10% de desconto',
      discountPercent: 10,
      discountCents: null,
      validFrom: past,
      validUntil: future,
      maxUses: 100,
      usesCount: 50,
      status: 'active',
      createdAt: past,
      updatedAt: past,
    }

    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(mockCoupon)

    const request = createMockRequest('http://localhost:3000/api/coupons', {
      method: 'POST',
      body: JSON.stringify({
        code: 'DESCONTO10',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.code).toBe('DESCONTO10')
    expect(data.data.discountInfo.type).toBe('percentage')
    expect(data.data.discountInfo.value).toBe(10)
    expect(data.data.remainingUses).toBe(50)
    expect(data.message).toBe('Coupon is valid')
  })

  it('should validate coupon with fixed discount', async () => {
    const now = new Date()
    const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const mockCoupon = {
      id: 'coupon-2',
      code: 'BEMVINDO',
      name: 'Cupom de Boas-vindas',
      description: 'R$ 50 de desconto',
      discountPercent: null,
      discountCents: 5000,
      validFrom: past,
      validUntil: future,
      maxUses: null,
      usesCount: 25,
      status: 'active',
      createdAt: past,
      updatedAt: past,
    }

    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(mockCoupon)

    const request = createMockRequest('http://localhost:3000/api/coupons', {
      method: 'POST',
      body: JSON.stringify({
        code: 'BEMVINDO',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.discountInfo.type).toBe('fixed')
    expect(data.data.discountInfo.value).toBe(5000)
    expect(data.data.remainingUses).toBeNull()
  })

  it('should return 400 when code is not provided', async () => {
    const request = createMockRequest('http://localhost:3000/api/coupons', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Coupon code is required')
  })

  it('should return 404 when coupon does not exist', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(null)

    const request = createMockRequest('http://localhost:3000/api/coupons', {
      method: 'POST',
      body: JSON.stringify({
        code: 'INVALIDCODE',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid coupon code')
  })

  it('should return 404 when coupon is inactive', async () => {
    const now = new Date()
    const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const mockCoupon = {
      id: 'coupon-1',
      code: 'INACTIVE',
      name: 'Cupom Inativo',
      description: null,
      discountPercent: 10,
      discountCents: null,
      validFrom: past,
      validUntil: future,
      maxUses: 100,
      usesCount: 0,
      status: 'inactive',
      createdAt: past,
      updatedAt: past,
    }

    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(mockCoupon)

    const request = createMockRequest('http://localhost:3000/api/coupons', {
      method: 'POST',
      body: JSON.stringify({
        code: 'INACTIVE',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Coupon is inactive')
  })

  it('should return 404 when coupon has not started yet', async () => {
    const now = new Date()
    const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const later = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)

    const mockCoupon = {
      id: 'coupon-1',
      code: 'FUTURE',
      name: 'Cupom Futuro',
      description: null,
      discountPercent: 10,
      discountCents: null,
      validFrom: later,
      validUntil: future,
      maxUses: 100,
      usesCount: 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }

    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(mockCoupon)

    const request = createMockRequest('http://localhost:3000/api/coupons', {
      method: 'POST',
      body: JSON.stringify({
        code: 'FUTURE',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Coupon is not yet valid')
  })

  it('should return 404 when coupon has expired', async () => {
    const now = new Date()
    const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const expired = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)

    const mockCoupon = {
      id: 'coupon-1',
      code: 'EXPIRED',
      name: 'Cupom Expirado',
      description: null,
      discountPercent: 10,
      discountCents: null,
      validFrom: past,
      validUntil: expired,
      maxUses: 100,
      usesCount: 50,
      status: 'active',
      createdAt: past,
      updatedAt: past,
    }

    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(mockCoupon)

    const request = createMockRequest('http://localhost:3000/api/coupons', {
      method: 'POST',
      body: JSON.stringify({
        code: 'EXPIRED',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Coupon has expired')
  })

  it('should return 404 when coupon usage limit is reached', async () => {
    const now = new Date()
    const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const mockCoupon = {
      id: 'coupon-1',
      code: 'LIMITED',
      name: 'Cupom Limitado',
      description: null,
      discountPercent: 10,
      discountCents: null,
      validFrom: past,
      validUntil: future,
      maxUses: 100,
      usesCount: 100,
      status: 'active',
      createdAt: past,
      updatedAt: past,
    }

    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(mockCoupon)

    const request = createMockRequest('http://localhost:3000/api/coupons', {
      method: 'POST',
      body: JSON.stringify({
        code: 'LIMITED',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Coupon usage limit reached')
  })

  it('should normalize coupon code to uppercase', async () => {
    const now = new Date()
    const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const mockCoupon = {
      id: 'coupon-1',
      code: 'DESCONTO10',
      name: 'Desconto 10%',
      description: null,
      discountPercent: 10,
      discountCents: null,
      validFrom: past,
      validUntil: future,
      maxUses: 100,
      usesCount: 50,
      status: 'active',
      createdAt: past,
      updatedAt: past,
    }

    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(mockCoupon)

    const request = createMockRequest('http://localhost:3000/api/coupons', {
      method: 'POST',
      body: JSON.stringify({
        code: 'desconto10',
      }),
    })

    await POST(request)

    expect(prisma.coupon.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { code: 'DESCONTO10' },
      })
    )
  })

  it('should handle database errors during validation', async () => {
    vi.mocked(prisma.coupon.findUnique).mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('http://localhost:3000/api/coupons', {
      method: 'POST',
      body: JSON.stringify({
        code: 'DESCONTO10',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to validate coupon')
  })
})
