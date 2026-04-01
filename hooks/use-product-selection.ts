"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useProducts, Product } from "./use-products"
import { usePipelines, Pipeline } from "./use-pipelines"

const PRODUCT_STORAGE_KEY = "nexia:selected-product"
const PIPELINE_STORAGE_KEY = "nexia:selected-pipeline"

export interface UseProductSelectionResult {
  productId: string | null
  pipelineId: string | null
  products: Product[]
  pipelines: Pipeline[]
  isLoadingProducts: boolean
  isLoadingPipelines: boolean
  switchProduct: (id: string) => Promise<void>
  switchPipeline: (id: string) => Promise<void>
}

/**
 * Hook centralizado para gerenciar a seleção de produto e pipeline.
 * Prioridade:
 * 1. Query params (?produto=, ?pipeline=)
 * 2. localStorage
 * 3. Primeiro produto/pipeline ativo da organização
 */
export function useProductSelection(): UseProductSelectionResult {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { products, isLoading: isLoadingProducts, mutate: mutateProducts } = useProducts()
  const [productId, setProductId] = useState<string | null>(null)
  const [pipelineId, setPipelineId] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  const { pipelines, isLoading: isLoadingPipelines } = usePipelines(productId)

  // Hydration: resolve productId e pipelineId iniciais
  useEffect(() => {
    if (isLoadingProducts || products.length === 0) return

    const urlProductId = searchParams.get("produto")
    const urlPipelineId = searchParams.get("pipeline")

    let resolvedProductId: string | null = null
    let resolvedPipelineId: string | null = null

    if (urlProductId && products.some((p) => p.id === urlProductId)) {
      resolvedProductId = urlProductId
    } else {
      const stored = typeof window !== "undefined" ? localStorage.getItem(PRODUCT_STORAGE_KEY) : null
      if (stored && products.some((p) => p.id === stored)) {
        resolvedProductId = stored
      } else {
        resolvedProductId = products[0]?.id ?? null
      }
    }

    if (resolvedProductId) {
      const productPipelines = pipelines.filter((p) => p.productId === resolvedProductId)
      if (urlPipelineId && productPipelines.some((p) => p.id === urlPipelineId)) {
        resolvedPipelineId = urlPipelineId
      } else {
        const storedPipeline = typeof window !== "undefined" ? localStorage.getItem(PIPELINE_STORAGE_KEY) : null
        if (storedPipeline && productPipelines.some((p) => p.id === storedPipeline)) {
          resolvedPipelineId = storedPipeline
        } else {
          const defaultPipeline = productPipelines.find((p) => p.isDefault)
          resolvedPipelineId = defaultPipeline?.id ?? productPipelines[0]?.id ?? null
        }
      }
    }

    setProductId(resolvedProductId)
    setPipelineId(resolvedPipelineId)
    setIsHydrated(true)
  }, [isLoadingProducts, products, searchParams, pipelines])

  const updateUrl = useCallback(
    (newProductId: string | null, newPipelineId: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (newProductId) {
        params.set("produto", newProductId)
      } else {
        params.delete("produto")
      }
      if (newPipelineId) {
        params.set("pipeline", newPipelineId)
      } else {
        params.delete("pipeline")
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const switchProduct = useCallback(
    async (id: string) => {
      if (!products.some((p) => p.id === id)) return

      // Chama API para persistir na sessão
      await fetch("/api/user/switch-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id }),
      })

      localStorage.setItem(PRODUCT_STORAGE_KEY, id)

      // Resolve novo pipeline padrão para o produto
      const productPipelines = pipelines.filter((p) => p.productId === id)
      const newPipelineId = productPipelines.find((p) => p.isDefault)?.id ?? productPipelines[0]?.id ?? null

      if (newPipelineId) {
        await fetch("/api/user/switch-pipeline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pipelineId: newPipelineId }),
        })
        localStorage.setItem(PIPELINE_STORAGE_KEY, newPipelineId)
      } else {
        localStorage.removeItem(PIPELINE_STORAGE_KEY)
      }

      setProductId(id)
      setPipelineId(newPipelineId)
      updateUrl(id, newPipelineId)
    },
    [products, pipelines, updateUrl]
  )

  const switchPipeline = useCallback(
    async (id: string) => {
      if (!pipelines.some((p) => p.id === id)) return

      await fetch("/api/user/switch-pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipelineId: id }),
      })

      localStorage.setItem(PIPELINE_STORAGE_KEY, id)
      setPipelineId(id)
      updateUrl(productId, id)
    },
    [pipelines, productId, updateUrl]
  )

  return {
    productId,
    pipelineId,
    products,
    pipelines,
    isLoadingProducts: isLoadingProducts || !isHydrated,
    isLoadingPipelines,
    switchProduct,
    switchPipeline,
  }
}
