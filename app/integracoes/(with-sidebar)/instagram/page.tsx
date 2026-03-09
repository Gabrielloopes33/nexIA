"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  InstagramAccountSection,
  InstagramDirectSection,
  InstagramMetricsSection,
  InstagramMediaSection,
} from "@/components/instagram";
import { Instagram, Plus, AlertCircle, CheckCircle2, MessageSquare, BarChart3, Image as ImageIcon } from "lucide-react";

interface InstagramInstance {
  id: string;
  instagramId: string;
  username: string;
  name?: string | null;
  profilePictureUrl?: string | null;
  status: string;
  connectedAt?: string;
  lastSyncAt?: string;
}

interface InstagramInsights {
  impressions: number;
  reach: number;
  profileViews: number;
  websiteClicks: number;
}

function SuccessAlert() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  
  if (success !== "connected") return null;
  
  return (
    <Alert className="mb-6 bg-green-50 border-green-200">
      <CheckCircle2 className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800">
        Conta Instagram conectada com sucesso!
      </AlertDescription>
    </Alert>
  );
}

export default function InstagramDashboardPage() {

  const [instances, setInstances] = useState<InstagramInstance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<InstagramInstance | null>(null);
  const [insights, setInsights] = useState<InstagramInsights>({
    impressions: 0,
    reach: 0,
    profileViews: 0,
    websiteClicks: 0,
  });
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInstances();
  }, []);

  useEffect(() => {
    if (selectedInstance) {
      fetchInsights(selectedInstance.id);
    }
  }, [selectedInstance, period]);

  const fetchInstances = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/instagram/instances");
      const data = await response.json();

      if (data.success) {
        setInstances(data.data);
        if (data.data.length > 0) {
          setSelectedInstance(data.data[0]);
        }
      } else {
        setError(data.error || "Failed to fetch instances");
      }
    } catch (err) {
      setError("Failed to fetch instances");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInsights = async (instanceId: string) => {
    try {
      const response = await fetch(
        `/api/instagram/insights?instanceId=${instanceId}&period=${period}`
      );
      const data = await response.json();

      if (data.success) {
        setInsights(data.data.insights);
      }
    } catch (err) {
      console.error("Failed to fetch insights:", err);
    }
  };

  const handleDisconnect = async () => {
    if (!selectedInstance) return;

    try {
      const response = await fetch(`/api/instagram/instances/${selectedInstance.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchInstances();
        setSelectedInstance(null);
      } else {
        setError("Failed to disconnect instance");
      }
    } catch (err) {
      setError("Failed to disconnect instance");
    }
  };

  const handleRefresh = async () => {
    if (selectedInstance) {
      await fetchInsights(selectedInstance.id);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">Carregando...</div>
      </div>
    );
  }

  // No instances connected
  if (instances.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Instagram className="h-6 w-6 text-pink-500" />
              Instagram
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie suas contas Instagram Business
            </p>
          </div>
        </div>

        <Suspense fallback={null}>
          <SuccessAlert />
        </Suspense>

        <Card className="text-center py-12">
          <CardContent>
            <Instagram className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Nenhuma conta conectada
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Conecte sua conta Instagram Business para gerenciar mensagens,
              visualizar métricas e interagir com seus seguidores.
            </p>
            <Link href="/integracoes/instagram/connect">
              <Button className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Conectar Instagram
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Instagram className="h-6 w-6 text-pink-500" />
            Instagram
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas contas Instagram Business
          </p>
        </div>
        <Link href="/integracoes/instagram/connect">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Nova Conexão
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Instance Selector */}
      {instances.length > 1 && (
        <div className="mb-6">
          <label className="text-sm font-medium mb-2 block">Conta</label>
          <div className="flex gap-2">
            {instances.map((instance) => (
              <Button
                key={instance.id}
                variant={selectedInstance?.id === instance.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedInstance(instance)}
              >
                @{instance.username}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="messages">
            <MessageSquare className="h-4 w-4 mr-2" />
            Mensagens
          </TabsTrigger>
          <TabsTrigger value="media">
            <ImageIcon className="h-4 w-4 mr-2" />
            Publicações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {selectedInstance && (
            <>
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
              />
              <InstagramMetricsSection
                insights={insights}
                period={period}
                onPeriodChange={setPeriod}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="messages">
          <InstagramDirectSection
            conversations={[]}
            onSelectConversation={(id) => console.log("Selected:", id)}
            onSendMessage={async () => {}}
          />
        </TabsContent>

        <TabsContent value="media">
          <InstagramMediaSection
            media={[]}
            onLoadMore={() => {}}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
