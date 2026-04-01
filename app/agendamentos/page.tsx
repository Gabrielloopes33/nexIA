import { Suspense } from "react"
import { AgendamentosView } from "@/components/agendamentos-view"

export default function AgendamentosPage() {
  return (
    <Suspense>
      <AgendamentosView />
    </Suspense>
  )
}
