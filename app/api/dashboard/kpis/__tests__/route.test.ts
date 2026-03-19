import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'

vi.mock('@/lib/auth/helpers', () => {
  class AuthError extends Error {
    statusCode: number
    constructor(message: string, statusCode = 401) {
      super(message)
      this.name = 'AuthError'
      this.statusCode = statusCode
    }
  }
  return {
    getAuthenticatedUser: vi.fn(),
    AuthError,
  }
})

vi.mock('@/lib/db/dashboard-queries', () => ({
  getKPIs: vi.fn(),
}))

// Import after mocks
const { getAuthenticatedUser } = await import('@/lib/auth/helpers')
const { getKPIs } = await import('@/lib/db/dashboard-queries')

describe('GET /api/dashboard/kpis', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    const { AuthError } = await import('@/lib/auth/helpers')
    vi.mocked(getAuthenticatedUser).mockRejectedValue(new AuthError('Unauthorized'))

    const request = new Request('http://localhost/api/dashboard/kpis?period=30d')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 when organization is not found', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ userId: 'user_123', email: 'test@test.com', name: null, organizationId: null })

    const request = new Request('http://localhost/api/dashboard/kpis?period=30d')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Organization not found')
  })

  it('should return KPIs data successfully', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ userId: 'user_123', email: 'test@test.com', name: null, organizationId: 'org_123' })

    const mockData = {
      leads: { value: 100, change: 10 },
      revenue: { value: 50000, change: 5 },
      conversionRate: { value: 20, change: 2 },
      pipelineValue: { value: 200000, change: -3 },
      avgDealTime: { value: 15, change: -5 },
    }

    vi.mocked(getKPIs).mockResolvedValue(mockData)

    const request = new Request('http://localhost/api/dashboard/kpis?period=30d')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.leadsThisWeek).toBe(100)
    expect(data.data.leadsGrowth).toBe(10)
    expect(getKPIs).toHaveBeenCalledWith('org_123', '30d')
  })

  it('should return 400 for invalid period', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ userId: 'user_123', email: 'test@test.com', name: null, organizationId: 'org_123' })

    const request = new Request('http://localhost/api/dashboard/kpis?period=invalid')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid parameters')
  })

  it('should return 500 on database error', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ userId: 'user_123', email: 'test@test.com', name: null, organizationId: 'org_123' })
    vi.mocked(getKPIs).mockRejectedValue(new Error('DB Error'))

    const request = new Request('http://localhost/api/dashboard/kpis?period=30d')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Internal server error')
  })

  it('should use default period when not provided', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ userId: 'user_123', email: 'test@test.com', name: null, organizationId: 'org_123' })

    const mockData = {
      leads: { value: 0, change: 0 },
      revenue: { value: 0, change: 0 },
      conversionRate: { value: 0, change: 0 },
      pipelineValue: { value: 0, change: 0 },
      avgDealTime: { value: 0, change: 0 },
    }

    vi.mocked(getKPIs).mockResolvedValue(mockData)

    const request = new Request('http://localhost/api/dashboard/kpis')
    await GET(request)

    expect(getKPIs).toHaveBeenCalledWith('org_123', '30d')
  })

  it('should handle positive and negative changes', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ userId: 'user_123', email: 'test@test.com', name: null, organizationId: 'org_123' })

    const mockData = {
      leads: { value: 100, change: 15.5 },
      revenue: { value: 50000, change: -8.2 },
      conversionRate: { value: 20, change: 0 },
      pipelineValue: { value: 200000, change: 12.7 },
      avgDealTime: { value: 15, change: -3.5 },
    }

    vi.mocked(getKPIs).mockResolvedValue(mockData)

    const request = new Request('http://localhost/api/dashboard/kpis?period=30d')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.leadsGrowth).toBe(15.5)
    expect(data.data.revenueGrowth).toBe(-8.2)
    expect(data.data.conversionChange).toBe(0)
  })

  it('should support all valid periods', async () => {
    const periods = ['today', '7d', '30d', '90d']
    const mockData = {
      leads: { value: 100, change: 10 },
      revenue: { value: 50000, change: 5 },
      conversionRate: { value: 20, change: 2 },
      pipelineValue: { value: 200000, change: -3 },
      avgDealTime: { value: 15, change: -5 },
    }

    for (const period of periods) {
      vi.clearAllMocks()
      vi.mocked(getAuthenticatedUser).mockResolvedValue({ userId: 'user_123', email: 'test@test.com', name: null, organizationId: 'org_123' })
      vi.mocked(getKPIs).mockResolvedValue(mockData)

      const request = new Request(`http://localhost/api/dashboard/kpis?period=${period}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(getKPIs).toHaveBeenCalledWith('org_123', period)
    }
  })
})
