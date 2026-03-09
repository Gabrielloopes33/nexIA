"use client"

import { useState, useMemo } from 'react'
import { FileText, Send, Loader2, Check, Globe } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { WhatsAppTemplate, TemplateComponent } from '@/lib/whatsapp/types'
import { cn } from '@/lib/utils'

interface TemplateMessageTabProps {
  templates: WhatsAppTemplate[]
  selectedTemplateId: string
  onTemplateChange: (templateId: string) => void
  onSend: () => void
  isLoading: boolean
  disabled: boolean
}

// Extract variables from template text like {{1}}, {{2}}, etc.
function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{\d+\}\}/g)
  return matches ? [...new Set(matches)] : []
}

// Replace variables in text with actual values
function replaceVariables(text: string, variables: Record<string, string>): string {
  let result = text
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `{{${key}}}`)
  })
  return result
}

export function TemplateMessageTab({
  templates,
  selectedTemplateId,
  onTemplateChange,
  onSend,
  isLoading,
  disabled,
}: TemplateMessageTabProps) {
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})

  // Get selected template
  const selectedTemplate = useMemo(() => {
    return templates.find(t => t.id === selectedTemplateId)
  }, [templates, selectedTemplateId])

  // Extract all variables from template
  const templateVariables = useMemo(() => {
    if (!selectedTemplate) return []
    
    const allVariables: string[] = []
    selectedTemplate.components.forEach((component: TemplateComponent) => {
      if (component.text) {
        const vars = extractVariables(component.text)
        allVariables.push(...vars)
      }
    })
    return [...new Set(allVariables)].sort()
  }, [selectedTemplate])

  // Filter only approved templates
  const approvedTemplates = useMemo(() => {
    return templates.filter(t => t.status === 'APPROVED')
  }, [templates])

  // Handle variable change
  const handleVariableChange = (variable: string, value: string) => {
    // Remove {{ and }} to get just the number
    const varKey = variable.replace(/[{}]/g, '')
    setVariableValues(prev => ({ ...prev, [varKey]: value }))
  }

  // Get component preview text
  const getComponentPreview = (component: TemplateComponent): string | null => {
    if (!component.text) return null
    return replaceVariables(component.text, variableValues)
  }

  // Get header, body, footer components
  const headerComponent = selectedTemplate?.components.find(c => c.type === 'HEADER')
  const bodyComponent = selectedTemplate?.components.find(c => c.type === 'BODY')
  const footerComponent = selectedTemplate?.components.find(c => c.type === 'FOOTER')
  const buttonsComponent = selectedTemplate?.components.find(c => c.type === 'BUTTONS')

  return (
    <div className="space-y-4">
      {/* Template Select */}
      <div className="space-y-2">
        <Label htmlFor="template-select">Template Aprovado</Label>
        <Select
          value={selectedTemplateId}
          onValueChange={onTemplateChange}
          disabled={disabled || isLoading}
        >
          <SelectTrigger id="template-select">
            <SelectValue placeholder={
              approvedTemplates.length === 0 
                ? "Nenhum template aprovado disponível" 
                : "Selecione um template"
            } />
          </SelectTrigger>
          <SelectContent>
            {approvedTemplates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-500" />
                  <span className="truncate">{template.name}</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded border ml-2",
                    "border-muted-foreground/30 text-muted-foreground"
                  )}>
                    <Globe className="inline mr-1 h-3 w-3" />
                    {template.language}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {approvedTemplates.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Sincronize os templates na página de Templates para vê-los aqui.
          </p>
        )}
      </div>

      {/* Variables Input */}
      {selectedTemplate && templateVariables.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="p-4 space-y-3">
            <Label className="text-sm font-medium">Variáveis do Template</Label>
            <div className="grid gap-3">
              {templateVariables.map((variable) => {
                const varKey = variable.replace(/[{}]/g, '')
                return (
                  <div key={variable} className="space-y-1">
                    <Label htmlFor={`var-${varKey}`} className="text-xs text-muted-foreground">
                      {variable}
                    </Label>
                    <Input
                      id={`var-${varKey}`}
                      placeholder={`Valor para ${variable}`}
                      value={variableValues[varKey] || ''}
                      onChange={(e) => handleVariableChange(variable, e.target.value)}
                      disabled={isLoading}
                      className="h-8"
                    />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template Preview */}
      {selectedTemplate && (
        <Card className="border-[#25D366]/30 bg-[#f0f2f5]">
          <CardContent className="p-4">
            <div className="max-w-[80%] ml-auto">
              <div className="bg-[#DCF8C6] rounded-lg rounded-tr-sm p-3 shadow-sm space-y-2">
                {/* Header */}
                {headerComponent && getComponentPreview(headerComponent) && (
                  <p className="font-semibold text-[#075E54]">
                    {getComponentPreview(headerComponent)}
                  </p>
                )}
                
                {/* Body */}
                {bodyComponent && getComponentPreview(bodyComponent) && (
                  <p className="text-sm text-[#075E54] whitespace-pre-wrap">
                    {getComponentPreview(bodyComponent)}
                  </p>
                )}
                
                {/* Footer */}
                {footerComponent && getComponentPreview(footerComponent) && (
                  <p className="text-xs text-[#075E54]/70">
                    {getComponentPreview(footerComponent)}
                  </p>
                )}
                
                {/* Buttons Preview */}
                {buttonsComponent && buttonsComponent.buttons && buttonsComponent.buttons.length > 0 && (
                  <div className="mt-2 space-y-1 border-t border-[#128C7E]/20 pt-2">
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
                
                {/* Timestamp and Status */}
                <div className="flex items-center justify-end gap-1">
                  <span className="text-[10px] text-[#075E54]/60">
                    {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <svg className="w-3 h-3 text-[#53bdeb]" viewBox="0 0 16 15" fill="currentColor">
                    <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>
                  </svg>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template Info */}
      {selectedTemplate && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {selectedTemplate.name}
          </span>
          <span className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {selectedTemplate.language}
          </span>
        </div>
      )}

      {/* Send Button */}
      <Button
        onClick={onSend}
        disabled={disabled || isLoading || !selectedTemplateId}
        className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Enviar Template
          </>
        )}
      </Button>

      {/* Info Notice */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
        <p className="text-xs text-blue-800">
          <strong>Templates:</strong> Podem ser enviados a qualquer momento, mesmo fora da janela de 24h. 
          Apenas templates com status &quot;APPROVED&quot; podem ser utilizados.
        </p>
      </div>
    </div>
  )
}
