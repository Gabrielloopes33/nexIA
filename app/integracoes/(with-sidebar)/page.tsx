"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus } from "lucide-react"
import { IntegrationsHeader } from "@/components/integrations-header"
import { IntegrationsToolbar } from "@/components/integrations-toolbar"
import { IntegrationsGrid } from "@/components/integrations-grid"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useIntegrations } from "@/hooks/use-integrations"

export default function IntegracoesPage() {
  const router = useRouter()
  const { integrations, isLoading, error, connectIntegration, configureIntegration } = useIntegrations()
  
  const [searchTerm, setSearchTerm] = useState("")

  // Filter integrations by search term only
  const filteredIntegrations = useMemo(() => {
    let filtered = integrations

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        i => i.name.toLowerCase().includes(term) || 
             i.description.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [integrations, searchTerm])

  const handleConnect = async (id: string) => {
    if (id === 'whatsapp-oficial') {
      router.push('/meta-api/whatsapp/connect')
      return
    }
    if (id.startsWith('calendly') || integrations.find(i => i.id === id && i.type === 'calendly')) {
      router.push('/integracoes/calendly')
      return
    }
    if (id.startsWith('typebot') || integrations.find(i => i.id === id && i.type === 'typebot')) {
      router.push('/integracoes/typebot')
      return
    }
    await connectIntegration(id)
  }

  const handleConfigure = async (id: string) => {
    const integration = integrations.find(i => i.id === id)
    if (integration?.type === 'calendly') {
      router.push('/integracoes/calendly')
      return
    }
    if (integration?.type === 'typebot') {
      router.push('/integracoes/typebot')
      return
    }
    await configureIntegration(id, {})
  }

  const handleNewIntegration = () => {
    // Scroll para mostrar integrações disponíveis ou abrir modal
    console.log('New integration')
  }

  const handleSettings = () => {
    console.log('Settings')
  }

  const handleClearSearch = () => {
    setSearchTerm("")
  }

  // Estado de loading
  if (isLoading) {
    return (
      <div>
        <IntegrationsHeader
          onNewIntegration={handleNewIntegration}
          onSettings={handleSettings}
        />
        <div className="mt-6 flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando integrações...</p>
          </div>
        </div>
      </div>
    )
  }

  // Estado de erro
  if (error) {
    return (
      <div>
        <IntegrationsHeader
          onNewIntegration={handleNewIntegration}
          onSettings={handleSettings}
        />
        <div className="mt-6">
          <Card className="border-destructive">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-destructive/10 p-3 mb-4">
                <svg
                  className="h-6 w-6 text-destructive"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Erro ao carregar integrações</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                {error}
              </p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Estado vazio (quando não há integrações disponíveis)
  if (integrations.length === 0) {
    return (
      <div>
        <IntegrationsHeader
          onNewIntegration={handleNewIntegration}
          onSettings={handleSettings}
        />
        <div className="mt-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhuma integração disponível</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">
                Comece conectando sua primeira integração para automatizar seu fluxo de trabalho e sincronizar dados.
              </p>
              <Button onClick={handleNewIntegration}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar integração
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div>
      <IntegrationsHeader
        onNewIntegration={handleNewIntegration}
        onSettings={handleSettings}
      />

      <div className="mt-6">
        <IntegrationsToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      </div>

      <div className="mt-6">
        <IntegrationsGrid
          integrations={filteredIntegrations}
          onConnect={handleConnect}
          onConfigure={handleConfigure}
          onClearFilters={handleClearSearch}
        />
      </div>
    </div>
  )
}
