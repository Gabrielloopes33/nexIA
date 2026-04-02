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
  Kanban,
  X,
  Loader2,
  DollarSign,
  Calendar,
  User,
  Tag,
  Pencil
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { DealCard } from "./DealCard"
import { DealDetailModal } from "./DealDetailModal"
import { PipelineStage, Deal, DealActivity, DealPriority, DealStatus } from "@prisma/client"
import { useProductSelection } from "@/hooks/use-product-selection"
import { ProductSwitcher } from "@/components/products/product-switcher"
import { PipelineSwitcher } from "@/components/products/pipeline-switcher"

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
  draggedOverStageId: string | null
  onDragStart: (e: React.DragEvent, dealId: string) => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent, stageId: string) => void
  onDragLeave: (e: React.DragEvent, stageId: string) => void
  onDrop: (e: React.DragEvent, stageId: string) => void
  onDealClick: (deal: DealWithRelations) => void
  selectedDealId: string | null
  onAddDeal?: (stageId: string) => void
  onEditDeal?: (deal: DealWithRelations) => void
  onDeleteDeal?: (deal: DealWithRelations) => void
}

function PipelineColumn({
  stage,
  deals,
  draggedDealId,
  draggedOverStageId,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onDealClick,
  selectedDealId,
  onAddDeal,
  onEditDeal,
  onDeleteDeal,
}: PipelineColumnProps) {
  const totalValue = deals.reduce((sum, d) => sum + Number(d.value ?? d.amount ?? 0), 0)
  const openDeals = deals.filter(d => d.status === "OPEN")

  const isDraggedOver = draggedOverStageId === stage.id

  return (
    <div
      className={cn(
        "flex w-[280px] flex-shrink-0 flex-col rounded-xl transition-all duration-200",
        isDraggedOver && "bg-[#46347F]/5 scale-[1.02]"
      )}
      onDragOver={(e) => onDragOver(e, stage.id)}
      onDragLeave={(e) => onDragLeave(e, stage.id)}
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
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1" style={{ minHeight: 0 }}>
        {deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={{
              id: deal.id,
              title: deal.title,
              value: Number(deal.value ?? deal.amount ?? 0),
              currency: deal.currency,
              priority: deal.priority,
              leadScore: deal.leadScore,
              expectedCloseDate: deal.expectedCloseDate 
                ? (typeof deal.expectedCloseDate === 'string' 
                    ? deal.expectedCloseDate 
                    : deal.expectedCloseDate.toISOString())
                : null,
              contact: deal.contact,
              activitiesCount: deal.activitiesCount,
              updatedAt: typeof deal.updatedAt === 'string' ? deal.updatedAt : deal.updatedAt.toISOString(),
            }}
            draggable
            onDragStart={(e) => onDragStart(e, deal.id)}
            onDragEnd={onDragEnd}
            isDragging={draggedDealId === deal.id}
            onClick={() => onDealClick(deal)}
            onEdit={(e) => {
              e.stopPropagation()
              onEditDeal?.(deal)
            }}
            onDelete={(e) => {
              e.stopPropagation()
              onDeleteDeal?.(deal)
            }}
          />
        ))}
      </div>

      {/* Add Button */}
      <button 
        onClick={() => onAddDeal?.(stage.id)}
        className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground transition-colors hover:border-[#46347F]/40 hover:bg-[#46347F]/5 hover:text-[#46347F]"
      >
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
  onAddDeal?: (stageId: string) => void
}

function DealListView({ 
  deals, 
  stages,
  onDealClick, 
  selectedDealId,
  draggedDealId,
  onDragStart,
  onDragOver,
  onDrop,
  onAddDeal
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
          const totalValue = stageDeals.reduce((sum, d) => sum + Number(d.value ?? d.amount ?? 0), 0)
          const openDeals = stageDeals.filter(d => d.status === "OPEN")

          return (
            <div 
              key={stage.id}
              className="rounded-lg border border-border bg-white overflow-hidden"
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDragOver(e)
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDrop(e, stage.id)
              }}
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
                        {formatCurrency(Number(deal.value ?? deal.amount ?? 0))}
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
              <button 
                onClick={() => onAddDeal?.(stage.id)}
                className="flex w-full items-center justify-center gap-1.5 border-t border-border py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/30 hover:text-[#46347F]"
              >
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

// ─── Add Deal Modal Component ────────────────────────────────────────────────

interface AddDealModalProps {
  stages: PipelineStage[]
  initialStageId?: string
  onClose: () => void
  onSuccess: () => void
}

function AddDealModal({ stages, initialStageId, onClose, onSuccess }: AddDealModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contacts, setContacts] = useState<Array<{ id: string; name: string; phone: string }>>([])
  const [isLoadingContacts, setIsLoadingContacts] = useState(false)
  const [searchContact, setSearchContact] = useState("")
  const [showContactDropdown, setShowContactDropdown] = useState(false)
  
  const [formData, setFormData] = useState({
    title: "",
    contactId: "",
    contactName: "",
    stageId: initialStageId || stages[0]?.id || "",
    amount: "",
    priority: "MEDIUM" as "HIGH" | "MEDIUM" | "LOW",
    expectedCloseDate: "",
    description: "",
  })

  // Buscar contatos
  useEffect(() => {
    const fetchContacts = async () => {
      setIsLoadingContacts(true)
      try {
        const response = await fetch("/api/contacts?limit=100")
        const data = await response.json()
        if (data.success) {
          setContacts(data.data.map((c: any) => ({
            id: c.id,
            name: c.name || c.phone,
            phone: c.phone
          })))
        }
      } catch (error) {
        console.error("Failed to fetch contacts:", error)
      } finally {
        setIsLoadingContacts(false)
      }
    }
    fetchContacts()
  }, [])

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchContact.toLowerCase()) ||
    c.phone.includes(searchContact)
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.contactId) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/pipeline/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          contactId: formData.contactId,
          stageId: formData.stageId,
          amount: Number(formData.amount) || 0,
          priority: formData.priority,
          expectedCloseDate: formData.expectedCloseDate || null,
          description: formData.description || null,
        }),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const error = await response.json()
        alert(error.error || "Erro ao criar negócio")
      }
    } catch (error) {
      console.error("Failed to create deal:", error)
      alert("Erro ao criar negócio")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">Novo Negócio</h3>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Título <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Ex: Proposta Comercial"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          {/* Contato */}
          <div className="space-y-2 relative">
            <Label>
              Contato <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contato..."
                value={formData.contactName || searchContact}
                onChange={(e) => {
                  setSearchContact(e.target.value)
                  setShowContactDropdown(true)
                  if (!e.target.value) {
                    setFormData({ ...formData, contactId: "", contactName: "" })
                  }
                }}
                onFocus={() => setShowContactDropdown(true)}
                className="pl-9"
              />
              {formData.contactId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => {
                    setFormData({ ...formData, contactId: "", contactName: "" })
                    setSearchContact("")
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {/* Dropdown de contatos */}
            {showContactDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowContactDropdown(false)} 
                />
                <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-auto rounded-lg border border-border bg-white shadow-lg">
                  {isLoadingContacts ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : filteredContacts.length > 0 ? (
                    filteredContacts.map((contact) => (
                      <button
                        key={contact.id}
                        type="button"
                        className="flex w-full items-center gap-3 px-3 py-2 hover:bg-muted text-left"
                        onClick={() => {
                          setFormData({ 
                            ...formData, 
                            contactId: contact.id, 
                            contactName: contact.name 
                          })
                          setShowContactDropdown(false)
                          setSearchContact("")
                        }}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#46347F]/10 text-[#46347F] text-xs font-bold">
                          {contact.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{contact.name}</p>
                          <p className="text-xs text-muted-foreground">{contact.phone}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Nenhum contato encontrado
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Etapa */}
          <div className="space-y-2">
            <Label htmlFor="stage">Etapa</Label>
            <select
              id="stage"
              value={formData.stageId}
              onChange={(e) => setFormData({ ...formData, stageId: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                placeholder="0,00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="pl-9"
              />
            </div>
          </div>

          {/* Prioridade */}
          <div className="space-y-2">
            <Label>Prioridade</Label>
            <div className="flex gap-2">
              {[
                { value: "LOW", label: "Baixa", color: "bg-gray-100 text-gray-700 border-gray-200" },
                { value: "MEDIUM", label: "Média", color: "bg-amber-100 text-amber-700 border-amber-200" },
                { value: "HIGH", label: "Alta", color: "bg-red-100 text-red-700 border-red-200" },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: p.value as any })}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    formData.priority === p.value
                      ? p.color
                      : "border-border bg-white text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Data de fechamento esperada */}
          <div className="space-y-2">
            <Label htmlFor="expectedCloseDate">Fechamento esperado</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
              <Input
                id="expectedCloseDate"
                type="date"
                value={formData.expectedCloseDate}
                onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                className="pl-10 h-11 rounded-xl border-border/60 bg-background/50 backdrop-blur-sm transition-all focus:border-[#46347F] focus:ring-2 focus:ring-[#46347F]/20 hover:border-[#46347F]/30 cursor-pointer"
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <textarea
              id="description"
              placeholder="Detalhes do negócio..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.title.trim() || !formData.contactId}
              className="bg-[#46347F] hover:bg-[#7b79c4] text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Negócio
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Edit Deal Modal Component ───────────────────────────────────────────────

interface EditDealModalProps {
  deal: DealWithRelations
  stages: PipelineStage[]
  onClose: () => void
  onSuccess: () => void
}

function EditDealModal({ deal, stages, onClose, onSuccess }: EditDealModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contacts, setContacts] = useState<Array<{ id: string; name: string; phone: string }>>([])
  const [isLoadingContacts, setIsLoadingContacts] = useState(false)
  
  const [formData, setFormData] = useState({
    title: deal.title,
    contactId: deal.contactId,
    contactName: deal.contact?.name || "",
    stageId: deal.stageId,
    amount: String(deal.value ?? deal.amount ?? 0),
    priority: deal.priority as "HIGH" | "MEDIUM" | "LOW",
    expectedCloseDate: deal.expectedCloseDate 
      ? (typeof deal.expectedCloseDate === 'string' 
          ? deal.expectedCloseDate.split('T')[0] 
          : deal.expectedCloseDate.toISOString().split('T')[0])
      : "",
    description: deal.description || "",
  })

  // Buscar contatos
  useEffect(() => {
    async function fetchContacts() {
      setIsLoadingContacts(true)
      try {
        const response = await fetch("/api/contacts?limit=100")
        const data = await response.json()
        if (data.success) {
          setContacts(data.data)
        }
      } catch (error) {
        console.error("Failed to fetch contacts:", error)
      } finally {
        setIsLoadingContacts(false)
      }
    }
    fetchContacts()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/pipeline/deals/${deal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          contactId: formData.contactId,
          stageId: formData.stageId,
          value: Number(formData.amount) || 0,
          priority: formData.priority,
          expectedCloseDate: formData.expectedCloseDate || null,
          description: formData.description || null,
        }),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const error = await response.json()
        alert(error.error || "Erro ao atualizar negócio")
      }
    } catch (error) {
      console.error("Failed to update deal:", error)
      alert("Erro ao atualizar negócio")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">Editar Negócio</h3>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">Título do negócio</Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Implementação CRM"
              required
            />
          </div>

          {/* Contato */}
          <div className="space-y-2">
            <Label>Contato</Label>
            <select
              value={formData.contactId}
              onChange={(e) => {
                const contact = contacts.find(c => c.id === e.target.value)
                setFormData({ ...formData, contactId: e.target.value, contactName: contact?.name || "" })
              }}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              required
            >
              <option value="">Selecione um contato</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name} {contact.phone && `(${contact.phone})`}
                </option>
              ))}
            </select>
            {isLoadingContacts && (
              <p className="text-xs text-muted-foreground">Carregando contatos...</p>
            )}
          </div>

          {/* Etapa */}
          <div className="space-y-2">
            <Label>Etapa do funil</Label>
            <select
              value={formData.stageId}
              onChange={(e) => setFormData({ ...formData, stageId: e.target.value })}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              required
            >
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
          </div>

          {/* Valor e Prioridade */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Valor (R$)</Label>
              <Input
                id="edit-amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="15000"
              />
            </div>

            <div className="space-y-2">
              <Label>Prioridade</Label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as "HIGH" | "MEDIUM" | "LOW" })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="HIGH">Alta</option>
                <option value="MEDIUM">Média</option>
                <option value="LOW">Baixa</option>
              </select>
            </div>
          </div>

          {/* Data de fechamento esperada */}
          <div className="space-y-2">
            <Label htmlFor="edit-expectedCloseDate">Fechamento esperado</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
              <Input
                id="edit-expectedCloseDate"
                type="date"
                value={formData.expectedCloseDate}
                onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                className="pl-10 h-11 rounded-xl border-border/60 bg-background/50 backdrop-blur-sm transition-all focus:border-[#46347F] focus:ring-2 focus:ring-[#46347F]/20 hover:border-[#46347F]/30 cursor-pointer"
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">Descrição</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Observações sobre o negócio..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.title.trim() || !formData.contactId}
              className="bg-[#46347F] hover:bg-[#7b79c4] text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface PipelineViewRealProps {
  onNewPipeline?: () => void
}

export function PipelineViewReal({ onNewPipeline }: PipelineViewRealProps) {
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
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingDeal, setEditingDeal] = useState<DealWithRelations | null>(null)
  const [draggedOverStageId, setDraggedOverStageId] = useState<string | null>(null)
  const [selectedStageId, setSelectedStageId] = useState<string>("")
  const [filtros, setFiltros] = useState<Filtros>({
    prioridade: [],
    status: [],
    valorMin: null,
    valorMax: null
  })

  const { productId, pipelineId } = useProductSelection()

  // Fetch data on mount and when product/pipeline changes
  useEffect(() => {
    fetchStages()
    fetchDeals()
  }, [productId, pipelineId])

  const fetchStages = async () => {
    try {
      const params = new URLSearchParams()
      if (productId) params.set("productId", productId)
      if (pipelineId) params.set("pipelineId", pipelineId)
      const url = `/api/pipeline/stages${params.toString() ? "?" + params.toString() : ""}`
      const response = await fetch(url)
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
      const params = new URLSearchParams()
      if (productId) params.set("productId", productId)
      if (pipelineId) params.set("pipelineId", pipelineId)
      const url = `/api/pipeline/deals${params.toString() ? "?" + params.toString() : ""}`
      const response = await fetch(url)
      const data = await response.json()
      if (data.success) {
        // Converter valores Decimal para number
        const processedDeals = data.data.map((deal: any) => ({
          ...deal,
          value: Number(deal.value ?? deal.amount ?? 0),
        }))
        console.log('[Pipeline] Deals carregados:', processedDeals.map((d: any) => ({ id: d.id, title: d.title, value: d.value })))
        setDeals(processedDeals)
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
      result = result.filter(d => Number(d.value ?? d.amount ?? 0) >= filtros.valorMin!)
    }
    if (filtros.valorMax !== null) {
      result = result.filter(d => Number(d.value ?? d.amount ?? 0) <= filtros.valorMax!)
    }
    
    return result
  }, [deals, searchQuery, filtros])

  const selectedDeal = useMemo(
    () => deals.find((d) => d.id === selectedDealId) || null,
    [deals, selectedDealId]
  )

  // Totals
  const totalValue = deals.filter(d => d.status === "OPEN").reduce((sum, d) => sum + Number(d.value ?? d.amount ?? 0), 0)
  const openDealsCount = deals.filter(d => d.status === "OPEN").length

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    setDraggedDealId(dealId)
    e.dataTransfer.effectAllowed = "move"
    // Adicionar dados para o drag
    e.dataTransfer.setData("text/plain", dealId)
  }

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = "move"
    setDraggedOverStageId(stageId)
  }

  const handleDragLeave = (e: React.DragEvent, stageId: string) => {
    // Só remove se realmente saiu da coluna (não entrou em um elemento filho)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDraggedOverStageId(null)
    }
  }

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggedOverStageId(null)
    
    const dealId = e.dataTransfer.getData("text/plain") || draggedDealId
    if (!dealId) {
      setDraggedDealId(null)
      return
    }

    // Encontrar o deal atual para verificar se mudou de estágio
    const currentDeal = deals.find(d => d.id === dealId)
    if (!currentDeal || currentDeal.stageId === stageId) {
      setDraggedDealId(null)
      return
    }

    // Optimistic update
    setDeals((prev) =>
      prev.map((deal) => {
        if (deal.id === dealId) {
          return { ...deal, stageId }
        }
        return deal
      })
    )

    // Persist to backend
    handleMoveDeal(dealId, stageId)
    setDraggedDealId(null)
  }

  const handleDragEnd = () => {
    setDraggedDealId(null)
    setDraggedOverStageId(null)
  }

  const handleDealClick = (deal: DealWithRelations) => {
    setSelectedDealId(deal.id)
    fetchActivities(deal.id)
    setIsModalOpen(true)
  }

  const handleEditDeal = (deal: DealWithRelations) => {
    setEditingDeal(deal)
    setShowEditModal(true)
  }

  const handleDeleteDeal = async (deal: DealWithRelations) => {
    if (!confirm(`Tem certeza que deseja excluir o negócio "${deal.title}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/pipeline/deals/${deal.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchDeals()
      } else {
        const error = await response.json()
        alert(error.error || "Erro ao excluir negócio")
      }
    } catch (error) {
      console.error("Failed to delete deal:", error)
      alert("Erro ao excluir negócio")
    }
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
              Você precisa criar um pipeline de vendas para começar a gerenciar seus negócios.
              Escolha um modelo pronto ou crie do zero.
            </p>
            <div className="flex gap-3 justify-center">
              {onNewPipeline && (
                <Button 
                  className="gap-2 bg-[#46347F] hover:bg-[#7b79c4] text-white"
                  onClick={onNewPipeline}
                >
                  <Plus className="h-4 w-4" />
                  Criar Pipeline
                </Button>
              )}
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
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-foreground">Negócios</h1>
          <div className="h-4 w-px bg-border" />
          <ProductSwitcher />
          <PipelineSwitcher />
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
            onClick={() => {
              setSelectedStageId("")
              setShowAddModal(true)
            }}
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
              draggedOverStageId={draggedOverStageId}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDealClick={handleDealClick}
              selectedDealId={selectedDealId}
              onAddDeal={(stageId) => {
                setSelectedStageId(stageId)
                setShowAddModal(true)
              }}
              onEditDeal={handleEditDeal}
              onDeleteDeal={handleDeleteDeal}
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
          onAddDeal={(stageId) => {
            setSelectedStageId(stageId)
            setShowAddModal(true)
          }}
        />
      )}

      {/* Add Deal Modal */}
      {showAddModal && (
        <AddDealModal
          stages={stages}
          initialStageId={selectedStageId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchDeals()
          }}
        />
      )}

      {/* Edit Deal Modal */}
      {showEditModal && editingDeal && (
        <EditDealModal
          deal={editingDeal}
          stages={stages}
          onClose={() => {
            setShowEditModal(false)
            setEditingDeal(null)
          }}
          onSuccess={() => {
            setShowEditModal(false)
            setEditingDeal(null)
            fetchDeals()
          }}
        />
      )}

      {/* Deal Detail Modal */}
      {selectedDeal && (
        <DealDetailModal
          deal={{
            ...selectedDeal,
            value: Number(selectedDeal.value ?? selectedDeal.amount ?? 0),
            contact: selectedDeal.contact ? {
              ...selectedDeal.contact,
              avatar: selectedDeal.contact.avatarUrl,
            } : undefined,
            stage: selectedDeal.stage || undefined,
            expectedCloseDate: selectedDeal.expectedCloseDate 
              ? (typeof selectedDeal.expectedCloseDate === 'string' 
                  ? selectedDeal.expectedCloseDate 
                  : selectedDeal.expectedCloseDate.toISOString())
              : null,
            actualCloseDate: selectedDeal.actualCloseDate 
              ? (typeof selectedDeal.actualCloseDate === 'string' 
                  ? selectedDeal.actualCloseDate 
                  : selectedDeal.actualCloseDate.toISOString())
              : null,
            createdAt: typeof selectedDeal.createdAt === 'string' ? selectedDeal.createdAt : selectedDeal.createdAt.toISOString(),
            updatedAt: typeof selectedDeal.updatedAt === 'string' ? selectedDeal.updatedAt : selectedDeal.updatedAt.toISOString(),
          }}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          activities={activities.map(a => ({
            ...a,
            description: a.content || a.title,
            createdAt: typeof a.createdAt === 'string' ? a.createdAt : a.createdAt.toISOString(),
          }))}
          onAddNote={handleAddNote}
          onUpdateDeal={async () => {}}
        />
      )}
    </div>
  )
}
