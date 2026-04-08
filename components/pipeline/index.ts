/**
 * Barrel export para componentes de Pipeline
 * 
 * @module components/pipeline
 * @description Exporta todos os componentes relacionados a pipeline
 */

// Componentes existentes
export { PipelineView } from './pipeline-view'
export { PipelineStageManager } from './PipelineStageManager'
export { DealCard } from './DealCard'

// Novos componentes de Multi-Pipeline e Automações
export { PipelineConfigButton } from './PipelineConfigButton'
export { PipelineConfigDrawer } from './PipelineConfigDrawer'
export { PipelineList } from './PipelineList'
export { PipelineCard } from './PipelineCard'
export { AutomationList } from './AutomationList'
export { AutomationCard } from './AutomationCard'
export { StageAutomationIndicator, StageAutomationIcon } from './StageAutomationIndicator'
export { AutomationWizard } from './AutomationWizard'

// Types
export type { PipelineStage } from '@/types/pipeline-config'
