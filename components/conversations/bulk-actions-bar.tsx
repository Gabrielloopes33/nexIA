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
  MailOpen,
  Clock,
  ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useConversationSelection } from "@/lib/contexts/conversation-selection-context"
import { useBulkAssign } from "@/hooks/use-bulk-assign"
import { useConversations } from "@/hooks/use-conversations"
import { useOrganizationId } from "@/lib/contexts/organization-context"
import { AssignConversationDialog } from "./assign-conversation-dialog"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  const [isResolving, setIsResolving] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const organizationId = useOrganizationId()

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

  const handleResolve = async () => {
    setIsResolving(true)
    try {
      const promises = selectedIdsArray.map(id =>
        fetch(`/api/conversations/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'CLOSED' }),
        })
      )
      
      await Promise.all(promises)
      toast.success(`${selectionCount} ${selectionCount === 1 ? 'conversa resolvida' : 'conversas resolvidas'}`)
      clearSelection()
      onActionComplete?.()
    } catch {
      toast.error("Erro ao resolver conversas")
    } finally {
      setIsResolving(false)
    }
  }

  const handleArchive = async () => {
    setIsArchiving(true)
    try {
      const promises = selectedIdsArray.map(id =>
        fetch(`/api/conversations/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ archived: true }),
        })
      )
      
      await Promise.all(promises)
      toast.success(`${selectionCount} ${selectionCount === 1 ? 'conversa arquivada' : 'conversas arquivadas'}`)
      clearSelection()
      onActionComplete?.()
    } catch {
      toast.error("Erro ao arquivar conversas")
    } finally {
      setIsArchiving(false)
    }
  }

  const handleRemind = async (minutes: number, label: string) => {
    if (!organizationId) {
      toast.error("Organização não identificada")
      return
    }
    
    const remindAt = new Date(Date.now() + minutes * 60 * 1000)
    
    try {
      // Cria notificação/lembrete para cada conversa
      const promises = selectedIdsArray.map(id =>
        fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId,
            type: 'TASK',
            title: '⏰ Lembrete de conversa',
            message: `Verificar conversa - lembrete para ${label}`,
            link: `/conversas?id=${id}`,
            metadata: {
              scheduledFor: remindAt.toISOString(),
              conversationId: id,
              reminderMinutes: minutes,
            },
          }),
        })
      )
      
      await Promise.all(promises)
      toast.success(`Lembrete criado para ${label}`, {
        description: `Você será notificado às ${remindAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      })
      clearSelection()
    } catch {
      toast.error("Erro ao criar lembrete")
    }
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
            disabled={isLoading || isResolving}
            className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
          >
            {isResolving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-1" />
            )}
            Resolver
          </Button>

          {/* Arquivar */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleArchive}
            disabled={isLoading || isArchiving}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            {isArchiving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Archive className="h-4 w-4 mr-1" />
            )}
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

          {/* Lembrar-me em */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isLoading}
                className="h-8 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
              >
                <Clock className="h-4 w-4 mr-1" />
                Lembrar-me
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleRemind(20, '20 minutos')}>
                20 minutos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRemind(60, '1 hora')}>
                1 hora
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRemind(120, '2 horas')}>
                2 horas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRemind(24 * 60, '24 horas')}>
                24 horas
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
