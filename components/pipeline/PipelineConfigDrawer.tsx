/**
 * Modal de Configuração de Pipelines e Automações
 * 
 * @module components/pipeline/PipelineConfigDrawer
 * @description Modal centralizado com abas para gerenciar pipelines e automações
 */

'use client'

import { useState } from 'react'
import { FolderGit2, Workflow } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { PipelineList } from './PipelineList'
import { AutomationList } from './AutomationList'
import { Pipeline, Automation } from '@/types/pipeline-config'

interface PipelineConfigDrawerProps {
  /** Se o modal está aberto */
  isOpen: boolean
  
  /** Callback ao fechar */
  onClose: () => void
  
  /** Pipelines da organização */
  pipelines: Pipeline[]
  
  /** Automações da organização */
  automations: Automation[]
  
  /** Callbacks para ações */
  onCreatePipeline: () => void
  onEditPipeline: (pipeline: Pipeline) => void
  onDeletePipeline: (pipeline: Pipeline) => void
  onTogglePipeline: (pipeline: Pipeline, isActive: boolean) => void
  onSetDefaultPipeline: (pipeline: Pipeline) => void
  
  onCreateAutomation: () => void
  onEditAutomation: (automation: Automation) => void
  onDeleteAutomation: (automation: Automation) => void
  onToggleAutomation: (automation: Automation, isActive: boolean) => void
  onDuplicateAutomation: (automation: Automation) => void
  
  /** Estados de loading */
  isLoadingPipelines?: boolean
  isLoadingAutomations?: boolean
  
  /** ID da organização */
  organizationId: string
}

/**
 * Modal principal de configuração
 * 
 * @example
 * ```tsx
 * <PipelineConfigDrawer
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   pipelines={pipelines}
 *   automations={automations}
 *   onCreatePipeline={() => setShowPipelineModal(true)}
 *   onCreateAutomation={() => setShowAutomationWizard(true)}
 *   {...outrosCallbacks}
 * />
 * ```
 */
export function PipelineConfigDrawer({
  isOpen,
  onClose,
  pipelines = [],
  automations = [],
  onCreatePipeline,
  onEditPipeline,
  onDeletePipeline,
  onTogglePipeline,
  onSetDefaultPipeline,
  onCreateAutomation,
  onEditAutomation,
  onDeleteAutomation,
  onToggleAutomation,
  onDuplicateAutomation,
  isLoadingPipelines = false,
  isLoadingAutomations = false,
  organizationId,
}: PipelineConfigDrawerProps) {
  const [activeTab, setActiveTab] = useState<'pipelines' | 'automations'>('pipelines')
  
  // Contagens para as abas
  const pipelineCount = pipelines.length
  const automationCount = automations.length
  const activeAutomationCount = automations.filter(a => a.isActive).length
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl w-full max-h-[85vh] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="border-b pb-4 px-6 pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FolderGit2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                Configurações
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Gerencie pipelines e automações
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'pipelines' | 'automations')}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-2 mx-6 mt-4 w-auto">
            <TabsTrigger value="pipelines" className="gap-2">
              <FolderGit2 className="h-4 w-4" />
              <span className="hidden sm:inline">Pipelines</span>
              <span className="sm:hidden">Pipes</span>
              {pipelineCount > 0 && (
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                  {pipelineCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="automations" className="gap-2">
              <Workflow className="h-4 w-4" />
              <span className="hidden sm:inline">Automações</span>
              <span className="sm:hidden">Auto</span>
              {automationCount > 0 && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  activeAutomationCount > 0 
                    ? "bg-amber-100 text-amber-700" 
                    : "bg-muted"
                )}>
                  {automationCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          {/* Conteúdo: Pipelines */}
          <TabsContent 
            value="pipelines" 
            className="flex-1 overflow-y-auto px-6 py-4 m-0"
          >
            <PipelineList
              pipelines={pipelines}
              onCreate={onCreatePipeline}
              onEdit={onEditPipeline}
              onDelete={onDeletePipeline}
              onToggle={onTogglePipeline}
              onSetDefault={onSetDefaultPipeline}
              isLoading={isLoadingPipelines}
            />
          </TabsContent>
          
          {/* Conteúdo: Automações */}
          <TabsContent 
            value="automations" 
            className="flex-1 overflow-y-auto px-6 py-4 m-0"
          >
            <AutomationList
              automations={automations}
              pipelines={pipelines}
              onCreate={onCreateAutomation}
              onEdit={onEditAutomation}
              onDelete={onDeleteAutomation}
              onToggle={onToggleAutomation}
              onDuplicate={onDuplicateAutomation}
              isLoading={isLoadingAutomations}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default PipelineConfigDrawer
