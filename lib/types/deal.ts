export interface Deal {
  id: number
  titulo: string
  empresa: string
  valor: number
  avatar: string
  responsavel?: string
  email?: string
  telefone?: string
  prioridade: "alta" | "media" | "baixa"
  dias: number
  stage: string
  stageLabel?: string
  tags?: string[]
  criadoEm?: string
  atualizadoEm?: string
}

export interface PipelineStageConfig {
  key: string
  label: string
  color: string
  bgColor: string
  borderColor: string
}

export interface Pipeline {
  id: string
  label: string
  stages: PipelineStageConfig[]
  deals: Deal[]
}
