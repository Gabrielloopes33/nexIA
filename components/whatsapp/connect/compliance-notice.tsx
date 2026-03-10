"use client"

import { Shield, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ComplianceBannerList } from "@/components/whatsapp/shared/compliance-banner"
import { GENERAL_COMPLIANCE_MESSAGES } from "@/lib/whatsapp/compliance-messages"

export function ComplianceNotice() {
  // Filter to show only critical and warning messages for the connect page
  const relevantMessages = GENERAL_COMPLIANCE_MESSAGES.filter(
    (msg) => msg.id === 'opt-in-required' || msg.id === 'business-verification'
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[#46347F]" />
          <CardTitle className="text-lg">Compliance & Diretrizes</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ComplianceBannerList messages={relevantMessages} />
        
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <h4 className="mb-2 text-sm font-semibold">Antes de conectar, certifique-se de:</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Ter uma conta Business Manager verificada no Facebook</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Possuir um número de telefone válido para verificação</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Ter lido e concordado com as políticas do WhatsApp Business</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Compreender as diretrizes de mensagens da Meta</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <a 
              href="https://business.whatsapp.com/policy" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Políticas do WhatsApp
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <a 
              href="https://www.whatsapp.com/legal/business-policy/" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Diretrizes Comerciais
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
