import { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { PipelineManager } from "./pipeline-manager"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

type ProductData = {
  id: string
  name: string
  description?: string | null
  color: string
  status: string
}

type PipelineData = {
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

async function getProduct(id: string): Promise<{ success: boolean; data?: ProductData; error?: string }> {
  const headersList = await headers()
  const host = headersList.get("host") || "localhost:3000"
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https"
  const cookie = headersList.get("cookie") || ""

  const res = await fetch(`${protocol}://${host}/api/products/${id}`, {
    headers: {
      cookie,
    },
    cache: "no-store",
  })
  return res.json()
}

async function getPipelines(id: string): Promise<{ success: boolean; data?: PipelineData[]; error?: string }> {
  const headersList = await headers()
  const host = headersList.get("host") || "localhost:3000"
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https"
  const cookie = headersList.get("cookie") || ""

  const res = await fetch(`${protocol}://${host}/api/products/${id}/pipelines`, {
    headers: {
      cookie,
    },
    cache: "no-store",
  })
  return res.json()
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const productRes = await getProduct(id)
  return {
    title: `Pipelines do Produto: ${productRes.data?.name || "Produto"} | NexIA Chat`,
    description: "Gerencie os pipelines do produto",
  }
}

export default async function ProductPipelinesPage({ params }: PageProps) {
  const session = await getSession()
  if (!session?.organizationId) {
    redirect("/onboarding/organizacao")
  }

  const { id } = await params
  const [productRes, pipelinesRes] = await Promise.all([getProduct(id), getPipelines(id)])

  if (!productRes.success || !productRes.data) {
    return (
      <div className="p-6 md:p-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-xl font-semibold text-foreground">Produto não encontrado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            O produto solicitado não existe ou você não tem permissão para acessá-lo.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8">
      <PipelineManager product={productRes.data} initialPipelines={pipelinesRes.data || []} />
    </div>
  )
}
