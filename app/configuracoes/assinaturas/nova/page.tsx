"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  ArrowLeft,
  Check,
  CreditCard,
  User,
  Mail,
  Building2,
  Loader2,
  AlertCircle
} from "lucide-react"
import Link from "next/link"

const PLANO_NEXIA = {
  id: "nexia-chat",
  nome: "Nexia Chat",
  preco: "R$ 300,00",
  precoCents: 30000,
  intervalo: "3 meses",
  recursos: [
    "Acesso completo ao CRM",
    "WhatsApp Business API",
    "Instagram Direct",
    "Pipeline de vendas",
    "Dashboard de métricas",
    "Agendamentos",
    "Suporte prioritário"
  ],
}

export default function NovaAssinaturaPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    empresa: "",
  })

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Chama a API de checkout do Stripe
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || '',
          customerEmail: formData.email,
          metadata: {
            customerName: formData.nome,
            customerEmail: formData.email,
            company: formData.empresa,
            plan: PLANO_NEXIA.nome,
          }
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar sessão de checkout')
      }

      // Redireciona para o checkout do Stripe
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('URL de checkout não recebida')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar assinatura')
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/configuracoes/assinaturas">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nova Assinatura</h1>
          <p className="text-sm text-muted-foreground">
            Assine o Nexia Chat e comece a usar agora
          </p>
        </div>
      </div>

      {/* Plano Fixo */}
      <Card className="shadow-sm border-[#46347F]/20">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <Check className="h-5 w-5 text-[#46347F]" />
            Plano Selecionado
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="p-4 rounded-lg bg-[#46347F]/5 border border-[#46347F]/20">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-lg">{PLANO_NEXIA.nome}</h3>
              <div className="text-right">
                <p className="text-2xl font-bold text-[#46347F]">{PLANO_NEXIA.preco}</p>
                <p className="text-sm text-muted-foreground">a cada {PLANO_NEXIA.intervalo}</p>
              </div>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PLANO_NEXIA.recursos.map((recurso, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                  {recurso}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Dados do Cliente */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-[#46347F]" />
            Dados do Cliente
          </CardTitle>
          <CardDescription>
            Informações para a assinatura
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input 
                placeholder="João Silva"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input 
                type="email"
                placeholder="joao@empresa.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Empresa</Label>
            <Input 
              placeholder="Empresa Ltda"
              value={formData.empresa}
              onChange={(e) => setFormData({...formData, empresa: e.target.value})}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="p-4 rounded-lg border border-red-200 bg-red-50/50 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm text-red-800">Erro</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Link href="/configuracoes/assinaturas">
              <Button variant="outline" disabled={isLoading}>
                Voltar
              </Button>
            </Link>
            <Button 
              className="gap-2 bg-[#46347F] hover:bg-[#46347F]"
              onClick={handleSubmit}
              disabled={!formData.nome || !formData.email || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Ir para Pagamento
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <p className="text-center text-xs text-muted-foreground">
        Você será redirecionado para o Stripe para finalizar o pagamento de forma segura.
      </p>
    </div>
  )
}
