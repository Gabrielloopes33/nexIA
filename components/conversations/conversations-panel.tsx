"use client"

import { useState, useCallback } from "react"
import { Search, Star, AlertCircle, Plus, Trash2, MoreVertical, CheckSquare, Square, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn, formatRelativeDate } from "@/lib/utils"
import { Conversation } from "@/lib/types/conversation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { useConversationSelection } from "@/lib/contexts/conversation-selection-context"
import { getUserIdFromSession } from "@/lib/auth/client"

type AssignmentFilter = 'all' | 'mine' | 'unassigned'

const avatarColors = [
  "bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400",
  "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
]

// Função para obter iniciais do nome
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const STATUS_CONFIG = {
  open: {
    label: "Aberta",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  },
  pending: {
    label: "Pendente",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  },
  solved: {
    label: "Resolvida",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  },
  closed: {
    label: "Fechada",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  },
}

const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: "bg-green-100 text-green-700",
  instagram: "bg-pink-100 text-pink-600",
  "chat-widget": "bg-purple-100 text-purple-700",
  sms: "bg-cyan-100 text-cyan-700",
}

interface Props {
  selectedId: string | null
  onSelect: (id: string) => void
  conversations?: Conversation[]
  onNewConversation?: () => void
  onDeleteConversation?: (id: string) => Promise<void>
  /** Habilita modo de seleção em massa */
  enableSelection?: boolean
}

export function ConversationsPanel({ 
  selectedId, 
  onSelect, 
  conversations = [], 
  onNewConversation,
  onDeleteConversation,
  enableSelection = true,
}: Props) {
  const [search, setSearch] = useState("")
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const currentUserId = getUserIdFromSession()
  
  // Contexto de seleção em massa
  const {
    selectedIds,
    isSelectionMode,
    toggleSelection,
    selectAll,
    deselectAll,
    clearSelection,
    enterSelectionMode,
    exitSelectionMode,
    isSelected,
    hasSelection,
    selectionCount,
  } = useConversationSelection()

  const filtered = conversations.filter((c) => {
    const searchMatch =
      c.contactName.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase()) ||
      (c.contactCompany?.toLowerCase().includes(search.toLowerCase()) ?? false)

    const assignmentMatch =
      assignmentFilter === 'mine'
        ? c.assignedTo?.id === currentUserId
        : assignmentFilter === 'unassigned'
        ? c.assignedTo === null
        : true

    return searchMatch && assignmentMatch
  })

  const allSelected = filtered.length > 0 && filtered.every((c) => isSelected(c.id))
  const someSelected = filtered.some((c) => isSelected(c.id)) && !allSelected

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      deselectAll()
    } else {
      selectAll(filtered.map((c) => c.id))
    }
  }, [allSelected, filtered, selectAll, deselectAll])

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setConversationToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!conversationToDelete || !onDeleteConversation) return
    
    setIsDeleting(true)
    try {
      await onDeleteConversation(conversationToDelete)
      toast.success("Conversa excluída com sucesso!")
    } catch (error) {
      toast.error("Erro ao excluir conversa")
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setConversationToDelete(null)
    }
  }

  const handleConversationClick = (convId: string) => {
    if (isSelectionMode) {
      toggleSelection(convId)
    } else {
      onSelect(convId)
    }
  }

  const handleCheckboxClick = (e: React.MouseEvent, convId: string) => {
    e.stopPropagation()
    if (!isSelectionMode) {
      enterSelectionMode()
    }
    toggleSelection(convId)
  }

  return (
    <>
      <div className="flex h-full w-[340px] shrink-0 flex-col border-r border-border bg-background">
        {/* Header */}
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground">
              {isSelectionMode ? `${selectionCount} selecionadas` : "Conversas"}
            </h2>
            <div className="flex items-center gap-2">
              {isSelectionMode ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exitSelectionMode}
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onNewConversation}
                  className="h-8 px-2 text-[#46347F] hover:text-[#46347F] hover:bg-[#46347F]/10"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nova
                </Button>
              )}
              <span className="text-xs text-muted-foreground">{filtered.length} total</span>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar conversas..."
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#46347F]/30"
            />
          </div>

          {/* Assignment Filter */}
          <div className="flex mt-2 rounded-lg border border-border overflow-hidden">
            {(
              [
                { value: 'all' as const, label: 'Todas' },
                { value: 'mine' as const, label: 'Minhas' },
                { value: 'unassigned' as const, label: 'Não atribuídas' },
              ]
            ).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setAssignmentFilter(value)}
                className={cn(
                  "flex-1 py-1.5 text-[11px] font-medium transition-colors",
                  assignmentFilter === value
                    ? "bg-[#46347F] text-white"
                    : "bg-background text-muted-foreground hover:bg-[#46347F]/10 hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Selection Controls */}
          {enableSelection && filtered.length > 0 && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={allSelected}
                  ref={(ref) => {
                    if (ref) {
                      (ref as HTMLButtonElement).indeterminate = someSelected
                    }
                  }}
                  onCheckedChange={handleSelectAll}
                  className="border-[#46347F] data-[state=checked]:bg-[#46347F] data-[state=checked]:text-white"
                />
                <span className="text-xs text-muted-foreground">
                  {allSelected ? "Desmarcar todos" : "Selecionar todos"}
                </span>
              </div>
              {isSelectionMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Limpar
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <p className="text-sm text-muted-foreground">
                {assignmentFilter === 'mine'
                  ? 'Nenhuma conversa atribuída a você.'
                  : assignmentFilter === 'unassigned'
                  ? 'Nenhuma conversa sem atribuição.'
                  : 'Nenhuma conversa encontrada.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((conv, i) => {
                const statusConfig = STATUS_CONFIG[conv.status]
                const isHighPriority = conv.priority === "high" || conv.priority === "urgent"
                const channelColor = CHANNEL_COLORS[conv.channel] || "bg-muted text-muted-foreground"
                const selected = isSelected(conv.id)

                return (
                  <li key={conv.id}>
                    <button
                      onClick={() => handleConversationClick(conv.id)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-all relative group",
                        selectedId === conv.id && !isSelectionMode
                          ? "bg-[#46347F]/8 border-l-2 border-[#46347F]"
                          : "hover:bg-accent border-l-2 border-transparent",
                        selected && isSelectionMode && "bg-[#46347F]/5"
                      )}
                    >
                      {/* Priority Indicator */}
                      {isHighPriority && (
                        <div className="absolute left-0 top-4 h-6 w-1 rounded-r bg-red-500" />
                      )}

                      {/* Checkbox (visible in selection mode or on hover) */}
                      {enableSelection && (
                        <div 
                          className={cn(
                            "shrink-0 pt-1",
                            !isSelectionMode && "opacity-0 group-hover:opacity-100 transition-opacity"
                          )}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={selected}
                            onCheckedChange={() => {
                              if (!isSelectionMode) enterSelectionMode()
                              toggleSelection(conv.id)
                            }}
                            className="border-[#46347F] data-[state=checked]:bg-[#46347F] data-[state=checked]:text-white"
                          />
                        </div>
                      )}

                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold",
                            avatarColors[i % avatarColors.length]
                          )}
                        >
                          {conv.contactAvatar}
                        </div>
                        {/* Assigned Agent Badge */}
                        {conv.assignedTo && (
                          <div
                            className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#46347F] text-[8px] font-bold text-white ring-2 ring-white"
                            title={`Atribuído a: ${conv.assignedTo.name}`}
                          >
                            {getInitials(conv.assignedTo.name)}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        {/* Header: Name + Time + Actions */}
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            {conv.starred && (
                              <Star className="h-3 w-3 shrink-0 fill-amber-500 text-amber-500" />
                            )}
                            <span className="truncate text-sm font-semibold text-foreground">
                              {conv.contactName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[11px] text-muted-foreground">
                              {formatRelativeDate(conv.lastMessageAt)
                                .replace(" atrás", "")
                                .replace("Hoje", "hoje")
                                .replace("Ontem", "ontem")}
                            </span>
                            {/* Delete Button (visible on hover) */}
                            {!isSelectionMode && onDeleteConversation && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    onClick={(e) => e.stopPropagation()}
                                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 transition-opacity"
                                  >
                                    <MoreVertical className="h-3 w-3 text-muted-foreground" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    onClick={(e) => handleDeleteClick(e, conv.id)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir conversa
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>

                        {/* Company */}
                        {conv.contactCompany && (
                          <p className="text-[11px] text-muted-foreground truncate mb-1">
                            {conv.contactCompany}
                          </p>
                        )}

                        {/* Preview */}
                        <p className="truncate text-xs text-muted-foreground mb-2">
                          {conv.lastMessage}
                        </p>

                        {/* Footer: Channel + Status + Unread */}
                        <div className="flex items-center gap-1.5">
                          {/* Channel Badge */}
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[10px] font-medium capitalize",
                              channelColor
                            )}
                          >
                            {conv.channel}
                          </span>

                          {/* Status Badge */}
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[10px] font-medium",
                              statusConfig.className
                            )}
                          >
                            {statusConfig.label}
                          </span>

                          {/* SLA Warning */}
                          {conv.slaStatus === "breach" && (
                            <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                          )}

                          {/* Unread Count */}
                          {conv.unreadCount > 0 && (
                            <span className="ml-auto flex h-5 items-center justify-center rounded-full bg-[#46347F] px-1.5 text-[10px] font-bold text-white min-w-5">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A conversa e todas as suas mensagens serão permanentemente removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
