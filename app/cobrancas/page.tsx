"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { CobrancasSubSidebar } from "@/components/cobrancas/cobrancas-sub-sidebar"
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
  BarChart3,
  Calendar,
  Download,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Dados mockados para o dashboard de cobranças
const kpis = [
  {
    label: "Receita Mensal (MRR)",
    value: "R$ 48.250,00",
    change: "+12,5%",
    icon: DollarSign,
  },
  {
    label: "Clientes Ativos",
    value: "342",
    change: "+8,2%",
    icon: Users,
  },
  {
    label: "Taxa de Conversão",
    value: "68,4%",
    change: "+3,1%",
    icon: TrendingUp,
  },
  {
    label: "Ticket Médio",
    value: "R$ 141,08",
    change: "-2,4%",
    icon: CreditCard,
    isNegativeGood: false,
  },
]

const recentSubscriptions = [
  { id: "sub_1", customer: "Acme Corp", plan: "Enterprise", amount: "R$ 499,00", status: "active", date: "Hoje" },
  { id: "sub_2", customer: "TechStart", plan: "Pro", amount: "R$ 199,00", status: "active", date: "Hoje" },
  { id: "sub_3", customer: "Consulting Pro", plan: "Business", amount: "R$ 299,00", status: "pending", date: "Ontem" },
  { id: "sub_4", customer: "DevStudio", plan: "Pro", amount: "R$ 199,00", status: "canceled", date: "2 dias" },
  { id: "sub_5", customer: "Marketing Plus", plan: "Starter", amount: "R$ 99,00", status: "active", date: "3 dias" },
]

const upcomingInvoices = [
  { id: "inv_1", customer: "Global Solutions", amount: "R$ 799,00", dueDate: "Amanhã", status: "pending" },
  { id: "inv_2", customer: "StartupXYZ", amount: "R$ 149,00", dueDate: "2 dias", status: "pending" },
  { id: "inv_3", customer: "Enterprise Ltda", amount: "R$ 1.299,00", dueDate: "3 dias", status: "pending" },
  { id: "inv_4", customer: "DevAgency", amount: "R$ 399,00", dueDate: "5 dias", status: "pending" },
]

const plans = [
  { name: "Starter", customers: 145, revenue: "R$ 14.355,00", color: "bg-gray-400" },
  { name: "Pro", customers: 128, revenue: "R$ 25.472,00", color: "bg-[#9795e4]" },
  { name: "Business", customers: 45, revenue: "R$ 13.455,00", color: "bg-[#7c7ab8]" },
  { name: "Enterprise", customers: 24, revenue: "R$ 11.976,00", color: "bg-[#7573b8]" },
]

export default function CobrancasPage() {
  const [period, setPeriod] = useState("30d")

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Main Sidebar */}
      <Sidebar />

      {/* Cobranças Sub-Sidebar */}
      <CobrancasSubSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 ml-[292px]">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cobranças</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie assinaturas, faturas e receitas do seu SaaS
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

            <Button size="sm" className="gap-2 bg-[#9795e4] hover:bg-[#7c7ab8]">
              <Plus className="h-4 w-4" />
              Nova Assinatura
            </Button>
          </div>
        </div>

        {/* 3-Column Grid Layout - Igual Dashboard */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)]">
          
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
                    <div className="flex items-center gap-1.5 rounded-sm bg-[#9795e4]/10 px-2 py-0.5">
                      <Users className="h-3 w-3 text-[#9795e4]" />
                      <span className="text-xs font-semibold text-[#9795e4]">342 ativas</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 text-[#9795e4]">
                    Ver Todas
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {recentSubscriptions.map((sub) => (
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
                          <p className="text-sm font-medium text-foreground">{sub.customer}</p>
                          <p className="text-xs text-muted-foreground">{sub.plan}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{sub.amount}</p>
                        <p className="text-xs text-muted-foreground">{sub.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Distribuição por Plano */}
            <Card className="shadow-sm rounded-sm">
              <CardHeader className="p-4 pb-3">
                <CardTitle className="text-base font-semibold">Distribuição por Plano</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-4">
                  {plans.map((plan) => (
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
                          style={{ width: `${(plan.customers / 342) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
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
                    {upcomingInvoices.length} pendentes
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {upcomingInvoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-foreground">{inv.customer}</p>
                        <p className="text-xs text-muted-foreground">Vence em {inv.dueDate}</p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{inv.amount}</p>
                    </div>
                  ))}
                </div>
                <div className="p-4">
                  <Button variant="outline" className="w-full border-0 shadow-sm">
                    Ver Todas as Faturas
                  </Button>
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
                <Button className="w-full bg-[#9795e4] hover:bg-[#7c7ab8]">
                  Configurar Stripe
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
