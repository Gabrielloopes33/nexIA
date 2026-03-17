"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useTags } from "@/hooks/use-tags"
import { useContacts } from "@/hooks/use-contacts"
import { useOrganization } from "@/lib/contexts/organization-context"

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

// Updated schema for API Contact type
const contactSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().email("Email inválido").optional(),
  empresa: z.string().optional(),
  cargo: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  instagram: z.string().optional(),
  linkedin: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]),
  origem: z.string().optional(),
  tags: z.array(z.string()).default([]),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  observacoes: z.string().optional(),
})

type ContactFormData = z.infer<typeof contactSchema>

export default function NovoContatoPage() {
  const router = useRouter()
  const { organization, isLoading: isLoadingOrg } = useOrganization()
  const organizationId = organization?.id || null
  const [isUtmExpanded, setIsUtmExpanded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { tags, isLoading: tagsLoading } = useTags(organizationId || '')
  const { createContact } = useContacts(organizationId || undefined)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      status: "ACTIVE",
      tags: [],
    },
  })

  const selectedTags = watch("tags") || []

  const toggleTag = (tagId: string) => {
    const currentTags = selectedTags
    if (currentTags.includes(tagId)) {
      setValue("tags", currentTags.filter((id) => id !== tagId))
    } else {
      setValue("tags", [...currentTags, tagId])
    }
  }

  const onSubmit = async (data: ContactFormData) => {
    if (!organizationId) {
      toast.error("Organização não carregada. Aguarde e tente novamente.")
      return
    }

    // Build metadata from extra fields
    const metadata: Record<string, unknown> = {}
    if (data.email) metadata.email = data.email
    if (data.empresa) metadata.company = data.empresa
    if (data.cargo) metadata.jobTitle = data.cargo
    if (data.cidade) metadata.city = data.cidade
    if (data.estado) metadata.state = data.estado
    if (data.instagram) metadata.instagram = data.instagram
    if (data.linkedin) metadata.linkedin = data.linkedin
    if (data.origem) metadata.source = data.origem
    if (data.utmSource) metadata.utmSource = data.utmSource
    if (data.utmMedium) metadata.utmMedium = data.utmMedium
    if (data.utmCampaign) metadata.utmCampaign = data.utmCampaign
    if (data.observacoes) metadata.notes = data.observacoes

    setIsSubmitting(true)
    try {
      const newContact = await createContact({
        name: data.name,
        phone: data.phone,
        status: data.status,
        tags: data.tags,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      })

      if (newContact) {
        toast.success("Contato criado com sucesso!")
        router.push("/contatos")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao criar contato"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
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
                {/* Nome */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">
                    Nome <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Digite o nome completo"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500">{errors.name.message}</p>
                  )}
                </div>

                {/* Telefone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Telefone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    placeholder="+55 (00) 00000-0000"
                    {...register("phone")}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-500">{errors.phone.message}</p>
                  )}
                </div>

                {/* Email - now optional and in metadata */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
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
                    defaultValue="ACTIVE"
                    onValueChange={(value: "ACTIVE" | "INACTIVE" | "BLOCKED") =>
                      setValue("status", value)
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Ativo</SelectItem>
                      <SelectItem value="INACTIVE">Inativo</SelectItem>
                      <SelectItem value="BLOCKED">Bloqueado</SelectItem>
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

                {/* Tags */}
                <div className="space-y-3 md:col-span-2">
                  <Label>Tags</Label>
                  {tagsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando tags...
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => {
                        const isSelected = selectedTags.includes(tag.id)
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleTag(tag.id)}
                            className="rounded-sm px-3 py-1 text-xs font-medium transition-all"
                            style={{
                              backgroundColor: isSelected ? tag.color : `${tag.color}20`,
                              color: isSelected ? "#fff" : tag.color,
                              border: `1px solid ${tag.color}`,
                            }}
                          >
                            {tag.name}
                          </button>
                        )
                      })}
                    </div>
                  )}
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
              disabled={isSubmitting || isLoadingOrg || !organizationId}
            >
              {isLoadingOrg ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Carregando...
                </>
              ) : isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Contato"
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
