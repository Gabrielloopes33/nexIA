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
  getHealthScoreData: vi.fn(),
}))

// Import after mocks
const { getAuthenticatedUser } = await import('@/lib/auth/helpers')
const { getHealthScoreData } = await import('@/lib/db/dashboard-queries')

describe('GET /api/dashboard/health-score', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    const { AuthError } = await import('@/lib/auth/helpers')
    vi.mocked(getAuthenticatedUser).mockRejectedValue(new AuthError('Unauthorized'))

    const request = new Request('http://localhost/api/dashboard/health-score?period=30d')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 when organization is not found', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ userId: 'user_123', email: 'test@test.com', name: null, organizationId: null })

    const request = new Request('http://localhost/api/dashboard/health-score?period=30d')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Organization not found')
  })

  it('should return health score data successfully', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ userId: 'user_123', email: 'test@test.com', name: null, organizationId: 'org_123' })

    const mockData = {
      score: 85,
      status: 'SAUDÁVEL' as const,
      factors: {
        conversionVsGoal: { score: 25, status: 'ACIMA' as const },
        funnelVelocity: { score: 30, status: 'OK' as const },
        stagnantLeads: { score: 15, status: 'OK' as const },
        followUpRate: { score: 15, percentage: 80 },
      },
    }

    vi.mocked(getHealthScoreData).mockResolvedValue(mockData)

    const request = new Request('http://localhost/api/dashboard/health-score?period=30d')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockData)
    expect(getHealthScoreData).toHaveBeenCalledWith('org_123', '30d')
  })

  it('should return 400 for invalid period', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ userId: 'user_123', email: 'test@test.com', name: null, organizationId: 'org_123' })

    const request = new Request('http://localhost/api/dashboard/health-score?period=invalid')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid parameters')
  })

  it('should return 500 on database error', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ userId: 'user_123', email: 'test@test.com', name: null, organizationId: 'org_123' })
    vi.mocked(getHealthScoreData).mockRejectedValue(new Error('DB Error'))

    const request = new Request('http://localhost/api/dashboard/health-score?period=30d')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Internal server error')
  })

  it('should use default period when not provided', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ userId: 'user_123', email: 'test@test.com', name: null, organizationId: 'org_123' })

    const mockData = {
      score: 75,
      status: 'OK' as const,
      factors: {
        conversionVsGoal: { score: 20, status: 'NA_META' as const },
        funnelVelocity: { score: 25, status: 'OK' as const },
        stagnantLeads: { score: 15, status: 'OK' as const },
        followUpRate: { score: 15, percentage: 75 },
      },
    }

    vi.mocked(getHealthScoreData).mockResolvedValue(mockData)

    const request = new Request('http://localhost/api/dashboard/health-score')
    await GET(request)

    expect(getHealthScoreData).toHaveBeenCalledWith('org_123', '30d')
  })

  it('should handle all health status values', async () => {
    const statuses = ['SAUDÁVEL', 'OK', 'ATENÇÃO', 'CRÍTICO'] as const

    for (const status of statuses) {
      vi.clearAllMocks()
      vi.mocked(getAuthenticatedUser).mockResolvedValue({ userId: 'user_123', email: 'test@test.com', name: null, organizationId: 'org_123' })

      vi.mocked(getHealthScoreData).mockResolvedValue({
        score: 50,
        status,
        factors: {
          conversionVsGoal: { score: 20, status: 'NA_META' },
          funnelVelocity: { score: 25, status: 'OK' },
          stagnantLeads: { score: 15, status: 'OK' },
          followUpRate: { score: 15, percentage: 75 },
        },
      })

      const request = new Request('http://localhost/api/dashboard/health-score?period=30d')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.status).toBe(status)
    }
  })
})
