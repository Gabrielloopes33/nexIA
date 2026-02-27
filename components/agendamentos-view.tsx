"use client"

import { useState, useMemo, useCallback } from "react"
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
  GripVertical,
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
import { ContactDetailPanel } from "@/components/contact-detail-panel"
import { Contact } from "@/lib/mock/contacts"

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
    corFundo: "bg-[#9795e4]/10",
    corTexto: "text-[#6b69c9]", 
    corBorda: "border-[#9795e4]/30"
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
  // Sexta-feira
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
    "bg-[#9795e4] text-white",
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
  return h - 6 // 6h é o início do calendário
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
      {/* Drag Handle */}
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
              <label className="text-sm font-medium">Horário</label>
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onFechar}>Cancelar</Button>
          <Button className="bg-[#9795e4] hover:bg-[#7b79c4] text-white">Salvar</Button>
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
          <Button className="bg-[#9795e4] hover:bg-[#7b79c4] text-white">
            Editar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function AgendamentosView() {
  const [semanaOffset, setSemanaOffset] = useState(0)
  const [tipoFiltro, setTipoFiltro] = useState<TipoAtividade | "todos">("todos")
  const [modalNovaAtividade, setModalNovaAtividade] = useState(false)
  const [atividadeSelecionada, setAtividadeSelecionada] = useState<Atividade | null>(null)
  const [atividades, setAtividades] = useState<Atividade[]>(ATIVIDADES_MOCK)
  const [draggedAtividade, setDraggedAtividade] = useState<Atividade | null>(null)
  
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)

  // Calcular dias da semana atual
  const diasSemana = useMemo(() => {
    const hoje = new Date()
    const inicioSemana = new Date(hoje)
    inicioSemana.setDate(hoje.getDate() - hoje.getDay() + (semanaOffset * 7))
    
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
      if (tipoFiltro !== "todos" && a.tipo !== tipoFiltro) return false
      const dataAtividade = new Date(a.data)
      return dataAtividade >= dataInicio && dataAtividade <= dataFim
    })
  }, [atividades, tipoFiltro, dataInicio, dataFim])

  // Contar atividades por tipo
  const contagemPorTipo = useMemo(() => {
    const contagem: Record<TipoAtividade | "todos", number> = {
      todos: atividades.length,
      ligacao: 0,
      reuniao: 0,
      tarefa: 0,
      prazo: 0,
      email: 0,
    }
    atividades.forEach(a => {
      contagem[a.tipo]++
    })
    return contagem
  }, [atividades])

  // Drag & Drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, atividade: Atividade) => {
    setDraggedAtividade(atividade)
    e.dataTransfer.effectAllowed = "move"
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, diaIndex: number, hora?: number) => {
    e.preventDefault()
    if (!draggedAtividade) return

    // Calcular nova data
    const novaData = new Date(diasSemana[diaIndex])
    
    // Calcular nova hora
    let novaHoraInicio: string
    let novaHoraFim: string
    
    if (hora !== undefined) {
      // Drop em uma célula específica de hora
      novaHoraInicio = formatarHora(hora)
      const duracao = getDuracaoSlots(draggedAtividade.horaInicio, draggedAtividade.horaFim)
      novaHoraFim = formatarHora(hora + duracao)
    } else {
      // Drop na coluna do dia - manter hora original
      const horaOriginal = parseInt(draggedAtividade.horaInicio.split(":")[0])
      novaHoraInicio = draggedAtividade.horaInicio
      novaHoraFim = draggedAtividade.horaFim
    }

    // Atualizar atividade
    setAtividades(prev => prev.map(a => {
      if (a.id === draggedAtividade.id) {
        return {
          ...a,
          data: novaData,
          horaInicio: novaHoraInicio,
          horaFim: novaHoraFim
        }
      }
      return a
    }))

    setDraggedAtividade(null)
  }, [draggedAtividade, diasSemana])

  // Abrir sidebar com contato
  const handleCardClick = useCallback((atividade: Atividade) => {
    // Criar objeto Contact baseado na atividade
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
      leadScore: Math.floor(Math.random() * 100),
      status: "ativo",
      origem: "Agenda",
      criadoEm: atividade.data.toISOString(),
      atualizadoEm: new Date().toISOString(),
      atualizadoPor: "Sistema",
      avatar: atividade.avatar,
      avatarBg: "#9795e4",
    }
    
    setSelectedContact(contato)
    setIsSidebarOpen(true)
  }, [])

  const handleCloseSidebar = useCallback(() => {
    setIsSidebarOpen(false)
    setTimeout(() => setSelectedContact(null), 200)
  }, [])

  const hoje = new Date()
  const eSemanaAtual = semanaOffset === 0

  return (
    <div className="flex flex-col h-full bg-background">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 border-b border-gray-200 bg-white px-6 py-4">
        {/* Top Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">Atividades</h1>
            
            {/* Toggle View */}
            <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5">
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

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Button 
              className="gap-2 bg-[#9795e4] hover:bg-[#7b79c4] text-white"
              onClick={() => setModalNovaAtividade(true)}
            >
              <Plus className="h-4 w-4" />
              Atividade
            </Button>
            
            <Button variant="outline" className="gap-2">
              Propor horário
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>

            {/* Week Navigation */}
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

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSemanaOffset(0)}
              disabled={eSemanaAtual}
            >
              Hoje
            </Button>

            {/* User Selector */}
            <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
              <div className="h-6 w-6 rounded-full bg-[#9795e4] flex items-center justify-center text-xs text-white font-medium">
                EU
              </div>
              <span>Eu</span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setTipoFiltro("todos")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
              tipoFiltro === "todos" 
                ? "bg-[#9795e4] text-white" 
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
                    ? "bg-[#9795e4] text-white"
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
        </div>
      </div>

      {/* ── Calendar Grid ── */}
      <div className="flex-1 overflow-auto bg-white">
        <div className="min-w-[1000px] p-4">
          {/* Header dos Dias */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {diasSemana.map((dia, index) => {
              const eDiaHoje = dia.toDateString() === hoje.toDateString()
              return (
                <div 
                  key={index}
                  className={cn(
                    "text-center py-2 rounded-lg",
                    eDiaHoje ? "bg-[#9795e4]/10 border border-[#9795e4]/30" : "bg-gray-50"
                  )}
                >
                  <p className={cn(
                    "text-xs font-medium",
                    eDiaHoje ? "text-[#9795e4]" : "text-gray-500"
                  )}>
                    {DIAS_SEMANA[index]}
                  </p>
                  <p className={cn(
                    "text-lg font-bold",
                    eDiaHoje ? "text-[#9795e4]" : "text-gray-900"
                  )}>
                    {dia.getDate()}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Grid do Calendário */}
          <div className="grid grid-cols-7 gap-2">
            {diasSemana.map((dia, diaIndex) => {
              const atividadesDia = atividadesFiltradas.filter(a => 
                new Date(a.data).toDateString() === dia.toDateString()
              )
              const eDiaHoje = dia.toDateString() === hoje.toDateString()

              return (
                <div 
                  key={diaIndex}
                  className={cn(
                    "relative min-h-[600px] rounded-lg border",
                    eDiaHoje ? "border-[#9795e4]/30 bg-[#9795e4]/5" : "border-gray-200 bg-gray-50/50"
                  )}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, diaIndex)}
                >
                  {/* Células de Horário (drop targets) */}
                  {HORARIOS.map((hora) => (
                    <div 
                      key={hora}
                      className="h-[60px] border-b border-gray-100 last:border-b-0 hover:bg-gray-100/50 transition-colors"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, diaIndex, hora)}
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
      
      {/* ── Sidebar de Contato ── */}
      <ContactDetailPanel 
        contact={selectedContact || undefined}
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
      />
      
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
