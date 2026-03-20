"use client"

import { useState } from "react"
import {
  Users,
  Clock,
  CheckCircle2,
  Phone,
  Calendar,
  MoreHorizontal,
  Filter,
  Search,
  UserCheck,
  Trash2,
  AlertCircle,
  Loader2,
  Tag,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSchedulingQueue, SchedulingQueueItem } from "@/hooks/use-scheduling-queue"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { QueueStatus } from "@prisma/client"
import { useOrganizationId } from "@/lib/contexts/organization-context"

const STATUS_CONFIG: Record<QueueStatus, {
  label: string
  color: string
  bgColor: string
  icon: React.ElementType
}> = {
  WAITING: {
    label: "Aguardando",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    icon: Clock,
  },
  IN_PROGRESS: {
    label: "Em Atendimento",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    icon: UserCheck,
  },
  SCHEDULED: {
    label: "Agendado",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    icon: CheckCircle2,
  },
  COMPLETED: {
    label: "Concluído",
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelado",
    color: "text-red-600",
    bgColor: "bg-red-50",
    icon: AlertCircle,
  },
}

const PRIORITY_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: "Baixa", color: "bg-gray-100 text-gray-700" },
  1: { label: "Normal", color: "bg-blue-100 text-blue-700" },
  2: { label: "Alta", color: "bg-orange-100 text-orange-700" },
  3: { label: "Urgente", color: "bg-red-100 text-red-700" },
}

function QueueItemCard({
  item,
  onSchedule,
  onStart,
  onComplete,
  onRemove,
}: {
  item: SchedulingQueueItem
  onSchedule: (item: SchedulingQueueItem) => void
  onStart: (id: string) => void
  onComplete: (id: string) => void
  onRemove: (id: string) => void
}) {
  const statusConfig = STATUS_CONFIG[item.status]
  const StatusIcon = statusConfig.icon
  const priority = PRIORITY_LABELS[item.priority] || PRIORITY_LABELS[0]

  const getInitials = (name: string | null) => {
    if (!name) return "?"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const created = new Date(date)
    const diff = now.getTime() - created.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d atrás`
    if (hours > 0) return `${hours}h atrás`
    return "Agora"
  }

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-12 w-12">
            <AvatarImage src={item.contact.avatarUrl || undefined} />
            <AvatarFallback className="bg-[#46347F] text-white">
              {getInitials(item.contact.name)}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold text-foreground truncate">
                  {item.contact.name || "Sem nome"}
                </h4>
                <p className="text-sm text-muted-foreground">{item.contact.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={priority.color}>
                  {priority.label}
                </Badge>
                <Badge variant="secondary" className={cn(statusConfig.bgColor, statusConfig.color)}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>
            </div>

            {/* Tags do contato */}
            {item.contact.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.contact.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
                {item.contact.tags.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{item.contact.tags.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Notes */}
            {item.notes && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {item.notes}
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Na fila há {formatTimeAgo(item.createdAt)}</span>
                {item.assignedUser && (
                  <span className="flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    {item.assignedUser.name}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {item.status === "WAITING" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStart(item.id)}
                  >
                    Atender
                  </Button>
                )}
                {item.status === "IN_PROGRESS" && (
                  <Button
                    size="sm"
                    className="bg-[#46347F] hover:bg-[#7b79c4]"
                    onClick={() => onSchedule(item)}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Agendar
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {item.status === "WAITING" && (
                      <DropdownMenuItem onClick={() => onStart(item.id)}>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Iniciar Atendimento
                      </DropdownMenuItem>
                    )}
                    {item.status === "IN_PROGRESS" && (
                      <DropdownMenuItem onClick={() => onSchedule(item)}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Criar Agendamento
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onRemove(item.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover da Fila
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ScheduleModal({
  item,
  isOpen,
  onClose,
  onSchedule,
}: {
  item: SchedulingQueueItem | null
  isOpen: boolean
  onClose: () => void
  onSchedule: (data: {
    type: "meeting" | "call" | "task" | "deadline"
    title: string
    description?: string
    startTime: string
    endTime: string
    location?: string
  }) => void
}) {
  const [formData, setFormData] = useState({
    type: "call" as const,
    title: "",
    description: "",
    date: "",
    time: "",
    duration: 30,
    location: "",
  })

  if (!item) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const startTime = new Date(`${formData.date}T${formData.time}`)
    const endTime = new Date(startTime.getTime() + formData.duration * 60000)

    onSchedule({
      type: formData.type,
      title: formData.title,
      description: formData.description,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      location: formData.location,
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Agendar Atendimento</DialogTitle>
            <DialogDescription>
              Criar agendamento para {item.contact.name || item.contact.phone}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="call">Ligação</option>
                <option value="meeting">Reunião</option>
                <option value="task">Tarefa</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Título</label>
              <input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Ligação de apresentação"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Data</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Hora</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Duração (minutos)</label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1 hora</option>
                <option value={90}>1h 30min</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Local/Link</label>
              <input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Sala de reunião, Google Meet, etc..."
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes do atendimento..."
                rows={3}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#46347F] hover:bg-[#7b79c4]">
              <Calendar className="h-4 w-4 mr-2" />
              Criar Agendamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function FilaAtendimentoPage() {
  const [selectedStatus, setSelectedStatus] = useState<QueueStatus | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItem, setSelectedItem] = useState<SchedulingQueueItem | null>(null)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)

  const { items, isLoading, refresh, startProcessing, removeFromQueue, scheduleItem } =
    useSchedulingQueue(selectedStatus === "all" ? undefined : selectedStatus)

  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      item.contact.name?.toLowerCase().includes(query) ||
      item.contact.phone.includes(query) ||
      item.notes?.toLowerCase().includes(query)
    )
  })

  const stats = {
    waiting: items.filter((i) => i.status === "WAITING").length,
    inProgress: items.filter((i) => i.status === "IN_PROGRESS").length,
    scheduled: items.filter((i) => i.status === "SCHEDULED").length,
    total: items.length,
  }

  const handleSchedule = async (data: Parameters<typeof scheduleItem>[1]) => {
    if (!selectedItem) return
    await scheduleItem(selectedItem.id, data)
    setIsScheduleModalOpen(false)
    setSelectedItem(null)
  }

  const openScheduleModal = (item: SchedulingQueueItem) => {
    setSelectedItem(item)
    setIsScheduleModalOpen(true)
  }

  if (isLoading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-[#46347F]" />
        <p className="mt-4 text-sm text-muted-foreground">Carregando fila...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fila de Atendimento</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie leads aguardando agendamento
            </p>
          </div>
          <Button onClick={() => refresh()} variant="outline">
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aguardando</p>
                <p className="text-2xl font-bold">{stats.waiting}</p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Atendimento</p>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserCheck className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Agendados</p>
                <p className="text-2xl font-bold">{stats.scheduled}</p>
              </div>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-2 bg-[#46347F]/10 rounded-lg">
                <Users className="h-5 w-5 text-[#46347F]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          {[
            { key: "all", label: "Todos" },
            { key: "WAITING", label: "Aguardando" },
            { key: "IN_PROGRESS", label: "Em Atendimento" },
            { key: "SCHEDULED", label: "Agendados" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedStatus(tab.key as any)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                selectedStatus === tab.key
                  ? "bg-white text-[#46347F] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, telefone..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm"
            />
          </div>
        </div>
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-auto">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="p-4 bg-gray-100 rounded-full mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-foreground">
              Nenhum item na fila
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              {searchQuery
                ? "Nenhum resultado encontrado para sua busca."
                : "A fila de atendimento está vazia. Leads com a tag de agendamento aparecerão aqui."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <QueueItemCard
                key={item.id}
                item={item}
                onSchedule={openScheduleModal}
                onStart={startProcessing}
                onComplete={() => {}}
                onRemove={removeFromQueue}
              />
            ))}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      <ScheduleModal
        item={selectedItem}
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false)
          setSelectedItem(null)
        }}
        onSchedule={handleSchedule}
      />
    </div>
  )
}
