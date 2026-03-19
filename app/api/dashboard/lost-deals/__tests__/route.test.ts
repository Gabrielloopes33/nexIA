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
  getLostDealsWithRecoveryPotential: vi.fn(),
}))

// Import after mocks
const { getAuthenticatedUser } = await import('@/lib/auth/helpers')
const { getLostDealsWithRecoveryPotential } = await import('@/lib/db/dashboard-queries')

describe('GET /api/dashboard/lost-deals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    const { AuthError } = await import('@/lib/auth/helpers')
    vi.mocked(getAuthenticatedUser).mockRejectedValue(new AuthError('Unauthorized'))

    const request = new Request('http://localhost/api/dashboard/lost-deals?period=30d')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 when organization is not found', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ userId: 'user_123', email: 'test@test.com', name: null, organizationId: null })

    const request = new Request('http://localhost/api/dashboard/lost-deals?period=30d')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Organization not found')
  })

  it('should return lost deals data successfully', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ userId: 'user_123', email: 'test@test.com', name: null, organizationId: 'org_123' })

    const mockDeals = [
      {
        id: 'deal_1',
        title: 'Deal 1',
        contactName: 'John Doe',
        value: 5000,
        lostAt: new Date().toISOString(),
        lostReason: 'PRICE',
        daysSinceLost: 5,
        recoveryScore: 75,
        lastActivity: new Date().toISOString(),
      },
    ]

    vi.mocked(getLostDealsWithRecoveryPotential).mockResolvedValue(mockDeals)

    const request = new Request('http://localhost/api/dashboard/lost-deals?period=30d&limit=10')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.deals).toEqual(mockDeals)
    expect(getLostDealsWithRecoveryPotential).toHaveBeenCalledWith('org_123', '30d', 10)
  })

  it('should return 400 for invalid period', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ userId: 'user_123', email: 'test@test.com', name: null, organizationId: 'org_123' })

    const request = new Request('http://localhost/api/dashboard/lost-deals?period=invalid')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid parameters')
  })

  it('should return 400 for invalid limit', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ userId: 'user_123', email: 'test@test.com', name: null, organizationId: 'org_123' })

    const request = new Request('http://localhost/api/dashboard/lost-deals?period=30d&limit=100')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid parameters')
  })

  it('should return 500 on database error', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ userId: 'user_123', email: 'test@test.com', name: null, organizationId: 'org_123' })
    vi.mocked(getLostDealsWithRecoveryPotential).mockRejectedValue(new Error('DB Error'))

    const request = new Request('http://localhost/api/dashboard/lost-deals?period=30d')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Internal server error')
  })

  it('should use default values when not provided', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ userId: 'user_123', email: 'test@test.com', name: null, organizationId: 'org_123' })

    vi.mocked(getLostDealsWithRecoveryPotential).mockResolvedValue([])

    const request = new Request('http://localhost/api/dashboard/lost-deals')
    await GET(request)

    expect(getLostDealsWithRecoveryPotential).toHaveBeenCalledWith('org_123', '30d', 10)
  })
})
