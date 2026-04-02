"use client"

/**
 * BulkActionsBar - Barra de ações em massa para conversas selecionadas
 * Aparece quando o usuário seleciona uma ou mais conversas
 */

import { useState } from "react"
import { 
  UserCheck, 
  UserX, 
  CheckCircle, 
  Archive, 
  Trash2, 
  X,
  Loader2,
  MailOpen
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useConversationSelection } from "@/lib/contexts/conversation-selection-context"
import { useBulkAssign } from "@/hooks/use-bulk-assign"
import { useConversations } from "@/hooks/use-conversations"
import { AssignConversationDialog } from "./assign-conversation-dialog"
import { toast } from "sonner"

interface BulkActionsBarProps {
  /** Lista de todos os IDs disponíveis na página atual */
  availableIds: string[]
  /** Callback quando ações são executadas */
  onActionComplete?: () => void
  /** Classe adicional */
  className?: string
}

export function BulkActionsBar({ 
  availableIds,
  onActionComplete,
  className 
}: BulkActionsBarProps) {
  const { 
    selectedIds, 
    hasSelection, 
    selectionCount, 
    clearSelection,
    exitSelectionMode 
  } = useConversationSelection()
  
  const { assign, unassign, isLoading } = useBulkAssign()
  const { markAsUnread } = useConversations()
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)

  // Se não há seleção, não renderiza
  if (!hasSelection) return null

  const selectedIdsArray = Array.from(selectedIds)

  const handleAssign = async (agentId: string | null) => {
    if (!agentId) return
    
    const result = await assign({
      conversationIds: selectedIdsArray,
      agentId,
    })

    if (result.success) {
      clearSelection()
      onActionComplete?.()
    }
  }

  const handleUnassign = async () => {
    const result = await unassign({
      conversationIds: selectedIdsArray,
    })

    if (result.success) {
      clearSelection()
      onActionComplete?.()
    }
  }

  const handleResolve = () => {
    // TODO: Implementar resolução em lote
    toast.info("Funcionalidade em desenvolvimento", {
      description: "Resolução em lote será implementada em breve",
    })
  }

  const handleArchive = () => {
    // TODO: Implementar arquivamento em lote
    toast.info("Funcionalidade em desenvolvimento", {
      description: "Arquivamento em lote será implementado em breve",
    })
  }

  const handleMarkAsUnread = async () => {
    const selectedIdsArray = Array.from(selectedIds)
    let successCount = 0
    
    // Marca cada conversa como não lida
    await Promise.all(
      selectedIdsArray.map(async (id) => {
        const success = await markAsUnread(id)
        if (success) successCount++
      })
    )
    
    if (successCount > 0) {
      toast.success(`${successCount} ${successCount === 1 ? 'conversa marcada' : 'conversas marcadas'} como não lida`)
      clearSelection()
      onActionComplete?.()
    }
  }

  return (
    <>
      <div
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
          "flex items-center gap-2 px-4 py-3",
          "bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-border",
          "animate-in slide-in-from-bottom-4 fade-in duration-200",
          className
        )}
      >
        {/* Contador */}
        <div className="flex items-center gap-2 pr-3 border-r border-border">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#46347F] text-xs font-bold text-white">
            {selectionCount}
          </span>
          <span className="text-sm font-medium text-foreground">
            {selectionCount === 1 ? "selecionada" : "selecionadas"}
          </span>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1">
          {/* Atribuir */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAssignDialogOpen(true)}
            disabled={isLoading}
            className="h-8 px-2 text-[#46347F] hover:text-[#46347F] hover:bg-[#46347F]/10"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <UserCheck className="h-4 w-4 mr-1" />
            )}
            Atribuir
          </Button>

          {/* Desatribuir */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUnassign}
            disabled={isLoading}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <UserX className="h-4 w-4 mr-1" />
            )}
            Desatribuir
          </Button>

          {/* Resolver */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResolve}
            disabled={isLoading}
            className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Resolver
          </Button>

          {/* Arquivar */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleArchive}
            disabled={isLoading}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <Archive className="h-4 w-4 mr-1" />
            Arquivar
          </Button>

          {/* Marcar como não lida */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAsUnread}
            disabled={isLoading}
            className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <MailOpen className="h-4 w-4 mr-1" />
            Não lida
          </Button>
        </div>

        {/* Separador */}
        <div className="h-6 w-px bg-border mx-1" />

        {/* Fechar */}
        <Button
          variant="ghost"
          size="sm"
          onClick={exitSelectionMode}
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
      </div>

      {/* Dialog de Atribuição */}
      <AssignConversationDialog
        conversationId={selectedIdsArray[0] || ""}
        isBulk={true}
        bulkCount={selectionCount}
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        onAssign={handleAssign}
      />
    </>
  )
}
