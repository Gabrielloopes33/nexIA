"use client"

import { useState, useCallback } from "react"
import { Instagram, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useInstagramEmbeddedSignup } from "@/hooks/use-instagram-embedded-signup"
import { cn } from "@/lib/utils"

interface InstagramEmbeddedSignupProps {
  className?: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

function PermissionItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" />
      <span className="text-sm text-muted-foreground">{children}</span>
    </li>
  )
}

export function InstagramEmbeddedSignup({ 
  className,
  onSuccess,
  onError,
}: InstagramEmbeddedSignupProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { status, error, launchSignup, reset } = useInstagramEmbeddedSignup()

  const handleStartSignup = useCallback(async () => {
    await launchSignup()
  }, [launchSignup])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    if (status !== "waiting_auth" && status !== "exchanging_token" && status !== "fetching_account") {
      reset()
    }
  }, [reset, status])

  const handleSuccess = useCallback(() => {
    setIsOpen(false)
    onSuccess?.()
  }, [onSuccess])

  const isLoading = status !== "idle" && status !== "error" && status !== "success"

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
      case "fetching_account":
        return "Buscando informações da conta..."
      case "success":
        handleSuccess()
        return "Conta conectada com sucesso!"
      case "error":
        return "Erro na conexão"
      default:
        return "Preparando conexão..."
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        disabled={isLoading}
        className={cn(
          "relative h-12 gap-3 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 px-6 text-white hover:opacity-90",
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
            <Instagram className="h-5 w-5" />
            <span className="font-semibold">Conectar Instagram</span>
          </>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Instagram className="h-5 w-5 text-pink-500" />
              Conectar Instagram Business
            </DialogTitle>
            <DialogDescription>
              {isLoading 
                ? "Por favor, aguarde enquanto conectamos sua conta..."
                : "Autorize o NexIA a acessar sua conta Instagram Business através do Facebook."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center py-6">
                <div className="relative flex h-16 w-16 items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-pink-500/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-pink-500 animate-spin" />
                  <Instagram className="h-6 w-6 text-pink-500" />
                </div>
                <p className="mt-4 text-sm font-medium">{getStatusMessage()}</p>
                <p className="text-xs text-muted-foreground">
                  Isso pode levar alguns segundos...
                </p>
              </div>
            )}

            {/* Error State */}
            {status === "error" && error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Initial State */}
            {!isLoading && status !== "error" && (
              <>
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <h4 className="mb-3 text-sm font-semibold">Permissões necessárias:</h4>
                  <ul className="space-y-2">
                    <PermissionItem>instagram_basic</PermissionItem>
                    <PermissionItem>instagram_manage_messages</PermissionItem>
                    <PermissionItem>instagram_manage_insights</PermissionItem>
                    <PermissionItem>pages_read_engagement</PermissionItem>
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
              </>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={isLoading}
            >
              {isLoading ? "Aguarde..." : "Cancelar"}
            </Button>
            {!isLoading && status !== "error" && (
              <Button
                onClick={handleStartSignup}
                className="gap-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:opacity-90"
              >
                <Instagram className="h-4 w-4" />
                Conectar com Facebook
              </Button>
            )}
            {status === "error" && (
              <Button
                onClick={handleStartSignup}
                className="gap-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:opacity-90"
              >
                <Loader2 className="h-4 w-4" />
                Tentar Novamente
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
