"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ComplianceBanner } from "@/components/whatsapp/shared/compliance-banner"
import { TemplateCard } from "@/components/whatsapp/templates/template-card"
import { CreateTemplateDialog } from "@/components/whatsapp/templates/create-template-dialog"
import { TemplateCategoryBadge } from "@/components/whatsapp/templates/template-status-badge"
import { useWhatsAppInstances } from "@/hooks/use-whatsapp-instances"
import { useWhatsAppTemplatesSync } from "@/hooks/use-whatsapp-templates-sync"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  FileText, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Clock,
  XCircle,
  ArrowRight,
  Phone,
  ChevronDown,
  Check,
  Loader2,
} from "lucide-react"
import { TEMPLATE_COMPLIANCE_MESSAGES } from "@/lib/whatsapp/compliance-messages"
import { cn } from "@/lib/utils"

// Hook para pegar organizationId - simplificado para este exemplo
function useOrganizationId(): string | undefined {
  // Em produção, isso viria de um contexto de organização
  // Por agora, vamos usar localStorage ou um valor padrão
  const [orgId, setOrgId] = useState<string | undefined>(undefined)
  
  useEffect(() => {
    // Tentar pegar do localStorage ou usar um mock
    const saved = localStorage.getItem('current_organization_id')
    if (saved) {
      setOrgId(saved)
    }
  }, [])
  
  return orgId
}

export default function WhatsAppTemplatesPage() {
  const organizationId = useOrganizationId()
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>("")
  
  const { 
    instances, 
    isLoading: isLoadingInstances, 
    error: instancesError 
  } = useWhatsAppInstances(organizationId)
  
  const {
    templates,
    isLoading: isLoadingTemplates,
    isSyncing,
    error: templatesError,
    syncResult,
    loadTemplates,
    syncTemplates,
  } = useWhatsAppTemplatesSync()

  // Selecionar primeira instância conectada quando carregar
  useEffect(() => {
    if (instances.length > 0 && !selectedInstanceId) {
      const connectedInstance = instances.find(i => i.status === 'CONNECTED')
      if (connectedInstance) {
        setSelectedInstanceId(connectedInstance.id)
      }
    }
  }, [instances, selectedInstanceId])

  // Carregar templates quando selecionar instância
  useEffect(() => {
    if (selectedInstanceId) {
      loadTemplates(selectedInstanceId)
    }
  }, [selectedInstanceId, loadTemplates])

  // Filter templates by status
  const approvedTemplates = templates.filter(t => t.status === 'APPROVED')
  const pendingTemplates = templates.filter(t => t.status === 'PENDING')
  const rejectedTemplates = templates.filter(t => t.status === 'REJECTED')

  // Count by category
  const utilityCount = templates.filter(t => t.category === 'UTILITY').length
  const marketingCount = templates.filter(t => t.category === 'MARKETING').length
  const authCount = templates.filter(t => t.category === 'AUTHENTICATION').length

  const handleSync = async () => {
    if (!selectedInstanceId) return
    await syncTemplates(selectedInstanceId)
  }

  const selectedInstance = instances.find(i => i.id === selectedInstanceId)
  const hasConnectedInstance = instances.some(i => i.status === 'CONNECTED')

  // Estado vazio - nenhuma instância conectada
  if (!isLoadingInstances && instances.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Templates de Mensagem</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie seus templates para mensagens fora da janela de 24h
            </p>
          </div>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#46347F]/10 mb-4">
              <Phone className="h-8 w-8 text-[#46347F]" />
            </div>
            <h3 className="text-lg font-semibold">Nenhuma instância conectada</h3>
            <p className="mt-1 text-sm text-muted-foreground text-center max-w-md">
              Conecte uma instância WhatsApp Business para gerenciar seus templates de mensagem
            </p>
            <Button asChild className="mt-6 gap-2 bg-[#25D366] hover:bg-[#128C7E]">
              <Link href="/integracoes/whatsapp">
                <Plus className="h-4 w-4" />
                Conectar WhatsApp
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Templates de Mensagem</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seus templates para mensagens fora da janela de 24h
          </p>
        </div>
        <div className="flex gap-2">
          <CreateTemplateDialog 
            onCreate={async () => {
              // Recarregar templates após criar
              if (selectedInstanceId) {
                await loadTemplates(selectedInstanceId)
              }
            }} 
            disabled={!selectedInstanceId || isLoadingTemplates} 
          />
        </div>
      </div>

      {/* Instance Selector */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 w-full sm:w-auto">
              <label className="text-sm font-medium mb-1.5 block">Instância WhatsApp</label>
              <Select 
                value={selectedInstanceId} 
                onValueChange={setSelectedInstanceId}
                disabled={isLoadingInstances}
              >
                <SelectTrigger className="w-full sm:w-[320px]">
                  <SelectValue placeholder="Selecione uma instância" />
                </SelectTrigger>
                <SelectContent>
                  {instances.map((instance) => (
                    <SelectItem key={instance.id} value={instance.id}>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          instance.status === 'CONNECTED' ? "bg-green-500" : "bg-gray-300"
                        )} />
                        <span className="truncate">{instance.name}</span>
                        <span className="text-muted-foreground text-xs">
                          ({instance.phoneNumber})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={handleSync}
                disabled={!selectedInstanceId || isSyncing || isLoadingTemplates}
                className="flex-1 sm:flex-none gap-2"
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
            </div>
          </div>

          {/* Sync Result */}
          {syncResult && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <Check className="h-4 w-4" />
                <span className="font-medium">
                  {syncResult.upserted} templates sincronizados com sucesso!
                </span>
              </div>
              <div className="mt-2 text-sm text-green-700 flex flex-wrap gap-3">
                {Object.entries(syncResult.byStatus).map(([status, count]) => (
                  <span key={status} className="inline-flex items-center gap-1">
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      status === 'APPROVED' && "bg-green-500",
                      status === 'PENDING' && "bg-yellow-500",
                      status === 'REJECTED' && "bg-red-500",
                      status === 'PAUSED' && "bg-gray-500",
                    )} />
                    {status}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance Notice */}
      <div>
        <ComplianceBanner message={TEMPLATE_COMPLIANCE_MESSAGES.PENDING} />
      </div>

      {/* Loading State */}
      {(isLoadingInstances || isLoadingTemplates) && !templates.length && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-12" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-20 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Content - Only show when not loading */}
      {!isLoadingInstances && !isLoadingTemplates && (
        <>
          {/* Stats Overview */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#46347F]/10">
                  <FileText className="h-6 w-6 text-[#46347F]" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{templates.length}</p>
                  <p className="text-xs text-muted-foreground">Total de templates</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{approvedTemplates.length}</p>
                  <p className="text-xs text-muted-foreground">Aprovados</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingTemplates.length}</p>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{rejectedTemplates.length}</p>
                  <p className="text-xs text-muted-foreground">Rejeitados</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribuição por Categoria</CardTitle>
              <CardDescription>
                Templates organizados por tipo de uso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2">
                  <span className="text-2xl font-bold text-blue-700">{utilityCount}</span>
                  <TemplateCategoryBadge category="UTILITY" size="md" />
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-purple-50 px-4 py-2">
                  <span className="text-2xl font-bold text-purple-700">{marketingCount}</span>
                  <TemplateCategoryBadge category="MARKETING" size="md" />
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2">
                  <span className="text-2xl font-bold text-emerald-700">{authCount}</span>
                  <TemplateCategoryBadge category="AUTHENTICATION" size="md" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error State */}
          {(instancesError || templatesError) && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {instancesError || templatesError}
              </AlertDescription>
            </Alert>
          )}

          {/* Templates List */}
          <div className="space-y-4">
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">
                  Todos
                  <Badge variant="secondary" className="ml-2">{templates.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Aprovados
                  <Badge variant="secondary" className="ml-2">{approvedTemplates.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pendentes
                  <Badge variant="secondary" className="ml-2">{pendingTemplates.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejeitados
                  <Badge variant="secondary" className="ml-2">{rejectedTemplates.length}</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                {templates.length === 0 ? (
                  <EmptyTemplatesState onSync={handleSync} isSyncing={isSyncing} />
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {templates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onDelete={async () => {
                          // Recarregar templates após deletar
                          if (selectedInstanceId) {
                            await loadTemplates(selectedInstanceId)
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="approved" className="mt-4">
                {approvedTemplates.length === 0 ? (
                  <EmptyState message="Nenhum template aprovado" />
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {approvedTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onDelete={async () => {
                          if (selectedInstanceId) {
                            await loadTemplates(selectedInstanceId)
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pending" className="mt-4">
                {pendingTemplates.length === 0 ? (
                  <EmptyState message="Nenhum template pendente" />
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {pendingTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="rejected" className="mt-4">
                {rejectedTemplates.length > 0 && (
                  <ComplianceBanner message={TEMPLATE_COMPLIANCE_MESSAGES.REJECTED} className="mb-4" />
                )}
                {rejectedTemplates.length === 0 ? (
                  <EmptyState message="Nenhum template rejeitado" />
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {rejectedTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onDelete={async () => {
                          if (selectedInstanceId) {
                            await loadTemplates(selectedInstanceId)
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}
    </div>
  )
}

function EmptyTemplatesState({ 
  onSync, 
  isSyncing 
}: { 
  onSync: () => void
  isSyncing: boolean 
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Nenhum template encontrado</h3>
        <p className="mt-1 text-sm text-muted-foreground text-center max-w-md">
          Clique em &quot;Sincronizar&quot; para carregar os templates da sua conta WhatsApp Business
        </p>
        <Button 
          variant="outline" 
          onClick={onSync}
          disabled={isSyncing}
          className="mt-4 gap-2"
        >
          {isSyncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isSyncing ? 'Sincronizando...' : 'Sincronizar Templates'}
        </Button>
      </CardContent>
    </Card>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  )
}
