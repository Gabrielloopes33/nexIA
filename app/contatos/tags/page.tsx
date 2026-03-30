"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Plus, Search, MoreHorizontal, Edit, Trash2, Tag as TagIcon, Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { useTags, type Tag } from "@/hooks/use-tags"
import { useOrganizationId } from "@/lib/contexts/organization-context"

export default function TagsPage() {
  const organizationId = useOrganizationId()
  const { tags, isLoading, createTag, updateTag, deleteTag, error } = useTags(organizationId)
  
  // Debug logs
  console.log('[TagsPage] organizationId:', organizationId)
  console.log('[TagsPage] isLoading:', isLoading)
  console.log('[TagsPage] tags count:', tags.length)
  console.log('[TagsPage] error:', error)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)

  // Form state - simplified: only name and color
  const [formData, setFormData] = useState<Partial<Tag>>({
    name: "",
    color: "#46347F",
  })

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateTag = () => {
    setEditingTag(null)
    setFormData({
      name: "",
      color: "#46347F",
    })
    setIsDialogOpen(true)
  }

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag)
    setFormData({ 
      name: tag.name,
      color: tag.color,
    })
    setIsDialogOpen(true)
  }

  const handleSaveTag = async () => {
    if (!formData.name) return

    let success = false
    if (editingTag) {
      const result = await updateTag(editingTag.id, {
        name: formData.name,
        color: formData.color,
      })
      success = !!result
    } else {
      const result = await createTag({
        name: formData.name,
        color: formData.color || "#46347F",
      })
      success = !!result
    }
    
    if (success) {
      setIsDialogOpen(false)
    } else {
      alert(error || 'Erro ao salvar tag. Verifique se você tem permissão ou se a tag já existe.')
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    if (confirm('Tem certeza que deseja excluir esta tag?')) {
      await deleteTag(tagId)
    }
  }

  const colorOptions = [
    "#46347F",
    "#E57373",
    "#81C784",
    "#64B5F6",
    "#FFB74D",
    "#9575CD",
    "#4DB6AC",
    "#FF8A65",
    "#90A4AE",
    "#F06292",
    "#A1887F",
    "#7986CB",
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Main Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 min-w-0">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tags</h1>
            <p className="text-sm text-muted-foreground">
              {filteredTags.length} tags encontradas
            </p>
          </div>
          <Button
            onClick={handleCreateTag}
            className="gap-2 bg-[#46347F] hover:bg-[#46347F]"
            disabled={!organizationId}
          >
            <Plus className="h-4 w-4" />
            Adicionar Tag
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Error State - No Organization */}
        {!organizationId && !isLoading && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-800">
            <p className="font-medium">Organização não encontrada</p>
            <p className="text-sm">Você precisa estar em uma organização para gerenciar tags.</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#46347F]" />
          </div>
        )}

        {/* Tags Table */}
        {!isLoading && (
          <div className="rounded-sm border border-border bg-white">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[250px]">Nome</TableHead>
                  <TableHead>Contatos</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTags.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                      Nenhuma tag encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTags.map((tag) => (
                    <TableRow key={tag.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <Badge
                            style={{
                              backgroundColor: `${tag.color}20`,
                              color: tag.color,
                              borderColor: tag.color,
                            }}
                            variant="outline"
                          >
                            {tag.name}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{tag._count?.contactTags || 0}</span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditTag(tag)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteTag(tag.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
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
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TagIcon className="h-5 w-5 text-[#46347F]" />
                {editingTag ? "Editar Tag" : "Nova Tag"}
              </DialogTitle>
              <DialogDescription>
                {editingTag
                  ? "Edite as informações da tag."
                  : "Crie uma nova tag para organizar seus contatos."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Tag *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Lead Quente"
                />
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color: color })}
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
                onClick={handleSaveTag}
                className="bg-[#46347F] hover:bg-[#46347F]"
                disabled={!formData.name}
              >
                {editingTag ? "Salvar" : "Criar Tag"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
