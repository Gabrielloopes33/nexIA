"use client"

import { X, Building2, User, DollarSign, Calendar, Tag, Phone, Mail, MessageSquare } from "lucide-react"
import { Deal } from "@/lib/types/deal"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface DealDetailPanelProps {
  deal: Deal | null
  onClose: () => void
}

const PRIORIDADE_CONFIG = {
  alta: { label: "Alta", bg: "bg-[#9795e4]/20", text: "text-[#6b69c9]", dot: "bg-[#9795e4]" },
  media: { label: "Média", bg: "bg-[#b8b6ec]/20", text: "text-[#8b89c9]", dot: "bg-[#b8b6ec]" },
  baixa: { label: "Baixa", bg: "bg-[#e0dff5]/30", text: "text-[#9795a0]", dot: "bg-[#d0cfe0]" },
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)
}

export function DealDetailPanel({ deal, onClose }: DealDetailPanelProps) {
  if (!deal) {
    return (
      <aside className="w-[320px] flex-shrink-0 border-l border-border bg-card flex flex-col">
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <span className="font-semibold text-foreground">Detalhes do Negócio</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#9795e4]/10">
            <DollarSign className="h-8 w-8 text-[#9795e4]" />
          </div>
          <p className="text-sm text-muted-foreground">
            Selecione um negócio para visualizar os detalhes
          </p>
        </div>
      </aside>
    )
  }

  const pri = PRIORIDADE_CONFIG[deal.prioridade]

  return (
    <aside className="w-[320px] flex-shrink-0 border-l border-border bg-card flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <span className="font-semibold text-foreground">Detalhes do Negócio</span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Deal Title */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-foreground">{deal.titulo}</h2>
          <div className="mt-2 flex items-center gap-2">
            <span className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", pri.bg, pri.text)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", pri.dot)} />
              Prioridade {pri.label}
            </span>
            <span className="text-xs text-muted-foreground">{deal.dias} dias nesta etapa</span>
          </div>
        </div>

        {/* Value */}
        <div className="mb-6 rounded-xl bg-[#9795e4]/5 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <DollarSign className="h-4 w-4" />
            Valor do Negócio
          </div>
          <div className="text-2xl font-bold text-[#9795e4]">{formatCurrency(deal.valor)}</div>
        </div>

        {/* Company */}
        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Building2 className="h-4 w-4 text-[#9795e4]" />
            Empresa
          </h3>
          <div className="rounded-xl border border-border bg-background p-3">
            <div className="font-medium text-foreground">{deal.empresa}</div>
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                +55 11 98765-4321
              </span>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <User className="h-4 w-4 text-[#9795e4]" />
            Contato Principal
          </h3>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#9795e4]/10 text-sm font-bold text-[#9795e4]">
              {deal.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground truncate">{deal.responsavel || "Sem responsável"}</div>
              <div className="text-xs text-muted-foreground">{deal.email || "email@empresa.com"}</div>
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs">
              <Phone className="h-3.5 w-3.5" />
              Ligar
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs">
              <Mail className="h-3.5 w-3.5" />
              Email
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs">
              <MessageSquare className="h-3.5 w-3.5" />
              WhatsApp
            </Button>
          </div>
        </div>

        {/* Stage Info */}
        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Tag className="h-4 w-4 text-[#9795e4]" />
            Etapa Atual
          </h3>
          <div className="rounded-xl border border-border bg-background p-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#9795e4]" />
              <span className="font-medium text-foreground">{deal.stageLabel || deal.stage}</span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Negócio está há {deal.dias} dias nesta etapa
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Calendar className="h-4 w-4 text-[#9795e4]" />
            Histórico
          </h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="h-2 w-2 rounded-full bg-[#9795e4]" />
                <span className="mt-1 h-full w-px bg-border" />
              </div>
              <div className="pb-4">
                <div className="text-xs text-muted-foreground">{format(new Date(), "dd/MM/yyyy", { locale: ptBR })}</div>
                <div className="text-sm text-foreground">Negócio criado</div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="h-2 w-2 rounded-full bg-[#b8b6ec]" />
                <span className="mt-1 h-full w-px bg-border" />
              </div>
              <div className="pb-4">
                <div className="text-xs text-muted-foreground">{format(new Date(Date.now() - 86400000 * deal.dias), "dd/MM/yyyy", { locale: ptBR })}</div>
                <div className="text-sm text-foreground">Movido para etapa atual</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-border p-4">
        <Button className="w-full gap-2 bg-[#9795e4] hover:bg-[#7b79c4] text-white">
          <DollarSign className="h-4 w-4" />
          Avançar Etapa
        </Button>
      </div>
    </aside>
  )
}
