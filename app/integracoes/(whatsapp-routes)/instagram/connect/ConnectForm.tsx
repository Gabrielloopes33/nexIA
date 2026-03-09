"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function ConnectForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const success = searchParams.get("success");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      const errorMessages: Record<string, string> = {
        access_denied: "Acesso negado. Você precisa autorizar o aplicativo para continuar.",
        no_code: "Código de autorização não recebido. Tente novamente.",
      };
      setErrorMessage(errorMessages[error] || decodeURIComponent(error));
    }
  }, [error]);

  return (
    <>
      {/* Alerts */}
      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {success === "connected" && (
        <Alert className="mb-6 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Conta Instagram conectada com sucesso!
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
