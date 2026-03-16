'use client'

import dynamic from 'next/dynamic'

export const DashboardHeaderClient = dynamic(
  () => import('@/components/dashboard-header').then((m) => m.DashboardHeader),
  { ssr: false }
)
