"use client";

import { useState } from "react";
import {
  Smartphone,
  PowerOff,
  Trash2,
  QrCode,
  RefreshCw,
  MessageSquare,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "@/lib/utils";
import { getStatusConfig, formatPhoneNumber } from "@/lib/utils/evolution";
import type { EvolutionInstanceResponse } from "@/lib/types/evolution";

interface InstanceCardProps {
  instance: EvolutionInstanceResponse;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
  onDelete: (id: string) => void;
  onRefreshStatus: (id: string) => void;
}

export function InstanceCard({
  instance,
  onConnect,
  onDisconnect,
  onDelete,
  onRefreshStatus,
}: InstanceCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const statusConfig = getStatusConfig(instance.status);

  const handleAction = async (action: () => Promise<void>) => {
    setIsLoading(true);
    try {
      await action();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-lg ${statusConfig.bgColor}`}
            >
              <Smartphone className={`h-6 w-6 ${statusConfig.color}`} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{instance.name}</h3>
              <p className="text-xs text-muted-foreground font-mono">
                {instance.instanceName}
              </p>
            </div>
          </div>
          <Badge
            className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}
          >
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Phone Info */}
        {instance.phoneNumber && (
          <div className="flex items-center gap-2 text-sm">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            <span>{formatPhoneNumber(instance.phoneNumber)}</span>
          </div>
        )}

        {instance.profileName && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Perfil:</span>
            <span>{instance.profileName}</span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {instance.messagesSent} enviadas
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {instance.messagesReceived} recebidas
          </span>
        </div>

        {/* Last Activity */}
        {instance.lastActivityAt && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Última atividade: {formatDistanceToNow(new Date(instance.lastActivityAt))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          {instance.status === "DISCONNECTED" && (
            <Button
              size="sm"
              onClick={() => handleAction(() => onConnect(instance.id))}
              disabled={isLoading}
              className="bg-[#46347F] hover:bg-[#46347F]/90"
            >
              <QrCode className="h-4 w-4 mr-1" />
              Conectar
            </Button>
          )}

          {instance.status === "CONNECTED" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction(() => onDisconnect(instance.id))}
              disabled={isLoading}
            >
              <PowerOff className="h-4 w-4 mr-1" />
              Desconectar
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => onRefreshStatus(instance.id)}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => handleAction(() => onDelete(instance.id))}
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
