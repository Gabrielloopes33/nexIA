"use client"

import { useState, useMemo } from "react"
import { Plus, Search, SlidersHorizontal, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ContactDetailPanel } from "@/components/contact-detail-panel"
import { MOCK_CONTACTS, Contact } from "@/lib/mock/contacts"

// ─── Types ───────────────────────────────────────────────────────────────────

interface PipelineStageConfig {
  key: string
  label: string
  color: string
  bgColor: string
  borderColor: string
}

interface Deal {
  id: number
  titulo: string
  empresa: string
  valor: number
  avatar: string
  responsavel?: string
  email?: string
  telefone?: string
  prioridade: "alta" | "media" | "baixa"
  dias: number
  stage: string
  stageLabel?: string
  tags?: string[]
  // Link to contact
  contactId?: string
}

// ─── Purple Theme Config ─────────────────────────────────────────────────────

const PURPLE_STAGES: PipelineStageConfig[] = [
  { key: "novo", label: "Novo", color: "text-[#6b69c9]", bgColor: "bg-[#f8f7fc]", borderColor: "border-[#e8e6f5]" },
  { key: "qualificado", label: "Qualificado", color: "text-[#7b79c4]", bgColor: "bg-[#f5f4fa]", borderColor: "border-[#e5e3f0]" },
  { key: "proposta", label: "Proposta", color: "text-[#8b89c9]", bgColor: "bg-[#f2f1f8]", borderColor: "border-[#e2e0ed]" },
  { key: "fechamento", label: "Fechamento", color: "text-[#9b99ce]", bgColor: "bg-[#efeef6]", borderColor: "border-[#dfdeea]" },
]

// Link deals to existing contacts by name/empresa similarity
const INITIAL_DEALS: Deal[] = [
  { id: 1, titulo: "Vinicius Santos", empresa: "TechCorp Brasil", valor: 48000, avatar: "VS", responsavel: "Vinicius Santos", email: "vinicius@techcorp.com", prioridade: "alta", dias: 2, stage: "novo", stageLabel: "Novo", contactId: "cont-001" },
  { id: 2, titulo: "Marissia Lima", empresa: "Costa & Associados", valor: 32000, avatar: "ML", responsavel: "Marissia Lima", email: "marissia@costa.com", prioridade: "media", dias: 6, stage: "novo", stageLabel: "Novo", contactId: "cont-002" },
  { id: 3, titulo: "Fábio Vitorino", empresa: "Vendas Express", valor: 15000, avatar: "FV", responsavel: "Fábio Vitorino", email: "fabio@vendas.com", prioridade: "alta", dias: 8, stage: "novo", stageLabel: "Novo", contactId: "cont-003" },
  { id: 4, titulo: "Cristiano Nascimento", empresa: "DataFlow Systems", valor: 85000, avatar: "CN", responsavel: "Cristiano Nascimento", email: "cristiano@dataflow.com", prioridade: "baixa", dias: 17, stage: "novo", stageLabel: "Novo", tags: ["enterprise"] },
  { id: 5, titulo: "Railson Almeida", empresa: "codirect.com.br", valor: 12000, avatar: "RA", responsavel: "Railson Almeida", email: "railson@codirect.com", prioridade: "alta", dias: 7, stage: "qualificado", stageLabel: "Qualificado", tags: ["direct"] },
  { id: 6, titulo: "Kelvin Kirst", empresa: "Eventos Internos", valor: 18000, avatar: "KK", responsavel: "Kelvin Kirst", email: "kelvin@eventos.com", prioridade: "media", dias: 17, stage: "qualificado", stageLabel: "Qualificado", tags: ["evento"] },
  { id: 7, titulo: "Miguel Neto", empresa: "Organic Bio", valor: 35000, avatar: "MN", responsavel: "Miguel Alves", email: "miguel@organic.com", prioridade: "alta", dias: 9, stage: "proposta", stageLabel: "Proposta" },
  { id: 8, titulo: "Ingrid Kezia", empresa: "FinTrack", valor: 67000, avatar: "IK", responsavel: "Ingrid Kezia", email: "ingrid@fintrack.com", prioridade: "media", dias: 2, stage: "proposta", stageLabel: "Proposta" },
  { id: 9, titulo: "Gislaine Souza", empresa: "Startup Hub", valor: 45000, avatar: "GS", responsavel: "Gislaine Souza", email: "gislaine@startup.com", prioridade: "alta", dias: 17, stage: "fechamento", stageLabel: "Fechamento" },
  { id: 10, titulo: "Matheus Buneo", empresa: "GrowthLab", valor: 42000, avatar: "MB", responsavel: "Matheus Buneo", email: "matheus@growth.com", prioridade: "alta", dias: 25, stage: "fechamento", stageLabel: "Fechamento" },
]

const PRIORIDADE_CONFIG = {
  alta: { bg: "bg-[#9795e4]", text: "text-white", label: "Alta" },
  media: { bg: "bg-[#b8b6ec]", text: "text-white", label: "Média" },
  baixa: { bg: "bg-[#e0dff5]", text: "text-[#6b69c9]", label: "Baixa" },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(val: number) {
  if (val === 0) return "R$ 0"
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(val)
}

function avatarColor(initials: string): string {
  const colors = [
    "bg-[#9795e4] text-white",
    "bg-[#b8b6ec] text-white", 
    "bg-[#7b79c4] text-white",
    "bg-[#6b69c9] text-white",
    "bg-[#8b89c9] text-white",
  ]
  const idx = (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % colors.length
  return colors[idx]
}

function findContactByDeal(deal: Deal): Contact | undefined {
  if (deal.contactId) {
    return MOCK_CONTACTS.find(c => c.id === deal.contactId)
  }
  // Try to find by name or empresa
  return MOCK_CONTACTS.find(c => 
    deal.titulo.toLowerCase().includes(c.nome.toLowerCase()) ||
    deal.empresa.toLowerCase().includes(c.empresa.toLowerCase())
  )
}

// ─── Components ──────────────────────────────────────────────────────────────

interface DealCardProps {
  deal: Deal
  isDragging?: boolean
  onDragStart: (e: React.DragEvent, dealId: number) => void
  onClick: () => void
  isSelected: boolean
}

function DealCard({ deal, isDragging, onDragStart, onClick, isSelected }: DealCardProps) {
  const pri = PRIORIDADE_CONFIG[deal.prioridade]
  const avatarClass = avatarColor(deal.avatar)

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, deal.id)}
      onClick={onClick}
      className={cn(
        "group cursor-grab rounded-xl border bg-white p-3 transition-all hover:shadow-md",
        isDragging && "opacity-50 rotate-2",
        isSelected ? "border-[#9795e4] ring-2 ring-[#9795e4]/20" : "border-border hover:border-[#9795e4]/40"
      )}
    >
      {/* Tags */}
      {deal.tags && deal.tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {deal.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-[#e0dff5] text-[#6b69c9]"
            >
              {tag}
            </span>
          ))}
          {deal.tags.length > 2 && (
            <span className="text-[10px] text-muted-foreground">+{deal.tags.length - 2}</span>
          )}
        </div>
      )}

      {/* Title */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-foreground leading-tight">{deal.titulo}</h4>
        <GripVertical className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      {/* Value */}
      <div className="mb-2 text-xs text-muted-foreground">{formatCurrency(deal.valor)}</div>

      {/* Footer: Avatar + Priority + Days */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Avatar */}
          <div className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold", avatarClass)}>
            {deal.avatar.slice(0, 2)}
          </div>
          {/* Priority Badge */}
          <span className={cn("h-2 w-2 rounded-full", pri.bg)} />
        </div>
        
        {/* Days indicator */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span>{deal.dias}d</span>
        </div>
      </div>
    </div>
  )
}

interface PipelineColumnProps {
  stage: PipelineStageConfig
  deals: Deal[]
  draggedDealId: number | null
  onDragStart: (e: React.DragEvent, dealId: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, stageKey: string) => void
  onDealClick: (deal: Deal) => void
  selectedDealId: number | null
}

function PipelineColumn({
  stage,
  deals,
  draggedDealId,
  onDragStart,
  onDragOver,
  onDrop,
  onDealClick,
  selectedDealId,
}: PipelineColumnProps) {
  const totalValue = deals.reduce((sum, d) => sum + d.valor, 0)

  return (
    <div
      className="flex w-[260px] flex-shrink-0 flex-col"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, stage.key)}
    >
      {/* Column Header */}
      <div className={cn("mb-2 rounded-xl border px-3 py-2.5", stage.bgColor, stage.borderColor)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full bg-[#9795e4]")} />
            <span className={cn("text-xs font-semibold", stage.color)}>{stage.label}</span>
          </div>
          <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold text-foreground">
            {deals.length}
          </span>
        </div>
        <div className="mt-1 text-[10px] text-muted-foreground">{formatCurrency(totalValue)}</div>
      </div>

      {/* Cards Container */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-0.5 pb-2">
        {deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            isDragging={draggedDealId === deal.id}
            onDragStart={onDragStart}
            onClick={() => onDealClick(deal)}
            isSelected={selectedDealId === deal.id}
          />
        ))}
      </div>

      {/* Add Button */}
      <button className="mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2 text-xs text-muted-foreground transition-colors hover:border-[#9795e4]/40 hover:bg-[#9795e4]/5 hover:text-[#9795e4]">
        <Plus className="h-3.5 w-3.5" />
        Adicionar negócio
      </button>
    </div>
  )
}

// ─── Main View ───────────────────────────────────────────────────────────────

export function PipelineView() {
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS)
  const [selectedDealId, setSelectedDealId] = useState<number | null>(null)
  const [draggedDealId, setDraggedDealId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  const filteredDeals = useMemo(() => {
    if (!searchQuery) return deals
    const query = searchQuery.toLowerCase()
    return deals.filter(
      (d) =>
        d.titulo.toLowerCase().includes(query) ||
        d.empresa.toLowerCase().includes(query) ||
        d.responsavel?.toLowerCase().includes(query)
    )
  }, [deals, searchQuery])

  const selectedDeal = useMemo(
    () => deals.find((d) => d.id === selectedDealId) || null,
    [deals, selectedDealId]
  )

  const selectedContact = useMemo(() => {
    if (!selectedDeal) return undefined
    return findContactByDeal(selectedDeal)
  }, [selectedDeal])

  const handleDragStart = (e: React.DragEvent, dealId: number) => {
    setDraggedDealId(dealId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault()
    if (!draggedDealId) return

    setDeals((prev) =>
      prev.map((deal) => {
        if (deal.id === draggedDealId) {
          const stageConfig = PURPLE_STAGES.find((s) => s.key === stageKey)
          return {
            ...deal,
            stage: stageKey,
            stageLabel: stageConfig?.label || deal.stageLabel,
          }
        }
        return deal
      })
    )
    setDraggedDealId(null)
  }

  const handleDealClick = (deal: Deal) => {
    setSelectedDealId(deal.id)
    setIsPanelOpen(true)
  }

  const handleClosePanel = () => {
    setIsPanelOpen(false)
    setSelectedDealId(null)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-border px-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Pipeline Comercial</h1>
          <p className="text-xs text-muted-foreground">
            {deals.length} oportunidades de negócio
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar negócios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9"
            />
          </div>

          {/* Filters */}
          <Button variant="outline" size="sm" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
          </Button>

          {/* Add Deal */}
          <Button size="sm" className="gap-2 bg-[#9795e4] hover:bg-[#7b79c4] text-white">
            <Plus className="h-4 w-4" />
            Negócio
          </Button>
        </div>
      </header>

      {/* Kanban Board */}
      <div className="flex flex-1 gap-4 overflow-x-auto overflow-y-hidden p-4">
        {PURPLE_STAGES.map((stage) => (
          <PipelineColumn
            key={stage.key}
            stage={stage}
            deals={filteredDeals.filter((d) => d.stage === stage.key)}
            draggedDealId={draggedDealId}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDealClick={handleDealClick}
            selectedDealId={selectedDealId}
          />
        ))}
      </div>

      {/* Contact Detail Panel - Same as other pages */}
      <ContactDetailPanel 
        isOpen={isPanelOpen} 
        onClose={handleClosePanel}
        contact={selectedContact}
      />
    </div>
  )
}
