"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

/**
 * Props for the EmbeddedSignupButton component
 */
interface EmbeddedSignupButtonProps {
  /** Organization ID to associate the WhatsApp instance with */
  organizationId: string;
  /** Optional callback when signup completes successfully */
  onSuccess?: () => void;
  /** Optional callback when an error occurs */
  onError?: (error: Error) => void;
  /** Optional additional CSS classes */
  className?: string;
  /** Button variant */
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon";
  /** Optional button text override */
  buttonText?: string;
}

/**
 * Facebook SDK configuration response
 */
interface FacebookConfig {
  appId: string;
  configId: string;
  apiVersion: string;
}

/**
 * Extended Window interface for Facebook SDK
 */
declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: {
      init: (config: { appId: string; version: string; xfbml?: boolean }) => void;
      login: (
        callback: (response: FacebookLoginResponse) => void,
        options: { config_id: string; response_type: string; override_default_response_type: boolean }
      ) => void;
    };
  }
}

interface FacebookLoginResponse {
  authResponse?: {
    code: string;
  };
  status?: string;
  error?: string;
}

/**
 * EmbeddedSignupButton
 * 
 * A button component that initiates the Facebook Embedded Signup flow
 * for connecting a WhatsApp Business Account.
 * 
 * @example
 * ```tsx
 * <EmbeddedSignupButton 
 *   organizationId="org_123"
 *   onSuccess={() => console.log("Connected!")}
 * />
 * ```
 */
export function EmbeddedSignupButton({
  organizationId,
  onSuccess,
  onError,
  className = "",
  variant = "default",
  size = "default",
  buttonText = "Conectar WhatsApp",
}: EmbeddedSignupButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSdkReady, setIsSdkReady] = useState(false);
  const [config, setConfig] = useState<FacebookConfig | null>(null);

  /**
   * Load Facebook SDK configuration from backend
   */
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch("/api/whatsapp/embedded-signup/config");
        if (!response.ok) {
          throw new Error("Failed to load Facebook configuration");
        }
        const data = await response.json();
        setConfig(data);
      } catch (error) {
        console.error("Failed to load Facebook config:", error);
        toast.error("Erro ao carregar configuração do Facebook");
        if (onError && error instanceof Error) {
          onError(error);
        }
      }
    };

    loadConfig();
  }, [onError]);

  /**
   * Load Facebook SDK script
   */
  useEffect(() => {
    if (!config) return;

    // Check if SDK is already loaded
    if (window.FB) {
      setIsSdkReady(true);
      return;
    }

    // Load Facebook SDK
    const script = document.createElement("script");
    script.src = `https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=${config.apiVersion}`;
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    
    script.onload = () => {
      window.fbAsyncInit = () => {
        window.FB?.init({
          appId: config.appId,
          version: config.apiVersion,
          xfbml: false,
        });
        setIsSdkReady(true);
      };
      // Trigger init if FB is already available
      if (window.FB) {
        window.fbAsyncInit();
      }
    };

    script.onerror = () => {
      console.error("Failed to load Facebook SDK");
      toast.error("Erro ao carregar SDK do Facebook");
      if (onError) {
        onError(new Error("Failed to load Facebook SDK"));
      }
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [config, onError]);

  /**
   * Handle the Facebook login callback
   */
  const handleFacebookCallback = useCallback(
    async (response: FacebookLoginResponse) => {
      setIsLoading(false);

      if (response.error) {
        console.error("Facebook login error:", response.error);
        toast.error("Erro na autenticação do Facebook");
        if (onError) {
          onError(new Error(response.error));
        }
        return;
      }

      if (!response.authResponse?.code) {
        console.error("No authorization code received");
        toast.error("Código de autorização não recebido");
        if (onError) {
          onError(new Error("No authorization code received"));
        }
        return;
      }

      // Send the code to our backend
      try {
        const callbackResponse = await fetch(
          "/api/whatsapp/embedded-signup/callback",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code: response.authResponse.code,
              organizationId,
            }),
          }
        );

        if (!callbackResponse.ok) {
          const errorData = await callbackResponse.json();
          throw new Error(errorData.error || "Failed to complete signup");
        }

        const data = await callbackResponse.json();
        
        if (data.success) {
          toast.success("WhatsApp conectado com sucesso!");
          onSuccess?.();
        } else {
          throw new Error(data.error || "Unknown error");
        }
      } catch (error) {
        console.error("Callback error:", error);
        toast.error(
          error instanceof Error 
            ? error.message 
            : "Erro ao completar a conexão"
        );
        if (onError && error instanceof Error) {
          onError(error);
        }
      }
    },
    [organizationId, onSuccess, onError]
  );

  /**
   * Initiate the Embedded Signup flow
   */
  const handleClick = useCallback(() => {
    if (!window.FB || !config) {
      toast.error("SDK do Facebook não está pronto");
      return;
    }

    setIsLoading(true);

    // Launch Facebook Embedded Signup
    window.FB.login(handleFacebookCallback, {
      config_id: config.configId,
      response_type: "code",
      override_default_response_type: true,
    });
  }, [config, handleFacebookCallback]);

  const isDisabled = isLoading || !isSdkReady || !config;

  return (
    <Button
      onClick={handleClick}
      disabled={isDisabled}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Conectando...
        </>
      ) : (
        <>
          <MessageCircle className="mr-2 h-4 w-4" />
          {buttonText}
        </>
      )}
    </Button>
  );
}

export default EmbeddedSignupButton;
