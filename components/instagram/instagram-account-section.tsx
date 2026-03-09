"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, Unlink, AlertCircle, CheckCircle2, Clock, User, Users, Image as ImageIcon } from "lucide-react"
import { formatDistanceToNow } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface InstagramAccountSectionProps {
  instance: {
    id: string
    username: string
    name?: string | null
    profilePictureUrl?: string | null
    status: string
    connectedAt?: Date | null
    lastSyncAt?: Date | null
    followersCount?: number
    followingCount?: number
    mediaCount?: number
    biography?: string
    website?: string
  }
  onDisconnect: () => Promise<void>
  onRefresh: () => Promise<void>
  isDisconnecting?: boolean
}

export function InstagramAccountSection({
  instance,
  onDisconnect,
  onRefresh,
  isDisconnecting,
}: InstagramAccountSectionProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status.toUpperCase()) {
      case "CONNECTED":
      case "ACTIVE":
        return {
          badge: <Badge className="bg-emerald-500 hover:bg-emerald-600">Conectado</Badge>,
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
          color: "text-emerald-500",
        }
      case "ERROR":
        return {
          badge: <Badge variant="destructive">Erro</Badge>,
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
          color: "text-red-500",
        }
      case "PENDING":
        return {
          badge: <Badge variant="secondary" className="text-amber-600 bg-amber-100">Pendente</Badge>,
          icon: <Clock className="h-5 w-5 text-amber-500" />,
          color: "text-amber-500",
        }
      default:
        return {
          badge: <Badge variant="secondary">Desconectado</Badge>,
          icon: <AlertCircle className="h-5 w-5 text-gray-500" />,
          color: "text-gray-500",
        }
    }
  }

  const statusConfig = getStatusConfig(instance.status)

  return (
    <div className="space-y-6">
      {/* Main Account Card */}
      <Card className="border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg bg-muted", statusConfig.color)}>
                {statusConfig.icon}
              </div>
              <div>
                <CardTitle className="text-lg">Conta Instagram</CardTitle>
                <CardDescription>
                  {instance.status === "CONNECTED" 
                    ? "Sua conta está conectada e ativa"
                    : "Verifique o status da sua conexão"
                  }
                </CardDescription>
              </div>
            </div>
            {statusConfig.badge}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Info */}
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 ring-2 ring-offset-2 ring-offset-background ring-[#833AB4]/20">
              <AvatarImage src={instance.profilePictureUrl || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white text-xl">
                {instance.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-xl truncate">
                {instance.name || instance.username}
              </h3>
              <p className="text-muted-foreground text-lg">@{instance.username}</p>
              {instance.biography && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {instance.biography}
                </p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Conectado {instance.connectedAt && formatDistanceToNow(instance.connectedAt)}
                </span>
                {instance.lastSyncAt && (
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Sincronizado {formatDistanceToNow(instance.lastSyncAt)}
                  </span>
                )}
              </div>
              {instance.website && (
                <a 
                  href={instance.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-[#833AB4] hover:underline mt-2 inline-block"
                >
                  {instance.website}
                </a>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 py-6 border-y bg-muted/30 rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="h-4 w-4 text-[#833AB4]" />
              </div>
              <p className="text-2xl font-bold">
                {instance.followersCount?.toLocaleString() || "-"}
              </p>
              <p className="text-xs text-muted-foreground">Seguidores</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <User className="h-4 w-4 text-[#FD1D1D]" />
              </div>
              <p className="text-2xl font-bold">
                {instance.followingCount?.toLocaleString() || "-"}
              </p>
              <p className="text-xs text-muted-foreground">Seguindo</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <ImageIcon className="h-4 w-4 text-[#F77737]" />
              </div>
              <p className="text-2xl font-bold">
                {instance.mediaCount?.toLocaleString() || "-"}
              </p>
              <p className="text-xs text-muted-foreground">Publicações</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
              Sincronizar Dados
            </Button>
            <Button
              variant="outline"
              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={onDisconnect}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Unlink className="h-4 w-4 mr-2" />
              )}
              Desconectar Conta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Connection Info Card */}
      <Card className="border-border bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-[#9795e4]" />
            Informações da Conexão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">ID da Conta</p>
              <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                {instance.id}
              </code>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Username</p>
              <p className="font-medium">@{instance.username}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Status</p>
              <p className={cn("font-medium", statusConfig.color)}>
                {instance.status === "CONNECTED" ? "Ativo" : instance.status}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Última Sincronização</p>
              <p className="font-medium">
                {instance.lastSyncAt 
                  ? formatDistanceToNow(instance.lastSyncAt)
                  : "Nunca"
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Import React useState
import { useState } from "react"
