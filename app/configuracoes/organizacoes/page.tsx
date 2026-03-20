"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Building2,
  Plus,
  Check,
  AlertCircle,
  Loader2,
  Users,
  Crown,
  ArrowRightLeft,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

const PRIMARY_COLOR = "#46347F"

interface Organization {
  id: string
  name: string
  slug: string
  status: string
  role: string
  joinedAt: string
  isCurrent: boolean
}

export default function OrganizacoesPage() {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isSwitching, setIsSwitching] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ name: "", slug: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Carrega organizações
  useEffect(() => {
    loadOrganizations()
  }, [])

  const loadOrganizations = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/user/organizations")
      if (!res.ok) throw new Error("Erro ao carregar organizações")
      const data = await res.json()
      setOrganizations(data.organizations || [])
    } catch (error) {
      toast.error("Erro ao carregar organizações")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("Nome da organização é obrigatório")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar organização")
      }

      toast.success("Organização criada com sucesso!")
      setIsDialogOpen(false)
      setFormData({ name: "", slug: "" })
      
      // Recarrega e redireciona para dashboard
      await loadOrganizations()
      router.push("/dashboard")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSwitch = async (orgId: string) => {
    setIsSwitching(orgId)
    try {
      const res = await fetch("/api/user/switch-organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Erro ao trocar organização")
      }

      toast.success(`Organização alterada para ${data.organization.name}`)
      router.refresh()
      
      // Recarrega para atualizar o estado
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSwitching(null)
    }
  }

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      OWNER: "bg-amber-100 text-amber-700 border-amber-200",
      ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
      MANAGER: "bg-blue-100 text-blue-700 border-blue-200",
      MEMBER: "bg-gray-100 text-gray-700 border-gray-200",
    }
    const labels: Record<string, string> = {
      OWNER: "Proprietário",
      ADMIN: "Administrador",
      MANAGER: "Gerente",
      MEMBER: "Membro",
    }
    return (
      <Badge variant="outline" className={styles[role] || styles.MEMBER}>
        {role === "OWNER" && <Crown className="w-3 h-3 mr-1" />}
        {labels[role] || role}
      </Badge>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: PRIMARY_COLOR }}>
          Minhas Organizações
        </h1>
        <p className="text-sm text-gray-500">
          Gerencie suas organizações e alterne entre elas
        </p>
      </div>

      {/* Alerta se não tiver organização */}
      {organizations.length === 0 && !isLoading && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Nenhuma organização encontrada</p>
              <p className="text-sm text-amber-700">
                Você precisa criar ou ser convidado para uma organização para usar o sistema.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de organizações */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: PRIMARY_COLOR }} />
          </div>
        ) : (
          organizations.map((org) => (
            <Card
              key={org.id}
              className={`border transition-all ${
                org.isCurrent
                  ? "border-[#46347F] ring-1 ring-[#46347F]"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${PRIMARY_COLOR}15` }}
                    >
                      <Building2 className="h-6 w-6" style={{ color: PRIMARY_COLOR }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{org.name}</h3>
                        {org.isCurrent && (
                          <Badge className="bg-[#46347F] text-white hover:bg-[#46347F]">
                            <Check className="w-3 h-3 mr-1" />
                            Atual
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500">@{org.slug}</span>
                        <span className="text-gray-300">|</span>
                        {getRoleBadge(org.role)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!org.isCurrent ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSwitch(org.id)}
                        disabled={isSwitching === org.id}
                      >
                        {isSwitching === org.id ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <ArrowRightLeft className="w-4 h-4 mr-2" />
                        )}
                        Acessar
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" disabled>
                        <Check className="w-4 h-4 mr-2" />
                        Selecionada
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Separator />

      {/* Criar nova organização */}
      <Card className="border-dashed border-gray-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                <Plus className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Nova Organização</h3>
                <p className="text-sm text-gray-500">
                  Crie uma nova organização para separar dados e equipes
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsDialogOpen(true)}
              style={{ backgroundColor: PRIMARY_COLOR }}
              className="text-white hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de criação */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Criar Nova Organização</DialogTitle>
            <DialogDescription>
              Crie uma nova organização para gerenciar contatos, deals e equipes separadamente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nome da organização <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Ex: Minha Empresa"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (opcional)</Label>
              <Input
                id="slug"
                placeholder="minha-empresa"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                Usado na URL. Se não informado, será gerado automaticamente.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isSubmitting || !formData.name.trim()}
              style={{ backgroundColor: PRIMARY_COLOR }}
              className="text-white hover:opacity-90"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Criar Organização
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
