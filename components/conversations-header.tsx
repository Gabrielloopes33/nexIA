"use client"

import { Plus, Archive, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ConversationsHeaderProps {
  onNewConversation?: () => void
  onArchiveSelected?: () => void
  onSettings?: () => void
  selectedCount?: number
}

export function ConversationsHeader({
  onNewConversation,
  onArchiveSelected,
  onSettings,
  selectedCount = 0,
}: ConversationsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Conversas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie comunicações multicanal com seus clientes
        </p>
      </div>

      <div className="flex items-center gap-3">
        {selectedCount > 0 && (
          <Button variant="outline" size="default" onClick={onArchiveSelected}>
            <Archive className="h-4 w-4" />
            Arquivar ({selectedCount})
          </Button>
        )}
        <Button variant="outline" size="default" onClick={onSettings}>
          <Settings className="h-4 w-4" />
          Configurações
        </Button>
        <Button variant="default" size="default" onClick={onNewConversation}>
          <Plus className="h-4 w-4" />
          Nova Conversa
        </Button>
      </div>
    </div>
  )
}
