"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const productSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Máximo de 100 caracteres"),
  description: z.string().max(500, "Máximo de 500 caracteres").optional(),
  color: z.string().regex(/^#([0-9A-Fa-f]{6})$/, "Cor inválida"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
})

type ProductFormData = z.infer<typeof productSchema>

interface Product {
  id: string
  name: string
  description: string | null
  color: string
  status: "ACTIVE" | "INACTIVE"
}

interface EditProductFormProps {
  product: Product
}

export function EditProductForm({ product }: EditProductFormProps) {
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
      name: product.name,
      description: product.description || "",
      color: product.color || "#6366f1",
      status: product.status,
    },
  })

  const selectedColor = watch("color")

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          description: data.description || null,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          toast.error(json.error || "Já existe um produto com este nome")
          return
        }
        throw new Error(json.error || "Erro ao atualizar produto")
      }

      toast.success("Produto atualizado com sucesso!")
      router.push("/produtos")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao atualizar produto"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link href="/produtos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Editar Produto</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Dados do Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nome <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Nome do produto"
                maxLength={100}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                placeholder="Descrição do produto"
                maxLength={500}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-xs text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">
                Cor <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-3">
                <input
                  id="color"
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setValue("color", e.target.value, { shouldValidate: true })}
                  className="h-10 w-10 cursor-pointer rounded border border-input bg-transparent p-1"
                />
                <Input
                  value={selectedColor}
                  onChange={(e) => setValue("color", e.target.value, { shouldValidate: true })}
                  className="w-32 font-mono text-sm"
                  maxLength={7}
                />
              </div>
              {errors.color && (
                <p className="text-xs text-red-500">{errors.color.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                defaultValue={product.status}
                onValueChange={(value: "ACTIVE" | "INACTIVE") =>
                  setValue("status", value, { shouldValidate: true })
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

            <div className="flex items-center justify-end gap-3 pt-2">
              {isSubmitting ? (
                <Button variant="outline" disabled>
                  Cancelar
                </Button>
              ) : (
                <Button variant="outline" asChild>
                  <Link href="/produtos">Cancelar</Link>
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#46347F] hover:bg-[#3a2c6b] text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
