"use client"

import { useState } from "react"
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import {
  MessageSquare, CheckCircle2, Clock, Users, TrendingUp, TrendingDown,
  Minus, Send, Radio, MailOpen, MailX, Loader2, ChevronDown, ChevronRight,
} from "lucide-react"

import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

import {
  useAtendimentoReport,
  useLeadFlowReport,
  useCampaignPerformance,
  formatTMR,
  formatChange,
  PERIOD_LABELS,
  ReportPeriod,
  GroupBy,
  CampaignMetrics,
} from "@/hooks/use-performance-report"

// ── Paleta de cores dos canais ──────────────────────────────
const CHANNEL_COLORS = [
  "#46347F", "#7C5CBF", "#A78BDA", "#C4B0E8",
  "#E9A8C7", "#F3C845", "#60A5FA", "#34D399",
]

// ── Helpers de formatação ───────────────────────────────────
const DOW_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

function formatBucket(bucket: string, groupBy: GroupBy): string {
  const d = new Date(bucket)
  if (groupBy === "hour") {
    return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
  }
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

// ── KPI Card ────────────────────────────────────────────────
function KPICard({
  title,
  value,
  change,
  subtitle,
  icon: Icon,
  unit,
}: {
  title: string
  value: string | number
  change?: number
  subtitle?: string
  icon: React.ElementType
  unit?: string
}) {
  const ch = change !== undefined ? formatChange(change) : null

  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide truncate">{title}</p>
            <p className="text-2xl font-bold mt-1 text-foreground">
              {value}{unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
            </p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <div className="ml-3 shrink-0 flex flex-col items-end gap-1.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#46347F]/10">
              <Icon className="h-4.5 w-4.5 text-[#46347F]" />
            </div>
            {ch && (
              <span className={`text-xs font-semibold flex items-center gap-0.5 ${ch.positive ? "text-green-600" : "text-red-500"}`}>
                {ch.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {ch.label}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Janela status badge ─────────────────────────────────────
function WindowBadge({ gotReply, windowExpired }: { gotReply: boolean; windowExpired: boolean }) {
  if (gotReply) return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Aproveitada</Badge>
  if (windowExpired) return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Expirada</Badge>
  return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">Ativa</Badge>
}

// ── Campaign Row ────────────────────────────────────────────
function CampaignRow({ campaign, period }: { campaign: CampaignMetrics; period: ReportPeriod }) {
  const [expanded, setExpanded] = useState(false)
  const { data: detail, isLoading } = useCampaignPerformance(period, expanded ? campaign.id : undefined)
  const detailCampaign = detail?.campanhas?.[0]

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/50"
        onClick={() => setExpanded(!expanded)}
      >
        <TableCell>
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            <div>
              <p className="font-medium text-sm">{campaign.nome}</p>
              <p className="text-xs text-muted-foreground">{campaign.templateName}</p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className="text-xs">{campaign.tag ?? "—"}</Badge>
        </TableCell>
        <TableCell className="text-center tabular-nums">{campaign.enviados}</TableCell>
        <TableCell className="text-center tabular-nums text-red-500">{campaign.falhas}</TableCell>
        <TableCell className="text-center tabular-nums">{campaign.janelasAbertas}</TableCell>
        <TableCell className="text-center tabular-nums text-green-600">{campaign.janelasAproveitadas}</TableCell>
        <TableCell className="text-center tabular-nums text-red-400">{campaign.janelasExpiradas}</TableCell>
        <TableCell className="text-center">
          <span className={`font-semibold text-sm ${campaign.taxaEngajamento >= 30 ? "text-green-600" : campaign.taxaEngajamento >= 10 ? "text-yellow-600" : "text-red-500"}`}>
            {campaign.taxaEngajamento}%
          </span>
        </TableCell>
        <TableCell className="text-center text-muted-foreground text-sm">{formatTMR(campaign.tmrContatoSegundos)}</TableCell>
        <TableCell className="text-center tabular-nums">{campaign.conversoes}</TableCell>
      </TableRow>

      {expanded && (
        <TableRow>
          <TableCell colSpan={10} className="p-0 border-t-0">
            <div className="bg-muted/30 px-6 py-4">
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando detalhes...
                </div>
              ) : detailCampaign?.contatos ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Detalhes por contato ({detailCampaign.contatos.length})
                  </p>
                  <div className="max-h-72 overflow-y-auto rounded border bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Contato</TableHead>
                          <TableHead className="text-xs">Telefone</TableHead>
                          <TableHead className="text-xs text-center">Envio</TableHead>
                          <TableHead className="text-xs text-center">Janela</TableHead>
                          <TableHead className="text-xs text-center">Tempo de Resposta</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailCampaign.contatos.map((c) => (
                          <TableRow key={c.contactId} className="text-xs">
                            <TableCell>{c.name ?? "—"}</TableCell>
                            <TableCell className="font-mono">{c.phone}</TableCell>
                            <TableCell className="text-center">
                              {c.status === "SENT"
                                ? <span className="text-green-600">✓ Enviado</span>
                                : <span className="text-red-500">✗ Falha</span>}
                            </TableCell>
                            <TableCell className="text-center">
                              <WindowBadge gotReply={c.gotReply} windowExpired={c.windowExpired} />
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground">
                              {c.replyTimeSeconds != null ? formatTMR(c.replyTimeSeconds) : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : null}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

// ── Página Principal ────────────────────────────────────────
export default function PerformancePage() {
  const [period, setPeriod] = useState<ReportPeriod>("24h")
  const [groupBy, setGroupBy] = useState<GroupBy>("hour")

  const { data: atendimento, isLoading: loadingAtendimento } = useAtendimentoReport(period)
  const { data: leadFlow, isLoading: loadingLeadFlow } = useLeadFlowReport(period, groupBy)
  const { data: campaigns, isLoading: loadingCampaigns, error: campaignsError } = useCampaignPerformance(period)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 min-w-0">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Relatório de Performance</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Atendimento, fluxo de leads e campanhas da API oficial
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
              <SelectTrigger className="h-8 w-40 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(PERIOD_LABELS) as [ReportPeriod, string][]).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className="mb-6" />

        <Tabs defaultValue="atendimento">
          <TabsList className="mb-6">
            <TabsTrigger value="atendimento">Atendimento</TabsTrigger>
            <TabsTrigger value="fluxo">Fluxo de Leads</TabsTrigger>
            <TabsTrigger value="campanhas">Campanhas API Oficial</TabsTrigger>
            <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
          </TabsList>

          {/* ── ABA 1: Atendimento ──────────────────────────── */}
          <TabsContent value="atendimento" className="space-y-6">
            {loadingAtendimento ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : atendimento ? (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  <KPICard
                    title="Conversas abertas"
                    value={atendimento.conversasAbertas.value}
                    change={atendimento.conversasAbertas.change}
                    icon={MessageSquare}
                    subtitle={PERIOD_LABELS[period]}
                  />
                  <KPICard
                    title="Conversas fechadas"
                    value={atendimento.conversasFechadas.value}
                    change={atendimento.conversasFechadas.change}
                    icon={CheckCircle2}
                    subtitle={PERIOD_LABELS[period]}
                  />
                  <KPICard
                    title="Taxa de resolução"
                    value={atendimento.taxaResolucao.value}
                    change={atendimento.taxaResolucao.change}
                    icon={TrendingUp}
                    unit="%"
                  />
                  <KPICard
                    title="TMR — 1ª resposta"
                    value={formatTMR(atendimento.tmrSegundos)}
                    icon={Clock}
                    subtitle="Tempo médio de resposta"
                  />
                  <KPICard
                    title="Conversas ativas"
                    value={atendimento.conversasAtivas}
                    icon={Radio}
                    subtitle="Em aberto agora"
                  />
                  <KPICard
                    title="Sem atribuição"
                    value={atendimento.conversasSemAtribuicao}
                    icon={Users}
                    subtitle="Aguardando agente"
                  />
                  <KPICard
                    title="Mensagens recebidas"
                    value={atendimento.mensagensRecebidas}
                    icon={MailOpen}
                    subtitle={PERIOD_LABELS[period]}
                  />
                  <KPICard
                    title="Mensagens enviadas"
                    value={atendimento.mensagensEnviadas}
                    icon={Send}
                    subtitle={PERIOD_LABELS[period]}
                  />
                </div>
              </>
            ) : null}
          </TabsContent>

          {/* ── ABA 2: Fluxo de Leads ───────────────────────── */}
          <TabsContent value="fluxo" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                {!loadingLeadFlow && leadFlow && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{leadFlow.totalNovas}</span> novas conversas em {PERIOD_LABELS[period]}
                  </p>
                )}
              </div>
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
                <SelectTrigger className="h-8 w-32 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hour">Por hora</SelectItem>
                  <SelectItem value="day">Por dia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loadingLeadFlow ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : leadFlow ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Entrada de novas conversas por canal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {leadFlow.flow.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-8">Nenhum dado no período selecionado</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={leadFlow.flow.map(p => ({ ...p, label: formatBucket(p.bucket, groupBy) }))}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                          <Tooltip />
                          <Legend />
                          {leadFlow.channels.map((ch, i) => (
                            <Line
                              key={ch.id}
                              type="monotone"
                              dataKey={ch.id}
                              name={ch.name}
                              stroke={CHANNEL_COLORS[i % CHANNEL_COLORS.length]}
                              strokeWidth={2}
                              dot={false}
                              activeDot={{ r: 4 }}
                            />
                          ))}
                          <Line
                            type="monotone"
                            dataKey="total"
                            name="Total"
                            stroke="#94a3b8"
                            strokeWidth={1.5}
                            strokeDasharray="4 2"
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Breakdown por canal */}
                {leadFlow.channels.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Volume por canal</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart
                          data={leadFlow.channels.map((ch, i) => ({
                            name: ch.name,
                            total: leadFlow.flow.reduce((s, p) => s + (Number(p[ch.id]) || 0), 0),
                            fill: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="total" name="Conversas" radius={[4, 4, 0, 0]}>
                            {leadFlow.channels.map((_, i) => (
                              <rect key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : null}
          </TabsContent>

          {/* ── ABA 3: Campanhas API Oficial ────────────────── */}
          <TabsContent value="campanhas" className="space-y-6">
            {loadingCampaigns ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : campaigns ? (
              <>
                {/* Cards consolidados */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Card>
                    <CardContent className="pt-5 pb-4 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Janelas abertas</p>
                      <p className="text-3xl font-bold mt-1">{campaigns.consolidado.totalJanelasAbertas}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{campaigns.consolidado.totalCampanhas} campanha(s)</p>
                    </CardContent>
                  </Card>
                  <Card className="border-green-200">
                    <CardContent className="pt-5 pb-4 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Aproveitadas</p>
                      <p className="text-3xl font-bold mt-1 text-green-600">{campaigns.consolidado.totalJanelasAproveitadas}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">contato respondeu</p>
                    </CardContent>
                  </Card>
                  <Card className="border-red-200">
                    <CardContent className="pt-5 pb-4 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Expiradas</p>
                      <p className="text-3xl font-bold mt-1 text-red-500">{campaigns.consolidado.totalJanelasExpiradas}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">sem resposta em 24h</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-5 pb-4 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Taxa de engajamento</p>
                      <p className={`text-3xl font-bold mt-1 ${campaigns.consolidado.taxaEngajamentoMedia >= 30 ? "text-green-600" : campaigns.consolidado.taxaEngajamentoMedia >= 10 ? "text-yellow-600" : "text-red-500"}`}>
                        {campaigns.consolidado.taxaEngajamentoMedia}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{campaigns.consolidado.totalConversoes} conversões</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Tabela de campanhas */}
                {campaigns.campanhas.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground text-sm">
                      Nenhuma campanha disparada em {PERIOD_LABELS[period].toLowerCase()}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Campanhas — clique para ver detalhes por contato</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Campanha / Template</TableHead>
                              <TableHead>Tag</TableHead>
                              <TableHead className="text-center">Enviados</TableHead>
                              <TableHead className="text-center">Falhas</TableHead>
                              <TableHead className="text-center">Janelas abertas</TableHead>
                              <TableHead className="text-center">Aproveitadas</TableHead>
                              <TableHead className="text-center">Expiradas</TableHead>
                              <TableHead className="text-center">Engajamento</TableHead>
                              <TableHead className="text-center">TMR contato</TableHead>
                              <TableHead className="text-center">Conversões</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {campaigns.campanhas.map((campaign) => (
                              <CampaignRow key={campaign.id} campaign={campaign} period={period} />
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground text-sm">
                    {campaignsError ? 'Erro ao carregar campanhas. Verifique o console para mais detalhes.' : 'Nenhuma campanha encontrada.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── ABA 4: Heatmap ──────────────────────────────── */}
          <TabsContent value="heatmap" className="space-y-6">
            {loadingLeadFlow ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : leadFlow?.heatmap ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Volume de mensagens recebidas por hora e dia da semana</CardTitle>
                </CardHeader>
                <CardContent>
                  {leadFlow.heatmap.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">Nenhum dado no período selecionado</p>
                  ) : (
                    <HeatmapGrid heatmap={leadFlow.heatmap} />
                  )}
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

// ── Heatmap Grid Component ──────────────────────────────────
function HeatmapGrid({ heatmap }: { heatmap: Array<{ dow: number; hour: number; count: number }> }) {
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const countMap = new Map<string, number>()
  let maxCount = 0
  for (const cell of heatmap) {
    const key = `${cell.dow}-${cell.hour}`
    countMap.set(key, cell.count)
    if (cell.count > maxCount) maxCount = cell.count
  }

  function getColor(count: number): string {
    if (count === 0 || maxCount === 0) return "bg-muted"
    const ratio = count / maxCount
    if (ratio < 0.2) return "bg-[#46347F]/10"
    if (ratio < 0.4) return "bg-[#46347F]/25"
    if (ratio < 0.6) return "bg-[#46347F]/45"
    if (ratio < 0.8) return "bg-[#46347F]/65"
    return "bg-[#46347F]/90"
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Hour labels */}
        <div className="flex ml-10 mb-1">
          {hours.map(h => (
            <div key={h} className="flex-1 text-center text-[10px] text-muted-foreground">
              {h % 3 === 0 ? `${h}h` : ""}
            </div>
          ))}
        </div>
        {/* Grid */}
        {DOW_LABELS.map((day, dow) => (
          <div key={dow} className="flex items-center gap-1 mb-1">
            <div className="w-8 text-[11px] text-muted-foreground text-right shrink-0">{day}</div>
            <div className="flex flex-1 gap-0.5">
              {hours.map(h => {
                const count = countMap.get(`${dow}-${h}`) ?? 0
                return (
                  <div
                    key={h}
                    className={`flex-1 h-6 rounded-sm ${getColor(count)} transition-colors`}
                    title={`${day} ${h}h — ${count} msgs`}
                  />
                )
              })}
            </div>
          </div>
        ))}
        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-[10px] text-muted-foreground">Menos</span>
          {["bg-muted", "bg-[#46347F]/10", "bg-[#46347F]/25", "bg-[#46347F]/45", "bg-[#46347F]/65", "bg-[#46347F]/90"].map((c, i) => (
            <div key={i} className={`h-4 w-4 rounded-sm ${c}`} />
          ))}
          <span className="text-[10px] text-muted-foreground">Mais</span>
        </div>
      </div>
    </div>
  )
}
