"use client"

import useSWR from "swr"

export interface Pipeline {
  id: string
  productId: string
  organizationId: string
  name: string
  isDefault: boolean
  status: string
  createdAt: string
  updatedAt: string
  _count?: {
    stages: number
  }
}

interface PipelinesResponse {
  success: boolean
  data: Pipeline[]
}

async function fetcher(url: string) {
  const res = await fetch(url)
  const json: PipelinesResponse = await res.json()
  if (!json.success) throw new Error("Failed to fetch pipelines")
  return json
}

export function usePipelines(productId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    productId ? `/api/products/${productId}/pipelines` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  return {
    pipelines: data?.data ?? [],
    isLoading,
    error,
    mutate,
  }
}
