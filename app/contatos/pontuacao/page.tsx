"use client"

import { useState, useMemo } from "react"
import { Plus, RefreshCw, MoreVertical, Pencil, Trash2, Flame, Thermometer, Snowflake, BarChart3 } from "lucide-react"
import { toast } from "sonner"

import { Sidebar } from "@/components/sidebar"
import { ContactsSubSidebar } from "@/components/contacts/contacts-sub-sidebar"
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
  MOCK_SCORING_RULES,
  DEFAULT_THRESHOLDS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type ScoringRule,
  type ScoringCategory,
  type ScoringThresholds,
} from "@/lib/mock/scoring-rules"
import { MOCK_CONTACTS } from "@/lib/mock/contacts"

const CATEGORIES: ScoringCategory[] = ["perfil", "engajamento", "conversao"]

function generateId(): string {
  return `rule-${Date.now()}`
}

export default function PontuacaoPage() {
  const [rules, setRules] = useState<ScoringRule[]>(MOCK_SCORING_RULES)
  const [thresholds, setThresholds] = useState<ScoringThresholds>(DEFAULT_THRESHOLDS)
  const [activeTab, setActiveTab] = useState<"todos" | ScoringCategory>("todos")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<ScoringRule | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [ruleToDelete, setRuleToDelete] = useState<ScoringRule | null>(null)
  const [formData, setFormData] = useState({
    categoria: "perfil" as ScoringCategory,
    evento: "",
    pontos: 0,
    ativo: true,
    descricao: "",
  })

  const stats = useMemo(() => {
    const hot = MOCK_CONTACTS.filter((c) => c.leadScore >= thresholds.hot).length
    const warm = MOCK_CONTACTS.filter(
      (c) => c.leadScore >= thresholds.warm && c.leadScore < thresholds.hot
    ).length
    const cold = MOCK_CONTACTS.filter((c) => c.leadScore < thresholds.warm).length
    const avg = Math.round(
      MOCK_CONTACTS.reduce((sum, c) => sum + c.leadScore, 0) / MOCK_CONTACTS.length
    )
    return { hot, warm, cold, avg, total: MOCK_CONTACTS.length }
  }, [thresholds])

  const filteredRules = useMemo(() => {
    if (activeTab === "todos") return rules
    return rules.filter((r) => r.categoria === activeTab)
  }, [rules, activeTab])

  const handleCreateClick = () => {
    setEditingRule(null)
    setFormData({
      categoria: "perfil",
      evento: "",
      pontos: 0,
      ativo: true,
      descricao: "",
    })
    setIsDialogOpen(true)
  }

  const handleEditClick = (rule: ScoringRule) => {
    setEditingRule(rule)
    setFormData({
      categoria: rule.categoria,
      evento: rule.evento,
      pontos: rule.pontos,
      ativo: rule.ativo,
      descricao: rule.descricao || "",
    })
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (rule: ScoringRule) => {
    setRuleToDelete(rule)
    setIsDeleteDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.evento.trim()) return

    if (editingRule) {
      setRules((prev) =>
        prev.map((r) =>
          r.id === editingRule.id
            ? { ...r, ...formData }
            : r
        )
      )
    } else {
      const newRule: ScoringRule = {
        id: generateId(),
        ...formData,
      }
      setRules((prev) => [...prev, newRule])
    }
    setIsDialogOpen(false)
  }

  const handleConfirmDelete = () => {
    if (ruleToDelete) {
      setRules((prev) => prev.filter((r) => r.id !== ruleToDelete.id))
      setIsDeleteDialogOpen(false)
      setRuleToDelete(null)
    }
  }

  const handleToggleActive = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, ativo: !r.ativo } : r))
    )
  }

  const handleRecalculate = () => {
    toast.success(`Scores recalculados para ${MOCK_CONTACTS.length} contatos`)
  }

  const handleSaveThresholds = () => {
    toast.success("Configuração de faixas salva com sucesso")
  }

  const barPercentages = useMemo(() => {
    if (stats.total === 0) return { hot: 0, warm: 0, cold: 0 }
    return {
      hot: (stats.hot / stats.total) * 100,
      warm: (stats.warm / stats.total) * 100,
      cold: (stats.cold / stats.total) * 100,
    }
  }, [stats])

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
              Pontuação de Leads
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Configure as regras que definem automaticamente o score dos seus contatos
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRecalculate}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Recalcular Scores
            </Button>
            <Button
              onClick={handleCreateClick}
              className="bg-[#9795e4] hover:bg-[#7c7ab8] text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar Regra
            </Button>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* KPI Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-red-50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <Flame className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-red-600">Leads Quentes</p>
                <p className="text-2xl font-bold text-red-700">{stats.hot}</p>
                <p className="text-xs text-red-500">&gt;= {thresholds.hot} pts</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-amber-50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <Thermometer className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-amber-600">Leads Mornos</p>
                <p className="text-2xl font-bold text-amber-700">{stats.warm}</p>
                <p className="text-xs text-amber-500">
                  {thresholds.warm} - {thresholds.hot - 1} pts
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Snowflake className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-blue-600">Leads Frios</p>
                <p className="text-2xl font-bold text-blue-700">{stats.cold}</p>
                <p className="text-xs text-blue-500">&lt; {thresholds.warm} pts</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#9795e4]/10">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#9795e4]/20">
                <BarChart3 className="h-6 w-6 text-[#9795e4]" />
              </div>
              <div>
                <p className="text-sm text-[#9795e4]">Score Médio</p>
                <p className="text-2xl font-bold text-[#7c7ab8]">{stats.avg}</p>
                <p className="text-xs text-[#9795e4]">pts</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barra de qualificação visual */}
        <Card className="mb-6">
          <CardHeader>
            <h3 className="font-semibold">Faixas de Qualificação</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex h-6 w-full overflow-hidden rounded-full">
              <div
                className="bg-red-500"
                style={{ width: `${barPercentages.hot}%` }}
              />
              <div
                className="bg-amber-500"
                style={{ width: `${barPercentages.warm}%` }}
              />
              <div
                className="bg-blue-500"
                style={{ width: `${barPercentages.cold}%` }}
              />
            </div>
            <div className="flex justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span>Quente (&gt;= {thresholds.hot} pts)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-amber-500" />
                <span>Morno ({thresholds.warm}-{thresholds.hot - 1} pts)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span>Frio (&lt; {thresholds.warm} pts)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuração de Thresholds */}
        <Card className="mb-6">
          <CardHeader>
            <h3 className="font-semibold">Configuração de Faixas</h3>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="hot-threshold">
                    Lead Quente a partir de:
                  </Label>
                  <span className="font-medium">{thresholds.hot} pts</span>
                </div>
                <input
                  id="hot-threshold"
                  type="range"
                  min={50}
                  max={100}
                  step={5}
                  value={thresholds.hot}
                  onChange={(e) =>
                    setThresholds((prev) => ({
                      ...prev,
                      hot: parseInt(e.target.value),
                    }))
                  }
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-[#9795e4]"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="warm-threshold">
                    Lead Morno a partir de:
                  </Label>
                  <span className="font-medium">{thresholds.warm} pts</span>
                </div>
                <input
                  id="warm-threshold"
                  type="range"
                  min={10}
                  max={49}
                  step={5}
                  value={thresholds.warm}
                  onChange={(e) =>
                    setThresholds((prev) => ({
                      ...prev,
                      warm: parseInt(e.target.value),
                    }))
                  }
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-[#9795e4]"
                />
              </div>
            </div>
            <Button
              onClick={handleSaveThresholds}
              className="bg-[#9795e4] hover:bg-[#7c7ab8] text-white"
            >
              Salvar Configuração
            </Button>
          </CardContent>
        </Card>

        {/* Tabs e Tabela */}
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <Button
              variant={activeTab === "todos" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("todos")}
              className={cn(
                activeTab === "todos" &&
                  "bg-[#9795e4] hover:bg-[#7c7ab8] text-white"
              )}
            >
              Todas
            </Button>
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                variant={activeTab === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab(cat)}
                className={cn(
                  activeTab === cat &&
                    "bg-[#9795e4] hover:bg-[#7c7ab8] text-white"
                )}
              >
                {CATEGORY_LABELS[cat]}
              </Button>
            ))}
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Pontos</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead className="w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{rule.evento}</p>
                          {rule.descricao && (
                            <p className="text-xs text-muted-foreground">
                              {rule.descricao}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className="inline-flex items-center rounded-sm px-2 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: `${CATEGORY_COLORS[rule.categoria]}20`,
                            color: CATEGORY_COLORS[rule.categoria],
                          }}
                        >
                          {CATEGORY_LABELS[rule.categoria]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "font-medium",
                            rule.pontos >= 0 ? "text-emerald-600" : "text-red-600"
                          )}
                        >
                          {rule.pontos >= 0 ? "+" : ""}
                          {rule.pontos}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={rule.ativo}
                          onCheckedChange={() => handleToggleActive(rule.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditClick(rule)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(rule)}
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
            </CardContent>
          </Card>
        </div>

        {/* Dialog criar/editar */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? "Editar Regra" : "Criar Regra"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoria: value as ScoringCategory })
                  }
                >
                  <SelectTrigger id="categoria">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="evento">
                  Evento <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="evento"
                  placeholder="Ex: Abriu e-mail"
                  value={formData.evento}
                  onChange={(e) =>
                    setFormData({ ...formData, evento: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pontos">
                  Pontos (pode ser negativo)
                </Label>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded border text-lg font-bold",
                      formData.pontos >= 0
                        ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                        : "border-red-200 bg-red-50 text-red-600"
                    )}
                  >
                    {formData.pontos >= 0 ? "+" : "-"}
                  </div>
                  <Input
                    id="pontos"
                    type="number"
                    value={Math.abs(formData.pontos)}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0
                      setFormData({ ...formData, pontos: val })
                    }}
                    className="flex-1"
                  />
                  <Switch
                    checked={formData.pontos < 0}
                    onCheckedChange={(checked) => {
                      setFormData({
                        ...formData,
                        pontos: checked ? -Math.abs(formData.pontos) : Math.abs(formData.pontos),
                      })
                    }}
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    Negativo
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, ativo: checked })
                  }
                />
                <Label htmlFor="ativo">Regra ativa</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  placeholder="Descrição da regra"
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="bg-[#9795e4] hover:bg-[#7c7ab8] text-white"
                disabled={!formData.evento.trim()}
              >
                {editingRule ? "Salvar" : "Criar Regra"}
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
              Tem certeza que deseja excluir a regra &quot;
              <strong>{ruleToDelete?.evento}</strong>&quot;? Esta ação não pode
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
