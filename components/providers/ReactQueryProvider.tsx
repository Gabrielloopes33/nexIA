'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/dashboard/queries';
import { ReactNode } from 'react';

interface ReactQueryProviderProps {
  children: ReactNode;
}

/**
 * Provider do React Query
 * 
 * Deve envolver a aplicação para disponibilizar:
 * - Cache global de queries
 * - Estado de loading/error automático
 * - Devtools em desenvolvimento
 */
export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
