import { Badge } from '@/components/ui/badge'
import type { CampaignStatus } from '@/hooks/use-campaigns'

const CONFIG: Record<CampaignStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Rascunho', className: 'bg-gray-100 text-gray-700 border-gray-200' },
  RUNNING: { label: 'Disparando...', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  COMPLETED: { label: 'Concluída', className: 'bg-green-100 text-green-700 border-green-200' },
  FAILED: { label: 'Falhou', className: 'bg-red-100 text-red-700 border-red-200' },
  CANCELLED: { label: 'Cancelada', className: 'bg-gray-100 text-gray-500 border-gray-200' },
}

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const config = CONFIG[status] || CONFIG.DRAFT
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
