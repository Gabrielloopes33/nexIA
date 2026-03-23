"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Copy, CheckCircle2 } from "lucide-react";
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
  onRefresh: () => void;
}

export function QRCodeModal({
  isOpen,
  onClose,
  qrCode,
  pairingCode,
  instanceName,
  onRefresh,
}: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(60);

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

  useEffect(() => {
    if (isOpen) {
      setCountdown(60);
    }
  }, [isOpen, qrCode]);

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
          <DialogTitle>Conectar WhatsApp</DialogTitle>
          <DialogDescription>
            Escaneie o QR Code com seu WhatsApp ou use o código de pareamento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* QR Code */}
          {qrCode ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="bg-white p-4 rounded-lg border">
                <img src={qrCode} alt="QR Code" className="w-64 h-64" />
              </div>
              <p className="text-xs text-muted-foreground">
                QR Code expira em {countdown}s
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

          {/* Actions */}
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar QR
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
