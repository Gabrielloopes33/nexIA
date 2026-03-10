"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  List,
  Plus,
  Search,
  TrendingUp,
  Users,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react"

import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { MOCK_LISTS, LIST_COLORS, type ContactList } from "@/lib/mock/lists"

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function generateId(): string {
  return `list-${Date.now()}`
}

export default function ListasPage() {
  const [lists, setLists] = useState<ContactList[]>(MOCK_LISTS)
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingList, setEditingList] = useState<ContactList | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [listToDelete, setListToDelete] = useState<ContactList | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    cor: LIST_COLORS[0],
  })

  const filteredLists = useMemo(() => {
    return lists.filter(
      (list) =>
        list.nome.toLowerCase().includes(search.toLowerCase()) ||
        (list.descricao?.toLowerCase() || "").includes(search.toLowerCase())
    )
  }, [lists, search])

  const stats = useMemo(() => {
    const totalListas = lists.length
    const totalContatos = lists.reduce(
      (sum, list) => sum + list.contatosCount,
      0
    )
    const maiorLista = lists.reduce(
      (max, list) => (list.contatosCount > max.contatosCount ? list : max),
      lists[0]
    )
    return { totalListas, totalContatos, maiorLista }
  }, [lists])

  const handleCreateClick = () => {
    setEditingList(null)
    setFormData({ nome: "", descricao: "", cor: LIST_COLORS[0] })
    setIsDialogOpen(true)
  }

  const handleEditClick = (list: ContactList) => {
    setEditingList(list)
    setFormData({
      nome: list.nome,
      descricao: list.descricao || "",
      cor: list.cor,
    })
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (list: ContactList) => {
    setListToDelete(list)
    setIsDeleteDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.nome.trim()) return

    if (editingList) {
      setLists((prev) =>
        prev.map((l) =>
          l.id === editingList.id
            ? {
                ...l,
                nome: formData.nome,
                descricao: formData.descricao,
                cor: formData.cor,
                atualizadoEm: new Date().toISOString(),
              }
            : l
        )
      )
    } else {
      const newList: ContactList = {
        id: generateId(),
        nome: formData.nome,
        descricao: formData.descricao,
        cor: formData.cor,
        contatosCount: 0,
        contatosIds: [],
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
        criadoPor: "Admin",
      }
      setLists((prev) => [...prev, newList])
    }
    setIsDialogOpen(false)
  }

  const handleConfirmDelete = () => {
    if (listToDelete) {
      setLists((prev) => prev.filter((l) => l.id !== listToDelete.id))
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
                  {stats.maiorLista?.nome || "-"}
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

        {/* Table or Empty State */}
        {filteredLists.length === 0 ? (
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
                          backgroundColor: `${list.cor}20`,
                          color: list.cor,
                        }}
                      >
                        {list.nome}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground line-clamp-1 max-w-[250px]">
                        {list.descricao || "-"}
                      </span>
                    </TableCell>
                    <TableCell>{list.contatosCount}</TableCell>
                    <TableCell>{formatDate(list.criadoEm)}</TableCell>
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
        )}

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
                <Label htmlFor="nome">
                  Nome <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nome"
                  placeholder="Nome da lista"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descrição da lista"
                  rows={2}
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
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
                      onClick={() => setFormData({ ...formData, cor: color })}
                      className={`h-8 w-8 rounded-full transition-all ${
                        formData.cor === color
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
                disabled={!formData.nome.trim()}
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
              <strong>{listToDelete?.nome}</strong>&quot;? Esta ação não pode
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
