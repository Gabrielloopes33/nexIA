"use client"

import { useState } from "react"
import {
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  FileText,
  Mic,
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Loader2,
  Calendar,
  Headphones,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useTranscriptions, Transcription } from "@/hooks/use-transcriptions"
import { TranscriptionStatus, TranscriptionSource } from "@prisma/client"

const STATUS_CONFIG: Record<TranscriptionStatus, {
  label: string
  color: string
  bgColor: string
  icon: React.ElementType
}> = {
  PENDING: {
    label: "Pendente",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    icon: Clock,
  },
  PROCESSING: {
    label: "Processando",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    icon: Loader2,
  },
  COMPLETED: {
    label: "Concluído",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    icon: CheckCircle2,
  },
  FAILED: {
    label: "Falhou",
    color: "text-red-600",
    bgColor: "bg-red-50",
    icon: AlertCircle,
  },
}

const SOURCE_LABELS: Record<TranscriptionSource, string> = {
  WHATSAPP_CALL: "WhatsApp Call",
  WHATSAPP_AUDIO: "WhatsApp Áudio",
  PHONE_CALL: "Ligação Telefônica",
  MEETING: "Reunião",
  UPLOAD: "Upload",
}

const SENTIMENT_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  positive: { label: "Positivo", color: "text-emerald-600", icon: ThumbsUp },
  negative: { label: "Negativo", color: "text-red-600", icon: ThumbsDown },
  neutral: { label: "Neutro", color: "text-gray-600", icon: Minus },
}

function TranscriptionCard({
  transcription,
  onClick,
}: {
  transcription: Transcription
  onClick: () => void
}) {
  const statusConfig = STATUS_CONFIG[transcription.status]
  const StatusIcon = statusConfig.icon
  const sentiment = transcription.sentiment
    ? SENTIMENT_CONFIG[transcription.sentiment]
    : null
  const SentimentIcon = sentiment?.icon

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "--:--"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card
      className="group hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-12 w-12">
            <AvatarImage src={transcription.contact?.avatarUrl || undefined} />
            <AvatarFallback className="bg-[#46347F] text-white">
              {getInitials(transcription.contact?.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold text-foreground truncate">
                  {transcription.title || "Ligação sem título"}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {transcription.contact?.name || transcription.contact?.phone || "Contato desconhecido"}
                </p>
              </div>
              <Badge variant="secondary" className={cn(statusConfig.bgColor, statusConfig.color)}>
                <StatusIcon className={cn("h-3 w-3 mr-1", transcription.status === "PROCESSING" && "animate-spin")} />
                {statusConfig.label}
              </Badge>
            </div>

            {/* Info Row */}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {SOURCE_LABELS[transcription.source]}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(transcription.duration)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(transcription.createdAt)}
              </span>
              {sentiment && SentimentIcon && (
                <span className={cn("flex items-center gap-1", sentiment.color)}>
                  <SentimentIcon className="h-3 w-3" />
                  {sentiment.label}
                </span>
              )}
            </div>

            {/* Summary Preview */}
            {transcription.summary && (
              <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                {transcription.summary}
              </p>
            )}

            {/* Key Topics */}
            {transcription.keyTopics && transcription.keyTopics.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {transcription.keyTopics.slice(0, 4).map((topic) => (
                  <Badge key={topic} variant="outline" className="text-[10px]">
                    {topic}
                  </Badge>
                ))}
                {transcription.keyTopics.length > 4 && (
                  <Badge variant="outline" className="text-[10px]">
                    +{transcription.keyTopics.length - 4}
                  </Badge>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <div className="flex items-center gap-4 text-xs">
                {transcription.converted && (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" />
                    Convertido
                  </span>
                )}
                {transcription.resolutionDays && (
                  <span className="text-muted-foreground">
                    Resolvido em {transcription.resolutionDays} dias
                  </span>
                )}
              </div>
              <Button variant="ghost" size="sm" className="h-8 text-[#46347F]">
                <FileText className="h-4 w-4 mr-1" />
                Ver Detalhes
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TranscriptionDetailModal({
  transcription,
  isOpen,
  onClose,
}: {
  transcription: Transcription | null
  isOpen: boolean
  onClose: () => void
}) {
  const [showFullTranscript, setShowFullTranscript] = useState(false)

  if (!transcription) return null

  const sentiment = transcription.sentiment
    ? SENTIMENT_CONFIG[transcription.sentiment]
    : null
  const SentimentIcon = sentiment?.icon

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">
                {transcription.title || "Ligação"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {transcription.contact?.name} · {transcription.contact?.phone}
              </p>
            </div>
            <Badge
              variant="secondary"
              className={STATUS_CONFIG[transcription.status].bgColor}
            >
              {STATUS_CONFIG[transcription.status].label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Grid */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Duração</p>
              <p className="font-medium">
                {transcription.duration
                  ? `${Math.floor(transcription.duration / 60)}:${(transcription.duration % 60)
                      .toString()
                      .padStart(2, "0")}`
                  : "--"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fonte</p>
              <p className="font-medium">{SOURCE_LABELS[transcription.source]}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Data</p>
              <p className="font-medium">
                {new Date(transcription.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sentimento</p>
              <p className={cn("font-medium flex items-center gap-1", sentiment?.color)}>
                {SentimentIcon && <SentimentIcon className="h-3 w-3" />}
                {sentiment?.label || "N/A"}
              </p>
            </div>
          </div>

          {/* Audio Player Placeholder */}
          {transcription.audioUrl && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-2">Gravação</p>
              <audio controls className="w-full" src={transcription.audioUrl}>
                Seu navegador não suporta áudio.
              </audio>
            </div>
          )}

          {/* Summary */}
          {transcription.summary && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#46347F]" />
                Resumo da IA
              </h4>
              <p className="text-sm text-muted-foreground bg-[#46347F]/5 p-4 rounded-lg">
                {transcription.summary}
              </p>
            </div>
          )}

          {/* Key Topics */}
          {transcription.keyTopics && transcription.keyTopics.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Tópicos Principais</h4>
              <div className="flex flex-wrap gap-2">
                {transcription.keyTopics.map((topic) => (
                  <Badge key={topic} variant="secondary">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Action Items */}
          {transcription.actionItems && transcription.actionItems.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Ações Identificadas</h4>
              <ul className="space-y-2">
                {transcription.actionItems.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Objections */}
          {transcription.objections && transcription.objections.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-amber-600">
                Objeções Detectadas
              </h4>
              <ul className="space-y-2">
                {transcription.objections.map((obj: any, index: number) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-muted-foreground bg-amber-50 p-3 rounded-lg"
                  >
                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-amber-700">{obj.type}</p>
                      <p>{obj.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Full Transcript */}
          {transcription.transcript && (
            <div>
              <button
                onClick={() => setShowFullTranscript(!showFullTranscript)}
                className="flex items-center gap-2 text-sm font-semibold text-[#46347F] hover:underline"
              >
                <Mic className="h-4 w-4" />
                Transcrição Completa
                {showFullTranscript ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {showFullTranscript && (
                <div className="mt-2 p-4 bg-gray-50 rounded-lg max-h-64 overflow-auto">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {transcription.transcript}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function CallsHistoryPage() {
  const [selectedStatus, setSelectedStatus] = useState<TranscriptionStatus | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTranscription, setSelectedTranscription] = useState<Transcription | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const filters = {
    status: selectedStatus === "all" ? undefined : selectedStatus,
    limit: 50,
  }

  const { transcriptions, isLoading } = useTranscriptions(filters)

  const filteredTranscriptions = transcriptions.filter((t) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      t.title?.toLowerCase().includes(query) ||
      t.contact?.name?.toLowerCase().includes(query) ||
      t.contact?.phone.includes(query) ||
      t.summary?.toLowerCase().includes(query) ||
      t.transcript?.toLowerCase().includes(query)
    )
  })

  // Stats
  const stats = {
    total: transcriptions.length,
    completed: transcriptions.filter((t) => t.status === "COMPLETED").length,
    pending: transcriptions.filter((t) => t.status === "PENDING").length,
    converted: transcriptions.filter((t) => t.converted).length,
    avgDuration: transcriptions.length > 0
      ? Math.round(
          transcriptions.reduce((acc, t) => acc + (t.duration || 0), 0) /
            transcriptions.length /
            60
        )
      : 0,
  }

  const openDetailModal = (transcription: Transcription) => {
    setSelectedTranscription(transcription)
    setIsDetailModalOpen(true)
  }

  if (isLoading && transcriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-[#46347F]" />
        <p className="mt-4 text-sm text-muted-foreground">Carregando histórico...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Histórico de Ligações</h1>
            <p className="text-sm text-muted-foreground">
              Transcrições e análises de calls com IA
            </p>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-2 bg-[#46347F]/10 rounded-lg">
                <Phone className="h-5 w-5 text-[#46347F]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processadas</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Convertidas</p>
                <p className="text-2xl font-bold">{stats.converted}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa Conversão</p>
                <p className="text-2xl font-bold">
                  {stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0}%
                </p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Média Duração</p>
                <p className="text-2xl font-bold">{stats.avgDuration}m</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          {[
            { key: "all", label: "Todas" },
            { key: "COMPLETED", label: "Concluídas" },
            { key: "PENDING", label: "Pendentes" },
            { key: "FAILED", label: "Falhas" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedStatus(tab.key as any)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                selectedStatus === tab.key
                  ? "bg-white text-[#46347F] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, título, conteúdo..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm"
            />
          </div>
        </div>
      </div>

      {/* Transcriptions List */}
      <div className="flex-1 overflow-auto">
        {filteredTranscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="p-4 bg-gray-100 rounded-full mb-4">
              <Headphones className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-foreground">
              Nenhuma transcrição encontrada
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              {searchQuery
                ? "Nenhum resultado encontrado para sua busca."
                : "As transcrições de calls aparecerão aqui após o processamento."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTranscriptions.map((transcription) => (
              <TranscriptionCard
                key={transcription.id}
                transcription={transcription}
                onClick={() => openDetailModal(transcription)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <TranscriptionDetailModal
        transcription={selectedTranscription}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedTranscription(null)
        }}
      />
    </div>
  )
}
