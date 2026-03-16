import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'

// Mock das dependências
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockSingle = vi.fn()
const mockEq = vi.fn()
const mockSelect = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

vi.mock('@/lib/db/dashboard-queries', () => ({
  getChannelPerformance: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
  })),
}))

// Import after mocks
const { getChannelPerformance } = await import('@/lib/db/dashboard-queries')

describe('GET /api/dashboard/channels', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Setup chain mocks
    mockFrom.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ single: mockSingle })
  })

  it('should return 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const request = new Request('http://localhost/api/dashboard/channels?period=30d')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 when organization is not found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } } })
    mockSingle.mockResolvedValue({ data: null })

    const request = new Request('http://localhost/api/dashboard/channels?period=30d')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Organization not found')
  })

  it('should return channels data successfully', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } } })
    mockSingle.mockResolvedValue({ data: { organization_id: 'org_123' } })

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
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } } })
    mockSingle.mockResolvedValue({ data: { organization_id: 'org_123' } })

    const request = new Request('http://localhost/api/dashboard/channels?period=invalid')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid parameters')
  })

  it('should return 500 on database error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } } })
    mockSingle.mockResolvedValue({ data: { organization_id: 'org_123' } })
    vi.mocked(getChannelPerformance).mockRejectedValue(new Error('DB Error'))

    const request = new Request('http://localhost/api/dashboard/channels?period=30d')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Internal server error')
  })

  it('should use default period when not provided', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } } })
    mockSingle.mockResolvedValue({ data: { organization_id: 'org_123' } })

    vi.mocked(getChannelPerformance).mockResolvedValue([])

    const request = new Request('http://localhost/api/dashboard/channels')
    await GET(request)

    expect(getChannelPerformance).toHaveBeenCalledWith('org_123', '30d')
  })
})
