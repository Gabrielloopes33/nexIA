"use client"

import { useState, useMemo } from "react"
import {
  Download,
  FileText,
  FileSpreadsheet,
  Check,
  RotateCcw,
  History,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useContacts } from "@/hooks/use-contacts"
import { useTags } from "@/hooks/use-tags"
import { useOrganizationId } from "@/lib/contexts/organization-context"

// Updated status options to match API
const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "INACTIVE", label: "Inativo" },
  { value: "BLOCKED", label: "Bloqueado" },
]

const EXPORTABLE_FIELDS = [
  { key: "name", label: "Nome" },
  { key: "phone", label: "Telefone" },
  { key: "email", label: "Email (Metadata)" },
  { key: "status", label: "Status" },
  { key: "leadScore", label: "Lead Score" },
  { key: "createdAt", label: "Data de Criação" },
  { key: "updatedAt", label: "Última Atualização" },
  { key: "source", label: "Origem (Metadata)" },
]

interface ExportHistory {
  id: string
  data: string
  contatos: number
  campos: number
  formato: "csv" | "xlsx"
  filtros: string
}

export default function ExportarPage() {
  const organizationId = useOrganizationId() ?? ''
  const { contacts, total, isLoading } = useContacts(organizationId)
  const { tags, isLoading: tagsLoading } = useTags(organizationId)

  // Filtros
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Campos
  const [selectedFields, setSelectedFields] = useState<string[]>([
    "name",
    "phone",
    "email",
  ])

  // Formato
  const [format, setFormat] = useState<"csv" | "xlsx">("csv")
  const [separator, setSeparator] = useState<"," | ";">(",")
  const [includeHeader, setIncludeHeader] = useState(true)

  // Histórico
  const [history, setHistory] = useState<ExportHistory[]>([])

  // Calcular contatos filtrados
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      // Filtro de status
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(contact.status)) {
        return false
      }

      // Filtro de tags
      if (selectedTags.length > 0 && !selectedTags.some((tag) => contact.tags.includes(tag))) {
        return false
      }

      return true
    })
  }, [contacts, selectedStatuses, selectedTags])

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    )
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    )
  }

  const toggleField = (fieldKey: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldKey)
        ? prev.filter((f) => f !== fieldKey)
        : [...prev, fieldKey]
    )
  }

  const selectAllFields = () => {
    setSelectedFields(EXPORTABLE_FIELDS.map((f) => f.key))
  }

  const clearFields = () => {
    setSelectedFields([])
  }

  const handleExport = () => {
    if (filteredContacts.length === 0) return

    // Criar descrição dos filtros
    const filtrosParts: string[] = []
    if (selectedStatuses.length > 0) {
      filtrosParts.push(`Status: ${selectedStatuses.map((s) => STATUS_OPTIONS.find((o) => o.value === s)?.label).join(", ")}`)
    }
    if (selectedTags.length > 0) {
      filtrosParts.push(`Tags: ${selectedTags.length} selecionadas`)
    }
    const filtrosDesc = filtrosParts.join(", ") || "Sem filtros"

    // Adicionar ao histórico
    const newExport: ExportHistory = {
      id: `exp-${Date.now()}`,
      data: new Date().toISOString(),
      contatos: filteredContacts.length,
      campos: selectedFields.length,
      formato: format,
      filtros: filtrosDesc,
    }
    setHistory((prev) => [newExport, ...prev])

    toast.success(`${filteredContacts.length} contatos exportados com sucesso`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 min-w-0">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Exportar Contatos</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Selecione os filtros e campos para exportar seus contatos
          </p>
        </div>

        <Separator className="mb-6" />

        {/* Layout 2 colunas */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          {/* Coluna Esquerda */}
          <div className="space-y-6">
            {/* Card 1: Filtrar Contatos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Filtrar Contatos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Status */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex flex-wrap gap-3">
                    {STATUS_OPTIONS.map((status) => (
                      <label
                        key={status.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedStatuses.includes(status.value)}
                          onCheckedChange={() => toggleStatus(status.value)}
                        />
                        <span className="text-sm">{status.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label>Tags</Label>
                  {tagsLoading ? (
                    <div className="text-sm text-muted-foreground">Carregando tags...</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => {
                        const isSelected = selectedTags.includes(tag.id)
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleTag(tag.id)}
                            className="rounded-sm px-3 py-1.5 text-xs font-medium transition-all"
                            style={{
                              backgroundColor: isSelected ? tag.color : `${tag.color}20`,
                              color: isSelected ? "#fff" : tag.color,
                              border: `1px solid ${tag.color}`,
                            }}
                          >
                            {tag.name}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Contador */}
                <p className="text-sm text-muted-foreground">
                  <strong>{filteredContacts.length}</strong> de{" "}
                  <strong>{total}</strong> contatos selecionados
                  {isLoading && " (Carregando...)"}
                </p>
              </CardContent>
            </Card>

            {/* Card 2: Selecionar Campos */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Selecionar Campos</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAllFields}>
                    Todos
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearFields}>
                    Limpar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {EXPORTABLE_FIELDS.map((field) => (
                    <label
                      key={field.key}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedFields.includes(field.key)}
                        onCheckedChange={() => toggleField(field.key)}
                      />
                      <span className="text-sm">{field.label}</span>
                    </label>
                  ))}
                </div>

                {/* Contador */}
                <p className="text-sm text-muted-foreground">
                  <strong>{selectedFields.length}</strong> campos selecionados
                </p>
              </CardContent>
            </Card>

            {/* Card 3: Formato */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Formato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Seleção de formato */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormat("csv")}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border p-4 transition-all",
                      format === "csv"
                        ? "border-[#46347F] bg-[#46347F]/5"
                        : "border-border hover:border-[#46347F]/50"
                    )}
                  >
                    <FileText
                      className={cn(
                        "h-8 w-8",
                        format === "csv" ? "text-[#46347F]" : "text-muted-foreground"
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm font-medium",
                        format === "csv" ? "text-[#46347F]" : "text-foreground"
                      )}
                    >
                      CSV
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat("xlsx")}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border p-4 transition-all",
                      format === "xlsx"
                        ? "border-[#46347F] bg-[#46347F]/5"
                        : "border-border hover:border-[#46347F]/50"
                    )}
                  >
                    <FileSpreadsheet
                      className={cn(
                        "h-8 w-8",
                        format === "xlsx" ? "text-[#46347F]" : "text-muted-foreground"
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm font-medium",
                        format === "xlsx" ? "text-[#46347F]" : "text-foreground"
                      )}
                    >
                      Excel XLSX
                    </span>
                  </button>
                </div>

                {/* Separador (somente CSV) */}
                {format === "csv" && (
                  <div className="space-y-2">
                    <Label htmlFor="separator">Separador</Label>
                    <Select value={separator} onValueChange={(v) => setSeparator(v as "," | ";")}>
                      <SelectTrigger id="separator">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=",">Vírgula (,)</SelectItem>
                        <SelectItem value=";">Ponto e vírgula (;)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Incluir cabeçalho */}
                <div className="flex items-center gap-3">
                  <Switch
                    id="include-header"
                    checked={includeHeader}
                    onCheckedChange={setIncludeHeader}
                  />
                  <Label htmlFor="include-header">Incluir cabeçalho</Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita - Resumo */}
          <div className="space-y-6">
            <Card className="lg:sticky lg:top-4">
              <CardHeader>
                <CardTitle className="text-base">Resumo da Exportação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Contatos</span>
                    <span className="font-medium">{filteredContacts.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Campos</span>
                    <span className="font-medium">{selectedFields.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Formato</span>
                    <span className="font-medium uppercase">{format}</span>
                  </div>
                  {format === "csv" && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Separador</span>
                      <span className="font-medium">
                        {separator === "," ? "Vírgula" : "Ponto e vírgula"}
                      </span>
                    </div>
                  )}
                </div>

                <Separator />

                <Button
                  onClick={handleExport}
                  disabled={filteredContacts.length === 0 || selectedFields.length === 0}
                  className="w-full bg-[#46347F] hover:bg-[#46347F] text-white"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Exportação gratuita · Sem limites
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Histórico */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <History className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Histórico de Exportações</h2>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Contatos</TableHead>
                    <TableHead>Campos</TableHead>
                    <TableHead>Formato</TableHead>
                    <TableHead>Filtros</TableHead>
                    <TableHead className="w-[100px]">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhuma exportação realizada
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{formatDate(item.data)}</TableCell>
                        <TableCell>{item.contatos}</TableCell>
                        <TableCell>{item.campos}</TableCell>
                        <TableCell className="uppercase">{item.formato}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={item.filtros}>
                          {item.filtros}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Baixar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
