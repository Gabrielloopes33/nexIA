"use client"

import { useState } from "react"
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
import { UserPlus, UserCheck, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useOrganizationMembers } from "@/hooks/use-organization-members"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AssignConversationDialogProps {
  conversationId: string
  currentAssignee?: { id: string; name: string } | null
  onAssign?: (agentId: string | null) => void
  trigger?: React.ReactNode
}

export function AssignConversationDialog({
  conversationId,
  currentAssignee,
  onAssign,
  trigger,
}: AssignConversationDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<string>(currentAssignee?.id || "")
  const [isLoading, setIsLoading] = useState(false)
  
  // Busca membros reais da organização
  const { members, isLoading: isLoadingMembers } = useOrganizationMembers()

  const handleAssign = async () => {
    if (!selectedAgent || selectedAgent === currentAssignee?.id) {
      setOpen(false)
      return
    }

    setIsLoading(true)

    try {
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Atribuir conversa">
            <UserPlus className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-[#46347F]" />
            {currentAssignee ? "Transferir Conversa" : "Atribuir Conversa"}
          </DialogTitle>
          <DialogDescription>
            {currentAssignee
              ? `Atualmente atribuída a ${currentAssignee.name}. Selecione outro agente para transferir.`
              : "Selecione um agente para atribuir esta conversa."}
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
                <SelectItem key={member.userId || member.id} value={member.userId || member.id}>
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
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            {currentAssignee && (
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
              disabled={!selectedAgent || isLoading || selectedAgent === currentAssignee?.id}
              className="flex-1 bg-[#46347F] hover:bg-[#8886d4] text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {currentAssignee ? "Transferir" : "Atribuir"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
