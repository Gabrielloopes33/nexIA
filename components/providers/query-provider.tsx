'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, ReactNode } from 'react'

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Dados considerados frescos por 5 minutos
        staleTime: 5 * 60 * 1000,
        // Cache por 10 minutos
        gcTime: 10 * 60 * 1000,
        // Retry com exponential backoff
        retry: 3,
        retryDelay: (attemptIndex) => 
          Math.min(1000 * 2 ** attemptIndex, 30000),
        // Não refetch ao focar janela (performance)
        refetchOnWindowFocus: false,
        // Refetch em reconexão de rede
        refetchOnReconnect: true,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
