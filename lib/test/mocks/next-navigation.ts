import { vi } from 'vitest'

/**
 * Mock do next/navigation
 */
export const usePathname = vi.fn(() => '/dashboard')

export const useRouter = vi.fn(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
}))

export const useSearchParams = vi.fn(() => ({
  get: vi.fn(),
  has: vi.fn(),
  getAll: vi.fn(),
  entries: vi.fn(),
  keys: vi.fn(),
  values: vi.fn(),
  forEach: vi.fn(),
  toString: vi.fn(),
}));

export const useParams = vi.fn(() => ({}))

export const redirect = vi.fn()
export const permanentRedirect = vi.fn()
