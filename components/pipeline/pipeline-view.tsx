"use client"

import { useState, useMemo } from "react"
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
  GripVertical
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
type ViewMode = "board" | "list"
type Prioridade = "alta" | "media" | "baixa"

interface Deal {
  id: number
  titulo: string
  empresa: string
  valor: number
  avatar: string
  responsavel: string
  email: string
  telefone: string
  prioridade: Prioridade
  dias: number
  stage: string
  status: DealStatus
  contactId?: string
  criadoEm: string
}

interface Filtros {
  prioridade: Prioridade[]
  status: DealStatus[]
  valorMin: number | null
  valorMax: number | null
}

// ─── Theme Config ────────────────────────────────────────────────────────────

const STAGES: PipelineStageConfig[] = [
  { key: "novo", label: "Novo Lead", color: "#9795e4", bgColor: "bg-[#f8f7fc]" },
  { key: "qualificado", label: "Qualificado", color: "#7b79c4", bgColor: "bg-[#f5f4fa]" },
  { key: "proposta", label: "Proposta", color: "#6b69c9", bgColor: "bg-[#f2f1f8]" },
  { key: "fechamento", label: "Fechamento", color: "#5b59be", bgColor: "bg-[#efeef6]" },
]

const RESPONSAVEIS = ["Ana Silva", "Bruno Costa", "Carol Mendes", "Diego Lima", "Elisa Souza"]
const EMPRESAS = ["TechCorp", "DataFlow", "CloudSync", "MegaCorp", "StartupHub", "VendasExpress", "GrowthLab", "FinTrack"]

function gerarDealsMock(): Deal[] {
  const deals: Deal[] = []
  const stages = ["novo", "qualificado", "proposta", "fechamento"]
  
  for (let i = 1; i <= 20; i++) {
    const empresa = EMPRESAS[Math.floor(Math.random() * EMPRESAS.length)]
    const responsavel = RESPONSAVEIS[Math.floor(Math.random() * RESPONSAVEIS.length)]
    const stage = stages[Math.floor(Math.random() * stages.length)]
    const valor = Math.floor(Math.random() * 50000) + 5000
    const dias = Math.floor(Math.random() * 30)
    
    let status: DealStatus = "open"
    if (stage === "fechamento") {
      const rand = Math.random()
      if (rand > 0.7) status = "won"
      else if (rand > 0.4) status = "lost"
    }
    
    deals.push({
      id: i,
      titulo: `Negócio ${empresa} ${String(i).padStart(2, '0')}`,
      empresa: `${empresa} LTDA`,
      valor,
      avatar: empresa.slice(0, 2).toUpperCase(),
      responsavel,
      email: `contato@${empresa.toLowerCase()}.com.br`,
      telefone: `+55 11 9${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      prioridade: Math.random() > 0.6 ? "alta" : Math.random() > 0.3 ? "media" : "baixa",
      dias,
      stage,
      status,
      criadoEm: new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString(),
    })
  }
  return deals
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(val: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(val)
}

function findContactByDeal(deal: Deal): Contact | undefined {
  if (deal.contactId) {
    return MOCK_CONTACTS.find(c => c.id === deal.contactId)
  }
  return {
    id: `deal-contact-${deal.id}`,
    nome: deal.responsavel.split(' ')[0],
    sobrenome: deal.responsavel.split(' ').slice(1).join(' ') || "Sobrenome",
    email: deal.email,
    telefone: deal.telefone,
    cidade: "São Paulo",
    estado: "SP",
    cargo: "Diretor Comercial",
    empresa: deal.empresa,
    tags: ["pipeline"],
    leadScore: Math.floor(Math.random() * 100),
    status: "ativo",
    origem: "Pipeline",
    criadoEm: deal.criadoEm,
    atualizadoEm: new Date().toISOString(),
    atualizadoPor: "Sistema",
    avatar: deal.avatar,
    avatarBg: "#9795e4",
  } as Contact
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

      {/* Status Badge */}
      {(isWon || isLost) && (
        <div className="mb-2">
          <span className={cn(
            "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
            isWon && "bg-emerald-500 text-white",
            isLost && "bg-red-500 text-white"
          )}>
            {isWon ? (
              <><CheckCircle2 className="h-3 w-3" /> Ganho</>
            ) : (
              <><XCircle className="h-3 w-3" /> Perdido</>
            )}
          </span>
        </div>
      )}

      {/* Footer */}
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
        
        {deal.dias > 7 && deal.status === "open" && (
          <AlertCircle className="h-4 w-4 text-amber-500" />
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
      {/* Header */}
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
          {formatCurrency(totalValue)} · {openDeals.length} negócios
        </div>
      </div>

      {/* Cards */}
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

// ─── List View ───────────────────────────────────────────────────────────────

interface DealListViewProps {
  deals: Deal[]
  onDealClick: (deal: Deal) => void
  selectedDealId: number | null
  draggedDealId: number | null
  onDragStart: (e: React.DragEvent, dealId: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, stageKey: string) => void
}

function DealListView({ 
  deals, 
  onDealClick, 
  selectedDealId,
  draggedDealId,
  onDragStart,
  onDragOver,
  onDrop
}: DealListViewProps) {
  // Agrupa deals por estágio
  const dealsByStage = STAGES.map(stage => ({
    stage,
    deals: deals.filter(d => d.stage === stage.key)
  }))

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="space-y-4">
        {dealsByStage.map(({ stage, deals: stageDeals }) => {
          const totalValue = stageDeals.reduce((sum, d) => sum + d.valor, 0)
          const openDeals = stageDeals.filter(d => d.status === "open")

          return (
            <div 
              key={stage.key}
              className="rounded-lg border border-border bg-white overflow-hidden"
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, stage.key)}
            >
              {/* Stage Header */}
              <div 
                className="flex items-center justify-between px-4 py-3 border-b border-border"
                style={{ backgroundColor: `${stage.color}15` }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="font-semibold text-foreground">{stage.label}</span>
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
                        selectedDealId === deal.id && "bg-[#9795e4]/5",
                        deal.status === "won" && "bg-emerald-50/30",
                        deal.status === "lost" && "bg-red-50/30",
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
                          backgroundColor: deal.prioridade === "alta" ? "#f87171" : 
                                          deal.prioridade === "media" ? "#fbbf24" : "#9ca3af"
                        }}
                      >
                        {deal.avatar}
                      </div>

                      {/* Title & Responsavel */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{deal.titulo}</span>
                          {deal.status === "won" && (
                            <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500 text-white">
                              <CheckCircle2 className="h-3 w-3" /> Ganho
                            </span>
                          )}
                          {deal.status === "lost" && (
                            <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-red-500 text-white">
                              <XCircle className="h-3 w-3" /> Perdido
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{deal.responsavel}</span>
                      </div>

                      {/* Empresa */}
                      <div className="w-32 shrink-0 text-sm text-muted-foreground truncate">
                        {deal.empresa}
                      </div>

                      {/* Valor */}
                      <div className="w-24 shrink-0 text-sm font-semibold text-foreground text-right">
                        {formatCurrency(deal.valor)}
                      </div>

                      {/* Dias */}
                      <div className="w-16 shrink-0 text-xs text-muted-foreground text-center">
                        {deal.dias}d
                      </div>

                      {/* Prioridade */}
                      <div className="w-20 shrink-0 flex justify-center">
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-medium",
                          deal.prioridade === "alta" ? "bg-red-100 text-red-600" : 
                          deal.prioridade === "media" ? "bg-amber-100 text-amber-600" : 
                          "bg-gray-100 text-gray-600"
                        )}>
                          {deal.prioridade}
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
              <button className="flex w-full items-center justify-center gap-1.5 border-t border-border py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/30 hover:text-[#9795e4]">
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
          temFiltros && "border-[#9795e4] text-[#9795e4]"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Filter className="h-3.5 w-3.5" />
        Filtros
        {temFiltros && (
          <span className="ml-1 rounded-full bg-[#9795e4] px-1.5 py-0.5 text-[10px] text-white">
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
                        ? "border-[#9795e4] bg-[#9795e4] text-white" 
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
                  { key: "open", label: "Em aberto" },
                  { key: "won", label: "Ganho" },
                  { key: "lost", label: "Perdido" }
                ] as { key: DealStatus; label: string }[]).map((s) => (
                  <button
                    key={s.key}
                    onClick={() => toggleStatus(s.key)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <span className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border",
                      filtros.status.includes(s.key) 
                        ? "border-[#9795e4] bg-[#9795e4] text-white" 
                        : "border-border"
                    )}>
                      {filtros.status.includes(s.key) && <Check className="h-3 w-3" />}
                    </span>
                    <span className={cn(
                      s.key === "won" && "text-emerald-600",
                      s.key === "lost" && "text-red-600"
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
                className="h-7 bg-[#9795e4] hover:bg-[#7b79c4] text-white text-xs"
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

export function PipelineView() {
  const [deals, setDeals] = useState<Deal[]>(gerarDealsMock())
  const [selectedDealId, setSelectedDealId] = useState<number | null>(null)
  const [draggedDealId, setDraggedDealId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("board")
  const [showAddModal, setShowAddModal] = useState(false)
  const [filtros, setFiltros] = useState<Filtros>({
    prioridade: [],
    status: [],
    valorMin: null,
    valorMax: null
  })

  const filteredDeals = useMemo(() => {
    let result = deals
    
    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (d) =>
          d.titulo.toLowerCase().includes(query) ||
          d.empresa.toLowerCase().includes(query) ||
          d.responsavel.toLowerCase().includes(query)
      )
    }
    
    // Filtros de prioridade
    if (filtros.prioridade.length > 0) {
      result = result.filter(d => filtros.prioridade.includes(d.prioridade))
    }
    
    // Filtros de status
    if (filtros.status.length > 0) {
      result = result.filter(d => filtros.status.includes(d.status))
    }
    
    // Filtro de valor
    if (filtros.valorMin !== null) {
      result = result.filter(d => d.valor >= filtros.valorMin!)
    }
    if (filtros.valorMax !== null) {
      result = result.filter(d => d.valor <= filtros.valorMax!)
    }
    
    return result
  }, [deals, searchQuery, filtros])

  const selectedDeal = useMemo(
    () => deals.find((d) => d.id === selectedDealId) || null,
    [deals, selectedDealId]
  )

  const selectedContact = useMemo(() => {
    if (!selectedDeal) return undefined
    return findContactByDeal(selectedDeal)
  }, [selectedDeal])

  // Totals
  const totalValue = deals.filter(d => d.status === "open").reduce((sum, d) => sum + d.valor, 0)
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
          return {
            ...deal,
            stage: stageKey,
            status: "open" as DealStatus,
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

  const handleAddDeal = () => {
    const empresa = EMPRESAS[Math.floor(Math.random() * EMPRESAS.length)]
    const responsavel = RESPONSAVEIS[Math.floor(Math.random() * RESPONSAVEIS.length)]
    const novoDeal: Deal = {
      id: Date.now(),
      titulo: `Novo Negócio ${empresa}`,
      empresa: `${empresa} LTDA`,
      valor: Math.floor(Math.random() * 30000) + 5000,
      avatar: empresa.slice(0, 2).toUpperCase(),
      responsavel,
      email: `contato@${empresa.toLowerCase()}.com.br`,
      telefone: `+55 11 9${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      prioridade: "media",
      dias: 0,
      stage: "novo",
      status: "open",
      criadoEm: new Date().toISOString(),
    }
    setDeals([novoDeal, ...deals])
    setShowAddModal(false)
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

          <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => setDeals(gerarDealsMock())}>
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
            className="h-8 gap-1.5 bg-[#9795e4] hover:bg-[#7b79c4] text-white"
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
      ) : (
        <DealListView 
          deals={filteredDeals} 
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
              Deseja adicionar um novo negócio ao pipeline?
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancelar
              </Button>
              <Button 
                className="bg-[#9795e4] hover:bg-[#7b79c4] text-white"
                onClick={handleAddDeal}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Detail Panel */}
      <ContactDetailPanel 
        isOpen={isPanelOpen} 
        onClose={handleClosePanel}
        contact={selectedContact}
      />
    </div>
  )
}
