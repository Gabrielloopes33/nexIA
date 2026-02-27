import { Linkedin, ExternalLink, Star, Users } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ENRICHED_LEADS } from "@/lib/mock-leads-enriched"
import { getTagsByIds } from "@/lib/tag-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useContactPanel } from "@/lib/contexts/contact-panel-context"
import { Contact } from "@/lib/mock/contacts"

// Pega os 5 leads mais recentes (ordenados por atualizadoEm)
const recentLeads = [...ENRICHED_LEADS]
  .sort((a, b) => {
    const dateA = a.atualizadoEm ? new Date(a.atualizadoEm).getTime() : 0
    const dateB = b.atualizadoEm ? new Date(b.atualizadoEm).getTime() : 0
    return dateB - dateA
  })
  .slice(0, 5)

const leads = recentLeads.map(lead => {
  const initials = lead.nome
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
  
  // Define status baseado no leadScore
  const isValid = (lead.leadScore || 0) >= 60
  
  return {
    id: lead.id,
    name: lead.nome,
    role: `${lead.cargo} | ${lead.empresa}`,
    email: lead.email,
    status: isValid ? ("valid" as const) : ("risky" as const),
    avatar: initials,
    // Cores padronizadas em tons de roxo/cinza
    avatarBg: "#E8E7F7",  // Roxo muito claro
    avatarColor: "#7573b8", // Roxo escuro
    leadScore: lead.leadScore,
    tags: lead.tags || [],
    favorito: lead.favorito || false
  }
})

export function RecentLeads() {
  const { openContactPanel } = useContactPanel()

  const handleLeadClick = (lead: typeof leads[0], originalLead: typeof ENRICHED_LEADS[0]) => {
    // Converte o lead do dashboard para o formato Contact
    const contactData: Contact = {
      id: String(originalLead.id),
      nome: originalLead.nome.split(' ')[0] || originalLead.nome,
      sobrenome: originalLead.nome.split(' ').slice(1).join(' ') || '',
      email: originalLead.email,
      telefone: originalLead.telefone || '+55 (11) 99999-9999',
      cidade: originalLead.localizacao?.split(',')[0] || 'São Paulo',
      estado: originalLead.localizacao?.split(',')[1]?.trim() || 'SP',
      cargo: originalLead.cargo || 'Gerente',
      empresa: originalLead.empresa || '',
      tags: originalLead.tags || [],
      leadScore: originalLead.leadScore || 50,
      status: 'ativo',
      origem: originalLead.fonte || 'Dashboard',
      criadoEm: originalLead.criadoEm || new Date().toISOString(),
      atualizadoEm: originalLead.atualizadoEm || new Date().toISOString(),
      atualizadoPor: 'Sistema',
      avatar: lead.avatar,
      avatarBg: lead.avatarBg,
      observacoes: ''
    }
    openContactPanel(contactData)
  }

  return (
    <Card className="rounded-sm border-2 border-border">
      <CardHeader className="p-4 pb-3 border-b-2 border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-bold">Leads Recentes</CardTitle>
            <div className="flex items-center gap-1.5 rounded-sm bg-[#9795e4]/10 px-2 py-0.5">
              <Users className="h-3 w-3 text-[#9795e4]" />
              <span className="text-xs font-semibold text-[#9795e4]">{leads.length}</span>
            </div>
          </div>
          <Link href="/contatos" className="flex items-center gap-1.5 text-sm font-medium text-[#9795e4] transition-colors hover:opacity-80">
            Ver Todos
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
        {leads.map((lead, index) => {
          const leadTags = getTagsByIds(lead.tags.slice(0, 2)) // Mostra até 2 tags
          
          return (
            <div
              key={lead.id}
              onClick={() => handleLeadClick(lead, recentLeads[index])}
              className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[#F3F2F2] cursor-pointer"
            >
              {/* Avatar */}
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ backgroundColor: lead.avatarBg, color: lead.avatarColor }}
              >
                {lead.avatar}
              </div>
              
              {/* Name & Role with Tags */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{lead.name}</p>
                  {lead.favorito && (
                    <Star className="h-3.5 w-3.5 fill-[#9795e4] text-[#9795e4] shrink-0" />
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground mb-1">{lead.role}</p>
                {leadTags.length > 0 && (
                  <div className="flex gap-1">
                    {leadTags.map(tag => {
                      return (
                        <span
                          key={tag.id}
                          className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-medium border border-[#9795e4]/30 bg-[#9795e4]/10 text-[#7573b8]"
                        >
                          {tag.name}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
              
              {/* Lead Score Badge */}
              {lead.leadScore !== undefined && (
                <div className="shrink-0 text-center">
                  <div className="text-xs font-bold px-2 py-1 rounded-sm bg-[#9795e4]/10 text-[#7573b8]">
                    {lead.leadScore}
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">
                    Score
                  </div>
                </div>
              )}
              
              {/* Status Badge */}
              <span
                className={cn(
                  "shrink-0 rounded-sm px-2.5 py-0.5 text-[11px] font-medium uppercase",
                  lead.status === "valid"
                    ? "bg-[#9795e4]/10 text-[#7573b8]"
                    : "bg-gray-100 text-gray-500"
                )}
              >
                {lead.status === "valid" ? "Válido" : "Atenção"}
              </span>
              
              {/* LinkedIn */}
              <button className="shrink-0 rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-[#F3F2F2] hover:text-[#0A66C2]">
                <Linkedin className="h-4 w-4" />
              </button>
            </div>
          )
        })}
        </div>
      </CardContent>
    </Card>
  )
}
