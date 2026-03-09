"use client"

import { useState, useEffect } from "react"
import { ComplianceBanner } from "@/components/whatsapp/shared/compliance-banner"
import { useWhatsApp } from "@/hooks/use-whatsapp"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart3, 
  AlertCircle, 
  ArrowRight,
  RefreshCw,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Eye
} from "lucide-react"
import { getAnalytics, getComplianceInfo } from "@/lib/whatsapp/api"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { WhatsAppAnalytics, ComplianceInfo } from "@/lib/whatsapp/types"
import { MESSAGING_LIMITS } from "@/lib/whatsapp/constants"

// Simple bar chart component
function SimpleBarChart({ data, max }: { data: number[]; max: number }) {
  return (
    <div className="flex h-32 items-end gap-2">
      {data.map((value, index) => (
        <div
          key={index}
          className="flex-1 rounded-t bg-[#9795e4]/80 transition-all hover:bg-[#9795e4]"
          style={{ height: `${(value / max) * 100}%` }}
          title={`${value}`}
        />
      ))}
    </div>
  )
}

// Metric card component
function MetricCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  trendValue 
}: { 
  title: string
  value: string
  description: string
  icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
            <div className="mt-1 flex items-center gap-2">
              {trend && (
                <Badge 
                  variant={trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'secondary'}
                  className="h-5 text-[10px]"
                >
                  {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
                </Badge>
              )}
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#9795e4]/10">
            <Icon className="h-6 w-6 text-[#9795e4]" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function WhatsAppAnalyticsPage() {
  const { account, status, compliance: accountCompliance } = useWhatsApp()
  const isConnected = status === 'connected'

  const [analytics, setAnalytics] = useState<WhatsAppAnalytics | null>(null)
  const [compliance, setCompliance] = useState<ComplianceInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadData = async () => {
    if (!account?.wabaId) return
    setIsLoading(true)
    try {
      const [analyticsData, complianceData] = await Promise.all([
        getAnalytics(account.wabaId, {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        }),
        getComplianceInfo(account.wabaId),
      ])
      setAnalytics(analyticsData)
      setCompliance(complianceData)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isConnected) {
      loadData()
    }
  }, [isConnected])

  if (!isConnected) {
    return (<>
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700">
              Conecte sua conta WhatsApp Business para ver analytics.{' '}
              <Link href="/integracoes/whatsapp/connect" className="font-medium underline">
                Conectar agora
                <ArrowRight className="ml-1 inline-block h-3 w-3" />
              </Link>
            </AlertDescription>
          </Alert>
      </>
    )
  }

  const messagingLimit = MESSAGING_LIMITS[compliance?.messagingLimit as keyof typeof MESSAGING_LIMITS] || MESSAGING_LIMITS.TIER_1K

  return (<>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#9795e4]/10">
              <BarChart3 className="h-5 w-5 text-[#9795e4]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Analytics & Compliance</h1>
              <p className="text-sm text-muted-foreground">
                Métricas de desempenho e status de compliance
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={loadData} 
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Atualizar
          </Button>
        </div>

        {/* Compliance Status */}
        {compliance && (
          <div className="mb-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <CardTitle className="text-lg">Status de Compliance</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Verificação de Negócio</p>
                    <Badge 
                      variant={compliance.businessVerificationStatus === 'VERIFIED' ? 'default' : 'secondary'}
                      className="mt-1"
                    >
                      {compliance.businessVerificationStatus === 'VERIFIED' ? 'Verificado' : 'Pendente'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Limite de Mensagens</p>
                    <p className="mt-1 font-medium">{messagingLimit.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {messagingLimit.limit === Infinity ? 'Ilimitado' : `${messagingLimit.limit.toLocaleString()}/dia`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Score de Qualidade</p>
                    <p className="mt-1 font-medium">{compliance.qualityScore.toFixed(1)}/10</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Violações</p>
                    <p className="mt-1 font-medium">{compliance.violations.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Metrics Grid */}
        {analytics && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total de Mensagens"
              value={analytics.messages.total.toLocaleString()}
              description="Últimos 30 dias"
              icon={MessageSquare}
              trend="up"
              trendValue="12%"
            />
            <MetricCard
              title="Taxa de Entrega"
              value={`${((analytics.messages.delivered / analytics.messages.sent) * 100).toFixed(1)}%`}
              description="Mensagens entregues"
              icon={CheckCircle2}
              trend="up"
              trendValue="2.3%"
            />
            <MetricCard
              title="Taxa de Leitura"
              value={`${((analytics.messages.read / analytics.messages.delivered) * 100).toFixed(1)}%`}
              description="Mensagens lidas"
              icon={Eye}
              trend="neutral"
              trendValue="0.5%"
            />
            <MetricCard
              title="Custo Total"
              value={`$${analytics.conversations.totalCost.toFixed(2)}`}
              description="Conversações pagas"
              icon={DollarSign}
              trend="down"
              trendValue="5%"
            />
          </div>
        )}

        {/* Detailed Analytics */}
        {analytics && (
          <Tabs defaultValue="messages" className="w-full">
            <TabsList>
              <TabsTrigger value="messages">Mensagens</TabsTrigger>
              <TabsTrigger value="conversations">Conversações</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="messages" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Desempenho de Mensagens</CardTitle>
                  <CardDescription>
                    Status das mensagens enviadas nos últimos 30 dias
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                            <MessageSquare className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">Enviadas</p>
                            <p className="text-sm text-muted-foreground">Total de mensagens</p>
                          </div>
                        </div>
                        <p className="text-2xl font-bold">{analytics.messages.sent.toLocaleString()}</p>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium">Entregues</p>
                            <p className="text-sm text-muted-foreground">Recebidas pelo destinatário</p>
                          </div>
                        </div>
                        <p className="text-2xl font-bold">{analytics.messages.delivered.toLocaleString()}</p>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                            <Eye className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">Lidas</p>
                            <p className="text-sm text-muted-foreground">Visualizadas pelo destinatário</p>
                          </div>
                        </div>
                        <p className="text-2xl font-bold">{analytics.messages.read.toLocaleString()}</p>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                            <XCircle className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <p className="font-medium">Falhas</p>
                            <p className="text-sm text-muted-foreground">Não entregues</p>
                          </div>
                        </div>
                        <p className="text-2xl font-bold">{analytics.messages.failed.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="rounded-lg bg-muted/50 p-4">
                      <p className="mb-4 text-sm font-medium">Distribuição de Status</p>
                      <div className="space-y-3">
                        {[
                          { label: 'Entregues', value: analytics.messages.delivered, color: 'bg-emerald-500' },
                          { label: 'Lidas', value: analytics.messages.read, color: 'bg-purple-500' },
                          { label: 'Falhas', value: analytics.messages.failed, color: 'bg-red-500' },
                        ].map((item) => (
                          <div key={item.label}>
                            <div className="mb-1 flex justify-between text-sm">
                              <span>{item.label}</span>
                              <span>{((item.value / analytics.messages.sent) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted">
                              <div 
                                className={cn("h-full rounded-full", item.color)}
                                style={{ width: `${(item.value / analytics.messages.sent) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="conversations" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Conversações por Categoria</CardTitle>
                  <CardDescription>
                    Distribuição e custos das conversações
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Object.entries(analytics.conversations.byCategory).map(([category, count]) => (
                      <Card key={category}>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">{category}</p>
                          <p className="mt-2 text-2xl font-bold">{count.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">conversas</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="templates" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Desempenho de Templates</CardTitle>
                  <CardDescription>
                    Templates mais utilizados nos últimos 30 dias
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(analytics.templates.byTemplate).map(([name, count]) => (
                      <div key={name} className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <p className="font-medium capitalize">{name.replace(/_/g, ' ')}</p>
                          <p className="text-sm text-muted-foreground">
                            {((count / analytics.templates.totalSent) * 100).toFixed(1)}% do total
                          </p>
                        </div>
                        <p className="text-xl font-bold">{count.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Violations */}
        {compliance && compliance.violations.length > 0 && (
          <Card className="mt-6 border-red-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <CardTitle className="text-lg text-red-700">Violações de Política</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {compliance.violations.map((violation) => (
                  <div key={violation.id} className="rounded-lg bg-red-50 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-red-800">{violation.type}</p>
                        <p className="mt-1 text-sm text-red-700">{violation.description}</p>
                        <p className="mt-2 text-xs text-red-600">
                          Severidade: {violation.severity} • {new Date(violation.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Badge variant="destructive">{violation.severity}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
    </>
  )
}
