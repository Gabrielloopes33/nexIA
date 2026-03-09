"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  InstagramAccountSection,
  InstagramDirectSection,
  InstagramMetricsSection,
  InstagramMediaSection,
  InstagramLogsSection,
} from "@/components/instagram"
import { useInstagram } from "@/hooks/use-instagram"
import { 
  Instagram, 
  Plus, 
  AlertCircle, 
  CheckCircle2,
  User,
  MessageSquare,
  BarChart3,
  Image as ImageIcon,
  ScrollText,
  Loader2,
} from "lucide-react"

interface InstagramInstance {
  id: string
  instagramId: string
  username: string
  name?: string | null
  profilePictureUrl?: string | null
  status: string
  connectedAt?: string
  lastSyncAt?: string
  followersCount?: number
  followingCount?: number
  mediaCount?: number
  biography?: string
  website?: string
}

interface InstagramInsights {
  impressions: number
  reach: number
  profileViews: number
  websiteClicks: number
}

function SuccessAlert() {
  const searchParams = useSearchParams()
  const success = searchParams.get("success")
  
  if (success !== "connected") return null
  
  return (
    <Alert className="mb-6 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
      <AlertDescription className="text-green-800 dark:text-green-200">
        Conta Instagram conectada com sucesso!
      </AlertDescription>
    </Alert>
  )
}

// Header Skeleton
function HeaderSkeleton() {
  return (
    <div className="flex items-center gap-3 mb-6">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div>
        <Skeleton className="h-7 w-32 mb-1" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  )
}

export default function InstagramDashboardPage() {
  const {
    instances,
    selectedInstance,
    setSelectedInstance,
    insights,
    media,
    logs,
    isLoading,
    isInsightsLoading,
    isMediaLoading,
    isLogsLoading,
    error,
    period,
    setPeriod,
    refreshInstances,
    refreshInsights,
    refreshMedia,
    refreshLogs,
    disconnectInstance,
    sendDirectMessage,
  } = useInstagram()

  const [activeTab, setActiveTab] = useState("conta")
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const handleDisconnect = async () => {
    if (!selectedInstance) return
    
    if (!confirm("Tem certeza que deseja desconectar esta conta do Instagram?")) {
      return
    }

    setIsDisconnecting(true)
    try {
      await disconnectInstance(selectedInstance.id)
    } finally {
      setIsDisconnecting(false)
    }
  }

  const handleRefresh = async () => {
    if (selectedInstance) {
      await refreshInsights()
      await refreshMedia()
    }
  }

  const handleSendMessage = async (recipient: string, message: string) => {
    if (!selectedInstance) return
    await sendDirectMessage(selectedInstance.id, recipient, message)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-6xl">
        <HeaderSkeleton />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  // No instances connected
  if (instances.length === 0) {
    return (
      <div className="container mx-auto py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center">
            <Instagram className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Instagram</h1>
            <p className="text-muted-foreground text-sm">
              Gerencie sua conta Instagram Business
            </p>
          </div>
        </div>

        <Suspense fallback={null}>
          <SuccessAlert />
        </Suspense>

        <Card className="text-center py-16">
          <CardContent>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center mx-auto mb-6">
              <Instagram className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              Nenhuma conta conectada
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Conecte sua conta Instagram Business para gerenciar mensagens Direct,
              visualizar métricas, publicações e interagir com seus seguidores.
            </p>
            <Link href="/integracoes/instagram/connect">
              <Button className="bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Conectar Instagram
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center shadow-lg">
            <Instagram className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Instagram</h1>
            <p className="text-muted-foreground text-sm">
              Gerencie sua conta Instagram Business
            </p>
          </div>
        </div>
        <Link href="/integracoes/instagram/connect">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Nova Conexão
          </Button>
        </Link>
      </div>

      <Suspense fallback={null}>
        <SuccessAlert />
      </Suspense>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Instance Selector */}
      {instances.length > 1 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <label className="text-sm font-medium mb-2 block">Conta Selecionada</label>
            <div className="flex flex-wrap gap-2">
              {instances.map((instance) => (
                <Button
                  key={instance.id}
                  variant={selectedInstance?.id === instance.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedInstance(instance)}
                  className={selectedInstance?.id === instance.id ? 
                    "bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white" : ""
                  }
                >
                  @{instance.username}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full justify-start bg-muted/50 p-1">
          <TabsTrigger value="conta" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Conta</span>
          </TabsTrigger>
          <TabsTrigger value="direct" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Direct</span>
          </TabsTrigger>
          <TabsTrigger value="metricas" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Métricas</span>
          </TabsTrigger>
          <TabsTrigger value="midias" className="gap-2">
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Mídias</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <ScrollText className="h-4 w-4" />
            <span className="hidden sm:inline">Logs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conta" className="space-y-6">
          {selectedInstance && (
            <InstagramAccountSection
              instance={{
                ...selectedInstance,
                connectedAt: selectedInstance.connectedAt
                  ? new Date(selectedInstance.connectedAt)
                  : null,
                lastSyncAt: selectedInstance.lastSyncAt
                  ? new Date(selectedInstance.lastSyncAt)
                  : null,
              }}
              onDisconnect={handleDisconnect}
              onRefresh={handleRefresh}
              isDisconnecting={isDisconnecting}
            />
          )}
        </TabsContent>

        <TabsContent value="direct">
          <InstagramDirectSection
            instance={selectedInstance}
            onSendMessage={handleSendMessage}
          />
        </TabsContent>

        <TabsContent value="metricas">
          <InstagramMetricsSection
            insights={insights}
            period={period}
            onPeriodChange={setPeriod}
            isLoading={isInsightsLoading}
            instance={selectedInstance}
          />
        </TabsContent>

        <TabsContent value="midias">
          <InstagramMediaSection
            media={media}
            isLoading={isMediaLoading}
            onRefresh={refreshMedia}
          />
        </TabsContent>

        <TabsContent value="logs">
          <InstagramLogsSection
            logs={logs}
            isLoading={isLogsLoading}
            onRefresh={refreshLogs}
            instance={selectedInstance}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
