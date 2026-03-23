"use client";

import { useState } from "react";
import { Smartphone, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEvolution } from "@/hooks/use-evolution";
import { InstanceCard } from "./InstanceCard";
import { CreateInstanceModal } from "./CreateInstanceModal";
import { QRCodeModal } from "./QRCodeModal";
import type { EvolutionQRCodeResponse } from "@/lib/types/evolution";

export function EvolutionManager() {
  const {
    instances,
    isLoading,
    error,
    refreshInstances,
    createInstance,
    deleteInstance,
    connectInstance,
    disconnectInstance,
    getInstanceStatus,
  } = useEvolution();

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState<EvolutionQRCodeResponse | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(
    null
  );
  const [selectedInstanceName, setSelectedInstanceName] = useState<string>("");

  const handleConnect = async (id: string) => {
    const instance = instances.find((i) => i.id === id);
    if (!instance) return;

    setSelectedInstanceId(id);
    setSelectedInstanceName(instance.name);
    setQrModalOpen(true);

    const data = await connectInstance(id);
    if (data) {
      setQrData(data);
    }
  };

  const handleRefreshQR = async () => {
    if (!selectedInstanceId) return;
    const data = await connectInstance(selectedInstanceId);
    if (data) {
      setQrData(data);
    }
  };

  if (isLoading && instances.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#46347F]" />
          <p className="text-sm text-muted-foreground">
            Carregando instâncias...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-700">
              Atenção: API Não Oficial
            </h3>
            <p className="text-sm text-amber-600 mt-1">
              Esta integração utiliza métodos não oficiais para conectar ao
              WhatsApp. Embora funcional, ela possui limitações e riscos
              comparados à API oficial da Meta.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#25D366]/10">
            <Smartphone className="h-5 w-5 text-[#25D366]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Minhas Instâncias</h2>
            <p className="text-sm text-muted-foreground">
              {instances.length} instância{instances.length !== 1 ? "s" : ""}{" "}
              configurada{instances.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <CreateInstanceModal onCreate={createInstance} />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Instances Grid */}
      {instances.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Smartphone className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma instância configurada
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              Crie sua primeira instância para conectar um número de WhatsApp
              via Evolution API.
            </p>
            <CreateInstanceModal
              onCreate={createInstance}
              children={
                <Button className="bg-[#46347F] hover:bg-[#46347F]/90">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Criar Primeira Instância
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {instances.map((instance) => (
            <InstanceCard
              key={instance.id}
              instance={instance}
              onConnect={handleConnect}
              onDisconnect={disconnectInstance}
              onDelete={deleteInstance}
              onRefreshStatus={getInstanceStatus}
            />
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => {
          setQrModalOpen(false);
          setQrData(null);
          setSelectedInstanceId(null);
          refreshInstances();
        }}
        qrCode={qrData?.qrCode || null}
        pairingCode={qrData?.pairingCode || null}
        instanceName={selectedInstanceName}
        onRefresh={handleRefreshQR}
      />
    </div>
  );
}
