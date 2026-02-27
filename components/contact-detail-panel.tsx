'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Mail, Phone, MapPin, Briefcase, Instagram, Linkedin, Calendar, User, Clock, Building2, Tag, CheckCircle2, Circle, MoreHorizontal, Plus, Send, MessageSquare, FileText, PhoneCall, MailOpen, Star, AlertCircle, CheckCheck, Trash2, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Contact, getContactTags } from '@/lib/mock/contacts'
import { type Tag as ContactTag, MOCK_TAGS, getTagsByIds } from '@/lib/mock/tags'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useContactPanel } from '@/lib/contexts/contact-panel-context'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface ContactDetailPanelProps {
  contact?: Contact
  isOpen?: boolean
  onClose?: () => void
}

type TabKey = 'home' | 'timeline' | 'tasks'

interface TimelineEvent {
  id: string
  type: 'note' | 'email' | 'call' | 'meeting' | 'task' | 'deal' | 'whatsapp'
  title: string
  description?: string
  date: string
  author: string
  authorAvatar?: string
}

interface Task {
  id: string
  title: string
  completed: boolean
  dueDate: string
  priority: 'alta' | 'media' | 'baixa'
  type: 'call' | 'email' | 'meeting' | 'followup' | 'proposal'
}

// Mock data generator
function generateTimelineEvents(contactName: string): TimelineEvent[] {
  const baseDate = new Date()
  return [
    {
      id: '1',
      type: 'deal',
      title: 'Negócio criado',
      description: 'Oportunidade de R$ 45.000 registrada no pipeline',
      date: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      author: 'Sistema',
    },
    {
      id: '2',
      type: 'email',
      title: 'Email enviado',
      description: 'Proposta comercial enviada para análise',
      date: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      author: 'Ana Silva',
      authorAvatar: 'AS',
    },
    {
      id: '3',
      type: 'call',
      title: 'Ligação realizada',
      description: 'Conversa sobre necessidades específicas do projeto',
      date: new Date(baseDate.getTime() - 20 * 60 * 60 * 1000).toISOString(),
      author: 'Ana Silva',
      authorAvatar: 'AS',
    },
    {
      id: '4',
      type: 'whatsapp',
      title: 'Mensagem WhatsApp',
      description: 'Cliente confirmou recebimento da proposta',
      date: new Date(baseDate.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      author: 'Sistema',
    },
    {
      id: '5',
      type: 'note',
      title: 'Nota adicionada',
      description: 'Cliente demonstra interesse em fechar ainda esta semana. Prioridade alta.',
      date: new Date(baseDate.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      author: 'Carlos Mendes',
      authorAvatar: 'CM',
    },
  ]
}

function generateTasks(): Task[] {
  const baseDate = new Date()
  return [
    {
      id: '1',
      title: 'Enviar contrato atualizado',
      completed: false,
      dueDate: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'alta',
      type: 'email',
    },
    {
      id: '2',
      title: 'Ligar para confirmar reunião',
      completed: false,
      dueDate: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'media',
      type: 'call',
    },
    {
      id: '3',
      title: 'Preparar apresentação customizada',
      completed: true,
      dueDate: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'alta',
      type: 'meeting',
    },
    {
      id: '4',
      title: 'Follow-up sobre proposta enviada',
      completed: false,
      dueDate: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'baixa',
      type: 'followup',
    },
  ]
}

const EVENT_ICONS = {
  note: FileText,
  email: Mail,
  call: PhoneCall,
  meeting: Calendar,
  task: CheckCircle2,
  deal: Star,
  whatsapp: MessageSquare,
}

const EVENT_COLORS = {
  note: 'bg-gray-100 text-gray-600',
  email: 'bg-blue-100 text-blue-600',
  call: 'bg-green-100 text-green-600',
  meeting: 'bg-purple-100 text-purple-600',
  task: 'bg-orange-100 text-orange-600',
  deal: 'bg-yellow-100 text-yellow-600',
  whatsapp: 'bg-emerald-100 text-emerald-600',
}

const TASK_TYPE_ICONS = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  followup: Clock,
  proposal: FileText,
}

export function ContactDetailPanel({ contact: propContact, isOpen: propIsOpen, onClose: propOnClose }: ContactDetailPanelProps = {}) {
  const [activeTab, setActiveTab] = useState<TabKey>('home')
  const [tasks, setTasks] = useState<Task[]>(generateTasks())
  const [newNote, setNewNote] = useState('')
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  
  // Tags management state
  const [contactTags, setContactTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<ContactTag[]>(MOCK_TAGS)
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#9795e4')
  const [searchTagQuery, setSearchTagQuery] = useState('')
  const tagInputRef = useRef<HTMLInputElement>(null)

  // Use context if no props provided
  const context = useContactPanel()
  
  const contact = propContact ?? context.selectedContact ?? null
  const isOpen = propIsOpen ?? context.isOpen
  const onClose = propOnClose ?? context.closeContactPanel

  // Sync contact tags when contact changes
  useEffect(() => {
    if (contact) {
      setContactTags(contact.tags || [])
    }
  }, [contact?.id])

  const timelineEvents = contact ? generateTimelineEvents(`${contact.nome} ${contact.sobrenome}`) : []

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ))
  }

  const addTask = () => {
    if (!newTaskTitle.trim()) return
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      completed: false,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      priority: 'media',
      type: 'followup',
    }
    setTasks([newTask, ...tasks])
    setNewTaskTitle('')
    setShowAddTask(false)
  }

  const addNote = () => {
    if (!newNote.trim()) return
    // In real app, this would add to timeline
    setNewNote('')
  }

  // Tag color options
  const tagColorOptions = [
    '#9795e4', // Purple (primary)
    '#7c7ab8', // Dark purple
    '#b3b3e5', // Light purple
    '#7573b8', // Medium purple
    '#9b99d1', // Lavender
    '#8a88c7', // Violet
    '#c4c3ea', // Pale purple
    '#a5a3d9', // Soft purple
    '#ef4444', // Red
    '#f97316', // Orange
    '#f59e0b', // Amber
    '#84cc16', // Lime
    '#10b981', // Emerald
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#6b7280', // Gray
  ]

  // Add existing tag to contact
  const addTagToContact = (tagId: string) => {
    if (!contactTags.includes(tagId)) {
      setContactTags([...contactTags, tagId])
    }
    setIsAddingTag(false)
    setSearchTagQuery('')
  }

  // Remove tag from contact
  const removeTagFromContact = (tagId: string) => {
    setContactTags(contactTags.filter(id => id !== tagId))
  }

  // Create new tag and add to contact
  const createNewTag = () => {
    if (!newTagName.trim()) return
    
    const newTag: ContactTag = {
      id: `tag-${Date.now()}`,
      nome: newTagName.trim(),
      cor: newTagColor,
      leadScore: 0,
      contatosCount: 1,
      automatizacao: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    setAvailableTags([...availableTags, newTag])
    setContactTags([...contactTags, newTag.id])
    setNewTagName('')
    setNewTagColor('#9795e4')
    setIsAddingTag(false)
  }

  // Get tags not yet assigned to contact
  const getUnassignedTags = () => {
    return availableTags.filter(tag => !contactTags.includes(tag.id))
  }

  // Filter tags by search query
  const getFilteredTags = () => {
    const unassigned = getUnassignedTags()
    if (!searchTagQuery.trim()) return unassigned
    return unassigned.filter(tag => 
      tag.nome.toLowerCase().includes(searchTagQuery.toLowerCase())
    )
  }

  // Get full tag objects for display
  const getContactTagObjects = (): ContactTag[] => {
    return getTagsByIds(contactTags)
  }

  if (!isOpen || !contact) {
    return null
  }

  // Tags are now managed by contactTags state

  const getInitials = (nome: string, sobrenome: string) => {
    return `${nome[0]}${sobrenome[0]}`.toUpperCase()
  }

  const formatDateSafe = (dateValue: string | undefined, formatStr: string = "dd/MM/yyyy"): string => {
    if (!dateValue) return 'Data não disponível'
    try {
      const date = new Date(dateValue)
      if (isNaN(date.getTime())) return 'Data inválida'
      return format(date, formatStr, { locale: ptBR })
    } catch {
      return 'Data inválida'
    }
  }

  const completedTasks = tasks.filter(t => t.completed).length
  const pendingTasks = tasks.filter(t => !t.completed)

  return (
    <>
      {/* Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/20 z-40 transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        className={cn(
          "fixed right-0 top-0 h-full w-[420px] bg-white shadow-2xl z-50",
          "transform transition-transform duration-200 ease-out shadow-2xl",
          "flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-0">
          <div className="flex items-center gap-3">
            <div 
              className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold text-sm"
              style={{ backgroundColor: contact.avatarBg || '#9795e4' }}
            >
              {contact.avatar || getInitials(contact.nome, contact.sobrenome)}
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {contact.nome} {contact.sobrenome}
              </h2>
              <p className="text-xs text-muted-foreground">
                Criado em {formatDateSafe(contact.criadoEm)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-2 border-0 bg-muted/30">
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "text-xs h-8 flex-1",
              activeTab === 'home' ? "bg-white shadow-sm font-medium" : "text-muted-foreground"
            )}
            onClick={() => setActiveTab('home')}
          >
            <Building2 className="h-3.5 w-3.5 mr-1.5" />
            Home
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "text-xs h-8 flex-1",
              activeTab === 'timeline' ? "bg-white shadow-sm font-medium" : "text-muted-foreground"
            )}
            onClick={() => setActiveTab('timeline')}
          >
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            Linha do tempo
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "text-xs h-8 flex-1",
              activeTab === 'tasks' ? "bg-white shadow-sm font-medium" : "text-muted-foreground"
            )}
            onClick={() => setActiveTab('tasks')}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            Tarefas
            {pendingTasks.length > 0 && (
              <span className="ml-1.5 rounded-full bg-[#9795e4] px-1.5 py-0 text-[10px] text-white">
                {pendingTasks.length}
              </span>
            )}
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* HOME TAB */}
          {activeTab === 'home' && (
            <div className="p-4">
              {/* Quick Actions */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                <button className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-[#9795e4]/5 hover:bg-[#9795e4]/10 transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#9795e4]/10 text-[#9795e4]">
                    <Phone className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">Ligar</span>
                </button>
                <button className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-[#9795e4]/5 hover:bg-[#9795e4]/10 transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#9795e4]/10 text-[#9795e4]">
                    <Mail className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">Email</span>
                </button>
                <button className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-[#9795e4]/5 hover:bg-[#9795e4]/10 transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#9795e4]/10 text-[#9795e4]">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">WhatsApp</span>
                </button>
                <button className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-[#9795e4]/5 hover:bg-[#9795e4]/10 transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#9795e4]/10 text-[#9795e4]">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">Reunião</span>
                </button>
              </div>

              {/* Tags Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-[#9795e4]" />
                    <span className="text-sm font-medium text-foreground">Tags</span>
                  </div>
                  <Popover open={isAddingTag} onOpenChange={setIsAddingTag}>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2 text-xs text-[#9795e4] hover:text-[#7b79c4] hover:bg-[#9795e4]/10"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Adicionar
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0" align="end">
                      <div className="p-3 border-0">
                        <p className="text-sm font-medium mb-2">Adicionar Tag</p>
                        <Input
                          ref={tagInputRef}
                          placeholder="Buscar ou criar tag..."
                          value={searchTagQuery}
                          onChange={(e) => setSearchTagQuery(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      
                      {/* Existing tags */}
                      <div className="max-h-40 overflow-y-auto">
                        {getFilteredTags().length > 0 ? (
                          <div className="p-1">
                            <p className="text-xs text-muted-foreground px-2 py-1">Tags existentes</p>
                            {getFilteredTags().map((tag) => (
                              <button
                                key={tag.id}
                                onClick={() => addTagToContact(tag.id)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-left"
                              >
                                <span 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: tag.cor }}
                                />
                                <span className="text-sm flex-1">{tag.nome}</span>
                                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                              </button>
                            ))}
                          </div>
                        ) : searchTagQuery.trim() && getUnassignedTags().length === 0 ? (
                          <div className="p-3 text-center text-sm text-muted-foreground">
                            Nenhuma tag disponível
                          </div>
                        ) : null}
                        
                        {/* Create new tag option */}
                        {searchTagQuery.trim() && !availableTags.some(t => 
                          t.nome.toLowerCase() === searchTagQuery.toLowerCase()
                        ) && (
                          <div className="p-2 border-0">
                            <p className="text-xs text-muted-foreground px-2 py-1">Criar nova tag</p>
                            <div className="px-2 py-2">
                              <Input
                                placeholder="Nome da tag"
                                value={newTagName || searchTagQuery}
                                onChange={(e) => setNewTagName(e.target.value)}
                                className="h-8 text-sm mb-2"
                              />
                              <div className="flex items-center gap-2 mb-2">
                                <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                                <div className="flex flex-wrap gap-1">
                                  {tagColorOptions.map((color) => (
                                    <button
                                      key={color}
                                      onClick={() => setNewTagColor(color)}
                                      className={cn(
                                        "w-5 h-5 rounded-full border-0 transition-all",
                                        newTagColor === color 
                                          ? "ring-2 ring-foreground scale-110" 
                                          : "hover:scale-105"
                                      )}
                                      style={{ backgroundColor: color }}
                                    />
                                  ))}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                className="w-full h-8 bg-[#9795e4] hover:bg-[#7b79c4] text-white"
                                onClick={createNewTag}
                                disabled={!newTagName.trim() && !searchTagQuery.trim()}
                              >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Criar "{newTagName || searchTagQuery}"
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="flex flex-wrap gap-1.5">
                  {getContactTagObjects().map((tag) => (
                    <Badge
                      key={tag.id}
                      style={{
                        backgroundColor: `${tag.cor}20`,
                        color: tag.cor,
                        borderColor: tag.cor,
                      }}
                      variant="outline"
                      className="text-xs pr-1 group flex items-center gap-1"
                    >
                      {tag.nome}
                      <button
                        onClick={() => removeTagFromContact(tag.id)}
                        className="ml-0.5 p-0.5 rounded-full hover:bg-black/10 opacity-60 hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {contactTags.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      Nenhuma tag atribuída
                    </p>
                  )}
                </div>
              </div>

              {/* Geral Section */}
              <div className="mb-6">
                <button className="flex items-center justify-between w-full text-sm font-medium text-foreground mb-3">
                  Geral
                  <span className="text-xs">▼</span>
                </button>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">Cidade</p>
                      <p className="text-sm font-medium text-foreground">{contact.cidade}, {contact.estado}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">Criado por</p>
                      <div className="flex items-center gap-1.5">
                        <div className="h-4 w-4 rounded-sm bg-[#9795e4] flex items-center justify-center text-[10px] text-white font-bold">
                          {contact.atualizadoPor[0]}
                        </div>
                        <p className="text-sm font-medium text-foreground">{contact.atualizadoPor}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium border border-[#9795e4]/30 bg-[#9795e4]/10 text-[#7573b8]">
                        {contact.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">Cargo</p>
                      <p className="text-sm font-medium text-foreground">{contact.cargo}</p>
                    </div>
                  </div>

                  {contact.linkedin && (
                    <div className="flex items-start gap-3">
                      <Linkedin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-0.5">LinkedIn</p>
                        <p className="text-sm font-medium text-foreground">{contact.linkedin}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">Telefone</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium border border-[#9795e4]/30 bg-[#9795e4]/10 text-[#7573b8]">
                        {contact.telefone}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">Última atualização</p>
                      <p className="text-sm font-medium text-foreground">
                        {formatDateSafe(contact.atualizadoEm, "dd/MM/yyyy 'às' HH:mm")}
                      </p>
                    </div>
                  </div>

                  {contact.instagram && (
                    <div className="flex items-start gap-3">
                      <Instagram className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-0.5">Instagram</p>
                        <p className="text-sm font-medium text-foreground">{contact.instagram}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* UTM Section */}
              {(contact.utmSource || contact.utmMedium || contact.utmCampaign) && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Origem (UTM)
                  </h3>
                  <div className="space-y-2 p-3 rounded-sm bg-muted/30">
                    {contact.utmSource && (
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Source:</span>
                        <span className="text-xs font-medium">{contact.utmSource}</span>
                      </div>
                    )}
                    {contact.utmMedium && (
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Medium:</span>
                        <span className="text-xs font-medium">{contact.utmMedium}</span>
                      </div>
                    )}
                    {contact.utmCampaign && (
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Campaign:</span>
                        <span className="text-xs font-medium">{contact.utmCampaign}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Company Section */}
              {contact.empresa && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Empresa
                  </h3>
                  <div className="flex items-center gap-2 p-2 rounded-sm bg-muted/50">
                    <div className="h-6 w-6 rounded-sm bg-[#9795e4] flex items-center justify-center text-[10px] text-white font-bold">
                      {contact.empresa[0]}
                    </div>
                    <span className="text-sm font-medium text-foreground">{contact.empresa}</span>
                  </div>
                </div>
              )}

              {/* Lead Score Section */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Lead Score
                </h3>
                <div className="flex items-center gap-3 p-3 rounded-sm bg-muted/30">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-[#9795e4] transition-all"
                      style={{ width: `${Math.min(contact.leadScore, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-[#9795e4]">{contact.leadScore}</span>
                </div>
              </div>
            </div>
          )}

          {/* TIMELINE TAB */}
          {activeTab === 'timeline' && (
            <div className="flex flex-col h-full">
              {/* Add Note Input */}
              <div className="p-4 border-0">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Adicionar nota ou atualização..."
                      className="w-full min-h-[60px] px-3 py-2 text-sm border-0 bg-muted/30 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#9795e4]/20"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    size="sm" 
                    className="h-8 bg-[#9795e4] hover:bg-[#7b79c4] text-white"
                    onClick={addNote}
                    disabled={!newNote.trim()}
                  >
                    <Send className="h-3.5 w-3.5 mr-1" />
                    Enviar
                  </Button>
                </div>
              </div>

              {/* Timeline Events */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-muted" />
                  
                  <div className="space-y-4">
                    {timelineEvents.map((event, index) => {
                      const Icon = EVENT_ICONS[event.type]
                      return (
                        <div key={event.id} className="relative pl-10">
                          {/* Icon */}
                          <div className={cn(
                            "absolute left-0 top-0 h-8 w-8 rounded-full flex items-center justify-center ring-2 ring-white",
                            EVENT_COLORS[event.type]
                          )}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          
                          {/* Content */}
                          <div className="bg-muted/30 rounded-lg p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="text-sm font-semibold text-foreground">{event.title}</h4>
                                {event.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                {formatDateSafe(event.date, "dd/MM 'às' HH:mm")}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-2">
                              {event.authorAvatar && (
                                <div className="h-5 w-5 rounded-full bg-[#9795e4]/10 flex items-center justify-center text-[9px] font-bold text-[#9795e4]">
                                  {event.authorAvatar}
                                </div>
                              )}
                              <span className="text-[10px] text-muted-foreground">{event.author}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TASKS TAB */}
          {activeTab === 'tasks' && (
            <div className="flex flex-col h-full">
              {/* Progress */}
              <div className="p-4 border-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Progresso</span>
                  <span className="text-xs text-muted-foreground">{completedTasks}/{tasks.length} concluídas</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-[#9795e4] transition-all"
                    style={{ width: `${tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Add Task */}
              <div className="p-4 border-0">
                {!showAddTask ? (
                  <Button 
                    variant="outline" 
                    className="w-full h-9 text-sm border-0 shadow-sm"
                    onClick={() => setShowAddTask(true)}
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Nova tarefa
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Nome da tarefa..."
                      className="h-9 text-sm"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && addTask()}
                    />
                    <Button 
                      size="sm" 
                      className="h-9 bg-[#9795e4] hover:bg-[#7b79c4] text-white"
                      onClick={addTask}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Tasks List */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {/* Pending Tasks */}
                  {pendingTasks.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Pendentes</h4>
                      <div className="space-y-2">
                        {pendingTasks.map((task) => {
                          const Icon = TASK_TYPE_ICONS[task.type]
                          return (
                            <div 
                              key={task.id} 
                              className="flex items-start gap-3 p-3 rounded-lg bg-white border border-border hover:border-[#9795e4]/30 transition-colors group"
                            >
                              <button 
                                onClick={() => toggleTask(task.id)}
                                className="mt-0.5 text-muted-foreground hover:text-[#9795e4] transition-colors"
                              >
                                <Circle className="h-5 w-5" />
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">{task.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded",
                                    task.priority === 'alta' ? "bg-red-100 text-red-600" :
                                    task.priority === 'media' ? "bg-amber-100 text-amber-600" :
                                    "bg-gray-100 text-gray-600"
                                  )}>
                                    {task.priority}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                    <Calendar className="h-3 w-3" />
                                    {formatDateSafe(task.dueDate, "dd/MM")}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Completed Tasks */}
                  {completedTasks > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Concluídas</h4>
                      <div className="space-y-2">
                        {tasks.filter(t => t.completed).map((task) => {
                          const Icon = TASK_TYPE_ICONS[task.type]
                          return (
                            <div 
                              key={task.id} 
                              className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border-0 opacity-60"
                            >
                              <button 
                                onClick={() => toggleTask(task.id)}
                                className="mt-0.5 text-emerald-500"
                              >
                                <CheckCheck className="h-5 w-5" />
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground line-through">{task.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                    <Calendar className="h-3 w-3" />
                                    {formatDateSafe(task.dueDate, "dd/MM")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
