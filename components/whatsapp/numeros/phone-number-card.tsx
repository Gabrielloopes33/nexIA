"use client"

import { Phone, Star, Shield, Copy, MoreVertical, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { WhatsAppPhoneNumber } from "@/lib/whatsapp/types"
import { QualityBadge } from "./quality-badge"
import { PHONE_NUMBER_STATUS } from "@/lib/whatsapp/constants"
import { cn } from "@/lib/utils"

interface PhoneNumberCardProps {
  phoneNumber: WhatsAppPhoneNumber
  onSetDefault?: (id: string) => void
  onRequestCode?: (id: string) => void
  onRemove?: (id: string) => void
}

export function PhoneNumberCard({ 
  phoneNumber, 
  onSetDefault,
  onRequestCode,
  onRemove,
}: PhoneNumberCardProps) {
  const statusConfig = PHONE_NUMBER_STATUS[phoneNumber.status]

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(phoneNumber.displayPhoneNumber)
  }

  return (
    <Card className={cn(
      "transition-all",
      phoneNumber.isDefault && "ring-2 ring-[#46347F]/30"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              phoneNumber.isDefault ? "bg-[#46347F]/10" : "bg-muted"
            )}>
              <Phone className={cn(
                "h-5 w-5",
                phoneNumber.isDefault ? "text-[#46347F]" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{phoneNumber.displayPhoneNumber}</h3>
                {phoneNumber.isDefault && (
                  <Badge 
                    variant="secondary" 
                    className="h-5 gap-1 bg-[#46347F]/10 text-[#46347F] text-[10px]"
                  >
                    <Star className="h-3 w-3 fill-current" />
                    Padrão
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{phoneNumber.verifiedName}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCopyNumber}>
                <Copy className="mr-2 h-4 w-4" />
                Copiar número
              </DropdownMenuItem>
              {!phoneNumber.isDefault && phoneNumber.status === 'VERIFIED' && (
                <DropdownMenuItem onClick={() => onSetDefault?.(phoneNumber.id)}>
                  <Star className="mr-2 h-4 w-4" />
                  Definir como padrão
                </DropdownMenuItem>
              )}
              {phoneNumber.status === 'PENDING' && (
                <DropdownMenuItem onClick={() => onRequestCode?.(phoneNumber.id)}>
                  <Shield className="mr-2 h-4 w-4" />
                  Reenviar código
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onRemove?.(phoneNumber.id)}
                className="text-red-600 focus:text-red-600"
              >
                Remover
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Qualidade</p>
            <div className="mt-1">
              <QualityBadge rating={phoneNumber.qualityRating} size="sm" />
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <div className="mt-1">
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs",
                  statusConfig.bgColor,
                  statusConfig.color
                )}
              >
                {phoneNumber.status === 'VERIFIED' && (
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                )}
                {statusConfig.label}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            <span className="font-medium">Modo:</span>{' '}
            {phoneNumber.accountMode === 'LIVE' ? 'Produção' : 'Sandbox'}
          </div>
          <div>
            <span className="font-medium">PIN:</span>{' '}
            {phoneNumber.isPinEnabled ? 'Ativado' : 'Desativado'}
          </div>
        </div>

        {phoneNumber.qualityRating === 'RED' && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            <p className="font-medium">⚠️ Atenção: Qualidade Crítica</p>
            <p className="mt-1 text-xs">
              Este número está com qualidade baixa. Risco de bloqueio iminente.
            </p>
          </div>
        )}

        {phoneNumber.qualityRating === 'YELLOW' && (
          <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
            <p className="font-medium">⚠️ Atenção: Qualidade Média</p>
            <p className="mt-1 text-xs">
              Monitore de perto. Evite enviar mensagens em massa.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
