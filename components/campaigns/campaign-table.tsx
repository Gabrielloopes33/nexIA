"use client"

import { useState } from 'react'
import { Megaphone, Send, Trash2, Eye, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CampaignStatusBadge } from './campaign-status-badge'
import { TagBadge } from '@/components/ui/tag-badge'
import type { Campaign } from '@/hooks/use-campaigns'
import type { TagColor } from '@/lib/types/tag'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useRouter } from 'next/navigation'

interface Props {
  campaigns: Campaign[]
  onSend: (id: string) => Promise<any>
  onDelete: (id: string) => Promise<boolean>
}

export function CampaignTable({ campaigns, onSend, onDelete }: Props) {
  const router = useRouter()
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSend = async (id: string) => {
    setSendingId(id)
    await onSend(id)
    setSendingId(null)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    await onDelete(deleteId)
    setIsDeleting(false)
    setDeleteId(null)
  }

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#46347F]/10 mb-4">
          <Megaphone className="h-7 w-7 text-[#46347F]" />
        </div>
        <h3 className="text-base font-semibold">Nenhuma campanha ainda</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Crie sua primeira campanha para disparar mensagens em massa via WhatsApp.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tag</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Template</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Total</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Enviados</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Falhas</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Criada em</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{campaign.name}</td>
                <td className="px-4 py-3">
                  {campaign.tag ? (
                    <TagBadge name={campaign.tag.name} color={campaign.tag.color as TagColor} size="sm" />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{campaign.templateName}</td>
                <td className="px-4 py-3 text-center">{campaign.totalContacts}</td>
                <td className="px-4 py-3 text-center text-green-600 font-medium">{campaign.sentCount}</td>
                <td className="px-4 py-3 text-center text-red-500 font-medium">{campaign.failedCount}</td>
                <td className="px-4 py-3">
                  <CampaignStatusBadge status={campaign.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {new Date(campaign.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => router.push(`/campanhas/${campaign.id}`)}
                      title="Ver detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {campaign.status === 'DRAFT' && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[#46347F] hover:text-[#46347F] hover:bg-[#46347F]/10"
                          onClick={() => handleSend(campaign.id)}
                          disabled={sendingId === campaign.id}
                          title="Disparar campanha"
                        >
                          {sendingId === campaign.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteId(campaign.id)}
                          title="Excluir campanha"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir campanha?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A campanha e todos os seus contatos serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
