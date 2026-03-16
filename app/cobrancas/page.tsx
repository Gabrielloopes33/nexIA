"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  CreditCard, 
  Receipt, 
  Package, 
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Calendar,
} from "lucide-react"
import Link from "next/link"
import { useSubscriptions } from "@/hooks/use-subscriptions"
import { useInvoices } from "@/hooks/use-invoices"
import { cn } from "@/lib/utils"

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

export default function CobrancasPage() {
  const { subscriptions, isLoading: isLoadingSubscriptions, error: errorSubscriptions } = useSubscriptions()
  const { invoices, isLoading: isLoadingInvoices, error: errorInvoices } = useInvoices()

  const isLoading = isLoadingSubscriptions || isLoadingInvoices
  const hasError = errorSubscriptions || errorInvoices

  // Assinatura ativa
  const activeSubscription = subscriptions.find(s => s.status === 'active')
  
  // Faturas pendentes
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending')
  
  // Próxima cobrança
  const nextInvoice = pendingInvoices
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]

  // Total devido
  const totalDue = pendingInvoices.reduce((acc, inv) => acc + inv.amountCents, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#46347F]" />
          <p className="text-muted-foreground">Carregando informações de cobrança...</p>
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
          <p className="text-muted-foreground">{errorSubscriptions || errorInvoices}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cobranças</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas assinaturas e pagamentos
          </p>
        </div>
        <Link href="/configuracoes/assinaturas">
          <Button variant="outline" className="gap-2">
            Gerenciar Assinaturas
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Status da Assinatura */}
      {activeSubscription ? (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-semibold">Assinatura Ativa</h2>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    {activeSubscription.plan?.name || 'Plano'}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  Sua assinatura está ativa e todos os recursos estão disponíveis.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Valor mensal</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(activeSubscription.plan?.priceCents || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Próxima cobrança</p>
                    <p className="text-lg font-semibold">
                      {formatDate(activeSubscription.currentPeriodEnd)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Dias restantes</p>
                    <p className="text-lg font-semibold">
                      {getDaysUntil(activeSubscription.currentPeriodEnd)} dias
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-1">Sem Assinatura Ativa</h2>
                <p className="text-muted-foreground mb-4">
                  Você não possui uma assinatura ativa. Escolha um plano para começar.
                </p>
                <Link href="/configuracoes/assinaturas/planos">
                  <Button className="bg-[#46347F] hover:bg-[#46347F]">
                    <Package className="h-4 w-4 mr-2" />
                    Ver Planos
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total em Aberto</span>
            </div>
            <p className={cn(
              "text-2xl font-bold",
              totalDue > 0 ? "text-amber-600" : "text-green-600"
            )}>
              {formatCurrency(totalDue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Faturas Pendentes</span>
            </div>
            <p className="text-2xl font-bold">{pendingInvoices.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Próximo Vencimento</span>
            </div>
            <p className="text-2xl font-bold">
              {nextInvoice ? formatDate(nextInvoice.dueDate) : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Faturas Recentes */}
      <Card>
        <CardHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-[#46347F]" />
              Faturas Recentes
            </CardTitle>
            <Link href="/configuracoes/assinaturas/faturas">
              <Button variant="ghost" size="sm" className="text-[#46347F]">
                Ver Todas
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {invoices.slice(0, 5).map((invoice) => {
              const daysUntil = getDaysUntil(invoice.dueDate)
              return (
                <div key={invoice.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full",
                      invoice.status === "paid" && "bg-green-100",
                      invoice.status === "pending" && "bg-amber-100",
                      invoice.status === "failed" && "bg-red-100"
                    )}>
                      {invoice.status === "paid" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      {invoice.status === "pending" && <Clock className="h-4 w-4 text-amber-600" />}
                      {invoice.status === "failed" && <AlertCircle className="h-4 w-4 text-red-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {invoice.subscription?.plan?.name || 'Fatura'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Vence em {formatDate(invoice.dueDate)}
                        {invoice.status === 'pending' && daysUntil < 0 && (
                          <span className="text-red-600 ml-1">(Atrasada)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(invoice.amountCents)}</p>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        invoice.status === "paid" && "border-green-200 text-green-700 bg-green-50",
                        invoice.status === "pending" && "border-amber-200 text-amber-700 bg-amber-50",
                        invoice.status === "failed" && "border-red-200 text-red-700 bg-red-50"
                      )}
                    >
                      {invoice.status === 'paid' ? 'Paga' : invoice.status === 'pending' ? 'Pendente' : 'Falhou'}
                    </Badge>
                  </div>
                </div>
              )
            })}
            {invoices.length === 0 && (
              <div className="px-4 py-8 text-center text-muted-foreground">
                Nenhuma fatura encontrada
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Links Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/configuracoes/assinaturas">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-[#46347F]/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-[#46347F]" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Gerenciar Assinatura</h3>
                <p className="text-sm text-muted-foreground">Alterar plano ou cancelar</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/configuracoes/assinaturas/faturas">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-[#46347F]/10 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-[#46347F]" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Histórico de Faturas</h3>
                <p className="text-sm text-muted-foreground">Ver todas as faturas</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
