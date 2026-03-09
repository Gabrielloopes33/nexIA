"use client"

import { FileText, Globe, ChevronRight, Trash2, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type { WhatsAppTemplate } from "@/lib/whatsapp/types"
import { TemplateStatusBadge, TemplateCategoryBadge } from "./template-status-badge"
import { TemplatePreview } from "./template-preview"
import { cn } from "@/lib/utils"

interface TemplateCardProps {
  template: WhatsAppTemplate
  onDelete?: (id: string) => void
  onSync?: (id: string) => void
  isSyncing?: boolean
}

export function TemplateCard({ template, onDelete, onSync, isSyncing }: TemplateCardProps) {
  const bodyComponent = template.components.find(c => c.type === 'BODY')
  const headerComponent = template.components.find(c => c.type === 'HEADER')
  const footerComponent = template.components.find(c => c.type === 'FOOTER')
  const buttonsComponent = template.components.find(c => c.type === 'BUTTONS')

  const formatPreview = (text?: string) => {
    if (!text) return ''
    // Replace {{1}}, {{2}} etc with placeholder text
    return text.replace(/\{\{\d+\}\}/g, '___')
  }

  // Truncate text for preview
  const truncateText = (text?: string, maxLength: number = 100) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <Card className="overflow-hidden border-border hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#9795e4]/10">
              <FileText className="h-5 w-5 text-[#9795e4]" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold truncate" title={template.name}>
                {template.name}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <TemplateCategoryBadge category={template.category} />
                <Badge variant="outline" className="h-5 text-[10px]">
                  <Globe className="mr-1 h-3 w-3" />
                  {template.language}
                </Badge>
              </div>
            </div>
          </div>
          <TemplateStatusBadge 
            status={template.status} 
            rejectedReason={template.rejectedReason}
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Preview */}
        <div className="text-sm text-muted-foreground">
          {headerComponent?.text && (
            <p className="font-medium text-foreground truncate">
              {formatPreview(headerComponent.text)}
            </p>
          )}
          {bodyComponent?.text && (
            <p className="mt-1 line-clamp-2">
              {formatPreview(truncateText(bodyComponent.text, 120))}
            </p>
          )}
          {footerComponent?.text && (
            <p className="mt-1 text-xs text-muted-foreground truncate">
              {formatPreview(footerComponent.text)}
            </p>
          )}
          {buttonsComponent && buttonsComponent.buttons && buttonsComponent.buttons.length > 0 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {buttonsComponent.buttons.slice(0, 2).map((button, index) => (
                <Badge key={index} variant="secondary" className="text-[10px]">
                  {button.text}
                </Badge>
              ))}
              {buttonsComponent.buttons.length > 2 && (
                <Badge variant="secondary" className="text-[10px]">
                  +{buttonsComponent.buttons.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Full Preview Collapsible */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-between text-muted-foreground hover:text-foreground h-8"
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Visualizar conteúdo completo
              </span>
              <ChevronRight className="h-4 w-4 transition-transform data-[state=open]:rotate-90" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-3 rounded-lg bg-[#DCF8C6] p-4 text-sm">
              {/* Header */}
              {headerComponent && headerComponent.text && (
                <p className="font-semibold text-[#075E54]">
                  {formatPreview(headerComponent.text)}
                </p>
              )}
              
              {/* Body */}
              {bodyComponent && bodyComponent.text && (
                <p className="mt-2 whitespace-pre-wrap text-[#075E54]">
                  {formatPreview(bodyComponent.text)}
                </p>
              )}
              
              {/* Footer */}
              {footerComponent && footerComponent.text && (
                <p className="mt-2 text-xs text-[#075E54]/70">
                  {formatPreview(footerComponent.text)}
                </p>
              )}
              
              {/* Buttons */}
              {buttonsComponent && buttonsComponent.buttons && buttonsComponent.buttons.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-[#128C7E]/20 pt-3">
                  {buttonsComponent.buttons.map((button, index) => (
                    <div 
                      key={index}
                      className="rounded bg-white/80 px-3 py-2 text-center text-[#34B7F1] font-medium text-sm"
                    >
                      {button.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <TemplatePreview 
              template={template}
              trigger={
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Detalhes
                </Button>
              }
            />
            {onSync && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs gap-1.5"
                onClick={() => onSync(template.id)}
                disabled={isSyncing}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
                Atualizar
              </Button>
            )}
          </div>
          
          {template.status !== 'PENDING' && onDelete && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 gap-1.5"
              onClick={() => onDelete(template.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Excluir
            </Button>
          )}
        </div>

        {/* Compliance Notice for Rejected */}
        {template.status === 'REJECTED' && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            <p className="font-medium">Template Rejeitado</p>
            <p className="mt-1 text-xs">
              Este template não atende às diretrizes da Meta. Revise e recrie conforme necessário.
            </p>
            {template.rejectedReason && (
              <p className="mt-1 text-xs font-medium">
                Motivo: {template.rejectedReason}
              </p>
            )}
          </div>
        )}

        {/* Warning for Flagged */}
        {template.status === 'FLAGGED' && (
          <div className="rounded-md bg-orange-50 p-3 text-sm text-orange-700">
            <p className="font-medium">Template Sinalizado</p>
            <p className="mt-1 text-xs">
              Este template está sendo revisado. Monitore o status.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
