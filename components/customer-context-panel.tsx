"use client"

import {
  Building2,
  Phone,
  MapPin,
  Globe,
  Calendar,
  MessageSquare,
  DollarSign,
  Clock,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Tag as TagIcon,
  Loader2,
  RefreshCw,
  FileText,
  PhoneCall,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
  Bot,
  CalendarPlus,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDate, formatCurrency } from "@/lib/utils"
import type { Conversation } from "@/lib/types/conversation"
import type { Contact } from "@/hooks/use-contacts"
import { useState, useEffect } from "react"
import { useContactDeals, ContactDeal } from "@/hooks/use-contact-deals"
import { useContactTimeline, TimelineEvent } from "@/hooks/use-contact-timeline"
import { useSchedules } from "@/hooks/use-schedules"
import { useOrganizationId } from "@/lib/contexts/organization-context"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"

interface Props {
  conversation?: Conversation | null
  contact?: Contact | null
}

// Mapear tipos de atividades do timeline para ícones e cores
const activityConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  message: { icon: MessageSquare, color: "text-blue-500", bgColor: "bg-blue-500", label: "Mensagem" },
  whatsapp: { icon: MessageSquare, color: "text-green-500", bgColor: "bg-green-500", label: "WhatsApp" },
  note: { icon: FileText, color: "text-purple-500", bgColor: "bg-purple-500", label: "Nota" },
  call: { icon: PhoneCall, color: "text-green-500", bgColor: "bg-green-500", label: "Ligação" },
  meeting: { icon: Users, color: "text-orange-500", bgColor: "bg-orange-500", label: "Reunião" },
  task: { icon: CheckCircle2, color: "text-yellow-500", bgColor: "bg-yellow-500", label: "Tarefa" },
  deal: { icon: DollarSign, color: "text-[#46347F]", bgColor: "bg-[#46347F]", label: "Negócio" },
}

export function CustomerContextPanel({ conversation, contact }: Props) {
  const contactId = conversation?.contactId || contact?.id || null

  const getContactAvatar = () => {
    if (conversation?.contactAvatar) return conversation.contactAvatar
    if (contact?.name) return contact.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    if (contact?.phone) return contact.phone.slice(0, 2)
    return '??'
  }

  const getContactName = () => {
    return conversation?.contactName || contact?.name || contact?.phone || 'Sem nome'
  }

  const getContactPhone = () => {
    return conversation?.contactPhone || contact?.phone
  }

  const getContactPosition = () => {
    return conversation?.contactPosition || (contact?.metadata?.jobTitle as string) || undefined
  }

  const getContactCompany = () => {
    return conversation?.contactCompany || (contact?.metadata?.company as string) || undefined
  }

  const getTags = () => {
    return conversation?.tags || contact?.tags || []
  }

  const getMessageCount = () => {
    return conversation?.messageCount || 0
  }

  const getUnreadCount = () => {
    return conversation?.unreadCount || 0
  }
  const [showAllActivities, setShowAllActivities] = useState(false)
  const [dealsExpanded, setDealsExpanded] = useState(true)
  const [activitiesExpanded, setActivitiesExpanded] = useState(true)
  const [schedulesExpanded, setSchedulesExpanded] = useState(true)
  const [notesExpanded, setNotesExpanded] = useState(true)
  const [isCreateDealOpen, setIsCreateDealOpen] = useState(false)
  const [isCreateScheduleOpen, setIsCreateScheduleOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false)
  const [contactData, setContactData] = useState<any>(null)
  const [isLoadingContact, setIsLoadingContact] = useState(false)

  // Notes state
  interface ContactNote { id: string; text: string; author: string; createdAt: string }
  const [notes, setNotes] = useState<ContactNote[]>([])
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)
  const [newNoteText, setNewNoteText] = useState('')
  const [isSubmittingNote, setIsSubmittingNote] = useState(false)

  // Form state for new deal
  const [dealForm, setDealForm] = useState({
    title: '',
    value: '',
    description: '',
  })

  // Form state for new schedule
  const [scheduleForm, setScheduleForm] = useState({
    type: 'meeting' as 'meeting' | 'call' | 'task' | 'deadline',
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    description: '',
    location: '',
  })

  const organizationId = useOrganizationId()

  // Buscar dados do contato (incluindo metadata do Typebot)
  useEffect(() => {
    if (!contactId) return
    setIsLoadingContact(true)
    fetch(`/api/contacts/${contactId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setContactData(data.data)
      })
      .catch(() => {})
      .finally(() => setIsLoadingContact(false))
  }, [contactId])

  // Buscar notas do contato
  const fetchNotes = async (targetContactId: string) => {
    setIsLoadingNotes(true)
    try {
      const res = await fetch(`/api/contacts/${targetContactId}/notes`)
      const data = await res.json()
      if (data.success) setNotes(data.data)
    } catch {}
    finally { setIsLoadingNotes(false) }
  }

  useEffect(() => {
    if (!contactId) { setNotes([]); return }
    fetchNotes(contactId)
  }, [contactId])

  // Buscar dados reais do backend
  const { 
    deals, 
    isLoading: isLoadingDeals, 
    error: dealsError, 
    refresh: refreshDeals 
  } = useContactDeals(contactId)

  const {
    events: timelineEvents,
    isLoading: isLoadingTimeline,
    error: timelineError,
    refresh: refreshTimeline
  } = useContactTimeline(contactId)

  const {
    schedules,
    isLoading: isLoadingSchedules,
    error: schedulesError,
    refreshSchedules,
    createSchedule,
    deleteSchedule,
  } = useSchedules(undefined, contactId ? { contactId } : undefined)

  // Filtrar apenas deals abertos para exibição principal
  const openDeals = deals.filter(d => d.status === 'OPEN')
  const hasDeals = deals.length > 0

  // Preparar atividades para exibição (excluir mensagens duplicadas se necessário)
  const activities = timelineEvents.filter(event => 
    ['note', 'call', 'meeting', 'task', 'deal'].includes(event.type)
  )
  const displayedActivities = showAllActivities ? activities : activities.slice(0, 5)

  const isLoading = isLoadingDeals || isLoadingTimeline

  // Buscar estágio padrão do pipeline
  const fetchDefaultStage = async () => {
    try {
      const response = await fetch('/api/pipeline/stages')
      const data = await response.json()
      if (data.success && data.data.length > 0) {
        // Retorna o primeiro estágio ou o que tem isDefault = true
        const defaultStage = data.data.find((s: any) => s.isDefault) || data.data[0]
        return defaultStage.id
      }
      return null
    } catch {
      return null
    }
  }

  // Criar novo negócio
  const handleCreateDeal = async () => {
    if (!contactId || !organizationId) {
      toast.error('Informações incompletas')
      return
    }

    if (!dealForm.title.trim()) {
      toast.error('Título do negócio é obrigatório')
      return
    }

    setIsSubmitting(true)
    try {
      // Busca o estágio padrão
      const stageId = await fetchDefaultStage()
      if (!stageId) {
        throw new Error('Nenhum estágio encontrado no pipeline. Configure o pipeline primeiro.')
      }

      const response = await fetch('/api/pipeline/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: dealForm.title,
          value: parseFloat(dealForm.value) || 0,
          description: dealForm.description,
          contactId: contactId,
          stageId,
          channel: 'whatsapp',
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao criar negócio')
      }

      toast.success('Negócio criado com sucesso!')
      setDealForm({ title: '', value: '', description: '' })
      setIsCreateDealOpen(false)
      refreshDeals()
      refreshTimeline()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar negócio')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Deletar negócio
  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm('Tem certeza que deseja excluir este negócio?')) return

    try {
      const response = await fetch(`/api/pipeline/deals/${dealId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir negócio')
      }

      toast.success('Negócio excluído com sucesso!')
      refreshDeals()
      refreshTimeline()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir negócio')
    }
  }

  // Criar nota
  const handleCreateNote = async () => {
    if (!contactId || !newNoteText.trim()) return
    setIsSubmittingNote(true)
    try {
      const res = await fetch(`/api/contacts/${contactId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newNoteText }),
      })
      const data = await res.json()
      if (data.success) {
        setNotes(prev => [...prev, data.data])
        setNewNoteText('')
        refreshTimeline()
      } else {
        toast.error('Erro ao salvar nota')
      }
    } catch {
      toast.error('Erro ao salvar nota')
    } finally {
      setIsSubmittingNote(false)
    }
  }

  // Deletar nota
  const handleDeleteNote = async (noteId: string) => {
    if (!contactId) return
    if (!confirm('Excluir esta nota?')) return
    try {
      const res = await fetch(`/api/contacts/${contactId}/notes`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId }),
      })
      const data = await res.json()
      if (data.success) {
        setNotes(prev => prev.filter(n => n.id !== noteId))
        refreshTimeline()
      } else {
        toast.error('Erro ao excluir nota')
      }
    } catch {
      toast.error('Erro ao excluir nota')
    }
  }

  // Criar novo agendamento
  const handleCreateSchedule = async () => {
    if (!contactId || !organizationId) {
      toast.error('Informações incompletas')
      return
    }
    if (!scheduleForm.title.trim()) {
      toast.error('Título é obrigatório')
      return
    }
    if (!scheduleForm.date || !scheduleForm.startTime || !scheduleForm.endTime) {
      toast.error('Data, hora de início e fim são obrigatórios')
      return
    }

    const startTime = new Date(`${scheduleForm.date}T${scheduleForm.startTime}:00`)
    const endTime = new Date(`${scheduleForm.date}T${scheduleForm.endTime}:00`)

    if (endTime <= startTime) {
      toast.error('Hora de fim deve ser após a hora de início')
      return
    }

    setIsSubmittingSchedule(true)
    try {
      const result = await createSchedule({
        type: scheduleForm.type as any,
        title: scheduleForm.title,
        description: scheduleForm.description || undefined,
        contactId: contactId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        location: scheduleForm.location || undefined,
      })

      if (result) {
        toast.success('Agendamento criado com sucesso!')
        setScheduleForm({ type: 'meeting', title: '', date: '', startTime: '', endTime: '', description: '', location: '' })
        setIsCreateScheduleOpen(false)
        refreshTimeline()
      } else {
        toast.error('Erro ao criar agendamento')
      }
    } catch {
      toast.error('Erro ao criar agendamento')
    } finally {
      setIsSubmittingSchedule(false)
    }
  }

  // Deletar agendamento
  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return
    const success = await deleteSchedule(scheduleId)
    if (success) {
      toast.success('Agendamento excluído!')
      refreshTimeline()
    } else {
      toast.error('Erro ao excluir agendamento')
    }
  }

  if (!conversation && !contact) {
    return (
      <div className="flex w-[320px] shrink-0 flex-col items-center justify-center bg-background border-l border-border px-6 py-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#46347F]/10">
          <Building2 className="h-8 w-8 text-[#46347F]" />
        </div>
        <p className="mt-4 text-sm font-semibold text-foreground text-center">
          Nenhum contato selecionado
        </p>
        <p className="mt-1 text-xs text-muted-foreground text-center">
          Selecione um contato para ver o contexto do cliente
        </p>
      </div>
    )
  }

  return (
    <div className="flex w-[320px] shrink-0 flex-col bg-background border-l border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h3 className="text-sm font-semibold text-foreground">Contexto do Cliente</h3>
        <div className="flex items-center gap-1">
          {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => {
              refreshDeals()
              refreshTimeline()
            }}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Customer Info */}
        <div className="border-b border-border px-5 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
              {getContactAvatar()}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-foreground truncate">
                {getContactName()}
              </h4>
              {getContactPosition() && (
                <p className="text-xs text-muted-foreground truncate">
                  {getContactPosition()}
                </p>
              )}
              {getContactCompany() && (
                <p className="text-xs font-medium text-foreground mt-1 flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {getContactCompany()}
                </p>
              )}
            </div>
          </div>

          {/* Contact Details */}
          <div className="mt-4 space-y-2">
            {getContactPhone() && (
              <div className="flex items-center gap-2 text-xs">
                <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <a href={`tel:${getContactPhone()}`} className="text-foreground hover:underline">
                  {getContactPhone()}
                </a>
              </div>
            )}
          </div>

          {/* Tags */}
          {getTags().length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {getTags().map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="text-[10px] font-medium px-2 py-0.5 flex items-center gap-1"
                >
                  <TagIcon className="h-2.5 w-2.5" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 border-b border-border px-5 py-4">
          <div className="rounded-lg bg-muted/50 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium uppercase">Mensagens</span>
            </div>
            <p className="text-lg font-bold text-foreground">{getMessageCount()}</p>
          </div>

          <div className="rounded-lg bg-muted/50 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium uppercase">Não Lidas</span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {getUnreadCount()}
            </p>
          </div>
        </div>

        {/* Related Deals */}
        <div className="border-b border-border">
          <button
            onClick={() => setDealsExpanded(!dealsExpanded)}
            className="flex w-full items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">Negócios Relacionados</span>
              <Badge variant="secondary" className="text-[10px] h-5">
                {isLoadingDeals ? '...' : deals.length}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              {/* Botão Novo Negócio */}
              <Dialog open={isCreateDealOpen} onOpenChange={setIsCreateDealOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Novo Negócio</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Título *</Label>
                      <Input
                        id="title"
                        value={dealForm.title}
                        onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })}
                        placeholder="Ex: Contrato Anual - Plano Pro"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="value">Valor (R$)</Label>
                      <Input
                        id="value"
                        type="number"
                        value={dealForm.value}
                        onChange={(e) => setDealForm({ ...dealForm, value: e.target.value })}
                        placeholder="0,00"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Input
                        id="description"
                        value={dealForm.description}
                        onChange={(e) => setDealForm({ ...dealForm, description: e.target.value })}
                        placeholder="Detalhes do negócio..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button 
                      onClick={handleCreateDeal}
                      disabled={isSubmitting}
                      className="bg-[#46347F] hover:bg-[#46347F]/90"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        'Criar Negócio'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {dealsExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>

          {dealsExpanded && (
            <div className="px-5 pb-4 space-y-2">
              {isLoadingDeals ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : dealsError ? (
                <div className="flex items-center gap-2 py-3 text-xs text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <span>Erro ao carregar negócios</span>
                </div>
              ) : !hasDeals ? (
                <div className="py-3 text-xs text-muted-foreground text-center">
                  Nenhum negócio encontrado
                </div>
              ) : (
                deals.map((deal) => (
                  <div
                    key={deal.id}
                    className="rounded-lg border border-border bg-background p-3 hover:bg-muted/30 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-xs font-semibold text-foreground line-clamp-2">{deal.title}</p>
                      <div className="flex items-center gap-1">
                        <Badge 
                          variant="outline" 
                          className="text-[9px] shrink-0"
                          style={{ 
                            borderColor: deal.status === 'OPEN' ? deal.stage.color : undefined,
                            color: deal.status === 'OPEN' ? deal.stage.color : undefined 
                          }}
                        >
                          {deal.status === 'OPEN' ? deal.stage.name : 
                           deal.status === 'WON' ? 'Ganho' :
                           deal.status === 'LOST' ? 'Perdido' :
                           deal.status === 'PAUSED' ? 'Pausado' : deal.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteDeal(deal.id)}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-[#46347F]">
                        {formatCurrency(deal.value)}
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        {deal.stage.probability}% prob.
                      </span>
                    </div>
                    {deal.assignedUser && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Responsável: {deal.assignedUser.name}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Schedules */}
        <div className="border-b border-border">
          <button
            onClick={() => setSchedulesExpanded(!schedulesExpanded)}
            className="flex w-full items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <CalendarPlus className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">Agendamentos</span>
              <Badge variant="secondary" className="text-[10px] h-5">
                {isLoadingSchedules ? '...' : schedules.length}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Dialog open={isCreateScheduleOpen} onOpenChange={setIsCreateScheduleOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[440px]">
                  <DialogHeader>
                    <DialogTitle>Novo Agendamento</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="sched-type">Tipo *</Label>
                      <Select
                        value={scheduleForm.type}
                        onValueChange={(v) => setScheduleForm({ ...scheduleForm, type: v as any })}
                      >
                        <SelectTrigger id="sched-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="meeting">Reunião</SelectItem>
                          <SelectItem value="call">Ligação</SelectItem>
                          <SelectItem value="task">Tarefa</SelectItem>
                          <SelectItem value="deadline">Prazo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="sched-title">Título *</Label>
                      <Input
                        id="sched-title"
                        value={scheduleForm.title}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                        placeholder="Ex: Reunião de apresentação"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="sched-date">Data *</Label>
                      <Input
                        id="sched-date"
                        type="date"
                        value={scheduleForm.date}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <Label htmlFor="sched-start">Início *</Label>
                        <Input
                          id="sched-start"
                          type="time"
                          value={scheduleForm.startTime}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="sched-end">Fim *</Label>
                        <Input
                          id="sched-end"
                          type="time"
                          value={scheduleForm.endTime}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="sched-location">Local</Label>
                      <Input
                        id="sched-location"
                        value={scheduleForm.location}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })}
                        placeholder="Ex: Google Meet, Escritório..."
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="sched-desc">Descrição</Label>
                      <Textarea
                        id="sched-desc"
                        value={scheduleForm.description}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                        placeholder="Detalhes do agendamento..."
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button
                      onClick={handleCreateSchedule}
                      disabled={isSubmittingSchedule}
                      className="bg-[#46347F] hover:bg-[#46347F]/90"
                    >
                      {isSubmittingSchedule ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        'Criar Agendamento'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {schedulesExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>

          {schedulesExpanded && (
            <div className="px-5 pb-4 space-y-2">
              {isLoadingSchedules ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : schedulesError ? (
                <div className="flex items-center gap-2 py-3 text-xs text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <span>Erro ao carregar agendamentos</span>
                </div>
              ) : schedules.length === 0 ? (
                <div className="py-3 text-xs text-muted-foreground text-center">
                  Nenhum agendamento encontrado
                </div>
              ) : (
                schedules.map((schedule) => {
                  const typeLabels: Record<string, string> = {
                    meeting: 'Reunião',
                    call: 'Ligação',
                    task: 'Tarefa',
                    deadline: 'Prazo',
                  }
                  const typeColors: Record<string, string> = {
                    meeting: 'text-orange-500',
                    call: 'text-green-500',
                    task: 'text-yellow-500',
                    deadline: 'text-red-500',
                  }
                  const statusLabels: Record<string, string> = {
                    pending: 'Pendente',
                    completed: 'Concluído',
                    cancelled: 'Cancelado',
                  }
                  const start = new Date(schedule.startTime)
                  return (
                    <div
                      key={schedule.id}
                      className="rounded-lg border border-border bg-background p-3 hover:bg-muted/30 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="text-xs font-semibold text-foreground line-clamp-2">{schedule.title}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant="outline" className={cn("text-[9px]", typeColors[schedule.type])}>
                            {typeLabels[schedule.type] ?? schedule.type}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteSchedule(schedule.id)}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                          {' '}
                          {start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <Badge
                          variant="secondary"
                          className={cn("text-[9px] ml-auto", {
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400': schedule.status === 'pending',
                            'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400': schedule.status === 'completed',
                            'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400': schedule.status === 'cancelled',
                          })}
                        >
                          {statusLabels[schedule.status] ?? schedule.status}
                        </Badge>
                      </div>
                      {schedule.location && (
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{schedule.location}</span>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Notes & Observations */}
        <div className="border-b border-border">
          <button
            onClick={() => setNotesExpanded(!notesExpanded)}
            className="flex w-full items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">Notas e Observações</span>
              <Badge variant="secondary" className="text-[10px] h-5">
                {isLoadingNotes ? '...' : notes.length}
              </Badge>
            </div>
            {notesExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {notesExpanded && (
            <div className="px-5 pb-4 space-y-3">
              {/* Dados do Typebot (NR-01) - Observação automática */}
              {contactData?.metadata?.typebot && (
                <div className="rounded-lg bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800/30 px-3 py-2.5">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="h-3.5 w-3.5 text-[#46347F]" />
                    <span className="text-[10px] font-semibold text-[#46347F] uppercase tracking-wide">
                      Pesquisa NR-01 (Typebot)
                    </span>
                  </div>
                  <div className="text-xs text-foreground leading-relaxed space-y-1">
                    {contactData.metadata.typebot.cargo && (
                      <p><span className="text-muted-foreground">Cargo:</span> <span className="font-medium">{contactData.metadata.typebot.cargo}</span></p>
                    )}
                    {contactData.metadata.typebot.colaboradores && (
                      <p><span className="text-muted-foreground">Colaboradores:</span> <span className="font-medium">{contactData.metadata.typebot.colaboradores}</span></p>
                    )}
                    {contactData.metadata.typebot.responsavel && (
                      <p><span className="text-muted-foreground">Responsável:</span> <span className="font-medium">{contactData.metadata.typebot.responsavel}</span></p>
                    )}
                    {contactData.metadata.typebot.estagio && (
                      <p><span className="text-muted-foreground">Estágio:</span> <span className="font-medium">{contactData.metadata.typebot.estagio}</span></p>
                    )}
                    {contactData.metadata.typebot.preocupacao && (
                      <p><span className="text-muted-foreground">Preocupação:</span> <span className="font-medium">{contactData.metadata.typebot.preocupacao}</span></p>
                    )}
                    {contactData.metadata.typebot.afastamento && (
                      <p><span className="text-muted-foreground">Afastamento:</span> <span className="font-medium">{contactData.metadata.typebot.afastamento}</span></p>
                    )}
                    {contactData.metadata.typebot.levantamento && (
                      <p><span className="text-muted-foreground">Levantamento:</span> <span className="font-medium">{contactData.metadata.typebot.levantamento}</span></p>
                    )}
                    {contactData.metadata.typebot.decisao && (
                      <p><span className="text-muted-foreground">Decisão:</span> <span className="font-medium">{contactData.metadata.typebot.decisao}</span></p>
                    )}
                    {contactData.metadata.typebot.problema && (
                      <p><span className="text-muted-foreground">Problema:</span> <span className="font-medium">{contactData.metadata.typebot.problema}</span></p>
                    )}
                    {contactData.metadata.typebot.duvida && (
                      <p><span className="text-muted-foreground">Dúvida:</span> <span className="font-medium">{contactData.metadata.typebot.duvida}</span></p>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Capturado automaticamente via Typebot
                  </p>
                </div>
              )}

              {/* Input para nova nota */}
              <div className="flex flex-col gap-2">
                <Textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Adicionar nota ou observação..."
                  rows={3}
                  className="resize-none text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleCreateNote()
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleCreateNote}
                  disabled={isSubmittingNote || !newNoteText.trim()}
                  className="self-end bg-[#46347F] hover:bg-[#46347F]/90 h-7 text-xs"
                >
                  {isSubmittingNote ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    'Salvar nota'
                  )}
                </Button>
              </div>

              {/* Lista de notas */}
              {isLoadingNotes ? (
                <div className="flex items-center justify-center py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : notes.length === 0 && !contactData?.metadata?.typebot ? (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Nenhuma nota registrada
                </p>
              ) : (
                <div className="space-y-2">
                  {[...notes].reverse().map((note) => (
                    <div
                      key={note.id}
                      className="group rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 px-3 py-2.5"
                    >
                      <p className="text-xs text-foreground leading-snug whitespace-pre-wrap">
                        {note.text}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">
                          {note.author} · {new Date(note.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: '2-digit', year: '2-digit',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className="h-3 w-3 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Activity Timeline */}
        <div>
          <button
            onClick={() => setActivitiesExpanded(!activitiesExpanded)}
            className="flex w-full items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">Histórico de Atividades</span>
              <Badge variant="secondary" className="text-[10px] h-5">
                {isLoadingTimeline ? '...' : activities.length}
              </Badge>
            </div>
            {activitiesExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {activitiesExpanded && (
            <div className="px-5 pb-4">
              {isLoadingTimeline ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : timelineError ? (
                <div className="flex items-center gap-2 py-3 text-xs text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <span>Erro ao carregar atividades</span>
                </div>
              ) : activities.length === 0 ? (
                <div className="py-3 text-xs text-muted-foreground text-center">
                  Nenhuma atividade registrada
                </div>
              ) : (
                <div className="relative space-y-4">
                  {/* Timeline line */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

                  {displayedActivities.map((activity, index) => {
                    const isLast = index === displayedActivities.length - 1
                    const config = activityConfig[activity.type] || activityConfig.note
                    const Icon = config.icon

                    return (
                      <div key={activity.id} className="relative pl-6">
                        {/* Timeline dot */}
                        <div
                          className={`absolute left-0 top-1 h-4 w-4 rounded-full border-2 border-background ${config.bgColor}`}
                        />

                        {/* Activity content */}
                        <div className="text-xs">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Icon className={cn("h-3 w-3", config.color)} />
                            <span className="text-[10px] text-muted-foreground uppercase font-medium">
                              {config.label}
                            </span>
                          </div>
                          <p className="text-foreground font-medium leading-snug">
                            {activity.title}
                          </p>
                          {activity.description && (
                            <p className="text-muted-foreground text-[10px] mt-0.5 line-clamp-2">
                              {activity.description}
                            </p>
                          )}
                          <p className="text-muted-foreground text-[10px] mt-1">
                            {formatDate(activity.date)}
                            {activity.author && activity.author !== 'Sistema' && ` • ${activity.author}`}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {activities.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllActivities(!showAllActivities)}
                  className="w-full mt-3 text-xs"
                >
                  {showAllActivities ? "Ver menos" : `Ver todas (${activities.length})`}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
