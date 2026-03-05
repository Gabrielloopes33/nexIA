"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  ArrowLeft,
  Plus,
  Check,
  CreditCard,
  Package,
  User,
  Mail,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle
} from "lucide-react"
import Link from "next/link"

const planos = [
  { id: "starter", nome: "Starter", preco: "R$ 99,00", recursos: ["Até 5 usuários", "1.000 contatos"] },
  { id: "pro", nome: "Pro", preco: "R$ 199,00", recursos: ["Até 20 usuários", "10.000 contatos", "Automações"] },
  { id: "business", nome: "Business", preco: "R$ 299,00", recursos: ["Usuários ilimitados", "50.000 contatos", "API"] },
  { id: "enterprise", nome: "Enterprise", preco: "R$ 499,00", recursos: ["Tudo ilimitado", "Suporte dedicado", "White-label"] },
]

const metodosPagamento = [
  { id: "cartao", nome: "Cartão de Crédito", icon: CreditCard },
  { id: "boleto", nome: "Boleto Bancário", icon: FileText },
  { id: "pix", nome: "Pix", icon: DollarSign },
]

export default function NovaAssinaturaPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [planoSelecionado, setPlanoSelecionado] = useState("")
  const [metodoPagamento, setMetodoPagamento] = useState("")
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    empresa: "",
    telefone: "",
    cpfCnpj: "",
  })

  const handleSubmit = () => {
    // TODO: Integrar com Stripe
    alert("Assinatura criada com sucesso! (Integração com Stripe pendente)")
    router.push("/cobrancas/assinaturas")
  }

  const plano = planos.find(p => p.id === planoSelecionado)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/cobrancas">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nova Assinatura</h1>
          <p className="text-sm text-muted-foreground">
            Crie uma nova assinatura para seu cliente
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#9795e4]' : 'text-muted-foreground'}`}>
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-[#9795e4] text-white' : 'bg-muted'}`}>
            1
          </div>
          <span className="text-sm font-medium hidden sm:inline">Cliente</span>
        </div>
        <div className="h-px flex-1 bg-border max-w-[60px]" />
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#9795e4]' : 'text-muted-foreground'}`}>
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-[#9795e4] text-white' : 'bg-muted'}`}>
            2
          </div>
          <span className="text-sm font-medium hidden sm:inline">Plano</span>
        </div>
        <div className="h-px flex-1 bg-border max-w-[60px]" />
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-[#9795e4]' : 'text-muted-foreground'}`}>
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 3 ? 'bg-[#9795e4] text-white' : 'bg-muted'}`}>
            3
          </div>
          <span className="text-sm font-medium hidden sm:inline">Pagamento</span>
        </div>
      </div>

      {/* Step 1: Dados do Cliente */}
      {step === 1 && (
        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-[#9795e4]" />
              Dados do Cliente
            </CardTitle>
            <CardDescription>
              Informações do cliente para a assinatura
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
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input 
                  type="email"
                  placeholder="joao@empresa.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Empresa</Label>
                <Input 
                  placeholder="Empresa Ltda"
                  value={formData.empresa}
                  onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input 
                  placeholder="(11) 98765-4321"
                  value={formData.telefone}
                  onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>CPF/CNPJ</Label>
              <Input 
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                value={formData.cpfCnpj}
                onChange={(e) => setFormData({...formData, cpfCnpj: e.target.value})}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                className="gap-2 bg-[#9795e4] hover:bg-[#7c7ab8]"
                onClick={() => setStep(2)}
                disabled={!formData.nome || !formData.email}
              >
                Próximo
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Seleção do Plano */}
      {step === 2 && (
        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-[#9795e4]" />
              Selecione o Plano
            </CardTitle>
            <CardDescription>
              Escolha o plano que melhor atende suas necessidades
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {planos.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setPlanoSelecionado(p.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    planoSelecionado === p.id 
                      ? 'border-[#9795e4] bg-[#9795e4]/5' 
                      : 'border-border hover:border-[#9795e4]/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold">{p.nome}</h3>
                    {planoSelecionado === p.id && (
                      <div className="h-5 w-5 rounded-full bg-[#9795e4] flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-[#9795e4] mb-2">{p.preco}<span className="text-sm text-muted-foreground">/mês</span></p>
                  <ul className="space-y-1">
                    {p.recursos.map((recurso, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-500" />
                        {recurso}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="border-0 shadow-sm">
                Voltar
              </Button>
              <Button 
                className="gap-2 bg-[#9795e4] hover:bg-[#7c7ab8]"
                onClick={() => setStep(3)}
                disabled={!planoSelecionado}
              >
                Próximo
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Pagamento */}
      {step === 3 && (
        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#9795e4]" />
              Método de Pagamento
            </CardTitle>
            <CardDescription>
              Configure como o cliente fará o pagamento
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-6">
            {/* Resumo */}
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Resumo da Assinatura</h4>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Cliente:</span> {formData.nome}</p>
                <p><span className="text-muted-foreground">Email:</span> {formData.email}</p>
                <p><span className="text-muted-foreground">Plano:</span> {plano?.nome} - {plano?.preco}/mês</p>
              </div>
            </div>

            {/* Métodos de Pagamento */}
            <div className="space-y-3">
              <Label>Selecione o Método de Pagamento</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {metodosPagamento.map((metodo) => {
                  const Icon = metodo.icon
                  return (
                    <div
                      key={metodo.id}
                      onClick={() => setMetodoPagamento(metodo.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-3 ${
                        metodoPagamento === metodo.id 
                          ? 'border-[#9795e4] bg-[#9795e4]/5' 
                          : 'border-border hover:border-[#9795e4]/50'
                      }`}
                    >
                      <Icon className="h-5 w-5 text-[#9795e4]" />
                      <span className="font-medium">{metodo.nome}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Aviso Stripe */}
            <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/50 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-amber-800">Integração com Stripe</p>
                <p className="text-sm text-amber-700">
                  O processamento de pagamentos será feito via Stripe. 
                  Configure suas chaves de API em Configurações &gt; Integração.
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                Voltar
              </Button>
              <Button 
                className="gap-2 bg-[#9795e4] hover:bg-[#7c7ab8]"
                onClick={handleSubmit}
                disabled={!metodoPagamento}
              >
                <Plus className="h-4 w-4" />
                Criar Assinatura
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
