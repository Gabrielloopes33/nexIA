"use client"

import { useState, useCallback } from "react"
import { Search, Star, AlertCircle, Plus, Trash2, MoreVertical, CheckSquare, Square, X, Archive, ChevronDown } from "lucide-react"
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
import { useCurrentUser } from "@/hooks/use-current-user"
import { ProductSwitcher } from "@/components/products/product-switcher"

type AssignmentFilter = 'all' | 'mine' | 'unassigned'
type ArchiveFilter = 'active' | 'archived'

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

// Componentes SVG das logos
const FacebookLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

const WhatsAppLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

const InstagramLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
)

const ChatLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)

const SmsLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
    <path d="M7 9h10v2H7zm0-3h10v2H7z"/>
  </svg>
)

// Ícones dos canais
const CHANNEL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  whatsapp: WhatsAppLogo,
  instagram: InstagramLogo,
  chat: ChatLogo,
  iframe: ChatLogo,
  sms: SmsLogo,
}

// Labels para tooltip
const INSTANCE_TYPE_LABELS: Record<string, string> = {
  OFFICIAL: "WhatsApp API Oficial (Meta)",
  EVOLUTION: "WhatsApp Evolution (Não Oficial)",
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
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('active')
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { user } = useCurrentUser()
  const currentUserId = user?.userId ?? null

  // Tags únicas de todas as conversas (para exibir os chips de filtro)
  const availableTags = Array.from(
    new Set(conversations.flatMap((c) => c.tags ?? []))
  ).sort()

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev)
      next.has(tag) ? next.delete(tag) : next.add(tag)
      return next
    })
  }

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

    const tagMatch =
      selectedTags.size === 0
        ? true
        : (c.tags ?? []).some((t) => selectedTags.has(t))

    const archiveMatch =
      archiveFilter === 'archived'
        ? (c as any).archived === true
        : (c as any).archived !== true

    return searchMatch && assignmentMatch && tagMatch && archiveMatch
  })

  const allSelected = filtered.length > 0 && filtered.every((c) => isSelected(c.id))
  const someSelected = filtered.some((c) => isSelected(c.id)) && !allSelected

  // Contador total de mensagens não lidas
  const totalUnread = filtered.reduce((sum, c) => sum + (c.unreadCount || 0), 0)

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
          <div className="flex items-center justify-between mb-3 gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">
                {isSelectionMode ? `${selectionCount} selecionadas` : "Conversas"}
              </h2>
              {!isSelectionMode && totalUnread > 0 && (
                <span className="flex h-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white min-w-5">
                  {totalUnread}
                </span>
              )}
            </div>
            <ProductSwitcher />
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

          {/* Assignment Filter + Archive Dropdown */}
          <div className="flex mt-2 gap-2">
            <div className="flex flex-1 rounded-lg border border-border overflow-hidden">
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
            
            {/* Archive Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-colors",
                    archiveFilter === 'archived'
                      ? "bg-amber-100 text-amber-700 border-amber-200"
                      : "bg-background text-muted-foreground border-border hover:bg-[#46347F]/10 hover:text-foreground"
                  )}
                >
                  <Archive className="h-3 w-3" />
                  {archiveFilter === 'archived' ? 'Arquivadas' : 'Ativas'}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem 
                  onClick={() => setArchiveFilter('active')}
                  className={cn(
                    "text-xs cursor-pointer",
                    archiveFilter === 'active' && "bg-[#46347F]/10 text-[#46347F]"
                  )}
                >
                  <span className="flex-1">Ativas</span>
                  {archiveFilter === 'active' && <span className="text-[#46347F]">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setArchiveFilter('archived')}
                  className={cn(
                    "text-xs cursor-pointer",
                    archiveFilter === 'archived' && "bg-[#46347F]/10 text-[#46347F]"
                  )}
                >
                  <span className="flex-1">Arquivadas</span>
                  {archiveFilter === 'archived' && <span className="text-[#46347F]">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Tag Filter */}
          {availableTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors border",
                    selectedTags.has(tag)
                      ? "bg-[#46347F] text-white border-[#46347F]"
                      : "bg-background text-muted-foreground border-border hover:border-[#46347F]/50 hover:text-foreground"
                  )}
                >
                  {tag}
                </button>
              ))}
              {selectedTags.size > 0 && (
                <button
                  onClick={() => setSelectedTags(new Set())}
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Limpar
                </button>
              )}
            </div>
          )}

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
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">({filtered.length} total)</span>
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
            </div>
          )}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <p className="text-sm text-muted-foreground">
                {archiveFilter === 'archived'
                  ? 'Nenhuma conversa arquivada.'
                  : assignmentFilter === 'mine'
                  ? 'Nenhuma conversa atribuída a você.'
                  : assignmentFilter === 'unassigned'
                  ? 'Nenhuma conversa sem atribuição.'
                  : 'Nenhuma conversa encontrada.'}
              </p>
              {archiveFilter === 'archived' && (
                <button
                  onClick={() => setArchiveFilter('active')}
                  className="mt-2 text-xs text-[#46347F] hover:underline"
                >
                  Ver conversas ativas
                </button>
              )}
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
                        selected && isSelectionMode && "bg-[#46347F]/5",
                        conv.unreadCount > 0 && selectedId !== conv.id && "bg-blue-50/50 dark:bg-blue-900/10"
                      )}
                    >
                      {/* Priority Indicator */}
                      {isHighPriority && (
                        <div className="absolute left-0 top-4 h-6 w-1 rounded-r bg-red-500" />
                      )}

                      {/* Checkbox (visible in selection mode or on hover) */}
                      {enableSelection && (
                        <span 
                          className={cn(
                            "shrink-0 pt-1 pointer-events-auto",
                            !isSelectionMode && "opacity-0 group-hover:opacity-100 transition-opacity"
                          )}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (!isSelectionMode) enterSelectionMode()
                            toggleSelection(conv.id)
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <Checkbox
                            checked={selected}
                            onCheckedChange={() => {}}
                            className="border-[#46347F] data-[state=checked]:bg-[#46347F] data-[state=checked]:text-white pointer-events-none"
                          />
                        </span>
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
                            {/* Channel Icon */}
                            {(() => {
                              // WhatsApp Oficial = Logo do Facebook (Meta)
                              if (conv.channel === 'whatsapp' && conv.instanceType === 'OFFICIAL') {
                                return (
                                  <span title={INSTANCE_TYPE_LABELS.OFFICIAL}>
                                    <FacebookLogo className="h-4 w-4 shrink-0 text-[#1877F2]" />
                                  </span>
                                )
                              }
                              
                              // Outros canais
                              const ChannelIcon = CHANNEL_ICONS[conv.channel]
                              const tooltipLabel = conv.channel === 'whatsapp' && conv.instanceType === 'EVOLUTION'
                                ? INSTANCE_TYPE_LABELS.EVOLUTION
                                : null
                              
                              // Cores por canal
                              const channelColors: Record<string, string> = {
                                whatsapp: 'text-green-500',    // WhatsApp Evolution
                                instagram: 'text-pink-500',
                                chat: 'text-purple-500',
                                iframe: 'text-purple-500',
                                sms: 'text-cyan-500',
                              }
                              
                              if (ChannelIcon) {
                                return (
                                  <span title={tooltipLabel || undefined}>
                                    <ChannelIcon className={cn("h-4 w-4 shrink-0", channelColors[conv.channel] || "text-muted-foreground")} />
                                  </span>
                                )
                              }
                              return null
                            })()}
                            <span className={cn(
                              "truncate text-sm text-foreground",
                              conv.unreadCount > 0 ? "font-bold" : "font-semibold"
                            )}>
                              {conv.contactName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[11px] text-muted-foreground">
                              {formatRelativeDate(conv.lastMessageAt)
                                .replace(" atrás", "")
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

                          {/* Não Lida Badge */}
                          {conv.unreadCount > 0 && (
                            <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                              Não lida
                            </span>
                          )}

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
