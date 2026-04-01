import { Suspense } from "react"
import { AgendamentosView } from "@/components/agendamentos-view"

export default function PrazosPage() {
  return (
    <Suspense>
      <AgendamentosView
        defaultTipoFiltro="prazo"
      />
    </Suspense>
  )
}
