"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Copy, CheckCircle2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode: string | null;
  pairingCode: string | null;
  instanceName: string;
  instanceId?: string;
  organizationId?: string;
  onRefresh: () => void;
  onConnected?: () => void;
}

export function QRCodeModal({
  isOpen,
  onClose,
  qrCode,
  pairingCode,
  instanceName,
  instanceId,
  organizationId,
  onRefresh,
  onConnected,
}: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [connectionStatus, setConnectionStatus] = useState<"waiting" | "connected" | "error">("waiting");
  const [isChecking, setIsChecking] = useState(false);

  // Check connection status via polling
  const checkStatus = useCallback(async () => {
    if (!instanceId || !organizationId || !isOpen) {
      console.log("[QRCodeModal] Skip check - missing props:", { instanceId, organizationId, isOpen });
      return;
    }
    
    console.log("[QRCodeModal] Checking status for instance:", instanceId);
    setIsChecking(true);
    try {
      const response = await fetch(
        `/api/evolution/instances/${instanceId}/status?organizationId=${organizationId}`
      );
      const data = await response.json();
      
      console.log("[QRCodeModal] Status response:", data);
      
      if (data.success && data.data.status === "CONNECTED") {
        console.log("[QRCodeModal] Instance connected!");
        setConnectionStatus("connected");
        onConnected?.();
      } else {
        console.log("[QRCodeModal] Status:", data.data?.status);
      }
    } catch (error) {
      console.error("[QRCodeModal] Error checking status:", error);
    } finally {
      setIsChecking(false);
    }
  }, [instanceId, organizationId, isOpen, onConnected]);

  // QR Code countdown timer
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onRefresh();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onRefresh]);

  // Status polling - check every 2 seconds
  useEffect(() => {
    if (!isOpen || connectionStatus === "connected") return;

    console.log("[QRCodeModal] Starting status polling");
    
    // Check immediately
    checkStatus();

    const statusInterval = setInterval(() => {
      checkStatus();
    }, 2000);

    return () => {
      console.log("[QRCodeModal] Stopping status polling");
      clearInterval(statusInterval);
    };
  }, [isOpen, connectionStatus, checkStatus]);

  useEffect(() => {
    if (isOpen) {
      setCountdown(60);
      setConnectionStatus("waiting");
    }
  }, [isOpen, qrCode]);

  // Auto-close modal after 3 seconds when connected
  useEffect(() => {
    if (connectionStatus === "connected") {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [connectionStatus, onClose]);

  const handleCopyPairingCode = () => {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {connectionStatus === "connected" 
              ? "WhatsApp Conectado!" 
              : "Conectar WhatsApp"}
          </DialogTitle>
          <DialogDescription>
            {connectionStatus === "connected"
              ? "Sua instância foi conectada com sucesso."
              : "Escaneie o QR Code com seu WhatsApp ou use o código de pareamento."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Connected State */}
          {connectionStatus === "connected" ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <div className="text-center">
                <p className="font-medium text-lg">Conexão estabelecida!</p>
                <p className="text-sm text-muted-foreground">
                  Sua instância <strong>{instanceName}</strong> está pronta para uso.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* QR Code */}
              {qrCode ? (
                <div className="flex flex-col items-center space-y-2">
                  <div className="bg-white p-4 rounded-lg border">
                    <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    QR Code expira em {countdown}s
                    {isChecking && " • Verificando status..."}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Pairing Code */}
              {pairingCode && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Código de pareamento:</span>
                      <p className="text-2xl font-mono font-bold tracking-wider mt-1">
                        {pairingCode}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCopyPairingCode}
                    >
                      {copied ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Instructions */}
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <strong>Para conectar:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Abra o WhatsApp no seu celular</li>
                  <li>Toque em Menu → Dispositivos conectados</li>
                  <li>Toque em &quot;Conectar um dispositivo&quot;</li>
                  <li>Escaneie o QR Code ou digite o código</li>
                </ol>
              </div>
            </>
          )}

          {/* Connection Status Debug */}
          {connectionStatus === "waiting" && (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isChecking ? 'bg-amber-400 animate-pulse' : 'bg-slate-400'}`} />
                <span className="text-sm text-slate-600">
                  {isChecking ? "Verificando status..." : "Aguardando conexão..."}
                </span>
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={checkStatus}
                disabled={isChecking}
              >
                Verificar agora
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-2">
            {connectionStatus !== "connected" && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={onRefresh} disabled={isChecking}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? "animate-spin" : ""}`} />
                  Novo QR
                </Button>
              </div>
            )}
            <Button 
              variant={connectionStatus === "connected" ? "default" : "ghost"}
              onClick={onClose}
              className={connectionStatus === "connected" ? "bg-green-600 hover:bg-green-700 ml-auto" : ""}
            >
              {connectionStatus === "connected" ? "Concluir" : "Fechar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
