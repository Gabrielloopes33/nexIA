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
  getWeeklyRevenue: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
  })),
}))

// Import after mocks
const { getWeeklyRevenue } = await import('@/lib/db/dashboard-queries')

describe('GET /api/dashboard/revenue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Setup chain mocks
    mockFrom.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ single: mockSingle })
  })

  it('should return 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const request = new Request('http://localhost/api/dashboard/revenue?weeks=8')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 when organization is not found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } } })
    mockSingle.mockResolvedValue({ data: null })

    const request = new Request('http://localhost/api/dashboard/revenue?weeks=8')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Organization not found')
  })

  it('should return revenue data successfully', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } } })
    mockSingle.mockResolvedValue({ data: { organization_id: 'org_123' } })

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
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } } })
    mockSingle.mockResolvedValue({ data: { organization_id: 'org_123' } })

    const request = new Request('http://localhost/api/dashboard/revenue?weeks=2')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid parameters')
  })

  it('should return 400 for invalid weeks (more than 52)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } } })
    mockSingle.mockResolvedValue({ data: { organization_id: 'org_123' } })

    const request = new Request('http://localhost/api/dashboard/revenue?weeks=60')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid parameters')
  })

  it('should return 500 on database error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } } })
    mockSingle.mockResolvedValue({ data: { organization_id: 'org_123' } })
    vi.mocked(getWeeklyRevenue).mockRejectedValue(new Error('DB Error'))

    const request = new Request('http://localhost/api/dashboard/revenue?weeks=8')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Internal server error')
  })

  it('should use default weeks when not provided', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } } })
    mockSingle.mockResolvedValue({ data: { organization_id: 'org_123' } })

    vi.mocked(getWeeklyRevenue).mockResolvedValue([])

    const request = new Request('http://localhost/api/dashboard/revenue')
    await GET(request)

    expect(getWeeklyRevenue).toHaveBeenCalledWith('org_123', 8)
  })
})
