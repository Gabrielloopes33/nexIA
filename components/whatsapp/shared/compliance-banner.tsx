"use client"

import { AlertCircle, AlertTriangle, Info, ExternalLink } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import type { ComplianceMessage } from "@/lib/whatsapp/compliance-messages"
import { cn } from "@/lib/utils"

interface ComplianceBannerProps {
  message: ComplianceMessage
  onDismiss?: () => void
  className?: string
}

const severityConfig = {
  info: {
    icon: Info,
    variant: "default" as const,
    classes: "bg-[#46347F]/10 border-[#46347F]/20 text-foreground",
  },
  warning: {
    icon: AlertTriangle,
    variant: "default" as const,
    classes: "bg-amber-50 border-amber-200 text-amber-900",
  },
  critical: {
    icon: AlertCircle,
    variant: "destructive" as const,
    classes: "bg-red-50 border-red-200 text-red-900",
  },
}

export function ComplianceBanner({ message, onDismiss, className }: ComplianceBannerProps) {
  const config = severityConfig[message.severity]
  const Icon = config.icon

  return (
    <Alert
      className={cn(
        "relative",
        config.classes,
        className
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <div className="flex-1">
        <AlertTitle className="font-semibold">{message.title}</AlertTitle>
        <AlertDescription className="mt-1 text-sm opacity-90">
          {message.message}
        </AlertDescription>
        {(message.action || message.actionLink || message.learnMoreLink) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {message.actionLink && (
              <Button
                size="sm"
                variant="outline"
                className={cn(
                  "h-7 text-xs",
                  message.severity === 'info' && "border-[#46347F]/30 hover:bg-[#46347F]/10",
                  message.severity === 'warning' && "border-amber-300 hover:bg-amber-100",
                  message.severity === 'critical' && "border-red-300 hover:bg-red-100"
                )}
                asChild
              >
                <a href={message.actionLink} target="_blank" rel="noopener noreferrer">
                  {message.action || 'Saiba Mais'}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </Button>
            )}
            {message.learnMoreLink && !message.actionLink && (
              <Button
                size="sm"
                variant="outline"
                className={cn(
                  "h-7 text-xs",
                  message.severity === 'info' && "border-[#46347F]/30 hover:bg-[#46347F]/10",
                  message.severity === 'warning' && "border-amber-300 hover:bg-amber-100",
                  message.severity === 'critical' && "border-red-300 hover:bg-red-100"
                )}
                asChild
              >
                <a href={message.learnMoreLink} target="_blank" rel="noopener noreferrer">
                  Documentação
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </Button>
            )}
          </div>
        )}
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="absolute right-2 top-2 h-6 w-6 p-0 opacity-50 hover:opacity-100"
        >
          <span className="sr-only">Fechar</span>
          <span aria-hidden="true">×</span>
        </Button>
      )}
    </Alert>
  )
}

interface ComplianceBannerListProps {
  messages: ComplianceMessage[]
  onDismiss?: (id: string) => void
  className?: string
  maxDisplay?: number
}

export function ComplianceBannerList({ 
  messages, 
  onDismiss, 
  className,
  maxDisplay = 3 
}: ComplianceBannerListProps) {
  const displayMessages = messages.slice(0, maxDisplay)
  
  return (
    <div className={cn("space-y-3", className)}>
      {displayMessages.map((message) => (
        <ComplianceBanner
          key={message.id}
          message={message}
          onDismiss={onDismiss ? () => onDismiss(message.id) : undefined}
        />
      ))}
    </div>
  )
}
