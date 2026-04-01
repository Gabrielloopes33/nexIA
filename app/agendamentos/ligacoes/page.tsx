import { Suspense } from "react"
import { AgendamentosView } from "@/components/agendamentos-view"

export default function LigacoesPage() {
  return (
    <Suspense>
      <AgendamentosView
        defaultTipoFiltro="ligacao"
      />
    </Suspense>
  )
}
