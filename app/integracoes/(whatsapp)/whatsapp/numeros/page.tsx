"use client"

import { ComplianceBanner } from "@/components/whatsapp/shared/compliance-banner"
import { PhoneNumberCard } from "@/components/whatsapp/numeros/phone-number-card"
import { AddNumberDialog } from "@/components/whatsapp/numeros/add-number-dialog"
import { QualityBadge } from "@/components/whatsapp/numeros/quality-badge"
import { useWhatsAppPhoneNumbers } from "@/hooks/use-whatsapp-phone-numbers"
import { useWhatsApp } from "@/hooks/use-whatsapp"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  Phone, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Shield,
  ArrowRight
} from "lucide-react"
import { QUALITY_COMPLIANCE_MESSAGES } from "@/lib/whatsapp/compliance-messages"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function WhatsAppNumerosPage() {
  const { account, status } = useWhatsApp()
  const { 
    phoneNumbers, 
    isLoading, 
    error,
    addNumber,
    removeNumber,
    requestCode,
    setAsDefault,
    refreshNumbers,
  } = useWhatsAppPhoneNumbers(account?.wabaId)

  const isConnected = status === 'connected'

  // Calculate stats
  const verifiedCount = phoneNumbers.filter(p => p.status === 'VERIFIED').length
  const defaultNumber = phoneNumbers.find(p => p.isDefault)
  const lowQualityNumbers = phoneNumbers.filter(p => p.qualityRating === 'RED' || p.qualityRating === 'YELLOW')

  if (!isConnected) {
    return (<>
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700">
              Conecte sua conta WhatsApp Business para gerenciar números.{' '}
              <Link href="/integracoes/whatsapp/connect" className="font-medium underline">
                Conectar agora
                <ArrowRight className="ml-1 inline-block h-3 w-3" />
              </Link>
            </AlertDescription>
          </Alert>
      </>
    )
  }

  return (<>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Números de Telefone</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie seus números WhatsApp Business
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshNumbers}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Atualizar
            </Button>
            <AddNumberDialog onAdd={addNumber} disabled={isLoading} />
          </div>
        </div>

        {/* Quality Warnings */}
        {lowQualityNumbers.length > 0 && (
          <div className="mb-6 space-y-3">
            {lowQualityNumbers.map((number) => (
              <ComplianceBanner
                key={number.id}
                message={QUALITY_COMPLIANCE_MESSAGES[number.qualityRating]}
              />
            ))}
          </div>
        )}

        {/* Stats Overview */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#9795e4]/10">
                <Phone className="h-6 w-6 text-[#9795e4]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{phoneNumbers.length}</p>
                <p className="text-xs text-muted-foreground">Total de números</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{verifiedCount}</p>
                <p className="text-xs text-muted-foreground">Números verificados</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
                <Shield className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lowQualityNumbers.length}</p>
                <p className="text-xs text-muted-foreground">Alertas de qualidade</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error State */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Phone Numbers List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Seus Números</h2>
          
          {phoneNumbers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Phone className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Nenhum número adicionado</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Adicione seu primeiro número de telefone para começar
                </p>
                <AddNumberDialog onAdd={addNumber} disabled={isLoading} />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {phoneNumbers.map((phoneNumber) => (
                <PhoneNumberCard
                  key={phoneNumber.id}
                  phoneNumber={phoneNumber}
                  onSetDefault={setAsDefault}
                  onRequestCode={requestCode}
                  onRemove={removeNumber}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quality Guide */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Sistema de Qualidade</CardTitle>
            <CardDescription>
              Entenda os indicadores de qualidade dos seus números
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div className="mb-2">
                  <QualityBadge rating="GREEN" showTooltip={false} />
                </div>
                <p className="text-sm text-emerald-800">
                  Alta qualidade. Continue mantendo boas práticas de comunicação.
                </p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="mb-2">
                  <QualityBadge rating="YELLOW" showTooltip={false} />
                </div>
                <p className="text-sm text-amber-800">
                  Qualidade média. Usuários podem estar reportando mensagens.
                </p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="mb-2">
                  <QualityBadge rating="RED" showTooltip={false} />
                </div>
                <p className="text-sm text-red-800">
                  Qualidade baixa. Risco de bloqueio. Aja imediatamente!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
    </>
  )
}
