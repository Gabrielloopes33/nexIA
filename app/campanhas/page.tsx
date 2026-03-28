"use client"

import { Plus, Megaphone } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sidebar } from '@/components/sidebar'
import { CampaignTable } from '@/components/campaigns/campaign-table'
import { useCampaigns } from '@/hooks/use-campaigns'
import { Skeleton } from '@/components/ui/skeleton'

export default function CampanhasPage() {
  const { campaigns, isLoading, sendCampaign, deleteCampaign } = useCampaigns()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#46347F]/10">
                <Megaphone className="h-5 w-5 text-[#46347F]" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Campanhas</h1>
                <p className="text-sm text-muted-foreground">
                  Dispare mensagens em massa via WhatsApp Business API
                </p>
              </div>
            </div>
            <Button asChild className="bg-[#46347F] hover:bg-[#3a2c6b]">
              <Link href="/campanhas/nova">
                <Plus className="h-4 w-4 mr-2" />
                Nova Campanha
              </Link>
            </Button>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <CampaignTable
              campaigns={campaigns}
              onSend={sendCampaign}
              onDelete={deleteCampaign}
            />
          )}
        </div>
      </main>
    </div>
  )
}
