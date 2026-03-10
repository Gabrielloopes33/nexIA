"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  Phone,
  Video,
  Users,
  CalendarDays,
  Clock,
  FileText,
  List,
  ChevronDown,
  Calendar as CalendarIcon,
  GripVertical,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Target,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ContactDetailPanel } from "@/components/contact-detail-panel"
import { VerticalKpiCard } from "@/components/vertical-kpi-card"
import { Contact } from "@/lib/mock/contacts"
import { useAgendamentos, TipoAtividade, StatusAtividade, Atividade } from "@/lib/contexts/agendamentos-context"

// ─── Types ──────────────────────────────────────────────────────────────────

interface AgendamentosViewProps {
  defaultTipoFiltro?: TipoAtividade | "todos"
  somenteConcluidasView?: boolean
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

const TIPOS_CONFIG: Record<TipoAtividade, {
  label: string
  icon: React.ElementType
  corFundo: string
  corTexto: string
  corBorda: string
}> = {
  ligacao: {
    label: "Ligação",
    icon: Phone,
    corFundo: "bg-blue-50",
    corTexto: "text-blue-700",
    corBorda: "border-blue-200"
  },
  reuniao: {
    label: "Reunião",
    icon: Users,
    corFundo: "bg-[#46347F]/10",
    corTexto: "text-[#6b69c9]",
    corBorda: "border-[#46347F]/30"
  },
  tarefa: {
    label: "Tarefa",
    icon: FileText,
    corFundo: "bg-amber-50",
    corTexto: "text-amber-700",
    corBorda: "border-amber-200"
  },
  prazo: {
    label: "Prazo",
    icon: Clock,
    corFundo: "bg-rose-50",
    corTexto: "text-rose-700",
    corBorda: "border-rose-200"
  },
}

const HORARIOS = Array.from({ length: 15 }, (_, i) => i + 6)

// ─── Mock Data ───────────────────────────────────────────────────────────────

function gerarDataSemana(semanaOffset: number, diaSemana: number, hora: number, minuto: number = 0): Date {
  const hoje = new Date()
  const inicioSemana = new Date(hoje)
  inicioSemana.setDate(hoje.getDate() - hoje.getDay() + (semanaOffset * 7))
  inicioSemana.setHours(0, 0, 0, 0)

  const data = new Date(inicioSemana)
  data.setDate(inicioSemana.getDate() + diaSemana)
  data.setHours(hora, minuto, 0, 0)
  return data
}

const ATIVIDADES_MOCK: Atividade[] = [
  {
    id: 1,
    titulo: "Demo do Produto",
    contato: "Sarah Johnson",
    empresa: "TechCorp Inc.",
    data: gerarDataSemana(0, 1, 9, 0),
    horaInicio: "09:00",
    horaFim: "09:45",
    tipo: "reuniao",
    status: "confirmado",
    local: "Google Meet",
    descricao: "Apresentação da plataforma para equipe de vendas",
    avatar: "SJ",
  },
  {
    id: 2,
    titulo: "Follow-up Proposta",
    contato: "Michael Chen",
    empresa: "DataFlow Systems",
    data: gerarDataSemana(0, 1, 11, 30),
    horaInicio: "11:30",
    horaFim: "12:00",
    tipo: "ligacao",
    status: "pendente",
    descricao: "Ligar para verificar interesse na proposta enviada",
    avatar: "MC",
  },
  {
    id: 3,
    titulo: "Reunião Alinhamento",
    contato: "Equipe Interna",
    empresa: "Interno",
    data: gerarDataSemana(0, 1, 14, 0),
    horaInicio: "14:00",
    horaFim: "15:00",
    tipo: "reuniao",
    status: "confirmado",
    local: "Sala de Conferência A",
    descricao: "Alinhamento trimestral de metas",
    avatar: "EQ",
  },
  {
    id: 4,
    titulo: "Onboarding Cliente",
    contato: "Emma Williams",
    empresa: "CloudSync Ltd",
    data: gerarDataSemana(0, 2, 10, 0),
    horaInicio: "10:00",
    horaFim: "11:30",
    tipo: "reuniao",
    status: "confirmado",
    local: "Zoom",
    descricao: "Sessão de onboarding para novos usuários",
    avatar: "EW",
  },
  {
    id: 5,
    titulo: "Enviar Relatório",
    contato: "Diretoria",
    empresa: "Interno",
    data: gerarDataSemana(0, 2, 16, 0),
    horaInicio: "16:00",
    horaFim: "17:00",
    tipo: "tarefa",
    status: "pendente",
    descricao: "Consolidar e enviar relatório mensal",
    avatar: "DR",
  },
  {
    id: 6,
    titulo: "Revisar Conteúdo",
    contato: "Lista Prospects",
    empresa: "Marketing",
    data: gerarDataSemana(0, 2, 13, 0),
    horaInicio: "13:00",
    horaFim: "13:30",
    tipo: "tarefa",
    status: "confirmado",
    descricao: "Revisar materiais de nurture",
    avatar: "MK",
  },
  {
    id: 7,
    titulo: "Negociação Contrato",
    contato: "Robert Silva",
    empresa: "FinTrack SA",
    data: gerarDataSemana(0, 3, 15, 0),
    horaInicio: "15:00",
    horaFim: "16:30",
    tipo: "reuniao",
    status: "confirmado",
    local: "Escritório Cliente",
    descricao: "Discutir termos do contrato anual",
    avatar: "RS",
  },
  {
    id: 8,
    titulo: "Prazo Proposta",
    contato: "Lisa Martinez",
    empresa: "DevTools Pro",
    data: gerarDataSemana(0, 3, 17, 0),
    horaInicio: "17:00",
    horaFim: "17:30",
    tipo: "prazo",
    status: "pendente",
    descricao: "Proposta deve ser enviada até este horário",
    avatar: "LM",
  },
  {
    id: 9,
    titulo: "Call Descoberta",
    contato: "James Anderson",
    empresa: "AI Solutions",
    data: gerarDataSemana(0, 3, 9, 30),
    horaInicio: "09:30",
    horaFim: "10:00",
    tipo: "ligacao",
    status: "confirmado",
    descricao: "Primeiro contato - qualificação",
    avatar: "JA",
  },
  {
    id: 10,
    titulo: "Revisão Pipeline",
    contato: "Gerentes",
    empresa: "Interno",
    data: gerarDataSemana(0, 4, 10, 0),
    horaInicio: "10:00",
    horaFim: "11:00",
    tipo: "reuniao",
    status: "confirmado",
    local: "Sala B",
    descricao: "Revisão semanal do funil de vendas",
    avatar: "GE",
  },
  {
    id: 11,
    titulo: "Follow-up Pós-demo",
    contato: "Sarah Johnson",
    empresa: "TechCorp Inc.",
    data: gerarDataSemana(0, 4, 14, 0),
    horaInicio: "14:00",
    horaFim: "14:30",
    tipo: "ligacao",
    status: "pendente",
    descricao: "Verificar interesse após demonstração",
    avatar: "SJ",
  },
  {
    id: 12,
    titulo: "Kickoff Projeto",
    contato: "Pedro Alves",
    empresa: "Startup Hub",
    data: gerarDataSemana(0, 5, 13, 0),
    horaInicio: "13:00",
    horaFim: "14:30",
    tipo: "reuniao",
    status: "confirmado",
    local: "Google Meet",
    descricao: "Início do projeto de implementação",
    avatar: "PA",
  },
  {
    id: 13,
    titulo: "Proposta Comercial",
    contato: "Ana Costa",
    empresa: "GrowthLab",
    data: gerarDataSemana(0, 5, 16, 0),
    horaInicio: "16:00",
    horaFim: "17:00",
    tipo: "tarefa",
    status: "pendente",
    descricao: "Finalizar proposta personalizada",
    avatar: "AC",
  },
]

// ─── Helpers ───────────────────────────────────────────────────────────────

function avatarColor(initials: string) {
  const colors = [
    "bg-[#46347F] text-white",
    "bg-[#b8b6ec] text-white",
    "bg-[#7b79c4] text-white",
    "bg-[#6b69c9] text-white",
    "bg-[#8b89c9] text-white",
  ]
  const idx = (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % colors.length
  return colors[idx]
}

function getHoraPosicao(hora: string): number {
  const [h] = hora.split(":").map(Number)
  return h - 6
}

function getDuracaoSlots(horaInicio: string, horaFim: string): number {
  const [h1, m1] = horaInicio.split(":").map(Number)
  const [h2, m2] = horaFim.split(":").map(Number)
  const minutos = (h2 * 60 + m2) - (h1 * 60 + m1)
  return Math.max(1, Math.ceil(minutos / 60))
}

function formatarHora(hora: number, minuto: number = 0): string {
  return `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`
}

// ─── Componente Card de Atividade com Drag ──────────────────────────────────

function CardAtividade({
  atividade,
  onClick,
  onDragStart,
  isDragging
}: {
  atividade: Atividade
  onClick: () => void
  onDragStart: (e: React.DragEvent) => void
  isDragging: boolean
}) {
  const config = TIPOS_CONFIG[atividade.tipo]
  const duracaoSlots = getDuracaoSlots(atividade.horaInicio, atividade.horaFim)

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={cn(
        "group absolute inset-x-1 cursor-pointer rounded-lg border p-2 transition-all hover:shadow-md hover:scale-[1.02]",
        config.corFundo,
        config.corBorda,
        isDragging && "opacity-50 rotate-2",
        duracaoSlots > 1 ? "min-h-full" : ""
      )}
      style={{
        minHeight: duracaoSlots > 1 ? `${duracaoSlots * 100}%` : undefined
      }}
    >
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="h-3 w-3 text-gray-400" />
      </div>

      <div className="flex items-start justify-between gap-1 pr-4">
        <span className={cn("text-xs font-semibold line-clamp-1", config.corTexto)}>
          {atividade.horaInicio} - {atividade.horaFim}
        </span>
        {atividade.status === "confirmado" && (
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
        )}
        {atividade.status === "pendente" && (
          <div className="h-2 w-2 rounded-full bg-amber-500" />
        )}
      </div>
      <p className="mt-1 text-xs font-medium text-gray-900 line-clamp-1">
        {atividade.titulo}
      </p>
      <p className="text-[10px] text-gray-600 line-clamp-1">
        {atividade.contato}
      </p>
      {duracaoSlots > 1 && atividade.local && (
        <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-500">
          <MapPin className="h-3 w-3" />
          <span className="line-clamp-1">{atividade.local}</span>
        </div>
      )}
    </div>
  )
}

// ─── Modais ─────────────────────────────────────────────────────────────────

function ModalNovaAtividade({
  aberto,
  onFechar,
  onSalvar,
  tipoInicial = "reuniao"
}: {
  aberto: boolean
  onFechar: () => void
  onSalvar: (atividade: Omit<Atividade, "id">) => void
  tipoInicial?: TipoAtividade
}) {
  const [titulo, setTitulo] = useState("")
  const [data, setData] = useState(() => {
    const hoje = new Date()
    return hoje.toISOString().split("T")[0]
  })
  const [horaInicio, setHoraInicio] = useState("09:00")
  const [horaFim, setHoraFim] = useState("10:00")
  const [contato, setContato] = useState("")
  const [empresa, setEmpresa] = useState("")
  const [tipo, setTipo] = useState<TipoAtividade>(tipoInicial)
  const [local, setLocal] = useState("")
  const [descricao, setDescricao] = useState("")
  const [erro, setErro] = useState<string | null>(null)

  // Reset form quando abrir
  useEffect(() => {
    if (aberto) {
      const hoje = new Date()
      setTitulo("")
      setData(hoje.toISOString().split("T")[0])
      setHoraInicio("09:00")
      setHoraFim("10:00")
      setContato("")
      setEmpresa("")
      setTipo(tipoInicial)
      setLocal("")
      setDescricao("")
      setErro(null)
    }
  }, [aberto, tipoInicial])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação
    if (!titulo.trim()) {
      setErro("Título é obrigatório")
      return
    }
    if (!contato.trim()) {
      setErro("Contato é obrigatório")
      return
    }
    if (!data) {
      setErro("Data é obrigatória")
      return
    }

    // Gerar avatar a partir das iniciais do contato
    const avatar = contato
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

    const novaAtividade: Omit<Atividade, "id"> = {
      titulo: titulo.trim(),
      contato: contato.trim(),
      empresa: empresa.trim() || "N/A",
      data: new Date(data),
      horaInicio,
      horaFim,
      tipo,
      status: "pendente",
      local: local.trim() || undefined,
      descricao: descricao.trim() || undefined,
      avatar: avatar || "NA"
    }

    onSalvar(novaAtividade)
    onFechar()
  }

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nova Atividade</DialogTitle>
            <DialogDescription>
              Preencha os detalhes da nova atividade abaixo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {erro && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {erro}
              </div>
            )}
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">Título *</label>
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Reunião de alinhamento..."
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-[#46347F] focus:outline-none focus:ring-2 focus:ring-[#46347F]/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Tipo *</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoAtividade)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-[#46347F] focus:outline-none focus:ring-2 focus:ring-[#46347F]/20"
                >
                  <option value="reuniao">Reunião</option>
                  <option value="ligacao">Ligação</option>
                  <option value="tarefa">Tarefa</option>
                  <option value="prazo">Prazo</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Data *</label>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-[#46347F] focus:outline-none focus:ring-2 focus:ring-[#46347F]/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Início</label>
                <input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-[#46347F] focus:outline-none focus:ring-2 focus:ring-[#46347F]/20"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Fim</label>
                <input
                  type="time"
                  value={horaFim}
                  onChange={(e) => setHoraFim(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-[#46347F] focus:outline-none focus:ring-2 focus:ring-[#46347F]/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Contato *</label>
                <input
                  value={contato}
                  onChange={(e) => setContato(e.target.value)}
                  placeholder="Nome do contato..."
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-[#46347F] focus:outline-none focus:ring-2 focus:ring-[#46347F]/20"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Empresa</label>
                <input
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  placeholder="Nome da empresa..."
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-[#46347F] focus:outline-none focus:ring-2 focus:ring-[#46347F]/20"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Local/Link</label>
              <input
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                placeholder="Sala de reunião, Google Meet, etc..."
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-[#46347F] focus:outline-none focus:ring-2 focus:ring-[#46347F]/20"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Descrição</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Detalhes adicionais..."
                rows={2}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-[#46347F] focus:outline-none focus:ring-2 focus:ring-[#46347F]/20 resize-none"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onFechar}>Cancelar</Button>
            <Button type="submit" className="bg-[#46347F] hover:bg-[#7b79c4] text-white">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ModalDetalhes({
  atividade,
  onFechar
}: {
  atividade: Atividade | null
  onFechar: () => void
}) {
  if (!atividade) return null

  const config = TIPOS_CONFIG[atividade.tipo]
  const Icon = config.icon

  return (
    <Dialog open={!!atividade} onOpenChange={onFechar}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", config.corFundo)}>
              <Icon className={cn("h-5 w-5", config.corTexto)} />
            </div>
            <div>
              <DialogTitle className="text-lg">{atividade.titulo}</DialogTitle>
              <DialogDescription>
                {atividade.data.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                {" · "}
                {atividade.horaInicio} - {atividade.horaFim}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold", avatarColor(atividade.avatar))}>
              {atividade.avatar}
            </div>
            <div>
              <p className="font-medium text-gray-900">{atividade.contato}</p>
              <p className="text-sm text-gray-500">{atividade.empresa}</p>
            </div>
          </div>

          {atividade.local && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{atividade.local}</span>
            </div>
          )}

          {atividade.descricao && (
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-900 mb-1">Descrição</p>
              <p>{atividade.descricao}</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
              atividade.status === "confirmado" ? "bg-emerald-50 text-emerald-700" :
              atividade.status === "pendente" ? "bg-amber-50 text-amber-700" :
              "bg-red-50 text-red-700"
            )}>
              {atividade.status === "confirmado" ? "Confirmado" :
               atividade.status === "pendente" ? "Pendente" : "Cancelado"}
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onFechar}>Fechar</Button>
          <Button className="bg-[#46347F] hover:bg-[#7b79c4] text-white">
            Editar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function AgendamentosView({
  defaultTipoFiltro = "todos",
  somenteConcluidasView = false,
}: AgendamentosViewProps) {
  const { modalNovaAtividadeAberta, fecharModalNovaAtividade } = useAgendamentos()
  
  const [semanaOffset, setSemanaOffset] = useState(0)
  const [tipoFiltro, setTipoFiltro] = useState<TipoAtividade | "todos">(somenteConcluidasView ? "todos" : defaultTipoFiltro)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const [atividadeSelecionada, setAtividadeSelecionada] = useState<Atividade | null>(null)
  const [atividades, setAtividades] = useState<Atividade[]>(ATIVIDADES_MOCK)
  const [draggedAtividade, setDraggedAtividade] = useState<Atividade | null>(null)
  const [dragIndicator, setDragIndicator] = useState<{ diaIndex: number; hora: number; y: number } | null>(null)

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)

  // Calcular dias da semana atual
  const diasSemana = useMemo(() => {
    const dataBase = new Date()
    const inicioSemana = new Date(dataBase)
    inicioSemana.setDate(dataBase.getDate() - dataBase.getDay() + (semanaOffset * 7))

    return Array.from({ length: 7 }, (_, i) => {
      const dia = new Date(inicioSemana)
      dia.setDate(inicioSemana.getDate() + i)
      return dia
    })
  }, [semanaOffset])

  const dataInicio = diasSemana[0]
  const dataFim = diasSemana[6]

  // Filtrar atividades
  const atividadesFiltradas = useMemo(() => {
    return atividades.filter(a => {
      // Filtro por tipo (exceto quando em view de concluídas)
      if (!somenteConcluidasView && tipoFiltro !== "todos" && a.tipo !== tipoFiltro) return false
      
      const dataAtividade = new Date(a.data)
      dataAtividade.setHours(0, 0, 0, 0)
      
      // Filtro de concluídas: confirmadas no passado
      if (somenteConcluidasView) {
        return a.status === "confirmado" && dataAtividade < hoje
      }
      
      // Filtro normal: atividades da semana atual
      return dataAtividade >= dataInicio && dataAtividade <= dataFim
    })
  }, [atividades, tipoFiltro, dataInicio, dataFim, somenteConcluidasView, hoje])

  // Contar atividades por tipo
  const contagemPorTipo = useMemo(() => {
    const contagem: Record<TipoAtividade | "todos", number> = {
      todos: atividades.length,
      ligacao: 0,
      reuniao: 0,
      tarefa: 0,
      prazo: 0,
    }
    atividades.forEach(a => {
      contagem[a.tipo]++
    })
    return contagem
  }, [atividades])

  // Contar por status
  const contagemPorStatus = useMemo(() => {
    const confirmados = atividades.filter(a => a.status === "confirmado").length
    const pendentes = atividades.filter(a => a.status === "pendente").length
    return { confirmados, pendentes }
  }, [atividades])

  // Próximas atividades (ordenadas por data/hora)
  const proximasAtividades = useMemo(() => {
    const agora = new Date()
    return [...atividades]
      .filter(a => a.data >= agora || a.data.toDateString() === agora.toDateString())
      .sort((a, b) => {
        const dataA = new Date(a.data)
        const dataB = new Date(b.data)
        if (dataA.toDateString() === dataB.toDateString()) {
          return a.horaInicio.localeCompare(b.horaInicio)
        }
        return dataA.getTime() - dataB.getTime()
      })
      .slice(0, 5)
  }, [atividades])

  // Drag & Drop
  const handleDragStart = useCallback((e: React.DragEvent, atividade: Atividade) => {
    setDraggedAtividade(atividade)
    e.dataTransfer.effectAllowed = "move"
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, diaIndex: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const y = e.clientY - rect.top
    const horaIndex = Math.floor(y / 60)
    const hora = Math.max(6, Math.min(20, horaIndex + 6))
    setDragIndicator({ diaIndex, hora, y: horaIndex * 60 })
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragIndicator(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, diaIndex: number) => {
    e.preventDefault()
    if (!draggedAtividade) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const y = e.clientY - rect.top
    const horaIndex = Math.floor(y / 60)
    const hora = Math.max(6, Math.min(20, horaIndex + 6))
    const novaData = new Date(diasSemana[diaIndex])
    const novaHoraInicio = formatarHora(hora)
    const duracao = getDuracaoSlots(draggedAtividade.horaInicio, draggedAtividade.horaFim)
    const novaHoraFim = formatarHora(Math.min(20, hora + duracao))
    setAtividades(prev => prev.map(a => {
      if (a.id === draggedAtividade.id) {
        return { ...a, data: novaData, horaInicio: novaHoraInicio, horaFim: novaHoraFim }
      }
      return a
    }))
    setDraggedAtividade(null)
    setDragIndicator(null)
  }, [draggedAtividade, diasSemana])

  const handleCardClick = useCallback((atividade: Atividade) => {
    const contato: Contact = {
      id: `atividade-${atividade.id}`,
      nome: atividade.contato.split(' ')[0] || atividade.contato,
      sobrenome: atividade.contato.split(' ').slice(1).join(' ') || '',
      email: `${atividade.contato.toLowerCase().replace(/\s+/g, '.')}@${atividade.empresa.toLowerCase().replace(/\s+/g, '')}.com`,
      telefone: "+55 11 98765-4321",
      cidade: "São Paulo",
      estado: "SP",
      cargo: atividade.tipo === "reuniao" ? "Diretor" : "Gerente",
      empresa: atividade.empresa,
      tags: [atividade.tipo],

      status: "ativo",
      origem: "Agenda",
      criadoEm: atividade.data.toISOString(),
      atualizadoEm: new Date().toISOString(),
      atualizadoPor: "Sistema",
      avatar: atividade.avatar,
      avatarBg: "#46347F",
    }
    setSelectedContact(contato)
    setIsSidebarOpen(true)
  }, [])

  const handleCloseSidebar = useCallback(() => {
    setIsSidebarOpen(false)
    setTimeout(() => setSelectedContact(null), 200)
  }, [])

  // Handler para salvar nova atividade
  const handleSalvarAtividade = useCallback((novaAtividade: Omit<Atividade, "id">) => {
    const novoId = Math.max(...atividades.map(a => a.id), 0) + 1
    const atividadeCompleta: Atividade = {
      ...novaAtividade,
      id: novoId
    }
    setAtividades(prev => [...prev, atividadeCompleta])
  }, [atividades])

  const eSemanaAtual = semanaOffset === 0

  return (
    <div className="flex flex-col h-full bg-background">
      {/* ── Header ── */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {somenteConcluidasView ? "Atividades Concluídas" : "Agenda"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {somenteConcluidasView 
              ? "Visualize o histórico de atividades realizadas com sucesso"
              : "Gerencie atividades, reuniões e prazos da sua equipe"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Week Navigation - oculto em concluídas */}
          {!somenteConcluidasView && (
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white">
              <button
                onClick={() => setSemanaOffset(s => s - 1)}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 text-sm font-medium text-gray-700 min-w-[140px] text-center">
                {dataInicio.getDate()} - {dataFim.getDate()} de {dataInicio.toLocaleDateString("pt-BR", { month: "short" })}
              </span>
              <button
                onClick={() => setSemanaOffset(s => s + 1)}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSemanaOffset(0)}
            disabled={eSemanaAtual && !somenteConcluidasView}
            className="border-0 shadow-sm"
          >
            {somenteConcluidasView ? "Esta Semana" : "Hoje"}
          </Button>
        </div>
      </div>

      {/* ── 3-Column Grid Layout - Seguindo padrão Dashboard/Cobranças ── */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[220px_minmax(0,1fr)_280px] flex-1 min-h-0">

        {/* COLUNA 1 (ESQUERDA): KPIs Verticais */}
        <div className="flex flex-col gap-3 xl:col-span-1">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-1">
            {somenteConcluidasView ? (
              // KPIs para visão de Concluídas
              <>
                <VerticalKpiCard
                  label="Total Concluídas"
                  value={atividadesFiltradas.length.toString()}
                  change="+12%"
                  icon={CheckCircle2}
                />
                <VerticalKpiCard
                  label="Esta Semana"
                  value={atividadesFiltradas.filter(a => {
                    const dataAtiv = new Date(a.data)
                    const inicioSemana = new Date(hoje)
                    inicioSemana.setDate(hoje.getDate() - hoje.getDay())
                    return dataAtiv >= inicioSemana && dataAtiv <= hoje
                  }).length.toString()}
                  change="+3"
                  icon={CalendarDays}
                />
                <VerticalKpiCard
                  label="Este Mês"
                  value={atividadesFiltradas.filter(a => {
                    const dataAtiv = new Date(a.data)
                    return dataAtiv.getMonth() === hoje.getMonth() && dataAtiv.getFullYear() === hoje.getFullYear()
                  }).length.toString()}
                  change="+8"
                  icon={Target}
                />
                <VerticalKpiCard
                  label="Taxa vs Meta"
                  value="92%"
                  change="+4,5%"
                  icon={TrendingUp}
                />
              </>
            ) : (
              // KPIs normais
              <>
                <VerticalKpiCard
                  label="Total da Semana"
                  value={atividadesFiltradas.length.toString()}
                  change="+18%"
                  icon={CalendarDays}
                />
                <VerticalKpiCard
                  label="Confirmadas"
                  value={contagemPorStatus.confirmados.toString()}
                  change={`+${Math.round((contagemPorStatus.confirmados / Math.max(atividades.length, 1)) * 100)}%`}
                  icon={CheckCircle2}
                />
                <VerticalKpiCard
                  label="Pendentes"
                  value={contagemPorStatus.pendentes.toString()}
                  change={`-${Math.round((contagemPorStatus.pendentes / Math.max(atividades.length, 1)) * 100)}%`}
                  icon={AlertCircle}
                  isNegativeGood={true}
                />
                <VerticalKpiCard
                  label="Taxa de Conclusão"
                  value="76%"
                  change="+5,2%"
                  icon={Target}
                />
              </>
            )}
          </div>

          {/* Mini resumo por tipo */}
          <Card className="shadow-sm rounded-sm">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[#46347F]">
                Por Tipo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="space-y-2">
                {(Object.keys(TIPOS_CONFIG) as TipoAtividade[]).map(tipo => {
                  const config = TIPOS_CONFIG[tipo]
                  const Icon = config.icon
                  const count = contagemPorTipo[tipo]
                  const pct = Math.round((count / Math.max(atividades.length, 1)) * 100)
                  return (
                    <div key={tipo} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-3.5 w-3.5", config.corTexto)} />
                          <span className="text-xs font-medium text-foreground">{config.label}</span>
                        </div>
                        <span className="text-xs font-semibold text-foreground">{count}</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-sm overflow-hidden">
                        <div
                          className={cn("h-full rounded-sm", config.corFundo.replace("/10", ""))}
                          style={{
                            width: `${pct}%`,
                            backgroundColor: tipo === "ligacao" ? "#3b82f6" :
                                           tipo === "reuniao" ? "#46347F" :
                                           tipo === "tarefa" ? "#f59e0b" : "#f43f5e"
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUNA 2 (CENTRO): Calendário */}
        <div className="flex flex-col gap-4 min-w-0 min-h-0">
          {/* Filters - ocultos em concluídas, mostram default em tipo específico */}
          {!somenteConcluidasView && (
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setTipoFiltro("todos")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                  tipoFiltro === "todos"
                    ? "bg-[#46347F] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                Todos
                <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                  {contagemPorTipo.todos}
                </span>
              </button>

              {(Object.keys(TIPOS_CONFIG) as TipoAtividade[]).map(tipo => {
                const config = TIPOS_CONFIG[tipo]
                const Icon = config.icon
                return (
                  <button
                    key={tipo}
                    onClick={() => setTipoFiltro(tipo)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                      tipoFiltro === tipo
                        ? "bg-[#46347F] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {config.label}
                    <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                      {contagemPorTipo[tipo]}
                    </span>
                  </button>
                )
              })}

              {/* Toggle View */}
              <div className="ml-auto flex items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                <button className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  Calendário
                </button>
                <button className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700">
                  <List className="h-3.5 w-3.5" />
                  Lista
                </button>
              </div>
            </div>
          )}

          {/* Calendar Grid */}
          <div className="flex-1 overflow-auto rounded-lg border border-gray-200 bg-white">
            <div className="min-w-[700px] p-3">
              {/* Header dos Dias */}
              <div className="grid grid-cols-7 gap-1.5 mb-2">
                {diasSemana.map((dia, index) => {
                  const eDiaHoje = dia.toDateString() === hoje.toDateString()
                  return (
                    <div
                      key={index}
                      className={cn(
                        "text-center py-2 rounded-lg",
                        eDiaHoje ? "bg-[#46347F]/10 border border-[#46347F]/30" : "bg-gray-50"
                      )}
                    >
                      <p className={cn(
                        "text-xs font-medium",
                        eDiaHoje ? "text-[#46347F]" : "text-gray-500"
                      )}>
                        {DIAS_SEMANA[index]}
                      </p>
                      <p className={cn(
                        "text-lg font-bold",
                        eDiaHoje ? "text-[#46347F]" : "text-gray-900"
                      )}>
                        {dia.getDate()}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Grid do Calendário */}
              <div className="grid grid-cols-7 gap-1.5">
                {diasSemana.map((dia, diaIndex) => {
                  const atividadesDia = atividadesFiltradas.filter(a =>
                    new Date(a.data).toDateString() === dia.toDateString()
                  )
                  const eDiaHoje = dia.toDateString() === hoje.toDateString()

                  return (
                    <div
                      key={diaIndex}
                      className={cn(
                        "relative min-h-[500px] rounded-lg border",
                        eDiaHoje ? "border-[#46347F]/30 bg-[#46347F]/5" : "border-gray-200 bg-gray-50/50"
                      )}
                      onDragOver={(e) => handleDragOver(e, diaIndex)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, diaIndex)}
                    >
                      {HORARIOS.map((hora) => (
                        <div
                          key={hora}
                          className="h-[50px] border-b border-gray-100 last:border-b-0"
                        />
                      ))}

                      {/* Drop Indicator */}
                      {dragIndicator && dragIndicator.diaIndex === diaIndex && draggedAtividade && (
                        <div
                          className="absolute inset-x-0 z-20 pointer-events-none"
                          style={{ top: `${dragIndicator.y}px` }}
                        >
                          <div className="absolute inset-x-0 h-0.5 bg-[#46347F]" />
                          <div className="absolute left-1 -top-3 bg-[#46347F] text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                            {formatarHora(dragIndicator.hora)}
                          </div>
                          <div
                            className="absolute inset-x-1 mt-0.5 rounded bg-[#46347F]/20 border border-[#46347F]/40"
                            style={{
                              height: `${Math.max(30, getDuracaoSlots(draggedAtividade.horaInicio, draggedAtividade.horaFim) * 50 - 4)}px`
                            }}
                          />
                        </div>
                      )}

                      {/* Cards de Atividades */}
                      {atividadesDia.map(atividade => {
                        const posicao = getHoraPosicao(atividade.horaInicio)
                        const duracao = getDuracaoSlots(atividade.horaInicio, atividade.horaFim)

                        return (
                          <div
                            key={atividade.id}
                            className="absolute inset-x-1"
                            style={{
                              top: `${posicao * 50}px`,
                              height: `${Math.max(48, duracao * 50 - 4)}px`,
                            }}
                          >
                            <CardAtividade
                              atividade={atividade}
                              onClick={() => handleCardClick(atividade)}
                              onDragStart={(e) => handleDragStart(e, atividade)}
                              isDragging={draggedAtividade?.id === atividade.id}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA 3 (DIREITA): Próximas Atividades + Resumo */}
        <div className="flex flex-col gap-4">
          {/* Próximas Atividades */}
          <Card className="shadow-sm rounded-sm">
            <CardHeader className="p-4 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-semibold">Próximas</CardTitle>
                  <div className="flex items-center gap-1.5 rounded-sm bg-[#46347F]/10 px-2 py-0.5">
                    <Clock className="h-3 w-3 text-[#46347F]" />
                    <span className="text-xs font-semibold text-[#46347F]">{proximasAtividades.length}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8 text-[#46347F]">
                  Ver Todas
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {proximasAtividades.map((ativ) => {
                  const config = TIPOS_CONFIG[ativ.tipo]
                  const Icon = config.icon
                  const eDiaHoje = ativ.data.toDateString() === hoje.toDateString()
                  return (
                    <div
                      key={ativ.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors cursor-pointer"
                      onClick={() => handleCardClick(ativ)}
                    >
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-sm",
                        config.corFundo
                      )}>
                        <Icon className={cn("h-4 w-4", config.corTexto)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{ativ.titulo}</p>
                        <p className="text-xs text-muted-foreground truncate">{ativ.contato} · {ativ.empresa}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-semibold text-foreground">{ativ.horaInicio}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {eDiaHoje ? "Hoje" : ativ.data.toLocaleDateString("pt-BR", { weekday: "short" })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Atividades por Dia */}
          <Card className="shadow-sm rounded-sm">
            <CardHeader className="p-4 pb-3">
              <CardTitle className="text-base font-semibold">Resumo Semanal</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-3">
                {DIAS_SEMANA.slice(1, 6).map((dia, index) => {
                  const diaReal = diasSemana[index + 1]
                  const count = atividadesFiltradas.filter(a =>
                    new Date(a.data).toDateString() === diaReal?.toDateString()
                  ).length
                  const eDiaHoje = diaReal?.toDateString() === hoje.toDateString()
                  const maxCount = 5
                  return (
                    <div key={dia} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-xs font-medium",
                          eDiaHoje ? "text-[#46347F] font-bold" : "text-foreground"
                        )}>
                          {dia} {diaReal?.getDate()}
                          {eDiaHoje && (
                            <span className="ml-1 text-[10px] bg-[#46347F]/10 text-[#46347F] px-1.5 py-0.5 rounded-full">
                              hoje
                            </span>
                          )}
                        </span>
                        <span className="text-xs font-semibold text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-sm overflow-hidden">
                        <div
                          className="h-full rounded-sm bg-gradient-to-r from-[#46347F] to-[#46347F] transition-all"
                          style={{ width: `${Math.min((count / maxCount) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Produtividade */}
          <Card className="shadow-sm rounded-sm">
            <CardHeader className="p-4 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Produtividade</CardTitle>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-xs font-medium text-green-600">+12%</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-sm bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground">Concluídas</p>
                  <p className="text-lg font-bold text-foreground">42</p>
                </div>
                <div className="rounded-sm bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground">Canceladas</p>
                  <p className="text-lg font-bold text-foreground">3</p>
                </div>
              </div>
              <div className="rounded-sm bg-green-50 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <p className="text-xs font-medium text-green-700">Meta Mensal</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-green-800">76% concluído</p>
                  <p className="text-xs text-green-600">42/55</p>
                </div>
                <div className="mt-2 h-2 bg-green-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: "76%" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Sidebar de Contato ── */}
      <ContactDetailPanel
        contact={selectedContact || undefined}
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
      />

      {/* ── Modais ── */}
      <ModalNovaAtividade
        aberto={modalNovaAtividadeAberta}
        onFechar={fecharModalNovaAtividade}
        onSalvar={handleSalvarAtividade}
        tipoInicial={defaultTipoFiltro !== "todos" ? defaultTipoFiltro : "reuniao"}
      />

      <ModalDetalhes
        atividade={atividadeSelecionada}
        onFechar={() => setAtividadeSelecionada(null)}
      />
    </div>
  )
}
