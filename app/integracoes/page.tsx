"use client"

import { useState, useMemo } from "react"
import { Sidebar } from "@/components/sidebar"
import { IntegrationsHeader } from "@/components/integrations-header"
import { IntegrationsKPIs } from "@/components/integrations-kpis"
import { IntegrationsToolbar } from "@/components/integrations-toolbar"
import { IntegrationsGrid } from "@/components/integrations-grid"
import { MOCK_INTEGRATIONS_DATA } from "@/lib/mock-integrations"
import type { Integration, IntegrationCategory, IntegrationKPIs as IKPIs } from "@/lib/types/integration"

export default function IntegracoesPage() {
  const [integrations] = useState<Integration[]>(MOCK_INTEGRATIONS_DATA)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState<IntegrationCategory | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'connected' | 'not_connected' | 'error'>('all')
  const [sortBy, setSortBy] = useState<'popular' | 'name' | 'recent'>('popular')

  // Calculate KPIs
  const kpis = useMemo<IKPIs>(() => {
    const connectedIntegrations = integrations.filter(i => i.status === 'connected' || i.status === 'syncing')
    
    const connectedCount = connectedIntegrations.length
    const totalMessages = connectedIntegrations.reduce((sum, i) => sum + (i.messagesCount || 0), 0)
    
    const healthScores = connectedIntegrations
      .map(i => i.healthScore)
      .filter((score): score is number => score !== undefined)
    const avgHealthScore = healthScores.length > 0 
      ? Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length)
      : 0

    const lastSyncDates = connectedIntegrations
      .map(i => i.lastSyncAt)
      .filter((date): date is Date => date !== undefined)
    const lastSync = lastSyncDates.length > 0 
      ? new Date(Math.max(...lastSyncDates.map(d => d.getTime())))
      : undefined

    return {
      connectedCount,
      totalMessages,
      avgHealthScore,
      lastSync,
    }
  }, [integrations])

  // Filter and sort integrations
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

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(i => i.category === filterCategory)
    }

    // Status filter
    if (filterStatus === 'connected') {
      filtered = filtered.filter(i => i.status === 'connected' || i.status === 'syncing')
    } else if (filterStatus === 'not_connected') {
      filtered = filtered.filter(i => i.status === 'not_connected')
    } else if (filterStatus === 'error') {
      filtered = filtered.filter(i => i.status === 'error' || i.status === 'warning')
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'popular') {
        // Popular first, then verified, then alphabetical
        if (a.popular && !b.popular) return -1
        if (!a.popular && b.popular) return 1
        if (a.verified && !b.verified) return -1
        if (!a.verified && b.verified) return 1
        return a.name.localeCompare(b.name)
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else if (sortBy === 'recent') {
        const aDate = a.lastSyncAt?.getTime() || 0
        const bDate = b.lastSyncAt?.getTime() || 0
        return bDate - aDate
      }
      return 0
    })

    return filtered
  }, [integrations, searchTerm, filterCategory, filterStatus, sortBy])

  const handleConnect = (id: string) => {
    console.log('Connect integration:', id)
    // TODO: Open configuration drawer
  }

  const handleConfigure = (id: string) => {
    console.log('Configure integration:', id)
    // TODO: Open configuration drawer
  }

  const handleNewIntegration = () => {
    console.log('New integration')
    // TODO: Open command palette with available integrations
  }

  const handleSettings = () => {
    console.log('Settings')
    // TODO: Open global integration settings
  }

  const handleExportLogs = () => {
    console.log('Export logs')
    // TODO: Export activity logs to CSV
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setFilterCategory('all')
    setFilterStatus('all')
    setSortBy('popular')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-8 py-6">
        <IntegrationsHeader 
          onNewIntegration={handleNewIntegration}
          onSettings={handleSettings}
        />
        
        <div className="mt-6">
          <IntegrationsKPIs kpis={kpis} />
        </div>

        <div className="mt-6">
          <IntegrationsToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterCategory={filterCategory}
            onFilterCategoryChange={setFilterCategory}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            hasConnectedIntegrations={kpis.connectedCount > 0}
            onExportLogs={handleExportLogs}
          />
        </div>

        <div className="mt-6">
          <IntegrationsGrid
            integrations={filteredIntegrations}
            onConnect={handleConnect}
            onConfigure={handleConfigure}
            onClearFilters={handleClearFilters}
          />
        </div>
      </main>
    </div>
  )
}
