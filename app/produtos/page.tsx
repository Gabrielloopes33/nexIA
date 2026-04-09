import { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Plus, Pencil, BarChart3 } from "lucide-react"

export const metadata: Metadata = {
  title: "Produtos | NexIA Chat",
  description: "Gerencie os produtos da sua organização",
}

export default async function ProdutosPage() {
  const session = await getSession()
  if (!session?.organizationId) {
    redirect("/onboarding/organizacao")
  }

  const organizationId = session.organizationId

  const products = await prisma.product.findMany({
    where: { organizationId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: {
          pipelines: true,
          deals: true,
        },
      },
    },
  })

  return (
    <div className="pt-14 px-6 pb-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie seus produtos, serviços e seus respectivos pipelines de vendas.
            </p>
          </div>
          <Button asChild className="bg-[#46347F] hover:bg-[#7b79c4] text-white gap-2">
            <Link href="/produtos/novo">
              <Plus className="h-4 w-4" />
              Novo Produto
            </Link>
          </Button>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#46347F]/10">
                <Package className="h-8 w-8 text-[#46347F]" />
              </div>
              <h2 className="mb-2 text-lg font-semibold text-foreground">
                Nenhum produto cadastrado
              </h2>
              <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                Crie seu primeiro produto para começar a organizar seus pipelines de vendas.
              </p>
              <Button asChild className="bg-[#46347F] hover:bg-[#7b79c4] text-white gap-2">
                <Link href="/produtos/novo">
                  <Plus className="h-4 w-4" />
                  Criar Produto
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: product.color || "#6366f1" }}
                      />
                      <CardTitle className="text-base font-semibold line-clamp-1">
                        {product.name}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      asChild
                    >
                      <Link href={`/produtos/${product.id}/editar`}>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                    {product.description || "Sem descrição"}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <BarChart3 className="h-4 w-4" />
                      <span>{product._count.pipelines} pipeline(s)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="font-medium text-foreground">{product._count.deals}</span>
                      <span>negócios</span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link href={`/produtos/${product.id}/pipelines`}>
                        Pipelines
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-[#46347F] hover:bg-[#7b79c4] text-white"
                      asChild
                    >
                      <Link href={`/pipeline?produto=${product.id}`}>
                        Ver Pipeline
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
