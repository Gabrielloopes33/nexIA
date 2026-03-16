"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useOrganizationId } from '@/lib/contexts/organization-context'
import { useContacts } from './use-contacts'
import { useConversations } from './use-conversations'
import { useAiInsights } from './use-ai-insights'
import { useTags } from './use-tags'

export type DashboardPeriod = '7d' | '30d' | '90d'

// Helper to get date range from period
function getDateRange(period: DashboardPeriod): { startDate: Date; endDate: Date } {
  const endDate = new Date()
  const startDate = new Date()
  
  switch (period) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7)
      break
    case '30d':
      startDate.setDate(endDate.getDate() - 30)
      break
    case '90d':
      startDate.setDate(endDate.getDate() - 90)
      break
  }
  
  return { startDate, endDate }
}

export interface DashboardMetrics {
  revenue: {
    total: number
    growth: number
    previousPeriod: number
  }
  deals: {
    total: number
    won: number
    lost: number
    pending: number
    growth: number
  }
  conversations: {
    total: number
    active: number
    resolved: number
    avgResponseTime: number
    growth: number
  }
  contacts: {
    total: number
    new: number
    growth: number
  }
  conversionRate: number
  avgTicket: number
}

export interface ChartDataPoint {
  date: string
  value: number
  label?: string
}

export interface LeadTrendData {
  year: string
  total: number
  verified: number
  upcoming: number
}

export interface ConversationVolumeData {
  month: string
  whatsapp: number
  instagram: number
  telegram: number
  iframe: number
}

export interface DashboardCharts {
  revenue: ChartDataPoint[]
  deals: ChartDataPoint[]
  conversations: ChartDataPoint[]
  contacts: ChartDataPoint[]
  leadTrends: LeadTrendData[]
  conversationVolume: ConversationVolumeData[]
}

export interface DashboardInsight {
  id: string
  type: 'trend' | 'alert' | 'opportunity' | 'prediction'
  title: string
  description: string
  value?: string
  change?: number
  priority: 'high' | 'medium' | 'low'
  createdAt: string
}

export interface UseDashboardReturn {
  metrics: DashboardMetrics | null
  charts: DashboardCharts | null
  insights: DashboardInsight[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  period: DashboardPeriod
  setPeriod: (period: DashboardPeriod) => void
  hasInsufficientData: boolean
}

export function useDashboard(): UseDashboardReturn {
  const organizationId = useOrganizationId()
  const [period, setPeriod] = useState<DashboardPeriod>('30d')
  
  const { startDate, endDate } = useMemo(() => getDateRange(period), [period])

  // Fetch data from existing hooks
  const { 
    contacts, 
    isLoading: contactsLoading, 
    error: contactsError 
  } = useContacts(organizationId || undefined)
  
  const { 
    conversations, 
    isLoading: conversationsLoading, 
    error: conversationsError 
  } = useConversations({ 
    limit: 100 
  })
  
  const { 
    insights: aiInsights, 
    isLoading: insightsLoading, 
    error: insightsError 
  } = useAiInsights({ 
    limit: 10 
  })
  
  const { 
    tags, 
    isLoading: tagsLoading 
  } = useTags(organizationId || undefined)

  // Calculate metrics from real data
  const metrics: DashboardMetrics | null = useMemo(() => {
    if (!contacts || !conversations) return null

    // Filter contacts by date range
    const filteredContacts = contacts.filter(contact => {
      const contactDate = new Date(contact.createdAt)
      return contactDate >= startDate && contactDate <= endDate
    })

    // Calculate conversion rate (contacts with deals / total contacts)
    const contactsWithDeals = filteredContacts.filter(contact => 
      contact.metadata?.dealValue || contact.metadata?.converted
    )
    const conversionRate = filteredContacts.length > 0 
      ? (contactsWithDeals.length / filteredContacts.length) * 100 
      : 0

    // Calculate average ticket
    const dealValues = contactsWithDeals
      .map(c => Number(c.metadata?.dealValue) || 0)
      .filter(v => v > 0)
    const avgTicket = dealValues.length > 0
      ? dealValues.reduce((sum, val) => sum + val, 0) / dealValues.length
      : 0

    // Calculate revenue
    const totalRevenue = dealValues.reduce((sum, val) => sum + val, 0)

    // Count conversations
    const activeConversations = conversations.filter(c => c.status === 'ACTIVE').length
    const totalConversations = conversations.length

    return {
      revenue: {
        total: totalRevenue,
        growth: 0, // Would need historical data
        previousPeriod: 0
      },
      deals: {
        total: contactsWithDeals.length,
        won: contactsWithDeals.filter(c => c.metadata?.converted).length,
        lost: 0, // Would need specific status tracking
        pending: contactsWithDeals.length,
        growth: 0
      },
      conversations: {
        total: totalConversations,
        active: activeConversations,
        resolved: conversations.filter(c => c.status === 'CLOSED').length,
        avgResponseTime: 0,
        growth: 0
      },
      contacts: {
        total: contacts.length,
        new: filteredContacts.length,
        growth: 0
      },
      conversionRate,
      avgTicket
    }
  }, [contacts, conversations, startDate, endDate])

  // Calculate chart data from real data
  const charts: DashboardCharts | null = useMemo(() => {
    if (!contacts || !conversations) return null

    // Generate lead trends data (grouped by month)
    const leadsByMonth = new Map<string, { total: number; verified: number; upcoming: number }>()
    
    contacts.forEach(contact => {
      const date = new Date(contact.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!leadsByMonth.has(monthKey)) {
        leadsByMonth.set(monthKey, { total: 0, verified: 0, upcoming: 0 })
      }
      
      const month = leadsByMonth.get(monthKey)!
      month.total++
      
      if (contact.status === 'ACTIVE') {
        month.verified++
      } else {
        month.upcoming++
      }
    })

    const leadTrends: LeadTrendData[] = Array.from(leadsByMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-9) // Last 9 months
      .map(([year, data]) => ({
        year: year.split('-')[1] === new Date().getFullYear().toString() 
          ? year.split('-')[1] 
          : year,
        total: data.total,
        verified: data.verified,
        upcoming: data.upcoming
      }))

    // If not enough data, fill with empty months
    while (leadTrends.length < 6) {
      leadTrends.unshift({
        year: `0${leadTrends.length + 1}`,
        total: 0,
        verified: 0,
        upcoming: 0
      })
    }

    // Generate conversation volume data
    const conversationsByMonth = new Map<string, { whatsapp: number; instagram: number; telegram: number; iframe: number }>()
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short' })
      conversationsByMonth.set(monthKey, { whatsapp: 0, instagram: 0, telegram: 0, iframe: 0 })
    }

    conversations.forEach(conv => {
      const date = new Date(conv.createdAt)
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short' })
      
      if (conversationsByMonth.has(monthKey)) {
        const month = conversationsByMonth.get(monthKey)!
        // Categorize by instance or type
        if (conv.instance?.name?.toLowerCase().includes('whatsapp')) {
          month.whatsapp++
        } else if (conv.instance?.name?.toLowerCase().includes('instagram')) {
          month.instagram++
        } else {
          month.whatsapp++ // Default to WhatsApp
        }
      }
    })

    const conversationVolume: ConversationVolumeData[] = Array.from(conversationsByMonth.entries())
      .map(([month, data]) => ({
        month: month.charAt(0).toUpperCase() + month.slice(1),
        ...data
      }))

    return {
      revenue: [],
      deals: [],
      conversations: [],
      contacts: [],
      leadTrends,
      conversationVolume
    }
  }, [contacts, conversations])

  // Transform AI insights
  const insights: DashboardInsight[] = useMemo(() => {
    if (!aiInsights) return []
    
    return aiInsights.map(insight => ({
      id: insight.id,
      type: insight.type === 'PREDICTION' ? 'prediction' :
            insight.type === 'ALERT' ? 'alert' :
            insight.type === 'RECOMMENDATION' ? 'opportunity' : 'trend',
      title: insight.title,
      description: insight.description,
      value: insight.value,
      priority: insight.confidence && insight.confidence > 70 ? 'high' : 
                insight.confidence && insight.confidence > 40 ? 'medium' : 'low',
      createdAt: insight.createdAt
    }))
  }, [aiInsights])

  const isLoading = contactsLoading || conversationsLoading || insightsLoading || tagsLoading
  const error = (contactsError as Error | null)?.message || (conversationsError as Error | null)?.message || (insightsError as Error | null)?.message || null

  const hasInsufficientData = useMemo(() => {
    if (!contacts || !conversations) return true
    return contacts.length === 0 && conversations.length === 0
  }, [contacts, conversations])

  const refresh = useCallback(async () => {
    // Data is automatically refreshed by SWR hooks
    // This function can be used to trigger manual refresh if needed
  }, [])

  return {
    metrics,
    charts,
    insights,
    isLoading,
    error,
    refresh,
    period,
    setPeriod,
    hasInsufficientData
  }
}

export default useDashboard
