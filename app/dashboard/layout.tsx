import { ReactNode } from 'react'

/**
 * Dashboard Layout
 * 
 * Este layout é opcional e pode ser usado para:
 * - Configurar providers específicos do dashboard
 * - Definir estrutura HTML comum
 * - Adicionar elementos fixos (header, footer)
 * 
 * Note: O QueryProvider e DashboardProvider estão no page.tsx
 * para permitir prefetch no Server Component
 */
export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  // Layout mínimo - providers estão no page
  return <>{children}</>
}
