"use client"

import { useState, useCallback, useMemo } from "react"
import { Facebook, Loader2, AlertCircle, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useWhatsApp } from "@/hooks/use-whatsapp"
import { useEmbeddedSignup } from "@/hooks/use-embedded-signup"
import { cn } from "@/lib/utils"

// ============================================
// Types
// ============================================

interface EmbeddedSignupButtonProps {
  className?: string
  onSuccess?: () => void
  onError?: (error: string) => void
  /** Whether to use the legacy mock flow (false uses real Embedded Signup) */
  useLegacyFlow?: boolean
}

interface PermissionItemProps {
  children: React.ReactNode
}

// ============================================
// Components
// ============================================

function PermissionItem({ children }: PermissionItemProps) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#9795e4]" />
      <span className="text-sm text-muted-foreground">{children}</span>
    </li>
  )
}

function LegacyFlowDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <h4 className="mb-3 text-sm font-semibold">Permissões necessárias:</h4>
            <ul className="space-y-2">
              <PermissionItem>Acessar contas WhatsApp Business</PermissionItem>
              <PermissionItem>Enviar e receber mensagens</PermissionItem>
              <PermissionItem>Gerenciar templates de mensagem</PermissionItem>
              <PermissionItem>Ver números de telefone</PermissionItem>
            </ul>
          </div>

          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700">
              Certifique-se de ter permissões de administrador no Business Manager 
              do Facebook para completar esta conexão.
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="gap-2 bg-[#1877F2] hover:bg-[#166fe5]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <Facebook className="h-4 w-4" />
                Continuar com Facebook
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function EmbeddedSignupFlowDialog({
  isOpen,
  onClose,
  onStart,
  status,
  error,
  isHttps,
}: {
  isOpen: boolean
  onClose: () => void
  onStart: () => void
  status: ReturnType<typeof useEmbeddedSignup>["status"]
  error: string | null
  isHttps: boolean
}) {
  const isLoading = status !== "idle" && status !== "error" && status !== "success"
  const hasError = status === "error" && error

  const getStatusMessage = () => {
    switch (status) {
      case "loading_sdk":
        return "Carregando configuração..."
      case "initializing":
        return "Inicializando SDK do Facebook..."
      case "waiting_auth":
        return "Aguardando autorização..."
      case "exchanging_token":
        return "Trocando código por token..."
      case "fetching_waba":
        return "Buscando informações da conta..."
      case "success":
        return "Conta conectada com sucesso!"
      case "error":
        return "Erro na conexão"
      default:
        return "Preparando conexão..."
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-[#1877F2]" />
            Conectar WhatsApp Business
          </DialogTitle>
          <DialogDescription>
            {isLoading 
              ? "Por favor, aguarde enquanto conectamos sua conta..."
              : "Autorize o NexIA a acessar sua conta WhatsApp Business através do Facebook."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center py-6">
              <div className="relative flex h-16 w-16 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-[#1877F2]/20" />
                <div className="absolute inset-0 rounded-full border-4 border-t-[#1877F2] animate-spin" />
                <Facebook className="h-6 w-6 text-[#1877F2]" />
              </div>
              <p className="mt-4 text-sm font-medium">{getStatusMessage()}</p>
              <p className="text-xs text-muted-foreground">
                Isso pode levar alguns segundos...
              </p>
            </div>
          )}

          {/* Error State */}
          {hasError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Initial State */}
          {!isLoading && !hasError && (
            <>
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <h4 className="mb-3 text-sm font-semibold">Permissões necessárias:</h4>
                <ul className="space-y-2">
                  <PermissionItem>whatsapp_business_management</PermissionItem>
                  <PermissionItem>whatsapp_business_messaging</PermissionItem>
                  <PermissionItem>business_management</PermissionItem>
                </ul>
              </div>

              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  Certifique-se de ter permissões de administrador no Business Manager 
                  do Facebook para completar esta conexão.
                </AlertDescription>
              </Alert>

              {!isHttps && (
                <Alert className="border-red-200 bg-red-50">
                  <Lock className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    <strong>HTTPS obrigatório:</strong> O Facebook Login só funciona em 
                    conexões seguras. Esta funcionalidade não está disponível em ambiente 
                    local (HTTP). Use o modo de simulação para testes.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
          >
            {isLoading ? "Aguarde..." : "Cancelar"}
          </Button>
          {!isLoading && !hasError && (
            <Button
              onClick={onStart}
              disabled={!isHttps}
              className="gap-2 bg-[#1877F2] hover:bg-[#166fe5]"
            >
              <Facebook className="h-4 w-4" />
              {isHttps ? "Conectar com Facebook" : "HTTPS obrigatório"}
            </Button>
          )}
          {hasError && (
            <Button
              onClick={onStart}
              className="gap-2 bg-[#1877F2] hover:bg-[#166fe5]"
            >
              <Loader2 className="h-4 w-4" />
              Tentar Novamente
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// Main Component
// ============================================

/**
 * Embedded Signup Button Component
 * 
 * This component provides a button to initiate the WhatsApp Business
 * Embedded Signup flow using Facebook Login.
 * 
 * Features:
 * - Loads Facebook SDK dynamically
 * - Handles the OAuth flow
 * - Exchanges code for access token
 * - Fetches WABA information
 * - Saves account to local storage (via useWhatsApp hook)
 * 
 * @example
 * ```tsx
 * <EmbeddedSignupButton 
 *   onSuccess={() => toast.success("Conectado!")}
 *   onError={(err) => toast.error(err)}
 * />
 * ```
 */
export function EmbeddedSignupButton({ 
  className,
  onSuccess,
  onError,
  useLegacyFlow = false,
}: EmbeddedSignupButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLegacyLoading, setIsLegacyLoading] = useState(false)
  const { connect } = useWhatsApp()
  const { status, error, result, launchSignup, reset } = useEmbeddedSignup()

  // Check if running on HTTPS (required for Facebook SDK)
  const isHttps = useMemo(() => {
    if (typeof window === "undefined") return true
    return window.location.protocol === "https:"
  }, [])

  // Handle legacy mock flow
  const handleLegacyConnect = useCallback(async () => {
    setIsLegacyLoading(true)
    try {
      // Simulate the OAuth flow
      await new Promise((resolve) => setTimeout(resolve, 2000))
      
      // Mock access token and WABA ID from Facebook OAuth
      const mockAccessToken = "mock_access_token_" + Date.now()
      const mockWabaId = "123456789012345"
      
      await connect(mockAccessToken, mockWabaId)
      
      setIsOpen(false)
      onSuccess?.()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao conectar"
      onError?.(errorMessage)
    } finally {
      setIsLegacyLoading(false)
    }
  }, [connect, onSuccess, onError])

  // Handle new embedded signup flow
  const handleStartSignup = useCallback(async () => {
    await launchSignup()
  }, [launchSignup])

  // Handle dialog close
  const handleClose = useCallback(() => {
    setIsOpen(false)
    // Only reset if not in the middle of processing
    if (status !== "waiting_auth" && status !== "exchanging_token" && status !== "fetching_waba") {
      reset()
    }
  }, [reset, status])

  // Handle successful connection
  const handleSuccess = useCallback(async () => {
    if (result?.success && result.account && result.accessToken) {
      try {
        // Connect via the existing hook to save to local storage
        await connect(result.accessToken, result.account.wabaId)
        
        setIsOpen(false)
        onSuccess?.()
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro ao salvar conta"
        onError?.(errorMessage)
      }
    }
  }, [result, connect, onSuccess, onError])

  // Watch for success state
  useCallback(() => {
    if (status === "success") {
      handleSuccess()
    }
  }, [status, handleSuccess])

  // Watch for error state
  useCallback(() => {
    if (status === "error" && error) {
      onError?.(error)
    }
  }, [status, error, onError])

  const isLoading = status !== "idle" && status !== "error" && status !== "success"

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        disabled={isLoading}
        className={cn(
          "relative h-12 gap-3 bg-[#1877F2] px-6 text-white hover:bg-[#166fe5]",
          isLoading && "opacity-70 cursor-not-allowed",
          className
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-semibold">Conectando...</span>
          </>
        ) : (
          <>
            <Facebook className="h-5 w-5" />
            <span className="font-semibold">Conectar com Facebook</span>
          </>
        )}
      </Button>

      {useLegacyFlow ? (
        <LegacyFlowDialog
          isOpen={isOpen}
          onClose={handleClose}
          onConfirm={handleLegacyConnect}
          isLoading={isLegacyLoading}
        />
      ) : (
        <EmbeddedSignupFlowDialog
          isOpen={isOpen}
          onClose={handleClose}
          onStart={handleStartSignup}
          status={status}
          error={error}
          isHttps={isHttps}
        />
      )}
    </>
  )
}
