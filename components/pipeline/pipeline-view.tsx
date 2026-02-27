"use client"

import { useState, useMemo } from "react"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  ChevronDown, 
  LayoutGrid, 
  List, 
  RotateCcw,
  TrendingUp,
  User,
  Phone,
  Mail,
  Edit3,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react"
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
}

type DealStatus = "open" | "won" | "lost"

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
  status: DealStatus
  // Link to contact
  contactId?: string
}

// ─── Theme Config ────────────────────────────────────────────────────────────

const STAGES: PipelineStageConfig[] = [
  { key: "qualified", label: "Qualificado", color: "#9795e4", bgColor: "bg-[#f8f7fc]" },
  { key: "contact", label: "Contato Realizado", color: "#7b79c4", bgColor: "bg-[#f5f4fa]" },
  { key: "demo", label: "Demo Agendada", color: "#6b69c9", bgColor: "bg-[#f2f1f8]" },
  { key: "proposal", label: "Proposta Enviada", color: "#5b59be", bgColor: "bg-[#efeef6]" },
]

const INITIAL_DEALS: Deal[] = [
  { id: 1, titulo: "Willamette Co deal", empresa: "Willamette Co", valor: 1500, avatar: "WC", responsavel: "Willamette", prioridade: "alta", dias: 3, stage: "qualified", status: "open", contactId: "cont-001" },
  { id: 2, titulo: "Park Place deal", empresa: "Park Place", valor: 4500, avatar: "PP", responsavel: "Park", prioridade: "media", dias: 5, stage: "qualified", status: "open", contactId: "cont-002" },
  { id: 3, titulo: "Dream college deal", empresa: "Dream college", valor: 3700, avatar: "DC", responsavel: "Dream", prioridade: "alta", dias: 7, stage: "qualified", status: "open" },
  { id: 4, titulo: "Pet insurance deal", empresa: "Pet insurance", valor: 1000, avatar: "PI", responsavel: "Pet", prioridade: "baixa", dias: 2, stage: "qualified", status: "open" },
  
  { id: 5, titulo: "Tim and sons logistics", empresa: "Tim and sons logistics", valor: 2300, avatar: "TS", responsavel: "Tim", prioridade: "alta", dias: 3, stage: "contact", status: "open" },
  { id: 6, titulo: "Fantastic hotels LTD deal", empresa: "Fantastic hotels LTD", valor: 1900, avatar: "FH", responsavel: "Fantastic", prioridade: "media", dias: 8, stage: "contact", status: "open", contactId: "cont-003" },
  { id: 7, titulo: "JD manufacturing deal", empresa: "JD manufacturing", valor: 1150, avatar: "JD", responsavel: "JD", prioridade: "baixa", dias: 12, stage: "contact", status: "open" },
  
  { id: 8, titulo: "Bringit media agency deal", empresa: "Bringit media agency", valor: 1400, avatar: "BM", responsavel: "Bringit", prioridade: "media", dias: 4, stage: "demo", status: "open" },
  { id: 9, titulo: "We heart trees non-profit", empresa: "We heart trees", valor: 1700, avatar: "WH", responsavel: "Trees", prioridade: "alta", dias: 6, stage: "demo", status: "open" },
  { id: 10, titulo: "Bringit media agency", empresa: "Bringit media", valor: 1200, avatar: "BM", responsavel: "Bringit", prioridade: "media", dias: 2, stage: "demo", status: "open" },
  
  { id: 11, titulo: "Rio housing deal", empresa: "Rio housing", valor: 2700, avatar: "RH", responsavel: "Rio", prioridade: "alta", dias: 1, stage: "proposal", status: "open" },
  
  { id: 12, titulo: "Maria M. retail LTD", empresa: "Maria M. retail", valor: 2600, avatar: "MR", responsavel: "Maria", prioridade: "media", dias: 5, stage: "proposal", status: "lost" },
  { id: 13, titulo: "Trip abroad LTD", empresa: "Trip abroad", valor: 3750, avatar: "TA", responsavel: "Trip", prioridade: "alta", dias: 0, stage: "proposal", status: "won" },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(val: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(val)
}

function findContactByDeal(deal: Deal): Contact | undefined {
  if (deal.contactId) {
    return MOCK_CONTACTS.find(c => c.id === deal.contactId)
  }
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
  const isWon = deal.status === "won"
  const isLost = deal.status === "lost"

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, deal.id)}
      onClick={onClick}
      className={cn(
        "group cursor-grab rounded-lg border p-3 transition-all hover:shadow-md",
        isDragging && "opacity-50 rotate-1",
        isWon && "bg-emerald-50/50 border-emerald-200",
        isLost && "bg-red-50/50 border-red-200",
        isSelected ? "border-[#9795e4] ring-2 ring-[#9795e4]/20" : 
          !isWon && !isLost && "border-border bg-white hover:border-[#9795e4]/40"
      )}
    >
      {/* Header: Title + Arrow */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <h4 className={cn(
          "text-sm font-semibold leading-tight",
          isWon && "text-emerald-700",
          isLost && "text-red-700"
        )}>
          {deal.titulo}
        </h4>
        <button 
          className={cn(
            "flex-shrink-0 rounded-full p-1 transition-colors",
            isWon && "text-emerald-500 hover:bg-emerald-100",
            isLost && "text-red-500 hover:bg-red-100",
            !isWon && !isLost && "text-gray-400 hover:bg-gray-100 hover:text-[#9795e4]"
          )}
        >
          <ChevronDown className="h-3.5 w-3.5 rotate-[-90deg]" />
        </button>
      </div>

      {/* Company */}
      <p className="text-xs text-muted-foreground mb-2">{deal.empresa}</p>

      {/* Status Badge (if won/lost) */}
      {(isWon || isLost) && (
        <div className="mb-2">
          <span className={cn(
            "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
            isWon && "bg-emerald-500 text-white",
            isLost && "bg-red-500 text-white"
          )}>
            {isWon ? (
              <><CheckCircle2 className="h-3 w-3" /> Won</>
            ) : (
              <><XCircle className="h-3 w-3" /> Lost</>
            )}
          </span>
        </div>
      )}

      {/* Footer: Avatar + Value */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white",
            deal.prioridade === "alta" ? "bg-red-400" : 
            deal.prioridade === "media" ? "bg-amber-400" : "bg-gray-400"
          )}>
            {deal.avatar.slice(0, 2)}
          </div>
          <span className="text-xs font-medium text-foreground">{formatCurrency(deal.valor)}</span>
        </div>
        
        {/* Warning icon for old deals */}
        {deal.dias > 7 && deal.status === "open" && (
          <AlertCircle className="h-4 w-4 text-amber-500" title="Deal antigo" />
        )}
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
  const openDeals = deals.filter(d => d.status === "open")

  return (
    <div
      className="flex w-[280px] flex-shrink-0 flex-col"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, stage.key)}
    >
      {/* Column Header */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">{stage.label}</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
              {deals.length}
            </span>
          </div>
          <div 
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: stage.color }}
          />
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          {formatCurrency(totalValue)} · {openDeals.length} deals
        </div>
      </div>

      {/* Cards Container */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
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
      <button className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground transition-colors hover:border-[#9795e4]/40 hover:bg-[#9795e4]/5 hover:text-[#9795e4]">
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
        d.empresa.toLowerCase().includes(query)
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

  // Totals
  const totalValue = deals.reduce((sum, d) => sum + d.valor, 0)
  const openDealsCount = deals.filter(d => d.status === "open").length

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
          const stageConfig = STAGES.find((s) => s.key === stageKey)
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
      {/* Top Toolbar */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-foreground">Deals</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9 h-9"
            />
          </div>

          <Button size="icon" variant="ghost" className="h-9 w-9">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex h-12 items-center justify-between border-b border-border px-4 bg-muted/30">
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center rounded-md border border-border bg-card p-0.5">
            <Button variant="ghost" size="sm" className="h-7 px-2 gap-1.5 bg-white shadow-sm">
              <LayoutGrid className="h-3.5 w-3.5" />
              Board
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 gap-1.5 text-muted-foreground">
              <List className="h-3.5 w-3.5" />
              List
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Add Deal Button */}
          <Button size="sm" className="h-8 gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white">
            <Plus className="h-4 w-4" />
            Deal
          </Button>
        </div>

        {/* Pipeline Selector + Filters */}
        <div className="flex items-center gap-2">
          {/* Summary */}
          <div className="text-sm text-muted-foreground mr-4">
            <span className="font-semibold text-foreground">{formatCurrency(totalValue)}</span>
            <span className="mx-2">·</span>
            <span>{openDealsCount} deals</span>
          </div>

          {/* Pipeline Dropdown */}
          <Button variant="outline" size="sm" className="h-8 gap-2">
            <LayoutGrid className="h-3.5 w-3.5" />
            Sales pipeline
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>

          <Button variant="outline" size="sm" className="h-8 px-2">
            <Edit3 className="h-3.5 w-3.5" />
          </Button>

          <Button variant="outline" size="sm" className="h-8 gap-2">
            <Filter className="h-3.5 w-3.5" />
            Filter
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex flex-1 gap-4 overflow-x-auto overflow-y-hidden p-4">
        {STAGES.map((stage) => (
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

      {/* Contact Detail Panel */}
      <ContactDetailPanel 
        isOpen={isPanelOpen} 
        onClose={handleClosePanel}
        contact={selectedContact}
      />
    </div>
  )
}
