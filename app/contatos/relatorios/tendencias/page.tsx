"use client"

import { useState, useMemo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
} from "lucide-react"

import { Sidebar } from "@/components/sidebar"
import { ContactsSubSidebar } from "@/components/contacts/contacts-sub-sidebar"
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
import { cn } from "@/lib/utils"
import { MOCK_CONTACTS } from "@/lib/mock/contacts"
import { MOCK_TAGS } from "@/lib/mock/tags"

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

const STATUS_COLORS: Record<string, string> = {
  ativo: "#81C784",
  inativo: "#E57373",
  pendente: "#FFB74D",
  convertido: "#9795e4",
}

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

export default function TendenciasPage() {
  const [period, setPeriod] = useState("12meses")

  // Calcular novos contatos por mês (últimos 12 meses)
  const newContactsByMonth = useMemo(() => {
    const now = new Date()
    const counts: Record<string, number> = {}

    // Inicializar com 0
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
      counts[key] = 0
    }

    // Contar contatos
    MOCK_CONTACTS.forEach((contact) => {
      const date = new Date(contact.criadoEm)
      const key = `${MONTHS[date.getMonth()]} ${date.getFullYear()}`
      if (counts.hasOwnProperty(key)) {
        counts[key]++
      }
    })

    return Object.entries(counts).map(([mes, contatos]) => ({ mes, contatos }))
  }, [])

  // Top origens
  const originDistribution = useMemo(() => {
    const origins: Record<string, number> = {}
    MOCK_CONTACTS.forEach((c) => {
      origins[c.origem] = (origins[c.origem] || 0) + 1
    })
    return Object.entries(origins)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([origem, total]) => ({ origem, total }))
  }, [])

  // Distribuição por status
  const statusDistribution = useMemo(() => {
    const statuses: Record<string, number> = {}
    MOCK_CONTACTS.forEach((c) => {
      statuses[c.status] = (statuses[c.status] || 0) + 1
    })
    return Object.entries(statuses).map(([status, total]) => ({
      status,
      total,
      fill: STATUS_COLORS[status] || "#999",
    }))
  }, [])

  // Top tags
  const topTags = useMemo(() => {
    const tagCounts: Record<string, number> = {}
    MOCK_CONTACTS.forEach((c) => {
      c.tags.forEach((tagId) => {
        tagCounts[tagId] = (tagCounts[tagId] || 0) + 1
      })
    })

    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tagId, total]) => {
        const tag = MOCK_TAGS.find((t) => t.id === tagId)
        return {
          tag: tag?.nome || tagId,
          cor: tag?.cor || "#9795e4",
          total,
        }
      })
  }, [])

  // KPIs
  const totalContacts = MOCK_CONTACTS.length
  const activeContacts = MOCK_CONTACTS.filter((c) => c.status === "ativo").length


  // Novos este mês vs mês anterior (simulado)
  const currentMonthCount = newContactsByMonth[newContactsByMonth.length - 1]?.contatos || 0
  const lastMonthCount = newContactsByMonth[newContactsByMonth.length - 2]?.contatos || 0
  const monthChange = lastMonthCount === 0 ? 0 : ((currentMonthCount - lastMonthCount) / lastMonthCount) * 100
  const isPositive = monthChange >= 0

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-shrink-0">
        <ContactsSubSidebar />
      </div>
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 min-w-0">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Tendências de Contatos
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Acompanhe o crescimento e a distribuição dos seus contatos
            </p>
          </div>
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

        <Separator className="mb-6" />

        {/* KPI Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#9795e4]/10">
                <Users className="h-6 w-6 text-[#9795e4]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Contatos</p>
                <p className="text-2xl font-bold">{totalContacts}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <BarChart3 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Novos este mês</p>
                <p className="text-2xl font-bold">{currentMonthCount}</p>
                <p className={cn("text-xs flex items-center gap-1", isPositive ? "text-emerald-600" : "text-red-600")}>
                  {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(monthChange).toFixed(0)}% vs mês anterior
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <Activity className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contatos Ativos</p>
                <p className="text-2xl font-bold">{activeContacts}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#9795e4]/10">
                <BarChart3 className="h-6 w-6 text-[#9795e4]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Atividade</p>
                <p className="text-2xl font-bold">{Math.round((activeContacts / totalContacts) * 100)}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Gráfico de Linha */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Novos Contatos por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={newContactsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis
                      dataKey="mes"
                      tick={{ fontSize: 12 }}
                      stroke="#888"
                    />
                    <YAxis tick={{ fontSize: 12 }} stroke="#888" />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="contatos"
                      stroke="#9795e4"
                      strokeWidth={2}
                      dot={{ fill: "#9795e4", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Barras - Origens */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Origens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={originDistribution}
                    layout="vertical"
                    margin={{ left: 40, right: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12 }} stroke="#888" />
                    <YAxis
                      type="category"
                      dataKey="origem"
                      tick={{ fontSize: 11 }}
                      stroke="#888"
                      width={100}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar dataKey="total" fill="#9795e4" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Pizza - Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribuição por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="h-[280px] flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        dataKey="total"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 text-sm">
                  {statusDistribution.map((item) => (
                    <div key={item.status} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="capitalize">{item.status}</span>
                      <span className="text-muted-foreground">({item.total})</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Top Tags */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Tags Mais Usadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topTags.map((tag, index) => {
                const percentage = (tag.total / totalContacts) * 100
                return (
                  <div
                    key={index}
                    className="flex items-center gap-4 py-2"
                  >
                    <Badge
                      className="w-28 justify-center text-xs"
                      style={{
                        backgroundColor: `${tag.cor}20`,
                        color: tag.cor,
                        borderColor: tag.cor,
                      }}
                    >
                      {tag.tag}
                    </Badge>
                    <span className="w-16 text-sm font-medium">{tag.total}</span>
                    <div className="flex-1">
                      <div className="h-2 w-full rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-[#9795e4]"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-16 text-right text-sm text-muted-foreground">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
