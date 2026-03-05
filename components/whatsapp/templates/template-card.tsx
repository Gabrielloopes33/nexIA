"use client"

import { FileText, Clock, Globe, ChevronRight } from "lucide-react"
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
import { cn } from "@/lib/utils"

interface TemplateCardProps {
  template: WhatsAppTemplate
  onDelete?: (id: string) => void
}

export function TemplateCard({ template, onDelete }: TemplateCardProps) {
  const bodyComponent = template.components.find(c => c.type === 'BODY')
  const headerComponent = template.components.find(c => c.type === 'HEADER')
  const footerComponent = template.components.find(c => c.type === 'FOOTER')
  const buttonsComponent = template.components.find(c => c.type === 'BUTTONS')

  const formatPreview = (text: string) => {
    // Replace {{1}}, {{2}} etc with placeholder text
    return text.replace(/\{\{\d+\}\}/g, '___')
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">{template.name}</h3>
              <div className="flex items-center gap-2 mt-1">
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
        {/* Template Preview */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-between text-muted-foreground hover:text-foreground"
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Visualizar conteúdo
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

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Criado em: {new Date(template.createdAt).toLocaleDateString('pt-BR')}
            </span>
            {template.allowCategoryChange && (
              <Badge variant="outline" className="h-5 text-[10px]">
                Alteração de categoria permitida
              </Badge>
            )}
          </div>
          
          {template.status !== 'PENDING' && onDelete && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => onDelete(template.id)}
            >
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
