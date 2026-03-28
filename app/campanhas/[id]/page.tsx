"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Megaphone, Send, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { Sidebar } from '@/components/sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CampaignStatusBadge } from '@/components/campaigns/campaign-status-badge'
import { useCampaigns, type Campaign, type CampaignContact } from '@/hooks/use-campaigns'
import { Skeleton } from '@/components/ui/skeleton'

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { sendCampaign } = useCampaigns()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [contacts, setContacts] = useState<CampaignContact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    fetch(`/api/campaigns/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setCampaign(data.data)
          setContacts(data.data.contacts || [])
        }
      })
      .finally(() => setIsLoading(false))
  }, [id])

  const handleSend = async () => {
    if (!campaign) return
    setIsSending(true)
    await sendCampaign(campaign.id)
    // Refresh
    const res = await fetch(`/api/campaigns/${id}`)
    const data = await res.json()
    if (data.success) {
      setCampaign(data.data)
      setContacts(data.data.contacts || [])
    }
    setIsSending(false)
  }

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Campanha não encontrada.</p>
            <Button variant="link" onClick={() => router.push('/campanhas')}>Voltar</Button>
          </div>
        </main>
      </div>
    )
  }

  const successRate = campaign.totalContacts > 0
    ? Math.round((campaign.sentCount / campaign.totalContacts) * 100)
    : 0

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-5xl mx-auto space-y-6">
          {/* Breadcrumb + Header */}
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Link href="/campanhas" className="hover:text-[#46347F] transition-colors">Campanhas</Link>
              <span>/</span>
              <span>{campaign.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#46347F]/10">
                  <Megaphone className="h-5 w-5 text-[#46347F]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold">{campaign.name}</h1>
                    <CampaignStatusBadge status={campaign.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">Template: {campaign.templateName} ({campaign.templateLanguage})</p>
                </div>
              </div>
              {campaign.status === 'DRAFT' && (
                <Button
                  onClick={handleSend}
                  disabled={isSending}
                  className="bg-[#46347F] hover:bg-[#3a2c6b]"
                >
                  {isSending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Disparando...</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" />Disparar Agora</>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total', value: campaign.totalContacts, icon: Megaphone, color: 'text-[#46347F]', bg: 'bg-[#46347F]/10' },
              { label: 'Enviados', value: campaign.sentCount, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Falhas', value: campaign.failedCount, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
              { label: 'Pendentes', value: campaign.pendingCount, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <Card key={label}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{label}</p>
                      <p className="text-2xl font-bold mt-1">{value}</p>
                    </div>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${bg}`}>
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                  </div>
                  {label === 'Enviados' && campaign.totalContacts > 0 && (
                    <div className="mt-2">
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-green-500 transition-all"
                          style={{ width: `${successRate}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{successRate}% de sucesso</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contacts table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contatos da Campanha</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Telefone</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Enviado em</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Erro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {contacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-muted/20">
                        <td className="px-4 py-2.5">{contact.name || '—'}</td>
                        <td className="px-4 py-2.5 font-mono text-xs">{contact.phone}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
                            contact.status === 'SENT' ? 'bg-green-100 text-green-700' :
                            contact.status === 'FAILED' ? 'bg-red-100 text-red-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {contact.status === 'SENT' ? 'Enviado' : contact.status === 'FAILED' ? 'Falhou' : 'Pendente'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                          {contact.sentAt ? new Date(contact.sentAt).toLocaleString('pt-BR') : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-red-500 max-w-xs truncate">
                          {contact.errorMessage || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
