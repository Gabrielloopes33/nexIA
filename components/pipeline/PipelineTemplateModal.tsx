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

type Category = 'todos' | 'infoprodutos' | 'negocios-fisicos' | 'saude' | 'do-zero'

interface PipelineStage {
  id: string
  name: string
}

interface PipelineTemplate {
  id: string
  name: string
  description: string
  category: Exclude<Category, 'todos' | 'do-zero'>
  stages: PipelineStage[]
  icon: React.ReactNode
}

const pipelineTemplates: PipelineTemplate[] = [
  {
    id: 'lancamento-infoproduto',
    name: 'Lançamento de Infoproduto',
    description: 'Pipeline completo para lançamento de cursos e produtos digitais',
    category: 'infoprodutos',
    icon: <Sparkles className="size-5" />,
    stages: [
      { id: '1', name: 'Pré-lançamento' },
      { id: '2', name: 'Aquecimento' },
      { id: '3', name: 'Evento de Abertura' },
      { id: '4', name: 'Cart Aberto' },
      { id: '5', name: 'Follow-up' },
      { id: '6', name: 'Recuperação' },
      { id: '7', name: 'Pós-venda' },
      { id: '8', name: 'Entrega' },
      { id: '9', name: 'Up-sell' },
      { id: '10', name: 'Fidelização' },
    ],
  },
  {
    id: 'venda-consultoria',
    name: 'Venda de Consultoria',
    description: 'Processo de vendas para serviços de consultoria e mentoria',
    category: 'infoprodutos',
    icon: <Briefcase className="size-5" />,
    stages: [
      { id: '1', name: 'Lead Capturado' },
      { id: '2', name: 'Qualificação' },
      { id: '3', name: 'Diagnóstico' },
      { id: '4', name: 'Proposta Enviada' },
      { id: '5', name: 'Negociação' },
      { id: '6', name: 'Fechamento' },
      { id: '7', name: 'Onboarding' },
      { id: '8', name: 'Entrega' },
    ],
  },
  {
    id: 'ecommerce-vendas',
    name: 'E-commerce de Vendas',
    description: 'Pipeline para lojas virtuais e vendas online',
    category: 'negocios-fisicos',
    icon: <ShoppingCart className="size-5" />,
    stages: [
      { id: '1', name: 'Carrinho Abandonado' },
      { id: '2', name: 'Pedido Realizado' },
      { id: '3', name: 'Pagamento Confirmado' },
      { id: '4', name: 'Preparação' },
      { id: '5', name: 'Envio' },
      { id: '6', name: 'Em Trânsito' },
      { id: '7', name: 'Entregue' },
      { id: '8', name: 'Pós-venda' },
    ],
  },
  {
    id: 'imobiliaria',
    name: 'Imobiliária',
    description: 'Processo de vendas para corretores e imobiliárias',
    category: 'negocios-fisicos',
    icon: <Building2 className="size-5" />,
    stages: [
      { id: '1', name: 'Captação de Lead' },
      { id: '2', name: 'Qualificação' },
      { id: '3', name: 'Agendamento de Visita' },
      { id: '4', name: 'Visita Realizada' },
      { id: '5', name: 'Proposta' },
      { id: '6', name: 'Negociação' },
      { id: '7', name: 'Contrato' },
      { id: '8', name: 'Fechamento' },
    ],
  },
  {
    id: 'clinica-estetica',
    name: 'Clínica de Estética',
    description: 'Pipeline para clínicas de estética e bem-estar',
    category: 'saude',
    icon: <Heart className="size-5" />,
    stages: [
      { id: '1', name: 'Agendamento' },
      { id: '2', name: 'Confirmação' },
      { id: '3', name: 'Check-in' },
      { id: '4', name: 'Atendimento' },
      { id: '5', name: 'Pós-procedimento' },
      { id: '6', name: 'Retorno' },
      { id: '7', name: 'Fidelização' },
    ],
  },
  {
    id: 'nutricao',
    name: 'Consultório de Nutrição',
    description: 'Processo para nutricionistas e consultórios',
    category: 'saude',
    icon: <Stethoscope className="size-5" />,
    stages: [
      { id: '1', name: 'Primeiro Contato' },
      { id: '2', name: 'Triagem' },
      { id: '3', name: 'Agendamento' },
      { id: '4', name: 'Avaliação Inicial' },
      { id: '5', name: 'Plano Alimentar' },
      { id: '6', name: 'Acompanhamento' },
      { id: '7', name: 'Retorno' },
      { id: '8', name: 'Resultados' },
    ],
  },
]

const categoryLabels: Record<Category, string> = {
  todos: 'Todos',
  infoprodutos: 'Infoprodutos',
  'negocios-fisicos': 'Negócios Físicos',
  saude: 'Saúde',
  'do-zero': 'Do Zero',
}

interface PipelineTemplateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PipelineTemplateModal({
  open,
  onOpenChange,
}: PipelineTemplateModalProps) {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = React.useState<Category>('todos')
  const [selectedTemplate, setSelectedTemplate] =
    React.useState<PipelineTemplate | null>(null)
  const [pipelineName, setPipelineName] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [blankPipelineName, setBlankPipelineName] = React.useState('')

  const filteredTemplates = React.useMemo(() => {
    if (activeCategory === 'todos') return pipelineTemplates
    return pipelineTemplates.filter((t) => t.category === activeCategory)
  }, [activeCategory])

  const handleUseTemplate = async () => {
    if (!selectedTemplate || !pipelineName.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/pipeline/templates/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          name: pipelineName.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao criar pipeline')
      }

      onOpenChange(false)
      window.location.reload()
    } catch (error) {
      console.error('Erro ao aplicar template:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBlank = () => {
    if (!blankPipelineName.trim()) return

    // Redirecionar para tela de configuração de etapas com o nome
    router.push(
      `/pipeline/configure?name=${encodeURIComponent(blankPipelineName.trim())}`,
    )
  }

  const handleClose = () => {
    setSelectedTemplate(null)
    setPipelineName('')
    setBlankPipelineName('')
    setActiveCategory('todos')
    onOpenChange(false)
  }

  const getCategoryIcon = (category: Category) => {
    switch (category) {
      case 'infoprodutos':
        return <BookOpen className="size-4" />
      case 'negocios-fisicos':
        return <Store className="size-4" />
      case 'saude':
        return <Heart className="size-4" />
      case 'do-zero':
        return <Plus className="size-4" />
      default:
        return <Layers className="size-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold">
            Escolha um modelo de pipeline
          </DialogTitle>
          <DialogDescription>
            Selecione uma categoria ou crie do zero
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeCategory}
          onValueChange={(value) => setActiveCategory(value as Category)}
          className="w-full"
        >
          <div className="px-6 py-4 border-b">
            <TabsList className="w-full justify-start gap-1 bg-transparent p-0 h-auto flex-wrap">
              {(Object.keys(categoryLabels) as Category[]).map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="data-[state=active]:bg-[#46347F] data-[state=active]:text-white data-[state=active]:shadow-none gap-2 px-4 py-2 rounded-full border border-transparent data-[state=active]:border-[#46347F] transition-all"
                >
                  {getCategoryIcon(category)}
                  {categoryLabels[category]}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="do-zero" className="mt-0">
            <ScrollArea className="h-[400px]">
              <div className="p-6">
                <div className="border rounded-xl p-8 text-center hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 rounded-full bg-[#46347F]/10 flex items-center justify-center mx-auto mb-4">
                    <Plus className="size-8 text-[#46347F]" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Criar Pipeline em Branco
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Comece do zero e configure cada etapa do seu pipeline
                    conforme sua necessidade específica.
                  </p>
                  <div className="max-w-sm mx-auto space-y-4">
                    <Input
                      placeholder="Digite o nome do pipeline"
                      value={blankPipelineName}
                      onChange={(e) => setBlankPipelineName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateBlank()
                      }}
                    />
                    <Button
                      onClick={handleCreateBlank}
                      disabled={!blankPipelineName.trim()}
                      className="w-full bg-[#46347F] hover:bg-[#7b79c4] text-white"
                    >
                      Criar pipeline em branco
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="todos" className="mt-0">
            <ScrollArea className="h-[400px]">
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={() => {
                      setSelectedTemplate(template)
                      setPipelineName(template.name)
                    }}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="infoprodutos" className="mt-0">
            <ScrollArea className="h-[400px]">
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={() => {
                      setSelectedTemplate(template)
                      setPipelineName(template.name)
                    }}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="negocios-fisicos" className="mt-0">
            <ScrollArea className="h-[400px]">
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={() => {
                      setSelectedTemplate(template)
                      setPipelineName(template.name)
                    }}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="saude" className="mt-0">
            <ScrollArea className="h-[400px]">
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={() => {
                      setSelectedTemplate(template)
                      setPipelineName(template.name)
                    }}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Confirmação de Template */}
        {selectedTemplate && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="bg-background border rounded-xl p-6 max-w-md w-full shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-[#46347F]/10 flex items-center justify-center text-[#46347F]">
                  {selectedTemplate.icon}
                </div>
                <div>
                  <h3 className="font-semibold">Usar este modelo?</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplate.name}
                  </p>
                </div>
              </div>

              <div className="mb-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {selectedTemplate.description}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary">
                    {selectedTemplate.stages.length} etapas
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Nome personalizado do pipeline
                  </label>
                  <Input
                    value={pipelineName}
                    onChange={(e) => setPipelineName(e.target.value)}
                    placeholder="Digite o nome do pipeline"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUseTemplate()
                    }}
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedTemplate(null)
                      setPipelineName('')
                    }}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleUseTemplate}
                    disabled={!pipelineName.trim() || isLoading}
                    className="flex-1 bg-[#46347F] hover:bg-[#7b79c4] text-white"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      'Usar este modelo'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface TemplateCardProps {
  template: PipelineTemplate
  onSelect: () => void
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow group">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-[#46347F]/10 flex items-center justify-center text-[#46347F] shrink-0 group-hover:bg-[#46347F] group-hover:text-white transition-colors">
          {template.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">{template.name}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {template.description}
          </p>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <Badge
            variant="secondary"
            className="text-xs bg-[#46347F]/10 text-[#46347F] hover:bg-[#46347F]/20"
          >
            {template.stages.length} etapas
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Etapas:</span>{' '}
          {template.stages.map((s) => s.name).join(', ')}
        </div>
      </div>

      <Button
        onClick={onSelect}
        className="w-full bg-[#46347F] hover:bg-[#7b79c4] text-white"
        size="sm"
      >
        Usar este modelo
      </Button>
    </div>
  )
}

// Hook e botão para abrir o modal
export function usePipelineTemplateModal() {
  const [isOpen, setIsOpen] = React.useState(false)

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    setIsOpen,
  }
}

// Botão "Novo Pipeline" que abre o modal
interface NewPipelineButtonProps {
  className?: string
}

export function NewPipelineButton({ className }: NewPipelineButtonProps) {
  const { isOpen, open, close } = usePipelineTemplateModal()

  return (
    <>
      <Button
        onClick={open}
        className={`bg-[#46347F] hover:bg-[#7b79c4] text-white ${className || ''}`}
      >
        <Plus className="size-4 mr-2" />
        Novo Pipeline
      </Button>
      <PipelineTemplateModal open={isOpen} onOpenChange={close} />
    </>
  )
}
