import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from './_lib/query-client'
import { dashboardKeys } from '@/lib/queries/query-keys'
import { DashboardContent } from './_components/dashboard-content'
import { DashboardHeaderClient } from './_components/dashboard-header-client'
import { Sidebar } from '@/components/sidebar'
import { ContactDetailPanel } from '@/components/contact-detail-panel'
import { DashboardProvider } from '@/hooks/use-dashboard-context'
import { DashboardFiltersProvider } from '@/hooks/dashboard/use-dashboard-filters-context'
import { QueryProvider } from '@/components/providers/query-provider'

/**
 * Função auxiliar para prefetch de dados no servidor
 * 
 * Em produção, você usaria a mesma lógica da API route
 * ou chamaria diretamente o Prisma
 */
async function fetchFunilPorEtapa(period: string) {
  // Em desenvolvimento, não fazemos prefetch real
  // Em produção, você pode chamar a lógica diretamente
  // ou fazer fetch para a API interna
  
  // Simulação para exemplo:
  return {
    etapas: [],
    totalLeads: 0,
    taxaConversaoGeral: 0,
    valorTotal: 0,
  }
}

/**
 * DashboardPage - Server Component
 * 
 * Responsabilidades:
 * 1. Prefetch dados críticos no servidor
 * 2. Hidratar o cache do React Query
 * 3. Renderizar layout com providers
 * 
 * Benefícios:
 * - Dados disponíveis imediatamente (no HTML)
 * - Menos loading states
 * - SEO melhor
 * - Melhor UX
 */
export default async function DashboardPage() {
  const queryClient = getQueryClient()
  const defaultPeriod = '30d'

  // Prefetch dados críticos
  // Descomente quando tiver dados reais para prefetch
  /*
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: dashboardKeys.funilPorEtapa(defaultPeriod),
      queryFn: () => fetchFunilPorEtapa(defaultPeriod),
    }),
    // Prefetch outros dados críticos...
  ])
  */

  return (
    <QueryProvider>
      <HydrationBoundary state={dehydrate(queryClient)}>
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
            </div>
          </DashboardFiltersProvider>
        </DashboardProvider>
      </HydrationBoundary>
    </QueryProvider>
  )
}

/**
 * Metadata da página
 */
export const metadata = {
  title: 'Dashboard - NexIA Chat',
  description: 'Visualize métricas e insights do seu negócio',
}
