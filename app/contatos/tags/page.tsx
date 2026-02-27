"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { ContactsSubSidebar } from "@/components/contacts/contacts-sub-sidebar"
import { MOCK_TAGS, Tag, UTM_SOURCES, UTM_MEDIUMS } from "@/lib/mock/tags"
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
import { Plus, Search, MoreHorizontal, Edit, Trash2, Tag, Target, Bot, Filter } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>(MOCK_TAGS)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)

  // Form state
  const [formData, setFormData] = useState<Partial<Tag>>({
    nome: "",
    cor: "#9795e4",
    leadScore: 50,
    automatizacao: false,
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
  })

  const filteredTags = tags.filter((tag) =>
    tag.nome.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateTag = () => {
    setEditingTag(null)
    setFormData({
      nome: "",
      cor: "#9795e4",
      leadScore: 50,
      automatizacao: false,
      utmSource: "",
      utmMedium: "",
      utmCampaign: "",
    })
    setIsDialogOpen(true)
  }

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag)
    setFormData({ ...tag })
    setIsDialogOpen(true)
  }

  const handleSaveTag = () => {
    if (!formData.nome) return

    if (editingTag) {
      // Update existing
      setTags(
        tags.map((t) =>
          t.id === editingTag.id
            ? { ...t, ...formData, updatedAt: new Date().toISOString() }
            : t
        )
      )
    } else {
      // Create new
      const newTag: Tag = {
        id: `tag-${Date.now()}`,
        nome: formData.nome,
        cor: formData.cor || "#9795e4",
        leadScore: formData.leadScore || 50,
        contatosCount: 0,
        automatizacao: formData.automatizacao || false,
        utmSource: formData.utmSource,
        utmMedium: formData.utmMedium,
        utmCampaign: formData.utmCampaign,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setTags([...tags, newTag])
    }
    setIsDialogOpen(false)
  }

  const handleDeleteTag = (tagId: string) => {
    setTags(tags.filter((t) => t.id !== tagId))
  }

  const colorOptions = [
    "#9795e4",
    "#7c7ab8",
    "#b3b3e5",
    "#a5a3d9",
    "#7573b8",
    "#9b99d1",
    "#8a88c7",
    "#c4c3ea",
    "#E57373",
    "#81C784",
    "#64B5F6",
    "#FFB74D",
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Main Sidebar */}
      <Sidebar />

      {/* Contacts Sub-Sidebar */}
      <ContactsSubSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 ml-[292px]">
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
            className="gap-2 bg-[#9795e4] hover:bg-[#7c7ab8]"
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

        {/* Tags Table */}
        <div className="rounded-sm border border-border bg-white">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[250px]">Nome</TableHead>
                <TableHead>Lead Score</TableHead>
                <TableHead>Contatos</TableHead>
                <TableHead>Automação</TableHead>
                <TableHead>UTM Source</TableHead>
                <TableHead>UTM Medium</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTags.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
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
                          style={{ backgroundColor: tag.cor }}
                        />
                        <Badge
                          style={{
                            backgroundColor: `${tag.cor}20`,
                            color: tag.cor,
                            borderColor: tag.cor,
                          }}
                          variant="outline"
                        >
                          {tag.nome}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{tag.leadScore}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{tag.contatosCount}</span>
                    </TableCell>
                    <TableCell>
                      {tag.automatizacao ? (
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <Bot className="h-4 w-4" />
                          <span className="text-xs font-medium">Sim</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Não</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {tag.utmSource || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {tag.utmMedium || "-"}
                      </span>
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

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-[#9795e4]" />
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
                <Label htmlFor="nome">Nome da Tag *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
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
                      onClick={() => setFormData({ ...formData, cor: color })}
                      className={`h-8 w-8 rounded-full transition-all ${
                        formData.cor === color
                          ? "ring-2 ring-offset-2 ring-[#9795e4]"
                          : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Lead Score */}
              <div className="space-y-2">
                <Label htmlFor="leadScore">
                  Lead Score ({formData.leadScore})
                </Label>
                <input
                  id="leadScore"
                  type="range"
                  min="0"
                  max="100"
                  value={formData.leadScore}
                  onChange={(e) =>
                    setFormData({ ...formData, leadScore: parseInt(e.target.value) })
                  }
                  className="w-full accent-[#9795e4]"
                />
                <p className="text-xs text-muted-foreground">
                  Quanto maior o score, mais qualificado é o contato
                </p>
              </div>

              {/* Automation */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-[#9795e4]" />
                  <div>
                    <p className="text-sm font-medium">Automação</p>
                    <p className="text-xs text-muted-foreground">
                      Ativar automações para esta tag
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.automatizacao}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, automatizacao: checked })
                  }
                />
              </div>

              {/* UTM Section */}
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-[#9795e4]" />
                  <p className="text-sm font-medium">Configuração UTM</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="utmSource">UTM Source</Label>
                  <Select
                    value={formData.utmSource}
                    onValueChange={(value) =>
                      setFormData({ ...formData, utmSource: value })
                    }
                  >
                    <SelectTrigger id="utmSource">
                      <SelectValue placeholder="Selecione a origem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {UTM_SOURCES.map((source) => (
                        <SelectItem key={source.value} value={source.value}>
                          {source.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="utmMedium">UTM Medium</Label>
                  <Select
                    value={formData.utmMedium}
                    onValueChange={(value) =>
                      setFormData({ ...formData, utmMedium: value })
                    }
                  >
                    <SelectTrigger id="utmMedium">
                      <SelectValue placeholder="Selecione o meio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {UTM_MEDIUMS.map((medium) => (
                        <SelectItem key={medium.value} value={medium.value}>
                          {medium.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="utmCampaign">UTM Campaign</Label>
                  <Input
                    id="utmCampaign"
                    value={formData.utmCampaign}
                    onChange={(e) =>
                      setFormData({ ...formData, utmCampaign: e.target.value })
                    }
                    placeholder="Ex: blackfriday2024"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveTag}
                className="bg-[#9795e4] hover:bg-[#7c7ab8]"
                disabled={!formData.nome}
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
