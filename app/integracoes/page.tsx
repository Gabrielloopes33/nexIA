"use client"

import { useState, useMemo } from "react"
import { Sidebar } from "@/components/sidebar"
import { IntegrationsHeader } from "@/components/integrations-header"
import { IntegrationsToolbar } from "@/components/integrations-toolbar"
import { IntegrationsGrid } from "@/components/integrations-grid"
import { IntegrationsSubSidebar } from "@/components/integrations/integrations-sub-sidebar"
import { MOCK_INTEGRATIONS_DATA } from "@/lib/mock-integrations"
import type { Integration, IntegrationCategory } from "@/lib/types/integration"

export default function IntegracoesPage() {
  const [integrations] = useState<Integration[]>(MOCK_INTEGRATIONS_DATA)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState<IntegrationCategory | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'connected' | 'not_connected' | 'error'>('all')
  const [sortBy, setSortBy] = useState<'popular' | 'name' | 'recent'>('popular')

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
  }

  const handleConfigure = (id: string) => {
    console.log('Configure integration:', id)
  }

  const handleNewIntegration = () => {
    console.log('New integration')
  }

  const handleSettings = () => {
    console.log('Settings')
  }

  const handleExportLogs = () => {
    console.log('Export logs')
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setFilterCategory('all')
    setFilterStatus('all')
    setSortBy('popular')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Main Sidebar */}
      <Sidebar />

      {/* Integrations Sub-Sidebar */}
      <IntegrationsSubSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
        <IntegrationsHeader
          onNewIntegration={handleNewIntegration}
          onSettings={handleSettings}
        />

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
            hasConnectedIntegrations={integrations.some(i => i.status === 'connected' || i.status === 'syncing')}
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
