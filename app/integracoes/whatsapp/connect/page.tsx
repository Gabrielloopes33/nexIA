"use client"

import { Sidebar } from "@/components/sidebar"
import { WhatsAppSubSidebar } from "@/components/whatsapp/whatsapp-sub-sidebar"
import { ComplianceBannerList } from "@/components/whatsapp/shared/compliance-banner"
import { EmbeddedSignupButton } from "@/components/whatsapp/connect/embedded-signup-button"
import { ConnectionStatusCard } from "@/components/whatsapp/connect/connection-status"
import { ComplianceNotice } from "@/components/whatsapp/connect/compliance-notice"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { WhatsAppIcon } from "@/components/whatsapp/shared/whatsapp-icon"
import { useWhatsApp } from "@/hooks/use-whatsapp"
import { GENERAL_COMPLIANCE_MESSAGES } from "@/lib/whatsapp/compliance-messages"
import { CheckCircle2, Shield, ExternalLink } from "lucide-react"
import Link from "next/link"

export default function WhatsAppConnectPage() {
  const { status } = useWhatsApp()
  const isConnected = status === 'connected'

  // Get all compliance messages for the connect page
  const complianceMessages = GENERAL_COMPLIANCE_MESSAGES.filter(
    msg => msg.id === 'opt-in-required' || msg.id === 'business-verification'
  )

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Main Sidebar */}
      <Sidebar />

      {/* WhatsApp Sub-Sidebar */}
      <WhatsAppSubSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Conectar WhatsApp Business</h1>
          <p className="text-sm text-muted-foreground">
            Conecte sua conta usando o Embedded Signup da Meta
          </p>
        </div>

        {/* Critical Compliance Messages */}
        <div className="mb-6">
          <ComplianceBannerList messages={complianceMessages} />
        </div>

        {/* Connection Status */}
        <div className="mb-6">
          <ConnectionStatusCard />
        </div>

        {/* Connection Steps */}
        {!isConnected && (
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#9795e4]" />
                  Passos para Conexão
                </CardTitle>
                <CardDescription>
                  Siga estas etapas para conectar sua conta WhatsApp Business
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#9795e4]/10 text-sm font-bold text-[#9795e4]">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Tenha uma conta Business Manager</p>
                      <p className="text-sm text-muted-foreground">
                        Você precisa ser administrador de um Business Manager da Meta.{' '}
                        <Link 
                          href="https://business.facebook.com/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#9795e4] hover:underline"
                        >
                          Criar Business Manager
                          <ExternalLink className="ml-1 inline-block h-3 w-3" />
                        </Link>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#9795e4]/10 text-sm font-bold text-[#9795e4]">
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
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#9795e4]/10 text-sm font-bold text-[#9795e4]">
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
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#9795e4]/10 text-sm font-bold text-[#9795e4]">
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
                <Shield className="h-5 w-5 text-[#9795e4]" />
                <span className="text-sm font-medium">WhatsApp Business Platform</span>
                <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
