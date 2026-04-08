/**
 * Tipos para Multi-Pipelines e Automações
 * 
 * @module types/pipeline-config
 * @description Tipagens TypeScript para o sistema de configuração de pipelines e automações
 */

// PipelineStage definition (copied from PipelineStageManager to avoid circular deps)
export interface PipelineStage {
  id: string
  name: string
  color: string
  probability: number
  isClosed: boolean
  order: number
  dealsCount?: number
}

// ============================================================================
// Enums
// ============================================================================

/** Tipo de pipeline disponível */
export type PipelineType = 'vendas' | 'follow_up' | 'pos_venda' | 'outro'

/** Tipo de ação de automação */
export type AutomationActionType = 'move' | 'copy' | 'create'

/** Operadores de condição */
export type AutomationOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'greater_than' 
  | 'less_than' 
  | 'contains' 
  | 'not_contains'

/** Campos disponíveis para condições */
export type AutomationConditionField = 
  | 'value' 
  | 'assignee' 
  | 'tags' 
  | 'priority' 
  | 'days_in_stage'
  | 'source'
  | 'custom_field'

// ============================================================================
// Interfaces Principais
// ============================================================================

/**
 * Representa um pipeline completo
 */
export interface Pipeline {
  /** ID único do pipeline */
  id: string
  
  /** Nome exibido do pipeline */
  name: string
  
  /** Cor de identificação (hex) */
  color: string
  
  /** Tipo/categoria do pipeline */
  type: PipelineType
  
  /** Se o pipeline está ativo */
  isActive: boolean
  
  /** Se é o pipeline padrão da organização */
  isDefault: boolean
  
  /** Etapas do pipeline */
  stages: PipelineStage[]
  
  /** ID da organização */
  organizationId: string
  
  /** Contagem de negócios (computed) */
  _count?: {
    deals: number
    automations: number
  }
  
  /** Timestamps */
  createdAt: string
  updatedAt: string
}

/**
 * Dados para criação de pipeline
 */
export interface CreatePipelineInput {
  name: string
  color: string
  type: PipelineType
  isDefault?: boolean
  productId?: string
  stages?: Omit<PipelineStage, 'id' | 'dealsCount'>[]
}

/**
 * Dados para atualização de pipeline
 */
export interface UpdatePipelineInput {
  name?: string
  color?: string
  type?: PipelineType
  isActive?: boolean
  isDefault?: boolean
}

// ============================================================================
// Automações
// ============================================================================

/**
 * Condição de uma automação
 */
export interface AutomationCondition {
  /** ID único da condição (para edição) */
  id?: string
  
  /** Campo a ser avaliado */
  field: AutomationConditionField
  
  /** Operador de comparação */
  operator: AutomationOperator
  
  /** Valor de comparação */
  value: string | number | string[]
  
  /** Conector com próxima condição (AND/OR) */
  logicalOperator?: 'AND' | 'OR'
}

/**
 * Configuração de ação da automação
 */
export interface AutomationAction {
  /** Tipo de ação */
  type: AutomationActionType
  
  /** ID do pipeline de destino */
  targetPipelineId: string
  
  /** ID do estágio de destino */
  targetStageId: string
  
  /** Opções adicionais */
  options?: {
    /** Manter responsável original */
    keepAssignee?: boolean
    /** Copiar tags do negócio */
    copyTags?: boolean
    /** Copiar histórico de mensagens */
    copyHistory?: boolean
    /** Copiar valor do negócio */
    copyValue?: boolean
    /** Copiar descrição */
    copyDescription?: boolean
  }
}

/**
 * Gatilho da automação
 */
export interface AutomationTrigger {
  /** ID do pipeline de origem */
  pipelineId: string
  
  /** ID do estágio de origem */
  stageId: string
}

/**
 * Automação completa
 */
export interface Automation {
  /** ID único da automação */
  id: string
  
  /** Nome opcional da automação */
  name?: string
  
  /** Gatilho (quando executar) */
  trigger: AutomationTrigger
  
  /** Condições adicionais (opcional) */
  conditions?: AutomationCondition[]
  
  /** Ação a ser executada */
  action: AutomationAction
  
  /** Se a automação está ativa */
  isActive: boolean
  
  /** ID da organização */
  organizationId: string
  
  /** Estatísticas */
  executionCount: number
  lastExecutedAt?: string
  lastError?: string
  
  /** Dados expandidos (quando include) */
  triggerPipeline?: Pipeline
  triggerStage?: PipelineStage
  targetPipeline?: Pipeline
  targetStage?: PipelineStage
  
  /** Timestamps */
  createdAt: string
  updatedAt: string
}

/**
 * Dados para criação de automação
 */
export interface CreateAutomationInput {
  name?: string
  trigger: AutomationTrigger
  conditions?: AutomationCondition[]
  action: Omit<AutomationAction, 'options'> & {
    options?: Partial<AutomationAction['options']>
  }
}

/**
 * Dados para atualização de automação
 */
export interface UpdateAutomationInput {
  name?: string
  trigger?: Partial<AutomationTrigger>
  conditions?: AutomationCondition[]
  action?: Partial<Omit<AutomationAction, 'options'>> & {
    options?: Partial<AutomationAction['options']>
  }
  isActive?: boolean
}

// ============================================================================
// Estados e Props de Componentes
// ============================================================================

/**
 * Props do componente PipelineConfigButton
 */
export interface PipelineConfigButtonProps {
  /** Número de automações configuradas */
  automationCount: number
  
  /** Callback ao clicar */
  onClick: () => void
  
  /** Classe CSS adicional */
  className?: string
}

/**
 * Props do componente PipelineCard
 */
export interface PipelineCardProps {
  /** Pipeline a ser exibido */
  pipeline: Pipeline
  
  /** Se é o pipeline selecionado */
  isSelected?: boolean
  
  /** Callback ao clicar no card */
  onClick?: (pipeline: Pipeline) => void
  
  /** Callback ao toggle ativar/desativar */
  onToggle?: (pipeline: Pipeline, isActive: boolean) => void
  
  /** Callback ao definir como padrão */
  onSetDefault?: (pipeline: Pipeline) => void
  
  /** Callback ao editar */
  onEdit?: (pipeline: Pipeline) => void
  
  /** Callback ao excluir */
  onDelete?: (pipeline: Pipeline) => void
  
  /** Se está carregando */
  isLoading?: boolean
}

/**
 * Props do componente AutomationCard
 */
export interface AutomationCardProps {
  /** Automação a ser exibida */
  automation: Automation
  
  /** Callback ao toggle ativar/desativar */
  onToggle: (automation: Automation, isActive: boolean) => void
  
  /** Callback ao editar */
  onEdit: (automation: Automation) => void
  
  /** Callback ao excluir */
  onDelete: (automation: Automation) => void
  
  /** Callback ao duplicar */
  onDuplicate?: (automation: Automation) => void
  
  /** Se está carregando */
  isLoading?: boolean
}

/**
 * Props do Wizard de Automação
 */
export interface AutomationWizardProps {
  /** Se o modal está aberto */
  isOpen: boolean
  
  /** Callback ao fechar */
  onClose: () => void
  
  /** Callback ao salvar */
  onSave: (automation: CreateAutomationInput) => Promise<void>
  
  /** Automação para edição (opcional) */
  automation?: Automation | null
  
  /** Pipelines disponíveis */
  pipelines: Pipeline[]
  
  /** Se está salvando */
  isSaving?: boolean
}

/**
 * Estado de cada step do wizard
 */
export interface AutomationWizardState {
  step: 1 | 2 | 3 | 4
  name?: string
  trigger: Partial<AutomationTrigger>
  conditions: AutomationCondition[]
  action: Partial<AutomationAction> & {
    options?: Partial<AutomationAction['options']>
  }
  isValid: boolean
  errors: Record<string, string>
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Resposta da listagem de pipelines
 */
export interface ListPipelinesResponse {
  pipelines: Pipeline[]
  totalCount: number
  defaultPipelineId: string | null
}

/**
 * Resposta da listagem de automações
 */
export interface ListAutomationsResponse {
  automations: Automation[]
  totalCount: number
  activeCount: number
}

/**
 * Resposta da execução de automação
 */
export interface ExecuteAutomationResponse {
  success: boolean
  automationId: string
  dealId: string
  message: string
  error?: string
}

// ============================================================================
// Constantes
// ============================================================================

/** Cores disponíveis para pipelines */
export const PIPELINE_COLORS = [
  { name: 'Roxo Principal', value: '#46347F' },
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Verde', value: '#10B981' },
  { name: 'Amarelo', value: '#F59E0B' },
  { name: 'Vermelho', value: '#EF4444' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Ciano', value: '#06B6D4' },
  { name: 'Laranja', value: '#F97316' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' },
] as const

/** Labels dos tipos de pipeline */
export const PIPELINE_TYPE_LABELS: Record<PipelineType, string> = {
  vendas: 'Vendas',
  follow_up: 'Follow Up',
  pos_venda: 'Pós-venda',
  outro: 'Outro',
}

/** Labels dos tipos de ação */
export const AUTOMATION_ACTION_LABELS: Record<AutomationActionType, string> = {
  move: 'Mover negócio',
  copy: 'Copiar negócio',
  create: 'Criar novo negócio',
}

/** Labels dos operadores */
export const AUTOMATION_OPERATOR_LABELS: Record<AutomationOperator, string> = {
  equals: 'é igual a',
  not_equals: 'não é igual a',
  greater_than: 'maior que',
  less_than: 'menor que',
  contains: 'contém',
  not_contains: 'não contém',
}

/** Labels dos campos de condição */
export const AUTOMATION_FIELD_LABELS: Record<AutomationConditionField, string> = {
  value: 'Valor do negócio',
  assignee: 'Responsável',
  tags: 'Tags',
  priority: 'Prioridade',
  days_in_stage: 'Dias na etapa',
  source: 'Origem',
  custom_field: 'Campo personalizado',
}

/** Configurações padrão de opções */
export const DEFAULT_AUTOMATION_OPTIONS: NonNullable<AutomationAction['options']> = {
  keepAssignee: true,
  copyTags: true,
  copyHistory: false,
  copyValue: true,
  copyDescription: true,
}

// ============================================================================
// Helpers de Validação
// ============================================================================

/**
 * Valida se uma automação está completa
 */
export function isAutomationComplete(
  state: Partial<AutomationWizardState>
): boolean {
  const hasTrigger = 
    state.trigger?.pipelineId && 
    state.trigger?.stageId
  
  const hasAction = 
    state.action?.type && 
    state.action?.targetPipelineId && 
    state.action?.targetStageId
  
  return Boolean(hasTrigger && hasAction)
}

/**
 * Gera nome automático para automação
 */
export function generateAutomationName(
  triggerStageName: string,
  actionType: AutomationActionType,
  targetPipelineName: string
): string {
  const actionLabel = AUTOMATION_ACTION_LABELS[actionType]
  return `${triggerStageName} → ${actionLabel} para ${targetPipelineName}`
}

/**
 * Verifica se há conflito de automações (loop infinito)
 */
export function hasAutomationLoop(
  automations: Automation[],
  newAutomation: CreateAutomationInput
): boolean {
  // Verifica se a nova automação cria um loop
  const visited = new Set<string>()
  
  function hasLoop(currentPipelineId: string, currentStageId: string): boolean {
    const key = `${currentPipelineId}:${currentStageId}`
    
    if (visited.has(key)) return true
    visited.add(key)
    
    // Verifica se há automação que dispara deste estágio
    const nextAutomation = automations.find(
      a => a.trigger.pipelineId === currentPipelineId && 
           a.trigger.stageId === currentStageId &&
           a.isActive
    )
    
    if (!nextAutomation) return false
    
    return hasLoop(
      nextAutomation.action.targetPipelineId,
      nextAutomation.action.targetStageId
    )
  }
  
  return hasLoop(
    newAutomation.trigger.pipelineId,
    newAutomation.trigger.stageId
  )
}
