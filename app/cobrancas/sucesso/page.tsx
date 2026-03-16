"use client"

import { useEffect, useState, Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle2, 
  ArrowRight,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

function SucessoContent() {
  const searchParams = useSearchParams()
  const [isVerifying, setIsVerifying] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setIsVerifying(false)
        return
      }

      try {
        // Aqui você pode verificar o status da sessão de checkout no backend
        // const response = await fetch(`/api/stripe/session?sessionId=${sessionId}`)
        // const data = await response.json()
        
        // Por enquanto, apenas simulamos a verificação
        await new Promise(resolve => setTimeout(resolve, 1500))
        setIsVerifying(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao verificar pagamento')
        setIsVerifying(false)
      }
    }

    verifyPayment()
  }, [sessionId])

  if (isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#46347F]" />
          <p className="text-muted-foreground">Verificando seu pagamento...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Algo deu errado</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Link href="/cobrancas">
              <Button className="w-full bg-[#46347F] hover:bg-[#46347F]">
                Voltar para Cobranças
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full mx-4">
        <CardContent className="p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Pagamento Confirmado!</h1>
          <p className="text-muted-foreground mb-6">
            Obrigado pelo seu pagamento. Sua assinatura está ativa e você já pode usar todos os recursos.
          </p>
          <div className="space-y-3">
            <Link href="/cobrancas">
              <Button className="w-full bg-[#46347F] hover:bg-[#46347F]">
                Ver Minhas Cobranças
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/configuracoes/assinaturas">
              <Button variant="outline" className="w-full">
                Gerenciar Assinatura
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#46347F]" />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </div>
  )
}

export default function SucessoPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SucessoContent />
    </Suspense>
  )
}
