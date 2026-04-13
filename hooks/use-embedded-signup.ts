"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { toast } from "sonner"

// ============================================
// Types
// ============================================

export type EmbeddedSignupStatus = 
  | "idle"
  | "loading_sdk"
  | "initializing"
  | "launching"
  | "waiting_auth"
  | "exchanging_token"
  | "fetching_waba"
  | "success"
  | "error"

export interface EmbeddedSignupConfig {
  configId: string
  appId: string
  apiVersion: string
}

export interface EmbeddedSignupResult {
  success: boolean
  account: {
    id: string
    name: string
    wabaId: string
    status: string
    phoneNumbers: Array<{
      id: string
      displayPhoneNumber: string
      verifiedName: string
      status: string
    }>
  } | null
  accessToken: string | null
  error?: string
}

export interface UseEmbeddedSignupReturn {
  status: EmbeddedSignupStatus
  error: string | null
  isLoading: boolean
  result: EmbeddedSignupResult | null
  launchSignup: () => Promise<void>
  handleCallback: (code: string) => Promise<EmbeddedSignupResult>
  reset: () => void
}

interface EmbeddedSignupAssets {
  wabaId?: string
  phoneNumberId?: string
}

// ============================================
// Facebook SDK Types
// ============================================

declare global {
  interface Window {
    fbAsyncInit?: () => void
    FB?: FacebookSDK
  }
}

interface FacebookSDK {
  init: (params: FacebookInitParams) => void
  login: (
    callback: (response: FacebookLoginResponse) => void,
    params: FacebookLoginParams
  ) => void
  getLoginStatus: (callback: (response: FacebookLoginResponse) => void) => void
  logout: (callback: (response: unknown) => void) => void
  Event: {
    subscribe: (event: string, callback: (data: unknown) => void) => void
    unsubscribe: (event: string, callback: (data: unknown) => void) => void
  }
}

interface FacebookInitParams {
  appId: string
  cookie: boolean
  xfbml: boolean
  version: string
}

interface FacebookLoginParams {
  config_id: string
  response_type: string
  override_default_response_type: boolean
  extras: {
    feature?: string
    version?: string | number
    sessionInfoVersion?: number
    setup?: {
      solution?: string
      solutionID?: string
    }
  }
}

interface FacebookLoginResponse {
  status?: string
  authResponse?: {
    code?: string
    accessToken?: string
    expiresIn?: number
    signedRequest?: string
    userID?: string
  }
  error?: string
  errorMessage?: string
}

// ============================================
// Hook Implementation
// ============================================

const SDK_SCRIPT_ID = "facebook-jssdk"
const SDK_SCRIPT_URL = "https://connect.facebook.net/en_US/sdk.js"

export function useEmbeddedSignup(): UseEmbeddedSignupReturn {
  const [status, setStatus] = useState<EmbeddedSignupStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<EmbeddedSignupResult | null>(null)
  const [config, setConfig] = useState<EmbeddedSignupConfig | null>(null)
  const sdkLoadedRef = useRef<boolean>(false)
  const processingRef = useRef<boolean>(false)
  const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null)
  const signupAssetsRef = useRef<EmbeddedSignupAssets>({})

  /**
   * Fetch configuration from backend
   */
  const fetchConfig = useCallback(async (): Promise<EmbeddedSignupConfig> => {
    const response = await fetch("/api/whatsapp/embedded-signup/config")
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || "Falha ao carregar configuração")
    }

    const data = await response.json()
    return data as EmbeddedSignupConfig
  }, [])

  /**
   * Load Facebook SDK script
   */
  const loadFacebookSDK = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.FB && sdkLoadedRef.current) {
        console.log("[EmbeddedSignup] Facebook SDK already loaded")
        resolve()
        return
      }

      // Check if script tag already exists
      if (document.getElementById(SDK_SCRIPT_ID)) {
        console.log("[EmbeddedSignup] Facebook SDK script already exists, waiting...")
        // Wait for SDK to be ready
        const checkInterval = setInterval(() => {
          if (window.FB) {
            clearInterval(checkInterval)
            sdkLoadedRef.current = true
            resolve()
          }
        }, 100)

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval)
          if (!window.FB) {
            reject(new Error("Timeout ao carregar Facebook SDK"))
          }
        }, 10000)
        return
      }

      console.log("[EmbeddedSignup] Loading Facebook SDK...")

      // Setup init callback
      window.fbAsyncInit = () => {
        console.log("[EmbeddedSignup] Facebook SDK script loaded, fbAsyncInit called")
        // SDK loaded but not initialized yet - will be initialized in initializeFacebookSDK
        sdkLoadedRef.current = true
        resolve()
      }

      // Create script tag
      const script = document.createElement("script")
      script.id = SDK_SCRIPT_ID
      script.src = SDK_SCRIPT_URL
      script.async = true
      script.defer = true
      script.crossOrigin = "anonymous"
      
      script.onerror = (error) => {
        console.error("[EmbeddedSignup] Failed to load Facebook SDK script:", error)
        reject(new Error("Falha ao carregar Facebook SDK"))
      }

      // Timeout fallback
      setTimeout(() => {
        if (!sdkLoadedRef.current) {
          reject(new Error("Timeout ao carregar Facebook SDK"))
        }
      }, 15000)

      document.body.appendChild(script)
    })
  }, [])

  /**
   * Initialize Facebook SDK with app configuration
   */
  const initializeFacebookSDK = useCallback((appConfig: EmbeddedSignupConfig): void => {
    if (!window.FB) {
      throw new Error("Facebook SDK não está carregado - window.FB is undefined")
    }

    console.log("[EmbeddedSignup] Initializing Facebook SDK with appId:", appConfig.appId)
    console.log("[EmbeddedSignup] API Version:", appConfig.apiVersion)

    try {
      window.FB.init({
        appId: appConfig.appId,
        cookie: true,
        xfbml: true,
        version: appConfig.apiVersion,
      })

      console.log("[EmbeddedSignup] Facebook SDK initialized successfully")
      console.log("[EmbeddedSignup] window.FB object keys:", Object.keys(window.FB))
      
      // Check login status
      window.FB.getLoginStatus((response) => {
        console.log("[EmbeddedSignup] FB.getLoginStatus response:", {
          status: response.status,
          authResponse: response.authResponse ? "present" : "null",
        })
      })
    } catch (error) {
      console.error("[EmbeddedSignup] Error initializing Facebook SDK:", error)
      throw error
    }
  }, [])

  /**
   * Setup message listener for WhatsApp Embedded Signup events
   * This is the recommended way to handle Embedded Signup completion
   */
  const setupMessageListener = useCallback(() => {
    // Remove existing listener if any
    if (messageHandlerRef.current) {
      window.removeEventListener("message", messageHandlerRef.current)
    }

    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from Facebook domains
      if (!event.origin.includes("facebook.com")) {
        return
      }

      try {
        // WhatsApp Embedded Signup events are sent as JSON strings
        if (typeof event.data !== "string") return

        const data = JSON.parse(event.data)
        console.log("[EmbeddedSignup] Received message from Facebook:", data)

        // Handle WhatsApp Embedded Signup events
        if (data.type === "WA_EMBEDDED_SIGNUP") {
          switch (data.event) {
            case "FINISH":
            case "FINISH_ONLY_WABA":
              signupAssetsRef.current = {
                wabaId: data?.data?.waba_id || data?.data?.wabaId || data?.waba_id || data?.wabaId,
                phoneNumberId:
                  data?.data?.phone_number_id ||
                  data?.data?.phoneNumberId ||
                  data?.phone_number_id ||
                  data?.phoneNumberId,
              }
              console.log("[EmbeddedSignup] WhatsApp signup completed:", data.data)
              toast.success("WhatsApp configurado com sucesso!")
              break
            case "CANCEL":
              console.log("[EmbeddedSignup] User cancelled")
              setStatus("error")
              setError("Configuração cancelada pelo usuário")
              processingRef.current = false
              break
            case "ERROR":
              console.error("[EmbeddedSignup] Error during signup:", data.data)
              setStatus("error")
              setError(data.data?.error || "Erro durante a configuração do WhatsApp")
              processingRef.current = false
              break
          }
        }
      } catch {
        // Not a JSON message or not our expected format, ignore
      }
    }

    window.addEventListener("message", handleMessage)
    messageHandlerRef.current = handleMessage
    console.log("[EmbeddedSignup] Message listener setup complete")
  }, [])

  /**
   * Launch the Embedded Signup flow
   */
  const launchSignup = useCallback(async (): Promise<void> => {
    if (processingRef.current) {
      console.log("[EmbeddedSignup] Already processing, ignoring duplicate call")
      return
    }

    processingRef.current = true
    setError(null)
    setResult(null)

    try {
      // Step 1: Fetch configuration
      setStatus("loading_sdk")
      console.log("[EmbeddedSignup] Fetching configuration...")
      const appConfig = await fetchConfig()
      setConfig(appConfig)
      console.log("[EmbeddedSignup] Configuration loaded:", {
        appId: appConfig.appId ? `${appConfig.appId.substring(0, 6)}...` : "EMPTY",
        configId: appConfig.configId ? `${appConfig.configId.substring(0, 8)}...` : "EMPTY",
        apiVersion: appConfig.apiVersion,
      })

      // Validate App ID format
      if (!appConfig.appId || !/^[0-9]+$/.test(appConfig.appId)) {
        throw new Error(`Invalid App ID: "${appConfig.appId}". App ID should be a numeric string.`)
      }

      // Step 2: Load Facebook SDK
      setStatus("initializing")
      await loadFacebookSDK()

      // Step 3: Setup message listener for WhatsApp Embedded Signup events
      setupMessageListener()

      // Step 4: Initialize SDK
      initializeFacebookSDK(appConfig)

      // Step 4.5: Small delay to ensure SDK is fully ready
      await new Promise(resolve => setTimeout(resolve, 100))

      // Step 4: Check if user is already logged in to Facebook
      setStatus("waiting_auth")
      console.log("[EmbeddedSignup] Launching Facebook Login...")

      if (!window.FB) {
        throw new Error("Facebook SDK não está disponível")
      }

      // Check login status first (for logging purposes only)
      const loginStatus = await new Promise<FacebookLoginResponse>((resolve) => {
        window.FB!.getLoginStatus(resolve)
      })
      
      console.log("[EmbeddedSignup] Initial login status:", loginStatus)
      
      // Note: status 'unknown' usually means third-party cookies are blocked
      // We'll try FB.login anyway - if user is logged in to Facebook in another tab,
      // the popup will just ask for permissions. If not, they'll see login screen.
      if (loginStatus.status === "unknown") {
        console.warn("[EmbeddedSignup] Login status unknown (likely third-party cookies blocked). Attempting FB.login anyway...")
        toast.info("Abrindo login do Facebook...", {
          description: "Se você já está logado no Facebook, apenas autorize o aplicativo. Caso contrário, faça login primeiro.",
          duration: 8000,
        })
      }

      proceedWithFBLogin(appConfig)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido"
      console.error("[EmbeddedSignup] Error:", errorMessage)
      setError(errorMessage)
      setStatus("error")
      toast.error("Erro no fluxo de conexão", {
        description: errorMessage,
      })
      processingRef.current = false
    }
  }, [fetchConfig, loadFacebookSDK, initializeFacebookSDK, setupMessageListener])

  /**
   * Proceed with FB.login after ensuring user is logged in
   * NOT a useCallback to avoid circular dependency issues
   */
  const proceedWithFBLogin = (appConfig: EmbeddedSignupConfig): void => {
    console.log("[EmbeddedSignup] Calling FB.login with config_id:", appConfig.configId)
    
    if (!window.FB) {
      setError("Facebook SDK não está disponível")
      setStatus("error")
      processingRef.current = false
      return
    }
      
    window.FB.login(
      (response: FacebookLoginResponse) => {
        console.log("[EmbeddedSignup] Facebook Login response:", response)

        if (response.error) {
          const errorMsg = response.errorMessage || response.error
          console.error("[EmbeddedSignup] Facebook Login error:", errorMsg)
          
          // Check for specific error types
          if (errorMsg.includes("indisponível") || errorMsg.includes("unavailable")) {
            setError(
              `Login do Facebook indisponível para este app.\n\n` +
              `Causas prováveis:\n` +
              `1. O app não está em modo "Live" no Meta Developers\n` +
              `2. As permissões "public_profile" e "email" não têm "Advanced Access"\n` +
              `3. Seu usuário não está na lista de testadores (se app em desenvolvimento)\n\n` +
              `Solução:\n` +
              `• Acesse: https://developers.facebook.com/apps/${appConfig.appId}/app-review/permissions/\n` +
              `• Clique em "Get Advanced Access" para public_profile e email\n` +
              `• Ou adicione seu usuário como Testador em Roles`
            )
          } else {
            setError(`Erro no login do Facebook: ${errorMsg}`)
          }
          
          setStatus("error")
          toast.error("Erro na autenticação", {
            description: errorMsg,
          })
          processingRef.current = false
          return
        }

        if (response.status === "connected" && response.authResponse?.code) {
          const authCode = response.authResponse.code
          console.log("[EmbeddedSignup] Received auth code, exchanging for token...")
          
          // Exchange code for token
          exchangeCodeForToken(authCode)
        } else if (response.status === "not_authorized") {
          setError("Usuário não autorizou o aplicativo")
          setStatus("error")
          toast.error("Permissão negada", {
            description: "Você precisa autorizar o aplicativo para continuar.",
          })
          processingRef.current = false
        } else if (response.status === "unknown") {
          console.log("[EmbeddedSignup] FB login returned status 'unknown' – likely a Facebook App config issue")
          setError(
            "O Login do Facebook está indisponível para este app.\n\n" +
            "Causas mais comuns:\n" +
            "• App em modo Desenvolvimento – seu usuário precisa ser Testador/Desenvolvedor em developers.facebook.com/apps\n" +
            "• Produto 'Facebook Login for Business' não configurado com Embedded Signup\n" +
            "• Domínio não autorizado no painel Meta (Basic Settings → App Domains)\n\n" +
            "Se você cancelou o popup do Facebook, tente novamente."
          )
          setStatus("error")
          processingRef.current = false
        } else {
          console.log("[EmbeddedSignup] Unexpected response status:", response.status)
          setError("Autenticação cancelada ou falhou. Verifique se você está logado no Facebook.")
          setStatus("error")
          processingRef.current = false
        }
      },
      {
        config_id: appConfig.configId,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: "",
          sessionInfoVersion: 2,
        },
      }
    )
  }

  /**
   * Exchange authorization code for access token
   */
  const exchangeCodeForToken = useCallback(async (code: string): Promise<void> => {
    setStatus("exchanging_token")
    console.log("[EmbeddedSignup] Exchanging code for token...")

    try {
      const response = await fetch("/api/whatsapp/embedded-signup/callback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "embedded_signup_complete",
          code,
          wabaId: signupAssetsRef.current.wabaId,
          phoneNumberId: signupAssetsRef.current.phoneNumberId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Falha ao trocar código por token")
      }

      console.log("[EmbeddedSignup] Token exchange successful:", data)

      setResult(data as EmbeddedSignupResult)
      setStatus("success")
      
      toast.success("Conta conectada com sucesso!", {
        description: `WhatsApp Business: ${data.account?.name || "Conta conectada"}`,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao trocar código por token"
      console.error("[EmbeddedSignup] Token exchange error:", errorMessage)
      setError(errorMessage)
      setStatus("error")
      toast.error("Erro ao conectar conta", {
        description: errorMessage,
      })
    } finally {
      processingRef.current = false
    }
  }, [])

  /**
   * Handle callback from Facebook OAuth redirect
   * (Alternative flow for server-side handling)
   */
  const handleCallback = useCallback(async (code: string): Promise<EmbeddedSignupResult> => {
    setStatus("exchanging_token")
    setError(null)

    try {
      const response = await fetch("/api/whatsapp/embedded-signup/callback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "exchange_code", code }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Falha no callback")
      }

      setResult(data as EmbeddedSignupResult)
      setStatus("success")
      return data as EmbeddedSignupResult
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro no callback"
      setError(errorMessage)
      setStatus("error")
      throw err
    }
  }, [])

  /**
   * Reset the hook state
   */
  const reset = useCallback((): void => {
    setStatus("idle")
    setError(null)
    setResult(null)
    processingRef.current = false
    signupAssetsRef.current = {}
  }, [])

  /**
   * Cleanup SDK and listeners on unmount
   */
  useEffect(() => {
    return () => {
      // Cleanup message listener
      if (messageHandlerRef.current) {
        window.removeEventListener("message", messageHandlerRef.current)
      }
      // Cleanup FB events if needed
      if (window.FB?.Event) {
        // Unsubscribe from any events if we subscribed to them
      }
    }
  }, [])

  const isLoading = status !== "idle" && status !== "error" && status !== "success"

  return {
    status,
    error,
    isLoading,
    result,
    launchSignup,
    handleCallback,
    reset,
  }
}
