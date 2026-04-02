"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowLeft, Loader2, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const PRESET_COLORS = [
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#64748b",
]

const productSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Máximo 100 caracteres"),
  description: z.string().max(500, "Máximo 500 caracteres").optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
})

type ProductFormData = z.infer<typeof productSchema>

export default function NovoProdutoPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#3b82f6",
      status: "ACTIVE",
    },
  })

  const selectedColor = watch("color")

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description || undefined,
          color: data.color,
          status: data.status,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          toast.error(result.error || "Já existe um produto com este nome")
        } else {
          toast.error(result.error || "Erro ao criar produto")
        }
        return
      }

      toast.success("Produto criado com sucesso!")
      router.push("/produtos")
    } catch {
      toast.error("Erro ao criar produto. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 min-w-0">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/produtos">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <nav className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/produtos" className="hover:text-[#46347F]">
                Produtos
              </Link>
              <span>/</span>
              <span className="text-foreground">Novo Produto</span>
            </nav>
            <h1 className="text-2xl font-bold tracking-tight">Novo Produto</h1>
          </div>
        </div>
        <Button variant="outline" asChild className="shrink-0">
          <Link href="/produtos">Cancelar</Link>
        </Button>
      </div>

      <Separator className="mb-6" />

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
        <Card className="rounded-sm border border-border bg-white p-4 md:p-6">
          <CardHeader className="p-0 pb-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-[#46347F]" />
              <CardTitle className="text-base font-semibold">
                Informações do Produto
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0 space-y-6">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nome <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Digite o nome do produto"
                maxLength={100}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o produto..."
                rows={4}
                maxLength={500}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-xs text-red-500">{errors.description.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Máximo 500 caracteres.
              </p>
            </div>

            {/* Cor */}
            <div className="space-y-3">
              <Label htmlFor="color">
                Cor <span className="text-red-500">*</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setValue("color", color)}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      selectedColor === color
                        ? "border-[#46347F] scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Selecionar cor ${color}`}
                  />
                ))}
                <div className="flex items-center gap-2 ml-2">
                  <input
                    id="color"
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setValue("color", e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded border-0 p-0 bg-transparent"
                  />
                  <span className="text-sm text-muted-foreground uppercase">
                    {selectedColor}
                  </span>
                </div>
              </div>
              {errors.color && (
                <p className="text-xs text-red-500">{errors.color.message}</p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                defaultValue="ACTIVE"
                onValueChange={(value: "ACTIVE" | "INACTIVE") =>
                  setValue("status", value)
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Ativo</SelectItem>
                  <SelectItem value="INACTIVE">Inativo</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-xs text-red-500">{errors.status.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            asChild
            disabled={isSubmitting}
          >
            <Link href="/produtos">Voltar</Link>
          </Button>
          <Button
            type="submit"
            className="gap-2 bg-[#46347F] hover:bg-[#46347F] text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Criar Produto"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
