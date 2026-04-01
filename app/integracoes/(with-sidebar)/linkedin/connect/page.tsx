"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, CheckCircle2, Info, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

export default function LinkedInConnectPage() {
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const errorParam = searchParams.get("error")

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/integrations/linkedin/auth")
      const json = await response.json()

      if (!json.success || !json.data?.authUrl) {
        throw new Error(json.error || "Falha ao gerar URL de autorização")
      }

      window.location.href = json.data.authUrl
    } catch (error) {
      setIsLoading(false)
      toast.error(
        error instanceof Error ? error.message : "Erro ao iniciar conexão com LinkedIn"
      )
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/integracoes/linkedin">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0A66C2]/10 flex items-center justify-center">
            <LinkedInIcon className="h-5 w-5 text-[#0A66C2]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Conectar LinkedIn Ads</h1>
            <p className="text-muted-foreground mt-1">
              Sincronize leads dos seus Lead Gen Forms diretamente no CRM
            </p>
          </div>
        </div>
      </div>

      {/* Erro vindo do callback */}
      {errorParam && (
        <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            {errorParam === "access_denied"
              ? "Acesso negado. Você precisa autorizar as permissões para continuar."
              : errorParam === "no_code"
              ? "Código de autorização não recebido. Tente novamente."
              : `Erro na autenticação: ${errorParam}`}
          </AlertDescription>
        </Alert>
      )}

      {/* Requisitos */}
      <Card className="mb-6 border-border">
        <CardHeader>
          <CardTitle>Requisitos</CardTitle>
          <CardDescription>
            Para conectar o LinkedIn Ads, você precisa:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Conta LinkedIn Ads</p>
                <p className="text-sm text-muted-foreground">
                  Você precisa ter uma conta de anúncios ativa no LinkedIn Campaign Manager
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Role de Account Administrator ou Campaign Manager</p>
                <p className="text-sm text-muted-foreground">
                  Você precisa ter permissão de administrador na conta de anúncios
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Lead Gen Forms configurados</p>
                <p className="text-sm text-muted-foreground">
                  Você precisa ter pelo menos um formulário criado no Campaign Manager
                </p>
              </div>
            </li>
          </ul>

          <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              Durante a autorização, você concederá permissões para:
              <ul className="mt-2 ml-4 list-disc space-y-1">
                <li>Ler perfil e email da conta LinkedIn</li>
                <li>Acessar contas de anúncios e campanhas</li>
                <li>Ler respostas dos Lead Gen Forms</li>
                <li>Gerenciar notificações de novos leads via webhook</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Botão de conexão */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Iniciar Conexão</CardTitle>
          <CardDescription>
            Você será redirecionado para a página de autorização do LinkedIn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleConnect}
            disabled={isLoading}
            className="w-full gap-3 bg-[#0A66C2] hover:bg-[#004182] text-white h-12 text-base"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Redirecionando...
              </>
            ) : (
              <>
                <LinkedInIcon className="h-5 w-5" />
                Entrar com LinkedIn
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
