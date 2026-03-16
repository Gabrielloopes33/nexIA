import { render as rtlRender, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactElement, ReactNode } from 'react'

/**
 * Cria um QueryClient para testes com retry desabilitado
 */
export function createTestQueryClient() {
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
 * Provedores de teste que envolvem o componente
 */
function TestProviders({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient()
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

/**
 * Render customizado com providers
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return rtlRender(ui, {
    wrapper: TestProviders,
    ...options,
  })
}

// Re-exporta tudo do testing-library exceto render
export * from '@testing-library/react'

// Exporta nosso render customizado
export { customRender as render }
