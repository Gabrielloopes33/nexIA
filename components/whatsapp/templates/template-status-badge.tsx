"use client"

import { CheckCircle2, Clock, XCircle, PauseCircle, AlertCircle, Ban } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { TemplateStatus } from "@/lib/whatsapp/types"
import { TEMPLATE_STATUS_CONFIG } from "@/lib/whatsapp/constants"
import { cn } from "@/lib/utils"

interface TemplateStatusBadgeProps {
  status: TemplateStatus
  rejectedReason?: string
  showTooltip?: boolean
  size?: "sm" | "md" | "lg"
}

export function TemplateStatusBadge({ 
  status, 
  rejectedReason,
  showTooltip = true,
  size = "md" 
}: TemplateStatusBadgeProps) {
  const config = TEMPLATE_STATUS_CONFIG[status] || TEMPLATE_STATUS_CONFIG.PENDING
  const Icon = config.icon
  
  const sizeClasses = {
    sm: "h-5 text-[10px] px-1.5",
    md: "h-6 text-xs px-2",
    lg: "h-7 text-sm px-3",
  }

  const iconSize = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  }

  const badge = (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1.5 font-medium",
        config.bgColor,
        config.color,
        sizeClasses[size]
      )}
    >
      <Icon className={iconSize[size]} />
      <span>{config.label}</span>
    </Badge>
  )

  if (!showTooltip || status !== 'REJECTED') {
    return badge
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-[280px] bg-popover text-popover-foreground border shadow-sm"
        >
          <p className="font-medium">Template Rejeitado</p>
          {rejectedReason && (
            <p className="mt-1 text-xs text-muted-foreground">{rejectedReason}</p>
          )}
          <p className="mt-2 text-xs">
            <a 
              href="https://developers.facebook.com/docs/whatsapp/message-templates/guidelines" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#9795e4] hover:underline"
            >
              Ver diretrizes
            </a>
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface TemplateCategoryBadgeProps {
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION'
  size?: "sm" | "md"
}

export function TemplateCategoryBadge({ category, size = "sm" }: TemplateCategoryBadgeProps) {
  const config = {
    UTILITY: {
      label: 'Utilidade',
      className: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    MARKETING: {
      label: 'Marketing',
      className: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    AUTHENTICATION: {
      label: 'Autenticação',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  }

  const sizeClasses = {
    sm: "h-5 text-[10px] px-1.5",
    md: "h-6 text-xs px-2",
  }

  const { label, className } = config[category]

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        className,
        sizeClasses[size]
      )}
    >
      {label}
    </Badge>
  )
}
