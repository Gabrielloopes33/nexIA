"use client"

import { useEffect, useState } from "react"
import { 
  Facebook, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Shield,
  MessageCircle,
  Building2,
  ArrowRight,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useEmbeddedSignup, type EmbeddedSignupStatus, type EmbeddedSignupResult } from "@/hooks/use-embedded-signup"
import { cn } from "@/lib/utils"

// ============================================
// Types
// ============================================

interface EmbeddedSignupFlowProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (result: { account: { id: string; name: string; wabaId: string }; accessToken: string }) => void
  onError?: (error: string) => void
}

interface StepConfig {
  id: string
  label: string
  description: string
  icon: React.ElementType
}

// ============================================
// Constants
// ============================================

const FLOW_STEPS: StepConfig[] = [
  {
    id: "loading_sdk",
    label: "Carregando configuração",
    description: "Obtendo configurações do servidor...",
    icon: Loader2,
  },
  {
    id: "initializing",
    label: "Inicializando SDK",
    description: "Carregando Facebook SDK...",
    icon: Loader2,
  },
  {
    id: "waiting_auth",
    label: "Aguardando autorização",
    description: "Aguardando login no Facebook...",
    icon: Facebook,
  },
  {
    id: "exchanging_token",
    label: "Trocando código",
    description: "Trocando código por token de acesso...",
    icon: Shield,
  },
  {
    id: "fetching_waba",
    label: "Buscando dados",
    description: "Obtendo informações da conta WABA...",
    icon: Building2,
  },
]

const PERMISSIONS = [
  {
    icon: Building2,
    title: "Contas WhatsApp Business",
    description: "Acessar e gerenciar suas contas WABA",
  },
  {
    icon: MessageCircle,
    title: "Envio e Recebimento",
    description: "Enviar e receber mensagens de WhatsApp",
  },
  {
    icon: Shield,
    title: "Templates de Mensagem",
    description: "Criar e gerenciar templates",
  },
  {
    icon: Building2,
    title: "Números de Telefone",
    description: "Ver e configurar números de telefone",
  },
]

// ============================================
// Helper Functions
// ============================================

function getStepProgress(status: EmbeddedSignupStatus): number {
  const stepIndex = FLOW_STEPS.findIndex(step => step.id === status)
  if (stepIndex === -1) {
    if (status === "success") return 100
    if (status === "error") return 0
    return 0
  }
  return Math.min(((stepIndex + 1) / FLOW_STEPS.length) * 100, 100)
}

function getCurrentStep(status: EmbeddedSignupStatus): StepConfig | null {
  return FLOW_STEPS.find(step => step.id === status) || null
}

// ============================================
// Components
// ============================================

function FlowProgress({ status }: { status: EmbeddedSignupStatus }) {
  const progress = getStepProgress(status)
  const currentStep = getCurrentStep(status)

  if (status === "idle" || status === "success" || status === "error") {
    return null
  }

  return (
    <div className="space-y-4">
      <Progress value={progress} className="h-2" />
      
      {currentStep && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1877F2]/10">
            <currentStep.icon className="h-5 w-5 text-[#1877F2] animate-pulse" />
          </div>
          <div className="flex-1">
            <p className="font-medium">{currentStep.label}</p>
            <p className="text-sm text-muted-foreground">{currentStep.description}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-5 gap-2">
        {FLOW_STEPS.map((step, index) => {
          const stepProgress = getStepProgress(status)
          const isCompleted = ((index + 1) / FLOW_STEPS.length) * 100 <= stepProgress
          const isCurrent = step.id === status

          return (
            <div
              key={step.id}
              className={cn(
                "h-1.5 rounded-full transition-colors duration-300",
                isCompleted 
                  ? "bg-[#1877F2]" 
                  : isCurrent 
                    ? "bg-[#1877F2]/50" 
                    : "bg-muted"
              )}
            />
          )
        })}
      </div>
    </div>
  )
}

function PermissionList() {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">Permissões necessárias:</h4>
      <div className="grid gap-3">
        {PERMISSIONS.map((permission) => (
          <div
            key={permission.title}
            className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#9795e4]/10">
              <permission.icon className="h-4 w-4 text-[#9795e4]" />
            </div>
            <div>
              <p className="text-sm font-medium">{permission.title}</p>
              <p className="text-xs text-muted-foreground">{permission.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface SuccessViewProps {
  result: NonNullable<EmbeddedSignupResult>
  onClose: () => void
}

function SuccessView({ 
  result, 
  onClose 
}: SuccessViewProps) {
  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>
        <h3 className="mt-4 text-xl font-semibold text-emerald-600">
          Conta conectada com sucesso!
        </h3>
        <p className="mt-1 text-muted-foreground">
          Sua conta WhatsApp Business foi integrada ao NexIA
        </p>
      </div>

      {result.account && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <h4 className="mb-3 text-sm font-semibold">Detalhes da conta:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nome:</span>
              <span className="font-medium">{result.account.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">WABA ID:</span>
              <span className="font-mono text-xs">{result.account.wabaId}</span>
            </div>
            {result.account.phoneNumbers && result.account.phoneNumbers.length > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Números:</span>
                <span className="font-medium">{result.account.phoneNumbers.length}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <Button 
        onClick={onClose} 
        className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
      >
        <ArrowRight className="h-4 w-4" />
        Continuar
      </Button>
    </div>
  )
}

function ErrorView({ 
  error, 
  onRetry,
  onClose 
}: { 
  error: string
  onRetry: () => void
  onClose: () => void
}) {
  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <XCircle className="h-10 w-10 text-red-600" />
        </div>
        <h3 className="mt-4 text-xl font-semibold text-red-600">
          Erro na conexão
        </h3>
        <p className="mt-1 text-muted-foreground">
          Não foi possível conectar sua conta WhatsApp Business
        </p>
      </div>

      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription className="break-all">
          {error}
        </AlertDescription>
      </Alert>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancelar
        </Button>
        <Button onClick={onRetry} className="flex-1 gap-2 bg-[#1877F2] hover:bg-[#166fe5]">
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    </div>
  )
}

function InitialView({ 
  onStart, 
  isLoading 
}: { 
  onStart: () => void
  isLoading: boolean
}) {
  return (
    <div className="space-y-6 py-4">
      <PermissionList />

      <Alert className="border-amber-200 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Importante</AlertTitle>
        <AlertDescription className="text-amber-700">
          Certifique-se de ter permissões de administrador no Business Manager 
          do Facebook para completar esta conexão.
        </AlertDescription>
      </Alert>

      <Button
        onClick={onStart}
        disabled={isLoading}
        className="w-full gap-2 bg-[#1877F2] hover:bg-[#166fe5] h-12"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando...
          </>
        ) : (
          <>
            <Facebook className="h-5 w-5" />
            Conectar com Facebook
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Ao conectar, você concorda com os{" "}
        <a 
          href="https://www.whatsapp.com/legal/business-policy" 
          target="_blank" 
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          Termos de Serviço do WhatsApp Business
        </a>
      </p>
    </div>
  )
}

function ProcessingView({ status }: { status: EmbeddedSignupStatus }) {
  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-col items-center text-center">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-[#1877F2]/20" />
          <div className="absolute inset-0 rounded-full border-4 border-t-[#1877F2] animate-spin" />
          <Facebook className="h-8 w-8 text-[#1877F2]" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">
          Conectando ao Facebook
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Isso pode levar alguns segundos...
        </p>
      </div>

      <FlowProgress status={status} />

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 shrink-0 text-[#9795e4]" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Segurança</p>
            <p>
              Seus dados são protegidos e criptografados. Nunca compartilhamos 
              suas informações com terceiros.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Main Component
// ============================================

export function EmbeddedSignupFlow({ 
  isOpen, 
  onClose, 
  onSuccess, 
  onError 
}: EmbeddedSignupFlowProps) {
  const { 
    status, 
    error, 
    isLoading, 
    result, 
    launchSignup, 
    reset 
  } = useEmbeddedSignup()
  
  const [hasStarted, setHasStarted] = useState(false)

  // Handle success callback
  useEffect(() => {
    if (status === "success" && result?.success && result.account) {
      onSuccess?.({
        account: {
          id: result.account.id,
          name: result.account.name,
          wabaId: result.account.wabaId,
        },
        accessToken: result.accessToken || "",
      })
    }
  }, [status, result, onSuccess])

  // Handle error callback
  useEffect(() => {
    if (status === "error" && error) {
      onError?.(error)
    }
  }, [status, error, onError])

  // Reset when dialog closes
  useEffect(() => {
    if (!isOpen) {
      reset()
      setHasStarted(false)
    }
  }, [isOpen, reset])

  const handleStart = async () => {
    setHasStarted(true)
    await launchSignup()
  }

  const handleRetry = () => {
    reset()
    setHasStarted(false)
  }

  const handleClose = () => {
    reset()
    setHasStarted(false)
    onClose()
  }

  const renderContent = () => {
    // Error state
    if (status === "error" && error) {
      return <ErrorView error={error} onRetry={handleRetry} onClose={handleClose} />
    }

    // Success state
    if (status === "success" && result) {
      return <SuccessView result={result} onClose={handleClose} />
    }

    // Processing states
    if (hasStarted && (isLoading || status !== "idle")) {
      return <ProcessingView status={status} />
    }

    // Initial state
    return <InitialView onStart={handleStart} isLoading={isLoading} />
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-[#1877F2]" />
            Conectar WhatsApp Business
          </DialogTitle>
          <DialogDescription>
            Autorize o NexIA a acessar sua conta WhatsApp Business através do Facebook.
          </DialogDescription>
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}
