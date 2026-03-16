"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Receipt, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  CreditCard,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface Invoice {
  id: string
  subscriptionId: string
  organizationId: string
  amountCents: number
  status: 'pending' | 'paid' | 'failed'
  dueDate: string
  paidAt?: string
  invoiceUrl?: string
  stripeInvoiceId?: string
  createdAt: string
  updatedAt: string
  subscription?: {
    plan?: {
      name: string
      priceCents: number
      interval: string
    }
  }
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR')
}

export default function FaturaPage() {
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!params.id) return
      
      try {
        const response = await fetch(`/api/invoices/${params.id}`)
        const data = await response.json()
        
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Erro ao carregar fatura')
        }
        
        setInvoice(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar fatura')
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvoice()
  }, [params.id])

  const handlePayment = async () => {
    if (!invoice) return
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: invoice.amountCents,
        }),
      })
      
      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Erro ao iniciar pagamento:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#46347F]" />
          <p className="text-muted-foreground">Carregando fatura...</p>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h3 className="text-lg font-semibold">Erro ao carregar fatura</h3>
          <p className="text-muted-foreground">{error || 'Fatura não encontrada'}</p>
          <Link href="/cobrancas">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Cobranças
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const statusConfig = {
    paid: { 
      label: "Paga", 
      icon: CheckCircle2, 
      color: "bg-green-100 text-green-700 border-green-200",
      bgColor: "bg-green-50"
    },
    pending: { 
      label: "Pendente", 
      icon: Clock, 
      color: "bg-amber-100 text-amber-700 border-amber-200",
      bgColor: "bg-amber-50"
    },
    failed: { 
      label: "Falhou", 
      icon: AlertCircle, 
      color: "bg-red-100 text-red-700 border-red-200",
      bgColor: "bg-red-50"
    },
  }

  const status = statusConfig[invoice.status]
  const StatusIcon = status.icon

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/cobrancas">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <Badge className={cn("px-3 py-1", status.color)}>
          <StatusIcon className="h-3.5 w-3.5 mr-1" />
          {status.label}
        </Badge>
      </div>

      {/* Invoice Card */}
      <Card className={cn("border-2", status.bgColor)}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center">
                <Receipt className="h-6 w-6 text-[#46347F]" />
              </div>
              <div>
                <CardTitle className="text-xl">Fatura #{invoice.id.slice(0, 8)}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Emitida em {formatDate(invoice.createdAt)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{formatCurrency(invoice.amountCents)}</p>
              <p className="text-sm text-muted-foreground">
                {invoice.subscription?.plan?.name || 'Plano'}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Detalhes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Data de Vencimento</p>
              <p className="font-medium">{formatDate(invoice.dueDate)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">{status.label}</p>
            </div>
            {invoice.paidAt && (
              <>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Data do Pagamento</p>
                  <p className="font-medium">{formatDate(invoice.paidAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Método</p>
                  <p className="font-medium">Cartão de Crédito</p>
                </div>
              </>
            )}
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* Resumo */}
          <div>
            <h3 className="font-semibold mb-3">Resumo</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Plano</span>
                <span>{invoice.subscription?.plan?.name || 'Plano'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Periodicidade</span>
                <span>{invoice.subscription?.plan?.interval === 'monthly' ? 'Mensal' : 'Anual'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor</span>
                <span>{formatCurrency(invoice.subscription?.plan?.priceCents || invoice.amountCents)}</span>
              </div>
              <div className="border-t my-2" />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(invoice.amountCents)}</span>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-3">
            {invoice.status === 'pending' && (
              <Button 
                className="flex-1 bg-[#46347F] hover:bg-[#46347F]"
                onClick={handlePayment}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pagar Agora
              </Button>
            )}
            {invoice.invoiceUrl && (
              <Button variant="outline" className="flex-1" asChild>
                <a href={invoice.invoiceUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações Adicionais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">ID da Fatura:</span> {invoice.id}</p>
          {invoice.stripeInvoiceId && (
            <p><span className="text-muted-foreground">ID Stripe:</span> {invoice.stripeInvoiceId}</p>
          )}
          <p><span className="text-muted-foreground">Última atualização:</span> {formatDate(invoice.updatedAt)}</p>
        </CardContent>
      </Card>
    </div>
  )
}
