"use client"

import { useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Phone,
  Video,
  Users,
  CalendarDays,
  Search,
  MoreHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────────────────────────

type Status = "confirmado" | "pendente" | "cancelado"
type Tipo = "reuniao" | "ligacao" | "videochamada" | "presencial"

interface Appointment {
  id: number
  titulo: string
  contato: string
  empresa: string
  data: string
  hora: string
  duracao: string
  tipo: Tipo
  status: Status
  local?: string
  avatar: string
}

// ─── Mock data ───────────────────────────────────────────────────────────────

const APPOINTMENTS: Appointment[] = [
  { id: 1, titulo: "Demo do Produto",        contato: "Sarah Johnson",  empresa: "TechCorp Inc.",    data: "2026-02-26", hora: "09:00", duracao: "45 min",  tipo: "videochamada", status: "confirmado", local: "Google Meet",             avatar: "SJ" },
  { id: 2, titulo: "Follow-up de Proposta",  contato: "Michael Chen",   empresa: "DataFlow Systems", data: "2026-02-26", hora: "11:30", duracao: "30 min",  tipo: "ligacao",      status: "pendente",                                    avatar: "MC" },
  { id: 3, titulo: "Reuniao de Onboarding",  contato: "Emma Williams",  empresa: "CloudSync Ltd",    data: "2026-02-27", hora: "14:00", duracao: "60 min",  tipo: "presencial",   status: "confirmado", local: "Escritorio SP - Sala 3", avatar: "EW" },
  { id: 4, titulo: "Alinhamento Estrategico",contato: "James Anderson", empresa: "AI Solutions",     data: "2026-02-27", hora: "16:00", duracao: "30 min",  tipo: "videochamada", status: "pendente",   local: "Zoom",                   avatar: "JA" },
  { id: 5, titulo: "Renovacao de Contrato",  contato: "Lisa Martinez",  empresa: "DevTools Pro",     data: "2026-02-28", hora: "10:00", duracao: "45 min",  tipo: "reuniao",      status: "confirmado",                                  avatar: "LM" },
  { id: 6, titulo: "Apresentacao Executiva", contato: "Robert Silva",   empresa: "FinTrack SA",      data: "2026-03-03", hora: "15:00", duracao: "90 min",  tipo: "presencial",   status: "cancelado",  local: "Escritorio Cliente",     avatar: "RS" },
  { id: 7, titulo: "Review Trimestral",      contato: "Ana Costa",      empresa: "GrowthLab",        data: "2026-03-04", hora: "09:30", duracao: "60 min",  tipo: "videochamada", status: "confirmado", local: "Microsoft Teams",         avatar: "AC" },
  { id: 8, titulo: "Kickoff do Projeto",     contato: "Pedro Alves",    empresa: "Startup Hub",      data: "2026-03-05", hora: "13:00", duracao: "120 min", tipo: "reuniao",      status: "pendente",                                    avatar: "PA" },
]

// ─── Constants ───────────────────────────────────────────────────────────────

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]
const MESES = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

const STATUS_CONFIG: Record<Status, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  confirmado: { label: "Confirmado", bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle2 },
  pendente:   { label: "Pendente",   bg: "bg-amber-50",   text: "text-amber-700",   icon: AlertCircle  },
  cancelado:  { label: "Cancelado",  bg: "bg-red-50",     text: "text-red-600",     icon: XCircle      },
}

const TIPO_CONFIG: Record<Tipo, { label: string; icon: React.ElementType; color: string }> = {
  reuniao:      { label: "Reuniao",      icon: Users,    color: "text-blue-500"   },
  ligacao:      { label: "Ligacao",      icon: Phone,    color: "text-green-500"  },
  videochamada: { label: "Videochamada", icon: Video,    color: "text-purple-500" },
  presencial:   { label: "Presencial",   icon: MapPin,   color: "text-orange-500" },
}

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

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color }: { label: string; value: number; sub: string; color: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-card px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={cn("text-3xl font-bold leading-none", color)}>{value}</span>
      <span className="text-xs text-muted-foreground">{sub}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium", cfg.bg, cfg.text)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  )
}

function TipoBadge({ tipo }: { tipo: Tipo }) {
  const cfg = TIPO_CONFIG[tipo]
  const Icon = cfg.icon
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
      <Icon className={cn("h-3.5 w-3.5", cfg.color)} strokeWidth={2} />
      {cfg.label}
    </span>
  )
}

// ─── Mini Calendar ───────────────────────────────────────────────────────────

function MiniCalendar({
  year, month, selectedDate, onSelect, appointments, onPrev, onNext,
}: {
  year: number; month: number; selectedDate: string | null
  onSelect: (d: string) => void
  appointments: Appointment[]
  onPrev: () => void; onNext: () => void
}) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date().toISOString().split("T")[0]

  const datesWithAppts = new Set(appointments.map(a => a.data))
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={onPrev} className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-bold text-foreground">{MESES[month]} {year}</span>
        <button onClick={onNext} className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DIAS_SEMANA.map(d => (
          <span key={d} className="text-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground py-1">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
          const isToday = dateStr === today
          const isSelected = dateStr === selectedDate
          const hasAppt = datesWithAppts.has(dateStr)
          return (
            <button
              key={i}
              onClick={() => onSelect(dateStr)}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-lg py-1 text-[12px] font-medium transition-all",
                isSelected ? "bg-[#7C3AED] text-white shadow-sm" : isToday ? "bg-[#EDE9FE] text-[#7C3AED] font-bold" : "text-foreground hover:bg-accent"
              )}
            >
              {day}
              {hasAppt && (
                <span className={cn("mt-0.5 h-1 w-1 rounded-full", isSelected ? "bg-white/70" : "bg-[#7C3AED]")} />
              )}
            </button>
          )
        })}
      </div>
      {selectedDate && (
        <div className="mt-3 rounded-lg bg-[#F5F3FF] px-3 py-2.5">
          <p className="text-[11px] font-semibold text-[#7C3AED]">Data Selecionada</p>
          <p className="text-xs font-bold text-foreground mt-0.5">
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {APPOINTMENTS.filter(a => a.data === selectedDate).length} agendamento(s) neste dia
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Appointment Card ────────────────────────────────────────────────────────

function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const ac = avatarColor(appointment.avatar)
  const TipoIcon = TIPO_CONFIG[appointment.tipo].icon
  return (
    <div className="group flex items-start gap-4 rounded-xl border border-border bg-card px-4 py-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <div className="flex-shrink-0 pt-0.5 text-center">
        <span className="block text-[11px] font-bold text-[#7C3AED]">{appointment.hora}</span>
        <span className="block text-[10px] text-muted-foreground">{appointment.duracao}</span>
      </div>
      <div className={cn("mt-1 h-full w-0.5 flex-shrink-0 self-stretch rounded-full", appointment.status === "confirmado" ? "bg-emerald-400" : appointment.status === "pendente" ? "bg-amber-400" : "bg-red-400")} />
      <div className={cn("flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold", ac)}>
        {appointment.avatar}
      </div>
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-bold text-foreground leading-tight">{appointment.titulo}</span>
          <StatusBadge status={appointment.status} />
        </div>
        <span className="text-xs text-muted-foreground">{appointment.contato} &middot; {appointment.empresa}</span>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <TipoBadge tipo={appointment.tipo} />
          {appointment.local && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {appointment.local}
            </span>
          )}
        </div>
      </div>
      <button className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-accent group-hover:opacity-100">
        <MoreHorizontal className="h-4 w-4" />
      </button>
    </div>
  )
}

// ─── New Appointment Modal ───────────────────────────────────────────────────

function NewAppModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-[480px] rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-base font-bold text-foreground">Novo Agendamento</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Titulo</label>
            <input placeholder="Ex: Demo do produto..." className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Data</label>
              <input type="date" className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Hora</label>
              <input type="time" className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Contato</label>
            <input placeholder="Nome do contato..." className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Tipo</label>
              <select className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20">
                <option>Videochamada</option>
                <option>Ligacao</option>
                <option>Reuniao</option>
                <option>Presencial</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Duracao</label>
              <select className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20">
                <option>15 min</option>
                <option>30 min</option>
                <option>45 min</option>
                <option>60 min</option>
                <option>90 min</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Local / Link</label>
            <input placeholder="Google Meet, Zoom, endereco..." className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20" />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <button onClick={onClose} className="rounded-xl border border-border px-5 py-2 text-sm font-medium text-muted-foreground hover:bg-accent">
            Cancelar
          </button>
          <button onClick={onClose} className="rounded-xl bg-[#7C3AED] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#6D28D9]">
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main View ───────────────────────────────────────────────────────────────

export function AgendamentosView() {
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(today.toISOString().split("T")[0])
  const [filterStatus, setFilterStatus] = useState<Status | "todos">("todos")
  const [search, setSearch] = useState("")
  const [showModal, setShowModal] = useState(false)

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }

  const filtered = APPOINTMENTS.filter(a => {
    const matchStatus = filterStatus === "todos" || a.status === filterStatus
    const matchDate = !selectedDate || a.data === selectedDate
    const matchSearch = !search || a.titulo.toLowerCase().includes(search.toLowerCase()) || a.contato.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchDate && matchSearch
  })

  const grouped = filtered.reduce<Record<string, Appointment[]>>((acc, a) => {
    acc[a.data] = acc[a.data] ? [...acc[a.data], a] : [a]
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort()

  const kpis = {
    total: APPOINTMENTS.length,
    confirmados: APPOINTMENTS.filter(a => a.status === "confirmado").length,
    pendentes: APPOINTMENTS.filter(a => a.status === "pendente").length,
    cancelados: APPOINTMENTS.filter(a => a.status === "cancelado").length,
  }

  const STATUS_FILTERS: { key: Status | "todos"; label: string }[] = [
    { key: "todos",      label: "Todos"      },
    { key: "confirmado", label: "Confirmados"},
    { key: "pendente",   label: "Pendentes"  },
    { key: "cancelado",  label: "Cancelados" },
  ]

  return (
    <div className="flex h-full flex-col gap-5 overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agendamentos</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Gerencie reunioes, ligacoes e compromissos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#6D28D9] active:scale-95"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Novo Agendamento
        </button>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total"       value={kpis.total}       sub="agendamentos" color="text-foreground" />
        <KpiCard label="Confirmados" value={kpis.confirmados} sub="prontos"      color="text-emerald-600" />
        <KpiCard label="Pendentes"   value={kpis.pendentes}   sub="aguardando"   color="text-amber-600" />
        <KpiCard label="Cancelados"  value={kpis.cancelados}  sub="este mes"     color="text-red-500" />
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 gap-5 overflow-hidden min-h-0">

        {/* Left: Appointments list */}
        <div className="flex flex-1 flex-col gap-4 overflow-hidden min-w-0">
          {/* Search + Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar agendamentos..."
                className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-4 text-sm focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
              />
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
              {STATUS_FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => { setFilterStatus(f.key); setSelectedDate(null) }}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                    filterStatus === f.key
                      ? "bg-[#7C3AED] text-white shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Appointment list */}
          <div className="flex-1 overflow-y-auto pr-1">
            {sortedDates.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <CalendarDays className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm font-medium text-muted-foreground">Nenhum agendamento encontrado</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {sortedDates.map(date => (
                  <div key={date}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                      </span>
                      <div className="flex-1 border-t border-border" />
                      <span className="rounded-full bg-[#EDE9FE] px-2 py-0.5 text-[10px] font-bold text-[#7C3AED]">
                        {grouped[date].length}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {grouped[date].map(a => <AppointmentCard key={a.id} appointment={a} />)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Calendar */}
        <div className="flex w-64 flex-shrink-0 flex-col gap-4">
          <MiniCalendar
            year={calYear}
            month={calMonth}
            selectedDate={selectedDate}
            onSelect={(d) => setSelectedDate(prev => prev === d ? null : d)}
            appointments={APPOINTMENTS}
            onPrev={prevMonth}
            onNext={nextMonth}
          />

          {/* Legend */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tipo de Reuniao</p>
            <div className="flex flex-col gap-2">
              {(Object.entries(TIPO_CONFIG) as [Tipo, typeof TIPO_CONFIG[Tipo]][]).map(([key, cfg]) => {
                const Icon = cfg.icon
                return (
                  <div key={key} className="flex items-center gap-2">
                    <Icon className={cn("h-3.5 w-3.5", cfg.color)} strokeWidth={2} />
                    <span className="text-xs text-muted-foreground">{cfg.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick stats */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Este mes</p>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Taxa de conclusao</span>
                <span className="text-xs font-bold text-emerald-600">73%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-border">
                <div className="h-1.5 w-[73%] rounded-full bg-emerald-500" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Taxa de cancelamento</span>
                <span className="text-xs font-bold text-red-500">12%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-border">
                <div className="h-1.5 w-[12%] rounded-full bg-red-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal ── */}
      {showModal && <NewAppModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
