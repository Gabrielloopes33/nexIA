'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  Briefcase,
  Building2,
  Heart,
  Layers,
  Loader2,
  Plus,
  ShoppingCart,
  Sparkles,
  Stethoscope,
  Store,
  Zap,
  ChevronRight,
  Check,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

type Category = 'todos' | 'infoprodutos' | 'negocios-fisicos' | 'saude' | 'do-zero'

interface PipelineTemplateStage {
  id: string
  name: string
  position: number
  color: string | null
  probability: number
  isClosed: boolean
  description: string | null
}

interface PipelineTemplate {
  id: string
  name: string
  description: string | null
  category: string
  isDefault: boolean
  stages: PipelineTemplateStage[]
}

interface PipelineTemplateModalProps {
  isOpen: boolean
  onClose: () => void
}

const categoryIcons: Record<string, React.ReactNode> = {
  'infoprodutos': <BookOpen className="size-5" />,
  'negocios-fisicos': <Store className="size-5" />,
  'saude': <Heart className="size-5" />,
}

const categoryLabels: Record<string, string> = {
  'infoprodutos': 'Infoprodutos',
  'negocios-fisicos': 'Negócios Físicos',
  'saude': 'Saúde',
}

export function PipelineTemplateModal({ isOpen, onClose }: PipelineTemplateModalProps) {
  const router = useRouter()
  const [templates, setTemplates] = React.useState<PipelineTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = React.useState<PipelineTemplate | null>(null)
  const [customName, setCustomName] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [isFetching, setIsFetching] = React.useState(true)
  const [activeCategory, setActiveCategory] = React.useState<Category>('todos')

  // Buscar templates da API
  React.useEffect(() => {
    if (isOpen) {
      fetchTemplates()
    }
  }, [isOpen])

  const fetchTemplates = async () => {
    setIsFetching(true)
    try {
      const response = await fetch('/api/pipeline/templates')
      const data = await response.json()
      if (data.success) {
        setTemplates(data.data)
      }
    } catch (error) {
      console.error('Erro ao buscar templates:', error)
    } finally {
      setIsFetching(false)
    }
  }

  const handleSelectTemplate = (template: PipelineTemplate) => {
    setSelectedTemplate(template)
    setCustomName(template.name)
  }

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/pipeline/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          organizationId: 'default_org_id', // TODO: Pegar da context/auth
          customName: customName || selectedTemplate.name,
        }),
      })

      const data = await response.json()

      if (data.success) {
        onClose()
        window.location.reload()
      } else {
        alert(data.error || 'Erro ao aplicar template')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao criar pipeline')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateFromScratch = () => {
    router.push('/pipeline/configure')
    onClose()
  }

  const filteredTemplates = React.useMemo(() => {
    if (activeCategory === 'todos') return templates
    if (activeCategory === 'do-zero') return []
    return templates.filter(t => t.category === activeCategory)
  }, [templates, activeCategory])

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedTemplate(null)
      setCustomName('')
      setActiveCategory('todos')
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl">Escolha um modelo de pipeline</DialogTitle>
          <DialogDescription>
            Selecione uma categoria ou crie do zero
          </DialogDescription>
        </DialogHeader>

        {selectedTemplate ? (
          // Tela de confirmação
          <div className="px-6 pb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTemplate(null)}
              className="mb-4 -ml-2"
            >
              ← Voltar aos modelos
            </Button>

            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#46347F]/10 flex items-center justify-center shrink-0">
                  {categoryIcons[selectedTemplate.category] || <Layers className="size-5 text-[#46347F]" />}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedTemplate.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                  <Badge variant="secondary" className="mt-2">
                    {selectedTemplate.stages.length} etapas
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Nome do pipeline
                </label>
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Ex: Meu Pipeline de Vendas"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Etapas incluídas
                </label>
                <ScrollArea className="h-48 border rounded-lg p-3">
                  <div className="space-y-2">
                    {selectedTemplate.stages.map((stage, idx) => (
                      <div
                        key={stage.id}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span
                          className="w-6 h-6 rounded-full text-xs flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: stage.color || '#6b7280' }}
                        >
                          {idx + 1}
                        </span>
                        <span>{stage.name}</span>
                        {stage.isClosed && (
                          <Badge variant="outline" className="text-xs">Fechamento</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTemplate(null)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleApplyTemplate}
                  disabled={isLoading || !customName.trim()}
                  className="flex-1 bg-[#46347F] hover:bg-[#7b79c4]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 size-4" />
                      Criar Pipeline
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Lista de templates
          <>
            <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as Category)} className="px-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="infoprodutos">Infoprodutos</TabsTrigger>
                <TabsTrigger value="negocios-fisicos">Físicos</TabsTrigger>
                <TabsTrigger value="saude">Saúde</TabsTrigger>
                <TabsTrigger value="do-zero">Do Zero</TabsTrigger>
              </TabsList>
            </Tabs>

            <ScrollArea className="flex-1 px-6 py-4">
              {isFetching ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-8 animate-spin text-[#46347F]" />
                </div>
              ) : activeCategory === 'do-zero' ? (
                <div className="text-center py-8">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Plus className="size-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Criar do Zero</h3>
                  <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                    Crie um pipeline personalizado com suas próprias etapas e regras.
                  </p>
                  <Button 
                    onClick={handleCreateFromScratch}
                    className="bg-[#46347F] hover:bg-[#7b79c4]"
                  >
                    Começar do Zero
                  </Button>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum template encontrado nesta categoria.
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-lg border text-left transition-all",
                        "hover:border-[#46347F]/40 hover:bg-[#46347F]/5"
                      )}
                    >
                      <div className="h-12 w-12 rounded-lg bg-[#46347F]/10 flex items-center justify-center shrink-0">
                        {categoryIcons[template.category] || <Layers className="size-6 text-[#46347F]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{template.name}</h3>
                          {template.isDefault && (
                            <Badge variant="secondary" className="text-xs">Padrão</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-4 mt-3">
                          <Badge variant="outline">
                            {template.stages.length} etapas
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {categoryLabels[template.category] || template.category}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="size-5 text-muted-foreground shrink-0 self-center" />
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
