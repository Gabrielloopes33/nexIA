"use client"

import { useState } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Eye, 
  Copy, 
  Check, 
  FileText, 
  Globe, 
  LayoutTemplate,
  Code,
  MessageSquare,
  Image as ImageIcon,
  Video,
  FileText as DocumentIcon,
  MapPin,
  ExternalLink,
  Phone,
} from "lucide-react"
import type { WhatsAppTemplate, TemplateComponent } from "@/lib/whatsapp/types"
import { TemplateStatusBadge, TemplateCategoryBadge } from "./template-status-badge"
import { cn } from "@/lib/utils"

interface TemplatePreviewProps {
  template: WhatsAppTemplate
  trigger?: React.ReactNode
}

export function TemplatePreview({ template, trigger }: TemplatePreviewProps) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(template.components, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const bodyComponent = template.components.find(c => c.type === 'BODY')
  const headerComponent = template.components.find(c => c.type === 'HEADER')
  const footerComponent = template.components.find(c => c.type === 'FOOTER')
  const buttonsComponent = template.components.find(c => c.type === 'BUTTONS')

  const formatPreviewText = (text?: string) => {
    if (!text) return ''
    // Replace {{1}}, {{2}} etc with styled placeholders
    return text.replace(/\{\{(\d+)\}\}/g, (match, num) => `{{${num}}}`)
  }

  const getHeaderIcon = (format?: string) => {
    switch (format) {
      case 'IMAGE': return <ImageIcon className="h-4 w-4" />
      case 'VIDEO': return <Video className="h-4 w-4" />
      case 'DOCUMENT': return <DocumentIcon className="h-4 w-4" />
      case 'LOCATION': return <MapPin className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getButtonIcon = (type: string) => {
    switch (type) {
      case 'URL': return <ExternalLink className="h-3.5 w-3.5" />
      case 'PHONE_NUMBER': return <Phone className="h-3.5 w-3.5" />
      default: return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <LayoutTemplate className="h-5 w-5 text-[#46347F]" />
                {template.name}
              </DialogTitle>
              <DialogDescription className="mt-1.5">
                Detalhes e preview do template
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <TemplateStatusBadge status={template.status} size="sm" />
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="preview" className="flex-1">
          <div className="px-6 border-b">
            <TabsList className="bg-transparent p-0 h-12 w-full justify-start gap-6 rounded-none">
              <TabsTrigger 
                value="preview" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#46347F] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 gap-2"
              >
                <Eye className="h-4 w-4" />
                Visual
              </TabsTrigger>
              <TabsTrigger 
                value="json"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#46347F] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 gap-2"
              >
                <Code className="h-4 w-4" />
                JSON
              </TabsTrigger>
              <TabsTrigger 
                value="details"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#46347F] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 gap-2"
              >
                <FileText className="h-4 w-4" />
                Detalhes
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[400px]">
            <TabsContent value="preview" className="mt-0 p-6">
              {/* WhatsApp Preview Card */}
              <div className="flex justify-center">
                <div className="w-full max-w-sm bg-[#ECE5DD] rounded-lg p-4 shadow-lg">
                  {/* WhatsApp Header */}
                  <div className="bg-[#075E54] text-white px-3 py-2 rounded-t-lg flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">WhatsApp Business</p>
                      <p className="text-xs text-white/70">Preview</p>
                    </div>
                  </div>

                  {/* Message Bubble */}
                  <div className="bg-white p-3 rounded-b-lg rounded-tr-lg shadow-sm mt-1">
                    {/* Header */}
                    {headerComponent && (
                      <div className="mb-2">
                        {headerComponent.format === 'IMAGE' && (
                          <div className="bg-gray-100 rounded-lg h-32 flex items-center justify-center mb-2">
                            <ImageIcon className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        {headerComponent.format === 'VIDEO' && (
                          <div className="bg-gray-100 rounded-lg h-32 flex items-center justify-center mb-2">
                            <Video className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        {headerComponent.format === 'DOCUMENT' && (
                          <div className="bg-gray-100 rounded-lg h-24 flex items-center justify-center mb-2">
                            <DocumentIcon className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        {headerComponent.format === 'TEXT' && headerComponent.text && (
                          <p className="font-semibold text-gray-900 text-sm">
                            {formatPreviewText(headerComponent.text)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Body */}
                    {bodyComponent && bodyComponent.text && (
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {formatPreviewText(bodyComponent.text)}
                      </p>
                    )}

                    {/* Footer */}
                    {footerComponent && footerComponent.text && (
                      <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                        {formatPreviewText(footerComponent.text)}
                      </p>
                    )}

                    {/* Time */}
                    <p className="text-[10px] text-gray-400 text-right mt-1">
                      {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Buttons */}
                  {buttonsComponent && buttonsComponent.buttons && buttonsComponent.buttons.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {buttonsComponent.buttons.map((button, index) => (
                        <div 
                          key={index}
                          className="bg-white rounded-lg py-2.5 px-4 text-center shadow-sm"
                        >
                          <span className="text-[#34B7F1] text-sm font-medium flex items-center justify-center gap-2">
                            {getButtonIcon(button.type)}
                            {button.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="json" className="mt-0">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-4 right-4 gap-2 z-10"
                  onClick={handleCopyJson}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar
                    </>
                  )}
                </Button>
                <pre className="bg-slate-950 text-slate-50 p-6 rounded-none text-xs overflow-auto font-mono leading-relaxed">
                  {JSON.stringify(template.components, null, 2)}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="details" className="mt-0 p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{template.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">ID</p>
                  <p className="font-medium text-xs font-mono">{template.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Categoria</p>
                  <TemplateCategoryBadge category={template.category} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Idioma</p>
                  <Badge variant="outline" className="gap-1">
                    <Globe className="h-3 w-3" />
                    {template.language}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <TemplateStatusBadge status={template.status} size="sm" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Criado em</p>
                  <p className="font-medium">
                    {new Date(template.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              {template.rejectedReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-800">Motivo da Rejeição</p>
                  <p className="text-sm text-red-600 mt-1">{template.rejectedReason}</p>
                </div>
              )}

              {/* Componentes */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Componentes</p>
                <div className="space-y-2">
                  {template.components.map((component, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        component.type === 'HEADER' && "bg-blue-100 text-blue-600",
                        component.type === 'BODY' && "bg-green-100 text-green-600",
                        component.type === 'FOOTER' && "bg-gray-100 text-gray-600",
                        component.type === 'BUTTONS' && "bg-purple-100 text-purple-600",
                      )}>
                        {component.type === 'HEADER' && getHeaderIcon(component.format)}
                        {component.type === 'BODY' && <MessageSquare className="h-4 w-4" />}
                        {component.type === 'FOOTER' && <FileText className="h-4 w-4" />}
                        {component.type === 'BUTTONS' && <LayoutTemplate className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{component.type}</p>
                        {component.format && (
                          <p className="text-xs text-muted-foreground">Formato: {component.format}</p>
                        )}
                        {component.buttons && (
                          <p className="text-xs text-muted-foreground">
                            {component.buttons.length} botão(ões)
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
