"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Layers,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Users,
  X,
} from "lucide-react"

import { Sidebar } from "@/components/sidebar"
import { ContactsSubSidebar } from "@/components/contacts/contacts-sub-sidebar"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  MOCK_SEGMENTS,
  SEGMENT_COLORS,
  RULE_FIELDS,
  RULE_OPERATORS,
  evaluateContact,
  type Segment,
  type SegmentRule,
  type RuleField,
  type RuleOperator,
} from "@/lib/mock/segments"
import { MOCK_CONTACTS } from "@/lib/mock/contacts"

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function generateId(): string {
  return `seg-${Date.now()}`
}

function generateRuleId(): string {
  return `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function getRuleDisplayText(rule: SegmentRule): string {
  const field = RULE_FIELDS.find((f) => f.value === rule.field)?.label || rule.field
  const operator = RULE_OPERATORS.find((o) => o.value === rule.operator)?.label || rule.operator
  return `${field} ${operator} ${rule.value}`
}

export default function SegmentosPage() {
  const [segments, setSegments] = useState<Segment[]>(MOCK_SEGMENTS)
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [segmentToDelete, setSegmentToDelete] = useState<Segment | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    cor: SEGMENT_COLORS[0],
    operador: "AND" as "AND" | "OR",
    regras: [] as SegmentRule[],
  })
  const [newRule, setNewRule] = useState<{
    field: RuleField | ""
    operator: RuleOperator | ""
    value: string
  }>({ field: "", operator: "", value: "" })
  const [showRuleForm, setShowRuleForm] = useState(false)

  const filteredSegments = useMemo(() => {
    return segments.filter((segment) =>
      segment.nome.toLowerCase().includes(search.toLowerCase())
    )
  }, [segments, search])

  const previewCount = useMemo(() => {
    if (formData.regras.length === 0) return 0
    return MOCK_CONTACTS.filter((contact) =>
      evaluateContact(contact, formData.regras, formData.operador)
    ).length
  }, [formData.regras, formData.operador])

  const handleCreateClick = () => {
    setEditingSegment(null)
    setFormData({
      nome: "",
      descricao: "",
      cor: SEGMENT_COLORS[0],
      operador: "AND",
      regras: [],
    })
    setNewRule({ field: "", operator: "", value: "" })
    setShowRuleForm(false)
    setIsDialogOpen(true)
  }

  const handleEditClick = (segment: Segment) => {
    setEditingSegment(segment)
    setFormData({
      nome: segment.nome,
      descricao: segment.descricao || "",
      cor: segment.cor,
      operador: segment.operador,
      regras: [...segment.regras],
    })
    setNewRule({ field: "", operator: "", value: "" })
    setShowRuleForm(false)
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (segment: Segment) => {
    setSegmentToDelete(segment)
    setIsDeleteDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.nome.trim()) return

    if (editingSegment) {
      setSegments((prev) =>
        prev.map((s) =>
          s.id === editingSegment.id
            ? {
                ...s,
                nome: formData.nome,
                descricao: formData.descricao,
                cor: formData.cor,
                operador: formData.operador,
                regras: formData.regras,
                contatosCount: previewCount,
                atualizadoEm: new Date().toISOString(),
              }
            : s
        )
      )
    } else {
      const newSegment: Segment = {
        id: generateId(),
        nome: formData.nome,
        descricao: formData.descricao,
        cor: formData.cor,
        operador: formData.operador,
        regras: formData.regras,
        contatosCount: previewCount,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      }
      setSegments((prev) => [...prev, newSegment])
    }
    setIsDialogOpen(false)
  }

  const handleConfirmDelete = () => {
    if (segmentToDelete) {
      setSegments((prev) => prev.filter((s) => s.id !== segmentToDelete.id))
      setIsDeleteDialogOpen(false)
      setSegmentToDelete(null)
    }
  }

  const handleAddRule = () => {
    if (!newRule.field || !newRule.operator) return

    const rule: SegmentRule = {
      id: generateRuleId(),
      field: newRule.field,
      operator: newRule.operator,
      value: newRule.field === "leadScore" ? Number(newRule.value) : newRule.value,
    }

    setFormData((prev) => ({
      ...prev,
      regras: [...prev.regras, rule],
    }))
    setNewRule({ field: "", operator: "", value: "" })
    setShowRuleForm(false)
  }

  const handleRemoveRule = (ruleId: string) => {
    setFormData((prev) => ({
      ...prev,
      regras: prev.regras.filter((r) => r.id !== ruleId),
    }))
  }

  const isValueSelect = newRule.field === "status"
  const isValueNumber = newRule.field === "leadScore"

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-shrink-0">
        <ContactsSubSidebar />
      </div>
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 min-w-0">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Segmentos{" "}
              <span className="text-muted-foreground">
                ({filteredSegments.length} segmentos)
              </span>
            </h1>
          </div>
          <Button
            onClick={handleCreateClick}
            className="bg-[#9795e4] hover:bg-[#7c7ab8] text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Criar Segmento
          </Button>
        </div>

        <Separator className="mb-6" />

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar segmentos..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Grid or Empty State */}
        {filteredSegments.length === 0 ? (
          <Card className="rounded-sm border border-border bg-white py-12">
            <CardContent className="flex flex-col items-center justify-center p-0">
              <Layers className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhum segmento encontrado</p>
              <p className="text-sm text-muted-foreground mb-4">
                Crie um segmento para organizar seus contatos automaticamente
              </p>
              <Button
                onClick={handleCreateClick}
                className="bg-[#9795e4] hover:bg-[#7c7ab8] text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Segmento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSegments.map((segment) => (
              <Card
                key={segment.id}
                className="rounded-sm border border-border bg-white hover:shadow-md transition-shadow overflow-hidden"
                style={{ borderLeftWidth: 4, borderLeftColor: segment.cor }}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between">
                    <span
                      className="inline-flex items-center rounded-sm px-2 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: `${segment.cor}20`,
                        color: segment.cor,
                      }}
                    >
                      {segment.nome}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(segment)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/contatos?segment=${segment.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Contatos
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(segment)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {segment.descricao && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {segment.descricao}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mb-3 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{segment.contatosCount} contatos</span>
                  </div>
                  <div className="space-y-1">
                    {segment.regras.slice(0, 2).map((rule) => (
                      <p key={rule.id} className="text-xs text-muted-foreground">
                        • {getRuleDisplayText(rule)}
                      </p>
                    ))}
                    {segment.regras.length > 2 && (
                      <p className="text-xs text-muted-foreground">
                        + {segment.regras.length - 2} regras
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${segment.cor}10`,
                        color: segment.cor,
                      }}
                    >
                      {segment.operador === "AND" ? "Todas as regras" : "Qualquer regra"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Atualizado {formatDate(segment.atualizadoEm)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSegment ? "Editar Segmento" : "Criar Segmento"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              {/* Section 1: Basic Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Informações Básicas</h4>
                <div className="space-y-2">
                  <Label htmlFor="nome">
                    Nome <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nome"
                    placeholder="Nome do segmento"
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
                    placeholder="Descrição do segmento"
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
                    {SEGMENT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, cor: color })}
                        className={cn(
                          "h-8 w-8 rounded-full transition-all",
                          formData.cor === color
                            ? "ring-2 ring-offset-2 ring-[#9795e4]"
                            : "hover:scale-110"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Operador Lógico</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={formData.operador === "AND" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData({ ...formData, operador: "AND" })}
                      className={cn(
                        formData.operador === "AND" &&
                          "bg-[#9795e4] hover:bg-[#7c7ab8] text-white"
                      )}
                    >
                      Todas as regras (AND)
                    </Button>
                    <Button
                      type="button"
                      variant={formData.operador === "OR" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData({ ...formData, operador: "OR" })}
                      className={cn(
                        formData.operador === "OR" &&
                          "bg-[#9795e4] hover:bg-[#7c7ab8] text-white"
                      )}
                    >
                      Qualquer regra (OR)
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Section 2: Rules */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Regras</h4>

                {/* Existing Rules */}
                {formData.regras.length > 0 && (
                  <div className="space-y-2">
                    {formData.regras.map((rule) => (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between rounded-sm border border-border bg-gray-50 px-3 py-2"
                      >
                        <span className="text-sm">{getRuleDisplayText(rule)}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500"
                          onClick={() => handleRemoveRule(rule.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Rule Button or Form */}
                {!showRuleForm ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRuleForm(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Regra
                  </Button>
                ) : (
                  <div className="rounded-sm border border-border p-3 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <Select
                        value={newRule.field}
                        onValueChange={(value) =>
                          setNewRule({ ...newRule, field: value as RuleField })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Campo" />
                        </SelectTrigger>
                        <SelectContent>
                          {RULE_FIELDS.map((field) => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={newRule.operator}
                        onValueChange={(value) =>
                          setNewRule({ ...newRule, operator: value as RuleOperator })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Operador" />
                        </SelectTrigger>
                        <SelectContent>
                          {RULE_OPERATORS.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {isValueSelect ? (
                        <Select
                          value={newRule.value}
                          onValueChange={(value) =>
                            setNewRule({ ...newRule, value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Valor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ativo">Ativo</SelectItem>
                            <SelectItem value="inativo">Inativo</SelectItem>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="convertido">Convertido</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : isValueNumber ? (
                        <Input
                          type="number"
                          placeholder="Valor"
                          value={newRule.value}
                          onChange={(e) =>
                            setNewRule({ ...newRule, value: e.target.value })
                          }
                        />
                      ) : (
                        <Input
                          placeholder="Valor"
                          value={newRule.value}
                          onChange={(e) =>
                            setNewRule({ ...newRule, value: e.target.value })
                          }
                        />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddRule}
                        disabled={!newRule.field || !newRule.operator}
                      >
                        Adicionar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowRuleForm(false)
                          setNewRule({ field: "", operator: "", value: "" })
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Preview */}
              {formData.regras.length > 0 && (
                <>
                  <Separator />
                  <div className="rounded-sm bg-[#9795e4]/5 p-4">
                    <p className="text-sm font-medium text-[#9795e4]">
                      {previewCount} contato{previewCount !== 1 ? "s" : ""}{" "}
                      corresponde{previewCount === 1 ? "" : "m"} a este segmento
                    </p>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="bg-[#9795e4] hover:bg-[#7c7ab8] text-white"
                disabled={!formData.nome.trim()}
              >
                {editingSegment ? "Salvar" : "Criar Segmento"}
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
              Tem certeza que deseja excluir o segmento &quot;
              <strong>{segmentToDelete?.nome}</strong>&quot;? Esta ação não pode ser
              desfeita.
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
