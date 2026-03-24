'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Phone, MapPin, Briefcase, Instagram, Linkedin, Calendar, User, Clock, Building2, Tag as TagIcon, CheckCircle2, Circle, MoreHorizontal, Plus, Send, MessageSquare, FileText, PhoneCall, Star, AlertCircle, CheckCheck, Trash2, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useContactPanel } from '@/lib/contexts/contact-panel-context'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Contact } from '@/hooks/use-contacts'
import { useTags, Tag } from '@/hooks/use-tags'
import { useSchedules } from '@/hooks/use-schedules'
import { useContactTimeline, TimelineEvent } from '@/hooks/use-contact-timeline'

interface ContactDetailPanelProps {
  contact?: Contact
  isOpen?: boolean
  onClose?: () => void
}

type TabKey = 'home' | 'timeline' | 'tasks'

interface TaskItem {
  id: string
  title: string
  completed: boolean
  dueDate: string
  priority: 'alta' | 'media' | 'baixa'
  type: 'call' | 'meeting' | 'followup' | 'proposal'
}

const EVENT_ICONS = {
  note: FileText,
  call: PhoneCall,
  meeting: Calendar,
  task: CheckCircle2,
  deal: Star,
  whatsapp: MessageSquare,
  message: MessageSquare,
}

const EVENT_COLORS = {
  note: 'bg-gray-100 text-gray-600',
  call: 'bg-green-100 text-green-600',
  meeting: 'bg-purple-100 text-purple-600',
  task: 'bg-orange-100 text-orange-600',
  deal: 'bg-yellow-100 text-yellow-600',
  whatsapp: 'bg-emerald-100 text-emerald-600',
  message: 'bg-blue-100 text-blue-600',
}

const TASK_TYPE_ICONS = {
  call: Phone,
  meeting: Calendar,
  followup: Clock,
  proposal: FileText,
}

export function ContactDetailPanel({ contact: propContact, isOpen: propIsOpen, onClose: propOnClose }: ContactDetailPanelProps = {}) {
  const [activeTab, setActiveTab] = useState<TabKey>('home')
  const [newNote, setNewNote] = useState('')
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  
  // Tags management state
  const [contactTags, setContactTags] = useState<string[]>([])
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#46347F')
  const [searchTagQuery, setSearchTagQuery] = useState('')
  const tagInputRef = useRef<HTMLInputElement>(null)

  // Use context if no props provided
  const context = useContactPanel()
  
  const contact = propContact ?? context.selectedContact ?? null
  const isOpen = propIsOpen ?? context.isOpen
  const onClose = propOnClose ?? context.closeContactPanel

  // Get real tags from hook
  const { tags: availableTags } = useTags(contact?.organizationId)

  // Get real schedules (tasks) for this contact
  const { schedules, isLoading: isLoadingSchedules, refreshSchedules } = useSchedules(
    contact?.organizationId,
    contact ? { contactId: contact.id } : undefined
  )

  // Get real timeline events
  const { events: timelineEvents, isLoading: isLoadingTimeline, refresh: refreshTimeline } = useContactTimeline(contact?.id)

  // Helper functions - precisam estar antes de serem usadas
  const getDisplayName = (contact: Contact): string => {
    return contact.name || contact.phone || 'Sem nome'
  }

  const getInitials = (contact: Contact): string => {
    const name = contact.name || contact.phone || ''
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
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

  // Sync contact tags when contact changes
  useEffect(() => {
    if (contact) {
      setContactTags(contact.tags || [])
    }
  }, [contact?.id])

  // Convert schedules to tasks format
  const tasks: TaskItem[] = schedules.map(schedule => ({
    id: schedule.id,
    title: schedule.title,
    completed: schedule.status === 'completed',
    dueDate: schedule.endTime || schedule.startTime,
    priority: schedule.type === 'call' ? 'alta' : schedule.type === 'meeting' ? 'media' : 'baixa',
    type: schedule.type === 'call' ? 'call' : schedule.type === 'meeting' ? 'meeting' : 'task',
  }))

  const toggleTask = async (taskId: string) => {
    // Find the schedule
    const schedule = schedules.find(s => s.id === taskId)
    if (!schedule) return

    // Toggle via API
    try {
      const response = await fetch(`/api/schedules/${taskId}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (response.ok) {
        await refreshSchedules()
      }
    } catch (error) {
      console.error('Error toggling task:', error)
    }
  }

  const addTask = async () => {
    if (!newTaskTitle.trim() || !contact?.organizationId) return
    
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    
    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: contact.organizationId,
          contactId: contact.id,
          type: 'task',
          title: newTaskTitle,
          startTime: now.toISOString(),
          endTime: tomorrow.toISOString(),
        }),
      })
      
      if (response.ok) {
        await refreshSchedules()
        setNewTaskTitle('')
        setShowAddTask(false)
      }
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const addNote = () => {
    if (!newNote.trim()) return
    // In real app, this would add to timeline
    setNewNote('')
  }

  // Tag color options
  const tagColorOptions = [
    '#46347F', // Purple (primary)
    '#46347F', // Dark purple
    '#46347F', // Light purple
    '#46347F', // Medium purple
    '#46347F', // Lavender
    '#46347F', // Violet
    '#46347F', // Pale purple
    '#46347F', // Soft purple
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
    
    const newTag: Tag = {
      id: `tag-${Date.now()}`,
      organizationId: contact?.organizationId || '',
      name: newTagName.trim(),
      color: newTagColor,
      source: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    // Note: In a real implementation, you would call createTag from useTags
    // For now, we just add to local state
    setContactTags([...contactTags, newTag.id])
    setNewTagName('')
    setNewTagColor('#46347F')
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
      tag.name.toLowerCase().includes(searchTagQuery.toLowerCase())
    )
  }

  // Get full tag objects for display
  const getContactTagObjects = (): Tag[] => {
    return availableTags.filter(tag => contactTags.includes(tag.id))
  }

  if (!isOpen || !contact) {
    return null
  }

  const completedTasks = tasks.filter(t => t.completed).length
  const pendingTasks = tasks.filter(t => !t.completed)

  // Get metadata values safely
  const getMetadataValue = (key: string): string | undefined => {
    const value = contact.metadata?.[key]
    return typeof value === 'string' ? value : undefined
  }

  const cidade = getMetadataValue('city')
  const estado = getMetadataValue('state')
  const cargo = getMetadataValue('jobTitle')
  const linkedin = getMetadataValue('linkedin')
  const instagram = getMetadataValue('instagram')
  const empresa = getMetadataValue('company')
  const utmSource = getMetadataValue('utmSource')
  const utmMedium = getMetadataValue('utmMedium')
  const utmCampaign = getMetadataValue('utmCampaign')

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
              style={{ backgroundColor: '#46347F' }}
            >
              {getInitials(contact)}
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {getDisplayName(contact)}
              </h2>
              <p className="text-xs text-muted-foreground">
                Criado em {formatDateSafe(contact.createdAt)}
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
              <span className="ml-1.5 rounded-full bg-[#46347F] px-1.5 py-0 text-[10px] text-white">
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
              <div className="grid grid-cols-3 gap-3 mb-6">
                <button className="flex flex-col items-center gap-2 p-4 rounded-lg bg-[#46347F]/5 hover:bg-[#46347F]/10 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#46347F]/10 text-[#46347F]">
                    <Phone className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">Ligar</span>
                </button>

                <button className="flex flex-col items-center gap-2 p-4 rounded-lg bg-[#46347F]/5 hover:bg-[#46347F]/10 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#46347F]/10 text-[#46347F]">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">WhatsApp</span>
                </button>

                <button className="flex flex-col items-center gap-2 p-4 rounded-lg bg-[#46347F]/5 hover:bg-[#46347F]/10 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#46347F]/10 text-[#46347F]">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">Reunião</span>
                </button>
              </div>

              {/* Tags Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TagIcon className="h-4 w-4 text-[#46347F]" />
                    <span className="text-sm font-medium text-foreground">Tags</span>
                  </div>
                  <Popover open={isAddingTag} onOpenChange={setIsAddingTag}>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2 text-xs text-[#46347F] hover:text-[#7b79c4] hover:bg-[#46347F]/10"
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
                                  style={{ backgroundColor: tag.color }}
                                />
                                <span className="text-sm flex-1">{tag.name}</span>
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
                          t.name.toLowerCase() === searchTagQuery.toLowerCase()
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
                                className="w-full h-8 bg-[#46347F] hover:bg-[#7b79c4] text-white"
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
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                        borderColor: tag.color,
                      }}
                      variant="outline"
                      className="text-xs pr-1 group flex items-center gap-1"
                    >
                      {tag.name}
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
                  {(cidade || estado) && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-0.5">Cidade</p>
                        <p className="text-sm font-medium text-foreground">
                          {[cidade, estado].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">Telefone</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium border border-[#46347F]/30 bg-[#46347F]/10 text-[#46347F]">
                        {contact.phone}
                      </span>
                    </div>
                  </div>

                  {cargo && (
                    <div className="flex items-start gap-3">
                      <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-0.5">Cargo</p>
                        <p className="text-sm font-medium text-foreground">{cargo}</p>
                      </div>
                    </div>
                  )}

                  {linkedin && (
                    <div className="flex items-start gap-3">
                      <Linkedin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-0.5">LinkedIn</p>
                        <p className="text-sm font-medium text-foreground">{linkedin}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">Última atualização</p>
                      <p className="text-sm font-medium text-foreground">
                        {formatDateSafe(contact.updatedAt, "dd/MM/yyyy 'às' HH:mm")}
                      </p>
                    </div>
                  </div>

                  {instagram && (
                    <div className="flex items-start gap-3">
                      <Instagram className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-0.5">Instagram</p>
                        <p className="text-sm font-medium text-foreground">{instagram}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* UTM Section */}
              {(utmSource || utmMedium || utmCampaign) && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Origem (UTM)
                  </h3>
                  <div className="space-y-2 p-3 rounded-sm bg-muted/30">
                    {utmSource && (
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Source:</span>
                        <span className="text-xs font-medium">{utmSource}</span>
                      </div>
                    )}
                    {utmMedium && (
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Medium:</span>
                        <span className="text-xs font-medium">{utmMedium}</span>
                      </div>
                    )}
                    {utmCampaign && (
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Campaign:</span>
                        <span className="text-xs font-medium">{utmCampaign}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Company Section */}
              {empresa && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Empresa
                  </h3>
                  <div className="flex items-center gap-2 p-2 rounded-sm bg-muted/50">
                    <div className="h-6 w-6 rounded-sm bg-[#46347F] flex items-center justify-center text-[10px] text-white font-bold">
                      {empresa[0]}
                    </div>
                    <span className="text-sm font-medium text-foreground">{empresa}</span>
                  </div>
                </div>
              )}


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
                      className="w-full min-h-[60px] px-3 py-2 text-sm border-0 bg-muted/30 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#46347F]/20"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    size="sm" 
                    className="h-8 bg-[#46347F] hover:bg-[#7b79c4] text-white"
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
                {isLoadingTimeline ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin h-5 w-5 border-2 border-[#46347F] border-t-transparent rounded-full" />
                    <span className="ml-2 text-sm text-muted-foreground">Carregando...</span>
                  </div>
                ) : timelineEvents.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Nenhum evento na timeline ainda.
                  </div>
                ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-muted" />
                  
                  <div className="space-y-4">
                    {timelineEvents.map((event) => {
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
                                <div className="h-5 w-5 rounded-full bg-[#46347F]/10 flex items-center justify-center text-[9px] font-bold text-[#46347F]">
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
                )}
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
                    className="h-full rounded-full bg-[#46347F] transition-all"
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
                      className="h-9 bg-[#46347F] hover:bg-[#7b79c4] text-white"
                      onClick={addTask}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Tasks List */}
              <div className="flex-1 overflow-y-auto p-4">
                {isLoadingSchedules ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin h-5 w-5 border-2 border-[#46347F] border-t-transparent rounded-full" />
                    <span className="ml-2 text-sm text-muted-foreground">Carregando tarefas...</span>
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Nenhuma tarefa ainda.
                  </div>
                ) : (
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
                              className="flex items-start gap-3 p-3 rounded-lg bg-white border border-border hover:border-[#46347F]/30 transition-colors group"
                            >
                              <button 
                                onClick={() => toggleTask(task.id)}
                                className="mt-0.5 text-muted-foreground hover:text-[#46347F] transition-colors"
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
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
