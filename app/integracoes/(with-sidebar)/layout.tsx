import { Sidebar } from "@/components/sidebar"
import { IntegrationsSubSidebar } from "@/components/integrations/integrations-sub-sidebar"

export default function IntegrationsWithSidebarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <IntegrationsSubSidebar />
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 min-w-0">
        {children}
      </main>
    </div>
  )
}
