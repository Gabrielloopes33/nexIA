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
  getLostDealsWithRecoveryPotential: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
  })),
}))

// Import after mocks
const { getLostDealsWithRecoveryPotential } = await import('@/lib/db/dashboard-queries')

describe('GET /api/dashboard/lost-deals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Setup chain mocks
    mockFrom.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ single: mockSingle })
  })

  it('should return 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const request = new Request('http://localhost/api/dashboard/lost-deals?period=30d')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 when organization is not found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } } })
    mockSingle.mockResolvedValue({ data: null })

    const request = new Request('http://localhost/api/dashboard/lost-deals?period=30d')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Organization not found')
  })

  it('should return lost deals data successfully', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } } })
    mockSingle.mockResolvedValue({ data: { organization_id: 'org_123' } })

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
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } } })
    mockSingle.mockResolvedValue({ data: { organization_id: 'org_123' } })

    const request = new Request('http://localhost/api/dashboard/lost-deals?period=invalid')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid parameters')
  })

  it('should return 400 for invalid limit', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } } })
    mockSingle.mockResolvedValue({ data: { organization_id: 'org_123' } })

    const request = new Request('http://localhost/api/dashboard/lost-deals?period=30d&limit=100')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid parameters')
  })

  it('should return 500 on database error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } } })
    mockSingle.mockResolvedValue({ data: { organization_id: 'org_123' } })
    vi.mocked(getLostDealsWithRecoveryPotential).mockRejectedValue(new Error('DB Error'))

    const request = new Request('http://localhost/api/dashboard/lost-deals?period=30d')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Internal server error')
  })

  it('should use default values when not provided', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } } })
    mockSingle.mockResolvedValue({ data: { organization_id: 'org_123' } })

    vi.mocked(getLostDealsWithRecoveryPotential).mockResolvedValue([])

    const request = new Request('http://localhost/api/dashboard/lost-deals')
    await GET(request)

    expect(getLostDealsWithRecoveryPotential).toHaveBeenCalledWith('org_123', '30d', 10)
  })
})
