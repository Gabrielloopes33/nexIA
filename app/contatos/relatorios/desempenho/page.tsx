"use client"

import { useState, useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Flame,
  Target,
  Download,
} from "lucide-react"
import { toast } from "sonner"

import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { MOCK_CONTACTS } from "@/lib/mock/contacts"
import { MOCK_TAGS } from "@/lib/mock/tags"

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number; name: string }>
  label?: string
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border bg-white p-2 shadow-sm text-xs">
        <p className="font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-muted-foreground">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function DesempenhoPage() {
  const [period, setPeriod] = useState("12meses")

  // Cálculos dos KPIs
  const totalContacts = MOCK_CONTACTS.length
  const convertedContacts = MOCK_CONTACTS.filter((c) => c.status === "convertido").length
  const inactiveContacts = MOCK_CONTACTS.filter((c) => c.status === "inativo").length
  const taxaConversao = (convertedContacts / totalContacts) * 100
  const taxaInatividade = (inactiveContacts / totalContacts) * 100

  // Dados do funil
  const activeContacts = MOCK_CONTACTS.filter((c) => c.status === "ativo").length
  const funnelData = [
    { etapa: "Total", valor: totalContacts, fill: "#46347F" },
    { etapa: "Ativos", valor: activeContacts, fill: "#46347F" },
    { etapa: "Convertidos", valor: convertedContacts, fill: "#46347F" },
  ]

  // Desempenho por Tag
  const desempenhoPorTag = useMemo(() => {
    return MOCK_TAGS.map((tag) => {
      const contatosComTag = MOCK_CONTACTS.filter((c) => c.tags.includes(tag.id))
      const total = contatosComTag.length
      const convertidos = contatosComTag.filter((c) => c.status === "convertido").length
      const taxaConversao = total > 0 ? (convertidos / total) * 100 : 0

      return {
        tag: tag.nome,
        cor: tag.cor,
        total,
        taxaConversao,
      }
    })
      .filter((t) => t.total > 0)
      .sort((a, b) => b.taxaConversao - a.taxaConversao)
  }, [])

  // Contatos por Origem
  const contatosPorOrigem = useMemo(() => {
    const origemData: Record<string, number> = {}
    
    MOCK_CONTACTS.forEach((c) => {
      origemData[c.origem] = (origemData[c.origem] || 0) + 1
    })

    return Object.entries(origemData)
      .map(([origem, total]) => ({
        origem,
        total,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [])

  const handleExport = () => {
    toast.success("Relatório exportado com sucesso")
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 min-w-0">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Desempenho de Contatos
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Métricas de conversão e qualidade dos seus contatos
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Exportar Relatório
            </Button>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                <SelectItem value="90dias">Últimos 90 dias</SelectItem>
                <SelectItem value="12meses">Últimos 12 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* KPI Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {taxaConversao.toFixed(1)}%
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Inatividade</p>
                <p className="text-2xl font-bold text-red-600">
                  {taxaInatividade.toFixed(1)}%
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#46347F]/10">
                <Target className="h-6 w-6 text-[#46347F]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contatos Ativos</p>
                <p className="text-2xl font-bold text-[#46347F]">{activeContacts}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Funil e Score por Origem */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Funil de Contatos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Funil de Contatos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funnelData.map((item, index) => {
                  const percentage = index === 0 ? 100 : (item.valor / funnelData[0].valor) * 100
                  const prevValue = index > 0 ? funnelData[index - 1].valor : item.valor
                  const conversionRate = index > 0 ? ((item.valor / prevValue) * 100).toFixed(1) : null

                  return (
                    <div key={item.etapa} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{item.etapa}</span>
                        <span className="text-muted-foreground">
                          {item.valor} contatos
                          {conversionRate && (
                            <span className="ml-2 text-emerald-600">
                              ({conversionRate}% conversão)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="h-8 w-full rounded-md bg-gray-100 overflow-hidden">
                        <div
                          className="h-full flex items-center justify-end px-3 text-xs font-medium text-white transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: item.fill,
                          }}
                        >
                          {percentage.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Contatos por Origem */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contatos por Origem</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={contatosPorOrigem} margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis
                      dataKey="origem"
                      tick={{ fontSize: 11 }}
                      stroke="#888"
                    />
                    <YAxis tick={{ fontSize: 12 }} stroke="#888" />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar dataKey="total" fill="#46347F" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Desempenho por Tag */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Desempenho por Tag</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag</TableHead>
                  <TableHead>Contatos</TableHead>

                  <TableHead>Taxa de Conversão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {desempenhoPorTag.map((item) => (
                  <TableRow key={item.tag}>
                    <TableCell>
                      <Badge
                        className="text-xs"
                        style={{
                          backgroundColor: `${item.cor}20`,
                          color: item.cor,
                          borderColor: item.cor,
                        }}
                      >
                        {item.tag}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.total}</TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {item.taxaConversao.toFixed(1)}%
                        </span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs",
                            item.taxaConversao >= 30
                              ? "bg-emerald-100 text-emerald-700"
                              : item.taxaConversao >= 10
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                          )}
                        >
                          {item.taxaConversao >= 30
                            ? "Excelente"
                            : item.taxaConversao >= 10
                            ? "Bom"
                            : "Baixo"}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Rodapé com totais */}
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell>Total/Média</TableCell>
                  <TableCell>
                    {desempenhoPorTag.reduce((sum, t) => sum + t.total, 0)}
                  </TableCell>

                  <TableCell>
                    {(
                      desempenhoPorTag.reduce((sum, t) => sum + t.taxaConversao, 0) /
                      desempenhoPorTag.length
                    ).toFixed(1)}
                    %
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
