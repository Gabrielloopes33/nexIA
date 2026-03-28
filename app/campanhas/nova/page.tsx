import { Sidebar } from '@/components/sidebar'
import { CreateCampaignForm } from '@/components/campaigns/create-campaign-form'
import { Megaphone } from 'lucide-react'
import Link from 'next/link'

export default function NovaCampanhaPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-3xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/campanhas" className="hover:text-[#46347F] transition-colors">
              Campanhas
            </Link>
            <span>/</span>
            <span>Nova Campanha</span>
          </div>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#46347F]/10">
              <Megaphone className="h-5 w-5 text-[#46347F]" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Nova Campanha</h1>
              <p className="text-sm text-muted-foreground">
                Configure e crie uma campanha de disparo em massa
              </p>
            </div>
          </div>

          <CreateCampaignForm />
        </div>
      </main>
    </div>
  )
}
