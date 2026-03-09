"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RefreshCw, Unlink, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

interface InstagramInstance {
  id: string;
  instagramId: string;
  username: string;
  name?: string | null;
  profilePictureUrl?: string | null;
  status: string;
  connectedAt?: Date | null;
  lastSyncAt?: Date | null;
}

interface InstagramAccountSectionProps {
  instance: InstagramInstance;
  onDisconnect: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function InstagramAccountSection({
  instance,
  onDisconnect,
  onRefresh,
}: InstagramAccountSectionProps) {
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleDisconnect = async () => {
    if (!confirm("Tem certeza que deseja desconectar esta conta do Instagram?")) {
      return;
    }
    setIsDisconnecting(true);
    try {
      await onDisconnect();
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONNECTED":
        return <Badge className="bg-green-500">Conectado</Badge>;
      case "ERROR":
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="secondary">Desconectado</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            Conta Instagram
            {instance.status === "ERROR" && (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </CardTitle>
          {getStatusBadge(instance.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Info */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={instance.profilePictureUrl || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-lg">
              {instance.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">
              {instance.name || instance.username}
            </h3>
            <p className="text-muted-foreground">@{instance.username}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Conectado {instance.connectedAt && formatDistanceToNow(new Date(instance.connectedAt))}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 py-4 border-y">
          <div className="text-center">
            <p className="text-2xl font-bold">-</p>
            <p className="text-xs text-muted-foreground">Seguidores</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">-</p>
            <p className="text-xs text-muted-foreground">Seguindo</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">-</p>
            <p className="text-xs text-muted-foreground">Publicações</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleDisconnect}
            disabled={isDisconnecting}
          >
            <Unlink className="h-4 w-4 mr-2" />
            Desconectar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
