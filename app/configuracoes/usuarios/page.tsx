"use client"

import { useState, useMemo } from "react"
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  UserX,
  Loader2,
  RefreshCw,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useOrganizationMembers, OrganizationMember } from "@/hooks/use-organization-members"
import { toast } from "sonner"

// Mapeia roles do backend para labels amigáveis
const roleLabels: Record<string, string> = {
  OWNER: "Proprietário",
  ADMIN: "Admin",
  MANAGER: "Gerente",
  MEMBER: "Membro",
}

// Helper functions
function getRoleBadgeColor(role: string) {
  switch (role) {
    case "OWNER":
      return "bg-[#46347F] text-white hover:bg-[#46347F]/90"
    case "ADMIN":
      return "bg-purple-500 text-white hover:bg-purple-500/90"
    case "MANAGER":
      return "bg-orange-500 text-white hover:bg-orange-500/90"
    case "MEMBER":
      return "bg-blue-500 text-white hover:bg-blue-500/90"
    default:
      return "bg-gray-500 text-white"
  }
}

function getStatusBadgeColor(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-700 border-green-200"
    case "INACTIVE":
      return "bg-gray-100 text-gray-700 border-gray-200"
    case "PENDING":
      return "bg-yellow-100 text-yellow-700 border-yellow-200"
    default:
      return "bg-gray-100 text-gray-700"
  }
}

function formatStatusLabel(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "Ativo"
    case "INACTIVE":
      return "Inativo"
    case "PENDING":
      return "Pendente"
    default:
      return status
  }
}

function formatRelativeDate(date: Date | null | undefined): string {
  if (!date) return "Nunca"
  
  const now = new Date()
  const dateObj = new Date(date)
  const diffInMs = now.getTime() - dateObj.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInMinutes < 1) return "Agora"
  if (diffInMinutes < 60) return `${diffInMinutes} min atrás`
  if (diffInHours < 2) return "1 hora atrás"
  if (diffInHours < 24) return `${diffInHours} horas atrás`
  if (diffInDays === 1) return "Ontem"
  if (diffInDays < 7) return `${diffInDays} dias atrás`
  return dateObj.toLocaleDateString("pt-BR")
}

function getInitials(name: string): string {
  if (!name) return "??"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

// Empty form state
const emptyFormState = {
  name: "",
  email: "",
  password: "",
  role: "MEMBER" as const,
}

export default function UsuariosPage() {
  const { 
    members, 
    isLoading, 
    error, 
    refresh, 
    inviteMember, 
    updateMember, 
    deleteMember 
  } = useOrganizationMembers()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null)
  const [inviteForm, setInviteForm] = useState(emptyFormState)
  const [editForm, setEditForm] = useState({ role: "MEMBER" as const, status: "ACTIVE" as const })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter members based on search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members
    const query = searchQuery.toLowerCase()
    return members.filter(
      (member) =>
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query)
    )
  }, [members, searchQuery])

  // Handle invite member
  const handleInvite = async () => {
    if (!inviteForm.name || !inviteForm.email || !inviteForm.password) return
    
    try {
      setIsSubmitting(true)
      await inviteMember({
        name: inviteForm.name,
        email: inviteForm.email,
        password: inviteForm.password,
        role: inviteForm.role,
      })
      toast.success("Usuário criado com sucesso! Ele já pode fazer login.")
      setInviteForm(emptyFormState)
      setIsInviteOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar usuário")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit member
  const handleEdit = async () => {
    if (!selectedMember) return
    
    try {
      setIsSubmitting(true)
      await updateMember(selectedMember.id, {
        role: editForm.role,
        status: editForm.status,
      })
      toast.success("Usuário atualizado com sucesso!")
      setIsEditOpen(false)
      setSelectedMember(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar usuário")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete member
  const handleDelete = async (memberId: string) => {
    if (!confirm("Tem certeza que deseja remover este membro?")) return
    
    try {
      await deleteMember(memberId)
      toast.success("Usuário removido com sucesso!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover usuário")
    }
  }

  // Handle toggle member status
  const handleToggleStatus = async (member: OrganizationMember) => {
    const newStatus = member.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
    try {
      await updateMember(member.id, { status: newStatus })
      toast.success(`Usuário ${newStatus === "ACTIVE" ? "ativado" : "desativado"} com sucesso!`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar status")
    }
  }

  // Open edit modal
  const openEditModal = (member: OrganizationMember) => {
    setSelectedMember(member)
    setEditForm({
      role: member.role as "OWNER" | "ADMIN" | "MANAGER" | "MEMBER",
      status: member.status as "ACTIVE" | "INACTIVE" | "PENDING",
    })
    setIsEditOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#46347F]" />
        <p className="text-sm text-gray-500">Carregando membros...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-red-500">Erro ao carregar membros: {error}</p>
        <Button onClick={refresh} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "#46347F" }}
        >
          Gerenciar Usuários
        </h1>
        <p className="text-sm text-gray-500">
          Adicione, edite e gerencie os membros da sua equipe
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar usuários..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button
              className="gap-2 text-white"
              style={{ backgroundColor: "#46347F" }}
            >
              <Plus className="h-4 w-4" />
              Criar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar um novo usuário. Ele poderá fazer login imediatamente.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="invite-name">Nome</Label>
                <Input
                  id="invite-name"
                  placeholder="Nome completo"
                  value={inviteForm.name}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invite-email">E-mail *</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="email@empresa.com"
                  value={inviteForm.email}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, email: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invite-password">Senha *</Label>
                <Input
                  id="invite-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={inviteForm.password}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, password: e.target.value })
                  }
                />
                <p className="text-xs text-gray-500">O usuário poderá fazer login com este e-mail e senha</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invite-role">Cargo</Label>
                <Select
                  value={inviteForm.role}
                  onValueChange={(value: "OWNER" | "ADMIN" | "MANAGER" | "MEMBER") =>
                    setInviteForm({ ...inviteForm, role: value })
                  }
                >
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OWNER">Proprietário</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="MANAGER">Gerente</SelectItem>
                    <SelectItem value="MEMBER">Membro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setInviteForm(emptyFormState)
                  setIsInviteOpen(false)
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleInvite}
                disabled={!inviteForm.name || !inviteForm.email || !inviteForm.password || isSubmitting}
                className="text-white"
                style={{ backgroundColor: "#46347F" }}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Criar Usuário"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader className="pb-0" />
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último acesso</TableHead>
                <TableHead className="w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="h-8 w-8 text-gray-300" />
                      <p>Nenhum usuário encontrado</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback
                            className="text-sm font-medium"
                            style={{
                              backgroundColor: "#46347F20",
                              color: "#46347F",
                            }}
                          >
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {member.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {member.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs ${getRoleBadgeColor(member.role)}`}
                      >
                        {roleLabels[member.role] || member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusBadgeColor(member.status)}`}
                      >
                        {formatStatusLabel(member.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatRelativeDate(member.lastAccess)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEditModal(member)}
                            className="gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(member)}
                            className="gap-2"
                          >
                            <UserX className="h-4 w-4" />
                            {member.status === "ACTIVE"
                              ? "Desativar"
                              : "Ativar"}
                          </DropdownMenuItem>
                          {member.role !== "OWNER" && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(member.id)}
                              className="gap-2 text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações de {selectedMember?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nome</Label>
              <p className="text-sm text-gray-600">{selectedMember?.name}</p>
            </div>
            <div className="grid gap-2">
              <Label>E-mail</Label>
              <p className="text-sm text-gray-600">{selectedMember?.email}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-role">Cargo</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(value: "OWNER" | "ADMIN" | "MANAGER" | "MEMBER") =>
                    setEditForm({ ...editForm, role: value })
                  }
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OWNER">Proprietário</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="MANAGER">Gerente</SelectItem>
                    <SelectItem value="MEMBER">Membro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value: "ACTIVE" | "INACTIVE" | "PENDING") =>
                    setEditForm({ ...editForm, status: value })
                  }
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                    <SelectItem value="INACTIVE">Inativo</SelectItem>
                    <SelectItem value="PENDING">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false)
                setSelectedMember(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEdit}
              disabled={isSubmitting}
              className="text-white"
              style={{ backgroundColor: "#46347F" }}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Salvar alterações"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
