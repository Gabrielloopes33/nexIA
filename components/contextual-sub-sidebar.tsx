'use client'

import { useSubSidebar } from '@/lib/contexts/sidebar-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OverviewPanel } from '@/components/panels/overview-panel'
import { ConversasPanel } from '@/components/panels/conversas-panel'
import { ContatosPanel } from '@/components/panels/contatos-panel'
import { PipelinePanel } from '@/components/panels/pipeline-panel'

export function ContextualSubSidebar() {
  const { isOpen, activeNavItem, closePanel, sidebarWidth } = useSubSidebar()

  if (!isOpen || !activeNavItem) {
    return null
  }

  const getContextLabel = () => {
    const labels: Record<string, string> = {
      overview: 'AI Insights',
      conversas: 'Conversas',
      contatos: 'Contatos',
      pipeline: 'Pipeline',
      agendamentos: 'Agendamentos',
      canais: 'Canais',
      integracoes: 'Integrações',
      automacoes: 'Automações',
      loja: 'Loja',
      configuracoes: 'Configurações',
    }
    return labels[activeNavItem] || ''
  }

  const renderPanelContent = () => {
    switch (activeNavItem) {
      case 'overview':
        return <OverviewPanel />
      case 'conversas':
        return <ConversasPanel />
      case 'contatos':
        return <ContatosPanel />
      case 'pipeline':
        return <PipelinePanel />
      default:
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Conteúdo em desenvolvimento
            </p>
          </div>
        )
    }
  }

  return (
    <div
      className={cn(
        'sub-sidebar flex h-full w-[180px] flex-shrink-0 flex-col border-r-2 border-border bg-background',
        'animate-in slide-in-from-left-4 duration-200'
      )}
    >
      {/* Header com Search e Botão + */}
      <div className="flex flex-col gap-1.5 border-b-2 border-border p-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {getContextLabel()}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={closePanel}
            className="h-5 w-5 shrink-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar..."
            className="h-7 pl-7 pr-2 text-xs"
          />
        </div>

        <Button
          size="sm"
          className="h-7 w-full bg-gradient-to-br from-[#9795e4] to-[#b3b3e5] text-white hover:opacity-90 text-xs"
        >
          <Plus className="mr-1 h-3 w-3" />
          Novo
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {renderPanelContent()}
      </div>
    </div>
  )
}
