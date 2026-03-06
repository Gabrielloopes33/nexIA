"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import Link from "next/link"
import { X, Plus } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { MOCK_TAGS } from "@/lib/mock/tags"

const quickLeadSchema = z.object({
  nome: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(8, "Telefone é obrigatório"),
  origem: z.string().min(1, "Origem é obrigatória"),
  tags: z.array(z.string()).optional(),
  observacoes: z.string().optional(),
})

type QuickLeadForm = z.infer<typeof quickLeadSchema>

const ORIGEM_OPTIONS = [
  { value: "website", label: "Website" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "indicacao", label: "Indicação" },
  { value: "outro", label: "Outro" },
]

interface QuickLeadModalProps {
  children: React.ReactNode
}

export function QuickLeadModal({ children }: QuickLeadModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<QuickLeadForm>({
    resolver: zodResolver(quickLeadSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      origem: "",
      tags: [],
      observacoes: "",
    },
  })

  const selectedTags = form.watch("tags") || []

  const toggleTag = (tagId: string) => {
    const currentTags = form.getValues("tags") || []
    if (currentTags.includes(tagId)) {
      form.setValue(
        "tags",
        currentTags.filter((t) => t !== tagId)
      )
    } else {
      form.setValue("tags", [...currentTags, tagId])
    }
  }

  const onSubmit = async (data: QuickLeadForm) => {
    setIsSubmitting(true)

    // Simular API call
    await new Promise((r) => setTimeout(r, 800))

    console.log("Lead criado:", data)
    toast.success("Lead criado com sucesso!")

    setIsSubmitting(false)
    setOpen(false)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Novo Lead Rápido
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">
              Nome <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nome"
              placeholder="Digite o nome completo"
              {...form.register("nome")}
            />
            {form.formState.errors.nome && (
              <p className="text-sm text-red-500">
                {form.formState.errors.nome.message}
              </p>
            )}
          </div>

          {/* Email e Telefone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">
                Telefone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="telefone"
                placeholder="(00) 00000-0000"
                {...form.register("telefone")}
              />
              {form.formState.errors.telefone && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.telefone.message}
                </p>
              )}
            </div>
          </div>

          {/* Origem */}
          <div className="space-y-2">
            <Label htmlFor="origem">
              Origem <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.watch("origem")}
              onValueChange={(value) => form.setValue("origem", value)}
            >
              <SelectTrigger id="origem">
                <SelectValue placeholder="Selecione a origem" />
              </SelectTrigger>
              <SelectContent>
                {ORIGEM_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.origem && (
              <p className="text-sm text-red-500">
                {form.formState.errors.origem.message}
              </p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {MOCK_TAGS.slice(0, 6).map((tag) => {
                const isSelected = selectedTags.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? "ring-2 ring-offset-1"
                        : "opacity-70 hover:opacity-100"
                    }`}
                    style={{
                      backgroundColor: isSelected ? tag.cor : `${tag.cor}40`,
                      color: isSelected ? "#fff" : "#000",
                      ringColor: tag.cor,
                    }}
                  >
                    {tag.nome}
                    {isSelected && <X className="h-3 w-3" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Observações opcionais sobre o lead..."
              rows={3}
              {...form.register("observacoes")}
            />
          </div>

          {/* Ações */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Link
              href="/contatos/novo"
              className="text-sm text-[#9795e4] hover:underline"
              onClick={() => setOpen(false)}
            >
              Criar completo →
            </Link>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#9795e4] hover:bg-[#7c7ab8] text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Criando...
                  </>
                ) : (
                  "Criar Lead"
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
