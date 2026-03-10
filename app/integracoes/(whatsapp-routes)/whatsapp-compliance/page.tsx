"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  CheckCircle2, 
  AlertTriangle,
  XCircle,
  Shield,
  MessageSquare,
  Award,
  FileText,
  Clock,
  ChevronRight
} from "lucide-react"

interface ComplianceItem {
  id: string
  titulo: string
  descricao: string
  status: "ok" | "warning" | "error"
  acao?: string
}

const politicas: ComplianceItem[] = [
  { id: "1", titulo: "Opt-in configurado", descricao: "Consentimento do usuário para receber mensagens", status: "ok" },
  { id: "2", titulo: "Horário de funcionamento", descricao: "Respeito ao horário comercial (9h-18h)", status: "ok" },
  { id: "3", titulo: "Template de opt-out", descricao: "Mensagem de cancelamento de inscrição", status: "warning", acao: "Corrigir" },
]

const qualidade: ComplianceItem[] = [
  { id: "4", titulo: "Taxa de qualidade", descricao: "Baseada em feedback dos usuários", status: "ok" },
  { id: "5", titulo: "Limite de mensagens", descricao: "Tier atual: 1.000 mensagens/dia", status: "ok" },
  { id: "6", titulo: "Templates rejeitados", descricao: "1 template precisa de revisão", status: "warning", acao: "Revisar" },
]

const verificacao: ComplianceItem[] = [
  { id: "7", titulo: "Green Tick", descricao: "Verificação oficial do WhatsApp Business", status: "error", acao: "Solicitar" },
]

export default function CompliancePage() {
  const score = 87
  const totalItens = [...politicas, ...qualidade, ...verificacao].length
  const okCount = [...politicas, ...qualidade, ...verificacao].filter(i => i.status === "ok").length

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok": return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "warning": return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case "error": return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-amber-600"
    return "text-red-600"
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: "Bom", color: "bg-green-100 text-green-700" }
    if (score >= 60) return { label: "Regular", color: "bg-amber-100 text-amber-700" }
    return { label: "Crítico", color: "bg-red-100 text-red-700" }
  }

  const scoreBadge = getScoreBadge(score)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Compliance WhatsApp Business</h1>
          <p className="text-sm text-muted-foreground">
            Verificação de conformidade com as políticas do WhatsApp
          </p>
        </div>
      </div>

      {/* Score Card */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative h-24 w-24">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-muted"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className={score >= 80 ? "text-green-500" : score >= 60 ? "text-amber-500" : "text-red-500"}
                  strokeDasharray={`${score}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold">Score de Compliance</h2>
                <Badge className={scoreBadge.color}>{scoreBadge.label}</Badge>
              </div>
              <Progress value={score} className="h-2 mb-2" />
              <p className="text-sm text-muted-foreground">
                {okCount} de {totalItens} itens em conformidade
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Política de Mensagens */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#46347F]" />
            Política de Mensagens
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {politicas.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 hover:bg-muted/30">
                <div className="flex items-center gap-3">
                  {getStatusIcon(item.status)}
                  <div>
                    <p className="font-medium text-sm">{item.titulo}</p>
                    <p className="text-xs text-muted-foreground">{item.descricao}</p>
                  </div>
                </div>
                {item.acao ? (
                  <Button variant="outline" size="sm" className="border-0 shadow-sm text-amber-600">
                    {item.acao}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    OK
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Qualidade da Conta */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Award className="h-4 w-4 text-[#46347F]" />
            Qualidade da Conta
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {qualidade.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 hover:bg-muted/30">
                <div className="flex items-center gap-3">
                  {getStatusIcon(item.status)}
                  <div>
                    <p className="font-medium text-sm">{item.titulo}</p>
                    <p className="text-xs text-muted-foreground">{item.descricao}</p>
                  </div>
                </div>
                {item.acao ? (
                  <Button variant="outline" size="sm" className="border-0 shadow-sm text-amber-600">
                    {item.acao}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Badge className="bg-green-100 text-green-700">
                    GREEN
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Verificação */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#46347F]" />
            Verificação
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {verificacao.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 hover:bg-muted/30">
                <div className="flex items-center gap-3">
                  {getStatusIcon(item.status)}
                  <div>
                    <p className="font-medium text-sm">{item.titulo}</p>
                    <p className="text-xs text-muted-foreground">{item.descricao}</p>
                  </div>
                </div>
                {item.acao && (
                  <Button className="gap-2 bg-[#46347F] hover:bg-[#46347F]">
                    {item.acao}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
