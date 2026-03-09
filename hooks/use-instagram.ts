"use client"

import { useState, useEffect, useCallback } from "react"

interface InstagramInstance {
  id: string
  instagramId: string
  username: string
  name?: string | null
  profilePictureUrl?: string | null
  status: string
  connectedAt?: string
  lastSyncAt?: string
  followersCount?: number
  followingCount?: number
  mediaCount?: number
  biography?: string
  website?: string
}

interface InstagramInsights {
  impressions: number
  reach: number
  profileViews: number
  websiteClicks: number
}

interface InstagramMedia {
  id: string
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REELS"
  media_url?: string
  thumbnail_url?: string
  permalink: string
  caption?: string
  like_count: number
  comments_count: number
  timestamp: string
}

interface InstagramLog {
  id: string
  eventType: string
  status: "SUCCESS" | "ERROR" | "PENDING"
  message: string
  payload?: Record<string, unknown>
  createdAt: string
  instanceId?: string
}

interface UseInstagramReturn {
  instances: InstagramInstance[]
  selectedInstance: InstagramInstance | null
  setSelectedInstance: (instance: InstagramInstance | null) => void
  insights: InstagramInsights
  media: InstagramMedia[]
  logs: InstagramLog[]
  isLoading: boolean
  isInsightsLoading: boolean
  isMediaLoading: boolean
  isLogsLoading: boolean
  error: string | null
  period: "day" | "week" | "month"
  setPeriod: (period: "day" | "week" | "month") => void
  refreshInstances: () => Promise<void>
  refreshInsights: () => Promise<void>
  refreshMedia: () => Promise<void>
  refreshLogs: () => Promise<void>
  disconnectInstance: (id: string) => Promise<void>
  sendDirectMessage: (instanceId: string, recipient: string, message: string) => Promise<void>
}

export function useInstagram(): UseInstagramReturn {
  const [instances, setInstances] = useState<InstagramInstance[]>([])
  const [selectedInstance, setSelectedInstance] = useState<InstagramInstance | null>(null)
  const [insights, setInsights] = useState<InstagramInsights>({
    impressions: 0,
    reach: 0,
    profileViews: 0,
    websiteClicks: 0,
  })
  const [media, setMedia] = useState<InstagramMedia[]>([])
  const [logs, setLogs] = useState<InstagramLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInsightsLoading, setIsInsightsLoading] = useState(false)
  const [isMediaLoading, setIsMediaLoading] = useState(false)
  const [isLogsLoading, setIsLogsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<"day" | "week" | "month">("week")

  // Fetch instances
  const fetchInstances = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch("/api/instagram/instances")
      const data = await response.json()

      if (data.success) {
        setInstances(data.data)
        if (data.data.length > 0 && !selectedInstance) {
          setSelectedInstance(data.data[0])
        }
      } else {
        setError(data.error || "Falha ao carregar instâncias")
      }
    } catch (err) {
      setError("Erro ao conectar com o servidor")
      console.error("Error fetching instances:", err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedInstance])

  // Fetch insights
  const fetchInsights = useCallback(async () => {
    if (!selectedInstance) return

    try {
      setIsInsightsLoading(true)
      
      const response = await fetch(
        `/api/instagram/insights?instanceId=${selectedInstance.id}&period=${period}`
      )
      const data = await response.json()

      if (data.success) {
        setInsights(data.data.insights)
      }
    } catch (err) {
      console.error("Error fetching insights:", err)
      // Use mock data on error
      setInsights({
        impressions: 24500,
        reach: 18300,
        profileViews: 3420,
        websiteClicks: 890,
      })
    } finally {
      setIsInsightsLoading(false)
    }
  }, [selectedInstance, period])

  // Fetch media
  const fetchMedia = useCallback(async () => {
    if (!selectedInstance) return

    try {
      setIsMediaLoading(true)
      
      const response = await fetch(
        `/api/instagram/media?instanceId=${selectedInstance.id}`
      )
      const data = await response.json()

      if (data.success) {
        setMedia(data.data)
      }
    } catch (err) {
      console.error("Error fetching media:", err)
      setMedia([])
    } finally {
      setIsMediaLoading(false)
    }
  }, [selectedInstance])

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    if (!selectedInstance) return

    try {
      setIsLogsLoading(true)
      
      const response = await fetch(
        `/api/instagram/logs?instanceId=${selectedInstance.id}`
      )
      const data = await response.json()

      if (data.success) {
        setLogs(data.data)
      }
    } catch (err) {
      console.error("Error fetching logs:", err)
      setLogs([])
    } finally {
      setIsLogsLoading(false)
    }
  }, [selectedInstance])

  // Disconnect instance
  const disconnectInstance = async (id: string) => {
    try {
      const response = await fetch(`/api/instagram/instances/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchInstances()
        if (selectedInstance?.id === id) {
          setSelectedInstance(null)
        }
      } else {
        setError("Falha ao desconectar instância")
      }
    } catch (err) {
      setError("Erro ao desconectar")
      console.error("Error disconnecting instance:", err)
    }
  }

  // Send direct message
  const sendDirectMessage = async (
    instanceId: string,
    recipient: string,
    message: string
  ) => {
    try {
      const response = await fetch("/api/instagram/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instanceId,
          recipient,
          message,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }
    } catch (err) {
      console.error("Error sending message:", err)
      throw err
    }
  }

  // Initial load
  useEffect(() => {
    fetchInstances()
  }, [fetchInstances])

  // Load data when instance changes
  useEffect(() => {
    if (selectedInstance) {
      fetchInsights()
      fetchMedia()
      fetchLogs()
    }
  }, [selectedInstance, fetchInsights, fetchMedia, fetchLogs])

  // Reload insights when period changes
  useEffect(() => {
    if (selectedInstance) {
      fetchInsights()
    }
  }, [period, selectedInstance, fetchInsights])

  return {
    instances,
    selectedInstance,
    setSelectedInstance,
    insights,
    media,
    logs,
    isLoading,
    isInsightsLoading,
    isMediaLoading,
    isLogsLoading,
    error,
    period,
    setPeriod,
    refreshInstances: fetchInstances,
    refreshInsights: fetchInsights,
    refreshMedia: fetchMedia,
    refreshLogs: fetchLogs,
    disconnectInstance,
    sendDirectMessage,
  }
}
