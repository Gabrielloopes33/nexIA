'use client'

import { useContactPanel } from '@/lib/contexts/contact-panel-context'
import { Button } from '@/components/ui/button'
import { X, Mail, Phone, MapPin, Briefcase, Instagram, Linkedin, Calendar, User, Clock, Building2, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Contact, getContactTags } from '@/lib/mock/contacts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ContactDetailPanelProps {
  contact?: Contact
  isOpen?: boolean
  onClose?: () => void
}

export function ContactDetailPanel({ contact: propContact, isOpen: propIsOpen, onClose: propOnClose }: ContactDetailPanelProps = {}) {
  // Try to use context if available, otherwise use props
  const context = (() => {
    try {
      return useContactPanel()
    } catch {
      return null
    }
  })()

  const contact = propContact || context?.selectedContact
  const isOpen = propIsOpen ?? context?.isOpen ?? false
  const onClose = propOnClose || context?.closeContactPanel || (() => {})

  if (!isOpen || !contact) {
    return null
  }

  const tags = contact.tags ? getContactTags(contact) : []

  const getInitials = (nome: string, sobrenome: string) => {
    return `${nome[0]}${sobrenome[0]}`.toUpperCase()
  }

  // Helper para formatar data de forma segura
  const formatDateSafe = (dateValue: string | undefined, formatStr: string = "dd/MM/yyyy"): string => {
    if (!dateValue) return 'Data não disponível'
    try {
      const date = new Date(dateValue)
      // Verifica se a data é válida
      if (isNaN(date.getTime())) return 'Data inválida'
      return format(date, formatStr, { locale: ptBR })
    } catch {
      return 'Data inválida'
    }
  }

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
          "fixed right-0 top-0 h-full w-[380px] bg-white border-l-2 border-border z-50",
          "transform transition-transform duration-200 ease-out shadow-2xl",
          "flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-border">
          <div className="flex items-center gap-3">
            {/* Avatar */}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/30">
            <Button variant="ghost" size="sm" className="text-xs h-8 bg-white shadow-sm">
              <Building2 className="h-3.5 w-3.5 mr-1.5" />
              Home
            </Button>
            <Button variant="ghost" size="sm" className="text-xs h-8 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              Linha do tempo
            </Button>
            <Button variant="ghost" size="sm" className="text-xs h-8 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              Tarefas
            </Button>
          </div>

          {/* Fields Section */}
          <div className="p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Informações
            </h3>

            {/* Tags Section */}
            {tags.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4 text-[#9795e4]" />
                  <span className="text-sm font-medium text-foreground">Tags</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      style={{
                        backgroundColor: `${tag.cor}20`,
                        color: tag.cor,
                        borderColor: tag.cor,
                      }}
                      variant="outline"
                      className="text-xs"
                    >
                      {tag.nome}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Geral Section */}
            <div className="mb-6">
              <button className="flex items-center justify-between w-full text-sm font-medium text-foreground mb-3">
                Geral
                <span className="text-xs">▼</span>
              </button>

              <div className="space-y-3">
                {/* Cidade */}
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-0.5">Cidade</p>
                    <p className="text-sm font-medium text-foreground">{contact.cidade}, {contact.estado}</p>
                  </div>
                </div>

                {/* Criado por */}
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

                {/* Email */}
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium border border-[#9795e4]/30 bg-[#9795e4]/10 text-[#7573b8]">
                      {contact.email}
                    </span>
                  </div>
                </div>

                {/* Profissão */}
                <div className="flex items-start gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-0.5">Cargo</p>
                    <p className="text-sm font-medium text-foreground">{contact.cargo}</p>
                  </div>
                </div>

                {/* LinkedIn */}
                {contact.linkedin && (
                  <div className="flex items-start gap-3">
                    <Linkedin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">LinkedIn</p>
                      <p className="text-sm font-medium text-foreground">{contact.linkedin}</p>
                    </div>
                  </div>
                )}

                {/* Telefone */}
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-0.5">Telefone</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium border border-[#9795e4]/30 bg-[#9795e4]/10 text-[#7573b8]">
                      {contact.telefone}
                    </span>
                  </div>
                </div>

                {/* Última atualização */}
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-0.5">Última atualização</p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDateSafe(contact.atualizadoEm, "dd/MM/yyyy 'às' HH:mm")}
                    </p>
                  </div>
                </div>

                {/* Atualizado por */}
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-0.5">Atualizado por</p>
                    <div className="flex items-center gap-1.5">
                      <div className="h-4 w-4 rounded-sm bg-[#9795e4] flex items-center justify-center text-[10px] text-white font-bold">
                        {contact.atualizadoPor[0]}
                      </div>
                      <p className="text-sm font-medium text-foreground">{contact.atualizadoPor}</p>
                    </div>
                  </div>
                </div>

                {/* Instagram */}
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
        </div>
      </div>
    </>
  )
}
