"use client"

import { useState } from "react"
import { VerticalKpiCard } from "@/components/vertical-kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  CreditCard,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Download,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useSubscriptions } from "@/hooks/use-subscriptions"
import { useInvoices } from "@/hooks/use-invoices"
import { usePlans } from "@/hooks/use-plans"

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR')
}

function getDaysUntil(dateString: string): number {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export default function AssinaturasPage() {
  const { subscriptions, isLoading: isLoadingSubscriptions, error: errorSubscriptions, refetch: refetchSubscriptions } = useSubscriptions()
  const { invoices, isLoading: isLoadingInvoices, error: errorInvoices } = useInvoices()
  const { plans, isLoading: isLoadingPlans, error: errorPlans } = usePlans()

  const isLoading = isLoadingSubscriptions || isLoadingInvoices || isLoadingPlans
  const hasError = errorSubscriptions || errorInvoices || errorPlans

  // Calcular KPIs a partir dos dados reais
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active')
  const totalMRR = activeSubscriptions.reduce((acc, sub) => acc + (sub.plan?.priceCents || 0), 0)
  const totalCustomers = activeSubscriptions.length
  
  // Calcular variações (mockadas por enquanto, podem ser calculadas com dados históricos)
  const mrrChange = "+12,5%"
  const customersChange = "+8,2%"
  const conversionRate = "68,4%"
  const conversionChange = "+3,1%"
  const averageTicket = totalCustomers > 0 ? Math.round(totalMRR / totalCustomers) : 0
  const ticketChange = "-2,4%"

  // Faturas pendentes
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending')
  const upcomingInvoices = pendingInvoices
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4)

  // Assinaturas recentes
  const recentSubscriptions = [...subscriptions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  // Estatísticas por plano
  const planStats = plans.map(plan => {
    const planSubscriptions = subscriptions.filter(s => s.planId === plan.id && s.status === 'active')
    const planRevenue = planSubscriptions.reduce((acc, sub) => acc + (sub.plan?.priceCents || 0), 0)
    return {
      name: plan.name,
      customers: planSubscriptions.length,
      revenue: formatCurrency(planRevenue),
      color: "bg-[#46347F]"
    }
  }).filter(p => p.customers > 0)

  const kpis = [
    {
      label: "Receita Mensal (MRR)",
      value: formatCurrency(totalMRR),
      change: mrrChange,
      icon: DollarSign,
    },
    {
      label: "Clientes Ativos",
      value: totalCustomers.toString(),
      change: customersChange,
      icon: Users,
    },
    {
      label: "Taxa de Conversão",
      value: conversionRate,
      change: conversionChange,
      icon: TrendingUp,
    },
    {
      label: "Ticket Médio",
      value: formatCurrency(averageTicket),
      change: ticketChange,
      isNegativeGood: false,
      icon: CreditCard,
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#46347F]" />
          <p className="text-muted-foreground">Carregando dados de assinaturas...</p>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h3 className="text-lg font-semibold">Erro ao carregar dados</h3>
          <p className="text-muted-foreground">{errorSubscriptions || errorInvoices || errorPlans}</p>
          <Button onClick={refetchSubscriptions} variant="outline">
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assinaturas</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie assinaturas, faturas e receitas do seu negócio
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 border-0 shadow-sm">
            <Calendar className="h-4 w-4" />
            30 dias
          </Button>
          
          <Button variant="outline" size="sm" className="gap-2 border-0 shadow-sm">
            <Download className="h-4 w-4" />
            Exportar
          </Button>

          <Link href="/configuracoes/assinaturas/nova">
            <Button size="sm" className="gap-2 bg-[#46347F] hover:bg-[#46347F]">
              <Plus className="h-4 w-4" />
              Nova Assinatura
            </Button>
          </Link>
        </div>
      </div>

      {/* 3-Column Grid Layout - Igual Dashboard */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[240px_minmax(0,1fr)_minmax(0,1fr)]">
        
        {/* COLUNA 1: KPIs Verticais (Esquerda) */}
        <div className="flex flex-col gap-3 md:col-span-2 xl:col-span-1">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-1">
            {kpis.map((kpi) => (
              <VerticalKpiCard
                key={kpi.label}
                label={kpi.label}
                value={kpi.value}
                change={kpi.change}
                icon={kpi.icon}
                isNegativeGood={kpi.isNegativeGood}
                size={kpi.value.startsWith("R$") ? "default" : "large"}
              />
            ))}
          </div>
        </div>

        {/* COLUNA 2: Conteúdo Principal */}
        <div className="flex flex-col gap-4">
          {/* Assinaturas Recentes */}
          <Card className="shadow-sm rounded-sm">
            <CardHeader className="p-4 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-semibold">Assinaturas Recentes</CardTitle>
                  <div className="flex items-center gap-1.5 rounded-sm bg-[#46347F]/10 px-2 py-0.5">
                    <Users className="h-3 w-3 text-[#46347F]" />
                    <span className="text-xs font-semibold text-[#46347F]">{totalCustomers} ativas</span>
                  </div>
                </div>
                <Link href="/configuracoes/assinaturas/assinaturas">
                  <Button variant="ghost" size="sm" className="h-8 text-[#46347F]">
                    Ver Todas
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {recentSubscriptions.length === 0 ? (
                  <div className="px-4 py-8 text-center text-muted-foreground">
                    Nenhuma assinatura encontrada
                  </div>
                ) : (
                  recentSubscriptions.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-sm",
                          sub.status === "active" && "bg-green-100",
                          sub.status === "pending" && "bg-amber-100",
                          sub.status === "canceled" && "bg-red-100"
                        )}>
                          {sub.status === "active" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                          {sub.status === "pending" && <Clock className="h-4 w-4 text-amber-600" />}
                          {sub.status === "canceled" && <XCircle className="h-4 w-4 text-red-600" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{sub.plan?.name || 'Plano'}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(sub.plan?.priceCents || 0)}/{sub.plan?.interval === 'monthly' ? 'mês' : 'ano'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{formatCurrency(sub.plan?.priceCents || 0)}</p>
                        <p className="text-xs text-muted-foreground">{getDaysUntil(sub.currentPeriodEnd) > 0 ? `Vence em ${getDaysUntil(sub.currentPeriodEnd)} dias` : 'Vence hoje'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Distribuição por Plano */}
          <Card className="shadow-sm rounded-sm">
            <CardHeader className="p-4 pb-3">
              <CardTitle className="text-base font-semibold">Distribuição por Plano</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {planStats.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Nenhum plano com assinaturas ativas
                </div>
              ) : (
                <div className="space-y-4">
                  {planStats.map((plan) => (
                    <div key={plan.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-3 w-3 rounded-sm", plan.color)} />
                          <span className="text-sm font-medium text-foreground">{plan.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">{plan.customers} clientes</span>
                          <span className="text-sm font-semibold text-foreground">{plan.revenue}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-secondary rounded-sm overflow-hidden">
                        <div 
                          className={cn("h-full rounded-sm", plan.color)}
                          style={{ width: `${totalCustomers > 0 ? (plan.customers / totalCustomers) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* COLUNA 3: Conteúdo Principal */}
        <div className="flex flex-col gap-4">
          {/* Faturas à Receber */}
          <Card className="shadow-sm rounded-sm">
            <CardHeader className="p-4 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Faturas à Receber</CardTitle>
                <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-sm">
                  {pendingInvoices.length} pendentes
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {upcomingInvoices.length === 0 ? (
                  <div className="px-4 py-8 text-center text-muted-foreground">
                    Nenhuma fatura pendente
                  </div>
                ) : (
                  upcomingInvoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-foreground">{inv.subscription?.plan?.name || 'Fatura'}</p>
                        <p className="text-xs text-muted-foreground">Vence em {getDaysUntil(inv.dueDate) > 0 ? `${getDaysUntil(inv.dueDate)} dias` : 'hoje'}</p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(inv.amountCents)}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4">
                <Link href="/configuracoes/assinaturas/faturas">
                  <Button variant="outline" className="w-full border-0 shadow-sm">
                    Ver Todas as Faturas
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Status Stripe */}
          <Card className="shadow-sm rounded-sm">
            <CardHeader className="p-4 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Status Stripe</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium text-green-600">Conectado</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-sm bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground">Taxa Stripe</p>
                  <p className="text-lg font-bold text-foreground">2,9% + R$0,30</p>
                </div>
                <div className="rounded-sm bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground">Moeda</p>
                  <p className="text-lg font-bold text-foreground">BRL (R$)</p>
                </div>
              </div>
              <div className="rounded-sm bg-secondary/30 p-3">
                <p className="text-xs text-muted-foreground mb-1">Webhook Endpoint</p>
                <code className="text-xs bg-secondary px-2 py-1 rounded-sm break-all">
                  /api/stripe/webhook
                </code>
              </div>
              <Link href="/configuracoes/assinaturas/configuracoes">
                <Button className="w-full bg-[#46347F] hover:bg-[#46347F]">
                  Configurar Stripe
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
