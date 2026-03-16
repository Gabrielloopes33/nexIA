"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { List, Plus, Search, TrendingUp, Users, MoreVertical, Pencil, Trash2, Eye, Loader2 } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useLists, type List as ListType } from "@/hooks/use-lists"
import { useOrganizationId } from "@/lib/contexts/organization-context"

// Hardcoded colors for lists
const LIST_COLORS = [
  "#46347F", // Primary purple
  "#7b79c4", // Light purple
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#84cc16", // Lime
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#6b7280", // Gray
]

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export default function ListasPage() {
  const organizationId = useOrganizationId() ?? ''
  const { lists, isLoading, createList, updateList, deleteList } = useLists(organizationId)
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingList, setEditingList] = useState<ListType | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [listToDelete, setListToDelete] = useState<ListType | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: LIST_COLORS[0],
  })

  const filteredLists = useMemo(() => {
    return lists.filter(
      (list) =>
        list.name.toLowerCase().includes(search.toLowerCase()) ||
        (list.description?.toLowerCase() || "").includes(search.toLowerCase())
    )
  }, [lists, search])

  const stats = useMemo(() => {
    const totalListas = lists.length
    const totalContatos = lists.reduce(
      (sum, list) => sum + (list._count?.listContacts || 0),
      0
    )
    const maiorLista = lists.reduce(
      (max, list) => ((list._count?.listContacts || 0) > (max._count?.listContacts || 0) ? list : max),
      lists[0]
    )
    return { totalListas, totalContatos, maiorLista }
  }, [lists])

  const handleCreateClick = () => {
    setEditingList(null)
    setFormData({ name: "", description: "", color: LIST_COLORS[0] })
    setIsDialogOpen(true)
  }

  const handleEditClick = (list: ListType) => {
    setEditingList(list)
    setFormData({
      name: list.name,
      description: list.description || "",
      color: list.color,
    })
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (list: ListType) => {
    setListToDelete(list)
    setIsDeleteDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) return

    if (editingList) {
      await updateList(editingList.id, {
        name: formData.name,
        description: formData.description,
        color: formData.color,
      })
    } else {
      await createList({
        name: formData.name,
        description: formData.description,
        color: formData.color,
      })
    }
    setIsDialogOpen(false)
  }

  const handleConfirmDelete = async () => {
    if (listToDelete) {
      await deleteList(listToDelete.id)
      setIsDeleteDialogOpen(false)
      setListToDelete(null)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 min-w-0">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Listas{" "}
              <span className="text-muted-foreground">
                ({filteredLists.length} listas)
              </span>
            </h1>
          </div>
          <Button
            onClick={handleCreateClick}
            className="bg-[#46347F] hover:bg-[#46347F] text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Criar Lista
          </Button>
        </div>

        <Separator className="mb-6" />

        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="rounded-sm border border-border bg-white p-4">
            <CardContent className="flex items-center gap-4 p-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#46347F]/10">
                <List className="h-5 w-5 text-[#46347F]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Listas</p>
                <p className="text-2xl font-bold">{stats.totalListas}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-sm border border-border bg-white p-4">
            <CardContent className="flex items-center gap-4 p-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#46347F]/10">
                <Users className="h-5 w-5 text-[#46347F]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Total de Contatos em Listas
                </p>
                <p className="text-2xl font-bold">{stats.totalContatos}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-sm border border-border bg-white p-4">
            <CardContent className="flex items-center gap-4 p-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#46347F]/10">
                <TrendingUp className="h-5 w-5 text-[#46347F]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Maior Lista</p>
                <p className="text-lg font-bold truncate max-w-[180px]">
                  {stats.maiorLista?.name || "-"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar listas..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#46347F]" />
          </div>
        )}

        {/* Table or Empty State */}
        {!isLoading && (filteredLists.length === 0 ? (
          <Card className="rounded-sm border border-border bg-white py-12">
            <CardContent className="flex flex-col items-center justify-center p-0">
              <List className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhuma lista encontrada</p>
              <p className="text-sm text-muted-foreground mb-4">
                Crie uma lista para organizar seus contatos
              </p>
              <Button
                onClick={handleCreateClick}
                className="bg-[#46347F] hover:bg-[#46347F] text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Lista
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-sm border border-border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Contatos</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLists.map((list) => (
                  <TableRow key={list.id}>
                    <TableCell>
                      <span
                        className="inline-flex items-center rounded-sm px-2 py-1 text-xs font-medium"
                        style={{
                          backgroundColor: `${list.color}20`,
                          color: list.color,
                        }}
                      >
                        {list.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground line-clamp-1 max-w-[250px]">
                        {list.description || "-"}
                      </span>
                    </TableCell>
                    <TableCell>{list._count?.listContacts || 0}</TableCell>
                    <TableCell>{formatDate(list.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEditClick(list)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/contatos?list=${list.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Contatos
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(list)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingList ? "Editar Lista" : "Criar Lista"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nome <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Nome da lista"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descrição da lista"
                  rows={2}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {LIST_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`h-8 w-8 rounded-full transition-all ${
                        formData.color === color
                          ? "ring-2 ring-offset-2 ring-[#46347F]"
                          : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="bg-[#46347F] hover:bg-[#46347F] text-white"
                disabled={!formData.name.trim()}
              >
                {editingList ? "Salvar" : "Criar Lista"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground py-4">
              Tem certeza que deseja excluir a lista &quot;
              <strong>{listToDelete?.name}</strong>&quot;? Esta ação não pode
              ser desfeita.
            </p>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
