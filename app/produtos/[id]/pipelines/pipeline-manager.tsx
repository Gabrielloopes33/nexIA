"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, BarChart3 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const pipelineSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Máximo de 100 caracteres"),
  isDefault: z.boolean().default(false),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
})

type PipelineFormData = z.infer<typeof pipelineSchema>

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

interface PipelineManagerProps {
  product: ProductData
  initialPipelines: PipelineData[]
}

export function PipelineManager({ product, initialPipelines }: PipelineManagerProps) {
  const router = useRouter()
  const [pipelines, setPipelines] = useState<PipelineData[]>(initialPipelines)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PipelineFormData>({
    resolver: zodResolver(pipelineSchema),
    defaultValues: {
      name: "",
      isDefault: false,
      status: "ACTIVE",
    },
  })

  const statusValue = watch("status")
  const isDefaultValue = watch("isDefault")

  const onSubmit = async (data: PipelineFormData) => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/products/${product.id}/pipelines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        toast.error(json.error || "Erro ao criar pipeline")
        return
      }

      toast.success("Pipeline criado com sucesso!")
      reset()
      router.refresh()
    } catch (error) {
      toast.error("Erro ao criar pipeline")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = (pipelineId: string) => {
    toast.info("Exclusão de pipeline será implementada em breve.")
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 h-auto px-0 text-muted-foreground hover:text-foreground" asChild>
            <Link href="/produtos">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Voltar para Produtos
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            Pipelines do Produto: {product.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os pipelines e etapas de vendas deste produto.
          </p>
        </div>
      </div>

      {/* Formulário de criação */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Novo Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">
                  Nome <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Digite o nome do pipeline"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={statusValue}
                  onValueChange={(value: "ACTIVE" | "INACTIVE") => setValue("status", value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                    <SelectItem value="INACTIVE">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isDefault"
                checked={isDefaultValue}
                onCheckedChange={(checked) => setValue("isDefault", checked === true)}
              />
              <Label htmlFor="isDefault" className="cursor-pointer text-sm font-normal">
                Definir como pipeline padrão deste produto
              </Label>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                className="bg-[#46347F] hover:bg-[#7b79c4] text-white gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Criar Pipeline
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Pipelines */}
      <h2 className="mb-4 text-lg font-semibold text-foreground">Pipelines existentes</h2>
      {pipelines.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#46347F]/10">
              <BarChart3 className="h-8 w-8 text-[#46347F]" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Nenhum pipeline cadastrado
            </h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Crie seu primeiro pipeline acima para começar a organizar as etapas de vendas deste produto.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pipelines.map((pipeline) => (
            <Card key={pipeline.id} className="overflow-hidden transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base font-semibold line-clamp-1">
                      {pipeline.name}
                    </CardTitle>
                    {pipeline.isDefault && (
                      <Badge className="bg-[#f3c845] text-[#46347F] hover:bg-[#f3c845]">Padrão</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mb-4 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <BarChart3 className="h-4 w-4" />
                    <span>{pipeline._count?.stages ?? 0} etapa(s)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        pipeline.status === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {pipeline.status === "ACTIVE" ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => toast.info("Edição de pipeline será implementada em breve.")}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1 gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o pipeline <strong>{pipeline.name}</strong>?
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(pipeline.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
