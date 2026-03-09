"use client"

import { useState, useMemo } from "react"
import {
  Plus,
  CheckCircle2,
  Minus,
  MoreVertical,
  Pencil,
  Trash2,
  Settings,
  Type,
  Hash,
  Calendar,
  ChevronDown,
  ToggleLeft,
  Link,
  X,
} from "lucide-react"

import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  DEFAULT_FIELDS,
  MOCK_CUSTOM_FIELDS,
  FIELD_TYPE_LABELS,
  FIELD_TYPE_COLORS,
  type CustomField,
  type FieldType,
} from "@/lib/mock/custom-fields"

const FIELD_TYPES: FieldType[] = ["texto", "numero", "data", "selecao", "booleano", "url"]

function getFieldIcon(tipo: FieldType) {
  switch (tipo) {
    case "texto":
      return Type
    case "numero":
      return Hash
    case "data":
      return Calendar
    case "selecao":
      return ChevronDown
    case "booleano":
      return ToggleLeft
    case "url":
      return Link
  }
}

function slugify(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 50)
}

function generateId(): string {
  return `cf-${Date.now()}`
}

export default function CamposPage() {
  const [customFields, setCustomFields] = useState<CustomField[]>(MOCK_CUSTOM_FIELDS)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<CustomField | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [fieldToDelete, setFieldToDelete] = useState<CustomField | null>(null)
  const [formData, setFormData] = useState({
    label: "",
    tipo: "texto" as FieldType,
    obrigatorio: false,
    descricao: "",
    opcoes: [] as string[],
  })
  const [newOption, setNewOption] = useState("")

  const handleCreateClick = () => {
    setEditingField(null)
    setFormData({
      label: "",
      tipo: "texto",
      obrigatorio: false,
      descricao: "",
      opcoes: [],
    })
    setNewOption("")
    setIsDialogOpen(true)
  }

  const handleEditClick = (field: CustomField) => {
    setEditingField(field)
    setFormData({
      label: field.label,
      tipo: field.tipo,
      obrigatorio: field.obrigatorio,
      descricao: field.descricao || "",
      opcoes: field.opcoes || [],
    })
    setNewOption("")
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (field: CustomField) => {
    setFieldToDelete(field)
    setIsDeleteDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.label.trim()) return

    if (editingField) {
      setCustomFields((prev) =>
        prev.map((f) =>
          f.id === editingField.id
            ? {
                ...f,
                label: formData.label,
                nome: slugify(formData.label),
                tipo: formData.tipo,
                obrigatorio: formData.obrigatorio,
                descricao: formData.descricao,
                opcoes: formData.tipo === "selecao" ? formData.opcoes : undefined,
              }
            : f
        )
      )
    } else {
      const newField: CustomField = {
        id: generateId(),
        nome: slugify(formData.label),
        label: formData.label,
        tipo: formData.tipo,
        obrigatorio: formData.obrigatorio,
        descricao: formData.descricao,
        opcoes: formData.tipo === "selecao" ? formData.opcoes : undefined,
        ordem: customFields.length + 1,
        criadoEm: new Date().toISOString(),
      }
      setCustomFields((prev) => [...prev, newField])
    }
    setIsDialogOpen(false)
  }

  const handleConfirmDelete = () => {
    if (fieldToDelete) {
      setCustomFields((prev) => prev.filter((f) => f.id !== fieldToDelete.id))
      setIsDeleteDialogOpen(false)
      setFieldToDelete(null)
    }
  }

  const handleAddOption = () => {
    if (newOption.trim() && !formData.opcoes.includes(newOption.trim())) {
      setFormData((prev) => ({
        ...prev,
        opcoes: [...prev.opcoes, newOption.trim()],
      }))
      setNewOption("")
    }
  }

  const handleRemoveOption = (option: string) => {
    setFormData((prev) => ({
      ...prev,
      opcoes: prev.opcoes.filter((o) => o !== option),
    }))
  }

  const nomeGerado = useMemo(() => slugify(formData.label), [formData.label])

  const FieldIcon = getFieldIcon(formData.tipo)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 min-w-0">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Campos Personalizados
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Adicione campos extras para armazenar informações específicas do seu negócio
            </p>
          </div>
          <Button
            onClick={handleCreateClick}
            className="bg-[#9795e4] hover:bg-[#7c7ab8] text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Criar Campo
          </Button>
        </div>

        <Separator className="mb-6" />

        {/* Seção: Campos Padrão */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-lg font-semibold">Campos Padrão</h2>
            <Badge variant="secondary">Sistema</Badge>
          </div>

          <Card className="bg-muted/30">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campo</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Obrigatório</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DEFAULT_FIELDS.map((field) => {
                    const Icon = getFieldIcon(field.tipo)
                    return (
                      <TableRow key={field.nome}>
                        <TableCell className="font-medium">{field.nome}</TableCell>
                        <TableCell>{field.label}</TableCell>
                        <TableCell>
                          <span
                            className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs font-medium"
                            style={{
                              backgroundColor: `${FIELD_TYPE_COLORS[field.tipo]}20`,
                              color: FIELD_TYPE_COLORS[field.tipo],
                            }}
                          >
                            <Icon className="h-3 w-3" />
                            {FIELD_TYPE_LABELS[field.tipo]}
                          </span>
                        </TableCell>
                        <TableCell>
                          {field.obrigatorio ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <Minus className="h-5 w-5 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {field.descricao}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground mt-2">
            Estes campos não podem ser modificados
          </p>
        </div>

        {/* Seção: Campos Personalizados */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Campos Personalizados</h2>

          {customFields.length === 0 ? (
            <Card className="py-12">
              <CardContent className="flex flex-col items-center justify-center p-0">
                <Settings className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Nenhum campo personalizado</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Crie campos personalizados para armazenar informações extras dos seus contatos
                </p>
                <Button
                  onClick={handleCreateClick}
                  className="bg-[#9795e4] hover:bg-[#7c7ab8] text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Campo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Label</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Obrigatório</TableHead>
                      <TableHead>Opções</TableHead>
                      <TableHead className="w-[80px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customFields.map((field) => {
                      const Icon = getFieldIcon(field.tipo)
                      return (
                        <TableRow key={field.id}>
                          <TableCell className="font-medium">{field.label}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                              {field.nome}
                            </code>
                          </TableCell>
                          <TableCell>
                            <span
                              className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs font-medium"
                              style={{
                                backgroundColor: `${FIELD_TYPE_COLORS[field.tipo]}20`,
                                color: FIELD_TYPE_COLORS[field.tipo],
                              }}
                            >
                              <Icon className="h-3 w-3" />
                              {FIELD_TYPE_LABELS[field.tipo]}
                            </span>
                          </TableCell>
                          <TableCell>
                            {field.obrigatorio ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <Minus className="h-5 w-5 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {field.opcoes?.join(", ") || "-"}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditClick(field)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(field)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Dialog criar/editar */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>
                {editingField ? "Editar Campo" : "Criar Campo Personalizado"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="label">
                  Label <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="label"
                  placeholder="Ex: Preferência de Contato"
                  value={formData.label}
                  onChange={(e) =>
                    setFormData({ ...formData, label: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Nome interno: <code className="bg-gray-100 px-1">{nomeGerado || "-"}</code>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">
                  Tipo <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tipo: value as FieldType })
                  }
                >
                  <SelectTrigger id="tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((tipo) => {
                      const Icon = getFieldIcon(tipo)
                      return (
                        <SelectItem key={tipo} value={tipo}>
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {FIELD_TYPE_LABELS[tipo]}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {formData.tipo === "selecao" && (
                <div className="space-y-2 rounded-lg border border-border p-3">
                  <Label>Opções</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Adicionar opção"
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddOption()}
                    />
                    <Button type="button" size="sm" onClick={handleAddOption}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.opcoes.map((option) => (
                      <span
                        key={option}
                        className="inline-flex items-center gap-1 rounded-sm bg-gray-100 px-2 py-1 text-xs"
                      >
                        {option}
                        <button
                          onClick={() => handleRemoveOption(option)}
                          className="text-muted-foreground hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Switch
                  id="obrigatorio"
                  checked={formData.obrigatorio}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, obrigatorio: checked })
                  }
                />
                <Label htmlFor="obrigatorio">Campo obrigatório</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  placeholder="Descrição do campo"
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                />
              </div>

              {/* Preview */}
              <div className="rounded-lg border border-border bg-gray-50 p-4">
                <p className="text-xs text-muted-foreground mb-3">
                  Como aparecerá no formulário:
                </p>
                <div className="space-y-2">
                  <Label className="text-sm">
                    {formData.label || "Label do campo"}
                    {formData.obrigatorio && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {formData.tipo === "selecao" ? (
                    <Select disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </Select>
                  ) : formData.tipo === "booleano" ? (
                    <div className="flex items-center gap-2">
                      <Switch disabled />
                      <span className="text-sm text-muted-foreground">Sim/Não</span>
                    </div>
                  ) : (
                    <Input
                      disabled
                      placeholder={`Ex: ${
                        formData.tipo === "numero"
                          ? "123"
                          : formData.tipo === "data"
                          ? "01/01/2024"
                          : formData.tipo === "url"
                          ? "https://exemplo.com"
                          : "Texto"
                      }`}
                    />
                  )}
                  {formData.descricao && (
                    <p className="text-xs text-muted-foreground">
                      {formData.descricao}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="bg-[#9795e4] hover:bg-[#7c7ab8] text-white"
                disabled={!formData.label.trim() || (formData.tipo === "selecao" && formData.opcoes.length === 0)}
              >
                {editingField ? "Salvar" : "Criar Campo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog confirmação de exclusão */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground py-4">
              Tem certeza que deseja excluir o campo &quot;
              <strong>{fieldToDelete?.label}</strong>&quot;? Esta ação não pode ser
              desfeita e todos os dados preenchidos neste campo serão perdidos.
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
