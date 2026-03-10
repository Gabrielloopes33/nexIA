"use client"

import { useState, useMemo, useEffect } from "react"
import { 
  Plus, 
  Search, 
  Filter, 
  ChevronDown, 
  LayoutGrid, 
  List, 
  RotateCcw,
  TrendingUp,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Check,
  GripVertical,
  Kanban
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DealCard } from "./DealCard"
import { DealDetailModal } from "./DealDetailModal"
import { PipelineStage, Deal, DealActivity, DealPriority, DealStatus } from "@prisma/client"

// ─── Types ───────────────────────────────────────────────────────────────────

type ViewMode = "board" | "list"
type Prioridade = "alta" | "media" | "baixa"

interface Filtros {
  prioridade: Prioridade[]
  status: DealStatus[]
  valorMin: number | null
  valorMax: number | null
}

interface DealWithRelations extends Deal {
  contact?: {
    id: string
    name: string
    phone?: string
    avatarUrl?: string | null
  }
  stage?: {
    id: string
    name: string
    color: string
    probability: number
  }
  leadScore: number
  activitiesCount?: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(val: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(val)
}

// ─── Components ──────────────────────────────────────────────────────────────

interface PipelineColumnProps {
  stage: PipelineStage
  deals: DealWithRelations[]
  draggedDealId: string | null
  onDragStart: (e: React.DragEvent, dealId: string) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, stageId: string) => void
  onDealClick: (deal: DealWithRelations) => void
  selectedDealId: string | null
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
  const totalValue = deals.reduce((sum, d) => sum + Number(d.amount), 0)
  const openDeals = deals.filter(d => d.status === "OPEN")

  return (
    <div
      className="flex w-[280px] flex-shrink-0 flex-col"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, stage.id)}
    >
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">{stage.name}</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
              {deals.length}
            </span>
          </div>
          <div 
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: stage.color || undefined }}
          />
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          {formatCurrency(totalValue)} · {openDeals.length} negócios
        </div>
      </div>

      {/* Cards */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={{
              id: deal.id,
              title: deal.title,
              value: Number(deal.amount),
              currency: deal.currency,
              priority: deal.priority,
              leadScore: deal.leadScore,
              expectedCloseDate: deal.expectedCloseDate?.toISOString() || null,
              contact: deal.contact,
              activitiesCount: deal.activitiesCount,
              updatedAt: deal.updatedAt.toISOString(),
            }}
            onClick={() => onDealClick(deal)}
          />
        ))}
      </div>

      {/* Add Button */}
      <button className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground transition-colors hover:border-[#46347F]/40 hover:bg-[#46347F]/5 hover:text-[#46347F]">
        <Plus className="h-3.5 w-3.5" />
        Adicionar negócio
      </button>
    </div>
  )
}

// ─── List View ───────────────────────────────────────────────────────────────

interface DealListViewProps {
  deals: DealWithRelations[]
  stages: PipelineStage[]
  onDealClick: (deal: DealWithRelations) => void
  selectedDealId: string | null
  draggedDealId: string | null
  onDragStart: (e: React.DragEvent, dealId: string) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, stageId: string) => void
}

function DealListView({ 
  deals, 
  stages,
  onDealClick, 
  selectedDealId,
  draggedDealId,
  onDragStart,
  onDragOver,
  onDrop
}: DealListViewProps) {
  // Agrupa deals por estágio
  const dealsByStage = stages.map(stage => ({
    stage,
    deals: deals.filter(d => d.stageId === stage.id)
  }))

  const getPriorityLabel = (priority: DealPriority) => {
    switch (priority) {
      case "HIGH": return "alta"
      case "MEDIUM": return "media"
      case "LOW": return "baixa"
      default: return "media"
    }
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="space-y-4">
        {dealsByStage.map(({ stage, deals: stageDeals }) => {
          const totalValue = stageDeals.reduce((sum, d) => sum + Number(d.amount), 0)
          const openDeals = stageDeals.filter(d => d.status === "OPEN")

          return (
            <div 
              key={stage.id}
              className="rounded-lg border border-border bg-white overflow-hidden"
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, stage.id)}
            >
              {/* Stage Header */}
              <div 
                className="flex items-center justify-between px-4 py-3 border-b border-border"
                style={{ backgroundColor: stage.color ? `${stage.color}15` : undefined }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: stage.color || undefined }}
                  />
                  <span className="font-semibold text-foreground">{stage.name}</span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-gray-600">
                    {stageDeals.length}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{formatCurrency(totalValue)}</span>
                  <span>·</span>
                  <span>{openDeals.length} abertos</span>
                </div>
              </div>

              {/* Deals List */}
              {stageDeals.length > 0 ? (
                <div className="divide-y divide-border">
                  {stageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, deal.id)}
                      onClick={() => onDealClick(deal)}
                      className={cn(
                        "flex items-center gap-4 px-4 py-3 text-sm cursor-grab transition-colors hover:bg-muted/20",
                        selectedDealId === deal.id && "bg-[#46347F]/5",
                        deal.status === "WON" && "bg-emerald-50/30",
                        deal.status === "LOST" && "bg-red-50/30",
                        draggedDealId === deal.id && "opacity-50"
                      )}
                    >
                      {/* Drag Handle */}
                      <div className="text-muted-foreground/40">
                        <GripVertical className="h-4 w-4" />
                      </div>

                      {/* Avatar */}
                      <div className="flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-bold text-white shrink-0"
                        style={{ 
                          backgroundColor: deal.priority === "HIGH" ? "#f87171" : 
                                          deal.priority === "MEDIUM" ? "#fbbf24" : "#9ca3af"
                        }}
                      >
                        {deal.contact?.name?.slice(0, 2).toUpperCase() || "?"}
                      </div>

                      {/* Title & Contact */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{deal.title}</span>
                          {deal.status === "WON" && (
                            <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500 text-white">
                              <CheckCircle2 className="h-3 w-3" /> Ganho
                            </span>
                          )}
                          {deal.status === "LOST" && (
                            <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-red-500 text-white">
                              <XCircle className="h-3 w-3" /> Perdido
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{deal.contact?.name}</span>
                      </div>

                      {/* Value */}
                      <div className="w-24 shrink-0 text-sm font-semibold text-foreground text-right">
                        {formatCurrency(Number(deal.amount))}
                      </div>

                      {/* Priority */}
                      <div className="w-20 shrink-0 flex justify-center">
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-medium",
                          deal.priority === "HIGH" ? "bg-red-100 text-red-600" : 
                          deal.priority === "MEDIUM" ? "bg-amber-100 text-amber-600" : 
                          "bg-gray-100 text-gray-600"
                        )}>
                          {getPriorityLabel(deal.priority)}
                        </span>
                      </div>

                      {/* Lead Score */}
                      <div className="w-16 shrink-0 text-center">
                        <span className={cn(
                          "text-xs font-medium",
                          deal.leadScore >= 60 ? "text-green-600" : 
                          deal.leadScore >= 40 ? "text-yellow-600" : "text-red-600"
                        )}>
                          {deal.leadScore}
                        </span>
                      </div>

                      {/* Ações */}
                      <div className="w-10 shrink-0 flex justify-end">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Nenhum negócio nesta etapa
                </div>
              )}

              {/* Add Button */}
              <button className="flex w-full items-center justify-center gap-1.5 border-t border-border py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/30 hover:text-[#46347F]">
                <Plus className="h-3.5 w-3.5" />
                Adicionar negócio
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Filter Dropdown Component ───────────────────────────────────────────────

interface FilterDropdownProps {
  filtros: Filtros
  onChange: (filtros: Filtros) => void
}

function FilterDropdown({ filtros, onChange }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const togglePrioridade = (p: Prioridade) => {
    const novas = filtros.prioridade.includes(p)
      ? filtros.prioridade.filter(x => x !== p)
      : [...filtros.prioridade, p]
    onChange({ ...filtros, prioridade: novas })
  }

  const toggleStatus = (s: DealStatus) => {
    const novos = filtros.status.includes(s)
      ? filtros.status.filter(x => x !== s)
      : [...filtros.status, s]
    onChange({ ...filtros, status: novos })
  }

  const limparFiltros = () => {
    onChange({ prioridade: [], status: [], valorMin: null, valorMax: null })
  }

  const temFiltros = filtros.prioridade.length > 0 || filtros.status.length > 0 || filtros.valorMin !== null || filtros.valorMax !== null

  return (
    <div className="relative">
      <Button 
        variant="outline" 
        size="sm" 
        className={cn(
          "h-8 gap-2",
          temFiltros && "border-[#46347F] text-[#46347F]"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Filter className="h-3.5 w-3.5" />
        Filtros
        {temFiltros && (
          <span className="ml-1 rounded-full bg-[#46347F] px-1.5 py-0.5 text-[10px] text-white">
            {filtros.prioridade.length + filtros.status.length + (filtros.valorMin || filtros.valorMax ? 1 : 0)}
          </span>
        )}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-lg border border-border bg-white p-4 shadow-lg">
            {/* Prioridade */}
            <div className="mb-4">
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Prioridade</h4>
              <div className="space-y-1">
                {(["alta", "media", "baixa"] as Prioridade[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => togglePrioridade(p)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <span className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border",
                      filtros.prioridade.includes(p) 
                        ? "border-[#46347F] bg-[#46347F] text-white" 
                        : "border-border"
                    )}>
                      {filtros.prioridade.includes(p) && <Check className="h-3 w-3" />}
                    </span>
                    <span className={cn(
                      "capitalize",
                      p === "alta" && "text-red-600",
                      p === "media" && "text-amber-600",
                      p === "baixa" && "text-gray-500"
                    )}>
                      {p}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="mb-4">
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Status</h4>
              <div className="space-y-1">
                {([
                  { key: "OPEN", label: "Em aberto" },
                  { key: "WON", label: "Ganho" },
                  { key: "LOST", label: "Perdido" }
                ] as { key: DealStatus; label: string }[]).map((s) => (
                  <button
                    key={s.key}
                    onClick={() => toggleStatus(s.key)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <span className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border",
                      filtros.status.includes(s.key) 
                        ? "border-[#46347F] bg-[#46347F] text-white" 
                        : "border-border"
                    )}>
                      {filtros.status.includes(s.key) && <Check className="h-3 w-3" />}
                    </span>
                    <span className={cn(
                      s.key === "WON" && "text-emerald-600",
                      s.key === "LOST" && "text-red-600"
                    )}>
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Valor */}
            <div className="mb-4">
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Valor</h4>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filtros.valorMin || ""}
                  onChange={(e) => onChange({ ...filtros, valorMin: e.target.value ? Number(e.target.value) : null })}
                  className="h-8 text-sm"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filtros.valorMax || ""}
                  onChange={(e) => onChange({ ...filtros, valorMax: e.target.value ? Number(e.target.value) : null })}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between border-t border-border pt-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs"
                onClick={limparFiltros}
              >
                Limpar
              </Button>
              <Button 
                size="sm" 
                className="h-7 bg-[#46347F] hover:bg-[#7b79c4] text-white text-xs"
                onClick={() => setIsOpen(false)}
              >
                Aplicar
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main View ───────────────────────────────────────────────────────────────

export function PipelineViewReal() {
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [deals, setDeals] = useState<DealWithRelations[]>([])
  const [activities, setActivities] = useState<DealActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null)
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("board")
  const [showAddModal, setShowAddModal] = useState(false)
  const [filtros, setFiltros] = useState<Filtros>({
    prioridade: [],
    status: [],
    valorMin: null,
    valorMax: null
  })

  // Fetch data on mount
  useEffect(() => {
    fetchStages()
    fetchDeals()
  }, [])

  const fetchStages = async () => {
    try {
      const response = await fetch("/api/pipeline/stages")
      const data = await response.json()
      if (data.success) {
        setStages(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch stages:", error)
    }
  }

  const fetchDeals = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/pipeline/deals")
      const data = await response.json()
      if (data.success) {
        setDeals(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch deals:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchActivities = async (dealId: string) => {
    try {
      const response = await fetch(`/api/pipeline/deals/${dealId}/activities`)
      const data = await response.json()
      if (data.success) {
        setActivities(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error)
    }
  }

  const handleMoveDeal = async (dealId: string, newStageId: string) => {
    try {
      const response = await fetch(`/api/pipeline/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId: newStageId }),
      })

      if (response.ok) {
        // Refresh deals to get updated data
        await fetchDeals()
      }
    } catch (error) {
      console.error("Failed to move deal:", error)
    }
  }

  const handleAddNote = async (note: string) => {
    if (!selectedDealId) return

    try {
      const response = await fetch(`/api/pipeline/deals/${selectedDealId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "NOTE",
          description: note,
        }),
      })

      if (response.ok) {
        await fetchActivities(selectedDealId)
      }
    } catch (error) {
      console.error("Failed to add note:", error)
    }
  }

  const filteredDeals = useMemo(() => {
    let result = deals
    
    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(query) ||
          d.contact?.name?.toLowerCase().includes(query) ||
          d.contact?.email?.toLowerCase().includes(query)
      )
    }
    
    // Filtros de prioridade
    if (filtros.prioridade.length > 0) {
      result = result.filter(d => {
        const priorityMap: Record<DealPriority, Prioridade> = {
          HIGH: "alta",
          MEDIUM: "media",
          LOW: "baixa",
        }
        return filtros.prioridade.includes(priorityMap[d.priority])
      })
    }
    
    // Filtros de status
    if (filtros.status.length > 0) {
      result = result.filter(d => filtros.status.includes(d.status))
    }
    
    // Filtro de valor
    if (filtros.valorMin !== null) {
      result = result.filter(d => Number(d.amount) >= filtros.valorMin!)
    }
    if (filtros.valorMax !== null) {
      result = result.filter(d => Number(d.amount) <= filtros.valorMax!)
    }
    
    return result
  }, [deals, searchQuery, filtros])

  const selectedDeal = useMemo(
    () => deals.find((d) => d.id === selectedDealId) || null,
    [deals, selectedDealId]
  )

  // Totals
  const totalValue = deals.filter(d => d.status === "OPEN").reduce((sum, d) => sum + Number(d.amount), 0)
  const openDealsCount = deals.filter(d => d.status === "OPEN").length

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    setDraggedDealId(dealId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    if (!draggedDealId) return

    // Optimistic update
    setDeals((prev) =>
      prev.map((deal) => {
        if (deal.id === draggedDealId) {
          return { ...deal, stageId }
        }
        return deal
      })
    )

    // Persist to backend
    handleMoveDeal(draggedDealId, stageId)
    setDraggedDealId(null)
  }

  const handleDealClick = (deal: DealWithRelations) => {
    setSelectedDealId(deal.id)
    fetchActivities(deal.id)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedDealId(null)
    setActivities([])
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#46347F] border-t-transparent mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando pipeline...</p>
        </div>
      </div>
    )
  }

  // Empty state when no stages exist
  if (stages.length === 0) {
    return (
      <div className="flex h-full flex-col overflow-hidden bg-background">
        {/* Top Toolbar */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-foreground">Negócios</h1>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center max-w-md px-4">
            <div className="h-16 w-16 rounded-full bg-[#46347F]/10 flex items-center justify-center mx-auto mb-4">
              <Kanban className="h-8 w-8 text-[#46347F]" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Pipeline não configurado
            </h2>
            <p className="text-muted-foreground mb-6">
              Você precisa criar estágios para o seu pipeline de vendas. 
              Entre em contato com o administrador do sistema.
            </p>
            <div className="flex gap-2 justify-center">
              <Button 
                variant="outline" 
                onClick={fetchStages}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Top Toolbar */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-foreground">Negócios</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar negócios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9 h-9"
            />
          </div>

          <Button size="icon" variant="ghost" className="h-9 w-9" onClick={fetchDeals}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex h-12 items-center justify-between border-b border-border px-4 bg-muted/30">
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center rounded-md border border-border bg-card p-0.5">
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "h-7 px-2 gap-1.5",
                viewMode === "board" ? "bg-white shadow-sm" : "text-muted-foreground"
              )}
              onClick={() => setViewMode("board")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Board
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "h-7 px-2 gap-1.5",
                viewMode === "list" ? "bg-white shadow-sm" : "text-muted-foreground"
              )}
              onClick={() => setViewMode("list")}
            >
              <List className="h-3.5 w-3.5" />
              Lista
            </Button>
          </div>

          {/* Add Deal Button */}
          <Button 
            size="sm" 
            className="h-8 gap-1.5 bg-[#46347F] hover:bg-[#7b79c4] text-white"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="h-4 w-4" />
            Negócio
          </Button>
        </div>

        {/* Filters Only */}
        <div className="flex items-center gap-2">
          {/* Summary */}
          <div className="text-sm text-muted-foreground mr-4">
            <span className="font-semibold text-foreground">{formatCurrency(totalValue)}</span>
            <span className="mx-2">·</span>
            <span>{openDealsCount} negócios abertos</span>
          </div>

          {/* Filter Dropdown */}
          <FilterDropdown filtros={filtros} onChange={setFiltros} />
        </div>
      </div>

      {/* Content */}
      {viewMode === "board" ? (
        <div className="flex flex-1 gap-4 overflow-x-auto overflow-y-hidden p-4">
          {stages.map((stage) => (
            <PipelineColumn
              key={stage.id}
              stage={stage}
              deals={filteredDeals.filter((d) => d.stageId === stage.id)}
              draggedDealId={draggedDealId}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDealClick={handleDealClick}
              selectedDealId={selectedDealId}
            />
          ))}
        </div>
      ) : (
        <DealListView 
          deals={filteredDeals} 
          stages={stages}
          onDealClick={handleDealClick}
          selectedDealId={selectedDealId}
          draggedDealId={draggedDealId}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      )}

      {/* Add Deal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[400px] rounded-xl border border-border bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-4">Novo Negócio</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Funcionalidade em desenvolvimento. Use a API para criar deals.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Deal Detail Modal */}
      {selectedDeal && (
        <DealDetailModal
          deal={{
            ...selectedDeal,
            value: Number(selectedDeal.amount),
            contact: selectedDeal.contact ? {
              ...selectedDeal.contact,
              avatar: selectedDeal.contact.avatarUrl,
            } : undefined,
            stage: selectedDeal.stage || undefined,
            expectedCloseDate: selectedDeal.expectedCloseDate?.toISOString() || null,
            actualCloseDate: selectedDeal.actualCloseDate?.toISOString() || null,
            createdAt: selectedDeal.createdAt.toISOString(),
            updatedAt: selectedDeal.updatedAt.toISOString(),
          }}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          activities={activities.map(a => ({
            ...a,
            description: a.content || a.title,
            createdAt: a.createdAt.toISOString(),
          }))}
          onAddNote={handleAddNote}
          onUpdateDeal={async () => {}}
        />
      )}
    </div>
  )
}
