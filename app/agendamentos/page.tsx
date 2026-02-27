"use client"

import { Sidebar } from "@/components/sidebar"
import { AgendamentosView } from "@/components/agendamentos-view"

export default function AgendamentosPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-8 py-6">
        <AgendamentosView />
      </main>
    </div>
  )
}
