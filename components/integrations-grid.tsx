"use client"

import { Plug } from "lucide-react"
import { IntegrationCard } from "./integration-card"
import { Button } from "@/components/ui/button"
import type { Integration } from "@/lib/types/integration"

interface Props {
  integrations: Integration[]
  onConnect: (id: string) => void
  onConfigure: (id: string) => void
  onClearFilters: () => void
}

export function IntegrationsGrid({ 
  integrations, 
  onConnect, 
  onConfigure,
  onClearFilters 
}: Props) {
  if (integrations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Plug className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="mt-4 text-base font-semibold text-foreground">
          Nenhuma integração encontrada
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Tente ajustar seus filtros de busca
        </p>
        <Button variant="outline" onClick={onClearFilters} className="mt-4">
          Limpar Filtros
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {integrations.map((integration) => (
        <IntegrationCard
          key={integration.id}
          integration={integration}
          onConnect={onConnect}
          onConfigure={onConfigure}
        />
      ))}
    </div>
  )
}
