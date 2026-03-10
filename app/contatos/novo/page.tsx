"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { ChevronDown, ChevronUp } from "lucide-react"

import { Sidebar } from "@/components/sidebar"
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
import { MOCK_TAGS } from "@/lib/mock/tags"
import type { Contact } from "@/lib/mock/contacts"

const estadosBrasileiros = [
  { value: "AC", label: "AC" },
  { value: "AL", label: "AL" },
  { value: "AM", label: "AM" },
  { value: "AP", label: "AP" },
  { value: "BA", label: "BA" },
  { value: "CE", label: "CE" },
  { value: "DF", label: "DF" },
  { value: "ES", label: "ES" },
  { value: "GO", label: "GO" },
  { value: "MA", label: "MA" },
  { value: "MG", label: "MG" },
  { value: "MS", label: "MS" },
  { value: "MT", label: "MT" },
  { value: "PA", label: "PA" },
  { value: "PB", label: "PB" },
  { value: "PE", label: "PE" },
  { value: "PI", label: "PI" },
  { value: "PR", label: "PR" },
  { value: "RJ", label: "RJ" },
  { value: "RN", label: "RN" },
  { value: "RO", label: "RO" },
  { value: "RR", label: "RR" },
  { value: "RS", label: "RS" },
  { value: "SC", label: "SC" },
  { value: "SE", label: "SE" },
  { value: "SP", label: "SP" },
  { value: "TO", label: "TO" },
]

const avatarBackgrounds = ["#E8E7F7", "#FFF3E0", "#E8F5E9", "#E3F2FD", "#FCE4EC"]

const contactSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  sobrenome: z.string().min(1, "Sobrenome é obrigatório"),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(1, "Telefone é obrigatório"),
  empresa: z.string().optional(),
  cargo: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  instagram: z.string().optional(),
  linkedin: z.string().optional(),
  status: z.enum(["ativo", "inativo", "pendente", "convertido"]),
  origem: z.string().optional(),
  tags: z.array(z.string()).default([]),

  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  observacoes: z.string().optional(),
})

type ContactFormData = z.infer<typeof contactSchema>

function generateAvatar(nome: string, sobrenome: string): string {
  return (nome.charAt(0) + sobrenome.charAt(0)).toUpperCase()
}

function generateAvatarBg(): string {
  return avatarBackgrounds[Math.floor(Math.random() * avatarBackgrounds.length)]
}

export default function NovoContatoPage() {
  const router = useRouter()
  const [isUtmExpanded, setIsUtmExpanded] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      status: "pendente",
      tags: [],
    },
  })

  const selectedTags = watch("tags") || []

  const toggleTag = (tagId: string) => {
    const currentTags = selectedTags
    if (currentTags.includes(tagId)) {
      setValue(
        "tags",
        currentTags.filter((id) => id !== tagId)
      )
    } else {
      setValue("tags", [...currentTags, tagId])
    }
  }

  const onSubmit = (data: ContactFormData) => {
    const newContact: Contact = {
      id: `cont-${Date.now()}`,
      nome: data.nome,
      sobrenome: data.sobrenome,
      email: data.email,
      telefone: data.telefone,
      cidade: data.cidade || "",
      estado: data.estado || "",
      cargo: data.cargo || "",
      empresa: data.empresa || "",
      instagram: data.instagram,
      linkedin: data.linkedin,
      tags: data.tags,

      status: data.status,
      origem: data.origem || "",
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      atualizadoPor: "Admin",
      avatar: generateAvatar(data.nome, data.sobrenome),
      avatarBg: generateAvatarBg(),
      observacoes: data.observacoes,
    }

    console.log("Novo contato criado:", newContact)

    toast.success("Contato criado com sucesso!")
    router.push("/contatos")
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 min-w-0">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <nav className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/contatos" className="hover:text-[#46347F]">
                Contatos
              </Link>
              <span>/</span>
              <span className="text-foreground">Novo Contato</span>
            </nav>
            <h1 className="text-2xl font-bold tracking-tight">Novo Contato</h1>
          </div>
          <Button variant="outline" asChild>
            <Link href="/contatos">Cancelar</Link>
          </Button>
        </div>

        <Separator className="mb-6" />

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Seção: Informações Pessoais */}
          <Card className="rounded-sm border border-border bg-white p-4 md:p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base font-semibold">
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome">
                    Nome <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nome"
                    placeholder="Digite o nome"
                    {...register("nome")}
                  />
                  {errors.nome && (
                    <p className="text-xs text-red-500">{errors.nome.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sobrenome">
                    Sobrenome <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="sobrenome"
                    placeholder="Digite o sobrenome"
                    {...register("sobrenome")}
                  />
                  {errors.sobrenome && (
                    <p className="text-xs text-red-500">
                      {errors.sobrenome.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">
                    Telefone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="telefone"
                    placeholder="+55 (00) 00000-0000"
                    {...register("telefone")}
                  />
                  {errors.telefone && (
                    <p className="text-xs text-red-500">
                      {errors.telefone.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção: Empresa */}
          <Card className="rounded-sm border border-border bg-white p-4 md:p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base font-semibold">Empresa</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa</Label>
                  <Input
                    id="empresa"
                    placeholder="Nome da empresa"
                    {...register("empresa")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo</Label>
                  <Input
                    id="cargo"
                    placeholder="Cargo do contato"
                    {...register("cargo")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção: Localização */}
          <Card className="rounded-sm border border-border bg-white p-4 md:p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base font-semibold">
                Localização
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    placeholder="Nome da cidade"
                    {...register("cidade")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select
                    onValueChange={(value) => setValue("estado", value)}
                  >
                    <SelectTrigger id="estado">
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {estadosBrasileiros.map((estado) => (
                        <SelectItem key={estado.value} value={estado.value}>
                          {estado.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção: Redes Sociais */}
          <Card className="rounded-sm border border-border bg-white p-4 md:p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base font-semibold">
                Redes Sociais
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    placeholder="@usuario"
                    {...register("instagram")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    placeholder="linkedin.com/in/usuario"
                    {...register("linkedin")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção: CRM */}
          <Card className="rounded-sm border border-border bg-white p-4 md:p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base font-semibold">CRM</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    defaultValue="pendente"
                    onValueChange={(value: Contact["status"]) =>
                      setValue("status", value)
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="convertido">Convertido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="origem">Origem</Label>
                  <Input
                    id="origem"
                    placeholder="Ex: Facebook Ads, Webinar, Indicação"
                    {...register("origem")}
                  />
                </div>
                <div className="space-y-3 md:col-span-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {MOCK_TAGS.map((tag) => {
                      const isSelected = selectedTags.includes(tag.id)
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className="rounded-sm px-3 py-1 text-xs font-medium transition-all"
                          style={{
                            backgroundColor: isSelected
                              ? tag.cor
                              : `${tag.cor}20`,
                            color: isSelected ? "#fff" : tag.cor,
                            border: `1px solid ${tag.cor}`,
                          }}
                        >
                          {tag.nome}
                        </button>
                      )
                    })}
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Seção: UTM (Colapsável) */}
          <Card className="rounded-sm border border-border bg-white p-4 md:p-6">
            <CardHeader className="p-0 pb-4">
              <button
                type="button"
                onClick={() => setIsUtmExpanded(!isUtmExpanded)}
                className="flex w-full items-center justify-between"
              >
                <CardTitle className="text-base font-semibold">UTM</CardTitle>
                {isUtmExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
            </CardHeader>
            {isUtmExpanded && (
              <CardContent className="p-0">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="utmSource">UTM Source</Label>
                    <Input
                      id="utmSource"
                      placeholder="Ex: facebook, google"
                      {...register("utmSource")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="utmMedium">UTM Medium</Label>
                    <Input
                      id="utmMedium"
                      placeholder="Ex: ads, cpc, email"
                      {...register("utmMedium")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="utmCampaign">UTM Campaign</Label>
                    <Input
                      id="utmCampaign"
                      placeholder="Ex: blackfriday2024"
                      {...register("utmCampaign")}
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Seção: Observações */}
          <Card className="rounded-sm border border-border bg-white p-4 md:p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base font-semibold">
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Textarea
                id="observacoes"
                rows={4}
                placeholder="Digite observações sobre o contato..."
                {...register("observacoes")}
              />
            </CardContent>
          </Card>

          {/* Botão Salvar */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              className="bg-[#46347F] hover:bg-[#46347F] text-white"
            >
              Salvar Contato
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
