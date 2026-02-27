"use client"

import { Plus, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  onNewIntegration: () => void
  onSettings: () => void
}

export function IntegrationsHeader({ onNewIntegration, onSettings }: Props) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integrações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conecte suas ferramentas e canais de comunicação favoritos
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onNewIntegration}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Integração
        </Button>
        <Button variant="outline" size="icon" onClick={onSettings}>
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
