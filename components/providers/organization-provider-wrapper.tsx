"use client"

import { OrganizationProvider } from "@/lib/contexts/organization-context"

/**
 * Wrapper que envolve a aplicação com o OrganizationProvider.
 * 
 * Uso: Envolver no layout principal (app/layout.tsx ou app/(app)/layout.tsx)
 * 
 * Exemplo:
 * ```tsx
 * export default function RootLayout({ children }) {
 *   return (
 *     <OrganizationProviderWrapper>
 *       {children}
 *     </OrganizationProviderWrapper>
 *   )
 * }
 * ```
 */
export function OrganizationProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <OrganizationProvider>
      {children}
    </OrganizationProvider>
  )
}
