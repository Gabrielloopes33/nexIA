"use client"

import React, { useState, useCallback, useEffect } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  GripVertical,
  Trash2,
  Plus,
  AlertCircle,
  RotateCcw,
  Save,
  X,
  CheckCircle2,
  Kanban,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

// ============================================================================
// Types
// ============================================================================

export interface PipelineStage {
  id: string
  name: string
  color: string
  probability: number
  isClosed: boolean
  order: number
  dealsCount?: number
}

interface PipelineStageManagerProps {
  organizationId: string
  initialStages?: PipelineStage[]
  templateId?: string
  onSave: () => void
  onCancel: () => void
}

interface StageValidationError {
  id: string
  field: "name" | "probability"
  message: string
}

// ============================================================================
// Constants
// ============================================================================

const MIN_STAGES = 5
const MAX_STAGES = 10

const DEFAULT_COLORS = [
  "#46347F", // Primary
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#F97316", // Orange
]

const DEFAULT_TEMPLATE: Omit<PipelineStage, "id" | "order">[] = [
  { name: "Novos Leads", color: "#3B82F6", probability: 10, isClosed: false },
  { name: "Qualificação", color: "#8B5CF6", probability: 25, isClosed: false },
  { name: "Proposta", color: "#F59E0B", probability: 50, isClosed: false },
  { name: "Negociação", color: "#EC4899", probability: 75, isClosed: false },
  { name: "Fechamento", color: "#10B981", probability: 100, isClosed: true },
]

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function createDefaultStage(order: number): PipelineStage {
  return {
    id: generateId(),
    name: "",
    color: DEFAULT_COLORS[order % DEFAULT_COLORS.length],
    probability: order === 0 ? 10 : Math.min(order * 20, 100),
    isClosed: false,
    order,
    dealsCount: 0,
  }
}

// ============================================================================
// Sortable Stage Item Component
// ============================================================================

interface SortableStageItemProps {
  stage: PipelineStage
  index: number
  errors: StageValidationError[]
  onUpdate: (id: string, updates: Partial<PipelineStage>) => void
  onDelete: (id: string) => void
}

function SortableStageItem({
  stage,
  index,
  errors,
  onUpdate,
  onDelete,
}: SortableStageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id, disabled: false })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  }

  const nameError = errors.find((e) => e.id === stage.id && e.field === "name")
  const probabilityError = errors.find(
    (e) => e.id === stage.id && e.field === "probability"
  )

  const canDelete = (stage.dealsCount ?? 0) === 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-start gap-3 rounded-lg border bg-card p-4 transition-shadow",
        isDragging && "shadow-lg ring-2 ring-primary/20",
        nameError && "border-destructive/50 ring-1 ring-destructive/20"
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="mt-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Order Badge */}
      <div className="mt-1.5">
        <Badge variant="secondary" className="min-w-[2rem] justify-center">
          {index + 1}°
        </Badge>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-3">
        {/* Name Input */}
        <div className="space-y-1.5">
          <Label htmlFor={`name-${stage.id}`} className="text-xs font-medium">
            Nome da Etapa
          </Label>
          <Input
            id={`name-${stage.id}`}
            value={stage.name}
            onChange={(e) => onUpdate(stage.id, { name: e.target.value })}
            placeholder="Ex: Qualificação"
            className={cn(
              "h-9",
              nameError && "border-destructive focus-visible:ring-destructive"
            )}
          />
          {nameError && (
            <p className="text-xs text-destructive">{nameError.message}</p>
          )}
        </div>

        {/* Color, Probability and IsClosed Row */}
        <div className="flex flex-wrap items-start gap-3">
          {/* Color Picker */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Cor</Label>
            <div className="flex items-center gap-1.5">
              {DEFAULT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onUpdate(stage.id, { color })}
                  className={cn(
                    "h-6 w-6 rounded-full transition-all",
                    stage.color === color
                      ? "ring-2 ring-offset-1 ring-primary scale-110"
                      : "hover:scale-105"
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={`Selecionar cor ${color}`}
                />
              ))}
            </div>
          </div>

          {/* Probability Input */}
          <div className="space-y-1.5 min-w-[100px]">
            <Label
              htmlFor={`probability-${stage.id}`}
              className="text-xs font-medium"
            >
              Probabilidade (%)
            </Label>
            <Input
              id={`probability-${stage.id}`}
              type="number"
              min={0}
              max={100}
              value={stage.probability}
              onChange={(e) =>
                onUpdate(stage.id, {
                  probability: Math.max(0, Math.min(100, Number(e.target.value))),
                })
              }
              className={cn(
                "h-9",
                probabilityError &&
                  "border-destructive focus-visible:ring-destructive"
              )}
            />
            {probabilityError && (
              <p className="text-xs text-destructive">
                {probabilityError.message}
              </p>
            )}
          </div>

          {/* IsClosed Toggle */}
          <div className="space-y-1.5 pt-5">
            <div className="flex items-center gap-2">
              <Switch
                id={`isClosed-${stage.id}`}
                checked={stage.isClosed}
                onCheckedChange={(checked) =>
                  onUpdate(stage.id, { isClosed: checked })
                }
              />
              <Label
                htmlFor={`isClosed-${stage.id}`}
                className="text-xs font-normal cursor-pointer"
              >
                É etapa de fechamento
              </Label>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(stage.id)}
              disabled={!canDelete}
              className="mt-1 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          {!canDelete && (
            <TooltipContent>
              <p>Não é possível excluir etapas com deals associados</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

// ============================================================================
// Mini Kanban Preview Component
// ============================================================================

function PipelinePreview({ stages }: { stages: PipelineStage[] }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Kanban className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium text-muted-foreground">
          Preview do Pipeline
        </h4>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {stages.map((stage, index) => (
          <div
            key={stage.id}
            className="flex-shrink-0 w-32 rounded-md border bg-card p-2.5"
          >
            <div
              className="h-1.5 w-full rounded-full mb-2"
              style={{ backgroundColor: stage.color }}
            />
            <p className="text-xs font-medium truncate">
              {stage.name || `Etapa ${index + 1}`}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {stage.probability}%
            </p>
            {stage.isClosed && (
              <Badge variant="outline" className="mt-1.5 text-[9px] h-4 px-1">
                <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                Fechamento
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function PipelineStageManager({
  organizationId,
  initialStages,
  templateId,
  onSave,
  onCancel,
}: PipelineStageManagerProps) {
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [errors, setErrors] = useState<StageValidationError[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Initialize stages
  useEffect(() => {
    if (initialStages && initialStages.length > 0) {
      setStages(initialStages.sort((a, b) => a.order - b.order))
    } else if (templateId) {
      // Load from template - for now use default
      loadStagesFromTemplate(templateId)
    } else {
      // Start with minimum default stages
      const defaultStages = Array.from({ length: MIN_STAGES }, (_, i) =>
        createDefaultStage(i)
      )
      setStages(defaultStages)
    }
  }, [initialStages, templateId])

  // Load stages from API
  const loadStagesFromAPI = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/pipeline/stages?organizationId=${organizationId}`)
      if (!response.ok) throw new Error("Failed to load stages")
      const data = await response.json()
      setStages(data.sort((a: PipelineStage, b: PipelineStage) => a.order - b.order))
    } catch (error) {
      console.error("Error loading stages:", error)
      setSaveError("Erro ao carregar etapas. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }, [organizationId])

  // Load from template
  const loadStagesFromTemplate = async (templateId: string) => {
    setIsLoading(true)
    try {
      // Here you would fetch the template from API
      // For now, use default template
      const templateStages = DEFAULT_TEMPLATE.map((stage, index) => ({
        ...stage,
        id: generateId(),
        order: index,
        dealsCount: 0,
      }))
      setStages(templateStages)
    } catch (error) {
      console.error("Error loading template:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setStages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        // Update order property
        return newItems.map((item, index) => ({ ...item, order: index }))
      })
    }
  }, [])

  // Update stage
  const handleUpdateStage = useCallback(
    (id: string, updates: Partial<PipelineStage>) => {
      setStages((prev) =>
        prev.map((stage) =>
          stage.id === id ? { ...stage, ...updates } : stage
        )
      )
      // Clear errors for updated field
      setErrors((prev) =>
        prev.filter(
          (e) =>
            !(e.id === id && Object.keys(updates).includes(e.field))
        )
      )
    },
    []
  )

  // Delete stage
  const handleDeleteStage = useCallback((id: string) => {
    setStages((prev) => {
      const filtered = prev.filter((stage) => stage.id !== id)
      // Reorder remaining stages
      return filtered.map((stage, index) => ({ ...stage, order: index }))
    })
  }, [])

  // Add new stage
  const handleAddStage = useCallback(() => {
    if (stages.length >= MAX_STAGES) return
    setStages((prev) => [...prev, createDefaultStage(prev.length)])
  }, [stages.length])

  // Reset to default template
  const handleResetToDefault = useCallback(() => {
    const templateStages = DEFAULT_TEMPLATE.map((stage, index) => ({
      ...stage,
      id: generateId(),
      order: index,
      dealsCount: 0,
    }))
    setStages(templateStages)
    setErrors([])
    setSaveError(null)
  }, [])

  // Validate stages
  const validateStages = useCallback((): boolean => {
    const newErrors: StageValidationError[] = []

    if (stages.length < MIN_STAGES) {
      setSaveError(`É necessário ter pelo menos ${MIN_STAGES} etapas`)
      return false
    }

    if (stages.length > MAX_STAGES) {
      setSaveError(`O máximo de etapas permitido é ${MAX_STAGES}`)
      return false
    }

    stages.forEach((stage) => {
      if (!stage.name.trim()) {
        newErrors.push({
          id: stage.id,
          field: "name",
          message: "O nome da etapa é obrigatório",
        })
      }

      if (stage.probability < 0 || stage.probability > 100) {
        newErrors.push({
          id: stage.id,
          field: "probability",
          message: "A probabilidade deve estar entre 0 e 100%",
        })
      }
    })

    setErrors(newErrors)
    return newErrors.length === 0
  }, [stages])

  // Save stages
  const handleSave = useCallback(async () => {
    setSaveError(null)

    if (!validateStages()) {
      return
    }

    setIsSaving(true)
    try {
      // Check if we have existing persisted stages
      const hasPersistedStages = stages.some((s) => !s.id.startsWith("temp-"))

      if (hasPersistedStages) {
        // Reorder existing stages
        const reorderResponse = await fetch("/api/pipeline/stages/reorder", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId,
            stages: stages.map((s) => ({ id: s.id, order: s.order })),
          }),
        })

        if (!reorderResponse.ok) throw new Error("Failed to reorder stages")

        // Update individual stages
        for (const stage of stages) {
          if (!stage.id.startsWith("temp-")) {
            await fetch(`/api/pipeline/stages/${stage.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: stage.name,
                color: stage.color,
                probability: stage.probability,
                isClosed: stage.isClosed,
              }),
            })
          }
        }
      } else {
        // Create all stages in batch
        const createResponse = await fetch("/api/pipeline/stages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId,
            stages: stages.map((s) => ({
              name: s.name,
              color: s.color,
              probability: s.probability,
              isClosed: s.isClosed,
              order: s.order,
            })),
          }),
        })

        if (!createResponse.ok) throw new Error("Failed to create stages")
      }

      onSave()
    } catch (error) {
      console.error("Error saving stages:", error)
      setSaveError("Erro ao salvar etapas. Tente novamente.")
    } finally {
      setIsSaving(false)
    }
  }, [stages, organizationId, validateStages, onSave])

  // Stage count indicator color
  const getStageCountColor = () => {
    if (stages.length < MIN_STAGES) return "text-destructive"
    if (stages.length >= MAX_STAGES) return "text-amber-500"
    return "text-muted-foreground"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Gerenciar Etapas do Pipeline</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure as etapas do seu funil de vendas. Arraste para reordenar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-medium", getStageCountColor())}>
            {stages.length}/{MAX_STAGES} etapas
          </span>
        </div>
      </div>

      {/* Validation Alert */}
      {stages.length < MIN_STAGES && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você precisa ter pelo menos {MIN_STAGES} etapas no pipeline.
            Adicione mais {MIN_STAGES - stages.length} etapa
            {MIN_STAGES - stages.length > 1 ? "s" : ""}.
          </AlertDescription>
        </Alert>
      )}

      {/* Save Error */}
      {saveError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      {/* Pipeline Preview */}
      <PipelinePreview stages={stages} />

      {/* Stages List with Drag and Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={stages.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {stages.map((stage, index) => (
              <SortableStageItem
                key={stage.id}
                stage={stage}
                index={index}
                errors={errors}
                onUpdate={handleUpdateStage}
                onDelete={handleDeleteStage}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add Stage Button */}
      <Button
        variant="outline"
        onClick={handleAddStage}
        disabled={stages.length >= MAX_STAGES}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Etapa
        {stages.length >= MAX_STAGES && (
          <span className="ml-2 text-xs text-muted-foreground">
            (Limite atingido)
          </span>
        )}
      </Button>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
        <Button
          variant="ghost"
          onClick={handleResetToDefault}
          disabled={isSaving}
          className="text-muted-foreground"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Resetar Padrão
        </Button>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || stages.length < MIN_STAGES}
            style={{ backgroundColor: "#46347F" }}
            className="hover:opacity-90"
          >
            {isSaving ? (
              <>
                <Spinner className="h-4 w-4 mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PipelineStageManager
