"use client"

import { useState, useRef, useEffect } from "react"
import {
  Plus,
  DollarSign,
  TrendingUp,
  GripVertical,
  ArrowRight,
  ChevronDown,
  Pencil,
  Trash2,
  Settings2,
  Layers,
  Check,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

interface PipelineStageConfig {
  key: string
  label: string
  color: string
  headerBg: string
  dot: string
}

interface Pipeline {
  id: string
  label: string
  stages: PipelineStageConfig[]
  deals: Deal[]
}

interface Deal {
  id: number
  titulo: string
  empresa: string
  valor: number
  avatar: string
  prioridade: "alta" | "media" | "baixa"
  dias: number
  stage: string
}

// ─── Data ────────────────────────────────────────────────────────────────────

const INITIAL_PIPELINES: Pipeline[] = [
  {
    id: "principal",
    label: "Pipeline Principal",
    stages: [
      { key: "prospeccao",   label: "Prospecao",    color: "text-sky-600",     headerBg: "bg-sky-50 border-sky-200",         dot: "bg-sky-400"     },
      { key: "qualificacao", label: "Qualificacao", color: "text-violet-600",  headerBg: "bg-violet-50 border-violet-200",   dot: "bg-violet-400"  },
      { key: "proposta",     label: "Proposta",     color: "text-amber-600",   headerBg: "bg-amber-50 border-amber-200",     dot: "bg-amber-400"   },
      { key: "negociacao",   label: "Negociacao",   color: "text-orange-600",  headerBg: "bg-orange-50 border-orange-200",   dot: "bg-orange-400"  },
      { key: "fechamento",   label: "Fechamento",   color: "text-emerald-600", headerBg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-400" },
    ],
    deals: [
      { id: 1,  titulo: "Plano Enterprise",    empresa: "TechCorp Inc.",    valor: 48000,  avatar: "SJ", prioridade: "alta",  dias: 3,  stage: "prospeccao"   },
      { id: 2,  titulo: "Automacao de Vendas", empresa: "DataFlow Systems", valor: 12500,  avatar: "MC", prioridade: "media", dias: 7,  stage: "prospeccao"   },
      { id: 3,  titulo: "Integracao API",      empresa: "CloudSync Ltd",    valor: 8900,   avatar: "EW", prioridade: "baixa", dias: 12, stage: "qualificacao" },
      { id: 4,  titulo: "CRM Customizado",     empresa: "AI Solutions",     valor: 31000,  avatar: "JA", prioridade: "alta",  dias: 2,  stage: "qualificacao" },
      { id: 5,  titulo: "Suite Completa",      empresa: "DevTools Pro",     valor: 22000,  avatar: "LM", prioridade: "alta",  dias: 5,  stage: "proposta"     },
      { id: 6,  titulo: "Licenca Anual",       empresa: "FinTrack SA",      valor: 15600,  avatar: "RS", prioridade: "media", dias: 9,  stage: "proposta"     },
      { id: 7,  titulo: "Expansao de Conta",   empresa: "GrowthLab",        valor: 9200,   avatar: "AC", prioridade: "media", dias: 14, stage: "negociacao"   },
      { id: 8,  titulo: "Contrato Trienal",    empresa: "Startup Hub",      valor: 67000,  avatar: "PA", prioridade: "alta",  dias: 1,  stage: "negociacao"   },
      { id: 9,  titulo: "Renovacao Premium",   empresa: "MegaCorp",         valor: 41000,  avatar: "BC", prioridade: "alta",  dias: 0,  stage: "fechamento"   },
      { id: 10, titulo: "Upsell Analytics",    empresa: "RetailMax",        valor: 7800,   avatar: "KR", prioridade: "baixa", dias: 4,  stage: "fechamento"   },
    ],
  },
  {
    id: "sdr",
    label: "Funil SDR",
    stages: [
      { key: "cold-outreach",    label: "Cold Outreach",  color: "text-blue-600",   headerBg: "bg-blue-50 border-blue-200",     dot: "bg-blue-400"   },
      { key: "primeiro-contato", label: "1o Contato",     color: "text-indigo-600", headerBg: "bg-indigo-50 border-indigo-200", dot: "bg-indigo-400" },
      { key: "demo-agendada",    label: "Demo Agendada",  color: "text-violet-600", headerBg: "bg-violet-50 border-violet-200", dot: "bg-violet-400" },
      { key: "sql",              label: "SQL",            color: "text-emerald-600",headerBg: "bg-emerald-50 border-emerald-200",dot: "bg-emerald-400"},
    ],
    deals: [
      { id: 101, titulo: "Contato Inicial",    empresa: "Nova Empresa A", valor: 5000,  avatar: "FG", prioridade: "media", dias: 1, stage: "cold-outreach"    },
      { id: 102, titulo: "Lead Inbound",       empresa: "Startup Y",      valor: 8000,  avatar: "HJ", prioridade: "alta",  dias: 0, stage: "cold-outreach"    },
      { id: 103, titulo: "Indicacao Parceiro", empresa: "Grupo Z",        valor: 15000, avatar: "KL", prioridade: "alta",  dias: 3, stage: "primeiro-contato" },
      { id: 104, titulo: "Lead Marketing",     empresa: "Agencia W",      valor: 6500,  avatar: "MN", prioridade: "baixa", dias: 5, stage: "primeiro-contato" },
      { id: 105, titulo: "Demo Marcada",       empresa: "Tech Ltda",      valor: 22000, avatar: "OP", prioridade: "alta",  dias: 2, stage: "demo-agendada"    },
      { id: 106, titulo: "Qualificado RD",     empresa: "Consultech",     valor: 18000, avatar: "QR", prioridade: "media", dias: 1, stage: "sql"              },
    ],
  },
  {
    id: "closer",
    label: "Funil Closer",
    stages: [
      { key: "apresentacao", label: "Apresentacao",  color: "text-pink-600",   headerBg: "bg-pink-50 border-pink-200",       dot: "bg-pink-400"    },
      { key: "proposta-env", label: "Proposta Env.", color: "text-amber-600",  headerBg: "bg-amber-50 border-amber-200",     dot: "bg-amber-400"   },
      { key: "contrato",     label: "Contrato",      color: "text-orange-600", headerBg: "bg-orange-50 border-orange-200",   dot: "bg-orange-400"  },
      { key: "ganho",        label: "Ganho",         color: "text-emerald-600",headerBg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-400" },
      { key: "perdido",      label: "Perdido",       color: "text-red-500",    headerBg: "bg-red-50 border-red-200",         dot: "bg-red-400"     },
    ],
    deals: [
      { id: 201, titulo: "Fechamento TechCorp", empresa: "TechCorp Inc.",  valor: 85000,  avatar: "SJ", prioridade: "alta",  dias: 0,  stage: "apresentacao" },
      { id: 202, titulo: "Proposta DataFlow",   empresa: "DataFlow Sys.",  valor: 42000,  avatar: "MC", prioridade: "alta",  dias: 2,  stage: "proposta-env" },
      { id: 203, titulo: "Contrato CloudSync",  empresa: "CloudSync Ltd",  valor: 31000,  avatar: "EW", prioridade: "media", dias: 1,  stage: "contrato"     },
      { id: 204, titulo: "Deal Ganho Mega",     empresa: "MegaCorp",       valor: 120000, avatar: "BC", prioridade: "alta",  dias: 5,  stage: "ganho"        },
      { id: 205, titulo: "Perda Startup",       empresa: "Startup Hub",    valor: 18000,  avatar: "PA", prioridade: "baixa", dias: 10, stage: "perdido"      },
    ],
  },
]

const PRIORIDADE_CONFIG = {
  alta:  { label: "Alta",  bg: "bg-red-50",   text: "text-red-600",   dot: "bg-red-400"   },
  media: { label: "Media", bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-400" },
  baixa: { label: "Baixa", bg: "bg-slate-50", text: "text-slate-500", dot: "bg-slate-300" },
}

const STAGE_COLORS: Omit<PipelineStageConfig, "key" | "label">[] = [
  { color: "text-sky-600",     headerBg: "bg-sky-50 border-sky-200",         dot: "bg-sky-400"     },
  { color: "text-violet-600",  headerBg: "bg-violet-50 border-violet-200",   dot: "bg-violet-400"  },
  { color: "text-amber-600",   headerBg: "bg-amber-50 border-amber-200",     dot: "bg-amber-400"   },
  { color: "text-orange-600",  headerBg: "bg-orange-50 border-orange-200",   dot: "bg-orange-400"  },
  { color: "text-emerald-600", headerBg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-400" },
  { color: "text-pink-600",    headerBg: "bg-pink-50 border-pink-200",       dot: "bg-pink-400"    },
  { color: "text-red-500",     headerBg: "bg-red-50 border-red-200",         dot: "bg-red-400"     },
]

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
]

function avatarColor(initials: string) {
  const idx = (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(val)
}

// ─── Deal Card ───────────────────────────────────────────────────────────────

function DealCard({ deal }: { deal: Deal }) {
  const pri = PRIORIDADE_CONFIG[deal.prioridade]
  const ac = avatarColor(deal.avatar)
  return (
    <div className="group cursor-grab rounded-xl border border-border bg-card p-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)]">
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="text-[13px] font-semibold leading-snug text-foreground">{deal.titulo}</span>
        <GripVertical className="h-4 w-4 flex-shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <span className="mb-3 block text-[11px] text-muted-foreground">{deal.empresa}</span>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-[12px] font-bold text-emerald-700">{formatCurrency(deal.valor)}</span>
        </div>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", pri.bg, pri.text)}>
          {pri.label}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
        <div className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold", ac)}>
          {deal.avatar}
        </div>
        <span className="text-[11px] text-muted-foreground">
          {deal.dias === 0 ? "Hoje" : `${deal.dias}d na etapa`}
        </span>
      </div>
    </div>
  )
}

// ─── Pipeline Dropdown ───────────────────────────────────────────────────────

function PipelineDropdown({
  pipelines, activePipelineId, onSelect, onManage,
}: {
  pipelines: Pipeline[]
  activePipelineId: string
  onSelect: (id: string) => void
  onManage: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const active = pipelines.find(p => p.id === activePipelineId)!

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-[#7C3AED]/40 hover:bg-[#EDE9FE]/60"
      >
        <span>{active.label}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-60 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          <div className="px-3 pt-3 pb-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Funis de Venda</p>
          </div>
          <div className="flex flex-col p-1.5">
            {pipelines.map(p => (
              <button
                key={p.id}
                onClick={() => { onSelect(p.id); setOpen(false) }}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                  p.id === activePipelineId ? "bg-[#EDE9FE] text-[#7C3AED]" : "text-foreground hover:bg-accent"
                )}
              >
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-semibold leading-tight">{p.label}</span>
                  <span className="text-[11px] text-muted-foreground">{p.stages.length} etapas · {p.deals.length} negocios</span>
                </div>
                {p.id === activePipelineId && <Check className="h-4 w-4 flex-shrink-0 text-[#7C3AED]" />}
              </button>
            ))}
          </div>
          <div className="border-t border-border p-1.5">
            <button
              onClick={() => { onManage(); setOpen(false) }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Settings2 className="h-4 w-4" />
              Gerenciar funis
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Manage Pipelines Modal ──────────────────────────────────────────────────

function ManagePipelinesModal({
  pipelines, activePipelineId, onClose, onSave,
}: {
  pipelines: Pipeline[]
  activePipelineId: string
  onClose: () => void
  onSave: (updated: Pipeline[]) => void
}) {
  const [local, setLocal] = useState<Pipeline[]>(pipelines.map(p => ({ ...p, stages: [...p.stages] })))
  const [selectedId, setSelectedId] = useState(activePipelineId)
  const [editingStageKey, setEditingStageKey] = useState<string | null>(null)
  const [newPipelineLabel, setNewPipelineLabel] = useState("")
  const [newStageLabel, setNewStageLabel] = useState("")

  const selected = local.find(p => p.id === selectedId)!

  function addPipeline() {
    if (!newPipelineLabel.trim()) return
    const id = newPipelineLabel.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now()
    const np: Pipeline = {
      id, label: newPipelineLabel.trim(),
      stages: [
        { key: "novo",      label: "Novo",         ...STAGE_COLORS[0] },
        { key: "andamento", label: "Em Andamento",  ...STAGE_COLORS[2] },
        { key: "concluido", label: "Concluido",     ...STAGE_COLORS[4] },
      ],
      deals: [],
    }
    setLocal(prev => [...prev, np])
    setSelectedId(id)
    setNewPipelineLabel("")
  }

  function removePipeline(id: string) {
    if (local.length <= 1) return
    const remaining = local.filter(p => p.id !== id)
    setLocal(remaining)
    if (selectedId === id) setSelectedId(remaining[0].id)
  }

  function addStage() {
    if (!newStageLabel.trim()) return
    const idx = selected.stages.length % STAGE_COLORS.length
    const key = newStageLabel.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now()
    const newStage: PipelineStageConfig = { key, label: newStageLabel.trim(), ...STAGE_COLORS[idx] }
    setLocal(prev => prev.map(p => p.id === selectedId ? { ...p, stages: [...p.stages, newStage] } : p))
    setNewStageLabel("")
  }

  function removeStage(key: string) {
    if (selected.stages.length <= 1) return
    setLocal(prev => prev.map(p =>
      p.id === selectedId ? { ...p, stages: p.stages.filter(s => s.key !== key) } : p
    ))
  }

  function renameStage(key: string, label: string) {
    setLocal(prev => prev.map(p =>
      p.id === selectedId ? { ...p, stages: p.stages.map(s => s.key === key ? { ...s, label } : s) } : p
    ))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="flex h-[580px] w-[740px] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">

        {/* Left: pipeline list */}
        <div className="flex w-52 flex-shrink-0 flex-col border-r border-border bg-background">
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <span className="text-sm font-bold text-foreground">Funis</span>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
            {local.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={cn(
                  "group flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left transition-colors",
                  p.id === selectedId ? "bg-[#EDE9FE] text-[#7C3AED]" : "text-foreground hover:bg-accent"
                )}
              >
                <span className="truncate text-sm font-medium">{p.label}</span>
                {local.length > 1 && (
                  <span
                    role="button"
                    onClick={(e) => { e.stopPropagation(); removePipeline(p.id) }}
                    className="hidden rounded p-0.5 text-muted-foreground hover:bg-red-100 hover:text-red-500 group-hover:block"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="border-t border-border p-3">
            <div className="flex gap-1.5">
              <input
                value={newPipelineLabel}
                onChange={e => setNewPipelineLabel(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addPipeline()}
                placeholder="Novo funil..."
                className="min-w-0 flex-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs placeholder:text-muted-foreground focus:border-[#7C3AED] focus:outline-none"
              />
              <button onClick={addPipeline} className="rounded-lg bg-[#7C3AED] p-1.5 text-white hover:bg-[#6D28D9]">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: stage editor */}
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h3 className="text-base font-bold text-foreground">{selected.label}</h3>
              <p className="text-xs text-muted-foreground">{selected.stages.length} etapas configuradas</p>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Etapas do Funil</p>
            <div className="flex flex-col gap-2">
              {selected.stages.map((stage) => (
                <div key={stage.key} className={cn("flex items-center gap-3 rounded-xl border px-4 py-3", stage.headerBg)}>
                  <span className={cn("h-2.5 w-2.5 flex-shrink-0 rounded-full", stage.dot)} />
                  {editingStageKey === stage.key ? (
                    <input
                      autoFocus
                      value={stage.label}
                      onChange={e => renameStage(stage.key, e.target.value)}
                      onBlur={() => setEditingStageKey(null)}
                      onKeyDown={e => e.key === "Enter" && setEditingStageKey(null)}
                      className="flex-1 rounded border border-border bg-white px-2 py-0.5 text-sm font-semibold focus:border-[#7C3AED] focus:outline-none"
                    />
                  ) : (
                    <span className={cn("flex-1 text-sm font-semibold", stage.color)}>{stage.label}</span>
                  )}
                  <div className="ml-auto flex items-center gap-1">
                    <button
                      onClick={() => setEditingStageKey(editingStageKey === stage.key ? null : stage.key)}
                      className="rounded p-1 text-muted-foreground hover:bg-white/60 hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {selected.stages.length > 1 && (
                      <button
                        onClick={() => removeStage(stage.key)}
                        className="rounded p-1 text-muted-foreground hover:bg-red-100 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={newStageLabel}
                onChange={e => setNewStageLabel(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addStage()}
                placeholder="Nome da nova etapa..."
                className="flex-1 rounded-xl border border-dashed border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
              />
              <button
                onClick={addStage}
                className="flex items-center gap-1.5 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6D28D9]"
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
            <button onClick={onClose} className="rounded-xl border border-border px-5 py-2 text-sm font-medium text-muted-foreground hover:bg-accent">
              Cancelar
            </button>
            <button
              onClick={() => { onSave(local); onClose() }}
              className="rounded-xl bg-[#7C3AED] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#6D28D9]"
            >
              Salvar alteracoes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main View ───────────────────────────────────────────────────────────────

export function PipelineView() {
  const [pipelines, setPipelines] = useState<Pipeline[]>(INITIAL_PIPELINES)
  const [activePipelineId, setActivePipelineId] = useState("principal")
  const [showManage, setShowManage] = useState(false)

  const active = pipelines.find(p => p.id === activePipelineId) ?? pipelines[0]
  const { deals, stages } = active
  const totalValor = deals.reduce((s, d) => s + d.valor, 0)

  return (
    <div className="flex h-full flex-col gap-5 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Acompanhe negocios por etapa de venda</p>
        </div>
        <div className="flex items-center gap-2.5">
          <PipelineDropdown
            pipelines={pipelines}
            activePipelineId={activePipelineId}
            onSelect={setActivePipelineId}
            onManage={() => setShowManage(true)}
          />
          <button className="flex items-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#6D28D9] active:scale-95">
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Novo Negocio
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-card px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Negocios Ativos</span>
          <span className="text-3xl font-bold leading-none text-foreground">{deals.length}</span>
          <span className="text-xs text-muted-foreground">no funil atual</span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-card px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Valor Total</span>
          <span className="text-2xl font-bold leading-none text-emerald-600">{formatCurrency(totalValor)}</span>
          <span className="text-xs text-muted-foreground">em oportunidades</span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-card px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ticket Medio</span>
          <span className="text-2xl font-bold leading-none text-foreground">
            {deals.length > 0 ? formatCurrency(totalValor / deals.length) : "R$ 0"}
          </span>
          <span className="text-xs text-muted-foreground">por negocio</span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-card px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Alta Prioridade</span>
          <span className="text-3xl font-bold leading-none text-red-500">
            {deals.filter(d => d.prioridade === "alta").length}
          </span>
          <span className="text-xs text-muted-foreground">negocios urgentes</span>
        </div>
      </div>

      {/* Stage summary strip */}
      <div className="flex items-center gap-1 rounded-xl border border-border bg-card px-4 py-3">
        {stages.map((stage, i) => {
          const stageDeals = deals.filter(d => d.stage === stage.key)
          const stageVal = stageDeals.reduce((s, d) => s + d.valor, 0)
          const pct = totalValor > 0 ? Math.round((stageVal / totalValor) * 100) : 0
          return (
            <div key={stage.key} className="flex flex-1 items-center gap-1.5">
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className={cn("text-[10px] font-bold uppercase tracking-wide", stage.color)}>{stage.label}</span>
                  <span className="text-[10px] text-muted-foreground">{stageDeals.length}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-border">
                  <div className={cn("h-1.5 rounded-full transition-all", stage.dot)} style={{ width: `${pct}%` }} />
                </div>
              </div>
              {i < stages.length - 1 && <ArrowRight className="h-3 w-3 flex-shrink-0 text-muted-foreground/30" />}
            </div>
          )
        })}
      </div>

      {/* Kanban board */}
      <div className="flex flex-1 gap-3 overflow-x-auto overflow-y-hidden pb-2">
        {stages.map((stage) => {
          const stageDeals = deals.filter(d => d.stage === stage.key)
          const stageVal = stageDeals.reduce((s, d) => s + d.valor, 0)
          return (
            <div key={stage.key} className="flex w-[220px] flex-shrink-0 flex-col gap-2.5">
              <div className={cn("flex items-center justify-between rounded-xl border px-3 py-2.5", stage.headerBg)}>
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", stage.dot)} />
                  <span className={cn("text-[11px] font-bold uppercase tracking-wide", stage.color)}>{stage.label}</span>
                </div>
                <span className={cn("rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] font-bold", stage.color)}>
                  {stageDeals.length}
                </span>
              </div>
              <span className="px-1 text-[11px] font-medium text-muted-foreground">{formatCurrency(stageVal)}</span>
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-0.5">
                {stageDeals.map(deal => <DealCard key={deal.id} deal={deal} />)}
              </div>
              <button className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2 text-[11px] text-muted-foreground transition-colors hover:border-[#7C3AED]/40 hover:bg-[#EDE9FE]/50 hover:text-[#7C3AED]">
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </button>
            </div>
          )
        })}
      </div>

      {/* Manage modal */}
      {showManage && (
        <ManagePipelinesModal
          pipelines={pipelines}
          activePipelineId={activePipelineId}
          onClose={() => setShowManage(false)}
          onSave={(updated) => setPipelines(updated)}
        />
      )}
    </div>
  )
}
