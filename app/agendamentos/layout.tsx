import { Sidebar } from "@/components/sidebar"
import { AgendaSubSidebar } from "@/components/agenda/agenda-sub-sidebar"
import { AgendamentosProvider } from "@/lib/contexts/agendamentos-context"

export default function AgendamentosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AgendamentosProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <AgendaSubSidebar />
        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 min-w-0">
          {children}
        </main>
      </div>
    </AgendamentosProvider>
  )
}
