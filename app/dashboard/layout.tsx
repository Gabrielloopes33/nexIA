import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - NexIA Chat',
  description: 'Visualize métricas e insights do seu negócio',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Layout mínimo - providers estão no page.tsx
  return <>{children}</>
}
