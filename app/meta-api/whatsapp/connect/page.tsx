"use client"

import { EmbeddedSignupButton } from "@/components/whatsapp/connect/embedded-signup-button"
import { ConnectionStatusCard } from "@/components/whatsapp/connect/connection-status"
import { ComplianceNotice } from "@/components/whatsapp/connect/compliance-notice"
import { ManualConnectionForm } from "@/components/whatsapp/connect/manual-connection-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { WhatsAppIcon } from "@/components/whatsapp/shared/whatsapp-icon"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWhatsApp } from "@/hooks/use-whatsapp"

import { CheckCircle2, Shield, ExternalLink, Facebook, KeyRound } from "lucide-react"
import Link from "next/link"

export default function WhatsAppConnectPage() {
  const { status } = useWhatsApp()
  const isConnected = status === 'connected'

  return (<>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Conectar WhatsApp Business</h1>
          <p className="text-sm text-muted-foreground">
            Conecte sua conta usando o Embedded Signup da Meta ou insira os dados manualmente
          </p>
        </div>

        {/* Connection Status */}
        <div className="mb-6">
          <ConnectionStatusCard />
        </div>

        {/* Connection Options - Only show if not connected */}
        {!isConnected && (
          <div className="mb-6">
            <Tabs defaultValue="embedded" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
                <TabsTrigger value="embedded" className="flex items-center gap-2">
                  <Facebook className="h-4 w-4" />
                  Embedded Signup
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Conexão Manual
                </TabsTrigger>
              </TabsList>

              {/* Embedded Signup Tab */}
              <TabsContent value="embedded" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-[#46347F]" />
                      Passos para Conexão
                    </CardTitle>
                    <CardDescription>
                      Siga estas etapas para conectar sua conta WhatsApp Business via Facebook
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#46347F]/10 text-sm font-bold text-[#46347F]">
                          1
                        </div>
                        <div>
                          <p className="font-medium">Tenha uma conta Business Manager</p>
                          <p className="text-sm text-muted-foreground">
                            Você precisa ser administrador de um Business Manager da Meta.{" "}
                            <Link 
                              href="https://business.facebook.com/" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[#46347F] hover:underline"
                            >
                              Criar Business Manager
                              <ExternalLink className="ml-1 inline-block h-3 w-3" />
                            </Link>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#46347F]/10 text-sm font-bold text-[#46347F]">
                          2
                        </div>
                        <div>
                          <p className="font-medium">Verifique seu negócio</p>
                          <p className="text-sm text-muted-foreground">
                            Complete a verificação de negócio no Business Manager para 
                            poder enviar mensagens de template.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#46347F]/10 text-sm font-bold text-[#46347F]">
                          3
                        </div>
                        <div>
                          <p className="font-medium">Conecte via Embedded Signup</p>
                          <p className="text-sm text-muted-foreground">
                            Use o botão abaixo para autorizar o NexIA a acessar sua 
                            conta WhatsApp Business.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#46347F]/10 text-sm font-bold text-[#46347F]">
                          4
                        </div>
                        <div>
                          <p className="font-medium">Adicione números de telefone</p>
                          <p className="text-sm text-muted-foreground">
                            Após a conexão, adicione e verifique seus números de telefone.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-center">
                      <EmbeddedSignupButton />
                    </div>
                  </CardContent>
                </Card>

                {/* Note about domain verification */}
                <Alert className="bg-amber-50 border-amber-200">
                  <Shield className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700 text-sm">
                    <strong>Nota:</strong> O método Embedded Signup requer que você configure 
                    o domínio do aplicativo no Facebook Developer Console. Se você não tem 
                    acesso para fazer isso, use a opção de{" "}
                    <Link href="#" onClick={() => {
                      const manualTab = document.querySelector('[data-value="manual"]') as HTMLButtonElement
                      manualTab?.click()
                    }} className="font-medium underline">
                      Conexão Manual
                    </Link>.
                  </AlertDescription>
                </Alert>
              </TabsContent>

              {/* Manual Connection Tab */}
              <TabsContent value="manual">
                <ManualConnectionForm 
                  organizationId="temp-org-id" // TODO: Replace with actual organization ID from context
                  onSuccess={() => {
                    // Refresh the page or update status
                    window.location.reload()
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Success State */}
        {isConnected && (
          <Alert className="mb-6 border-emerald-200 bg-emerald-50">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-700">
              Conta conectada com sucesso! Você já pode usar todos os recursos 
              do WhatsApp Business API.
            </AlertDescription>
          </Alert>
        )}

        {/* Compliance Section */}
        <div className="mb-6">
          <ComplianceNotice />
        </div>

        {/* Help Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Precisa de Ajuda?</CardTitle>
            <CardDescription>
              Recursos úteis para configurar sua integração
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link 
                href="https://developers.facebook.com/docs/whatsapp/overview/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
                <span className="text-sm font-medium">Documentação Oficial</span>
                <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground" />
              </Link>
              <Link 
                href="https://business.whatsapp.com/products/business-platform"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <Shield className="h-5 w-5 text-[#46347F]" />
                <span className="text-sm font-medium">WhatsApp Business Platform</span>
                <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground" />
              </Link>
            </div>
          </CardContent>
        </Card>
    </>
  )
}
