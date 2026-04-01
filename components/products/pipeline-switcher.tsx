"use client"

import { ChevronDown, GitBranch } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useProductSelection } from "@/hooks/use-product-selection"

export function PipelineSwitcher({ className }: { className?: string }) {
  const { pipelineId, pipelines, isLoadingPipelines, switchPipeline } = useProductSelection()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedPipeline = pipelines.find((p) => p.id === pipelineId)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (isLoadingPipelines || pipelines.length <= 1) {
    return null
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground shadow-sm hover:bg-muted/50 transition-colors"
      >
        <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="max-w-[140px] truncate">{selectedPipeline?.name || "Selecionar pipeline"}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-56 rounded-lg border border-border bg-white py-1 shadow-lg">
          <div className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">Pipelines</div>
          <div className="max-h-64 overflow-y-auto">
            {pipelines.map((pipeline) => (
              <button
                key={pipeline.id}
                onClick={() => {
                  switchPipeline(pipeline.id)
                  setOpen(false)
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                  pipeline.id === pipelineId && "bg-[#46347F]/5 font-medium text-[#46347F]"
                )}
              >
                <span className="flex-1 truncate">{pipeline.name}</span>
                {pipeline.isDefault && (
                  <span className="text-[10px] text-muted-foreground">padrão</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
