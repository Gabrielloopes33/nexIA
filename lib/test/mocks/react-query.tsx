import { QueryClient } from '@tanstack/react-query'

/**
 * Cria um QueryClient para testes com retry desabilitado
 */
export function createMockQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

/**
 * Wrapper para testes com React Query
 */
export function withQueryClient(children: React.ReactNode) {
  const queryClient = createMockQueryClient()
  return { queryClient, children }
}
