"use client"

import { useState, useMemo } from "react"
import { Plus, Search, SlidersHorizontal, MoreHorizontal, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Deal, Pipeline, PipelineStageConfig } from "@/lib/types/deal"
import { DealDetailPanel } from "./deal-detail-panel"

// ─── Purple Theme Config ─────────────────────────────────────────────────────

const PURPLE_STAGES: PipelineStageConfig[] = [
  { key: "entrada", label: "Entrada", color: "text-[#6b69c9]", bgColor: "bg-[#f8f7fc]", borderColor: "border-[#e8e6f5]" },
  { key: "tentativa", label: "Tentativa de Contato", color: "text-[#7b79c4]", bgColor: "bg-[#f5f4fa]", borderColor: "border-[#e5e3f0]" },
  { key: "contato", label: "Contato Efetivado", color: "text-[#8b89c9]", bgColor: "bg-[#f2f1f8]", borderColor: "border-[#e2e0ed]" },
  { key: "qualificado", label: "Qualificado", color: "text-[#9b99ce]", bgColor: "bg-[#efeef6]", borderColor: "border-[#dfdeea]" },
  { key: "proposta", label: "Proposta", color: "text-[#aba9d3]", bgColor: "bg-[#ecebf4]", borderColor: "border-[#dcdbef]" },
  { key: "negociacao", label: "Negociação", color: "text-[#bbb9d8]", bgColor: "bg-[#e9e8f2]", borderColor: "border-[#d9d8e5]" },
  { key: "fechamento", label: "Fechamento", color: "text-[#cbc9dd]", bgColor: "bg-[#e6e5f0]", borderColor: "border-[#d6d5e3]" },
]

const INITIAL_DEALS: Deal[] = [
  { id: 1, titulo: "Vinicius", empresa: "TechCorp Ltda", valor: 0, avatar: "VI", responsavel: "Vinicius Santos", email: "vinicius@techcorp.com", prioridade: "alta", dias: 2, stage: "entrada", stageLabel: "Entrada" },
  { id: 2, titulo: "Marissia", empresa: "DataFlow Systems", valor: 0, avatar: "MA", responsavel: "Marissia Lima", email: "marissia@dataflow.com", prioridade: "media", dias: 6, stage: "entrada", stageLabel: "Entrada" },
  { id: 3, titulo: "Fábio Vitorino", empresa: "CloudSync", valor: 0, avatar: "FV", responsavel: "Fábio Vitorino", email: "fabio@cloudsync.com", prioridade: "alta", dias: 8, stage: "entrada", stageLabel: "Entrada" },
  { id: 4, titulo: "Cristiano lira do Nascimento", empresa: "AI Solutions", valor: 0, avatar: "CN", responsavel: "Cristiano Nascimento", email: "cristiano@ai.com", prioridade: "baixa", dias: 17, stage: "entrada", stageLabel: "Entrada" },
  { id: 5, titulo: "Ramon Albergaria", empresa: "DevTools Pro", valor: 0, avatar: "RA", responsavel: "Ramon Albergaria", email: "ramon@devtools.com", prioridade: "alta", dias: 17, stage: "entrada", stageLabel: "Entrada" },
  { id: 6, titulo: "railson", empresa: "codirect.com.br", valor: 0, avatar: "RA", responsavel: "Railson Almeida", email: "railson@codirect.com", prioridade: "alta", dias: 7, stage: "tentativa", stageLabel: "Tentativa de Contato", tags: ["direct", "codirect.com.br"] },
  { id: 7, titulo: "Kelvin Galvão Kirst", empresa: "Eventos Internos", valor: 0, avatar: "KK", responsavel: "Kelvin Kirst", email: "kelvin@eventos.com", prioridade: "media", dias: 17, stage: "tentativa", stageLabel: "Tentativa de Contato", tags: ["evento_interno"] },
  { id: 8, titulo: "Miguel Alves dos Santos Neto", empresa: "Organic Bio", valor: 0, avatar: "MN", responsavel: "Miguel Neto", email: "miguel@organic.com", prioridade: "alta", dias: 9, stage: "tentativa", stageLabel: "Tentativa de Contato", tags: ["organic_bio"] },
  { id: 9, titulo: "Ingrid kezia", empresa: "FinTrack", valor: 0, avatar: "IK", responsavel: "Ingrid Kezia", email: "ingrid@fintrack.com", prioridade: "media", dias: 2, stage: "contato", stageLabel: "Contato Efetivado" },
  { id: 10, titulo: "Matheus Buneo", empresa: "GrowthLab", valor: 0, avatar: "MB", responsavel: "Matheus Buneo", email: "matheus@growth.com", prioridade: "alta", dias: 25, stage: "contato", stageLabel: "Contato Efetivado" },
  { id: 11, titulo: "Cheftensei", empresa: "MegaCorp", valor: 0, avatar: "CH", responsavel: "Cheftensei Silva", email: "cheftensei@megacorp.com", prioridade: "media", dias: 2, stage: "contato", stageLabel: "Contato Efetivado" },
  { id: 12, titulo: "Simão", empresa: "RetailMax", valor: 0, avatar: "SI", responsavel: "Simão Costa", email: "simao@retail.com", prioridade: "baixa", dias: 8, stage: "contato", stageLabel: "Contato Efetivado" },
  { id: 13, titulo: "Gislaine", empresa: "Startup Hub", valor: 0, avatar: "GI", responsavel: "Gislaine Souza", email: "gislaine@startup.com", prioridade: "alta", dias: 17, stage: "contato", stageLabel: "Contato Efetivado" },
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
            <span className={cn("h-2 w-2 rounded-full", stage.color.replace("text-", "bg-").replace("[", "[").replace("]", "]"))} />
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
  }

  const handleClosePanel = () => {
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

        {/* Detail Panel */}
        <DealDetailPanel deal={selectedDeal} onClose={handleClosePanel} />
      </div>
    </div>
  )
}
