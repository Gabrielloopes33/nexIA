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
  getLostReasonsStats: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
  })),
}))

// Import after mocks
const { getLostReasonsStats } = await import('@/lib/db/dashboard-queries')

describe('GET /api/dashboard/lost-reasons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Setup chain mocks
    mockFrom.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ single: mockSingle })
  })

  it('should return 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const request = new Request('http://localhost/api/dashboard/lost-reasons?period=30d')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 when organization is not found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } } })
    mockSingle.mockResolvedValue({ data: null })

    const request = new Request('http://localhost/api/dashboard/lost-reasons?period=30d')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Organization not found')
  })

  it('should return lost reasons data successfully', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } } })
    mockSingle.mockResolvedValue({ data: { organization_id: 'org_123' } })

    const mockReasons = [
      {
        reason: 'PRICE',
        count: 10,
        percentage: 50,
        trend: 5,
        avgDealValue: 5000,
      },
      {
        reason: 'TIMING',
        count: 5,
        percentage: 25,
        trend: -2,
        avgDealValue: 3000,
      },
    ]

    vi.mocked(getLostReasonsStats).mockResolvedValue(mockReasons)

    const request = new Request('http://localhost/api/dashboard/lost-reasons?period=30d')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.reasons).toEqual(mockReasons)
    expect(getLostReasonsStats).toHaveBeenCalledWith('org_123', '30d')
  })

  it('should return 400 for invalid period', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } } })
    mockSingle.mockResolvedValue({ data: { organization_id: 'org_123' } })

    const request = new Request('http://localhost/api/dashboard/lost-reasons?period=invalid')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid parameters')
  })

  it('should return 500 on database error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } } })
    mockSingle.mockResolvedValue({ data: { organization_id: 'org_123' } })
    vi.mocked(getLostReasonsStats).mockRejectedValue(new Error('DB Error'))

    const request = new Request('http://localhost/api/dashboard/lost-reasons?period=30d')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Internal server error')
  })

  it('should use default period when not provided', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } } })
    mockSingle.mockResolvedValue({ data: { organization_id: 'org_123' } })

    vi.mocked(getLostReasonsStats).mockResolvedValue([])

    const request = new Request('http://localhost/api/dashboard/lost-reasons')
    await GET(request)

    expect(getLostReasonsStats).toHaveBeenCalledWith('org_123', '30d')
  })
})
