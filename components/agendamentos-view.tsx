"use client"

import { useState, useMemo } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  X,
  Phone,
  Video,
  Users,
  CalendarDays,
  Clock,
  Mail,
  FileText,
  MoreHorizontal,
  List,
  ChevronDown,
  Calendar as CalendarIcon,
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

// ─── Types ──────────────────────────────────────────────────────────────────

type TipoAtividade = "ligacao" | "reuniao" | "tarefa" | "prazo" | "email"
type StatusAtividade = "confirmado" | "pendente" | "cancelado"

interface Atividade {
  id: number
  titulo: string
  contato: string
  empresa: string
  data: Date
  horaInicio: string
  horaFim: string
  tipo: TipoAtividade
  status: StatusAtividade
  local?: string
  descricao?: string
  avatar: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COR_PRIMARIA = "#9795e4"

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
    corFundo: "bg-purple-50",
    corTexto: "text-purple-700", 
    corBorda: "border-purple-200"
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
  email: { 
    label: "Email", 
    icon: Mail, 
    corFundo: "bg-emerald-50",
    corTexto: "text-emerald-700",
    corBorda: "border-emerald-200"
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
  // Segunda-feira
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
  // Terça-feira
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
    titulo: "Campanha Email",
    contato: "Lista Prospects",
    empresa: "Marketing",
    data: gerarDataSemana(0, 2, 13, 0),
    horaInicio: "13:00",
    horaFim: "13:30",
    tipo: "email",
    status: "confirmado",
    descricao: "Disparar campanha de nurture",
    avatar: "MK",
  },
  // Quarta-feira
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
  // Quinta-feira
  {
    id: 10,
    titulo: "Revisão Pipeline",
    contato: "Gerentes",
    empresa: "Interno",
    data: gerarDataSemana(0, 4, 11, 0),
    horaInicio: "11:00",
    horaFim: "12:00",
    tipo: "reuniao",
    status: "confirmado",
    local: "Sala de Reuniões B",
    descricao: "Revisão semanal do funil de vendas",
    avatar: "GR",
  },
  {
    id: 11,
    titulo: "Retorno Cliente",
    contato: "Ana Costa",
    empresa: "GrowthLab",
    data: gerarDataSemana(0, 4, 14, 30),
    horaInicio: "14:30",
    horaFim: "15:00",
    tipo: "ligacao",
    status: "pendente",
    descricao: "Retornar sobre dúvidas técnicas",
    avatar: "AC",
  },
  {
    id: 12,
    titulo: "Atualizar CRM",
    contato: "Vários",
    empresa: "Interno",
    data: gerarDataSemana(0, 4, 16, 0),
    horaInicio: "16:00",
    horaFim: "17:00",
    tipo: "tarefa",
    status: "pendente",
    descricao: "Atualizar informações dos leads do dia",
    avatar: "CR",
  },
  // Sexta-feira
  {
    id: 13,
    titulo: "Kickoff Projeto",
    contato: "Pedro Alves",
    empresa: "Startup Hub",
    data: gerarDataSemana(0, 5, 13, 0),
    horaInicio: "13:00",
    horaFim: "15:00",
    tipo: "reuniao",
    status: "confirmado",
    local: "Google Meet",
    descricao: "Início do projeto de implementação",
    avatar: "PA",
  },
  {
    id: 14,
    titulo: "Proposta Comercial",
    contato: "Maria Santos",
    empresa: "InnovaTech",
    data: gerarDataSemana(0, 5, 10, 0),
    horaInicio: "10:00",
    horaFim: "11:00",
    tipo: "tarefa",
    status: "pendente",
    descricao: "Elaborar proposta customizada",
    avatar: "MS",
  },
  {
    id: 15,
    titulo: "Newsletter Semanal",
    contato: "Base de Leads",
    empresa: "Marketing",
    data: gerarDataSemana(0, 5, 15, 0),
    horaInicio: "15:00",
    horaFim: "15:30",
    tipo: "email",
    status: "confirmado",
    avatar: "NL",
  },
]

// ─── Helper Functions ────────────────────────────────────────────────────────

function avatarColor(initials: string): string {
  const colors = [
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-cyan-100 text-cyan-700",
    "bg-indigo-100 text-indigo-700",
  ]
  const idx = initials.charCodeAt(0) % colors.length
  return colors[idx]
}

function formatarDataSemana(inicio: Date, fim: Date): string {
  const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
  const inicioDia = inicio.getDate()
  const inicioMes = meses[inicio.getMonth()]
  const fimDia = fim.getDate()
  const fimMes = meses[fim.getMonth()]
  
  if (inicio.getMonth() === fim.getMonth()) {
    return `${inicioDia} - ${fimDia} de ${inicioMes}`
  }
  return `${inicioDia} de ${inicioMes} - ${fimDia} de ${fimMes}`
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

// ─── Sub-components ──────────────────────────────────────────────────────────

function FiltroTipo({ 
  tipo, 
  ativo, 
  onClick, 
  count 
}: { 
  tipo: TipoAtividade | "todos"
  ativo: boolean
  onClick: () => void
  count: number
}) {
  const config = tipo === "todos" 
    ? { label: "Todos", icon: CalendarDays, corFundo: "bg-gray-100", corTexto: "text-gray-700" }
    : TIPOS_CONFIG[tipo]
  
  const Icon = config.icon
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
        ativo 
          ? "bg-[#9795e4] text-white shadow-sm" 
          : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{config.label}</span>
      <span className={cn(
        "ml-1 rounded-full px-1.5 py-0.5 text-xs",
        ativo ? "bg-white/20" : "bg-gray-100"
      )}>
        {count}
      </span>
    </button>
  )
}

function CardAtividade({ 
  atividade, 
  onClick 
}: { 
  atividade: Atividade
  onClick: () => void
}) {
  const config = TIPOS_CONFIG[atividade.tipo]
  const avatarClass = avatarColor(atividade.avatar)
  const duracaoSlots = getDuracaoSlots(atividade.horaInicio, atividade.horaFim)
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "group absolute inset-x-1 cursor-pointer rounded-lg border p-2 transition-all hover:shadow-md hover:scale-[1.02]",
        config.corFundo,
        config.corBorda,
        duracaoSlots > 1 ? "min-h-full" : ""
      )}
      style={{
        minHeight: duracaoSlots > 1 ? `${duracaoSlots * 100}%` : undefined
      }}
    >
      <div className="flex items-start justify-between gap-1">
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

function ModalNovaAtividade({ 
  aberto, 
  onFechar 
}: { 
  aberto: boolean
  onFechar: () => void
}) {
  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Atividade</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da nova atividade abaixo.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Título</label>
            <input 
              placeholder="Ex: Reunião de alinhamento..."
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-[#9795e4] focus:outline-none focus:ring-2 focus:ring-[#9795e4]/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Data</label>
              <input 
                type="date"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-[#9795e4] focus:outline-none focus:ring-2 focus:ring-[#9795e4]/20"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tipo</label>
              <select className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-[#9795e4] focus:outline-none focus:ring-2 focus:ring-[#9795e4]/20">
                <option value="reuniao">Reunião</option>
                <option value="ligacao">Ligação</option>
                <option value="tarefa">Tarefa</option>
                <option value="prazo">Prazo</option>
                <option value="email">Email</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Início</label>
              <input 
                type="time"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-[#9795e4] focus:outline-none focus:ring-2 focus:ring-[#9795e4]/20"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Fim</label>
              <input 
                type="time"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-[#9795e4] focus:outline-none focus:ring-2 focus:ring-[#9795e4]/20"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Contato</label>
            <input 
              placeholder="Nome do contato..."
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-[#9795e4] focus:outline-none focus:ring-2 focus:ring-[#9795e4]/20"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Local / Link</label>
            <input 
              placeholder="Google Meet, Zoom, endereço..."
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-[#9795e4] focus:outline-none focus:ring-2 focus:ring-[#9795e4]/20"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Descrição</label>
            <textarea 
              rows={3}
              placeholder="Detalhes adicionais..."
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-[#9795e4] focus:outline-none focus:ring-2 focus:ring-[#9795e4]/20 resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onFechar}>
            Cancelar
          </Button>
          <Button 
            onClick={onFechar}
            style={{ backgroundColor: COR_PRIMARIA }}
            className="hover:opacity-90"
          >
            Salvar Atividade
          </Button>
        </DialogFooter>
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
  const avatarClass = avatarColor(atividade.avatar)
  
  return (
    <Dialog open={!!atividade} onOpenChange={onFechar}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", config.corFundo)}>
              <Icon className={cn("h-5 w-5", config.corTexto)} />
            </div>
            <div>
              <DialogTitle className="text-lg">{atividade.titulo}</DialogTitle>
              <DialogDescription>
                {config.label} • {atividade.status === "confirmado" ? "Confirmado" : atividade.status === "pendente" ? "Pendente" : "Cancelado"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {/* Data e Horário */}
          <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
            <CalendarDays className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {atividade.data.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              <p className="text-sm text-gray-600">
                {atividade.horaInicio} - {atividade.horaFim}
              </p>
            </div>
          </div>
          
          {/* Contato */}
          <div className="flex items-center gap-3">
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold", avatarClass)}>
              {atividade.avatar}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{atividade.contato}</p>
              <p className="text-sm text-gray-600">{atividade.empresa}</p>
            </div>
          </div>
          
          {/* Local */}
          {atividade.local && (
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gray-500" />
              <p className="text-sm text-gray-700">{atividade.local}</p>
            </div>
          )}
          
          {/* Descrição */}
          {atividade.descricao && (
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">Descrição</p>
              <p className="text-sm text-gray-700">{atividade.descricao}</p>
            </div>
          )}
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onFechar}>
            Fechar
          </Button>
          <Button 
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            Cancelar
          </Button>
          <Button 
            style={{ backgroundColor: COR_PRIMARIA }}
            className="hover:opacity-90"
          >
            Editar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AgendamentosView() {
  const [semanaOffset, setSemanaOffset] = useState(0)
  const [visualizacao, setVisualizacao] = useState<"calendario" | "lista">("calendario")
  const [filtroTipo, setFiltroTipo] = useState<TipoAtividade | "todos">("todos")
  const [modalNovaAtividade, setModalNovaAtividade] = useState(false)
  const [atividadeSelecionada, setAtividadeSelecionada] = useState<Atividade | null>(null)
  
  // Calcular datas da semana atual
  const { inicioSemana, fimSemana, diasSemana } = useMemo(() => {
    const hoje = new Date()
    const inicio = new Date(hoje)
    inicio.setDate(hoje.getDate() - hoje.getDay() + (semanaOffset * 7))
    inicio.setHours(0, 0, 0, 0)
    
    const fim = new Date(inicio)
    fim.setDate(inicio.getDate() + 6)
    fim.setHours(23, 59, 59, 999)
    
    const dias = Array.from({ length: 7 }, (_, i) => {
      const dia = new Date(inicio)
      dia.setDate(inicio.getDate() + i)
      return dia
    })
    
    return { inicioSemana: inicio, fimSemana: fim, diasSemana: dias }
  }, [semanaOffset])
  
  // Filtrar atividades da semana atual
  const atividadesFiltradas = useMemo(() => {
    return ATIVIDADES_MOCK.filter(atividade => {
      const naSemana = atividade.data >= inicioSemana && atividade.data <= fimSemana
      const doTipo = filtroTipo === "todos" || atividade.tipo === filtroTipo
      return naSemana && doTipo
    })
  }, [inicioSemana, fimSemana, filtroTipo])
  
  // Contar atividades por tipo
  const contagemTipos = useMemo(() => {
    const contagem: Record<string, number> = { todos: ATIVIDADES_MOCK.length }
    Object.keys(TIPOS_CONFIG).forEach(tipo => {
      contagem[tipo] = ATIVIDADES_MOCK.filter(a => a.tipo === tipo).length
    })
    return contagem
  }, [])
  
  // Agrupar atividades por dia
  const atividadesPorDia = useMemo(() => {
    const agrupado: Record<number, Atividade[]> = {}
    diasSemana.forEach((_, index) => {
      agrupado[index] = []
    })
    
    atividadesFiltradas.forEach(atividade => {
      const diaSemana = atividade.data.getDay()
      if (!agrupado[diaSemana]) agrupado[diaSemana] = []
      agrupado[diaSemana].push(atividade)
    })
    
    return agrupado
  }, [atividadesFiltradas, diasSemana])
  
  const hoje = new Date()
  const eHoje = semanaOffset === 0
  
  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      
      {/* ── Header ── */}
      <div className="flex flex-col gap-4">
        {/* Linha 1: Título e Ações Principais */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Atividades</h1>
            
            {/* Toggle Lista/Calendário */}
            <div className="flex items-center rounded-lg border border-gray-200 bg-white p-1">
              <button
                onClick={() => setVisualizacao("calendario")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                  visualizacao === "calendario" 
                    ? "bg-gray-100 text-gray-900" 
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <CalendarIcon className="h-4 w-4" />
                Calendário
              </button>
              <button
                onClick={() => setVisualizacao("lista")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                  visualizacao === "lista" 
                    ? "bg-gray-100 text-gray-900" 
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <List className="h-4 w-4" />
                Lista
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2 border-gray-300"
            >
              <Clock className="h-4 w-4" />
              Propor horário
            </Button>
            <Button
              onClick={() => setModalNovaAtividade(true)}
              className="gap-2 text-white"
              style={{ backgroundColor: COR_PRIMARIA }}
            >
              <Plus className="h-4 w-4" />
              Atividade
            </Button>
          </div>
        </div>
        
        {/* Linha 2: Navegação e Filtros */}
        <div className="flex items-center justify-between">
          {/* Navegação Semanal */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSemanaOffset(s => s - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSemanaOffset(0)}
              disabled={eHoje}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                eHoje 
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              )}
            >
              Hoje
            </button>
            <button
              onClick={() => setSemanaOffset(s => s + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="ml-2 text-lg font-semibold text-gray-900">
              {formatarDataSemana(inicioSemana, fimSemana)}
            </span>
          </div>
          
          {/* Selector de Usuário (mock) */}
          <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#9795e4] to-[#b3b3e5] text-[10px] font-bold text-white">
              VC
            </div>
            <span>Você</span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
        </div>
        
        {/* Linha 3: Filtros por Tipo */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <FiltroTipo 
            tipo="todos" 
            ativo={filtroTipo === "todos"} 
            onClick={() => setFiltroTipo("todos")}
            count={contagemTipos.todos}
          />
          {(Object.keys(TIPOS_CONFIG) as TipoAtividade[]).map(tipo => (
            <FiltroTipo 
              key={tipo}
              tipo={tipo} 
              ativo={filtroTipo === tipo} 
              onClick={() => setFiltroTipo(tipo)}
              count={contagemTipos[tipo] || 0}
            />
          ))}
        </div>
      </div>
      
      {/* ── Calendário Semanal ── */}
      <div className="flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex h-full">
          {/* Coluna de Horários */}
          <div className="w-16 flex-shrink-0 border-r border-gray-200 bg-gray-50">
            <div className="h-14 border-b border-gray-200" /> {/* Header vazio */}
            <div className="relative h-[calc(100%-3.5rem)] overflow-hidden">
              {HORARIOS.map((hora, index) => (
                <div 
                  key={hora}
                  className="absolute left-0 right-0 flex items-center justify-center border-b border-gray-100 text-xs text-gray-500"
                  style={{ 
                    top: `${index * 60}px`, 
                    height: "60px",
                    transform: "translateY(-50%)"
                  }}
                >
                  {hora}h
                </div>
              ))}
            </div>
          </div>
          
          {/* Grid de Dias */}
          <div className="flex flex-1 overflow-hidden">
            {diasSemana.map((dia, diaIndex) => {
              const atividadesDia = atividadesPorDia[diaIndex] || []
              const eDiaHoje = eHoje && dia.getDate() === hoje.getDate()
              
              return (
                <div 
                  key={diaIndex} 
                  className={cn(
                    "flex flex-1 flex-col border-r border-gray-200 last:border-r-0",
                    diaIndex === 0 || diaIndex === 6 ? "bg-gray-50/50" : "bg-white"
                  )}
                >
                  {/* Header do Dia */}
                  <div className={cn(
                    "flex h-14 flex-col items-center justify-center border-b",
                    eDiaHoje ? "border-b-2 border-b-[#9795e4] bg-[#9795e4]/5" : "border-gray-200"
                  )}>
                    <span className={cn(
                      "text-xs font-medium",
                      eDiaHoje ? "text-[#9795e4]" : "text-gray-500"
                    )}>
                      {DIAS_SEMANA[diaIndex]}
                    </span>
                    <span className={cn(
                      "text-lg font-bold",
                      eDiaHoje ? "text-[#9795e4]" : "text-gray-900"
                    )}>
                      {dia.getDate()}
                    </span>
                  </div>
                  
                  {/* Células de Horário */}
                  <div className="relative flex-1 overflow-y-auto">
                    {HORARIOS.map((_, horaIndex) => (
                      <div 
                        key={horaIndex}
                        className="h-[60px] border-b border-gray-100 last:border-b-0"
                      />
                    ))}
                    
                    {/* Cards de Atividades */}
                    {atividadesDia.map(atividade => {
                      const posicao = getHoraPosicao(atividade.horaInicio)
                      const duracao = getDuracaoSlots(atividade.horaInicio, atividade.horaFim)
                      
                      return (
                        <div
                          key={atividade.id}
                          className="absolute inset-x-1"
                          style={{
                            top: `${posicao * 60}px`,
                            height: `${Math.max(58, duracao * 60 - 4)}px`,
                          }}
                        >
                          <CardAtividade 
                            atividade={atividade}
                            onClick={() => setAtividadeSelecionada(atividade)}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* ── Modais ── */}
      <ModalNovaAtividade 
        aberto={modalNovaAtividade} 
        onFechar={() => setModalNovaAtividade(false)} 
      />
      
      <ModalDetalhes 
        atividade={atividadeSelecionada}
        onFechar={() => setAtividadeSelecionada(null)}
      />
    </div>
  )
}
