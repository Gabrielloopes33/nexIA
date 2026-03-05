"use client"

import { Sidebar } from "@/components/sidebar"
import { WhatsAppSubSidebar } from "@/components/whatsapp/whatsapp-sub-sidebar"
import { ComplianceBanner } from "@/components/whatsapp/shared/compliance-banner"
import { TemplateCard } from "@/components/whatsapp/templates/template-card"
import { CreateTemplateDialog } from "@/components/whatsapp/templates/create-template-dialog"
import { TemplateCategoryBadge } from "@/components/whatsapp/templates/template-status-badge"
import { useWhatsAppTemplates } from "@/hooks/use-whatsapp-templates"
import { useWhatsApp } from "@/hooks/use-whatsapp"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Clock,
  XCircle,
  ArrowRight
} from "lucide-react"
import { TEMPLATE_COMPLIANCE_MESSAGES } from "@/lib/whatsapp/compliance-messages"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function WhatsAppTemplatesPage() {
  const { account, status } = useWhatsApp()
  const { 
    templates, 
    isLoading, 
    error,
    createNewTemplate,
    removeTemplate,
    refreshTemplates,
  } = useWhatsAppTemplates(account?.wabaId)

  const isConnected = status === 'connected'

  // Filter templates by status
  const approvedTemplates = templates.filter(t => t.status === 'APPROVED')
  const pendingTemplates = templates.filter(t => t.status === 'PENDING')
  const rejectedTemplates = templates.filter(t => t.status === 'REJECTED')

  // Count by category
  const utilityCount = templates.filter(t => t.category === 'UTILITY').length
  const marketingCount = templates.filter(t => t.category === 'MARKETING').length
  const authCount = templates.filter(t => t.category === 'AUTHENTICATION').length

  if (!isConnected) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <WhatsAppSubSidebar />
        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700">
              Conecte sua conta WhatsApp Business para gerenciar templates.{' '}
              <Link href="/integracoes/whatsapp/connect" className="font-medium underline">
                Conectar agora
                <ArrowRight className="ml-1 inline-block h-3 w-3" />
              </Link>
            </AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Main Sidebar */}
      <Sidebar />

      {/* WhatsApp Sub-Sidebar */}
      <WhatsAppSubSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Templates de Mensagem</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie seus templates para mensagens fora da janela de 24h
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshTemplates}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Atualizar
            </Button>
            <CreateTemplateDialog onCreate={createNewTemplate} disabled={isLoading} />
          </div>
        </div>

        {/* Compliance Notice */}
        <div className="mb-6">
          <ComplianceBanner message={TEMPLATE_COMPLIANCE_MESSAGES.PENDING} />
        </div>

        {/* Stats Overview */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#9795e4]/10">
                <FileText className="h-6 w-6 text-[#9795e4]" />
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
        <Card className="mb-6">
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
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
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
                <EmptyTemplatesState onCreate={createNewTemplate} />
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {templates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onDelete={removeTemplate}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="approved" className="mt-4">
              <div className="grid gap-4 lg:grid-cols-2">
                {approvedTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onDelete={removeTemplate}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="pending" className="mt-4">
              <div className="grid gap-4 lg:grid-cols-2">
                {pendingTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="rejected" className="mt-4">
              {rejectedTemplates.length > 0 && (
                <ComplianceBanner message={TEMPLATE_COMPLIANCE_MESSAGES.REJECTED} className="mb-4" />
              )}
              <div className="grid gap-4 lg:grid-cols-2">
                {rejectedTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onDelete={removeTemplate}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

function EmptyTemplatesState({ onCreate }: { onCreate: (request: { name: string; category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION'; language: string; components: unknown[] }) => Promise<void> }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Nenhum template criado</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Crie seu primeiro template para enviar mensagens fora da janela de 24h
        </p>
        <CreateTemplateDialog onCreate={onCreate} />
      </CardContent>
    </Card>
  )
}
