"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Check, 
  MessageSquare, 
  Instagram, 
  ShoppingCart,
  Globe,
  Bot,
  Key,
  Link2,
  AlertCircle,
  Loader2,
  X
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const integracoesDisponiveis = [
  { 
    id: "whatsapp-oficial", 
    nome: "WhatsApp Oficial", 
    descricao: "API oficial do WhatsApp Business via Meta",
    icon: MessageSquare, 
    cor: "#25D366",
    authType: "oauth",
    popular: true 
  },
  { 
    id: "whatsapp-nao-oficial", 
    nome: "WhatsApp Não Oficial", 
    descricao: "Conexão via Evolution API/WhatsApp Web",
    icon: MessageSquare, 
    cor: "#128C7E",
    authType: "api_key" 
  },
  {
    id: "instagram",
    nome: "Instagram",
    descricao: "Gerencie mensagens diretas e comentários",
    icon: Instagram,
    cor: "#E4405F",
    authType: "oauth"
  },
  {
    id: "linkedin",
    nome: "LinkedIn Ads",
    descricao: "Capture leads dos Lead Gen Forms automaticamente",
    icon: ({ className }: { className?: string }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    cor: "#0A66C2",
    authType: "oauth"
  },
  {
    id: "typebot",
    nome: "Typebot",
    descricao: "Capture respostas de fluxos e sincronize contatos automaticamente",
    icon: Bot,
    cor: "#46347F",
    authType: "api_key",
  },
  { 
    id: "hotmart", 
    nome: "Hotmart", 
    descricao: "Sincronize vendas e assinaturas",
    icon: ShoppingCart, 
    cor: "#FF6700",
    authType: "webhook" 
  },
  { 
    id: "webhook", 
    nome: "Webhook Personalizado", 
    descricao: "Configure um endpoint customizado",
    icon: Globe, 
    cor: "#6B7280",
    authType: "api_key" 
  },
]

export default function NovaIntegracaoPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [integracaoSelecionada, setIntegracaoSelecionada] = useState<string | null>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [config, setConfig] = useState({
    apiKey: "",
    webhookUrl: "",
    nome: "",
  })

  const integracao = integracoesDisponiveis.find(i => i.id === integracaoSelecionada)

  const handleTest = async () => {
    setIsTesting(true)
    setTestResult(null)
    // Simula teste de conexão
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsTesting(false)
    setTestResult(Math.random() > 0.3 ? 'success' : 'error')
  }

  const handleSubmit = () => {
    alert("Integração criada com sucesso!")
    router.push("/integracoes")
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/integracoes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Nova Integração</h1>
          <p className="text-sm text-muted-foreground">
            Configure uma nova integração em poucos passos
          </p>
        </div>
        <Link href="/integracoes">
          <Button variant="ghost" size="sm" className="gap-1">
            <X className="h-4 w-4" />
            Cancelar
          </Button>
        </Link>
      </div>

      {/* Steps */}
      <div className="flex items-center justify-center gap-4">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#46347F]' : 'text-muted-foreground'}`}>
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-[#46347F] text-white' : 'bg-muted'}`}>
            1
          </div>
          <span className="text-sm font-medium hidden sm:inline">Escolher</span>
        </div>
        <div className="h-px w-12 bg-border" />
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#46347F]' : 'text-muted-foreground'}`}>
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-[#46347F] text-white' : 'bg-muted'}`}>
            2
          </div>
          <span className="text-sm font-medium hidden sm:inline">Configurar</span>
        </div>
        <div className="h-px w-12 bg-border" />
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-[#46347F]' : 'text-muted-foreground'}`}>
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 3 ? 'bg-[#46347F] text-white' : 'bg-muted'}`}>
            3
          </div>
          <span className="text-sm font-medium hidden sm:inline">Testar</span>
        </div>
      </div>

      {/* Step 1: Escolher Integração */}
      {step === 1 && (
        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-lg">Escolha uma integração</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {integracoesDisponiveis.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.id}
                    onClick={() => setIntegracaoSelecionada(item.id)}
                    className={cn(
                      "p-4 rounded-lg border-2 cursor-pointer transition-all relative",
                      integracaoSelecionada === item.id 
                        ? 'border-[#46347F] bg-[#46347F]/5' 
                        : 'border-border hover:border-[#46347F]/50'
                    )}
                  >
                    {item.popular && (
                      <Badge className="absolute -top-2 -right-2 bg-[#46347F]">Popular</Badge>
                    )}
                    <div className="flex items-start gap-3">
                      <div 
                        className="h-10 w-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${item.cor}20` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: item.cor }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{item.nome}</p>
                          {integracaoSelecionada === item.id && (
                            <Check className="h-4 w-4 text-[#46347F]" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{item.descricao}</p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {item.authType === 'oauth' ? 'OAuth' : item.authType === 'api_key' ? 'API Key' : 'Webhook'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end mt-6">
              <Button 
                className="gap-2 bg-[#46347F] hover:bg-[#46347F]"
                onClick={() => setStep(2)}
                disabled={!integracaoSelecionada}
              >
                Próximo
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Configurar */}
      {step === 2 && integracao && (
        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <div 
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${integracao.cor}20` }}
              >
                <integracao.icon className="h-4 w-4" style={{ color: integracao.cor }} />
              </div>
              Configurar {integracao.nome}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Nome da Integração</Label>
              <Input 
                placeholder={`Minha integração ${integracao.nome}`}
                value={config.nome}
                onChange={(e) => setConfig({...config, nome: e.target.value})}
              />
            </div>

            {integracao.authType === 'oauth' && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Link2 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-blue-900">Autenticação OAuth</p>
                    <p className="text-sm text-blue-700">
                      Você será redirecionado para a página de autenticação do {integracao.nome}.
                    </p>
                    <Link href={
                      integracao.id === 'linkedin'
                        ? '/integracoes/linkedin/connect'
                        : '#'
                    }>
                      <Button className="mt-3 gap-2" variant="outline">
                        <Link2 className="h-4 w-4" />
                        Conectar com {integracao.nome}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {integracao.authType === 'api_key' && (
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input 
                  type="password"
                  placeholder="sk-xxxxxxxxxxxxxxxx"
                  value={config.apiKey}
                  onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                />
                <p className="text-xs text-muted-foreground">
                  Você pode encontrar sua API Key no painel de desenvolvedor do {integracao.nome}.
                </p>
                {integracao.id === 'typebot' && (
                  <Link href="/integracoes/typebot" className="inline-block pt-2">
                    <Button variant="outline" size="sm" className="border-0 shadow-sm">
                      Abrir configuração do Typebot
                    </Button>
                  </Link>
                )}
              </div>
            )}

            {integracao.authType === 'webhook' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>URL do Webhook</Label>
                  <Input 
                    placeholder="https://seusite.com/webhook"
                    value={config.webhookUrl}
                    onChange={(e) => setConfig({...config, webhookUrl: e.target.value})}
                  />
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">URL de Callback</p>
                  <code className="text-xs text-muted-foreground break-all">
                    https://api.nexia.com/webhooks/{integracao.id}
                  </code>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="border-0 shadow-sm">
                Voltar
              </Button>
              <Button 
                className="gap-2 bg-[#46347F] hover:bg-[#46347F]"
                onClick={() => setStep(3)}
              >
                Próximo
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Testar */}
      {step === 3 && integracao && (
        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-lg">Testar Conexão</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-6">
            {/* Resumo */}
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${integracao.cor}20` }}
                >
                  <integracao.icon className="h-5 w-5" style={{ color: integracao.cor }} />
                </div>
                <div>
                  <p className="font-medium">{config.nome || integracao.nome}</p>
                  <p className="text-sm text-muted-foreground">{integracao.descricao}</p>
                </div>
              </div>
            </div>

            {/* Teste */}
            <div className="text-center py-8">
              {!isTesting && !testResult && (
                <>
                  <div className="h-16 w-16 rounded-full bg-[#46347F]/10 flex items-center justify-center mx-auto mb-4">
                    <Globe className="h-8 w-8 text-[#46347F]" />
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Clique em testar para verificar a conexão
                  </p>
                  <Button onClick={handleTest} className="gap-2 bg-[#46347F] hover:bg-[#46347F]">
                    Testar Conexão
                  </Button>
                </>
              )}

              {isTesting && (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-[#46347F] mx-auto mb-4" />
                  <p className="text-muted-foreground">Testando conexão...</p>
                </>
              )}

              {testResult === 'success' && (
                <>
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="font-medium text-green-600 mb-2">Conexão estabelecida!</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    A integração está funcionando corretamente.
                  </p>
                </>
              )}

              {testResult === 'error' && (
                <>
                  <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <p className="font-medium text-red-600 mb-2">Falha na conexão</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Verifique suas credenciais e tente novamente.
                  </p>
                  <Button onClick={handleTest} variant="outline" className="gap-2 border-0 shadow-sm">
                    Tentar Novamente
                  </Button>
                </>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)} className="border-0 shadow-sm">
                Voltar
              </Button>
              <Button 
                className="gap-2 bg-[#46347F] hover:bg-[#46347F]"
                onClick={handleSubmit}
                disabled={testResult !== 'success'}
              >
                <Check className="h-4 w-4" />
                Finalizar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
