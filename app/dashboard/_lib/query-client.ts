import { QueryClient } from '@tanstack/react-query'
import { cache } from 'react'

/**
 * Cria um QueryClient para Server Components (Next.js App Router)
 * Usa cache() para garantir singleton por request
 */
export const getQueryClient = cache(() => new QueryClient({
  defaultOptions: {
    queries: {
      // No servidor, não queremos retry
      retry: false,
      // Stale time infinito no SSR (dados são fresh ao hidratar)
      staleTime: Infinity,
    },
  },
}))
