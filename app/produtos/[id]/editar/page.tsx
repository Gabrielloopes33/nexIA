import { Metadata } from "next"
import { cookies, headers } from "next/headers"
import Link from "next/link"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Package } from "lucide-react"
import { EditProductForm } from "./edit-product-form"

export const metadata: Metadata = {
  title: "Editar Produto | NexIA Chat",
  description: "Edite os dados do produto",
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditarProdutoPage({ params }: PageProps) {
  const { id } = await params
  const cookieStore = await cookies()
  const headersList = await headers()
  const host = headersList.get("host") || "localhost:3000"
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https"
  const baseUrl = `${protocol}://${host}`

  let product = null

  try {
    const res = await fetch(`${baseUrl}/api/products/${id}`, {
      headers: {
        Cookie: cookieStore.toString(),
      },
      cache: "no-store",
    })

    if (res.ok) {
      const json = await res.json()
      product = json.data
    }
  } catch {
    // fall through to 404 UI
  }

  if (!product) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-2xl">
            <div className="mb-6 flex items-center gap-4">
              <Button variant="outline" asChild>
                <Link href="/produtos">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Link>
              </Button>
              <h1 className="text-2xl font-bold tracking-tight">Editar Produto</h1>
            </div>

            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="mb-2 text-lg font-semibold text-foreground">
                  Produto não encontrado
                </h2>
                <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                  O produto que você está tentando editar não existe ou foi removido.
                </p>
                <Button asChild className="bg-[#46347F] hover:bg-[#3a2c6b] text-white">
                  <Link href="/produtos">Voltar para Produtos</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8">
        <div className="mx-auto max-w-2xl">
          <EditProductForm product={product} />
        </div>
      </main>
    </div>
  )
}
