import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Ensure React is in development mode
globalThis.process = { ...globalThis.process, env: { ...globalThis.process?.env, NODE_ENV: 'development' } }

// Mock SWR
vi.mock('swr', () => ({
  default: vi.fn(),
  mutate: vi.fn(),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
    has: vi.fn(),
  }),
}))

// Mock OrganizationContext
const mockOrgId = 'test-org-123'
vi.mock('@/lib/contexts/organization-context', () => ({
  useOrganization: () => ({ 
    organization: { 
      id: mockOrgId, 
      name: 'Test Org',
      status: 'ACTIVE',
    }, 
    isLoading: false 
  }),
  useOrganizationId: () => mockOrgId,
  OrganizationProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock localStorage with default organizationId
const localStorageMock = {
  getItem: vi.fn((key: string) => {
    if (key === 'current_organization_id' || key === 'organizationId') {
      return 'test-org-123'
    }
    return null
  }),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock fetch
global.fetch = vi.fn()

// Mock console methods in tests
vi.spyOn(console, 'error').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})
