import { Suspense } from "react"
import { AgendamentosView } from "@/components/agendamentos-view"

export default function TarefasPage() {
  return (
    <Suspense>
      <AgendamentosView
        defaultTipoFiltro="tarefa"
      />
    </Suspense>
  )
}
