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
  getChannelPerformance: vi.fn(),
}))

// Import after mocks
const { getAuthenticatedUser } = await import('@/lib/auth/helpers')
const { getChannelPerformance } = await import('@/lib/db/dashboard-queries')

describe('GET /api/dashboard/channels', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    const { AuthError } = await import('@/lib/auth/helpers')
    vi.mocked(getAuthenticatedUser).mockRejectedValue(new AuthError('Unauthorized'))

    const request = new Request('http://localhost/api/dashboard/channels?period=30d')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 when organization is not found', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ userId: 'user_123', email: 'test@test.com', name: null, organizationId: null })

    const request = new Request('http://localhost/api/dashboard/channels?period=30d')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Organization not found')
  })

  it('should return channels data successfully', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ userId: 'user_123', email: 'test@test.com', name: null, organizationId: 'org_123' })

    const mockChannels = [
      {
        name: 'WHATSAPP_OFFICIAL',
        leads: 100,
        deals: 20,
        conversionRate: 20,
        avgResponseTime: 5,
        revenue: 50000,
      },
      {
        name: 'INSTAGRAM',
        leads: 50,
        deals: 10,
        conversionRate: 20,
        avgResponseTime: 10,
        revenue: 25000,
      },
    ]

    vi.mocked(getChannelPerformance).mockResolvedValue(mockChannels)

    const request = new Request('http://localhost/api/dashboard/channels?period=30d')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.channels).toEqual(mockChannels)
    expect(getChannelPerformance).toHaveBeenCalledWith('org_123', '30d')
  })

  it('should return 400 for invalid period', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ userId: 'user_123', email: 'test@test.com', name: null, organizationId: 'org_123' })

    const request = new Request('http://localhost/api/dashboard/channels?period=invalid')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid parameters')
  })

  it('should return 500 on database error', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ userId: 'user_123', email: 'test@test.com', name: null, organizationId: 'org_123' })
    vi.mocked(getChannelPerformance).mockRejectedValue(new Error('DB Error'))

    const request = new Request('http://localhost/api/dashboard/channels?period=30d')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Internal server error')
  })

  it('should use default period when not provided', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ userId: 'user_123', email: 'test@test.com', name: null, organizationId: 'org_123' })

    vi.mocked(getChannelPerformance).mockResolvedValue([])

    const request = new Request('http://localhost/api/dashboard/channels')
    await GET(request)

    expect(getChannelPerformance).toHaveBeenCalledWith('org_123', '30d')
  })
})
