'use client'

import { DashboardContent } from './_components/dashboard-content'
import { DashboardHeaderClient } from './_components/dashboard-header-client'
import { Sidebar } from '@/components/sidebar'
import { ContactDetailPanel } from '@/components/contact-detail-panel'
import { DashboardProvider } from '@/hooks/use-dashboard-context'
import { DashboardFiltersProvider } from '@/hooks/dashboard/use-dashboard-filters-context'
import { ProductTour } from '@/components/onboarding/product-tour'

/**
 * DashboardPage - Client Component
 * 
 * Todos os dados são buscados no cliente via React Query
 * para evitar problemas de hidratação entre servidor e cliente.
 */
export default function DashboardPage() {
  return (
    <DashboardProvider>
      <DashboardFiltersProvider>
        <div className="flex h-screen overflow-hidden bg-white">
          {/* Main Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="pt-14">
              <DashboardHeaderClient />
            </div>
            <div className="mt-[50px]">
              <DashboardContent />
            </div>
          </main>

          {/* Contact Detail Panel - Right Sidebar */}
          <ContactDetailPanel />

          {/* Onboarding tour — rendered only on first visit */}
          <ProductTour />
        </div>
      </DashboardFiltersProvider>
    </DashboardProvider>
  )
}
