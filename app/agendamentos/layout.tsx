import { Sidebar } from "@/components/sidebar"
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
        <main className="flex-1 overflow-y-auto px-6 pt-14 pb-6 min-w-0">
          {children}
        </main>
      </div>
    </AgendamentosProvider>
  )
}
