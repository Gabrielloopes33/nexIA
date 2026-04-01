"use client"

import useSWR from "swr"

export interface Product {
  id: string
  name: string
  description: string | null
  color: string
  status: string
  createdAt: string
  updatedAt: string
  _count?: {
    pipelines: number
  }
}

interface ProductsResponse {
  success: boolean
  data: Product[]
  pagination?: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

async function fetcher(url: string) {
  const res = await fetch(url)
  const json: ProductsResponse = await res.json()
  if (!json.success) throw new Error("Failed to fetch products")
  return json
}

export function useProducts() {
  const { data, error, isLoading, mutate } = useSWR("/api/products", fetcher, {
    revalidateOnFocus: false,
  })

  return {
    products: data?.data ?? [],
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
  }
}

export function useProduct(productId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    productId ? `/api/products/${productId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  return {
    product: data?.data as Product | undefined,
    isLoading,
    error,
    mutate,
  }
}
