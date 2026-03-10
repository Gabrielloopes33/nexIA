"use client"

import { useState, useCallback, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

type SignupStatus = 
  | "idle"
  | "loading_sdk"
  | "initializing"
  | "waiting_auth"
  | "exchanging_token"
  | "fetching_account"
  | "success"
  | "error"

interface SignupResult {
  success: boolean
  account?: {
    id: string
    instagramId: string
    username: string
    accessToken: string
  }
  error?: string
}

interface FacebookLoginResponse {
  authResponse?: {
    code: string
  }
  status?: string
  error?: string
}

interface FacebookConfig {
  appId: string
  configId: string
  apiVersion: string
}

declare global {
  interface Window {
    fbAsyncInit?: () => void
    FB?: {
      init: (config: { appId: string; version: string; xfbml?: boolean }) => void
      login: (
        callback: (response: FacebookLoginResponse) => void,
        options: { config_id: string; response_type: string; override_default_response_type: boolean }
      ) => void
    }
  }
}

export function useInstagramEmbeddedSignup() {
  const [status, setStatus] = useState<SignupStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SignupResult | null>(null)
  const [config, setConfig] = useState<FacebookConfig | null>(null)
  const { toast } = useToast()

  // Load Facebook SDK configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch("/api/whatsapp/embedded-signup/config")
        if (!response.ok) {
          throw new Error("Failed to load Facebook configuration")
        }
        const data = await response.json()
        setConfig(data)
      } catch (err) {
        console.error("Failed to load Facebook config:", err)
        setError("Erro ao carregar configuração do Facebook")
      }
    }

    loadConfig()
  }, [])

  // Load Facebook SDK script
  const loadFacebookSDK = useCallback(async (): Promise<boolean> => {
    if (!config) return false

    return new Promise((resolve) => {
      if (window.FB) {
        resolve(true)
        return
      }

      const script = document.createElement("script")
      script.src = `https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=${config.apiVersion}`
      script.async = true
      script.defer = true
      script.crossOrigin = "anonymous"
      
      script.onload = () => {
        window.fbAsyncInit = () => {
          window.FB?.init({
            appId: config.appId,
            version: config.apiVersion,
            xfbml: false,
          })
          resolve(true)
        }
        if (window.FB) {
          window.fbAsyncInit?.()
        }
      }

      script.onerror = () => {
        resolve(false)
      }

      document.body.appendChild(script)
    })
  }, [config])

  // Handle Facebook OAuth callback
  const handleFacebookCallback = useCallback(async (response: FacebookLoginResponse) => {
    if (response.error) {
      setStatus("error")
      setError("Erro na autenticação do Facebook")
      return
    }

    if (!response.authResponse?.code) {
      setStatus("error")
      setError("Código de autorização não recebido")
      return
    }

    setStatus("exchanging_token")

    try {
      // Exchange code for token and get Instagram account info
      const callbackResponse = await fetch("/api/instagram/embedded-signup/callback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: response.authResponse.code,
        }),
      })

      if (!callbackResponse.ok) {
        const errorData = await callbackResponse.json()
        throw new Error(errorData.error || "Failed to complete signup")
      }

      const data = await callbackResponse.json()
      
      if (data.success) {
        setResult({
          success: true,
          account: data.account,
        })
        setStatus("success")
        toast({
          title: "Sucesso!",
          description: "Instagram conectado com sucesso!",
        })
      } else {
        throw new Error(data.error || "Unknown error")
      }
    } catch (err) {
      console.error("Callback error:", err)
      setStatus("error")
      setError(err instanceof Error ? err.message : "Erro ao completar a conexão")
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao conectar Instagram",
        variant: "destructive",
      })
    }
  }, [toast])

  // Launch the Embedded Signup flow
  const launchSignup = useCallback(async () => {
    if (!config) {
      setError("Configuração não carregada")
      setStatus("error")
      return
    }

    setStatus("loading_sdk")

    // Load Facebook SDK
    const sdkLoaded = await loadFacebookSDK()
    if (!sdkLoaded) {
      setStatus("error")
      setError("Erro ao carregar SDK do Facebook")
      return
    }

    setStatus("initializing")

    // Small delay to ensure SDK is ready
    await new Promise(resolve => setTimeout(resolve, 500))

    if (!window.FB) {
      setStatus("error")
      setError("SDK do Facebook não está disponível")
      return
    }

    setStatus("waiting_auth")

    // Launch Facebook Embedded Signup
    window.FB.login(handleFacebookCallback, {
      config_id: config.configId,
      response_type: "code",
      override_default_response_type: true,
    })
  }, [config, loadFacebookSDK, handleFacebookCallback])

  // Reset the state
  const reset = useCallback(() => {
    setStatus("idle")
    setError(null)
    setResult(null)
  }, [])

  return {
    status,
    error,
    result,
    launchSignup,
    reset,
  }
}
