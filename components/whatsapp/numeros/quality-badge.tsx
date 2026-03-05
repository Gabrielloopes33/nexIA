"use client"

import { CheckCircle2, AlertTriangle, AlertCircle, HelpCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { PhoneNumberQualityRating } from "@/lib/whatsapp/types"
import { QUALITY_RATING_CONFIG } from "@/lib/whatsapp/constants"
import { cn } from "@/lib/utils"

interface QualityBadgeProps {
  rating: PhoneNumberQualityRating
  showTooltip?: boolean
  size?: "sm" | "md" | "lg"
}

export function QualityBadge({ 
  rating, 
  showTooltip = true,
  size = "md" 
}: QualityBadgeProps) {
  const config = QUALITY_RATING_CONFIG[rating] || QUALITY_RATING_CONFIG.UNKNOWN
  
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

  const getIcon = () => {
    switch (rating) {
      case 'GREEN':
        return <CheckCircle2 className={iconSize[size]} />
      case 'YELLOW':
        return <AlertTriangle className={iconSize[size]} />
      case 'RED':
        return <AlertCircle className={iconSize[size]} />
      default:
        return <HelpCircle className={iconSize[size]} />
    }
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
      {getIcon()}
      <span>{config.label}</span>
    </Badge>
  )

  if (!showTooltip) {
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
          <p className="font-medium">{config.label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{config.description}</p>
          <p className="mt-2 text-xs">
            <a 
              href="https://www.whatsapp.com/legal/business-policy/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#9795e4] hover:underline"
            >
              Saiba mais
            </a>
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface QualityBadgeDotProps {
  rating: PhoneNumberQualityRating
  size?: "sm" | "md" | "lg"
}

export function QualityBadgeDot({ rating, size = "md" }: QualityBadgeDotProps) {
  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3",
  }

  const getColor = () => {
    switch (rating) {
      case 'GREEN':
        return "bg-emerald-500"
      case 'YELLOW':
        return "bg-amber-500"
      case 'RED':
        return "bg-red-500"
      default:
        return "bg-gray-400"
    }
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span 
            className={cn(
              "inline-block rounded-full",
              sizeClasses[size],
              getColor()
            )} 
          />
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="bg-popover text-popover-foreground border shadow-sm"
        >
          {QUALITY_RATING_CONFIG[rating]?.label || "Desconhecida"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
