import { Loader2 } from "lucide-react"

export function PipelineLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Carregando pipeline...</span>
      </div>
    </div>
  )
}
