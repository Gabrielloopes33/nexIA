import { Suspense } from "react"
import { AgendamentosView } from "@/components/agendamentos-view"

export default function ConcluidasPage() {
  return (
    <Suspense>
      <AgendamentosView
        somenteConcluidasView={true}
      />
    </Suspense>
  )
}
