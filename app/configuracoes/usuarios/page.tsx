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
  X,
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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

// Types
interface User {
  id: string
  name: string
  email: string
  role: "Admin" | "Vendedor" | "Suporte" | "Gerente"
  status: "Ativo" | "Inativo" | "Pendente"
  lastAccess: Date
  permissions: string[]
}

// Mock data
const mockUsers: User[] = [
  {
    id: "1",
    name: "Ana Silva",
    email: "ana.silva@empresa.com",
    role: "Admin",
    status: "Ativo",
    lastAccess: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    permissions: ["Acessar Pipeline", "Gerenciar Contatos", "Configurações", "Relatórios"],
  },
  {
    id: "2",
    name: "Carlos Mendes",
    email: "carlos.mendes@empresa.com",
    role: "Vendedor",
    status: "Ativo",
    lastAccess: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    permissions: ["Acessar Pipeline", "Gerenciar Contatos"],
  },
  {
    id: "3",
    name: "Fernanda Costa",
    email: "fernanda.costa@empresa.com",
    role: "Suporte",
    status: "Ativo",
    lastAccess: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    permissions: ["Acessar Pipeline", "Gerenciar Contatos", "Chat"],
  },
  {
    id: "4",
    name: "João Pereira",
    email: "joao.pereira@empresa.com",
    role: "Gerente",
    status: "Pendente",
    lastAccess: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    permissions: ["Acessar Pipeline", "Gerenciar Contatos", "Relatórios"],
  },
  {
    id: "5",
    name: "Mariana Souza",
    email: "mariana.souza@empresa.com",
    role: "Vendedor",
    status: "Inativo",
    lastAccess: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    permissions: ["Acessar Pipeline"],
  },
  {
    id: "6",
    name: "Pedro Oliveira",
    email: "pedro.oliveira@empresa.com",
    role: "Suporte",
    status: "Ativo",
    lastAccess: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    permissions: ["Acessar Pipeline", "Gerenciar Contatos", "Chat", "Configurações"],
  },
]

// Available permissions
const availablePermissions = [
  { id: "pipeline", label: "Acessar Pipeline" },
  { id: "contacts", label: "Gerenciar Contatos" },
  { id: "settings", label: "Configurações" },
  { id: "reports", label: "Relatórios" },
  { id: "chat", label: "Chat" },
  { id: "integrations", label: "Integrações" },
  { id: "billing", label: "Faturamento" },
]

// Helper functions
function getRoleBadgeColor(role: User["role"]) {
  switch (role) {
    case "Admin":
      return "bg-[#46347F] text-white hover:bg-[#46347F]/90"
    case "Vendedor":
      return "bg-blue-500 text-white hover:bg-blue-500/90"
    case "Suporte":
      return "bg-green-500 text-white hover:bg-green-500/90"
    case "Gerente":
      return "bg-orange-500 text-white hover:bg-orange-500/90"
    default:
      return "bg-gray-500 text-white"
  }
}

function getStatusBadgeColor(status: User["status"]) {
  switch (status) {
    case "Ativo":
      return "bg-green-100 text-green-700 border-green-200"
    case "Inativo":
      return "bg-gray-100 text-gray-700 border-gray-200"
    case "Pendente":
      return "bg-yellow-100 text-yellow-700 border-yellow-200"
    default:
      return "bg-gray-100 text-gray-700"
  }
}

function formatRelativeDate(date: Date): string {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInMinutes < 1) return "Agora"
  if (diffInMinutes < 60) return `${diffInMinutes} min atrás`
  if (diffInHours < 2) return "1 hora atrás"
  if (diffInHours < 24) return `${diffInHours} horas atrás`
  if (diffInDays === 1) return "Ontem"
  if (diffInDays < 7) return `${diffInDays} dias atrás`
  return date.toLocaleDateString("pt-BR")
}

function getInitials(name: string): string {
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
  role: "Vendedor" as User["role"],
  status: "Ativo" as User["status"],
  permissions: [] as string[],
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [searchQuery, setSearchQuery] = useState("")
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [inviteForm, setInviteForm] = useState(emptyFormState)
  const [editForm, setEditForm] = useState(emptyFormState)

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users
    const query = searchQuery.toLowerCase()
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
    )
  }, [users, searchQuery])

  // Handle invite user
  const handleInvite = () => {
    const newUser: User = {
      id: Date.now().toString(),
      name: inviteForm.name,
      email: inviteForm.email,
      role: inviteForm.role,
      status: "Pendente",
      lastAccess: new Date(),
      permissions: inviteForm.permissions,
    }
    setUsers([...users, newUser])
    setInviteForm(emptyFormState)
    setIsInviteOpen(false)
  }

  // Handle edit user
  const handleEdit = () => {
    if (!selectedUser) return
    const updatedUsers = users.map((user) =>
      user.id === selectedUser.id
        ? {
            ...user,
            name: editForm.name,
            email: editForm.email,
            role: editForm.role,
            status: editForm.status,
            permissions: editForm.permissions,
          }
        : user
    )
    setUsers(updatedUsers)
    setIsEditOpen(false)
    setSelectedUser(null)
  }

  // Handle delete user
  const handleDelete = (userId: string) => {
    setUsers(users.filter((user) => user.id !== userId))
  }

  // Handle toggle user status
  const handleToggleStatus = (userId: string) => {
    setUsers(
      users.map((user) =>
        user.id === userId
          ? {
              ...user,
              status: user.status === "Ativo" ? "Inativo" : "Ativo" as User["status"],
            }
          : user
      )
    )
  }

  // Open edit modal
  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      permissions: user.permissions,
    })
    setIsEditOpen(true)
  }

  // Toggle permission in form
  const togglePermission = (permission: string, isEdit: boolean = false) => {
    const formState = isEdit ? editForm : inviteForm
    const setFormState = isEdit ? setEditForm : setInviteForm

    const newPermissions = formState.permissions.includes(permission)
      ? formState.permissions.filter((p) => p !== permission)
      : [...formState.permissions, permission]

    setFormState({ ...formState, permissions: newPermissions })
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
              Convidar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Convidar Usuário</DialogTitle>
              <DialogDescription>
                Preencha os dados para convidar um novo membro para a equipe.
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
                <Label htmlFor="invite-email">E-mail</Label>
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
                <Label htmlFor="invite-role">Cargo</Label>
                <Select
                  value={inviteForm.role}
                  onValueChange={(value: User["role"]) =>
                    setInviteForm({ ...inviteForm, role: value })
                  }
                >
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Vendedor">Vendedor</SelectItem>
                    <SelectItem value="Suporte">Suporte</SelectItem>
                    <SelectItem value="Gerente">Gerente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3">
                <Label>Permissões</Label>
                <div className="grid grid-cols-2 gap-3">
                  {availablePermissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`invite-${permission.id}`}
                        checked={inviteForm.permissions.includes(
                          permission.label
                        )}
                        onCheckedChange={() =>
                          togglePermission(permission.label, false)
                        }
                      />
                      <Label
                        htmlFor={`invite-${permission.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {permission.label}
                      </Label>
                    </div>
                  ))}
                </div>
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
                disabled={!inviteForm.name || !inviteForm.email}
                className="text-white"
                style={{ backgroundColor: "#46347F" }}
              >
                Convidar
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
              {filteredUsers.length === 0 ? (
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
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
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
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {user.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs ${getRoleBadgeColor(user.role)}`}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusBadgeColor(user.status)}`}
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatRelativeDate(user.lastAccess)}
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
                            onClick={() => openEditModal(user)}
                            className="gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(user.id)}
                            className="gap-2"
                          >
                            <UserX className="h-4 w-4" />
                            {user.status === "Ativo"
                              ? "Desativar"
                              : "Ativar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(user.id)}
                            variant="destructive"
                            className="gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
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
              Atualize as informações do usuário {selectedUser?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                placeholder="Nome completo"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="email@empresa.com"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-role">Cargo</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(value: User["role"]) =>
                    setEditForm({ ...editForm, role: value })
                  }
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Vendedor">Vendedor</SelectItem>
                    <SelectItem value="Suporte">Suporte</SelectItem>
                    <SelectItem value="Gerente">Gerente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value: User["status"]) =>
                    setEditForm({ ...editForm, status: value })
                  }
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3">
              <Label>Permissões</Label>
              <div className="grid grid-cols-2 gap-3">
                {availablePermissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`edit-${permission.id}`}
                      checked={editForm.permissions.includes(permission.label)}
                      onCheckedChange={() =>
                        togglePermission(permission.label, true)
                      }
                    />
                    <Label
                      htmlFor={`edit-${permission.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {permission.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false)
                setSelectedUser(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!editForm.name || !editForm.email}
              className="text-white"
              style={{ backgroundColor: "#46347F" }}
            >
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
