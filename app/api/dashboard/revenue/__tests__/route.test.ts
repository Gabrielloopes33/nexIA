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
  getWeeklyRevenue: vi.fn(),
}))

// Import after mocks
const { getAuthenticatedUser } = await import('@/lib/auth/helpers')
const { getWeeklyRevenue } = await import('@/lib/db/dashboard-queries')

describe('GET /api/dashboard/revenue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    const { AuthError } = await import('@/lib/auth/helpers')
    vi.mocked(getAuthenticatedUser).mockRejectedValue(new AuthError('Unauthorized'))

    const request = new Request('http://localhost/api/dashboard/revenue?weeks=8')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 when organization is not found', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ userId: 'user_123', email: 'test@test.com', name: null, organizationId: null })

    const request = new Request('http://localhost/api/dashboard/revenue?weeks=8')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Organization not found')
  })

  it('should return revenue data successfully', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ userId: 'user_123', email: 'test@test.com', name: null, organizationId: 'org_123' })

    const mockWeeks = [
      {
        week: '2024-W01',
        startDate: new Date().toISOString(),
        revenue: 50000,
        target: 60000,
        dealsCount: 10,
      },
      {
        week: '2024-W02',
        startDate: new Date().toISOString(),
        revenue: 55000,
        target: 60000,
        dealsCount: 11,
      },
    ]

    vi.mocked(getWeeklyRevenue).mockResolvedValue(mockWeeks)

    const request = new Request('http://localhost/api/dashboard/revenue?weeks=8')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.weeks).toEqual(mockWeeks)
    expect(getWeeklyRevenue).toHaveBeenCalledWith('org_123', 8)
  })

  it('should return 400 for invalid weeks (less than 4)', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ userId: 'user_123', email: 'test@test.com', name: null, organizationId: 'org_123' })

    const request = new Request('http://localhost/api/dashboard/revenue?weeks=2')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid parameters')
  })

  it('should return 400 for invalid weeks (more than 52)', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ userId: 'user_123', email: 'test@test.com', name: null, organizationId: 'org_123' })

    const request = new Request('http://localhost/api/dashboard/revenue?weeks=60')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid parameters')
  })

  it('should return 500 on database error', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ userId: 'user_123', email: 'test@test.com', name: null, organizationId: 'org_123' })
    vi.mocked(getWeeklyRevenue).mockRejectedValue(new Error('DB Error'))

    const request = new Request('http://localhost/api/dashboard/revenue?weeks=8')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Internal server error')
  })

  it('should use default weeks when not provided', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ userId: 'user_123', email: 'test@test.com', name: null, organizationId: 'org_123' })

    vi.mocked(getWeeklyRevenue).mockResolvedValue([])

    const request = new Request('http://localhost/api/dashboard/revenue')
    await GET(request)

    expect(getWeeklyRevenue).toHaveBeenCalledWith('org_123', 8)
  })
})
