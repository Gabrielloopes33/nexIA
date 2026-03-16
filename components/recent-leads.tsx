"use client"

import { useMemo } from "react"
import { Linkedin, ExternalLink, Star, Users, Loader2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { getTagsByIds } from "@/lib/tag-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useContactPanel } from "@/lib/contexts/contact-panel-context"
import { Contact, useContacts } from "@/hooks/use-contacts"
import { useTags } from "@/hooks/use-tags"
import { useOrganizationId } from "@/lib/contexts/organization-context"

// Helper para converter Contact do hook para o formato esperado pelo painel
function createDisplayLead(contact: Contact) {
  const name = contact.name || contact.phone || "Sem nome"
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
  
  const metadata = contact.metadata || {}
  const cargo = metadata.jobTitle as string || "Contato"
  const empresa = metadata.company as string || "-"
  
  return {
    id: contact.id,
    name,
    role: `${cargo} | ${empresa}`,
    email: metadata.email as string || "",
    status: "valid" as const,
    avatar: initials,
    avatarBg: "#E8E7F7",
    avatarColor: "#8B7DB8",
    tags: contact.tags || [],
    favorito: false,
    originalContact: contact,
  }
}

interface RecentLeadsProps {
  compact?: boolean
}

export function RecentLeads({ compact }: RecentLeadsProps) {
  const organizationId = useOrganizationId() ?? ''
  const { openContactPanel } = useContactPanel()
  const { contacts, isLoading: isLoadingContacts } = useContacts(organizationId, {
    limit: 5,
    status: "ACTIVE"
  })
  const { tags, isLoading: isLoadingTags } = useTags(organizationId)
  
  // Transforma os contatos da API para o formato de exibição
  const leads = useMemo(() => {
    return contacts.map(createDisplayLead)
  }, [contacts])
  
  // Em modo compacto, mostra apenas 4 leads
  const displayLeads = compact ? leads.slice(0, 4) : leads

  const handleLeadClick = (lead: typeof leads[0]) => {
    openContactPanel(lead.originalContact)
  }

  const isLoading = isLoadingContacts || isLoadingTags

  // Loading state
  if (isLoading) {
    return (
      <Card className="rounded-sm shadow-sm h-full flex flex-col">
        <CardHeader className="p-3 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold text-gray-900">Novos Leads</CardTitle>
              <div className="flex items-center gap-1 rounded-sm bg-[#8B7DB8]/10 px-2 py-0.5">
                <Users className="h-4 w-4 text-[#8B7DB8]" />
                <span className="text-sm font-medium text-[#8B7DB8]">-</span>
              </div>
            </div>
            <Link href="/contatos" className="flex items-center gap-1 text-sm font-medium text-[#8B7DB8] transition-colors hover:opacity-80">
              Ver Todos
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-[#8B7DB8]" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-sm shadow-sm h-full flex flex-col">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold text-gray-900">Novos Leads</CardTitle>
            <div className="flex items-center gap-1 rounded-sm bg-[#8B7DB8]/10 px-2 py-0.5">
              <Users className="h-4 w-4 text-[#8B7DB8]" />
              <span className="text-sm font-medium text-[#8B7DB8]">{leads.length}</span>
            </div>
          </div>
          <Link href="/contatos" className="flex items-center gap-1 text-sm font-medium text-[#8B7DB8] transition-colors hover:opacity-80">
            Ver Todos
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <div className="divide-y divide-border">
        {displayLeads.map((lead) => {
          const leadTags = getTagsByIds(tags, lead.tags.slice(0, 1)) // Mostra apenas 1 tag
          
          return (
            <div
              key={lead.id}
              onClick={() => handleLeadClick(lead)}
              className="flex items-center gap-2 px-3 py-2 transition-colors hover:bg-[#F3F2F2] cursor-pointer"
            >
              {/* Avatar */}
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ backgroundColor: lead.avatarBg, color: lead.avatarColor }}
              >
                {lead.avatar}
              </div>
              
              {/* Name & Role with Tags */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-gray-900">{lead.name}</p>
                  {lead.favorito && (
                    <Star className="h-3.5 w-3.5 fill-[#8B7DB8] text-[#8B7DB8] shrink-0" />
                  )}
                </div>
                <p className="truncate text-xs text-gray-500">{lead.role}</p>
                {leadTags.length > 0 && (
                  <div className="flex gap-1 mt-0.5">
                    {leadTags.map(tag => {
                      return (
                        <span
                          key={tag.id}
                          className="inline-flex items-center px-1.5 py-0 rounded-sm text-[10px] font-medium border border-[#8B7DB8]/30 bg-[#8B7DB8]/10 text-[#8B7DB8]"
                        >
                          {tag.name}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
              
              {/* Status Badge */}
              <span
                className={cn(
                  "shrink-0 rounded-sm px-2 py-0.5 text-xs font-medium uppercase",
                  lead.status === "valid"
                    ? "bg-[#46347F]/10 text-[#46347F]"
                    : "bg-gray-100 text-gray-600"
                )}
              >
                {lead.status === "valid" ? "Válido" : "Atenção"}
              </span>
            </div>
          )
        })}
        {displayLeads.length === 0 && (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            Nenhum lead encontrado
          </div>
        )}
        </div>
      </CardContent>
    </Card>
  )
}
