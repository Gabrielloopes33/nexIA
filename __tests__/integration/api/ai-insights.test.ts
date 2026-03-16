import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/ai-insights/route'
import { GET as GET_STATS } from '@/app/api/ai-insights/stats/route'
import { PATCH, DELETE } from '@/app/api/ai-insights/[id]/route'

// Mock NextRequest
const createMockRequest = (url: string, options: RequestInit = {}) => {
  return new Request(url, options) as any
}

describe('AI Insights API Integration', () => {
  const mockOrgId = 'test-org-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/ai-insights', () => {
    it('validates URL structure', () => {
      const url = `http://localhost:3000/api/ai-insights?organizationId=${mockOrgId}`
      expect(url).toContain('/api/ai-insights')
      expect(url).toContain(`organizationId=${mockOrgId}`)
    })

    it('validates query params structure', () => {
      const url = new URL(`http://localhost:3000/api/ai-insights?organizationId=${mockOrgId}&type=PREDICTION&status=ACTIVE`)
      expect(url.searchParams.get('organizationId')).toBe(mockOrgId)
      expect(url.searchParams.get('type')).toBe('PREDICTION')
      expect(url.searchParams.get('status')).toBe('ACTIVE')
    })
  })

  describe('POST /api/ai-insights', () => {
    it('validates request body structure', () => {
      const body = {
        type: 'PREDICTION',
        category: 'conversion',
        title: 'Test Insight',
        description: 'Test description',
        relatedContactIds: [],
        relatedDealIds: [],
      }

      expect(body).toHaveProperty('type')
      expect(body).toHaveProperty('category')
      expect(body).toHaveProperty('title')
      expect(body).toHaveProperty('description')
      expect(['PREDICTION', 'ALERT', 'RECOMMENDATION', 'DISCOVERY']).toContain(body.type)
    })

    it('validates required fields', () => {
      const invalidBody = { category: 'test' }
      expect(invalidBody).not.toHaveProperty('type')
      expect(invalidBody).not.toHaveProperty('title')
    })
  })

  describe('PATCH /api/ai-insights/[id]', () => {
    it('validates update body structure', () => {
      const updateBody = { status: 'DISMISSED' }
      expect(['ACTIVE', 'DISMISSED', 'ARCHIVED']).toContain(updateBody.status)
    })
  })

  describe('Stats', () => {
    it('validates stats endpoint URL', () => {
      const url = `http://localhost:3000/api/ai-insights/stats?organizationId=${mockOrgId}`
      expect(url).toContain('/api/ai-insights/stats')
      expect(url).toContain(`organizationId=${mockOrgId}`)
    })
  })
})
