"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserPlus, UserCheck, Loader2, Users } from "lucide-react"
import { toast } from "sonner"
import { useOrganizationMembers } from "@/hooks/use-organization-members"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface AssignConversationDialogProps {
  /** ID da conversa (para modo individual) */
  conversationId?: string
  /** Agente atualmente atribuído (modo individual) */
  currentAssignee?: { id: string; name: string } | null
  /** Callback quando atribuir */
  onAssign?: (agentId: string | null) => void
  /** Trigger customizado */
  trigger?: React.ReactNode
  
  // Modo bulk (atribuição em lote)
  /** Indica se é modo de atribuição em lote */
  isBulk?: boolean
  /** Quantidade de conversas selecionadas (modo bulk) */
  bulkCount?: number
  /** Controle externo do estado do dialog (modo bulk) */
  open?: boolean
  /** Callback quando o estado do dialog muda (modo bulk) */
  onOpenChange?: (open: boolean) => void
}

export function AssignConversationDialog({
  conversationId,
  currentAssignee,
  onAssign,
  trigger,
  isBulk = false,
  bulkCount = 0,
  open: controlledOpen,
  onOpenChange,
}: AssignConversationDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<string>(currentAssignee?.id || "")
  const [isLoading, setIsLoading] = useState(false)
  
  // Usa controle externo ou interno
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  
  // Busca membros reais da organização
  const { members, isLoading: isLoadingMembers } = useOrganizationMembers()

  // Reset selected agent quando abre/fecha
  useEffect(() => {
    if (open) {
      setSelectedAgent(currentAssignee?.id || "")
    }
  }, [open, currentAssignee])

  const handleAssign = async () => {
    if (!selectedAgent) {
      setOpen(false)
      return
    }

    // Se é modo individual e não mudou, fecha
    if (!isBulk && selectedAgent === currentAssignee?.id) {
      setOpen(false)
      return
    }

    setIsLoading(true)

    try {
      if (isBulk) {
        // Modo bulk: chama callback diretamente
        onAssign?.(selectedAgent)
      } else if (conversationId) {
        // Modo individual: chama API
        const response = await fetch(`/api/conversations/${conversationId}/assign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId: selectedAgent }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Erro ao atribuir conversa")
        }

        const agent = members.find((m) => m.userId === selectedAgent)
        
        toast.success("Conversa atribuída", {
          description: `Atribuída a ${agent?.name || "agente"}`,
        })

        onAssign?.(selectedAgent)
      }
      
      setOpen(false)
    } catch (error: any) {
      toast.error("Erro ao atribuir conversa", {
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnassign = async () => {
    if (isBulk) {
      // Em modo bulk, desatribuir é feito pelo BulkActionsBar
      return
    }

    if (!conversationId) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/conversations/${conversationId}/assign`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao remover atribuição")
      }

      toast.success("Atribuição removida", {
        description: "A conversa está disponível para outros agentes",
      })

      onAssign?.(null)
      setOpen(false)
    } catch (error: any) {
      toast.error("Erro ao remover atribuição", {
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filtra apenas membros ativos
  const activeMembers = members.filter(m => m.status === 'ACTIVE')

  // Gera as iniciais do nome para o avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  // Determina o título e descrição baseado no modo
  const title = isBulk 
    ? `Atribuir ${bulkCount} ${bulkCount === 1 ? 'Conversa' : 'Conversas'}`
    : currentAssignee 
      ? "Transferir Conversa" 
      : "Atribuir Conversa"

  const description = isBulk
    ? `Selecione um agente para atribuir ${bulkCount === 1 ? 'esta conversa' : 'estas conversas'}.`
    : currentAssignee
      ? `Atualmente atribuída a ${currentAssignee.name}. Selecione outro agente para transferir.`
      : "Selecione um agente para atribuir esta conversa."

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isBulk ? (
              <Users className="h-5 w-5 text-[#46347F]" />
            ) : (
              <UserCheck className="h-5 w-5 text-[#46347F]" />
            )}
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Select
            value={selectedAgent}
            onValueChange={setSelectedAgent}
            disabled={isLoading || isLoadingMembers}
          >
            <SelectTrigger>
              <SelectValue placeholder={isLoadingMembers ? "Carregando agentes..." : "Selecione um agente..."} />
            </SelectTrigger>
            <SelectContent>
              {activeMembers.length === 0 && !isLoadingMembers && (
                <SelectItem value="no-members" disabled>
                  Nenhum agente disponível
                </SelectItem>
              )}
              {activeMembers.map((member) => (
                <SelectItem 
                  key={member.userId || member.id} 
                  value={member.userId || member.id}
                  disabled={member.userId === currentAssignee?.id && !isBulk}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={member.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs bg-[#46347F]/10 text-[#46347F]">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{member.name}</span>
                    {member.role === 'ADMIN' && (
                      <span className="text-xs text-muted-foreground">(Admin)</span>
                    )}
                    {member.userId === currentAssignee?.id && !isBulk && (
                      <span className="text-xs text-emerald-600">(Atual)</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            {!isBulk && currentAssignee && (
              <Button
                variant="outline"
                onClick={handleUnassign}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Remover Atribuição"
                )}
              </Button>
            )}
            <Button
              onClick={handleAssign}
              disabled={!selectedAgent || isLoading || (!isBulk && selectedAgent === currentAssignee?.id)}
              className={cn(
                "flex-1 bg-[#46347F] hover:bg-[#8886d4] text-white",
                isBulk && "bg-[#46347F]"
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {isBulk 
                ? `Atribuir ${bulkCount > 1 ? bulkCount : ''}` 
                : currentAssignee 
                  ? "Transferir" 
                  : "Atribuir"
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
