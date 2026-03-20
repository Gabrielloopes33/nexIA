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

// Mock de agentes - em produção viria da API
const MOCK_AGENTS = [
  { id: "agent-1", name: "João Silva", email: "joao@nexia.chat", avatar: "JS" },
  { id: "agent-2", name: "Maria Oliveira", email: "maria@nexia.chat", avatar: "MO" },
  { id: "agent-3", name: "Pedro Costa", email: "pedro@nexia.chat", avatar: "PC" },
]

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

  const handleAssign = async () => {
    if (!selectedAgent || selectedAgent === currentAssignee?.id) {
      setOpen(false)
      return
    }

    setIsLoading(true)

    try {
      // TODO: Implementar chamada real à API
      // await fetch(`/api/conversations/${conversationId}/assign`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ agentId: selectedAgent }),
      // })

      const agent = MOCK_AGENTS.find((a) => a.id === selectedAgent)
      
      // Simula delay da API
      await new Promise((resolve) => setTimeout(resolve, 500))

      toast.success("Conversa atribuída", {
        description: `Atribuída a ${agent?.name}`,
      })

      onAssign?.(selectedAgent)
      setOpen(false)
    } catch (error) {
      toast.error("Erro ao atribuir conversa")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnassign = async () => {
    setIsLoading(true)

    try {
      // TODO: Implementar chamada real à API
      await new Promise((resolve) => setTimeout(resolve, 500))

      toast.success("Atribuição removida", {
        description: "A conversa está disponível para outros agentes",
      })

      onAssign?.(null)
      setOpen(false)
    } catch (error) {
      toast.error("Erro ao remover atribuição")
    } finally {
      setIsLoading(false)
    }
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
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um agente..." />
            </SelectTrigger>
            <SelectContent>
              {MOCK_AGENTS.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-[#46347F]/10 flex items-center justify-center text-xs font-medium text-[#46347F]">
                      {agent.avatar}
                    </div>
                    <span>{agent.name}</span>
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
