"use client"

import { Plus, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  onNewIntegration: () => void
  onSettings: () => void
}

export function IntegrationsHeader({ onNewIntegration, onSettings }: Props) {
  return (
    <header className="flex items-start justify-between">
      <div>
        <h1 className="text-[32px] font-bold leading-tight text-foreground">Integrações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conecte suas ferramentas e canais de comunicação favoritos
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* New Integration Button */}
        <button 
          onClick={onNewIntegration}
          className="flex h-10 items-center gap-2 rounded-sm bg-gradient-to-r from-[#9795e4] to-[#b3b3e5] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Integração</span>
        </button>
        
        {/* Settings Button */}
        <button 
          onClick={onSettings}
          className="flex h-10 items-center justify-center rounded-sm shadow-sm bg-card px-3 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Settings className="h-[18px] w-[18px]" />
        </button>
      </div>
    </header>
  )
}
