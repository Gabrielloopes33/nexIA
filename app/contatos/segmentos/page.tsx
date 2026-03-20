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
  Loader2,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useContacts } from "@/hooks/use-contacts"
import { useSegments, type SegmentRule } from "@/hooks/use-segments"
import { useOrganizationId } from "@/lib/contexts/organization-context"

// Types defined locally
type RuleField = "nome" | "email" | "telefone" | "status" | "tags" | "origem"
type RuleOperator = "equals" | "contains" | "startsWith" | "endsWith" | "notEquals"

interface LocalSegmentRule {
  id: string
  field: RuleField
  operator: RuleOperator
  value: string
}

interface LocalSegment {
  id: string
  nome: string
  descricao?: string
  cor: string
  operador: "AND" | "OR"
  regras: LocalSegmentRule[]
  contatosCount: number
  criadoEm: string
  atualizadoEm: string
}

// Constants defined locally
const SEGMENT_COLORS = [
  "#46347F", // Purple
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#84cc16", // Lime
  "#f97316", // Orange
]

const RULE_FIELDS = [
  { value: "nome", label: "Nome" },
  { value: "email", label: "Email" },
  { value: "telefone", label: "Telefone" },
  { value: "status", label: "Status" },
  { value: "tags", label: "Tags" },
  { value: "origem", label: "Origem" },
]

const RULE_OPERATORS = [
  { value: "equals", label: "é igual a" },
  { value: "contains", label: "contém" },
  { value: "startsWith", label: "começa com" },
  { value: "endsWith", label: "termina com" },
  { value: "notEquals", label: "não é igual a" },
]

// Empty initial state
const INITIAL_SEGMENTS: Segment[] = []

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

function getRuleDisplayText(rule: LocalSegmentRule): string {
  const field = RULE_FIELDS.find((f) => f.value === rule.field)?.label || rule.field
  const operator = RULE_OPERATORS.find((o) => o.value === rule.operator)?.label || rule.operator
  return `${field} ${operator} ${rule.value}`
}

// Simple evaluation function for preview
function evaluateContact(contact: any, rules: LocalSegmentRule[], operator: "AND" | "OR"): boolean {
  if (rules.length === 0) return false

  const results = rules.map(rule => {
    const contactValue = contact[rule.field] || ""
    const ruleValue = rule.value.toLowerCase()
    const contactValStr = String(contactValue).toLowerCase()

    switch (rule.operator) {
      case "equals": return contactValStr === ruleValue
      case "contains": return contactValStr.includes(ruleValue)
      case "startsWith": return contactValStr.startsWith(ruleValue)
      case "endsWith": return contactValStr.endsWith(ruleValue)
      case "notEquals": return contactValStr !== ruleValue
      default: return false
    }
  })

  return operator === "AND" ? results.every(r => r) : results.some(r => r)
}

export default function SegmentosPage() {
  const organizationId = useOrganizationId()
  const { contacts } = useContacts(organizationId ?? '')
  const { segments: apiSegments, isLoading, createSegment, updateSegment, deleteSegment } = useSegments(organizationId)

  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSegment, setEditingSegment] = useState<LocalSegment | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [segmentToDelete, setSegmentToDelete] = useState<LocalSegment | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    cor: SEGMENT_COLORS[0],
    operador: "AND" as "AND" | "OR",
    regras: [] as LocalSegmentRule[],
  })
  const [newRule, setNewRule] = useState<{
    field: RuleField | ""
    operator: RuleOperator | ""
    value: string
  }>({ field: "", operator: "", value: "" })
  const [showRuleForm, setShowRuleForm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Convert API segments to local format
  const segments: LocalSegment[] = useMemo(() => {
    return apiSegments.map(s => ({
      id: s.id,
      nome: s.name,
      descricao: s.description || undefined,
      cor: s.color || '#46347F',
      operador: (s.operator as "AND" | "OR") || 'AND',
      regras: (s.rules as LocalSegmentRule[]) || [],
      contatosCount: s.contactCount,
      criadoEm: s.createdAt,
      atualizadoEm: s.updatedAt,
    }))
  }, [apiSegments])

  const filteredSegments = useMemo(() => {
    return segments.filter((segment) =>
      segment.nome.toLowerCase().includes(search.toLowerCase())
    )
  }, [segments, search])

  const previewCount = useMemo(() => {
    if (formData.regras.length === 0) return 0
    return contacts.filter((contact) =>
      evaluateContact(contact, formData.regras, formData.operador)
    ).length
  }, [formData.regras, formData.operador, contacts])

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

  const handleSave = async () => {
    if (!formData.nome.trim()) return
    
    setIsSaving(true)
    try {
      if (editingSegment) {
        await updateSegment(editingSegment.id, {
          name: formData.nome,
          description: formData.descricao,
          color: formData.cor,
          operator: formData.operador,
          rules: formData.regras as SegmentRule[],
          contactCount: previewCount,
        })
      } else {
        await createSegment({
          name: formData.nome,
          description: formData.descricao,
          color: formData.cor,
          operator: formData.operador,
          rules: formData.regras as SegmentRule[],
          contactCount: previewCount,
        })
      }
      setIsDialogOpen(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (segmentToDelete) {
      await deleteSegment(segmentToDelete.id)
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
      value: newRule.value,
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
  const isValueNumber = false

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

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
            className="bg-[#46347F] hover:bg-[#46347F] text-white"
            disabled={!organizationId || isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
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

        {/* Error State - No Organization */}
        {!organizationId && !isLoading && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-800">
            <p className="font-medium">Organização não encontrada</p>
            <p className="text-sm">Você precisa estar em uma organização para gerenciar segmentos.</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#46347F]" />
          </div>
        )}

        {/* Grid or Empty State */}
        {!isLoading && filteredSegments.length === 0 ? (
          <Card className="rounded-sm border border-border bg-white py-12">
            <CardContent className="flex flex-col items-center justify-center p-0">
              <Layers className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhum segmento encontrado</p>
              <p className="text-sm text-muted-foreground mb-4">
                Crie um segmento para organizar seus contatos automaticamente
              </p>
              <Button
                onClick={handleCreateClick}
                className="bg-[#46347F] hover:bg-[#46347F] text-white"
                disabled={!organizationId}
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
                            ? "ring-2 ring-offset-2 ring-[#46347F]"
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
                          "bg-[#46347F] hover:bg-[#46347F] text-white"
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
                          "bg-[#46347F] hover:bg-[#46347F] text-white"
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
                            <SelectItem value="ACTIVE">Ativo</SelectItem>
                            <SelectItem value="INACTIVE">Inativo</SelectItem>
                            <SelectItem value="BLOCKED">Bloqueado</SelectItem>
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
                  <div className="rounded-sm bg-[#46347F]/5 p-4">
                    <p className="text-sm font-medium text-[#46347F]">
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
                className="bg-[#46347F] hover:bg-[#46347F] text-white"
                disabled={!formData.nome.trim() || isSaving}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : editingSegment ? (
                  "Salvar"
                ) : (
                  "Criar Segmento"
                )}
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
